import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Account, SavingTarget, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Target, FileText, FileDown, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SectionCard from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatCompact } from '@/lib/utils/finance';
import { logCreate, logUpdate, logDelete } from '@/lib/activityLogger';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import GoalSummaryCards from '@/components/savings/GoalSummaryCards';
import GoalForm from '@/components/savings/GoalForm';
import GoalCard from '@/components/savings/GoalCard';
import GoalDetailModal from '@/components/savings/GoalDetailModal';
import { CATEGORIES, calcProgress, calcRemaining, getStatusFromProgress, getMonthsRemaining, idealMonthlyDeposit, calcSuccessProbability, aggregateMonthlyByTarget, freqToMonthlyMultiplier, estimateCompletionDate } from '@/lib/savingGoalCalc';
import { usePageLang } from '@/lib/pageTranslations';

export default function Tabungan() {
  const T = usePageLang('tabungan');
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, goal: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [detailGoal, setDetailGoal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formPayload, setFormPayload] = useState(null);

  const { data: transactions = [] } = useQuery({ queryKey: ['transactions', uid], queryFn: () => Transaction.list(), enabled: !!uid, staleTime: 60000 });
  const { data: targets = [], isLoading: loadingTargets } = useQuery({ queryKey: ['saving_targets', uid], queryFn: () => SavingTarget.list(), enabled: !!uid, staleTime: 60000 });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts', uid], queryFn: () => Account.list(), enabled: !!uid, staleTime: 60000 });

  const allSavingTxs = useMemo(() => transactions.filter(t => t.type === 'saving'), [transactions]);

  // Per-target monthly history
  const monthlyHistoryByTarget = useMemo(() => {
    const map = {};
    targets.forEach(t => { map[t.id] = aggregateMonthlyByTarget(allSavingTxs, t); });
    return map;
  }, [targets, allSavingTxs]);

  // Dashboard summary
  const summary = useMemo(() => {
    const active = targets.filter(t => t.status !== 'achieved' && calcProgress(t.current_amount || 0, t.target_amount || 0) < 100);
    const achieved = targets.filter(t => t.status === 'achieved' || calcProgress(t.current_amount || 0, t.target_amount || 0) >= 100);
    const totalTarget = targets.reduce((s, t) => s + (t.target_amount || 0), 0);
    const totalCollected = targets.reduce((s, t) => s + (t.current_amount || 0), 0);
    const totalRemaining = Math.max(0, totalTarget - totalCollected);
    const overallProgress = totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;

    let totalProb = 0, countProb = 0;
    active.forEach(t => {
      totalProb += calcSuccessProbability(t, monthlyHistoryByTarget[t.id] || []);
      countProb++;
    });
    const avgProbability = countProb > 0 ? Math.round(totalProb / countProb) : 0;

    // Avg monthly saving across all saving transactions (last 12 months)
    const now = new Date();
    const last12Key = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
    const monthlyTotals = {};
    allSavingTxs.forEach(t => { const k = t.date?.substring(0, 7); if (k) monthlyTotals[k] = (monthlyTotals[k] || 0) + (t.amount || 0); });
    const monthlyValues = Object.values(monthlyTotals);
    const avgMonthly = monthlyValues.length > 0 ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length : 0;

    // Estimated finish - average completion date of active targets
    let estDates = [];
    active.forEach(t => {
      const dep = (t.deposit_amount || 0) * freqToMonthlyMultiplier(t.frequency);
      const est = estimateCompletionDate(t.current_amount || 0, t.target_amount || 0, dep);
      if (est) estDates.push(new Date(est));
    });
    const estimatedFinish = estDates.length > 0
      ? new Date(estDates.reduce((a, b) => a > b ? a : b)).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      : '—';

    const totalMonthsRemaining = active.reduce((s, t) => s + getMonthsRemaining(t.deadline), 0);

    return {
      activeCount: active.length,
      achievedCount: achieved.length,
      totalTarget,
      totalCollected,
      totalRemaining,
      overallProgress,
      avgProbability,
      avgMonthly,
      estimatedFinish,
      totalMonthsRemaining,
    };
  }, [targets, allSavingTxs, monthlyHistoryByTarget]);

  const filteredTargets = useMemo(() => {
    return targets.filter(t => {
      const isAchieved = t.status === 'achieved' || calcProgress(t.current_amount || 0, t.target_amount || 0) >= 100;
      if (filterStatus === 'active' && isAchieved) return false;
      if (filterStatus === 'achieved' && !isAchieved) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });
  }, [targets, filterStatus, filterCategory]);

  const openCreate = () => { setEditing(null); setShowDialog(true); };
  const openEdit = (t) => { setEditing(t); setShowDialog(true); };

  const handleSave = (payload) => {
    if (!payload.name.trim() || !payload.target_amount) { toast.error('Nama target & nominal target wajib diisi'); return; }
    setFormPayload(payload); setConfirmSave(true);
  };
  const doSave = async () => {
    setActionLoading(true);
    try {
      if (editing) {
        await SavingTarget.update(editing.id, formPayload);
        toast.success(`Target "${formPayload.name}" berhasil diperbarui`);
        logUpdate('tabungan', `target "${formPayload.name}" diperbarui`, editing, formPayload);
      } else {
        await SavingTarget.create(formPayload);
        toast.success(`Target "${formPayload.name}" berhasil ditambahkan`);
        logCreate('tabungan', `target "${formPayload.name}" sebesar ${formatCurrency(formPayload.target_amount, formPayload.currency)}`);
      }
      qc.invalidateQueries({ queryKey: ['saving_targets', uid] });
      setConfirmSave(false); setShowDialog(false); setActionLoading(false);
    } catch (e) {
      toast.error(`Gagal menyimpan: ${e?.message || 'Terjadi kesalahan'}`);
      setActionLoading(false);
    }
  };

  const doDelete = async () => {
    setActionLoading(true);
    try {
      await SavingTarget.delete(confirmDelete.goal.id);
      toast.success(`Target "${confirmDelete.goal.name}" dihapus`);
      logDelete('tabungan', `target "${confirmDelete.goal.name}"`);
      qc.invalidateQueries({ queryKey: ['saving_targets', uid] });
    } catch (e) {
      toast.error(`Gagal menghapus: ${e?.message || 'Terjadi kesalahan'}`);
    } finally {
      setConfirmDelete({ open: false, goal: null });
      setActionLoading(false);
    }
  };

  const exportPDF = () => {
    if (targets.length === 0) { toast.error('Belum ada target untuk dicetak'); return; }
    window.print();
  };
  const exportExcel = () => {
    if (targets.length === 0) { toast.error('Belum ada target untuk di-export'); return; }
    const rows = targets.map(t => ({
      Nama: t.name, Kategori: CATEGORIES[t.category]?.label || 'Lainnya', Target: t.target_amount,
      Terkumpul: t.current_amount, Sisa: calcRemaining(t.target_amount || 0, t.current_amount || 0),
      Progress: `${calcProgress(t.current_amount || 0, t.target_amount || 0).toFixed(1)}%`,
      Deadline: t.deadline || '—', Status: getStatusFromProgress(calcProgress(t.current_amount || 0, t.target_amount || 0)).label,
    }));
    const csv = [Object.keys(rows[0] || {}).join(',')].concat(rows.map(r => Object.values(r).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'target-tabungan.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Data target berhasil di-export');
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 flex items-center justify-between overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #A78BFA 100%)' }}>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full border-4 border-white/10" />
        <div className="absolute right-20 -top-6 w-24 h-24 rounded-full border-2 border-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-white/80" />
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Financial Goal Planner</p>
          </div>
          <h1 className="text-white font-heading font-bold text-2xl">{T.pageTitle}</h1>
          <p className="text-white/70 text-sm mt-1">Rencanakan, analisis, dan capai target keuangan Anda dengan prediksi cerdas</p>
          <div className="flex items-center gap-3 mt-3">
            <div className="bg-white/15 rounded-xl px-3 py-1.5 text-white text-xs font-semibold">{summary.activeCount} {T.active}</div>
            <div className="bg-white/15 rounded-xl px-3 py-1.5 text-white text-xs font-semibold">{summary.achievedCount} {T.achieved}</div>
            <div className="bg-white/15 rounded-xl px-3 py-1.5 text-white text-xs font-semibold">Prediksi {summary.avgProbability}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <Button onClick={exportPDF} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <FileText size={13} className="mr-1.5" /> PDF
          </Button>
          <Button onClick={exportExcel} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <FileDown size={13} className="mr-1.5" /> Excel
          </Button>
          <Button onClick={openCreate} className="bg-white text-indigo-700 hover:bg-white/90 font-semibold shadow-lg" size="sm">
            <Plus size={14} className="mr-1.5" /> {T.newTarget}
          </Button>
        </div>
      </div>

      {/* Dashboard Summary */}
      <GoalSummaryCards summary={summary} />

      {/* How to deposit banner */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <ArrowRight size={16} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-indigo-800 font-semibold text-sm">{T.howToDeposit}</p>
          <p className="text-indigo-600 text-xs mt-0.5">{T.depositGuide}</p>
        </div>
        <Button size="sm" onClick={() => navigate('/transaksi')} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
          {T.depositNow}
        </Button>
      </div>

      {/* Target List */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Target Tabungan Saya
          </div>
        }
        subtitle={`${targets.length} target · ${summary.activeCount} aktif · ${summary.achievedCount} tercapai`}
        action={
          <div className="flex items-center gap-1.5">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="achieved">Tercapai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {Object.entries(CATEGORIES).map(([k, c]) => (
                  <SelectItem key={k} value={k}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {loadingTargets ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <div key={i} className="skeleton h-64 w-full" />)}
          </div>
        ) : filteredTargets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Target size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">Belum ada target tabungan</p>
            <p className="text-xs mt-1 opacity-60">Mulai rencanakan masa depan finansial Anda sekarang</p>
            <Button onClick={openCreate} variant="outline" size="sm" className="mt-4">
              <Plus size={13} className="mr-1.5" /> Buat Target Pertama
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTargets.map(t => (
              <GoalCard
                key={t.id}
                goal={t}
                monthlyHistory={monthlyHistoryByTarget[t.id] || []}
                onEdit={openEdit}
                onDelete={(g) => setConfirmDelete({ open: true, goal: g })}
                onOpenDetail={setDetailGoal}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Detail Modal */}
      <GoalDetailModal
        goal={detailGoal || {}}
        monthlyHistory={detailGoal ? (monthlyHistoryByTarget[detailGoal.id] || []) : []}
        allTransactions={allSavingTxs}
        open={!!detailGoal}
        onClose={() => setDetailGoal(null)}
      />

      {/* Form Dialog */}
      <GoalForm
        open={showDialog}
        onOpenChange={setShowDialog}
        editing={editing}
        onSave={handleSave}
        accounts={accounts}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog open={confirmSave} onOpenChange={setConfirmSave}
        title={editing ? 'Konfirmasi Perubahan' : 'Konfirmasi Target Baru'}
        description={`Target "${formPayload?.name}" sebesar ${formPayload ? formatCurrency(formPayload.target_amount, formPayload.currency) : 0} akan ${editing ? 'diperbarui' : 'ditambahkan'}.`}
        type={editing ? 'update' : 'save'} onConfirm={doSave} loading={actionLoading} />

      <ConfirmDialog open={confirmDelete.open} onOpenChange={v => setConfirmDelete(d => ({ ...d, open: v }))}
        title="Hapus Target"
        description={`Target "${confirmDelete.goal?.name}" akan dihapus permanen. Lanjutkan?`}
        type="delete" confirmLabel="Ya, Hapus" onConfirm={doDelete} loading={actionLoading} />
    </div>
  );
}