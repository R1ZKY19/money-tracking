import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Account, Debt, Receivable, SavingTarget, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, DollarSign, ArrowUpRight, ArrowDownRight,
  PiggyBank, CreditCard, Download, ChevronRight, Sparkles, Activity, Target, Zap, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeadlineAlert from '@/components/ui/DeadlineAlert';
import SectionCard from '@/components/ui/SectionCard';
import GlobalFilter from '@/components/ui/GlobalFilter';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import InsightPanel from '@/components/dashboard/InsightPanel';
import FinancialHealthScore from '@/components/dashboard/FinancialHealthScore';
import QuickStats from '@/components/dashboard/QuickStats';
import {
  formatCurrency, formatCompact, MONTHS_ID,
  filterTransactionsByPeriod, calcKPIs, groupByCategory,
  buildMonthlyTrend, CHART_COLORS
} from '@/lib/utils/finance';
import { useLanguage } from '@/lib/LanguageContext';
import AccountLogo from '@/components/ui/AccountLogo';
import AiFinancialCheck from '@/components/ai/AiFinancialCheck';
import { buildReport } from '@/lib/utils/financialReport';
import { Link } from 'react-router-dom';

const nowWIB = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
const currentYear  = nowWIB.getFullYear();
const currentMonth = nowWIB.getMonth() + 1;

/* ── Premium Chart Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-2xl shadow-xl p-3.5 text-xs min-w-[160px]"
      style={{ boxShadow: 'var(--shadow-xl)' }}>
      <p className="font-heading font-bold text-foreground mb-2 text-[11px] uppercase tracking-wide">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-bold text-foreground">{formatCompact(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Inline KPI Card (no external dep) ── */
function KpiBlock({ title, value, icon: Icon, iconBg, iconColor, trend, trendLabel, accent, footer }) {
  const trendUp = trend > 0;
  const trendDown = trend < 0;
  return (
    <div className={`kpi-card min-w-0 !p-3.5 sm:!p-[1.25rem_1.375rem] ${accent || ''}`}>
    <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em] min-w-0 break-words">{title}</p>
        {Icon && (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconBg || 'hsl(var(--muted))' }}>
            <Icon size={15} style={{ color: iconColor }} />
          </div>
        )}
      </div>
      <p className="text-base sm:text-xl font-heading font-bold text-foreground leading-tight tracking-tight break-words">{value}</p>
      {(trend !== undefined && trend !== null) && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold
            ${trendUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
             : trendDown ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
             : 'bg-muted text-muted-foreground'}`}>
            {trendUp ? <TrendingUp size={9} /> : trendDown ? <TrendingDown size={9} /> : null}
            {trend > 0 ? '+' : ''}{typeof trend === 'number' ? trend.toFixed(1) : trend}%
          </span>
          {trendLabel && <span className="text-[10px] text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
      {footer && <div className="mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">{footer}</div>}
    </div>
  );
}

export default function DashboardBulanan() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const uid = user?.id;
  const [filters, setFilters] = useState({ year: String(currentYear), month: String(currentMonth), currency: '' });
  const dashboardRef = useRef();
  const [exporting, setExporting] = useState(false);
  const [showLiveData, setShowLiveData] = useState(false);

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['transactions', uid],
    queryFn: () => uid ? Transaction.list() : [],
    enabled: !!uid, staleTime: 60000, gcTime: 15 * 60 * 1000
  });
  const { data: accounts = [], isLoading: loadingAcc } = useQuery({
    queryKey: ['accounts', uid],
    queryFn: () => uid ? Account.list() : [],
    enabled: !!uid, staleTime: 60000, gcTime: 15 * 60 * 1000
  });
  const { data: debts = [] } = useQuery({
    queryKey: ['debts', uid],
    queryFn: () => uid ? Debt.list() : [],
    enabled: !!uid, staleTime: 60000, gcTime: 15 * 60 * 1000
  });
  const { data: receivables = [] } = useQuery({
    queryKey: ['receivables', uid],
    queryFn: () => uid ? Receivable.list() : [],
    enabled: !!uid, staleTime: 60000, gcTime: 15 * 60 * 1000
  });
  const { data: savingTargets = [] } = useQuery({
    queryKey: ['savingTargets', uid],
    queryFn: () => uid ? SavingTarget.list() : [],
    enabled: !!uid, staleTime: 60000, gcTime: 15 * 60 * 1000
  });

  const filtered = useMemo(() => {
    let txs = filterTransactionsByPeriod(transactions, filters.year, filters.month);
    if (filters.currency) txs = txs.filter(t => t.currency === filters.currency);
    return txs;
  }, [transactions, filters]);

  const kpis = useMemo(() => calcKPIs(filtered), [filtered]);

  const totalBalance = useMemo(() => {
    const byCurrency = {};
    accounts.forEach(a => {
      const c = a.currency || 'IDR';
      byCurrency[c] = (byCurrency[c] || 0) + (a.current_balance || 0);
    });
    return byCurrency;
  }, [accounts]);

  const trendData = useMemo(() => buildMonthlyTrend(
    filters.currency ? transactions.filter(t => t.currency === filters.currency) : transactions,
    filters.year
  ), [transactions, filters]);

  const expenseByCategory = useMemo(() => groupByCategory(filtered.filter(t => t.type === 'expense')), [filtered]);
  const pieData = expenseByCategory.slice(0, 8).map((c, i) => ({ ...c, fill: CHART_COLORS[i] }));
  const incomeByCategory = useMemo(() => groupByCategory(filtered.filter(t => t.type === 'income')), [filtered]);
  const incomePieData = incomeByCategory.slice(0, 8).map((c, i) => ({ ...c, fill: CHART_COLORS[i] }));

  const accountPieData = useMemo(() => accounts
    .filter(a => !filters.currency || a.currency === filters.currency)
    .filter(a => a.is_active !== false)
    .map((a, i) => ({ name: a.name, value: Math.max(0, a.current_balance || 0), fill: CHART_COLORS[i] })),
  [accounts, filters.currency]);

  const activeDebts       = debts.filter(d => d.status === 'active');
  const activeReceivables = receivables.filter(r => r.status === 'active');
  const totalDebt         = activeDebts.reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const totalReceivable   = activeReceivables.reduce((s, r) => s + (r.remaining_amount || 0), 0);

  const debtByCurrency = useMemo(() => {
    const g = {};
    activeDebts.forEach(d => { const c = d.currency || 'IDR'; g[c] = (g[c] || 0) + (d.remaining_amount || 0); });
    return g;
  }, [activeDebts]);

  const receivableByCurrency = useMemo(() => {
    const g = {};
    activeReceivables.forEach(r => { const c = r.currency || 'IDR'; g[c] = (g[c] || 0) + (r.remaining_amount || 0); });
    return g;
  }, [activeReceivables]);

  const debtRatio  = kpis.income > 0 ? (totalDebt / kpis.income) * 100 : 0;
  const monthLabel = filters.month ? MONTHS_ID[parseInt(filters.month) - 1] : t('semuaBulan');
  const primaryCurrency = filters.currency || 'IDR';

  const debtVsReceivable = useMemo(() => [
    { name: t('hutangAktif'), value: totalDebt, fill: '#EF4444' },
    { name: t('piutangAktif'), value: totalReceivable, fill: '#10B981' },
  ], [t, totalDebt, totalReceivable]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;
      const canvas = await html2canvas(dashboardRef.current, { scale: 1.5, logging: false });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 0.8);
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight, position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }
      pdf.save(`Dashboard-${filters.year}-${filters.month}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const recapRows = useMemo(() => {
    const grouped = {};
    filtered.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = { key, income: 0, expense: 0, saving: 0 };
      if (t.type === 'income')  grouped[key].income  += t.amount || 0;
      if (t.type === 'expense') grouped[key].expense += t.amount || 0;
      if (t.type === 'saving')  grouped[key].saving  += t.amount || 0;
    });
    return Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered]);

  const isLoading = loadingTx || loadingAcc;

  const aiReport = useMemo(() => buildReport({
    transactions: filters.currency ? transactions.filter(t => t.currency === filters.currency) : transactions,
    accounts, debts, receivables, year: filters.year, month: filters.month,
  }), [transactions, accounts, debts, receivables, filters]);

  return (
    <div className="space-y-5 stagger" ref={dashboardRef}>

      {/* ── HERO HEADER ── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'hsl(var(--sidebar-background))', minHeight: 130 }}>
        <div className="relative flex items-center justify-between gap-3 p-4 sm:p-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setShowLiveData(!showLiveData)}
                className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Zap size={11} className="text-info" />
              </button>
              <span className="text-info/80 text-[10px] font-bold uppercase tracking-[0.15em]">{t('financialDashboard')}</span>
            </div>
            <h1 className="text-white font-heading font-bold text-xl sm:text-3xl leading-tight tracking-tight break-words">
              {monthLabel} <span className="text-info">{filters.year}</span>
            </h1>
            <p className="text-white/50 text-xs sm:text-sm mt-1.5 font-medium">{t('monitorRealtime')}</p>
          </div>

          {/* Right: export + total balance hint */}
          <div className="hidden sm:flex flex-col items-end gap-2">
            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              size="sm"
              className="gap-1.5 no-print text-xs rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
            >
              <Download size={13} />
              {exporting ? t('exporting') : t('exportPDF')}
            </Button>
            <p className="text-white/30 text-[10px]">Real-time • {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
          </div>
        </div>

        {/* Live Data Dropdown */}
        {showLiveData && (
          <div className="relative border-t border-white/10 bg-black/20 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-white">
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide mb-1 leading-tight">{t('totalAkun')}</p>
                <p className="text-base sm:text-lg font-bold">{accounts.filter(a => a.is_active !== false).length}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide mb-1 leading-tight">{t('totalTransaksi')}</p>
                <p className="text-base sm:text-lg font-bold">{filtered.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide mb-1 leading-tight">{t('cashFlow')}</p>
                <p className={`text-base sm:text-lg font-bold break-words ${kpis.cashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {kpis.cashFlow >= 0 ? '+' : ''}{formatCompact(kpis.cashFlow, primaryCurrency)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), transparent)' }} />
      </div>

      {/* Export mobile */}
      <div className="sm:hidden no-print">
        <Button onClick={handleExportPDF} disabled={exporting} variant="outline" size="sm" className="gap-2 w-full">
          <Download size={13} />
          {exporting ? t('exporting') : t('exportPDF')}
        </Button>
      </div>

      <OnboardingChecklist />

      <GlobalFilter filters={filters} onChange={setFilters} />

      <DeadlineAlert debts={activeDebts} savingTargets={savingTargets.filter(s => s.status === 'active')} />

      {/* Quick Stats - Favorite */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-amber-500" />
          <h3 className="text-sm font-heading font-bold text-foreground">{t('kategoriFavorit')}</h3>
        </div>
        <QuickStats year={filters.year} month={filters.month} currency={primaryCurrency} />
      </div>

      {/* ── ROW 1: KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiBlock
          title={t('totalSaldo')}
          value={Object.entries(totalBalance).map(([c, v]) => formatCompact(v, c)).join(' | ') || 'Rp 0'}
          icon={Wallet}
          iconBg="rgba(37,99,235,0.1)"
          iconColor="#2563EB"
          accent="kpi-blue"
        />
        <KpiBlock
          title={t('pendapatan')}
          value={formatCompact(kpis.income, primaryCurrency)}
          icon={ArrowUpRight}
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10B981"
          accent="kpi-green"
        />
        <KpiBlock
          title={t('pengeluaran')}
          value={formatCompact(kpis.expense, primaryCurrency)}
          icon={ArrowDownRight}
          iconBg="rgba(239,68,68,0.1)"
          iconColor="#EF4444"
          accent="kpi-red"
        />
        <KpiBlock
          title={t('cashFlow')}
          value={formatCompact(kpis.cashFlow, primaryCurrency)}
          icon={kpis.cashFlow >= 0 ? TrendingUp : TrendingDown}
          iconBg={kpis.cashFlow >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}
          iconColor={kpis.cashFlow >= 0 ? '#10B981' : '#EF4444'}
          accent={kpis.cashFlow >= 0 ? 'kpi-green' : 'kpi-red'}
          footer={<span className="font-semibold text-foreground">{t('savingRate')}: {kpis.savingRate.toFixed(1)}%</span>}
        />
      </div>

      {/* ── ROW 2: Extra KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiBlock
          title={t('tabungan')}
          value={formatCurrency(kpis.saving, primaryCurrency)}
          icon={PiggyBank}
          iconBg="rgba(99,102,241,0.1)"
          iconColor="#6366F1"
          accent="kpi-indigo"
        />
        <KpiBlock
          title={t('hutangAktif')}
          value={Object.entries(debtByCurrency).map(([c, v]) => formatCurrency(v, c)).join(' | ') || formatCurrency(0)}
          icon={CreditCard}
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#F59E0B"
          accent="kpi-amber"
        />
        <KpiBlock
          title={t('piutangAktif')}
          value={Object.entries(receivableByCurrency).map(([c, v]) => formatCurrency(v, c)).join(' | ') || formatCurrency(0)}
          icon={DollarSign}
          iconBg="rgba(20,184,166,0.1)"
          iconColor="#14B8A6"
          accent="kpi-teal"
        />
        <KpiBlock
          title={t('savingRate')}
          value={`${kpis.savingRate.toFixed(1)}%`}
          icon={Target}
          iconBg={kpis.savingRate >= 20 ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)'}
          iconColor={kpis.savingRate >= 20 ? '#10B981' : '#64748B'}
          accent={kpis.savingRate >= 20 ? 'kpi-green' : ''}
          footer={<span>{kpis.savingRate >= 20 ? t('targetTercapai') : t('targetBelum')}</span>}
        />
      </div>

      {/* ── ROW 3: Area Trend Chart ── */}
      <div className="rounded-3xl overflow-hidden border border-border shadow-lg"
        style={{ background: 'hsl(var(--card))' }}>
        <div className="flex items-start sm:items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]">{t('tahunan')} {filters.year}</p>
            </div>
            <h3 className="text-base font-heading font-bold text-foreground">{t('trenAktivitas')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('perbandinganBulan')}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {[
              { label: t('pendapatan'), color: '#10B981' },
              { label: t('pengeluaran'), color: '#EF4444' },
              { label: t('tabungan'), color: '#6366F1' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded-full" style={{ background: l.color }} />
                <span className="text-[10px] font-semibold text-muted-foreground hidden sm:block">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradSaving" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => formatCompact(v)} axisLine={false} tickLine={false} width={58} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="income"  name={t('pendapatan')}  stroke="#10B981" strokeWidth={2.5} fill="url(#gradIncome)"  dot={false} activeDot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="expense" name={t('pengeluaran')} stroke="#EF4444" strokeWidth={2.5} fill="url(#gradExpense)" dot={false} activeDot={{ r: 5, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="saving"  name={t('tabungan')}    stroke="#6366F1" strokeWidth={2}   fill="url(#gradSaving)"  dot={false} activeDot={{ r: 5, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Mini stats row */}
        <div className="grid grid-cols-3 border-t border-border divide-x divide-border">
          {[
            { label: t('pendapatan'), value: formatCompact(kpis.income, primaryCurrency), color: '#10B981', bg: 'rgba(16,185,129,0.06)' },
            { label: t('pengeluaran'), value: formatCompact(kpis.expense, primaryCurrency), color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
            { label: t('tabungan'), value: formatCompact(kpis.saving, primaryCurrency), color: '#6366F1', bg: 'rgba(99,102,241,0.06)' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-3 gap-0.5" style={{ background: s.bg }}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 4: Kategori split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pendapatan per Kategori */}
        <div className="rounded-3xl border border-border overflow-hidden shadow-sm" style={{ background: 'hsl(var(--card))' }}>
          <div className="px-4 sm:px-5 pt-4 pb-2 flex items-start justify-between gap-2" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 100%)' }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{t('pendapatan')}</p>
              </div>
              <h3 className="text-sm font-heading font-bold text-foreground">{t('pendapatanPerKategori')}</h3>
              <p className="text-[11px] text-muted-foreground">{monthLabel} {filters.year}</p>
            </div>
            {incomePieData.length > 0 && (
              <div className="text-right shrink-0">
                <p className="text-[11px] sm:text-xs text-muted-foreground">{incomePieData.length} kategori</p>
                <p className="text-sm font-bold text-emerald-600">{formatCompact(kpis.income, primaryCurrency)}</p>
              </div>
            )}
          </div>
          <div className="px-4 pb-4 pt-2">
            {incomePieData.length > 0 ? (
              <div className="space-y-2.5">
                {incomePieData.map((e, i) => {
                  const pct = kpis.income > 0 ? (e.total / kpis.income) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.fill }} />
                          <span className="text-xs font-semibold text-foreground truncate">{e.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                          <span className="text-xs font-bold text-foreground">{formatCompact(e.total)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: e.fill }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-28 text-muted-foreground gap-2">
                <TrendingUp size={28} className="opacity-20" />
                <span className="text-sm">{t('tidakAdaPendapatan')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pengeluaran per Kategori */}
        <div className="rounded-3xl border border-border overflow-hidden shadow-sm" style={{ background: 'hsl(var(--card))' }}>
          <div className="px-4 sm:px-5 pt-4 pb-2 flex items-start justify-between gap-2" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, transparent 100%)' }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{t('pengeluaran')}</p>
              </div>
              <h3 className="text-sm font-heading font-bold text-foreground">{t('pengeluaranPerKategori')}</h3>
              <p className="text-[11px] text-muted-foreground">{monthLabel} {filters.year}</p>
            </div>
            {pieData.length > 0 && (
              <div className="text-right shrink-0">
                <p className="text-[11px] sm:text-xs text-muted-foreground">{pieData.length} kategori</p>
                <p className="text-sm font-bold text-red-500">{formatCompact(kpis.expense, primaryCurrency)}</p>
              </div>
            )}
          </div>
          <div className="px-4 pb-4 pt-2">
            {pieData.length > 0 ? (
              <div className="space-y-2.5">
                {pieData.map((e, i) => {
                  const pct = kpis.expense > 0 ? (e.total / kpis.expense) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.fill }} />
                          <span className="text-xs font-semibold text-foreground truncate">{e.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                          <span className="text-xs font-bold text-foreground">{formatCompact(e.total)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: e.fill }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-28 text-muted-foreground gap-2">
                <TrendingDown size={28} className="opacity-20" />
                <span className="text-sm">{t('tidakAdaPengeluaran')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 5: Distribusi Akun + Hutang vs Piutang ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title={t('distribusiSaldo')} subtitle={t('perRekeningAktif')}>
          {accountPieData.filter(a => a.value > 0).length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <ResponsiveContainer width="100%" height={160} className="sm:max-w-[170px] shrink-0">
                <PieChart>
                  <Pie
                    data={accountPieData.filter(a => a.value > 0)}
                    cx="50%" cy="50%"
                    innerRadius={44} outerRadius={72} cornerRadius={8}
                    dataKey="value" paddingAngle={5}
                    animationBegin={0} animationDuration={700}
                  >
                    {accountPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 w-full space-y-1.5">
                {accountPieData.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.fill }} />
                      <span className="text-[12px] text-foreground truncate font-medium">{a.name}</span>
                    </div>
                    <span className="text-[12px] font-bold text-foreground shrink-0">{formatCompact(a.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
              <span className="text-3xl opacity-20">🏦</span>
              <span className="text-sm">{t('belumAdaAkun')}</span>
            </div>
          )}
        </SectionCard>

        <SectionCard title={t('hutangVsPiutang')} subtitle={t('perbandinganAktif')}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={debtVsReceivable} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => formatCompact(v)} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[12, 12, 0, 0]} maxBarSize={62} isAnimationActive animationDuration={800}>
                {debtVsReceivable.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* ── ROW 6: Rekap Saldo Akun with Bank Logos ── */}
      <div className="rounded-3xl border border-border overflow-hidden shadow-sm" style={{ background: 'hsl(var(--card))' }}>
        <div className="px-4 sm:px-5 pt-4 pb-3 flex items-center justify-between gap-2 border-b border-border"
          style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, transparent 100%)' }}>
          <div>
            <h3 className="text-sm font-heading font-bold text-foreground">{t('rekapSaldo')}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t('saldoTerkini')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Live</span>
          </div>
        </div>
        <div className="p-4">
          {accounts.filter(a => a.is_active !== false).length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
              <Wallet size={28} className="opacity-20" />
              <p className="text-sm">{t('belumAdaAkun')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {accounts.filter(a => a.is_active !== false).map((a, i) => {
                const balance = a.current_balance || 0;
                const change = balance - (a.initial_balance || 0);
                const isPos = change >= 0;
                return (
                  <div key={a.id} className="group flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 min-w-0 rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                    style={{ background: `linear-gradient(135deg, ${a.color || '#0D4F6D'}08 0%, transparent 100%)` }}>
                    <AccountLogo account={a} size={42} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{a.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{a.currency}</span>
                        {change !== 0 && (
                          <span className={`text-[10px] font-semibold ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isPos ? '▲' : '▼'} {formatCompact(Math.abs(change))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {formatCompact(balance, a.currency)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Saldo</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 7: Insight + Health Score ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard
            title={t('insightKeuangan')}
            subtitle={t('analisisCerdas')}
            action={<span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400"><Sparkles size={10} /> AI</span>}
          >
            <InsightPanel transactions={filtered} accounts={accounts} debts={activeDebts} receivables={activeReceivables} />
          </SectionCard>
        </div>
        <SectionCard title={t('skorKesehatan')}>
          <FinancialHealthScore
            cashFlow={kpis.cashFlow}
            savingRate={kpis.savingRate}
            debtRatio={debtRatio}
            totalIncome={kpis.income}
            totalExpense={kpis.expense}
          />
        </SectionCard>
      </div>

      {/* ── ROW 7b: AI Financial Check ── */}
      <SectionCard
        title="AI Financial Check"
        subtitle="Analisis pengeluaran, skor kesehatan & rekomendasi"
        action={<Link to="/laporan" className="text-[11px] font-semibold text-primary hover:underline no-print">Laporan lengkap →</Link>}
      >
        <AiFinancialCheck report={aiReport} />
      </SectionCard>

      {/* ── ROW 8: Top 5 Pengeluaran ── */}
      {expenseByCategory.length > 0 && (
        <SectionCard title={t('top5Pengeluaran')} subtitle={`${t('berdasarkanKategori')} — ${monthLabel} ${filters.year}`}>
          <div className="space-y-3">
            {expenseByCategory.slice(0, 5).map((c, i) => {
              const pct = kpis.expense > 0 ? (c.total / kpis.expense) * 100 : 0;
              const colors = ['#0EA5E9', '#10B981', '#6366F1', '#F59E0B', '#EF4444'];
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: colors[i] }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="font-semibold text-foreground">{c.name}</span>
                      <span className="text-muted-foreground font-medium">
                        {formatCurrency(c.total, primaryCurrency)} <span className="text-[10px] opacity-60">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="progress-premium h-2">
                      <div className="progress-premium-bar" style={{ width: `${pct}%`, background: colors[i] }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ── ROW 9: Rekap Tabel ── */}
      {recapRows.length > 0 && (
        <SectionCard title={t('rekapPeriode')} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-premium">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 whitespace-nowrap">{t('periode')}</th>
                  <th className="text-right px-5 py-3.5 whitespace-nowrap text-emerald-600 dark:text-emerald-400">{t('pendapatan')}</th>
                  <th className="text-right px-5 py-3.5 whitespace-nowrap text-red-500">{t('pengeluaran')}</th>
                  <th className="text-right px-5 py-3.5 whitespace-nowrap text-indigo-500">{t('tabungan')}</th>
                  <th className="text-right px-5 py-3.5 whitespace-nowrap">{t('cashFlow')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recapRows.map((r, i) => {
                  const cf = r.income - r.expense;
                  return (
                    <tr key={i} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 text-muted-foreground font-medium">{r.key}</td>
                      <td className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.income, primaryCurrency)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-red-500">{formatCurrency(r.expense, primaryCurrency)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-indigo-500">{formatCurrency(r.saving, primaryCurrency)}</td>
                      <td className={`px-5 py-3 text-right font-bold ${cf >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {cf >= 0 ? '+' : ''}{formatCurrency(cf, primaryCurrency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}