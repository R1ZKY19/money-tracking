import { jsPDF } from 'jspdf';
import { formatCurrency } from '@/lib/utils/finance';

const HEADERS = ['Nama Bank', 'No. Rekening', 'Pemilik', 'Saldo Sistem', 'Saldo Aktual', 'Selisih', 'Status', 'Terakhir Dicek', 'Staff'];

const rowToArray = (r) => [
  r.account.name,
  r.account.account_number || '-',
  r.account.account_holder_name || '-',
  formatCurrency(r.systemBalance, r.account.currency),
  r.hasActual ? formatCurrency(r.actualBalance, r.account.currency) : '-',
  r.hasActual ? formatCurrency(r.diff, r.account.currency) : '-',
  r.statusLabel,
  r.lastCheckDate || '-',
  r.lastStaff || '-',
];

export function exportCrossCheckCSV(rows) {
  const csvRows = [HEADERS, ...rows.map(rowToArray)];
  const csv = csvRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cross-check-saldo-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportCrossCheckPDF(rows) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('Cross Check Saldo Bank', 14, 15);
  doc.setFontSize(9);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 21);

  let y = 30;
  const colWidths = [40, 30, 35, 32, 32, 28, 20, 32, 28];
  const startX = 14;

  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  let x = startX;
  HEADERS.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
  y += 4;
  doc.setFont(undefined, 'normal');
  doc.line(startX, y, startX + colWidths.reduce((a, b) => a + b, 0), y);
  y += 5;

  rows.forEach(r => {
    if (y > 195) { doc.addPage(); y = 20; }
    x = startX;
    rowToArray(r).forEach((val, i) => {
      doc.text(String(val).slice(0, 22), x, y);
      x += colWidths[i];
    });
    y += 6;
  });

  doc.save(`cross-check-saldo-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function printCrossCheckTable(rows) {
  const win = window.open('', '_blank');
  const html = `
    <html>
      <head>
        <title>Cross Check Saldo Bank</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 11px; text-align: left; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>Cross Check Saldo Bank</h1>
        <p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
        <table>
          <thead><tr>${HEADERS.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${rowToArray(r).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </body>
    </html>`;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}