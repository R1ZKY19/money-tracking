import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/lib/UserRoleContext';
import { MOBILE_MORE_GROUPS } from '@/components/layout/mobileNavConfig';
import MobileLogoutButton from '@/components/layout/MobileLogoutButton';

export default function MobileMoreMenu({ open, onClose }) {
  const { pathname } = useLocation();
  const { hasModule } = useUserRole();
  if (!open) return null;
  return <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Semua fitur">
    <button className="absolute inset-0 h-full w-full bg-login-navy/65 backdrop-blur-sm" onClick={onClose} aria-label="Tutup menu" />
    <section className="absolute inset-x-0 bottom-0 max-h-[88dvh] touch-pan-y overflow-y-auto overscroll-contain rounded-t-xl border-t border-border bg-background px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4 shadow-xl animate-in slide-in-from-bottom duration-300" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Semua Fitur</h2><p className="mt-1 text-xs text-muted-foreground">Pilih fitur yang ingin Anda buka</p></div><button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card" aria-label="Tutup"><X size={19} /></button></div>
      <div className="space-y-6">
        {MOBILE_MORE_GROUPS.map(group => {
          const items = group.items.filter(item => hasModule(item.module));
          if (!items.length) return null;
          return <div key={group.label}><h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">{group.label}</h3><div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items.map(({ path, label, icon: Icon }) => <Link key={path} to={path} onClick={onClose} className={cn('flex min-h-[92px] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center shadow-sm transition-colors active:bg-accent', pathname === path ? 'border-primary text-primary' : 'border-border text-foreground')}><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary"><Icon size={19} /></span><span className="w-full break-words text-[11px] font-medium leading-tight">{label}</span></Link>)}
          </div></div>;
        })}
        <MobileLogoutButton />
      </div>
    </section>
  </div>;
}