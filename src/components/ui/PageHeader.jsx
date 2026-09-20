import { cn } from '@/lib/utils';

export default function PageHeader({ title, subtitle, action, icon: Icon, className }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 sm:gap-4', className)}>
      <div className="flex items-center gap-3.5 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.12)' }}>
            <Icon size={18} className="text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-heading font-semibold text-foreground leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 w-full sm:w-auto">{action}</div>}
    </div>
  );
}