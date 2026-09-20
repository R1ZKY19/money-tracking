import { CalendarClock, Coins, Repeat, Timer, Target, Percent } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/finance';

const DAY = 86400000;

// Ringkasan spesifik pinjaman: dipakai bersama oleh detail Hutang & Piutang.
export default function LoanInsightGrid({ payments = [], remaining = 0, totalDue = 0, dueDate, startDate, currency, kind = 'receivable' }) {
  const isDebt = kind === 'debt';
  const tone = isDebt ? 'text-amber-600' : 'text-teal-600';
  const today = new Date().toISOString().slice(0, 10);

  const amounts = payments.map(p => p.amount || 0);
  const avg = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const last = payments[0];
  const daysLeft = dueDate ? Math.round((new Date(dueDate) - new Date(today)) / DAY) : null;
  const monthsLeft = daysLeft !== null && daysLeft > 0 ? Math.max(1, Math.ceil(daysLeft / 30)) : null;
  const perMonth = monthsLeft ? remaining / monthsLeft : null;
  const estInstalments = avg > 0 ? Math.ceil(remaining / avg) : null;
  const paidPct = totalDue > 0 ? Math.min(100, ((totalDue - remaining) / totalDue) * 100) : 0;

  const items = [
    { icon: Repeat, label: 'Jumlah cicilan', value: `${payments.length}x`, hint: startDate ? `sejak ${formatDate(startDate)}` : null },
    { icon: Coins, label: 'Rata-rata per cicilan', value: avg > 0 ? formatCurrency(avg, currency) : '—', hint: avg > 0 ? 'dari riwayat' : 'belum ada data' },
    { icon: CalendarClock, label: isDebt ? 'Pembayaran terakhir' : 'Penerimaan terakhir', value: last ? formatCurrency(last.amount, currency) : '—', hint: last ? formatDate(last.payment_date) : 'belum ada' },
    {
      icon: Timer, label: 'Sisa waktu', danger: daysLeft !== null && daysLeft < 0,
      value: daysLeft === null ? 'Tanpa tenggat' : daysLeft < 0 ? `Lewat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari`,
      hint: dueDate ? `tempo ${formatDate(dueDate)}` : null,
    },
    { icon: Target, label: isDebt ? 'Angsuran ideal/bulan' : 'Target terima/bulan', value: perMonth ? formatCurrency(perMonth, currency) : '—', hint: monthsLeft ? `agar lunas dalam ${monthsLeft} bln` : 'tenggat terlewat/kosong' },
    { icon: Percent, label: 'Estimasi lunas', value: remaining <= 0 ? 'Sudah lunas' : estInstalments ? `± ${estInstalments}x lagi` : '—', hint: `progres ${paidPct.toFixed(0)}%` },
  ];

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${tone}`}>Analisis Spesifik</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {items.map(it => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="rounded-lg border border-border bg-card p-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Icon size={11} className={tone} /> {it.label}
              </p>
              <p className={`text-sm font-bold mt-1 truncate ${it.danger ? 'text-red-600' : 'text-foreground'}`}>{it.value}</p>
              {it.hint && <p className="text-[10px] text-muted-foreground truncate">{it.hint}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}