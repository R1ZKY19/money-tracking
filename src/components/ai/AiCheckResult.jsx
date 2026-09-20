import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, Lightbulb } from 'lucide-react';

const STYLE = {
  good:    { icon: CheckCircle2,  cls: 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/15', ic: 'text-emerald-600' },
  info:    { icon: Info,          cls: 'border-sky-400 bg-sky-50/60 dark:bg-sky-900/15',             ic: 'text-sky-600' },
  warning: { icon: AlertTriangle, cls: 'border-amber-400 bg-amber-50/60 dark:bg-amber-900/15',       ic: 'text-amber-600' },
  danger:  { icon: XCircle,       cls: 'border-red-400 bg-red-50/60 dark:bg-red-900/15',             ic: 'text-red-600' },
};
const scoreColor = s => s >= 80 ? '#10B981' : s >= 60 ? '#6EE7B7' : s >= 40 ? '#F59E0B' : '#EF4444';

export default function AiCheckResult({ result }) {
  const color = scoreColor(result.score);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/30">
        <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white" style={{ background: color }}>
          <span className="text-2xl font-heading font-bold leading-none">{result.score}</span>
          <span className="text-[9px] font-semibold opacity-80">/100</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-heading font-bold text-foreground">{result.label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{result.summary}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Temuan</p>
          {result.findings.map((f, i) => { const s = STYLE[f.type] || STYLE.info; const Icon = s.icon; return (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
              className={`flex items-start gap-2 p-2.5 rounded-xl border-l-4 ${s.cls}`}>
              <Icon size={14} className={`${s.ic} shrink-0 mt-0.5`} /><p className="text-xs text-foreground leading-relaxed">{f.text}</p>
            </motion.div>
          ); })}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rekomendasi</p>
          {result.recommendations.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
              className="flex items-start gap-2 p-2.5 rounded-xl border border-border bg-card">
              <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" /><p className="text-xs text-foreground leading-relaxed">{r}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}