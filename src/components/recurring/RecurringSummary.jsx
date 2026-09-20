import { ArrowDown, ArrowUp, PiggyBank, Repeat } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import { formatCurrency } from '@/lib/utils/finance';

const PER_MONTH = { daily: 30, weekly: 4.33, biweekly: 2.17, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };

export default function RecurringSummary({ items, loading }) {
  const active = items.filter(i => i.is_active !== false);
  const monthly = (type) => active.filter(i => i.type === type)
    .reduce((s, i) => s + (i.amount || 0) * (PER_MONTH[i.frequency] || 1), 0);
  const income = monthly('income'), expense = monthly('expense'), saving = monthly('saving');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard title="Rutin Aktif" value={`${active.length} jadwal`} subtitle={`${items.length} total`} icon={Repeat} iconBg="rgba(37,99,235,0.1)" iconColor="#2563EB" accentClass="kpi-blue" loading={loading} />
      <KpiCard title="Pendapatan / Bulan" value={formatCurrency(income)} icon={ArrowDown} iconBg="rgba(16,185,129,0.1)" iconColor="#10B981" accentClass="kpi-green" loading={loading} />
      <KpiCard title="Pengeluaran / Bulan" value={formatCurrency(expense)} icon={ArrowUp} iconBg="rgba(239,68,68,0.1)" iconColor="#EF4444" accentClass="kpi-red" loading={loading} />
      <KpiCard title="Tabungan / Bulan" value={formatCurrency(saving)} icon={PiggyBank} iconBg="rgba(99,102,241,0.1)" iconColor="#6366F1" accentClass="kpi-indigo" loading={loading} />
    </div>
  );
}