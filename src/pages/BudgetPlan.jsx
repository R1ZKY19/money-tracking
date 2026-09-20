import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertTriangle, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Target, Wallet, Pencil } from 'lucide-react';
import { BudgetPlan as BudgetPlanEntity, Category, SavingTarget, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useUserRole } from '@/lib/UserRoleContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import SectionCard from '@/components/ui/SectionCard';
import KpiCard from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency, formatCompact, filterTransactionsByPeriod, CHART_COLORS } from '@/lib/utils/finance';
import { CatBudget } from '@/components/ui/CatIllustration';
import { logUpdate } from '@/lib/activityLogger';
import { usePageLang } from '@/lib/pageTranslations';
import { toast } from 'sonner';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const DEFAULT_BUDGET = {
  income: [{ name: 'Gaji', budget: 0 }],
  saving: [{ name: 'Dana Darurat', budget: 0 }],
  expense: [{ name: 'Makan & Minum', budget: 0 }],
};

const GROUP_CONFIG = {
  income: { color: '#10B981', light: '#D1FAE5', icon: TrendingUp },
  saving: { color: '#6366F1', light: '#E0E7FF', icon: Target },
  expense: { color: '#EF4444', light: '#FEE2E2', icon: TrendingDown },
};

function getBudgetStatus(pct, isExpense, T) {
  if (!isExpense) {
    if (pct >= 100) return { labelKey: 'statusAchieved', icon: CheckCircle, cls: 'text-emerald-600', barColor: '#10B981' };
    if (pct >= 80) return { labelKey: 'statusAlmostAchieved', icon: TrendingUp, cls: 'text-blue-500', barColor: '#3B82F6' };
    return { labelKey: 'statusRunning', icon: TrendingUp, cls: 'text-muted-foreground', barColor: '#6366F1' };
  }
  if (pct >= 100) return { labelKey: 'statusExceeded', icon: AlertCircle, cls: 'text-red-600', barColor: '#EF4444', alert: true };
  if (pct >= 90) return { labelKey: 'statusCritical', icon: AlertTriangle, cls: 'text-orange-500', barColor: '#F97316', alert: true };
  if (pct >= 80) return { labelKey: 'statusWarning', icon: AlertTriangle, cls: 'text-yellow-600', barColor: '#EAB308', alert: true };
  return { labelKey: 'statusSafe', icon: CheckCircle, cls: 'text-emerald-600', barColor: '#10B981' };
}

export default function BudgetPlan() {
  const T = usePageLang('budget');
  const navigate = useNavigate();
   const { user } = useAuth();
   const { role } = useUserRole();
   const isStaf = role === 'staf';
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(currentMonth));
  const [showEdit, setShowEdit] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', budget: '' });
  const [confirmSave, setConfirmSave] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const qc = useQueryClient();

  const { data: { transactions = [], categories = [], savingTargets = [], budgetPlans = [] } = {}, isLoading } = useQuery({
    queryKey: ['budget-data', user?.id],
    queryFn: async () => {
      const uid = user?.id;
      if (!uid) return { transactions: [], categories: [], savingTargets: [], budgetPlans: [] };
      const [txns, cats, targets, plans] = await Promise.all([
        Transaction.list(),
        Category.list(),
        SavingTarget.list(),
        BudgetPlanEntity.list(),
      ]);
      return { transactions: txns, categories: cats, savingTargets: targets, budgetPlans: plans };
    },
    enabled: !!user?.id,
    staleTime: 1000,
  });

  // Helper: cari BudgetPlan record dari DB
  const findPlan = (y, m) => budgetPlans.find(p => p.year === parseInt(y) && p.month === parseInt(m)) || null;

  const [budgetData, setBudgetDataState] = useState(structuredClone(DEFAULT_BUDGET));
  const [currentPlanId, setCurrentPlanId] = useState(null);

  const generateDefaultBudget = () => {
    const grouped = { income: [], saving: [], expense: [] };
    const active = categories.filter(c => c.is_active !== false);
    if (!active.length) return structuredClone(DEFAULT_BUDGET);
    active.forEach(c => {
      if (c.type === 'income') grouped.income.push({ name: c.name, budget: 0 });
      else if (c.type === 'saving') grouped.saving.push({ name: c.name, budget: 0 });
      else if (c.type === 'expense') grouped.expense.push({ name: c.name, budget: 0 });
    });
    return grouped;
  };

  // Fingerprints to prevent useEffect from firing on every React Query refetch
  const categoryFingerprint = useMemo(
    () => categories.filter(c => c.is_active !== false).map(c => `${c.name}:${c.type}`).sort().join(','),
    [categories]
  );
  const savingFingerprint = useMemo(
    () => savingTargets.map(t => `${t.name}:${t.target_amount}`).sort().join(','),
    [savingTargets]
  );

  useEffect(() => {
    if (!categories.length && !budgetPlans.length) return;
    const plan = findPlan(year, month);

    if (plan) {
      // Sudah ada di DB — pakai data dari DB, hanya tambah kategori baru yang belum ada
      const fresh = generateDefaultBudget();
      const savedIncomeNames = new Set((plan.income || []).map(i => i.name));
      const savedExpenseNames = new Set((plan.expense || []).map(e => e.name));
      const savedSavingNames  = new Set((plan.saving  || []).map(s => s.name));
      const newIncome  = [...(plan.income  || []), ...fresh.income.filter(i => !savedIncomeNames.has(i.name))];
      const newExpense = [...(plan.expense || []), ...fresh.expense.filter(e => !savedExpenseNames.has(e.name))];
      const newSaving  = [...(plan.saving  || []), ...fresh.saving.filter(s => !savedSavingNames.has(s.name))];
      setBudgetDataState({ income: newIncome, saving: newSaving, expense: newExpense });
      setCurrentPlanId(plan.id);
    } else {
      // Belum ada di DB — generate dari kategori
      const fresh = generateDefaultBudget();
      fresh.saving = fresh.saving.map(item => {
        const matchTarget = savingTargets.find(t => t.name === item.name);
        return { name: item.name, budget: matchTarget ? (matchTarget.target_amount || 0) : 0 };
      });
      setBudgetDataState(fresh);
      setCurrentPlanId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFingerprint, savingFingerprint, year, month, budgetPlans.length]);

  const switchPeriod = (y, m) => {
    setYear(y); setMonth(m);
    const plan = budgetPlans.find(p => p.year === parseInt(y) && p.month === parseInt(m));
    if (plan) {
      setBudgetDataState({ income: plan.income || [], saving: plan.saving || [], expense: plan.expense || [] });
      setCurrentPlanId(plan.id);
    } else {
      setBudgetDataState(generateDefaultBudget());
      setCurrentPlanId(null);
    }
  };

  const updateBudget = async (newData) => {
    setBudgetDataState(newData);
    try {
      if (currentPlanId) {
        await BudgetPlanEntity.update(currentPlanId, {
          income: newData.income, saving: newData.saving, expense: newData.expense,
        });
      } else {
        const created = await BudgetPlanEntity.create({
          year: parseInt(year), month: parseInt(month),
          income: newData.income, saving: newData.saving, expense: newData.expense,
        });
        setCurrentPlanId(created.id);
      }
      qc.invalidateQueries({ queryKey: ['budget-data'] });
    } catch {
      toast.error('Gagal menyimpan budget ke server');
    }
  };

  const openEdit = (group, idx) => {
    setEditGroup(group);
    setEditIdx(idx);
    setEditForm({ name: budgetData[group][idx].name, budget: String(budgetData[group][idx].budget) });
    setShowEdit(true);
  };

  const doSave = async () => {
    setActionLoading(true);
    const oldBudget = budgetData[editGroup][editIdx].budget;
    const newBudget = parseFloat(editForm.budget) || 0;
    const newData = { ...budgetData };
    newData[editGroup] = [...newData[editGroup]];
    newData[editGroup][editIdx] = { name: editForm.name, budget: newBudget };
    await updateBudget(newData);

    // Jika edit group "saving", sinkron ke SavingTarget yang namanya cocok
    if (editGroup === 'saving') {
      const matchTarget = savingTargets.find(t => t.name === editForm.name);
      if (matchTarget) {
        // Hitung total tabungan aktual dari transaksi untuk target ini
        const actualSaving = periodTxs.filter(t => t.type === 'saving' && t.category_name === editForm.name).reduce((s, t) => s + (t.amount || 0), 0);
        await SavingTarget.update(matchTarget.id, { target_amount: newBudget, current_amount: actualSaving });
        qc.invalidateQueries({ queryKey: ['saving-targets'] });
      }
    }

    logUpdate('budget', `budget "${editForm.name}" dari ${formatCurrency(oldBudget)} menjadi ${formatCurrency(newBudget)}`);
    qc.invalidateQueries({ queryKey: ['budget-data'] });
    setActionLoading(false);
    setConfirmSave(false);
    setShowEdit(false);
    toast.success(`Budget "${editForm.name}" diperbarui${editGroup === 'saving' ? ' & Target Keuangan disinkron' : ''}`);
  };

  const periodTxs = useMemo(() => filterTransactionsByPeriod(transactions, year, month), [transactions, year, month]);

  const getActual = (group, name) => {
    const type = group === 'income' ? ['income', 'receivable_receipt'] : group === 'saving' ? ['saving'] : ['expense'];
    return periodTxs.filter(t => type.includes(t.type) && t.category_name === name).reduce((s, t) => s + (t.amount || 0), 0);
  };

  const totalBudgetIncome = budgetData.income.reduce((s, r) => s + r.budget, 0);
  const totalActualIncome = budgetData.income.reduce((s, r) => s + getActual('income', r.name), 0);
  const totalBudgetSaving = budgetData.saving.reduce((s, r) => s + r.budget, 0);
  const totalActualSaving = budgetData.saving.reduce((s, r) => s + getActual('saving', r.name), 0);
  const totalBudgetExpense = budgetData.expense.reduce((s, r) => s + r.budget, 0);
  const totalActualExpense = budgetData.expense.reduce((s, r) => s + getActual('expense', r.name), 0);
  const sisaUang = totalActualIncome - totalActualExpense - totalActualSaving;

  // Alerts — expense categories
  const expenseAlerts = useMemo(() => {
    return budgetData.expense.filter(r => {
      const actual = getActual('expense', r.name);
      const pct = r.budget > 0 ? (actual / r.budget) * 100 : 0;
      return pct >= 80;
    }).map(r => {
      const actual = getActual('expense', r.name);
      const pct = r.budget > 0 ? (actual / r.budget) * 100 : 0;
      return { name: r.name, pct, actual, budget: r.budget, status: getBudgetStatus(pct, true, T) };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetData, periodTxs, T.statusSafe]);

  const barData = [
    { name: T.groupIncome, budget: totalBudgetIncome, actual: totalActualIncome },
    { name: T.groupSaving, budget: totalBudgetSaving, actual: totalActualSaving },
    { name: T.groupExpense, budget: totalBudgetExpense, actual: totalActualExpense },
  ];

  const expensePie = budgetData.expense.map((r, i) => ({
    name: r.name, value: getActual('expense', r.name), fill: CHART_COLORS[i % CHART_COLORS.length]
  })).filter(r => r.value > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{formatCompact(p.value)}</span></p>
        ))}
      </div>
    );
    return null;
  };

  const editCfg = editGroup ? GROUP_CONFIG[editGroup] : null;

  return (
    <div className="space-y-5 relative">
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex flex-col items-center gap-3 bg-white dark:bg-card p-6 rounded-xl shadow-xl">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm font-medium">{T.updating}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <CatBudget size={70} />
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{T.pageTitle}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{T.pageSubtitle}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={month} onValueChange={v => switchPeriod(year, v)}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS_ID.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={year} onValueChange={v => switchPeriod(v, month)}>
            <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: 20 }, (_, i) => currentYear + 15 - i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget Alerts */}
      {expenseAlerts.length > 0 && (
        <div className="space-y-2">
          {expenseAlerts.map((a, i) => {
            const SI = a.status.icon;
            const bg = a.pct >= 100 ? 'bg-red-50 border-red-300 dark:bg-red-950/30' : a.pct >= 90 ? 'bg-orange-50 border-orange-300 dark:bg-orange-950/30' : 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30';
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg}`}>
                <SI size={16} className={a.status.cls} />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold ${a.status.cls}`}>{a.status.label}: Budget "{a.name}"</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatCurrency(a.actual)} / {formatCurrency(a.budget)} ({a.pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(a.pct, 100)}%`, background: a.status.barColor }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title={T.actualIncome} value={formatCompact(totalActualIncome)} subtitle={`${T.budgetSubtitle}: ${formatCompact(totalBudgetIncome)}`} icon={TrendingUp} color="emerald" />
        <KpiCard title={T.actualExpense} value={formatCompact(totalActualExpense)} subtitle={`${T.budgetSubtitle}: ${formatCompact(totalBudgetExpense)}`} icon={TrendingDown} color="red" />
        <KpiCard title={T.actualSaving} value={formatCompact(totalActualSaving)} subtitle={`${T.budgetSubtitle}: ${formatCompact(totalBudgetSaving)}`} icon={Target} color="indigo" />
        <KpiCard title={T.remainingMoney} value={formatCompact(sisaUang)} subtitle={sisaUang >= 0 ? T.positive : T.deficit} icon={Wallet} color={sisaUang >= 0 ? 'teal' : 'amber'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title={T.budgetVsActual} subtitle={T.planVsRealization}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="budget" name={T.budgetSubtitle} fill="#AFCFBE" radius={[10,10,0,0]} maxBarSize={42} animationDuration={800} />
              <Bar dataKey="actual" name={T.actualSubtitle} fill="#0B5D75" radius={[10,10,0,0]} maxBarSize={42} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title={T.actualExpenseDist} subtitle={T.perCategoryMonth}>
          {expensePie.length > 0 ? (
            <div className="flex gap-3 items-center">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={expensePie} cx="50%" cy="50%" innerRadius={54} outerRadius={82} cornerRadius={8} dataKey="value" paddingAngle={4} animationDuration={800}>
                    {expensePie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCompact(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {expensePie.slice(0, 6).map((e, i) => (
                  <div key={i} className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.fill }} />
                      <span className="text-xs text-muted-foreground truncate">{e.name}</span>
                    </div>
                    <span className="text-xs font-semibold">{formatCompact(e.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">{T.noExpenseMonth}</div>
          )}
        </SectionCard>
      </div>

      {/* Empty state if no categories */}
      {categories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-foreground mb-1">{T.noCategoryTitle}</p>
          <p className="text-xs text-muted-foreground mb-4">{T.noCategoryHint}</p>
          <Button onClick={() => navigate('/pengaturan')} size="sm" className="bg-primary hover:bg-primary/90">
           {T.toSettings}
         </Button>
        </div>
      )}

      {/* Budget Tables per group */}
      {(['income', 'saving', 'expense']).filter(group => !(group === 'saving' && isStaf)).map(group => {
        const cfg = GROUP_CONFIG[group];
        const groupLabel = group === 'income' ? T.groupIncome : group === 'saving' ? T.groupSaving : T.groupExpense;
        const rows = budgetData[group];
        const isExpense = group === 'expense';
        const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
        const totalActual = rows.reduce((s, r) => s + getActual(group, r.name), 0);
        const totalPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
        const totalStatus = getBudgetStatus(totalPct, isExpense, T);
        const TotalSI = totalStatus.icon;
        const isIncome = group === 'income';

        return (
          <SectionCard
            key={group}
            title={<span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
              {groupLabel}
            </span>}
            subtitle={`${T.budgetSubtitle}: ${formatCompact(totalBudget)} · ${T.actualSubtitle}: ${formatCompact(totalActual)}`}
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border" style={{ background: cfg.light + '80' }}>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{T.colCategory}</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">{T.colBudget}</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">{T.colActual}</th>
                    {isIncome && <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#6366F1' }}>{T.colSavingCol}</th>}
                    {isIncome && <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#EF4444' }}>{T.colExpenseCol}</th>}
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">{T.colRemaining}</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground w-48">{T.colProgress}</th>
                    <th className="px-2 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const actual = getActual(group, row.name);
                    const pct = row.budget > 0 ? Math.min(150, (actual / row.budget) * 100) : 0;
                    const sisa = isExpense ? row.budget - actual : actual - row.budget;
                    const status = getBudgetStatus(pct, isExpense, T);
                    const SI = status.icon;
                    return (
                      <tr key={idx} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${status.alert ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                        <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(row.budget)}</td>
                        <td className="px-4 py-3 text-right font-semibold" style={{ color: cfg.color }}>{formatCurrency(actual)}</td>
                        {isIncome && (
                          <td className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#6366F1' }}>
                            {formatCompact(totalActualSaving)}
                          </td>
                        )}
                        {isIncome && (
                          <td className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#EF4444' }}>
                            {formatCompact(totalActualExpense)}
                          </td>
                        )}
                        <td className={`px-4 py-3 text-right text-xs font-semibold ${sisa >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {sisa >= 0 ? '+' : ''}{formatCompact(sisa)}
                        </td>
                        <td className="px-4 py-3 min-w-[180px]">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                                status.alert ? 'bg-red-100 text-red-700' : 
                                status.labelKey === 'statusAchieved' || status.labelKey === 'statusSafe' ? 'bg-emerald-100 text-emerald-700' : 
                                'bg-blue-100 text-blue-700'
                              }`}>
                                <SI size={9} />
                                {T[status.labelKey]}
                              </span>
                              <span className={`text-xs font-bold ${status.cls}`}>{pct.toFixed(0)}%</span>
                            </div>
                            {/* Segmented progress bar */}
                            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                              <div 
                                className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                                style={{ 
                                  width: `${Math.min(pct, 100)}%`, 
                                  background: pct >= 100 ? 'linear-gradient(90deg, #EF4444, #DC2626)' :
                                               pct >= 90 ? 'linear-gradient(90deg, #F97316, #EA580C)' :
                                               pct >= 80 ? 'linear-gradient(90deg, #EAB308, #CA8A04)' :
                                               pct >= 50 ? 'linear-gradient(90deg, #10B981, #059669)' :
                                               'linear-gradient(90deg, #6366F1, #4F46E5)'
                                }}
                              >
                                {/* Shimmer */}
                                <div className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
                              </div>
                              {/* Milestone markers at 50%, 80%, 100% */}
                              {[50, 80].map(m => (
                                <div key={m} className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${m}%` }} />
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(group, idx)}><Pencil size={11} /></Button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted/30 border-t-2 border-border">
                    <td className="px-4 py-2.5 font-bold text-xs text-foreground">{T.totalRow}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-xs">{formatCurrency(totalBudget)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-xs" style={{ color: cfg.color }}>{formatCurrency(totalActual)}</td>
                    {isIncome && (
                      <td className="px-4 py-2.5 text-right font-bold text-xs" style={{ color: '#6366F1' }}>
                        {formatCurrency(totalActualSaving)}
                      </td>
                    )}
                    {isIncome && (
                      <td className="px-4 py-2.5 text-right font-bold text-xs" style={{ color: '#EF4444' }}>
                        {formatCurrency(totalActualExpense)}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-right font-bold text-xs"></td>
                    <td className="px-4 py-2.5 min-w-[180px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                             totalStatus.alert ? 'bg-red-100 text-red-700' :
                             totalStatus.labelKey === 'statusAchieved' || totalStatus.labelKey === 'statusSafe' ? 'bg-emerald-100 text-emerald-700' :
                             'bg-blue-100 text-blue-700'
                           }`}>
                             <TotalSI size={9} />
                             {T[totalStatus.labelKey]}
                          </span>
                          <span className={`text-xs font-bold ${totalStatus.cls}`}>{totalPct.toFixed(0)}%</span>
                        </div>
                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                          <div 
                            className="h-full rounded-full transition-all duration-700"
                            style={{ 
                              width: `${Math.min(totalPct, 100)}%`,
                              background: totalPct >= 100 ? 'linear-gradient(90deg, #EF4444, #DC2626)' :
                                           totalPct >= 90 ? 'linear-gradient(90deg, #F97316, #EA580C)' :
                                           totalPct >= 80 ? 'linear-gradient(90deg, #EAB308, #CA8A04)' :
                                           totalPct >= 50 ? 'linear-gradient(90deg, #10B981, #059669)' :
                                           'linear-gradient(90deg, #6366F1, #4F46E5)'
                            }}
                          />
                          {[50, 80].map(m => (
                            <div key={m} className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${m}%` }} />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Info sync ke Target Keuangan (only for saving group) */}
            {group === 'saving' && (
              <div className="px-4 py-2.5 border-t border-border bg-indigo-50/50 dark:bg-indigo-950/10">
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Target size={11} />
                  {T.syncInfo}
                </p>
              </div>
            )}
          </SectionCard>
        );
      })}

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {editCfg && <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: editCfg.light }}>
                <editCfg.icon size={15} style={{ color: editCfg.color }} />
              </div>}
              <DialogTitle>{T.editBudgetTitle}: {editForm.name}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <Label>{T.targetAmount}</Label>
              <Input
                autoFocus type="number" min="0" max="999999999"
                value={editForm.budget}
                onChange={e => {
                  const val = e.target.value;
                  const num = parseFloat(val);
                  if (val === '' || (num >= 0 && num <= 999999999)) setEditForm({ ...editForm, budget: val });
                }}
                placeholder="0"
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setShowEdit(false)}>{T.cancel}</Button>
              <Button onClick={() => setConfirmSave(true)} style={{ background: editCfg?.color }} className="text-white hover:opacity-90">
                {T.continue}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmSave} onOpenChange={setConfirmSave}
        title={T.confirmSaveTitle}
        description={`Budget "${editForm.name}" akan diubah menjadi ${formatCurrency(parseFloat(editForm.budget) || 0)}.`}
        type="update" onConfirm={doSave} loading={actionLoading}
      />
    </div>
  );
}