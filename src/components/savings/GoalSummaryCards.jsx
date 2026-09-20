import { Target, Wallet, TrendingUp, Clock, Gauge, CalendarClock, PiggyBank, Layers } from 'lucide-react';
import { formatCurrency, formatCompact } from '@/lib/utils/finance';
import { getStatusFromProgress } from '@/lib/savingGoalCalc';

function Card({ icon: Icon, label, value, sub, color, accent }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 relative overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color, opacity: accent ? 1 : 0.7 }} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '15', color }}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide truncate">{label}</p>
          <p className="text-lg font-heading font-bold text-foreground leading-tight truncate">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function GoalSummaryCards({ summary }) {
  const overallStatus = getStatusFromProgress(summary.overallProgress);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card icon={Target} label="Total Target Aktif" value={summary.activeCount} sub={`${summary.achievedCount} target tercapai`} color="#6366F1" />
      <Card icon={Layers} label="Total Nominal Target" value={formatCompact(summary.totalTarget)} sub={`Terkumpul ${formatCompact(summary.totalCollected)}`} color="#0D4F6D" />
      <Card icon={Wallet} label="Sisa Dana" value={formatCompact(summary.totalRemaining)} sub={`Progress ${summary.overallProgress.toFixed(1)}%`} color="#F59E0B" />
      <Card icon={Gauge} label="Prediksi Berhasil" value={`${summary.avgProbability}%`} sub={overallStatus.label} color={overallStatus.color} accent />
      <Card icon={TrendingUp} label="Rata-rata Tabungan/Bulan" value={formatCompact(summary.avgMonthly)} sub="Dari riwayat setoran" color="#10B981" />
      <Card icon={CalendarClock} label="Estimasi Penyelesaian" value={summary.estimatedFinish} sub="Rata-rata seluruh target" color="#8B5CF6" />
      <Card icon={PiggyBank} label="Total Terkumpul" value={formatCompact(summary.totalCollected)} sub={`${summary.overallProgress.toFixed(1)}% dari target`} color="#0EA5E9" />
      <Card icon={Clock} label="Total Sisa Waktu" value={`${summary.totalMonthsRemaining} bln`} sub="Sampai deadline terjauh" color="#EC4899" />
    </div>
  );
}