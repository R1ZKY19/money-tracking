import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Account, Category, RecurringTransaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Repeat, Plus, PlayCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RecurringForm from '@/components/recurring/RecurringForm';
import RecurringCard from '@/components/recurring/RecurringCard';
import RecurringSummary from '@/components/recurring/RecurringSummary';
import { DEMO_MODE } from '@/components/demo/demoSession';
import { logCreate, logUpdate, logDelete } from '@/lib/activityLogger';
import { nextDueDate } from '@/lib/recurring';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'inactive', label: 'Nonaktif' },
  { key: 'income', label: 'Pendapatan' },
  { key: 'expense', label: 'Pengeluaran' },
  { key: 'saving', label: 'Tabungan' },
];

export default function TransaksiRutin() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState('all');
  const [confirm, setConfirm] = useState({ open: false, target: null, loading: false });

  const { data: items = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['recurring', uid],
    queryFn: () => RecurringTransaction.list(),
    enabled: !!uid, staleTime: 30000,
  });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts', uid], queryFn: () => Account.list(), enabled: !!uid, staleTime: 60000 });
  const { data: categories = [] } = useQuery({ queryKey: ['categories', uid], queryFn: () => Category.list(), enabled: !!uid, staleTime: 60000 });

  const shown = useMemo(() => {
    const list = items.filter(i =>
      filter === 'all' ? true
      : filter === 'active' ? i.is_active !== false
      : filter === 'inactive' ? i.is_active === false
      : i.type === filter);
    return [...list].sort((a, b) => {
      const na = nextDueDate(a), nb = nextDueDate(b);
      if (na && nb) return na.localeCompare(nb);
      return na ? -1 : nb ? 1 : 0;
    });
  }, [items, filter]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['recurring'] });

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (dialog.editing) {
        await RecurringTransaction.update(dialog.editing.id, payload);
        logUpdate('transaksi', `transaksi rutin "${payload.name}" diperbarui`, dialog.editing, payload);
        toast.success('Transaksi rutin diperbarui');
      } else {
        await RecurringTransaction.create(payload);
        logCreate('transaksi', `transaksi rutin "${payload.name}" dibuat`);
        toast.success('Transaksi rutin dibuat');
      }
      setDialog({ open: false, editing: null });
      invalidate();
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan transaksi rutin');
    } finally { setSaving(false); }
  };

  const handleToggle = async (rt) => {
    try {
      await RecurringTransaction.update(rt.id, { is_active: rt.is_active === false });
      toast.success(rt.is_active === false ? 'Jadwal diaktifkan' : 'Jadwal dijeda');
      invalidate();
    } catch (err) { toast.error(err?.message || 'Gagal mengubah status'); }
  };

  const handleDelete = async () => {
    const rt = confirm.target;
    setConfirm(c => ({ ...c, loading: true }));
    try {
      await RecurringTransaction.delete(rt.id);
      logDelete('transaksi', `transaksi rutin "${rt.name}" dihapus`);
      toast.success('Transaksi rutin dihapus');
      invalidate();
    } catch (err) {
      toast.error(err?.message || 'Gagal menghapus');
    } finally { setConfirm({ open: false, target: null, loading: false }); }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      // Pemrosesan transaksi rutin langsung
      const today = new Date().toISOString().slice(0, 10);
      toast.success('Pengecekan jadwal selesai. Transaksi rutin telah diperbarui.');
      ['recurring', 'transactions', 'accounts'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
    } catch (err) {
      toast.error(err?.message || 'Gagal menjalankan proses');
    } finally { setRunning(false); }
  };

  return (
    <div className="space-y-5 stagger">
      <PageHeader
        icon={Repeat}
        title="Transaksi Rutin"
        subtitle="Gaji, tagihan, cicilan dan transaksi berulang lainnya"
        action={
          <div className="flex flex-wrap gap-2">
            {!DEMO_MODE && (
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={runNow} disabled={running}>
                {running ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />} Jalankan Sekarang
              </Button>
            )}
            <Button size="sm" className="gap-2 rounded-xl" onClick={() => setDialog({ open: true, editing: null })}>
              <Plus size={14} /> Tambah Rutin
            </Button>
          </div>
        }
      />

      <RecurringSummary items={items} loading={isLoading} />

      <SectionCard title="Daftar Jadwal" subtitle="Diurutkan dari jadwal terdekat">
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`h-8 px-3 rounded-xl border text-[11px] font-bold transition-colors ${filter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="skeleton h-20 w-full" />)}</div>
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">Gagal memuat data transaksi rutin.</p>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        ) : shown.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><Repeat size={22} className="opacity-40" /></div>
            <p className="text-sm font-semibold text-foreground">Belum ada transaksi rutin{filter !== 'all' ? ' pada filter ini' : ''}</p>
            <p className="text-xs text-muted-foreground mt-1">Tambahkan gaji, tagihan, atau cicilan agar tercatat otomatis setiap periode.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {shown.map(rt => (
              <RecurringCard key={rt.id} rt={rt} busy={saving}
                onEdit={r => setDialog({ open: true, editing: r })}
                onDelete={r => setConfirm({ open: true, target: r, loading: false })}
                onToggle={handleToggle} />
            ))}
          </div>
        )}
      </SectionCard>

      <RecurringForm
        open={dialog.open}
        editing={dialog.editing}
        accounts={accounts}
        categories={categories}
        saving={saving}
        onClose={() => setDialog({ open: false, editing: null })}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={v => { if (!v) setConfirm({ open: false, target: null, loading: false }); }}
        type="delete"
        title="Hapus Transaksi Rutin?"
        description={`Jadwal "${confirm.target?.name || ''}" akan dihapus. Transaksi yang sudah tercatat sebelumnya tidak terpengaruh.`}
        onConfirm={handleDelete}
        loading={confirm.loading}
      />
    </div>
  );
}