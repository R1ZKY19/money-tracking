import { formatCurrency, formatDate } from '@/lib/utils/finance';

export default function ReportDueTable({ items }) {
  if (!items.length) return <p className="text-sm text-muted-foreground text-center py-6">Tidak ada hutang/piutang aktif dengan jatuh tempo.</p>;
  return (
    <table className="w-full text-sm table-premium">
      <thead><tr><th className="text-left">Jenis</th><th className="text-left">Pihak</th><th className="text-right">Sisa</th><th className="text-left">Jatuh Tempo</th><th className="text-right">Status</th></tr></thead>
      <tbody className="divide-y divide-border">
        {items.map((d, i) => {
          const badge = d.days < 0 ? 'badge-danger' : d.days <= 14 ? 'badge-warning' : 'badge-success';
          const text = d.days < 0 ? `Lewat ${Math.abs(d.days)} hari` : d.days === 0 ? 'Hari ini' : `${d.days} hari lagi`;
          return (
            <tr key={i}>
              <td className="px-4 py-2.5"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${d.kind === 'debt' ? 'badge-danger' : 'badge-info'}`}>{d.kind === 'debt' ? 'Hutang' : 'Piutang'}</span></td>
              <td className="px-4 py-2.5 font-medium text-foreground">{d.name}</td>
              <td className={`px-4 py-2.5 text-right font-semibold ${d.kind === 'debt' ? 'text-red-500' : 'text-emerald-600'}`}>{formatCurrency(d.amount, d.currency)}</td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs">{formatDate(d.due)}</td>
              <td className="px-4 py-2.5 text-right"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>{text}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}