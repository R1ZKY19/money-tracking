export const FREQUENCIES = [
  { value: 'daily',     label: 'Harian',      short: 'Harian' },
  { value: 'weekly',    label: 'Mingguan',    short: 'Mingguan' },
  { value: 'biweekly',  label: 'Dua Mingguan', short: '2 Mingguan' },
  { value: 'monthly',   label: 'Bulanan',     short: 'Bulanan' },
  { value: 'quarterly', label: 'Per 3 Bulan', short: '3 Bulan' },
  { value: 'yearly',    label: 'Tahunan',     short: 'Tahunan' },
];

export const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const freqLabel = (v) => FREQUENCIES.find(f => f.value === v)?.label || v;

const iso = (d) => d.toISOString().slice(0, 10);
const parse = (s) => { const [y, m, d] = String(s).split('T')[0].split('-').map(Number); return new Date(y, m - 1, d); };

const step = (date, frequency, dayOfMonth) => {
  const d = new Date(date);
  switch (frequency) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  if ((frequency === 'monthly' || frequency === 'quarterly') && dayOfMonth) {
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dayOfMonth, last));
  }
  return d;
};

/** Tanggal berikutnya transaksi rutin akan dibuat. null = tidak ada lagi. */
export function nextDueDate(rt, from = new Date()) {
  if (!rt?.start_date || rt.is_active === false) return null;
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = rt.end_date ? parse(rt.end_date) : null;
  let cursor = rt.last_created_date ? step(parse(rt.last_created_date), rt.frequency, rt.day_of_month) : parse(rt.start_date);
  if (!cursor) return null;
  let guard = 0;
  while (cursor < today && guard++ < 500) {
    const next = step(cursor, rt.frequency, rt.day_of_month);
    if (!next) return null;
    cursor = next;
  }
  if (end && cursor > end) return null;
  return iso(cursor);
}

/** Semua kejadian dalam rentang tanggal (untuk kalender / proyeksi). */
export function occurrencesBetween(rt, startISO, endISO) {
  const out = [];
  const start = parse(startISO), end = parse(endISO);
  const stop = rt.end_date ? parse(rt.end_date) : null;
  let cursor = parse(rt.start_date);
  let guard = 0;
  while (cursor <= end && guard++ < 800) {
    if (cursor >= start && (!stop || cursor <= stop)) out.push(iso(cursor));
    const next = step(cursor, rt.frequency, rt.day_of_month);
    if (!next) break;
    cursor = next;
  }
  return out;
}

export const daysUntil = (dateISO) => dateISO
  ? Math.round((parse(dateISO) - new Date(new Date().toDateString())) / 86400000)
  : null;