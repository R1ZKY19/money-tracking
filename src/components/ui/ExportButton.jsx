import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/utils/finance';
import jsPDF from 'jspdf';

// Export to CSV/Excel
function exportToCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const val = row[h] ?? '';
    return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename + '.csv'; a.click();
  URL.revokeObjectURL(url);
}

// Export transaksi to PDF
function exportTransaksiPDF(transactions, title, subtitle) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.setTextColor(13, 79, 109);
  doc.text('FinCat — ' + title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(subtitle || `Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 25);

  // Header
  const headers = ['Tanggal', 'Jenis', 'Kategori', 'Akun', 'Catatan', 'Nominal'];
  const colW = [28, 30, 38, 38, 60, 40];
  let y = 34;
  doc.setFillColor(13, 79, 109);
  doc.rect(14, y, 268, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255);
  let x = 16;
  headers.forEach((h, i) => { doc.text(h, x, y + 5); x += colW[i]; });

  // Rows
  y += 9;
  doc.setTextColor(50);
  transactions.forEach((t, idx) => {
    if (y > 190) { doc.addPage(); y = 20; }
    if (idx % 2 === 0) { doc.setFillColor(245, 247, 250); doc.rect(14, y - 1, 268, 7, 'F'); }
    const typeLabel = { income: 'Pendapatan', expense: 'Pengeluaran', saving: 'Tabungan', debt_payment: 'Bayar Hutang', receivable_receipt: 'Terima Piutang', transfer: 'Transfer' }[t.type] || t.type;
    const nominal = (t.type === 'income' || t.type === 'receivable_receipt' ? '+' : '-') + formatCurrency(t.amount || 0, t.currency);
    const row = [
      formatDate(t.date),
      typeLabel,
      (t.category_name || '-').substring(0, 18),
      (t.account_name || '-').substring(0, 18),
      (t.description || '-').substring(0, 30),
      nominal,
    ];
    x = 16;
    doc.setFontSize(7.5);
    row.forEach((val, i) => { doc.text(String(val), x, y + 4); x += colW[i]; });
    y += 7;
  });

  doc.save(`FinCat_${title.replace(/\s/g, '_')}.pdf`);
}

export default function ExportButton({ transactions = [], title = 'Laporan', subtitle = '' }) {
  const [loading, setLoading] = useState(false);

  const handleCSV = () => {
    const data = transactions.map(t => ({
      Tanggal: t.date,
      Jenis: t.type,
      Kategori: t.category_name || '',
      Akun: t.account_name || '',
      Mata_Uang: t.currency || 'IDR',
      Nominal: t.amount || 0,
      Catatan: t.description || '',
    }));
    exportToCSV(data, `FinCat_${title}`);
  };

  const handlePDF = () => {
    setLoading(true);
    setTimeout(() => {
      exportTransaksiPDF(transactions, title, subtitle);
      setLoading(false);
    }, 100);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading || !transactions.length}>
          <Download size={14} />
          {loading ? 'Memproses...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePDF} className="gap-2 cursor-pointer">
          <FileText size={14} className="text-red-500" />
          Export PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet size={14} className="text-emerald-600" />
          Export CSV / Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}