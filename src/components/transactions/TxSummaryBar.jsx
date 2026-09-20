import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/finance';
export default function TxSummaryBar({ transactions }) {
  const groups = useMemo(() => {
    const result = {};
    transactions.forEach(t => {
      const currency = t.currency || 'IDR';
      const g = result[currency] ||= {};
      g[t.type] = (g[t.type] || 0) + (Number(t.amount) || 0);
    });
    return Object.keys(result).length ? result : { IDR: {} };
  }, [transactions]);
  return <div className="space-y-3">
    {Object.entries(groups).map(([currency, g]) => {
      const value = key => g[key] || 0;
      const net = value('income') + value('debt') + value('receivable_receipt') - value('expense') - value('saving') - value('debt_payment') - value('receivable');
      const items = [
        ['Pendapatan', value('income'), true], ['Pengeluaran', value('expense'), false],
        ['Tabungan', value('saving'), null], ['Bayar Hutang', value('debt_payment'), false],
        ['Pinjaman Diterima', value('debt'), true], ['Dana Dipinjamkan', value('receivable'), false],
        ['Terima Piutang', value('receivable_receipt'), true], ['Cash Flow', net, net >= 0]
      ];
      return <section key={currency} aria-label={`Ringkasan transaksi ${currency}`}>
        <p className="text-xs text-muted-foreground mb-2">Ringkasan {currency} · mengikuti filter transaksi</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map(([label, amount, positive]) => <div key={label} className="rounded-xl border border-border bg-card px-4 py-3.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
            <p className={`font-heading font-semibold text-base mt-1 ${positive === null ? 'text-primary' : positive ? 'text-success' : 'text-destructive'}`}>{formatCurrency(amount, currency)}</p>
          </div>)}
        </div>
      </section>;
    })}
    <p className="text-xs text-muted-foreground leading-relaxed">Pinjaman bukan pendapatan atau biaya belanja. Cash flow = pendapatan + pinjaman diterima + terima piutang − pengeluaran − tabungan − bayar hutang − dana dipinjamkan. Transfer antar rekening tidak dihitung; mata uang berbeda dipisahkan.</p>
  </div>;
}