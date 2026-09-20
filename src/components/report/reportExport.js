import jsPDF from 'jspdf';
import { formatCurrency, MONTHS_ID } from '@/lib/utils/finance';

const periodLabel = r => `${r.month ? MONTHS_ID[Number(r.month) - 1] + ' ' : ''}${r.year}`;
const download = (content, name, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

export function exportReportCSV(r) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['Bagian', 'Nama', 'Grup/Jenis', 'Nilai 1', 'Nilai 2', 'Keterangan']];
  lines.push(['Ringkasan', 'Pemasukan', '', r.kpis.income], ['Ringkasan', 'Pengeluaran', '', r.kpis.expense], ['Ringkasan', 'Tabungan', '', r.kpis.saving], ['Ringkasan', 'Cash Flow', '', r.kpis.cashFlow], ['Ringkasan', 'Total Saldo', '', r.totalBalance], ['Ringkasan', 'Hutang Aktif', '', r.totalDebt], ['Ringkasan', 'Piutang Aktif', '', r.totalReceivable], ['Ringkasan', 'Skor Kesehatan', '', r.score.score, '', r.score.label]);
  r.incomeByCategory.forEach(c => lines.push(['Pendapatan per Kategori', c.name, 'income', c.total, c.count]));
  r.expenseByCategory.forEach(c => lines.push(['Pengeluaran per Kategori', c.name, 'expense', c.total, c.count]));
  r.accounts.forEach(a => lines.push(['Saldo Rekening', a.name, a.currency, a.current_balance || 0]));
  r.budgetRows.forEach(b => lines.push(['Budget vs Aktual', b.name, b.group, b.budget, b.actual, b.diff]));
  r.dueItems.forEach(d => lines.push(['Jatuh Tempo', d.name, d.kind, d.amount, d.due, `${d.days} hari`]));
  download('\uFEFF' + lines.map(l => l.map(esc).join(',')).join('\n'), `Laporan_${periodLabel(r).replace(/\s/g, '_')}.csv`, 'text/csv;charset=utf-8;');
}

export function exportReportPDF(r) {
  const doc = new jsPDF();
  let y = 18;
  const line = (label, value, bold = false) => { if (y > 280) { doc.addPage(); y = 18; } doc.setFont(undefined, bold ? 'bold' : 'normal'); doc.text(label, 14, y); doc.text(String(value), 196, y, { align: 'right' }); y += 6; };
  const section = title => { y += 4; if (y > 270) { doc.addPage(); y = 18; } doc.setFillColor(13, 79, 109); doc.rect(14, y - 4, 182, 7, 'F'); doc.setTextColor(255); doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.text(title, 16, y + 1); doc.setTextColor(40); doc.setFontSize(9); y += 9; };
  doc.setFontSize(16); doc.setTextColor(13, 79, 109); doc.setFont(undefined, 'bold'); doc.text('MONEY TRACKING — Laporan Keuangan', 14, y); y += 7;
  doc.setFontSize(9); doc.setTextColor(100); doc.setFont(undefined, 'normal'); doc.text(`Periode: ${periodLabel(r)}  |  Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, y); y += 4;
  doc.setTextColor(40);
  section('RINGKASAN');
  line('Pemasukan', formatCurrency(r.kpis.income)); line('Pengeluaran', formatCurrency(r.kpis.expense)); line('Tabungan', formatCurrency(r.kpis.saving));
  line('Cash Flow', formatCurrency(r.kpis.cashFlow), true); line('Saving Rate', `${r.kpis.savingRate.toFixed(1)}%`); line('Total Saldo Rekening', formatCurrency(r.totalBalance));
  line('Hutang Aktif', formatCurrency(r.totalDebt)); line('Piutang Aktif', formatCurrency(r.totalReceivable)); line('Skor Kesehatan Keuangan', `${r.score.score}/100 (${r.score.label})`, true);
  section('PENDAPATAN PER KATEGORI'); r.incomeByCategory.forEach(c => line(`${c.name} (${c.count}x)`, formatCurrency(c.total))); if (!r.incomeByCategory.length) line('-', '-');
  section('PENGELUARAN PER KATEGORI'); r.expenseByCategory.forEach(c => line(`${c.name} (${c.count}x)`, formatCurrency(c.total))); if (!r.expenseByCategory.length) line('-', '-');
  section('SALDO REKENING'); r.accounts.forEach(a => line(a.name, formatCurrency(a.current_balance || 0, a.currency)));
  if (r.budgetRows.length) { section('BUDGET VS AKTUAL'); r.budgetRows.forEach(b => line(`${b.name} · budget ${formatCurrency(b.budget)}`, `aktual ${formatCurrency(b.actual)}`)); }
  if (r.dueItems.length) { section('JATUH TEMPO HUTANG & PIUTANG'); r.dueItems.forEach(d => line(`${d.kind === 'debt' ? 'Hutang' : 'Piutang'} · ${d.name} · ${d.due}`, `${formatCurrency(d.amount, d.currency)} (${d.days < 0 ? `lewat ${-d.days} hr` : `${d.days} hr`})`)); }
  doc.save(`Laporan_${periodLabel(r).replace(/\s/g, '_')}.pdf`);
}