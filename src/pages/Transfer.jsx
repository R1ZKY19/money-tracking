import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Account, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { ArrowRightLeft, Plus, ArrowRight, ArrowLeft, Wallet, AlertTriangle, TrendingDown, Info, CheckCircle2 } from 'lucide-react';
import SectionCard from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils/finance';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import AccountLogo from '@/components/ui/AccountLogo';

// Compact account card
function AccountMiniCard({ account }) {
  const color = account.color || '#0D4F6D';
  return (
    <div
      className="rounded-xl p-3.5 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${color}ee, ${color}88)`, boxShadow: `0 4px 16px ${color}30` }}
    >
      <div className="absolute -right-3 -top-3 w-12 h-12 rounded-full border-2 border-white/15" />
      <div className="relative z-10 flex items-center gap-2.5">
        <AccountLogo account={account} size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-medium">{account.currency}</p>
          <p className="text-white font-heading font-bold text-sm leading-tight truncate">{account.name}</p>
          <p className="text-white font-bold text-sm mt-0.5">{formatCurrency(account.current_balance || 0, account.currency)}</p>
        </div>
      </div>
    </div>
  );
}

export default function Transfer() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id;
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ from_account_id: '', to_account_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
  const [confirm, setConfirm] = useState({ open: false, loading: false });

  const { data: accounts = [] } = useQuery({ queryKey: ['accounts', uid], queryFn: () => uid ? Account.list() : [], enabled: !!uid });
  const { data: allTransactions = [] } = useQuery({ queryKey: ['transactions', uid], queryFn: () => uid ? Transaction.list() : [], enabled: !!uid });

  // Group transfer pairs: match OUT and IN by description + date + amount
  const transferHistory = useMemo(() => {
    const txs = allTransactions.filter(t => t.type === 'transfer');
    // Group by unique pairs
    const pairs = [];
    const seen = new Set();
    txs.filter(t => t.reference === 'TRANSFER-OUT').forEach(out => {
      if (seen.has(out.id)) return;
      const match = txs.find(t => t.reference === 'TRANSFER-IN' && t.date === out.date && Math.abs(t.amount - out.amount) < 1 && t.description === out.description);
      pairs.push({ out, in: match });
      seen.add(out.id);
      if (match) seen.add(match.id);
    });
    return pairs.sort((a, b) => new Date(b.out.date) - new Date(a.out.date));
  }, [allTransactions]);

  const fromAccount = accounts.find(a => a.id === form.from_account_id);
  const toAccount = accounts.find(a => a.id === form.to_account_id);
  const amount = parseFloat(form.amount) || 0;
  const canTransfer = form.from_account_id && form.to_account_id && form.from_account_id !== form.to_account_id && amount > 0;
  const insufficient = fromAccount && amount > 0 && amount > (fromAccount.current_balance || 0);

  const doTransfer = async () => {
    setConfirm(c => ({ ...c, loading: true }));
    const description = form.description || `Transfer ${fromAccount.name} → ${toAccount.name}`;
    try {
      const operationKey = crypto.randomUUID();
      // Kurangi saldo akun asal
      await Account.update(fromAccount.id, {
        current_balance: (parseFloat(fromAccount.current_balance) || 0) - amount,
      });
      // Tambah saldo akun tujuan
      await Account.update(toAccount.id, {
        current_balance: (parseFloat(toAccount.current_balance) || 0) + amount,
      });
      // Catat transaksi transfer
      await Transaction.create({
        type: 'transfer',
        account_id: fromAccount.id,
        account_name: fromAccount.name,
        destination_account_id: toAccount.id,
        destination_account_name: toAccount.name,
        amount,
        currency: fromAccount.currency,
        date: form.date,
        description,
        operation_key: operationKey,
      });

      qc.invalidateQueries({ queryKey: ['accounts', uid] });
      qc.invalidateQueries({ queryKey: ['transactions', uid] });
      setShowDialog(false);
      setForm({ from_account_id: '', to_account_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
      toast.success(`Transfer ${formatCurrency(amount, fromAccount.currency)} berhasil`);
    } catch (err) {
      toast.error(err?.message || 'Transfer gagal diproses');
    } finally {
      setConfirm({ open: false, loading: false });
    }
  };

  // Total transfer this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransferOut = useMemo(() => allTransactions.filter(t => t.type === 'transfer' && t.reference === 'TRANSFER-OUT' && t.date?.startsWith(thisMonth)).reduce((s, t) => s + (t.amount || 0), 0), [allTransactions, thisMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-primary" />
            Transfer Antar Akun
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Pindahkan saldo antara rekening Anda</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-[#0D4F6D] hover:bg-[#0a3d55] shadow-md">
          <Plus size={14} className="mr-1.5" /> Transfer Baru
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 space-y-0.5">
          <p className="font-semibold">Cara kerja Transfer:</p>
          <p>Saldo akun <strong>asal berkurang</strong> dan saldo akun <strong>tujuan bertambah</strong> secara otomatis. Dua catatan transaksi (Keluar & Masuk) akan dibuat untuk audit trail.</p>
        </div>
      </div>

      {/* Accounts overview */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Semua Rekening</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {accounts.filter(a => a.is_active !== false).map(a => (
            <AccountMiniCard key={a.id} account={a} selected={false} onClick={() => {}} />
          ))}
          {accounts.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-8 text-sm bg-muted/20 rounded-xl border-2 border-dashed border-border">
              <Wallet size={32} className="mx-auto mb-2 opacity-20" />
              Belum ada rekening. Tambah di menu <strong>Saldo Bank</strong>.
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide font-medium">Total Rekening</p>
          <p className="text-2xl font-bold text-foreground mt-1">{accounts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide font-medium">Transfer Bulan Ini</p>
          <p className="text-2xl font-bold text-foreground mt-1">{transferHistory.filter(p => p.out.date?.startsWith(thisMonth)).length}x</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wide font-medium">Volume Bulan Ini</p>
          <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(monthlyTransferOut, 'IDR')}</p>
        </div>
      </div>

      {/* Transfer History */}
      <SectionCard title="Riwayat Transfer" subtitle={`${transferHistory.length} transfer tercatat`} noPadding>
        {transferHistory.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-muted-foreground gap-2">
            <ArrowRightLeft size={40} className="opacity-20" />
            <p className="text-sm font-medium">Belum ada riwayat transfer</p>
            <p className="text-xs opacity-60">Klik "Transfer Baru" untuk memulai</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['#', 'Tanggal', 'Dari', 'Ke', 'Nominal', 'Keterangan'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transferHistory.map((pair, i) => {
                  const fromAcct = accounts.find(a => a.id === pair.out.account_id);
                  const toAcct = accounts.find(a => a.id === pair.in?.account_id);
                  const fromColor = fromAcct?.color || '#0D4F6D';
                  const toColor = toAcct?.color || '#10B981';
                  return (
                    <tr key={pair.out.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground/50 font-mono">{i + 1}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(pair.out.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {fromAcct ? <AccountLogo account={fromAcct} size={28} /> : (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: fromColor }}>{(pair.out.account_name || '?')[0]}</div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-foreground">{pair.out.account_name || '—'}</p>
                            <span className="text-[10px] text-red-500 font-medium">−{formatCurrency(pair.out.amount, pair.out.currency)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {toAcct ? <AccountLogo account={toAcct} size={28} /> : (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: toColor }}>{(pair.in?.account_name || '?')[0]}</div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-foreground">{pair.in?.account_name || '—'}</p>
                            <span className="text-[10px] text-emerald-600 font-medium">+{formatCurrency(pair.in?.amount || 0, pair.in?.currency || 'IDR')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                            <ArrowRightLeft size={11} className="text-blue-600" />
                          </div>
                          <span className="font-bold text-sm text-foreground">{formatCurrency(pair.out.amount, pair.out.currency)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-40 truncate">{pair.out.description || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Transfer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0D4F6D]/10 flex items-center justify-center">
                <ArrowRightLeft size={16} className="text-[#0D4F6D]" />
              </div>
              Transfer Antar Akun
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Tanggal Transfer</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" />
            </div>

            {/* From → To visual */}
            <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/10">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alur Transfer</p>
              <div className="flex items-center gap-3">
                {/* From */}
                <div className="flex-1">
                  <Label className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                    <ArrowLeft size={12} /> Dari Akun (Sumber)
                  </Label>
                  <Select value={form.from_account_id} onValueChange={v => setForm({ ...form, from_account_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih akun asal..." /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id} disabled={a.id === form.to_account_id}>
                          <span className="font-medium">{a.name}</span>
                          <span className="text-muted-foreground text-xs ml-2">{formatCurrency(a.current_balance || 0, a.currency)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fromAccount && (
                    <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                      Saldo saat ini: <strong>{formatCurrency(fromAccount.current_balance || 0, fromAccount.currency)}</strong>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-1 shrink-0 mt-4">
                  <div className="w-8 h-8 rounded-full bg-[#0D4F6D]/10 flex items-center justify-center">
                    <ArrowRightLeft size={14} className="text-[#0D4F6D]" />
                  </div>
                </div>

                {/* To */}
                <div className="flex-1">
                  <Label className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                    <ArrowRight size={12} /> Ke Akun (Tujuan)
                  </Label>
                  <Select value={form.to_account_id} onValueChange={v => setForm({ ...form, to_account_id: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih akun tujuan..." /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id} disabled={a.id === form.from_account_id}>
                          <span className="font-medium">{a.name}</span>
                          <span className="text-muted-foreground text-xs ml-2">{formatCurrency(a.current_balance || 0, a.currency)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {toAccount && (
                    <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
                      Saldo saat ini: <strong>{formatCurrency(toAccount.current_balance || 0, toAccount.currency)}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-xs">Nominal Transfer <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="mt-1 text-lg font-bold" />
              {fromAccount && amount > 0 && !insufficient && (
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo tersisa setelah transfer: <strong className="text-foreground">{formatCurrency((fromAccount.current_balance || 0) - amount, fromAccount.currency)}</strong>
                </p>
              )}
              {insufficient && (
                <div className="mt-1.5 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-300 rounded-lg text-xs text-red-700 font-semibold">
                  <AlertTriangle size={13} className="shrink-0" />
                  Saldo akun asal tidak mencukupi untuk transfer ini
                </div>
              )}
            </div>

            {/* Transfer preview */}
            {canTransfer && !insufficient && amount > 0 && fromAccount && toAccount && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Preview Transfer
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center">
                    <div className="mx-auto mb-1 flex justify-center"><AccountLogo account={fromAccount} size={40} /></div>
                    <p className="text-xs font-semibold text-foreground truncate max-w-20">{fromAccount.name}</p>
                    <p className="text-xs text-red-500 font-bold">−{formatCurrency(amount, fromAccount.currency)}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight size={20} className="text-blue-500" />
                    <span className="text-[10px] text-blue-600 font-semibold">{formatCurrency(amount, fromAccount.currency)}</span>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-1 flex justify-center"><AccountLogo account={toAccount} size={40} /></div>
                    <p className="text-xs font-semibold text-foreground truncate max-w-20">{toAccount.name}</p>
                    <p className="text-xs text-emerald-600 font-bold">+{formatCurrency(amount, toAccount.currency)}</p>
                  </div>
                </div>
                {fromAccount.currency !== toAccount.currency && (
                  <p className="text-[10px] text-amber-600 mt-2 text-center">⚠ Mata uang berbeda ({fromAccount.currency} → {toAccount.currency}). Nominal dicatat sesuai masing-masing rekening.</p>
                )}
              </div>
            )}

            <div>
              <Label className="text-xs">Keterangan (opsional)</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Catatan transfer..." className="mt-1" />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
              <Button onClick={() => setConfirm({ open: true, loading: false })} disabled={!canTransfer || insufficient} className="bg-[#0D4F6D] hover:bg-[#0a3d55] disabled:opacity-40">
                <ArrowRightLeft size={14} className="mr-1.5" /> Lanjutkan Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={v => setConfirm(c => ({ ...c, open: v }))}
        title="Konfirmasi Transfer?"
        description={canTransfer ? `Transfer ${formatCurrency(amount, fromAccount?.currency || 'IDR')} dari "${fromAccount?.name}" ke "${toAccount?.name}". Saldo kedua akun akan diperbarui secara otomatis.` : ''}
        type="save"
        confirmLabel="YA, TRANSFER SEKARANG"
        onConfirm={doTransfer}
        loading={confirm.loading}
      />
    </div>
  );
}