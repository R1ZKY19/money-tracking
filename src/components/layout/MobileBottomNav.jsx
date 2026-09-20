import { Link, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOBILE_PRIMARY } from '@/components/layout/mobileNavConfig';

export default function MobileBottomNav({ onMore }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Navigasi utama mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg lg:hidden safe-bottom">
      {MOBILE_PRIMARY.map(({ path, label, icon: Icon }) => {
        const active = pathname === path;
        return <Link key={path} to={path} aria-current={active ? 'page' : undefined} className={cn('flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[9px] font-medium transition-colors active:bg-sidebar-accent', active ? 'text-login-highlight' : 'text-sidebar-foreground/65')}>
          <Icon size={19} strokeWidth={active ? 2.4 : 1.8} /><span className="w-full truncate text-center">{label}</span>
        </Link>;
      })}
      <button type="button" onClick={onMore} className="flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[9px] font-medium text-sidebar-foreground/65 transition-colors active:bg-sidebar-accent" aria-label="Buka semua fitur">
        <MoreHorizontal size={20} /><span>More</span>
      </button>
    </nav>
  );
}