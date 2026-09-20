import { formatCurrency } from '@/lib/utils/finance';

const GROUP = { income: 'Pendapatan', expense: 'Pengeluaran', saving: 'Tabungan' };

export default function ReportBudgetTable({ rows }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground text-center py-6">Belum ada budget untuk periode ini. Atur di menu Budget Plan.</p>;
  return (
    <table className="w-full text-sm table-premium">
      <thead><tr><th className="text-left">Kategori</th><th className="text-left">Grup</th><th className="text-right">Budget</th><th className="text-right">Aktual</th><th className="text-right">Selisih</th><th className="text-right">Status</th></tr></thead>
      <tbody className="divide-y divide-border">
        {rows.map((r, i) => {
          const pct = r.budget > 0 ? (r.actual / r.budget) * 100 : 0;
          const bad = r.group === 'expense' ? r.actual > r.budget : r.actual < r.budget;
          const status = r.budget === 0 ? 'badge-neutral' : bad ? (r.group === 'expense' ? 'badge-danger' : 'badge-warning') : 'badge-success';
          const text = r.budget === 0 ? 'Tanpa budget' : r.group === 'expense' ? (bad ? 'Terlampaui' : pct >= 90 ? 'Hampir habis' : 'Aman') : (bad ? 'Belum tercapai' : 'Tercapai');
          return (
            <tr key={i}>
              <td className="px-4 py-2.5 font-medium text-foreground">{r.name}</td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs">{GROUP[r.group]}</td>
              <td className="px-4 py-2.5 text-right">{formatCurrency(r.budget)}</td>
              <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(r.actual)}</td>
              <td className={`px-4 py-2.5 text-right font-semibold ${bad ? 'text-red-500' : 'text-emerald-600'}`}>{formatCurrency(r.diff)}</td>
              <td className="px-4 py-2.5 text-right"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status}`}>{text}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}