import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Category, ExpenseGoal as ExpenseGoalEntity, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Edit2, Trash2, AlertCircle, Target, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import KpiCard from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/utils/finance';
import { toast } from 'sonner';
import { logCreate, logUpdate, logDelete } from '@/lib/activityLogger';

const PERIODS = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'quarterly', label: 'Kuartalan (3 Bulan)' },
  { value: 'yearly', label: 'Tahunan' },
];

function getDateRange(period) {
  const now = new Date();
  switch (period) {
    case 'daily':
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
    case 'weekly': {
      const day = now.getDay();
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + (day === 0 ? -6 : 1));
      return { start: monday, end: new Date(monday.getTime() + 7 * 86400000) };
    }
    case 'quarterly': {
      const q = Math.floor(now.getMonth() / 3);
      return { start: new Date(now.getFullYear(), q * 3, 1), end: new Date(now.getFullYear(), q * 3 + 3, 1) };
    }
    case 'yearly':
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
    default: // monthly
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  }
}

function getPeriodLabel(period) {
  const now = new Date();
  switch (period) {
    case 'daily': return `Hari ini, ${now.toLocaleDateString('id-ID')}`;
    case 'weekly': {
      const day = now.getDay();
      const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + (day === 0 ? -6 : 1));
      const sun = new Date(mon.getTime() + 6 * 86400000);
      return `${mon.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    case 'quarterly': return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
    case 'yearly': return `Tahun ${now.getFullYear()}`;
    default: return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
}

function getStatusConfig(pct, threshold) {
  if (pct >= 100) return { bar: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-100 text-red-700 border-red-200', border: 'border-red-300', label: 'Terlampaui', icon: AlertCircle };
  if (pct >= 90) return { bar: 'bg-orange-500', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700 border-orange-200', border: 'border-orange-300', label: 'Kritis', icon: AlertTriangle };
  if (pct >= (threshold || 80)) return { bar: 'bg-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', border: 'border-yellow-300', label: 'Peringatan', icon: AlertTriangle };
  return { bar: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', border: 'border-border', label: 'Aman', icon: CheckCircle };
}

const EMPTY_FORM = { category_id: '', target_amount: '', period: 'monthly', alert_threshold: 80, notes: '' };

export default function ExpenseGoal() {
  const { user } = useAuth();
  const uid = user?.id;
  const [showDialog, setShowDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const { data: expenseGoals = [] } = useQuery({
    queryKey: ['expenseGoals', uid],
    queryFn: () => uid ? ExpenseGoalEntity.list() : [],
    enabled: !!uid,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', uid],
    queryFn: () => uid ? Category.list() : [],
    enabled: !!uid,
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', uid],
    queryFn: () => uid ? Transaction.list() : [],
    enabled: !!uid,
  });

  const expenseCategories = categories.filter(c => c.type === 'expense' && c.is_active !== false);

  const goalSpending = useMemo(() => {
    const result = {};
    expenseGoals.forEach(goal => {
      const { start, end } = getDateRange(goal.period || 'monthly');
      result[goal.id] = transactions
        .filter(tx => tx.type === 'expense' && (!goal.category_id || tx.category_id === goal.category_id))
        .filter(tx => { const d = new Date(tx.date); return d >= start && d < end; })
        .reduce((s, tx) => s + (tx.amount || 0), 0);
    });
    return result;
  }, [expenseGoals, transactions]);

  // Auto-alert when thresholds hit
  useEffect(() => {
    expenseGoals.forEach(goal => {
      const pct = goal.target_amount > 0 ? ((goalSpending[goal.id] || 0) / goal.target_amount) * 100 : 0;
      if (pct >= 100) toast.error(`Target "${goal.category_name}" TERLAMPAUI (${pct.toFixed(0)}%)!`, { id: `goal-over-${goal.id}` });
      else if (pct >= 90) toast.warning(`Target "${goal.category_name}" kritis: ${pct.toFixed(0)}%`, { id: `goal-crit-${goal.id}` });
      else if (pct >= (goal.alert_threshold || 80)) toast.warning(`Peringatan: "${goal.category_name}" ${pct.toFixed(0)}% dari target`, { id: `goal-warn-${goal.id}` });
    });
  }, [expenseGoals, goalSpending]);

  const createMutation = useMutation({
    mutationFn: (data) => ExpenseGoalEntity.create({ ...data, created_by_id: uid }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['expenseGoals'] });
      const cat = categories.find(c => c.id === vars.category_id);
      toast.success('Target pengeluaran berhasil dibuat');
      logCreate('expense-goal', `target "${cat?.name}" sebesar ${formatCurrency(vars.target_amount, 'IDR')} (${PERIODS.find(p => p.value === vars.period)?.label})`);
      setShowDialog(false);
      setFormData(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => ExpenseGoalEntity.update(editingGoal.id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['expenseGoals'] });
      toast.success('Target pengeluaran berhasil diperbarui');
      logUpdate('expense-goal', `target "${editingGoal.category_name}" dari ${formatCurrency(editingGoal.target_amount, 'IDR')} menjadi ${formatCurrency(vars.target_amount, 'IDR')}`, editingGoal, vars);
      setShowDialog(false);
      setEditingGoal(null);
      setFormData(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ExpenseGoalEntity.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenseGoals'] });
      toast.success('Target pengeluaran berhasil dihapus');
      logDelete('expense-goal', `target "${confirmDelete?.category_name}"`);
      setConfirmDelete(null);
    },
  });

  const handleAdd = () => { setEditingGoal(null); setFormData(EMPTY_FORM); setShowDialog(true); };
  const handleEdit = (g) => {
    setEditingGoal(g);
    setFormData({ category_id: g.category_id, target_amount: g.target_amount, period: g.period || 'monthly', alert_threshold: g.alert_threshold || 80, notes: g.notes || '' });
    setShowDialog(true);
  };
  const handleSubmit = () => {
    if (!formData.category_id || !formData.target_amount) { toast.error('Kategori dan target harus diisi'); return; }
    const cat = categories.find(c => c.id === formData.category_id);
    const data = { ...formData, target_amount: Number(formData.target_amount), alert_threshold: Number(formData.alert_threshold), category_name: cat?.name, currency: 'IDR' };
    if (editingGoal) updateMutation.mutate(data); else createMutation.mutate(data);
  };

  const activeGoals = expenseGoals.filter(g => g.is_active !== false);
  const stats = useMemo(() => {
    let exceeded = 0, warning = 0;
    activeGoals.forEach(g => {
      const pct = (goalSpending[g.id] || 0) / g.target_amount * 100;
      if (pct >= 100) exceeded++; else if (pct >= (g.alert_threshold || 80)) warning++;
    });
    return { total: activeGoals.length, exceeded, warning };
  }, [activeGoals, goalSpending]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Target Pengeluaran"
        subtitle="Pantau dan kendalikan pengeluaran per kategori dengan target berbasis periode"
        action={<Button onClick={handleAdd} className="gap-2"><Plus size={16} /> Tambah Target</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard title="Target Aktif" value={stats.total} subtitle="Kategori dipantau" icon={Target} color="emerald" />
        <KpiCard title="Peringatan" value={stats.warning} subtitle="Mendekati batas" icon={AlertTriangle} color="warning" />
        <KpiCard title="Terlampaui" value={stats.exceeded} subtitle="Melebihi target" icon={AlertCircle} color="red" />
      </div>

      {activeGoals.length === 0 ? (
        <SectionCard>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Target size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Belum ada target pengeluaran</p>
            <Button onClick={handleAdd} variant="outline" size="sm" className="mt-4">Tambah Target Pertama</Button>
          </div>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeGoals.map((goal) => {
            const spent = goalSpending[goal.id] || 0;
            const pct = goal.target_amount > 0 ? (spent / goal.target_amount) * 100 : 0;
            const remaining = Math.max(0, goal.target_amount - spent);
            const s = getStatusConfig(pct, goal.alert_threshold);
            const SI = s.icon;
            const periodLabel = PERIODS.find(p => p.value === (goal.period || 'monthly'))?.label || 'Bulanan';

            return (
              <div key={goal.id} className={`bg-card border-2 ${s.border} rounded-2xl p-5 transition-all hover:shadow-md`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-heading font-bold text-foreground">{goal.category_name}</h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.badge}`}>
                        <SI size={10} /> {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar size={11} />
                      <span>{periodLabel} · {getPeriodLabel(goal.period)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleEdit(goal)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <Edit2 size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => setConfirmDelete(goal)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <p className="text-xs text-muted-foreground">Terpakai</p>
                      <p className={`text-lg font-heading font-bold ${s.text}`}>{formatCurrency(spent, 'IDR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-base font-semibold text-foreground">{formatCurrency(goal.target_amount, 'IDR')}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Progress</span>
                      <span className={`font-bold ${s.text}`}>{Math.min(pct, 999).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${s.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="relative h-3 mt-1">
                      <div className="absolute top-0 h-2 w-0.5 bg-yellow-400 opacity-70" style={{ left: `${goal.alert_threshold || 80}%` }} title={`Alert ${goal.alert_threshold || 80}%`} />
                      <div className="absolute top-0 h-2 w-0.5 bg-orange-400 opacity-70" style={{ left: '90%' }} title="Kritis 90%" />
                      <div className="absolute top-0 h-2 w-0.5 bg-red-400 opacity-70" style={{ left: '99.5%' }} title="100%" />
                      <p className="text-[9px] text-muted-foreground absolute" style={{ left: `${goal.alert_threshold || 80}%`, transform: 'translateX(-50%)' }}>{goal.alert_threshold || 80}%</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs bg-muted/40 rounded-xl px-3 py-2">
                    <span className="text-muted-foreground">Sisa anggaran</span>
                    <span className={`font-semibold ${remaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {remaining === 0 && pct >= 100 ? `Habis (−${formatCurrency(spent - goal.target_amount, 'IDR')})` : formatCurrency(remaining, 'IDR')}
                    </span>
                  </div>

                  {pct >= 100 && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs rounded-xl px-3 py-2 border border-red-200">
                      <AlertCircle size={12} className="shrink-0" />
                      Anggaran melebihi {formatCurrency(spent - goal.target_amount, 'IDR')}!
                    </div>
                  )}
                  {pct >= 90 && pct < 100 && (
                    <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-xs rounded-xl px-3 py-2 border border-orange-200">
                      <AlertTriangle size={12} className="shrink-0" />
                      Peringatan kritis: {pct.toFixed(0)}% dari target
                    </div>
                  )}
                  {pct >= (goal.alert_threshold || 80) && pct < 90 && (
                    <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-xl px-3 py-2 border border-yellow-200">
                      <AlertTriangle size={12} className="shrink-0" />
                      Mendekati batas target ({pct.toFixed(0)}%)
                    </div>
                  )}
                  {goal.notes && <p className="text-xs text-muted-foreground italic border-t border-border pt-2">{goal.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Target Pengeluaran' : 'Tambah Target Pengeluaran'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold mb-2 block">Kategori</Label>
              <Select value={formData.category_id} onValueChange={v => setFormData({ ...formData, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori pengeluaran" /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">Target Pengeluaran (IDR)</Label>
              <Input type="number" value={formData.target_amount} onChange={e => setFormData({ ...formData, target_amount: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">Periode Target</Label>
              <Select value={formData.period} onValueChange={v => setFormData({ ...formData, period: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {formData.period && (
                <p className="text-xs text-muted-foreground mt-1">Periode aktif: {getPeriodLabel(formData.period)}</p>
              )}
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">Alert Threshold: <span className="text-yellow-600 font-bold">{formData.alert_threshold}%</span></Label>
              <input
                type="range" min="50" max="95" step="5"
                value={formData.alert_threshold}
                onChange={e => setFormData({ ...formData, alert_threshold: Number(e.target.value) })}
                className="w-full accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>50% (longgar)</span><span>95% (ketat)</span>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">Catatan</Label>
              <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Catatan tambahan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingGoal ? 'Perbarui' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        type="delete"
        title="Hapus Target Pengeluaran?"
        description={`Yakin ingin menghapus target untuk "${confirmDelete?.category_name}"?`}
        onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}