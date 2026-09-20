import { formatCurrency } from '@/lib/utils/finance';

export default function ReportCategoryTable({ rows, total, color, emptyText }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>;
  return (
    <table className="w-full text-sm table-premium">
      <thead><tr><th className="text-left">Kategori</th><th className="text-right">Transaksi</th><th className="text-right">Total</th><th className="text-right">%</th></tr></thead>
      <tbody className="divide-y divide-border">
        {rows.map(r => {
          const pct = total > 0 ? (r.total / total) * 100 : 0;
          return (
            <tr key={r.name}>
              <td className="px-4 py-2.5 font-medium text-foreground">
                <div className="flex items-center gap-2"><span>{r.name}</span></div>
                <div className="h-1 mt-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
              </td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">{r.count}</td>
              <td className="px-4 py-2.5 text-right font-semibold" style={{ color }}>{formatCurrency(r.total)}</td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">{pct.toFixed(1)}%</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot><tr className="border-t border-border bg-muted/30"><td className="px-4 py-2.5 font-bold">TOTAL</td><td /><td className="px-4 py-2.5 text-right font-bold" style={{ color }}>{formatCurrency(total)}</td><td className="px-4 py-2.5 text-right text-muted-foreground">100%</td></tr></tfoot>
    </table>
  );
}