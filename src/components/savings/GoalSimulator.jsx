import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Clock3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatCompact } from '@/lib/utils/finance';
import { getMonthsRemaining, calcProgress, estimateCompletionDate, calcLateMonths } from '@/lib/savingGoalCalc';

const SLIDER_PRESETS = [2000000, 3000000, 5000000, 8000000, 10000000];

export default function GoalSimulator({ goal }) {
  const [deposit, setDeposit] = useState((goal.deposit_amount || 0) * (goal.frequency === 'daily' ? 30 : goal.frequency === 'weekly' ? 4.33 : 1));
  const target = goal.target_amount || 0;
  const current = goal.current_amount || 0;
  const monthsRemaining = getMonthsRemaining(goal.deadline);
  const ideal = monthsRemaining > 0 ? (target - current) / monthsRemaining : 0;
  const shortfall = Math.max(0, target - (current + deposit * monthsRemaining));
  const estDate = estimateCompletionDate(current, target, deposit);
  const lateMonths = calcLateMonths(estDate, goal.deadline);
  const projectedProgress = target > 0 ? Math.min(100, ((current + deposit * monthsRemaining) / target) * 100) : 0;

  // Projection chart data
  const chartData = useMemo(() => {
    const arr = [];
    let cum = current;
    const totalMonths = Math.max(monthsRemaining, 12);
    for (let i = 0; i <= totalMonths; i++) {
      arr.push({
        label: `Bulan ${i}`,
        actual: Math.round(cum),
        target,
      });
      cum += deposit;
    }
    return arr;
  }, [current, deposit, monthsRemaining, target]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-primary mb-3">
          <TrendingUp size={16} />
          <h4 className="text-sm font-heading font-bold">Simulasi Setoran Tabungan</h4>
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Setoran per bulan</span>
            <span className="text-lg font-heading font-bold text-primary">{formatCurrency(deposit, goal.currency)}</span>
          </div>
          <Slider value={[deposit]} max={Math.max(SLIDER_PRESETS[SLIDER_PRESETS.length - 1], ideal * 2, deposit * 1.5)} min={0} step={500000}
            onValueChange={v => setDeposit(v[0])} />
          <div className="flex flex-wrap gap-1.5">
            {SLIDER_PRESETS.map(v => (
              <button key={v} onClick={() => setDeposit(v)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${deposit === v ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
                {formatCompact(v)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Clock3 size={16} className="mx-auto text-muted-foreground mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase">Estimasi Selesai</p>
          <p className="text-sm font-bold text-foreground">{estDate || '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <AlertTriangle size={16} className="mx-auto text-muted-foreground mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase">Keterlambatan</p>
          <p className={`text-sm font-bold ${lateMonths > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {lateMonths > 0 ? `${lateMonths} bulan` : 'Tepat Waktu'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <CheckCircle2 size={16} className="mx-auto text-muted-foreground mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase">Progress Proyeksi</p>
          <p className="text-sm font-bold" style={{ color: projectedProgress >= 100 ? '#10B981' : '#F59E0B' }}>
            {projectedProgress.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Projection chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-foreground mb-3">Proyeksi Akumulasi Dana</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.ceil(chartData.length / 8)} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} />
            <Tooltip formatter={v => formatCurrency(v, goal.currency)} labelFormatter={l => l} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="actual" name="Dana Akumulasi" stroke="#6366F1" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="target" name="Target" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {shortfall > 0 ? (
        <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-amber-800">
            Dengan setoran {formatCurrency(deposit, goal.currency)}/bulan, target <strong>terlambat {lateMonths} bulan</strong> dan masih kekurangan <strong>{formatCurrency(shortfall, goal.currency)}</strong> di deadline.
            Naikkan setoran ke <strong>{formatCurrency(ideal, goal.currency)}/bulan</strong> untuk tepat waktu.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-emerald-800">
            Dengan setoran {formatCurrency(deposit, goal.currency)}/bulan, target <strong>tercapai tepat waktu</strong> pada {estDate}. Pertahankan konsistensi!
          </p>
        </div>
      )}
    </div>
  );
}