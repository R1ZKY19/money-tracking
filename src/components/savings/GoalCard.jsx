import { CheckCircle2, Pencil, Trash2, Clock, Wallet, ChevronRight, CalendarClock, Activity } from 'lucide-react';
import { formatCurrency, formatCompact } from '@/lib/utils/finance';
import { CATEGORIES, calcProgress, calcRemaining, getStatusFromProgress, getMonthsRemaining, getMonthsElapsed, idealMonthlyDeposit, freqToMonthlyMultiplier } from '@/lib/savingGoalCalc';

const PRIORITY_STYLES = {
  high: { bg: '#FEE2E2', color: '#DC2626', label: 'Prioritas Tinggi' },
  medium: { bg: '#FEF3C7', color: '#D97706', label: 'Prioritas Sedang' },
  low: { bg: '#DBEAFE', color: '#2563EB', label: 'Prioritas Rendah' },
};

function ProgressBar({ pct, color }) {
  const status = getStatusFromProgress(pct);
  return (
    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
        style={{ width: `${Math.min(100, pct)}%`, background: status.color }}>
        {pct > 5 && <div className="absolute inset-0 bg-white/20" style={{ animation: 'shimmer 2s infinite' }} />}
      </div>
    </div>
  );
}

export default function GoalCard({ goal, monthlyHistory, onEdit, onDelete, onOpenDetail }) {
  const progress = calcProgress(goal.current_amount || 0, goal.target_amount || 0);
  const remaining = calcRemaining(goal.target_amount || 0, goal.current_amount || 0);
  const status = getStatusFromProgress(progress);
  const isAchieved = goal.status === 'achieved' || progress >= 100;

  const monthsRemaining = getMonthsRemaining(goal.deadline);
  const monthsElapsed = getMonthsElapsed(goal.start_date);
  const monthlyDeposit = (goal.deposit_amount || 0) * freqToMonthlyMultiplier(goal.frequency);
  const ideal = idealMonthlyDeposit(goal.target_amount || 0, goal.current_amount || 0, monthsRemaining);
  const onTrack = monthlyDeposit >= ideal;

  const cat = CATEGORIES[goal.category] || CATEGORIES.lainnya;
  const prio = PRIORITY_STYLES[goal.priority] || PRIORITY_STYLES.medium;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${isAchieved ? 'border-emerald-200 bg-emerald-50/30' : 'border-border bg-card'}`}>
      {/* Image or color strip */}
      {goal.target_image ? (
        <div className="h-28 w-full relative overflow-hidden">
          <img src={goal.target_image} alt={goal.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${goal.color}CC, transparent 60%)` }} />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <span className="text-white font-heading font-bold text-sm drop-shadow">{goal.name}</span>
            <span className="text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur" style={{ background: cat.color + '99' }}>{cat.label}</span>
          </div>
        </div>
      ) : (
        <div className="h-2 w-full" style={{ background: goal.color || '#10B981' }} />
      )}

      <div className="p-4 space-y-3">
        {!goal.target_image && (
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0" style={{ background: goal.color || '#10B981' }}>
                {goal.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="font-heading font-semibold text-foreground text-sm truncate">{goal.name}</p>
                <p className="text-[10px] text-muted-foreground">{cat.label} · {goal.currency}</p>
              </div>
            </div>
            <div className="flex gap-0.5 shrink-0">
              <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"><Pencil size={13} /></button>
              <button onClick={() => onDelete(goal)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        )}

        {goal.target_image && (
          <div className="flex justify-end gap-0.5 -mt-2">
            <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"><Pencil size={13} /></button>
            <button onClick={() => onDelete(goal)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-heading font-bold text-foreground">{formatCurrency(goal.current_amount || 0, goal.currency)}</span>
            <span className="text-sm font-bold" style={{ color: status.color }}>{progress.toFixed(1)}%</span>
          </div>
          <ProgressBar pct={progress} color={goal.color} />
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="bg-muted/40 rounded-lg p-1.5">
              <p className="text-[9px] text-muted-foreground uppercase">Target</p>
              <p className="text-[11px] font-bold text-foreground">{formatCompact(goal.target_amount || 0)}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-1.5">
              <p className="text-[9px] text-muted-foreground uppercase">Terkumpul</p>
              <p className="text-[11px] font-bold" style={{ color: goal.color }}>{formatCompact(goal.current_amount || 0)}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-1.5">
              <p className="text-[9px] text-muted-foreground uppercase">Sisa</p>
              <p className="text-[11px] font-bold text-muted-foreground">{formatCompact(remaining)}</p>
            </div>
          </div>
        </div>

        {/* Target per bulan & setoran */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
            <CalendarClock size={12} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Target/Bulan</p>
              <p className="font-bold text-foreground">{formatCurrency(ideal, goal.currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
            <Wallet size={12} className="text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Setoran Saat Ini</p>
              <p className={`font-bold ${onTrack ? 'text-emerald-600' : 'text-amber-600'}`}>{formatCurrency(monthlyDeposit, goal.currency)}</p>
            </div>
          </div>
        </div>

        {/* Sisa waktu & prediksi */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock size={11} />
            <span>{isAchieved ? 'Tercapai' : monthsRemaining > 0 ? `${monthsRemaining} bulan tersisa` : 'Lewat deadline'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: status.color + '18', color: status.color }}>{status.label}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: prio.bg, color: prio.color }}>{prio.label}</span>
          </div>
        </div>

        <button onClick={() => onOpenDetail(goal)} className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg py-2 transition-colors">
          <Activity size={13} /> Lihat Analisis & Simulasi
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}