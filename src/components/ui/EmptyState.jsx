import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Reusable empty state component.
 * Usage: <EmptyState icon="📊" title="Tidak ada data" desc="Tambah data pertama kamu" action={<Button>Tambah</Button>} />
 */
export default function EmptyState({ icon, title, desc, action, className, size = 'md' }) {
  const sizes = {
    sm: { wrap: 'py-8',   iconText: 'text-3xl', title: 'text-sm', desc: 'text-xs' },
    md: { wrap: 'py-12',  iconText: 'text-4xl', title: 'text-sm', desc: 'text-xs' },
    lg: { wrap: 'py-16',  iconText: 'text-5xl', title: 'text-base', desc: 'text-sm' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-4', s.wrap, className)}>
      {icon && (
        <div className={cn('mb-3 opacity-40 select-none', s.iconText)}>{icon}</div>
      )}
      {title && (
        <p className={cn('font-semibold text-foreground mb-1', s.title)}>{title}</p>
      )}
      {desc && (
        <p className={cn('text-muted-foreground mb-4 max-w-xs leading-relaxed', s.desc)}>{desc}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}