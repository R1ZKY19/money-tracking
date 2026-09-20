import { Landmark, CheckCircle2, Clock, Scale, TrendingUp, TrendingDown, CircleCheck } from 'lucide-react';
import { formatCompact } from '@/lib/utils/finance';

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 flex items-center gap-3 hover:shadow-md transition-all">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export default function CrossCheckSummaryCards({ summary }) {
  const {
    totalAccounts, checkedCount, uncheckedCount,
    totalSystem, totalActual, totalDiff,
    surplusCount, minusCount, matchCount,
  } = summary;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Stat icon={Landmark} label="Total Rekening" value={totalAccounts} color="#0D4F6D" />
      <Stat icon={CheckCircle2} label="Sudah Dicek" value={checkedCount} color="#10B981" />
      <Stat icon={Clock} label="Belum Dicek" value={uncheckedCount} color="#F59E0B" />
      <Stat icon={Scale} label="Total Saldo Sistem" value={formatCompact(totalSystem)} color="#6366F1" />
      <Stat icon={Scale} label="Total Saldo Aktual" value={formatCompact(totalActual)} color="#0891B2" />
      <Stat icon={totalDiff >= 0 ? TrendingUp : TrendingDown} label="Total Selisih" value={`${totalDiff > 0 ? '+' : ''}${formatCompact(totalDiff)}`} color={totalDiff === 0 ? '#10B981' : totalDiff > 0 ? '#F59E0B' : '#EF4444'} />
      <Stat icon={TrendingUp} label="Bank Surplus" value={surplusCount} color="#F59E0B" />
      <Stat icon={TrendingDown} label="Bank Minus" value={minusCount} color="#EF4444" />
      <Stat icon={CircleCheck} label="Bank Sesuai" value={matchCount} color="#10B981" />
    </div>
  );
}