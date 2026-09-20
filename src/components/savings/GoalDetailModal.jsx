import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Sparkles, AlertTriangle, CheckCircle2, Bell, CalendarDays, TrendingUp, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatCurrency, formatCompact } from '@/lib/utils/finance';
import {
  CATEGORIES, calcProgress, calcRemaining, getStatusFromProgress, getMonthsRemaining, getMonthsElapsed,
  idealMonthlyDeposit, projectedFundAtDeadline, estimateCompletionDate, calcLateMonths,
  calcSuccessProbability, generateRecommendations, generateTimeline, hasDepositedThisMonth,
  freqToMonthlyMultiplier,
} from '@/lib/savingGoalCalc';
import GoalSimulator from './GoalSimulator';

const REC_ICON = { increase_deposit: TrendingUp, extend_duration: CalendarDays, add_initial: Wallet, reduce_target: ArrowDownRight, good: CheckCircle2 };

export default function GoalDetailModal({ goal, monthlyHistory, allTransactions, open, onClose }) {
  const target = goal.target_amount || 0;
  const current = goal.current_amount || 0;
  const progress = calcProgress(current, target);
  const remaining = calcRemaining(target, current);
  const status = getStatusFromProgress(progress);

  const monthsRemaining = getMonthsRemaining(goal.deadline);
  const monthsElapsed = getMonthsElapsed(goal.start_date);
  const monthlyDeposit = (goal.deposit_amount || 0) * freqToMonthlyMultiplier(goal.frequency);
  const ideal = idealMonthlyDeposit(target, current, monthsRemaining);
  const projected = projectedFundAtDeadline(current, monthlyDeposit, monthsRemaining);
  const estDate = estimateCompletionDate(current, target, monthlyDeposit);
  const lateMonths = calcLateMonths(estDate, goal.deadline);
  const probability = calcSuccessProbability(goal, monthlyHistory);
  const recs = useMemo(() => generateRecommendations(goal, monthlyDeposit, ideal, probability), [goal, monthlyDeposit, ideal, probability]);

  const timeline = useMemo(() => generateTimeline(goal, monthlyHistory), [goal, monthlyHistory]);
  const depositedThisMonth = hasDepositedThisMonth(monthlyHistory);

  // Charts data
  const donutData = [
    { name: 'Terkumpul', value: current, color: status.color },
    { name: 'Sisa', value: remaining, color: '#E2E8F0' },
  ];

  const monthlyChartData = useMemo(() => {
    return monthlyHistory.slice(-12).map(m => ({
      label: new Date(m.key + '-01').toLocaleDateString('id-ID', { month: 'short' }),
      amount: m.amount,
    }));
  }, [monthlyHistory]);

  const projectionData = useMemo(() => {
    const arr = [];
    let cum = current;
    const totalMonths = Math.max(monthsRemaining, 12);
    for (let i = 0; i <= totalMonths; i++) {
      arr.push({
        label: `Bulan ${i}`,
        akumulasi: Math.round(cum),
        target,
      });
      cum += monthlyDeposit;
    }
    return arr;
  }, [current, monthlyDeposit, monthsRemaining, target]);

  const cat = CATEGORIES[goal.category] || CATEGORIES.lainnya;

  if (!goal || !goal.id) return null;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            {goal.target_image ? (
              <img src={goal.target_image} alt={goal.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: goal.color }}>
                {goal.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base truncate">{goal.name}</SheetTitle>
              <p className="text-xs text-muted-foreground">{cat.label} · {goal.currency}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: status.color + '18', color: status.color }}>{status.label}</span>
          </div>
        </SheetHeader>

        <div className="space-y-5 pt-4">
          {/* Reminders */}
          {!depositedThisMonth && monthsRemaining > 0 && (
            <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-xl p-3">
              <Bell size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-800 font-medium">Anda belum melakukan tabungan bulan ini. Yuk setor agar target tetap on track!</p>
            </div>
          )}
          {lateMonths > 0 && monthsRemaining > 0 && (
            <div className="flex items-start gap-2 text-xs bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle size={14} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-red-800 font-medium">Dengan kondisi saat ini, target diperkirakan terlambat sekitar <strong>{lateMonths} bulan</strong>.</p>
            </div>
          )}

          {/* Prediction card */}
          <div className="rounded-2xl border border-border p-4" style={{ background: `linear-gradient(135deg, ${goal.color}10, transparent)` }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={15} className="text-primary" />
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Prediksi Kemungkinan Berhasil</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke={status.color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(probability / 100) * 213.6} 213.6`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-heading font-bold" style={{ color: status.color }}>{probability}%</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dengan nominal tabungan saat ini, peluang target selesai tepat waktu sebesar <strong style={{ color: status.color }}>{probability}%</strong>.
                  {projected < target ? (
                    <> Masih terdapat kekurangan <strong>{formatCurrency(target - projected, goal.currency)}</strong>. Disarankan meningkatkan tabungan menjadi <strong>{formatCurrency(ideal, goal.currency)}</strong> per bulan agar peluang menjadi 100%.</>
                  ) : (
                    <strong> Target diperkirakan tercapai tepat waktu!</strong>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Progress</p>
              <p className="text-base font-bold" style={{ color: status.color }}>{progress.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Sisa Target</p>
              <p className="text-base font-bold text-foreground">{formatCompact(remaining)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Estimasi Selesai</p>
              <p className="text-sm font-bold text-foreground">{estDate || '—'}</p>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-amber-500" />
              <p className="text-sm font-heading font-bold">Rekomendasi AI</p>
            </div>
            <div className="space-y-2">
              {recs.map((r, i) => {
                const Icon = REC_ICON[r.type] || CheckCircle2;
                return (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/20 p-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: r.color + '18', color: r.color }}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donut + monthly bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-foreground mb-2">Persentase Target</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v, goal.currency)} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center text-sm font-bold" style={{ color: status.color }}>{progress.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-foreground mb-2">Tabungan per Bulan</p>
              {monthlyChartData.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-xs">Belum ada riwayat</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => formatCompact(v)} />
                    <Tooltip formatter={v => formatCurrency(v, goal.currency)} />
                    <Bar dataKey="amount" fill={goal.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Projection line chart */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-foreground mb-2">Prediksi Sampai Deadline (Target vs Realisasi)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={projectionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={Math.ceil(projectionData.length / 8)} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => formatCompact(v)} />
                <Tooltip formatter={v => formatCurrency(v, goal.currency)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="akumulasi" name="Dana Akumulasi" stroke={goal.color} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="target" name="Target" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Simulator */}
          <GoalSimulator goal={goal} />

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={15} className="text-primary" />
                <p className="text-sm font-heading font-bold">Timeline Tabungan Bulanan</p>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {timeline.map((m, i) => (
                  <div key={m.key} className={`flex items-center gap-3 p-2 rounded-lg ${m.isCurrent ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.deposited ? 'bg-emerald-500' : m.isCurrent ? 'bg-amber-400' : 'bg-muted-foreground/30'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{m.label}</p>
                    </div>
                    {m.deposited ? (
                      <span className="text-xs font-bold text-emerald-600">{formatCurrency(m.amount, goal.currency)}</span>
                    ) : m.isCurrent ? (
                      <span className="text-[11px] font-semibold text-amber-600">Bulan ini</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Belum menabung</span>
                    )}
                    {m.deposited && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}