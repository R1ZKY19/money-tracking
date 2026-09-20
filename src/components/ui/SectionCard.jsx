import { cn } from '@/lib/utils';

export default function SectionCard({ title, subtitle, action, children, className, noPadding }) {
  return (
    <div className={cn(
      'enterprise-section bg-card rounded-xl border border-border overflow-hidden',
      className
    )} style={{ boxShadow: 'var(--shadow-md)' }}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-y-2 flex-wrap px-4 sm:px-5 py-3.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-1 h-4 rounded-full bg-primary/60 shrink-0" />
            <div>
              <h3 className="font-heading font-medium text-foreground text-xs leading-relaxed uppercase tracking-[1.2px]">{title}</h3>
              {subtitle && <p className="text-muted-foreground text-[11px] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="ml-3 shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(noPadding ? '' : 'p-4 sm:p-5')}>
        {children}
      </div>
    </div>
  );
}