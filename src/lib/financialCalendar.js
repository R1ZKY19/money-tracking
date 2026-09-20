import { occurrencesBetween, nextDueDate } from '@/lib/recurring';

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayISO = () => iso(new Date());

/** Grid 6x7 tanggal untuk bulan tertentu (mulai Senin). */
export function buildMonthGrid(year, month) {
  const first = new Date(year, month - 1, 1);
  const offset = (first.getDay() + 6) % 7; // Senin = 0
  const start = new Date(year, month - 1, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date: iso(d), day: d.getDate(), inMonth: d.getMonth() === month - 1 };
  });
}

/**
 * Peta tanggal → daftar event dari data nyata:
 * transaksi tercatat, jatuh tempo hutang/piutang, dan jadwal transaksi rutin.
 */
export function buildCalendarEvents({ transactions = [], debts = [], receivables = [], recurring = [] }, rangeStart, rangeEnd) {
  const map = {};
  const push = (date, ev) => { if (!date || date < rangeStart || date > rangeEnd) return; (map[date] ||= []).push(ev); };

  transactions.forEach(t => {
    const date = String(t.date || '').split('T')[0];
    push(date, { kind: 'transaction', type: t.type, title: t.category_name || t.description || 'Transaksi', amount: t.amount || 0, currency: t.currency, meta: t.account_name, id: t.id });
  });

  debts.filter(d => d.status === 'active' && d.due_date).forEach(d => {
    push(String(d.due_date).split('T')[0], { kind: 'debt_due', title: `Jatuh tempo hutang · ${d.creditor_name || '-'}`, amount: d.remaining_amount || 0, currency: d.currency, id: d.id });
  });

  receivables.filter(r => r.status === 'active' && r.due_date).forEach(r => {
    push(String(r.due_date).split('T')[0], { kind: 'receivable_due', title: `Jatuh tempo piutang · ${r.debtor_name || '-'}`, amount: r.remaining_amount || 0, currency: r.currency, id: r.id });
  });

  recurring.filter(r => r.is_active !== false).forEach(r => {
    occurrencesBetween(r, rangeStart, rangeEnd).forEach(date => {
      const next = nextDueDate(r);
      if (r.last_created_date && date <= r.last_created_date) return;
      push(date, { kind: 'recurring', type: r.type, title: `Rutin · ${r.name}`, amount: r.amount || 0, currency: r.currency, meta: r.account_name, upcoming: !!next && date >= next, id: `${r.id}-${date}` });
    });
  });

  return map;
}

export const EVENT_STYLE = {
  income:          { dot: '#10B981', label: 'Pendapatan' },
  expense:         { dot: '#EF4444', label: 'Pengeluaran' },
  saving:          { dot: '#6366F1', label: 'Tabungan' },
  other:           { dot: '#64748B', label: 'Transaksi lain' },
  debt_due:        { dot: '#F59E0B', label: 'Jatuh tempo hutang' },
  receivable_due:  { dot: '#06B6D4', label: 'Jatuh tempo piutang' },
  recurring:       { dot: '#8B5CF6', label: 'Jadwal rutin' },
};

export const eventStyle = (ev) => ev.kind === 'transaction'
  ? (EVENT_STYLE[ev.type] || EVENT_STYLE.other)
  : (EVENT_STYLE[ev.kind] || EVENT_STYLE.other);