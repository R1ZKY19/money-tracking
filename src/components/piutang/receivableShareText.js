import { formatCurrency, formatDate } from '@/lib/utils/finance';

// Menyusun rincian piutang lengkap sebagai teks agar peminjam langsung paham utangnya.
export function buildReceivableShareText({ receivable, payments = [] }) {
  const hasInterest = receivable.interest_rate > 0;
  const totalInterest = hasInterest ? (receivable.total_amount || 0) * (receivable.interest_rate / 100) : 0;
  const totalWithInterest = (receivable.total_amount || 0) + totalInterest;
  const remaining = (receivable.remaining_amount || 0) + totalInterest;
  const totalPaid = Math.max(0, totalWithInterest - remaining);
  const pct = totalWithInterest > 0 ? (totalPaid / totalWithInterest) * 100 : 0;
  const today = new Date().toISOString().slice(0, 10);
  const isDone = receivable.status === 'completed';
  const isOverdue = receivable.due_date && receivable.due_date < today && !isDone;
  const daysOverdue = isOverdue
    ? Math.floor((new Date(today) - new Date(receivable.due_date)) / 86400000)
    : 0;

  const cur = receivable.currency;
  const lines = [
    '*RINCIAN UTANG ANDA — MONEY TRACKING*',
    '',
    `Nama Peminjam : ${receivable.debtor_name}`,
    `Status : ${isDone ? 'LUNAS' : isOverdue ? `MENUNGGAK ${daysOverdue} hari` : 'AKTIF'}`,
    `Tanggal Pinjam : ${receivable.created_date ? formatDate(receivable.created_date.slice(0, 10)) : '-'}`,
    `Jatuh Tempo : ${receivable.due_date ? formatDate(receivable.due_date) : 'Tidak ditentukan'}`,
    '',
    '*Rincian Tagihan*',
    `• Pokok Pinjaman : ${formatCurrency(receivable.total_amount, cur)}`,
    hasInterest ? `• Bunga Flat (${receivable.interest_rate}%) : +${formatCurrency(totalInterest, cur)}` : '• Bunga : Tanpa bunga',
    `• Total Harus Dikembalikan : ${formatCurrency(totalWithInterest, cur)}`,
    `• Sudah Dibayar : ${formatCurrency(totalPaid, cur)} (${pct.toFixed(1)}%)`,
    `• SISA YANG HARUS DIBAYAR : ${formatCurrency(remaining, cur)}`,
  ];

  if (payments.length) {
    lines.push('', `*Riwayat Pembayaran (${payments.length}x)*`);
    payments.forEach((p, i) => {
      const late = receivable.due_date && p.payment_date > receivable.due_date;
      lines.push(`${payments.length - i}. ${formatDate(p.payment_date)} — ${formatCurrency(p.amount, cur)}${late ? ' (terlambat)' : ''}`);
    });
  }

  if (receivable.notes) lines.push('', `*Catatan* : ${receivable.notes}`);
  lines.push('', 'Dikirim otomatis dari aplikasi MONEY TRACKING.');

  return lines.filter(Boolean).join('\n');
}