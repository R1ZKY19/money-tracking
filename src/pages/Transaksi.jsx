import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction, Account, Category, Debt, Receivable, SavingTarget } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import {
  Plus, Pencil, Trash2, Search, List, AlertTriangle, TrendingUp, TrendingDown,
  CreditCard, ArrowDown, ArrowUp, PiggyBank, HandCoins, ArrowRightLeft, Info,
  Wallet, CalendarIcon, X
} from 'lucide-react';
import { toast } from 'sonner';
import SectionCard from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatCompact, formatDate, filterTransactionsByPeriod } from '@/lib/utils/finance';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { logCreate, logUpdate, logDelete } from '@/lib/activityLogger';
import GlobalFilter from '@/components/ui/GlobalFilter';
import { useUserRole } from '@/lib/UserRoleContext';
import AccountLogo from '@/components/ui/AccountLogo';
import TxSummaryBar from '@/components/transactions/TxSummaryBar';

// Waktu WIB (GMT+7)
const nowWIB = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
const currentYear = nowWIB.getFullYear();
const currentMonth = nowWIB.getMonth() + 1;

const ALL_TX_TYPES = [
  { value: 'income',             label: 'Pendapatan',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',  icon: ArrowDown,       desc: 'Uang masuk → saldo akun bertambah (+)',                              module: null },
  { value: 'expense',            label: 'Pengeluaran',     color: 'bg-red-100 text-red-700 border-red-200',              icon: ArrowUp,         desc: 'Uang keluar → saldo akun berkurang (−)',                             module: null },
  { value: 'saving',             label: 'Tabungan',        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',     icon: PiggyBank,       desc: 'Saldo akun berkurang, target tabungan bertambah',                    module: 'Tabungan' },
  { value: 'debt',               label: 'Hutang Baru',     color: 'bg-orange-100 text-orange-700 border-orange-200',     icon: TrendingDown,    desc: 'Saldo akun bertambah, hutang baru tercatat di Daftar Hutang',        module: 'Hutang' },
  { value: 'receivable',         label: 'Piutang Baru',    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',           icon: HandCoins,       desc: 'Saldo akun berkurang, piutang baru tercatat di Daftar Piutang',      module: 'Piutang' },
  { value: 'debt_payment',       label: 'Bayar Hutang',    color: 'bg-amber-100 text-amber-700 border-amber-200',        icon: CreditCard,      desc: 'Saldo akun berkurang, sisa hutang di Daftar Hutang berkurang',       module: 'Hutang' },
  { value: 'receivable_receipt', label: 'Terima Piutang',  color: 'bg-teal-100 text-teal-700 border-teal-200',           icon: ArrowRightLeft,  desc: 'Saldo akun bertambah, sisa piutang di Daftar Piutang berkurang',     module: 'Piutang' },
  { value: 'transfer',           label: 'Transfer',        color: 'bg-blue-100 text-blue-700 border-blue-200',           icon: ArrowRightLeft,  desc: 'Perpindahan saldo antar rekening — Akun Asal (−) · Akun Tujuan (+)', module: null },
];

const getTypeColor = (type) => ALL_TX_TYPES.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-700';
const getTypeLabel = (type) => ALL_TX_TYPES.find(t => t.value === type)?.label || type;
// Tipe yang menambah saldo akun (hijau +), sisanya mengurangi saldo (merah −)
const isCredit    = (type)  => ['income', 'receivable_receipt', 'debt'].includes(type);

const PAGE_SIZE = 20;

function TxTypeGuide({ type }) {
  const found = ALL_TX_TYPES.find(t => t.value === type);
  if (!found) return null;
  const Icon = found.icon;
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs shadow-sm ${found.color}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>
        <span className="font-bold text-[13px] block mb-0.5">{found.label}</span>
        <span className="opacity-90">{found.desc}</span>
      </div>
    </div>
  );
}

export default function Transaksi() {
  const { user } = useAuth();
  const uid = user?.id;
  const { hasModule } = useUserRole();

  const TX_TYPES = ALL_TX_TYPES.filter(t => !t.module || hasModule(t.module));

  const availableCurrencies = useMemo(() => {
    try {
      const custom = JSON.parse(localStorage.getItem('fincat_custom_currencies') || '[]');
      return [...new Set(['IDR', ...custom.map(c => c.code).filter(Boolean)])];
    } catch { return ['IDR']; }
  }, []);

  const qc = useQueryClient();
  const [filters, setFilters] = useState({ year: String(currentYear), month: String(currentMonth), currency: '', account: '' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState({ open: false, type: 'save', title: '', desc: '', onConfirm: null, loading: false });

  const emptyForm = {
    date: new Date().toISOString().slice(0, 10),
    type: 'expense', category_id: '', category_name: '', account_id: '', account_name: '',
    amount: '', currency: 'IDR', description: '', reference: '',
    destination_account_id: '', destination_account_name: '',
    related_id: '', related_type: '', creditor_name: '', debtor_name: '', due_date: '', interest_rate: ''
  };
  const [form, setForm] = useState(emptyForm);

  const { data: transactions = [] } = useQuery({ queryKey: ['transactions', uid], queryFn: () => uid ? Transaction.list({ sort_by: 'date', sort_order: 'desc', limit: 1000 }) : [], enabled: !!uid, staleTime: 60000 });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts', uid], queryFn: () => uid ? Account.list() : [], enabled: !!uid });
  const { data: categories = [] } = useQuery({ queryKey: ['categories', uid], queryFn: () => uid ? Category.list() : [], enabled: !!uid });
  const { data: debts = [] } = useQuery({ queryKey: ['debts', uid], queryFn: () => uid ? Debt.list() : [], enabled: !!uid });
  const { data: receivables = [] } = useQuery({ queryKey: ['receivables', uid], queryFn: () => uid ? Receivable.list() : [], enabled: !!uid });
  const { data: savingTargets = [] } = useQuery({ queryKey: ['saving_targets', uid], queryFn: () => uid ? SavingTarget.list({ filters: [{ field: 'status', operator: 'eq', value: 'active' }] }) : [], enabled: !!uid });

  const filteredTxs = useMemo(() => {
    // Jika rentang tanggal di-set, bypass filter year/month
    let txs;
    if (dateFrom || dateTo) {
      txs = transactions.filter(t => {
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;
        return true;
      });
    } else {
      txs = filterTransactionsByPeriod(transactions, filters.year, filters.month);
    }

    if (filters.currency) txs = txs.filter(t => t.currency === filters.currency);
    if (filters.account) txs = txs.filter(t => t.account_id === filters.account);
    if (typeFilter) txs = txs.filter(t => t.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter(t => (t.description || '').toLowerCase().includes(q) || (t.category_name || '').toLowerCase().includes(q) || (t.account_name || '').toLowerCase().includes(q) || (t.creditor_name || '').toLowerCase().includes(q) || (t.debtor_name || '').toLowerCase().includes(q));
    }
    txs = [...txs].sort((a, b) => {
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (b.created_date || '').localeCompare(a.created_date || '');
    });
    return txs;
  }, [transactions, filters, dateFrom, dateTo, typeFilter, search]);

  const totalPages = Math.ceil(filteredTxs.length / PAGE_SIZE);
  const paginated = filteredTxs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeDebts = debts.filter(d => d.status === 'active');
  const activeReceivables = receivables.filter(r => r.status === 'active');

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...emptyForm, ...t, amount: String(t.amount) }); setShowDialog(true); };

  const handleSave = () => {
    const amount = parseFloat(form.amount) || 0;
    if (!form.amount || amount <= 0) { toast.error('Nominal harus lebih dari 0'); return; }
    if (!form.account_id) { toast.error('Pilih akun terlebih dahulu'); return; }
    if (!form.date) { toast.error('Tanggal harus diisi'); return; }
    if (form.type === 'debt' && !form.creditor_name) { toast.error('Nama pemberi hutang harus diisi'); return; }
    if (form.type === 'receivable' && !form.debtor_name) { toast.error('Nama peminjam harus diisi'); return; }
    if (['debt_payment', 'receivable_receipt', 'saving'].includes(form.type) && !form.related_id) { toast.error('Pilih data terkait terlebih dahulu'); return; }
    const payload = { ...form, amount, interest_rate: parseFloat(form.interest_rate) || 0, operation_key: editing ? form.operation_key : crypto.randomUUID() };
    setConfirm({
      open: true,
      type: editing ? 'update' : 'save',
      title: editing ? 'Simpan Perubahan Transaksi?' : 'Catat Transaksi Baru?',
      desc: `${getTypeLabel(form.type)} sebesar ${formatCurrency(amount, form.currency)} ${form.description ? `— "${form.description}"` : ''}`,
      loading: false,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        try {
          if (editing) {
            await Transaction.update(editing.id, payload);
          } else {
            await Transaction.create(payload);
          }
          ['transactions', 'accounts', 'debts', 'receivables', 'saving_targets'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
          if (editing) {
            toast.success('Transaksi berhasil diperbarui');
            logUpdate('transaksi', `transaksi ${payload.category_name || ''} diperbarui`, editing, payload);
          } else {
            toast.success('Transaksi berhasil dicatat');
            logCreate('transaksi', `${payload.type} ${payload.category_name || ''} ${formatCurrency(payload.amount, payload.currency)}`);
          }
          setShowDialog(false);
        } catch (err) {
          toast.error(err?.response?.data?.error || err?.message || 'Gagal menyimpan transaksi');
        } finally {
          setConfirm(c => ({ ...c, open: false, loading: false }));
        }
      },
    });
  };

  const handleDelete = (tx) => {
    const extra = tx.type === 'debt' ? ' (Entri Hutang terkait JUGA AKAN DIHAPUS)' :
                  tx.type === 'receivable' ? ' (Entri Piutang terkait JUGA AKAN DIHAPUS)' :
                  tx.type === 'saving' ? ' (Progres tabungan dikurangi)' :
                  tx.type === 'debt_payment' ? ' (Sisa hutang dipulihkan)' :
                  tx.type === 'receivable_receipt' ? ' (Sisa piutang dipulihkan)' :
                  tx.type === 'transfer' ? ' (Pasangan transfer juga dibatalkan)' : '';
    setConfirm({
      open: true, type: 'delete', title: 'Hapus Transaksi?',
      desc: `${getTypeLabel(tx.type)} ${formatCurrency(tx.amount || 0, tx.currency)} akan dihapus permanen.${extra}`,
      loading: false,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        try {
          await Transaction.delete(tx.id);
          ['transactions', 'accounts', 'debts', 'receivables', 'saving_targets'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
          toast.success('Transaksi berhasil dihapus');
          logDelete('transaksi', `${tx.type} ${formatCurrency(tx.amount, tx.currency)}`);
        } catch (err) {
          toast.error(err?.response?.data?.error || err?.message || 'Gagal menghapus transaksi');
        } finally {
          setConfirm(c => ({ ...c, open: false, loading: false }));
        }
      },
    });
  };

  const acctObj = accounts.find(a => a.id === form.account_id);
  const amt = parseFloat(form.amount) || 0;
  const isDebit = !isCredit(form.type);
  const insufficient = isDebit && acctObj && amt > 0 && amt > (acctObj.current_balance || 0);

  const selectedDebt = form.type === 'debt_payment' && form.related_id ? activeDebts.find(d => d.id === form.related_id) : null;
  const selectedReceivable = form.type === 'receivable_receipt' && form.related_id ? activeReceivables.find(r => r.id === form.related_id) : null;
  const overPayDebt = selectedDebt && amt > 0 && amt > (selectedDebt.remaining_amount || 0);
  const overPayReceivable = selectedReceivable && amt > 0 && amt > (selectedReceivable.remaining_amount || 0);
  const isOverPay = overPayDebt || overPayReceivable;

  const catFiltered = categories.filter(c => {
    if (form.type === 'income') return c.type === 'income';
    if (form.type === 'expense') return c.type === 'expense';
    return true;
  });

  return (
    <div className="space-y-6 stagger">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <CreditCard className="w-6 h-6 text-sky-400" />
            </div>
            Transaksi Keuangan
          </h1>
          <p className="text-white/60 text-sm mt-1.5 font-medium ml-12">Pusat pencatatan mutasi harian dan analisis cash flow Anda.</p>
        </div>
        <Button onClick={openCreate} size="lg" className="bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-lg shadow-sky-500/20 relative z-10 w-full sm:w-auto">
          <Plus size={18} className="mr-2" /> Catat Transaksi
        </Button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card rounded-2xl border border-border px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <CalendarIcon size={14} className="text-primary" />
            <span className="text-xs font-bold text-foreground">Filter Periode</span>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
              className={`px-3 py-1.5 transition-all ${!dateFrom && !dateTo ? 'bg-primary text-white' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}
            >
              Bulan/Tahun
            </button>
            <button
              onClick={() => { if (!dateFrom && !dateTo) { const today = new Date().toISOString().slice(0,10); setDateFrom(today); setDateTo(today); setPage(1); } }}
              className={`px-3 py-1.5 transition-all ${(dateFrom || dateTo) ? 'bg-primary text-white' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}
            >
              Rentang Tanggal
            </button>
          </div>

          {/* Bulan/Tahun mode */}
          {!dateFrom && !dateTo && (
            <div className="flex items-center gap-2">
              <select
                value={filters.month}
                onChange={e => { setFilters(f => ({ ...f, month: e.target.value })); setPage(1); }}
                className="h-8 text-xs rounded-lg border border-border bg-background px-2 focus:ring-1 focus:ring-primary"
              >
                <option value="">Semua Bulan</option>
                {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((m,i) => (
                  <option key={i+1} value={String(i+1)}>{m}</option>
                ))}
              </select>
              <select
                value={filters.year}
                onChange={e => { setFilters(f => ({ ...f, year: e.target.value })); setPage(1); }}
                className="h-8 text-xs rounded-lg border border-border bg-background px-2 focus:ring-1 focus:ring-primary"
              >
                {Array.from({ length: 6 }, (_, i) => currentYear - i).map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Rentang tanggal mode */}
          {(dateFrom || dateTo) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Dari</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="h-8 text-xs w-36 rounded-lg"
              />
              <span className="text-xs text-muted-foreground font-semibold">Sampai</span>
              <Input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="h-8 text-xs w-36 rounded-lg"
              />
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-red-500 hover:bg-red-50 rounded-lg"
                onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}>
                <X size={12} className="mr-1" /> Reset
              </Button>
            </div>
          )}

          {/* Result count */}
          <span className={`text-xs font-bold ml-auto ${(dateFrom || dateTo) ? 'text-primary' : 'text-muted-foreground'}`}>
            {filteredTxs.length} transaksi
          </span>
        </div>
      </div>

      {/* Summary Row */}
      <TxSummaryBar transactions={filteredTxs} />

      {/* Search & Type filter */}
      <div className="flex flex-wrap gap-3 items-center bg-card rounded-2xl border border-border p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10 h-10 text-sm rounded-xl border-border bg-muted/20" placeholder="Cari deskripsi, kategori, akun..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setTypeFilter(''); setPage(1); }} className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${typeFilter === '' ? 'bg-[#0D4F6D] text-white shadow-md' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}>Semua</button>
          {TX_TYPES.map(t => (
            <button key={t.value} onClick={() => { setTypeFilter(typeFilter === t.value ? '' : t.value); setPage(1); }}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all border ${typeFilter === t.value ? `${t.color} shadow-sm ring-1 ring-current` : 'bg-transparent border-border hover:bg-muted/50 text-muted-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Saldo Rekening dg Logo Bank */}
      {accounts.filter(a => a.is_active !== false).length > 0 && (
        <SectionCard title="Saldo Rekening & Dompet" subtitle="Real-time balance">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {accounts.filter(a => a.is_active !== false).map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow">
                <AccountLogo account={a} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-muted-foreground truncate uppercase tracking-wide">{a.name}</p>
                  <p className={`font-heading font-black text-sm tracking-tight truncate ${(a.current_balance || 0) >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                    {formatCurrency(a.current_balance || 0, a.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Table Premium */}
      <SectionCard 
        title="Mutasi Terakhir" 
        subtitle="Riwayat transaksi diurutkan dari yang terbaru"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-premium">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Tanggal', 'Jenis', 'Kategori / Referensi', 'Akun', 'Deskripsi', 'Nominal', ''].map(h => (
                  <th key={h} className="text-left px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <List size={24} className="opacity-40" />
                  </div>
                  <p className="text-base font-semibold text-foreground mb-1">Belum ada transaksi</p>
                  <p className="text-sm opacity-80">Catat transaksi pertama Anda untuk periode ini.</p>
                </td></tr>
              ) : paginated.map((t, i) => {
                const isTransferIn  = t.type === 'transfer' && t.reference === 'TRANSFER-IN';
                const isTransferOut = t.type === 'transfer' && t.reference === 'TRANSFER-OUT';
                const credit = t.type === 'transfer' ? isTransferIn : isCredit(t.type);
                const txLabel = t.type === 'transfer' ? (isTransferIn ? 'Transfer Masuk' : 'Transfer Keluar') : getTypeLabel(t.type);
                const txColor = t.type === 'transfer' ? (isTransferIn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-violet-50 text-violet-700 border-violet-200') : getTypeColor(t.type).replace('100', '50');
                const relatedInfo = t.type === 'debt' ? t.creditor_name : t.type === 'receivable' ? t.debtor_name : t.type === 'debt_payment' && t.related_id ? debts.find(d => d.id === t.related_id)?.creditor_name : t.type === 'receivable_receipt' && t.related_id ? receivables.find(r => r.id === t.related_id)?.debtor_name : null;
                const txAccount = accounts.find(a => a.id === t.account_id);

                return (
                  <tr key={t.id} className="interactive-row group">
                    <td className="px-5 py-4">
                      <span className="font-semibold text-foreground">{formatDate(t.date).split(' ')[0]}</span>
                      <span className="text-muted-foreground ml-1">{formatDate(t.date).substring(3)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 border ${txColor}`}>{txLabel}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {t.type === 'transfer' ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isTransferOut ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{t.account_name || '—'}</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-foreground">{t.category_name || relatedInfo || '—'}</p>
                          {relatedInfo && t.category_name !== relatedInfo && <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{relatedInfo}</p>}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {t.type !== 'transfer' && txAccount && <AccountLogo account={txAccount} size={24} />}
                        <span className="text-xs font-semibold text-muted-foreground">
                          {t.type === 'transfer' ? (
                            <span className={isTransferOut ? 'text-red-500' : 'text-emerald-600'}>{isTransferOut ? '→ Keluar' : '← Masuk'}</span>
                          ) : t.account_name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[200px] truncate text-xs text-muted-foreground">
                      {t.description || '—'}
                    </td>
                    <td className={`px-5 py-4 font-heading font-black tracking-tight text-sm whitespace-nowrap ${credit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {credit ? '+' : '−'}{formatCurrency(t.amount || 0, t.currency)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => openEdit(t)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20" onClick={() => handleDelete(t)}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-border bg-muted/10 gap-3">
            <span className="text-xs font-semibold text-muted-foreground">Halaman {page} dari {totalPages} · Total {filteredTxs.length} transaksi</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const p = page <= 3 ? i + 1 : page - 2 + i; if (p < 1 || p > totalPages) return null; return <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" className={`h-8 w-8 text-xs rounded-xl p-0 ${page === p ? 'bg-primary text-white shadow-md' : ''}`} onClick={() => setPage(p)}>{p}</Button>; })}
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Add/Edit Dialog — Premium 2 Column Layout */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card rounded-3xl border border-border shadow-2xl">
          <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
            
            {/* Left Column: Flow & Summary */}
            <div className="w-full md:w-[320px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-6 text-white shrink-0 flex flex-col relative overflow-hidden">
              <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4 border border-white/10 backdrop-blur-md">
                  <CreditCard className="w-5 h-5 text-sky-400" />
                </div>
                <h2 className="text-xl font-heading font-bold">{editing ? 'Edit Transaksi' : 'Catat Transaksi'}</h2>
                <p className="text-white/60 text-xs mt-1 leading-relaxed">Catat mutasi dengan presisi. Pastikan akun dan nominal sudah benar.</p>
              </div>

              <div className="relative z-10 flex-1">
                <TxTypeGuide type={form.type} />
                
                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">Preview Saldo</p>
                    {acctObj ? (
                      <div>
                        <p className="text-white font-semibold text-sm">{acctObj.name}</p>
                        <p className="text-white/60 text-xs mt-0.5 line-through decoration-white/30">{formatCurrency(acctObj.current_balance || 0, acctObj.currency)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`font-heading font-bold text-lg ${isCredit(form.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency((acctObj.current_balance || 0) + (isCredit(form.type) ? amt : -amt), acctObj.currency)}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isCredit(form.type) ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                            {isCredit(form.type) ? '+' : '-'}{formatCompact(amt)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 italic">Pilih akun terlebih dahulu</p>
                    )}
                  </div>

                  {insufficient && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300 leading-relaxed font-medium">Saldo {acctObj?.name} tidak mencukupi untuk transaksi ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Input Form */}
            <div className="flex-1 p-6 md:p-8 bg-card overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                
                {/* 1. Jenis & Tanggal */}
                <div className="col-span-full">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">1. Detail Utama</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Jenis Transaksi <span className="text-red-500">*</span></Label>
                      <Select value={form.type} onValueChange={v => setForm({ ...emptyForm, ...form, type: v, category_id: '', category_name: '', related_id: '', related_type: '', creditor_name: '', debtor_name: '' })}>
                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TX_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}><span className="font-semibold">{t.label}</span></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Tanggal <span className="text-red-500">*</span></Label>
                      <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="h-10 rounded-xl" />
                    </div>
                  </div>
                </div>

                {/* 2. Type Specific / Kategori */}
                <div className="col-span-full">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">2. Relasi & Kategori</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Debt / Receivable specific */}
                    {(form.type === 'debt' || form.type === 'receivable') && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">{form.type === 'debt' ? 'Pemberi Hutang' : 'Peminjam'} <span className="text-red-500">*</span></Label>
                          <Input value={form.type === 'debt' ? form.creditor_name : form.debtor_name} onChange={e => setForm({ ...form, [form.type === 'debt' ? 'creditor_name' : 'debtor_name']: e.target.value })} placeholder="Nama pihak terkait" className="h-10 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Jatuh Tempo</Label>
                          <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="h-10 rounded-xl" />
                        </div>
                        {form.type === 'receivable' && (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold">Bunga Bulanan (%)</Label>
                            <Input type="number" value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} placeholder="0" step="0.01" className="h-10 rounded-xl" />
                          </div>
                        )}
                      </>
                    )}

                    {/* Selector for Payment/Receipt/Saving */}
                    {form.type === 'debt_payment' && (
                      <div className="col-span-full space-y-1.5">
                        <Label className="text-xs font-bold">Hutang yang Dibayar <span className="text-red-500">*</span></Label>
                        <Select value={form.related_id} onValueChange={v => { const d = activeDebts.find(d => d.id === v); setForm({ ...form, related_id: v, related_type: 'debt', category_name: d?.creditor_name || '', currency: d?.currency || form.currency }); }}>
                          <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih hutang aktif..." /></SelectTrigger>
                          <SelectContent>
                            {activeDebts.map(d => <SelectItem key={d.id} value={d.id}><span className="font-bold">{d.creditor_name}</span> - Sisa {formatCurrency(d.remaining_amount, d.currency)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {form.type === 'receivable_receipt' && (
                      <div className="col-span-full space-y-1.5">
                        <Label className="text-xs font-bold">Piutang yang Diterima <span className="text-red-500">*</span></Label>
                        <Select value={form.related_id} onValueChange={v => { const r = activeReceivables.find(r => r.id === v); setForm({ ...form, related_id: v, related_type: 'receivable', category_name: r?.debtor_name || '', currency: r?.currency || form.currency }); }}>
                          <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih piutang aktif..." /></SelectTrigger>
                          <SelectContent>
                            {activeReceivables.map(r => <SelectItem key={r.id} value={r.id}><span className="font-bold">{r.debtor_name}</span> - Sisa {formatCurrency(r.remaining_amount, r.currency)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {form.type === 'saving' && (
                      <>
                        <div className="col-span-full space-y-1.5">
                          <Label className="text-xs font-bold">Target Tabungan <span className="text-red-500">*</span></Label>
                          <Select value={form.related_id} onValueChange={v => { const s = savingTargets.find(s => s.id === v); setForm({ ...form, related_id: v, related_type: 'saving_target', category_name: s?.name || '', currency: s?.currency || form.currency }); }}>
                            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih target..." /></SelectTrigger>
                            <SelectContent>
                              {savingTargets.map(s => <SelectItem key={s.id} value={s.id}><span className="font-bold">{s.name}</span></SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-full space-y-1.5">
                          <Label className="text-xs font-bold flex items-center gap-1.5">
                            <PiggyBank size={12} className="text-indigo-500" />
                            Rekening Tujuan Tabungan
                            <span className="text-[10px] text-muted-foreground font-normal">(opsional — rekening yang menampung dana tabungan)</span>
                          </Label>
                          <Select value={form.destination_account_id || ''} onValueChange={v => { const a = accounts.find(a => a.id === v); setForm({ ...form, destination_account_id: v, destination_account_name: a?.name || '' }); }}>
                            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih rekening tujuan..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={null}>— Tidak ada rekening tujuan —</SelectItem>
                              {accounts.filter(a => a.id !== form.account_id).map(a => (
                                <SelectItem key={a.id} value={a.id}>
                                  <span className="font-bold">{a.name}</span>
                                  <span className="text-[10px] text-muted-foreground ml-2">{formatCurrency(a.current_balance || 0, a.currency)}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.destination_account_id && (
                            <p className="text-[10px] text-indigo-600 font-medium">
                              💡 Saldo rekening <b>{form.destination_account_name}</b> akan bertambah sebesar {formatCurrency(parseFloat(form.amount) || 0, form.currency)}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Standard Category */}
                    {!['debt', 'receivable', 'debt_payment', 'receivable_receipt', 'saving'].includes(form.type) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Kategori</Label>
                        <Select value={form.category_id} onValueChange={v => { const c = categories.find(c => c.id === v); setForm({ ...form, category_id: v, category_name: c?.name || '' }); }}>
                          <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                          <SelectContent>
                            {catFiltered.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Account & Amount */}
                <div className="col-span-full">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">3. Keuangan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Akun Sumber <span className="text-red-500">*</span></Label>
                      <Select value={form.account_id} onValueChange={v => { const a = accounts.find(a => a.id === v); setForm({ ...form, account_id: v, account_name: a?.name || '', currency: a?.currency || form.currency }); }}>
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue placeholder="Pilih akun..." />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{a.name}</span>
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">{a.currency}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Nominal <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-muted-foreground font-bold text-sm">{form.currency}</span>
                        </div>
                        <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="h-10 pl-12 rounded-xl font-heading font-bold text-lg" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Deskripsi */}
                <div className="col-span-full">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">4. Catatan</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Deskripsi</Label>
                      <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Catatan singkat transaksi..." className="rounded-xl resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">No. Referensi (opsional)</Label>
                      <Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="e.g. TXN-001" className="h-10 rounded-xl" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Error messages */}
              {isOverPay && (
                <div className="mt-6 flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-bold shadow-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p>Nominal Melebihi Sisa!</p>
                    <p className="text-xs font-medium opacity-80 mt-0.5">Tidak bisa membayar lebih dari jumlah hutang/piutang yang tersisa.</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl px-6 h-11">Batal</Button>
                <Button onClick={handleSave} disabled={insufficient || isOverPay || !form.amount} className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-8 h-11 font-bold shadow-lg shadow-sky-500/20">
                  {editing ? 'Simpan Perubahan' : 'Catat Transaksi'}
                </Button>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={confirm.open} onOpenChange={v => setConfirm(c => ({ ...c, open: v }))} title={confirm.title} description={confirm.desc} type={confirm.type} onConfirm={confirm.onConfirm} loading={confirm.loading} />
    </div>
  );
}