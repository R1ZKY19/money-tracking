import { useQuery } from '@tanstack/react-query';
import { DebtPayment } from '@/api/entities';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/finance';
import { CreditCard, Calendar, Clock, CheckCircle2, User, TrendingUp, AlertTriangle, Info, Banknote, BarChart2 } from 'lucide-react';
import LoanStatusIcon from '@/components/shared/LoanStatusIcon';
import LoanInsightGrid from '@/components/shared/LoanInsightGrid';

export default function DebtDetail({ debt, open, onClose }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['debtPayments', debt?.id],
    queryFn: () => DebtPayment.list(),
    enabled: !!debt?.id && open,
  });

  if (!debt) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = debt.due_date && debt.due_date < today && debt.status === 'active';
  const isPaid = debt.status === 'paid';

  // Hitung bunga & total — flat % dari pokok
  // Contoh: hutang 10jt, bunga 20% → total harus bayar 12jt
  const hasInterest = debt.interest_rate > 0;
  const totalInterest = hasInterest ? (debt.total_amount || 0) * (debt.interest_rate / 100) : 0;
  const totalMonths = 1; // kept for compat
  const totalWithInterest = (debt.total_amount || 0) + totalInterest;
  // remaining_amount di DB = sisa pokok. Sisa sesungguhnya = sisa pokok + bunga
  const remainingWithInterest = (debt.remaining_amount || 0) + totalInterest;
  const totalPaid = Math.max(0, totalWithInterest - remainingWithInterest);
  const pct = totalWithInterest > 0 ? Math.min(100, (totalPaid / totalWithInterest) * 100) : 0;

  const daysOverdue = isOverdue && debt.due_date
    ? Math.floor((new Date(today) - new Date(debt.due_date)) / (1000 * 60 * 60 * 24))
    : 0;

  const loanStartDate = debt.created_date?.slice(0, 10);
  const loanDurationDays = loanStartDate
    ? Math.floor((new Date(today) - new Date(loanStartDate)) / (1000 * 60 * 60 * 24))
    : 0;

  const latePayments = payments.filter(p => debt.due_date && p.payment_date > debt.due_date);
  const statusLabel = isPaid ? '✓ Lunas' : isOverdue ? `⚠ Menunggak ${daysOverdue} hari` : '● Aktif';
  const statusColor = isPaid ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-amber-500';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header Hero */}
        <div className="rounded-t-lg p-5 text-white" style={{ background: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <LoanStatusIcon size={48} kind="debt" state={isPaid ? 'paid' : isOverdue ? 'overdue' : 'active'} />
              <div>
                <p className="text-white/70 text-xs uppercase tracking-widest">Detail Hutang</p>
                <h2 className="text-white font-bold text-xl">{debt.creditor_name}</h2>
                <Badge className={`mt-1 text-xs text-white border-0 ${statusColor}`}>{statusLabel}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Mata Uang</p>
              <p className="text-white font-bold">{debt.currency}</p>
            </div>
          </div>

          {/* 3 KPI utama */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white/60 text-[10px] uppercase mb-0.5">Pokok Hutang</p>
              <p className="text-white font-black text-sm">{formatCurrency(debt.total_amount, debt.currency)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white/60 text-[10px] uppercase mb-0.5">Total + Bunga</p>
              <p className="text-yellow-200 font-black text-sm">{formatCurrency(totalWithInterest, debt.currency)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white/60 text-[10px] uppercase mb-0.5">Sisa Hutang</p>
              <p className={`font-black text-sm ${isPaid ? 'text-emerald-200' : 'text-red-200'}`}>
                {formatCurrency(remainingWithInterest, debt.currency)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Progress Pelunasan</span>
              <span>{pct.toFixed(1)}% ({formatCurrency(totalPaid, debt.currency)} dibayar)</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Info lengkap */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBox icon={<User size={14} className="text-amber-600" />} label="Pemberi Hutang (Kreditur)" value={debt.creditor_name} />
            <InfoBox icon={<Calendar size={14} className="text-amber-600" />} label="Tanggal Pinjam" value={formatDate(loanStartDate || '-')} />
            <InfoBox icon={<Clock size={14} className={isOverdue ? 'text-red-500' : 'text-amber-500'} />} label="Jatuh Tempo"
              value={debt.due_date ? formatDate(debt.due_date) : 'Tidak ditentukan'}
              valueClass={isOverdue ? 'text-red-500 font-bold' : ''} />
            <InfoBox icon={<BarChart2 size={14} className="text-purple-600" />} label="Durasi Berjalan" value={`${loanDurationDays} hari`} />
            <InfoBox icon={<Banknote size={14} className="text-orange-500" />} label="Bunga (Flat)"
              value={hasInterest ? `${debt.interest_rate}%` : 'Tanpa bunga'}
              valueClass={hasInterest ? 'text-orange-600 font-bold' : 'text-muted-foreground'} />
            <InfoBox icon={<TrendingUp size={14} className="text-orange-500" />} label="Total Bunga"
              value={hasInterest ? `+${formatCurrency(totalInterest, debt.currency)}` : '—'}
              valueClass="text-orange-600 font-bold" />
          </div>

          <LoanInsightGrid
            payments={payments}
            remaining={remainingWithInterest}
            totalDue={totalWithInterest}
            dueDate={debt.due_date}
            startDate={loanStartDate}
            currency={debt.currency}
            kind="debt"
          />

          {/* Rincian Keuangan */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Info size={12} /> Rincian Tagihan
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pokok Hutang</span>
                <span className="font-semibold">{formatCurrency(debt.total_amount, debt.currency)}</span>
              </div>
              {hasInterest && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bunga Flat ({debt.interest_rate}%)</span>
                  <span className="font-semibold text-orange-600">+{formatCurrency(totalInterest, debt.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-amber-200 pt-2 mt-1">
                <span className="font-bold text-amber-800 dark:text-amber-300">Total Harus Dibayar</span>
                <span className="font-black text-amber-700 dark:text-amber-300">{formatCurrency(totalWithInterest, debt.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sudah Dibayar</span>
                <span className="font-semibold text-emerald-600">−{formatCurrency(totalPaid, debt.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-amber-200 pt-2">
                <span className="font-bold">Sisa Hutang</span>
                <span className={`font-black text-lg ${isPaid ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(remainingWithInterest, debt.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Keterlambatan */}
          {isOverdue && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-bold text-sm">Menunggak {daysOverdue} Hari!</p>
                <p className="text-red-600 text-xs mt-0.5">
                  Jatuh tempo: {formatDate(debt.due_date)} · Sudah lewat {daysOverdue} hari. Segera lunasi untuk menghindari bunga tambahan.
                </p>
              </div>
            </div>
          )}

          {/* Catatan */}
          {debt.notes && (
            <div className="p-3 bg-muted/30 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Catatan</p>
              <p className="text-sm">{debt.notes}</p>
            </div>
          )}

          {/* Riwayat Pembayaran */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-600" />
                <h3 className="font-bold text-sm">Riwayat Pembayaran</h3>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-xs">{payments.length}x cicilan</Badge>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed border-border">
                Belum ada cicilan yang dibayar
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p, i) => {
                  const isLate = debt.due_date && p.payment_date > debt.due_date;
                  return (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${isLate ? 'bg-red-50 border-red-200' : 'bg-muted/20 border-border'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isLate ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {payments.length - i}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-700">−{formatCurrency(p.amount, debt.currency)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(p.payment_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isLate && <Badge className="text-[10px] bg-red-100 text-red-600 border border-red-200">Terlambat</Badge>}
                        {p.notes && <p className="text-xs text-muted-foreground mt-0.5 max-w-[100px] truncate">{p.notes}</p>}
                      </div>
                    </div>
                  );
                })}

                {/* Rekap */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <p className="text-xs text-amber-600 mb-0.5">Total Dibayar</p>
                    <p className="font-bold text-amber-700 text-sm">{formatCurrency(totalPaid, debt.currency)}</p>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${latePayments.length > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <p className="text-xs text-muted-foreground mb-0.5">Cicilan Terlambat</p>
                    <p className={`font-bold text-sm ${latePayments.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {latePayments.length}x
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoBox({ icon, label, value, valueClass = '' }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-muted/30 rounded-xl border border-border">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 truncate ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}