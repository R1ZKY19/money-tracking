import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Premium KPI Card — Fintech 2026 style
 * Props:
 *  title, value, subtitle, icon (React component), iconBg, trend (number), trendLabel,
 *  accentClass (kpi-blue | kpi-green | kpi-red | kpi-amber | kpi-indigo | kpi-teal)
 *  footer (JSX), loading
 */
export default function KpiCard({
  title, value, subtitle, icon: Icon, iconBg, iconColor,
  trend, trendLabel, accentClass = 'kpi-blue',
  footer, loading, className
}) {
  const trendUp = trend > 0;
  const trendDown = trend < 0;

  if (loading) {
    return (
      <div className={cn('kpi-card', accentClass, className)}>
        <div className="skeleton h-4 w-24 mb-4" />
        <div className="skeleton h-7 w-32 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={cn('kpi-card', accentClass, className)}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[1.2px] leading-none">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconBg || 'hsl(var(--muted))' }}
          >
            <Icon size={16} style={{ color: iconColor || 'hsl(var(--primary))' }} />
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-xl font-heading font-bold text-foreground leading-tight tracking-tight mb-1 animate-count-up">
        {value}
      </p>

      {/* Trend */}
      {(trend !== undefined && trend !== null) && (
        <div className="flex items-center gap-1 mt-1">
          <div className={cn(
            'flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold',
            trendUp && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
            trendDown && 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
            !trendUp && !trendDown && 'bg-muted text-muted-foreground',
          )}>
            {trendUp && <TrendingUp size={10} />}
            {trendDown && <TrendingDown size={10} />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
          {trendLabel && <span className="text-[10px] text-muted-foreground">{trendLabel}</span>}
        </div>
      )}

      {/* Footer */}
      {footer && <div className="mt-2 pt-2 border-t border-border/50">{footer}</div>}
    </div>
  );
}