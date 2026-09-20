import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Account, Transaction } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Landmark, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Search, Wallet, ChevronRight, Upload, X as XIcon } from 'lucide-react';
import SectionCard from '@/components/ui/SectionCard';
import KpiCard from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatCompact, formatDate } from '@/lib/utils/finance';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { BANKS, BANK_CATEGORIES, getBankByName } from '@/lib/bankData';
import AccountLogo from '@/components/ui/AccountLogo';
import BankBalanceChart from '@/components/charts/BankBalanceChart';

const ACCOUNT_COLORS = ['#0D4F6D', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#06B6D4'];

// Bank logo component — shows custom icon, bank logo, or fallback initial
function BankLogo({ bank, size = 40, accountName = '', customIcon = '' }) {
  const color = bank?.color || '#0D4F6D';
  const initial = (bank?.name || accountName || '?')[0].toUpperCase();
  const [imgError, setImgError] = useState(false);

  const containerStyle = {
    width: size, height: size,
    background: '#ffffff',
    border: `1.5px solid ${color}40`,
    boxShadow: `0 2px 8px ${color}25`,
    borderRadius: size * 0.28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  };

  const logoSrc = customIcon || bank?.logo;

  if (logoSrc && !imgError) {
    return (
      <div style={containerStyle}>
        <img
          src={logoSrc}
          alt={bank?.name || accountName}
          style={{ width: '85%', height: '85%', objectFit: 'contain' }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
      <span style={{ fontSize: size * 0.38, color: '#fff', fontWeight: 700 }}>{initial}</span>
    </div>
  );
}

// Premium bank card design
function AccountCard({ account, selected, onClick, onEdit, onDelete, index }) {
  // Cari bank: exact match dulu via getBankByName, lalu exact id match, lalu skip fallback agar tidak salah logo
  const nameLower = account.name?.toLowerCase() || '';
  const bankData = getBankByName(account.name)
    || BANKS.find(b => nameLower === b.name.toLowerCase() || nameLower === b.fullName.toLowerCase())
    || BANKS.find(b => b.name.length > 3 && nameLower.startsWith(b.name.toLowerCase()))
    || null;
  const cardColor = account.color || ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
  const balance = account.current_balance || 0;
  const change = balance - (account.initial_balance || 0);
  const changePct = account.initial_balance > 0 ? ((change / account.initial_balance) * 100) : 0;
  const isPositive = change >= 0;

  return (
    <div
      className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group ${selected ? 'ring-2 ring-offset-2 shadow-2xl scale-[1.02]' : 'hover:shadow-2xl hover:scale-[1.01]'}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${cardColor}f0 0%, ${cardColor}b0 55%, ${cardColor}80 100%)`,
        boxShadow: selected ? `0 24px 48px ${cardColor}55, 0 0 0 2px ${cardColor}80` : `0 8px 32px ${cardColor}30`,
        ringColor: cardColor,
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
      {/* Shimmer overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)' }} />

      <div className="relative z-10 p-5">
        {/* Header: Logo + Name + Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <BankLogo bank={bankData} size={40} accountName={account.name} customIcon={account.icon} />
            <div>
              <p className="text-white font-heading font-bold text-sm leading-tight">{account.name}</p>
              <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white/80 tracking-wider">{account.currency}</span>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-7 h-7 rounded-xl bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all backdrop-blur-sm"
              onClick={e => { e.stopPropagation(); onEdit(); }}>
              <Pencil size={11} className="text-white" />
            </button>
            <button className="w-7 h-7 rounded-xl bg-white/15 hover:bg-red-500/50 flex items-center justify-center transition-all backdrop-blur-sm"
              onClick={e => { e.stopPropagation(); onDelete(); }}>
              <Trash2 size={11} className="text-white" />
            </button>
          </div>
        </div>

        {/* Balance — main focus */}
        <div className="mb-4">
          <p className="text-white/55 text-[10px] font-semibold uppercase tracking-[0.15em] mb-1">Saldo Saat Ini</p>
          <p className="text-white font-heading font-black text-2xl leading-none tracking-tight">
            {formatCurrency(balance, account.currency)}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15 mb-3" />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-white/45 text-[9px] uppercase tracking-wide mb-0.5">Saldo Awal</p>
            <p className="text-white/80 text-xs font-semibold">{formatCompact(account.initial_balance || 0)}</p>
          </div>
          <div>
            <p className="text-white/45 text-[9px] uppercase tracking-wide mb-0.5">Perubahan</p>
            <p className={`text-xs font-bold ${isPositive ? 'text-emerald-300' : 'text-red-300'}`}>
              {isPositive ? '+' : ''}{formatCompact(change)}
            </p>
          </div>
          <div>
            <p className="text-white/45 text-[9px] uppercase tracking-wide mb-0.5">% Perubahan</p>
            <p className={`text-xs font-bold ${isPositive ? 'text-emerald-300' : 'text-red-300'}`}>
              {isPositive ? '+' : ''}{changePct.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className="mt-3 flex items-center gap-1.5 text-white/70 text-[10px] font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Lihat mutasi di bawah
          </div>
        )}
      </div>
    </div>
  );
}

export default function SaldoAkun() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id;
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankSearch, setBankSearch] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [form, setForm] = useState({ name: '', currency: 'IDR', initial_balance: '0', current_balance: '0', color: '#0D4F6D', icon: '', account_number: '', account_holder_name: '' });
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, type: 'save', title: '', desc: '', onConfirm: null, loading: false });

  const availableCurrencies = useMemo(() => {
    try {
      const custom = JSON.parse(localStorage.getItem('fincat_custom_currencies') || '[]');
      return ['IDR', ...custom.map(c => c.code).filter(Boolean)].filter((v, i, a) => a.indexOf(v) === i);
    } catch { return ['IDR']; }
  }, []);

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts', uid], queryFn: () => uid ? Account.list() : [], enabled: !!uid });
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions', uid], queryFn: () => uid ? Transaction.list() : [], enabled: !!uid });

  const totalByCurrency = useMemo(() => {
    const byCurrency = {};
    accounts.filter(a => a.is_active !== false).forEach(a => {
      const c = a.currency || 'IDR';
      byCurrency[c] = (byCurrency[c] || 0) + (a.current_balance || 0);
    });
    return byCurrency;
  }, [accounts]);

  const accountTxs = useMemo(() => {
    if (!selectedAccount) return [];
    return transactions.filter(t => t.account_id === selectedAccount.id).slice(0, 100);
  }, [transactions, selectedAccount]);

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return BANKS;
    return BANKS.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.fullName.toLowerCase().includes(bankSearch.toLowerCase()));
  }, [bankSearch]);

  const bankGroups = useMemo(() => {
    const groups = {};
    filteredBanks.forEach(b => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });
    return groups;
  }, [filteredBanks]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `accounts/${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from('uploads').upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      setForm(f => ({ ...f, icon: urlData.publicUrl }));
    } catch { } finally {
      setLogoUploading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setSelectedBank(null);
    setBankSearch('');
    setForm({ name: '', currency: 'IDR', initial_balance: '0', current_balance: '0', color: '#0D4F6D', icon: '', account_number: '', account_holder_name: '' });
    setShowDialog(true);
  };
  
  const openEdit = (a) => {
    setEditing(a);
    const bankData = getBankByName(a.name);
    setSelectedBank(bankData || null);
    setForm({ ...a, initial_balance: String(a.initial_balance || 0), current_balance: String(a.current_balance || 0), icon: a.icon || '', account_number: a.account_number || '', account_holder_name: a.account_holder_name || '' });
    setShowDialog(true);
  };

  const selectBank = (bank) => {
    setSelectedBank(bank);
    setForm(f => ({ ...f, name: bank.fullName || bank.name, color: bank.color || f.color }));
    setBankSearch('');
  };

  const doSave = async () => {
    const payload = {
      ...form,
      initial_balance: parseFloat(form.initial_balance) || 0,
      current_balance: parseFloat(form.current_balance) || 0,
    };
    setConfirm(c => ({ ...c, loading: true }));
    if (editing) await Account.update(editing.id, payload);
    else await Account.create(payload);
    qc.invalidateQueries({ queryKey: ['accounts', uid] });
    setConfirm(c => ({ ...c, open: false, loading: false }));
    setShowDialog(false);
  };

  const handleSave = () => {
    setConfirm({
      open: true,
      type: editing ? 'update' : 'save',
      title: editing ? 'Simpan Perubahan Akun?' : 'Tambah Akun Baru?',
      desc: `Apakah Anda yakin ingin ${editing ? 'menyimpan perubahan pada' : 'menambahkan'} akun "${form.name}"?`,
      onConfirm: doSave,
      loading: false,
    });
  };

  const handleDelete = (id, name) => {
    setConfirm({
      open: true,
      type: 'delete',
      title: 'Hapus Akun?',
      desc: `Akun "${name}" akan dihapus permanen. Transaksi terkait tidak akan terhapus.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, loading: true }));
        await Account.delete(id);
        qc.invalidateQueries({ queryKey: ['accounts', uid] });
        if (selectedAccount?.id === id) setSelectedAccount(null);
        setConfirm(c => ({ ...c, open: false, loading: false }));
      },
      loading: false,
    });
  };

  const txTypeLabel = { income: 'Pendapatan', expense: 'Pengeluaran', saving: 'Tabungan', debt_payment: 'Bayar Hutang', receivable_receipt: 'Terima Piutang', transfer: 'Transfer' };
  const txTypeColor = { income: 'text-emerald-600', expense: 'text-red-500', saving: 'text-indigo-600', debt_payment: 'text-amber-600', receivable_receipt: 'text-teal-600' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Saldo Bank
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Kelola semua rekening & pantau saldo real-time</p>
        </div>
        <Button onClick={openCreate} className="bg-[#0D4F6D] hover:bg-[#0a3d55] shadow-md">
          <Plus size={15} className="mr-1.5" /> Tambah Akun
        </Button>
      </div>

      {/* Total by currency */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(totalByCurrency).map(([currency, total], i) => (
          <KpiCard key={currency} title={`Total ${currency}`} value={formatCompact(total, currency)} icon={Landmark}
            color={i === 0 ? 'navy' : i === 1 ? 'emerald' : 'indigo'} />
        ))}
        {Object.keys(totalByCurrency).length === 0 && (
          <KpiCard title="Total IDR" value="Rp 0" icon={Landmark} color="navy" />
        )}
        <KpiCard title="Jumlah Akun" value={accounts.length} icon={Wallet} color="teal" />
      </div>

      <SectionCard title="Distribusi Saldo Bank" subtitle="Perbandingan saldo rekening aktif secara real-time">
        <BankBalanceChart accounts={accounts} />
      </SectionCard>

      {/* Account Cards grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Daftar Rekening</h2>
          <span className="text-xs text-muted-foreground">{accounts.length} rekening · Klik untuk lihat mutasi</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.filter(a => a.is_active !== false).map((a, i) => (
            <AccountCard
              key={a.id}
              account={a}
              index={i}
              selected={selectedAccount?.id === a.id}
              onClick={() => setSelectedAccount(selectedAccount?.id === a.id ? null : a)}
              onEdit={() => openEdit(a)}
              onDelete={() => handleDelete(a.id, a.name)}
            />
          ))}

          {accounts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border">
              <Landmark size={48} className="mb-3 opacity-20" />
              <p className="text-sm mb-1 font-medium">Belum ada rekening</p>
              <p className="text-xs opacity-60 mb-4">Tambahkan rekening bank atau e-wallet pertama Anda</p>
              <Button onClick={openCreate} variant="outline" size="sm">
                <Plus size={13} className="mr-1.5" /> Tambah Rekening
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction history for selected account */}
      {selectedAccount && (
        <SectionCard
          title={
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" />
              Mutasi: {selectedAccount.name}
            </div>
          }
          subtitle={`${accountTxs.length} transaksi terkini`}
          noPadding
        >
          {accountTxs.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Belum ada transaksi di rekening ini</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Nominal'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accountTxs.map((t, i) => (
                    <tr key={t.id || i} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(t.date)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${t.type === 'income' || t.type === 'receivable_receipt' ? 'bg-emerald-100 text-emerald-700' : t.type === 'saving' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}`}>
                          {txTypeLabel[t.type] || t.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.category_name || '—'}</td>
                      <td className="px-4 py-3 text-xs max-w-40 truncate">{t.description || '—'}</td>
                      <td className={`px-4 py-3 font-semibold text-sm ${txTypeColor[t.type] || ''}`}>
                        {t.type === 'income' || t.type === 'receivable_receipt' ? '+' : '—'}
                        {formatCurrency(t.amount || 0, t.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-foreground font-heading font-bold text-lg flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet size={15} className="text-primary" />
              </div>
              {editing ? 'Edit Rekening' : 'Tambah Rekening Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Bank Picker (only for new account) */}
            {!editing && (
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Pilih Bank / Dompet</Label>
                {selectedBank ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2 bg-muted/30 dark:bg-muted/10"
                    style={{ borderColor: selectedBank.color + '50' }}>
                    <BankLogo bank={selectedBank} size={42} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm leading-tight">{selectedBank.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{BANK_CATEGORIES[selectedBank.category]}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedBank.color }} />
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => { setSelectedBank(null); setForm(f => ({ ...f, name: '', color: '#0D4F6D' })); }}>
                        Ganti
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border rounded-2xl overflow-hidden bg-card">
                    <div className="relative p-2 border-b border-border bg-muted/30">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari bank atau e-wallet..."
                        value={bankSearch}
                        onChange={e => setBankSearch(e.target.value)}
                        className="pl-9 h-8 text-xs border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto p-2 space-y-3 bg-card">
                      {Object.entries(bankGroups).map(([cat, banks]) => (
                        <div key={cat}>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5">{BANK_CATEGORIES[cat]}</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {banks.map(bank => (
                              <button
                                key={bank.id}
                                onClick={() => selectBank(bank)}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background hover:bg-muted/50 transition-all text-left border border-border hover:border-primary/30 group"
                              >
                                <BankLogo bank={bank} size={32} />
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-foreground truncate block">{bank.name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate block leading-tight">{bank.fullName !== bank.name ? bank.fullName : <span>&nbsp;</span>}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Nama */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">Nama Rekening</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: BCA - Rekening Gaji"
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Logo Custom */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">Logo Rekening (opsional)</Label>
              {form.icon ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                    <img src={form.icon} alt="logo" className="w-10 h-10 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">Logo berhasil diunggah</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Akan tampil di kartu rekening</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 shrink-0"
                    onClick={() => setForm(f => ({ ...f, icon: '' }))}>
                    <XIcon size={14} />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/10 hover:bg-muted/20 cursor-pointer transition-all">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {logoUploading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{logoUploading ? 'Mengupload...' : 'Upload Logo'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, SVG — maks 2MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                </label>
              )}
            </div>

            {/* Nomor Rekening + Pemilik */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Nomor Rekening</Label>
                <Input
                  value={form.account_number}
                  onChange={e => setForm({ ...form, account_number: e.target.value })}
                  placeholder="Contoh: 1234567890"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Nama Pemilik Rekening</Label>
                <Input
                  value={form.account_holder_name}
                  onChange={e => setForm({ ...form, account_holder_name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Mata uang + Saldo Awal */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Mata Uang</Label>
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availableCurrencies.map(c => <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Saldo Awal</Label>
                <Input
                  type="number"
                  value={form.initial_balance}
                  onChange={e => setForm({ ...form, initial_balance: e.target.value, current_balance: editing ? form.current_balance : e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            {editing && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Saldo Saat Ini</Label>
                <Input
                  type="number"
                  value={form.current_balance}
                  onChange={e => setForm({ ...form, current_balance: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
            )}

            {/* Warna kartu */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Warna Kartu</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  className="h-9 w-12 rounded-lg cursor-pointer border border-border bg-background"
                />
                <div className="flex gap-2 flex-wrap">
                  {ACCOUNT_COLORS.map(c => (
                    <button
                      key={c}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110 focus:outline-none"
                      style={{
                        background: c,
                        boxShadow: form.color === c ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c}` : 'none',
                        border: form.color === c ? `2px solid ${c}` : '2px solid transparent',
                      }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview card */}
            {form.name && (
              <div className="rounded-2xl p-4 text-white relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${form.color}f0, ${form.color}90)`, boxShadow: `0 6px 24px ${form.color}40` }}>
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full border border-white/15 pointer-events-none" />
                <div className="absolute -right-2 bottom-2 w-12 h-12 rounded-full bg-white/5 pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                  {(form.icon || selectedBank?.logo) && (
                    <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center overflow-hidden shrink-0">
                      <img src={form.icon || selectedBank.logo} alt="" className="w-5 h-5 object-contain" />
                    </div>
                  )}
                  <p className="text-white/60 text-[10px] uppercase tracking-[0.15em]">{form.currency}</p>
                </div>
                <p className="font-bold text-base leading-tight mb-1">{form.name}</p>
                <p className="text-white/90 font-black text-xl">{formatCurrency(parseFloat(form.current_balance) || 0, form.currency)}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="border-border text-foreground hover:bg-muted">Batal</Button>
              <Button onClick={handleSave} disabled={!form.name} className="bg-primary hover:bg-primary/90 text-white">Simpan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={v => setConfirm(c => ({ ...c, open: v }))}
        title={confirm.title}
        description={confirm.desc}
        type={confirm.type}
        onConfirm={confirm.onConfirm}
        loading={confirm.loading}
      />
    </div>
  );
}