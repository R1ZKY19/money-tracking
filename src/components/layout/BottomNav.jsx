import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, ArrowRightLeft, Landmark, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transaksi', label: 'Transaksi', icon: List },
  { path: '/transfer',  label: 'Transfer',  icon: ArrowRightLeft },
  { path: '/saldo',     label: 'Saldo',     icon: Landmark },
];

export default function BottomNav({ onMenuOpen }) {
  const location = useLocation();

  return (
    <nav
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 lg:hidden flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #0B5D75 0%, #074a5e 100%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        borderRadius: '14px 0 0 14px',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
      }}
    >
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-3 px-2.5 transition-all active:scale-95',
              isActive ? 'text-white' : 'text-white/50'
            )}
          >
            <div className={cn(
              'w-9 h-9 flex items-center justify-center rounded-xl transition-all',
              isActive && 'bg-white/20'
            )}>
              <Icon size={isActive ? 20 : 18} />
            </div>
            <span className="text-[9px] font-semibold leading-none text-center w-12">{label}</span>
          </Link>
        );
      })}

      {/* Divider */}
      <div className="mx-auto w-6 h-px bg-white/20 my-1" />

      {/* Menu button */}
      <button
        onClick={onMenuOpen}
        className="flex flex-col items-center justify-center gap-1 py-3 px-2.5 text-white/50 active:scale-95 transition-all"
      >
        <div className="w-9 h-9 flex items-center justify-center rounded-xl">
          <MoreHorizontal size={18} />
        </div>
        <span className="text-[9px] font-semibold leading-none">Menu</span>
      </button>
    </nav>
  );
}