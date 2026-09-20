import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, PiggyBank, CreditCard, HandCoins,
  Landmark, List, Settings, ChevronRight, ClipboardList, History,
  LogOut, Globe, Shield, ArrowRightLeft, BookOpen, Sun, Moon, TrendingUp,
  Palette, ChevronLeft, X, Menu, UserCircle, Crown, Gem, Star, Users, BadgeCheck
} from 'lucide-react';
import ProfilModal from '@/components/ProfilModal';
import BrandLogo from '@/components/ui/BrandLogo';
import { cn } from '@/lib/utils';
import { supabase } from '@/api/supabaseClient';
import { useLanguage } from '@/lib/LanguageContext';
import { useTheme } from '@/lib/ThemeContext';
import { useFeatureColor } from '@/lib/FeatureColorContext';
import { logLogout } from '@/lib/activityLogger';
import { useUserRole } from '@/lib/UserRoleContext';
import RoleCrest from '@/components/role/RoleCrest';
import RoleBadge from '@/components/role/RoleBadge';



export default function RightSideNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t, lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currentColor, colorIndex, setColor, FEATURE_COLORS } = useFeatureColor();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showProfil, setShowProfil] = useState(false);
  const { user: currentUser, role: userRole, hasModule } = useUserRole();


  const allNavGroups = [
    {
      label: t('dashboard'),
      items: [
        { path: '/panduan',   label: t('featureGuide'),      icon: BookOpen,        module: 'Panduan' },
        { path: '/',          label: t('monthlyDashboard'),  icon: LayoutDashboard, module: 'Dashboard Bulanan' },
        { path: '/tahunan',   label: t('yearlyDashboard'),   icon: Calendar,        module: 'Dashboard Tahunan' },
        { path: '/yoy',       label: t('yoyComparison'),     icon: TrendingUp,      module: 'YoY Comparison' },
      ]
    },
    {
      label: t('management'),
      items: [
        { path: '/transaksi', label: t('inputTransaction'),  icon: List,            module: 'Input Transaksi' },
        { path: '/riwayat',   label: t('transactionHistory'),icon: History,         module: 'Riwayat Transaksi' },
        { path: '/transfer',  label: t('transferAccount'),   icon: ArrowRightLeft,  module: 'Transfer' },
        { path: '/budget',    label: t('budgetPlan'),        icon: ClipboardList,   module: 'Budget' },
        { path: '/tabungan',  label: t('financialGoals'),    icon: PiggyBank,       module: 'Tabungan' },
      ]
    },
    {
      label: t('finance'),
      items: [
        { path: '/hutang',    label: t('debt'),              icon: CreditCard,  module: 'Hutang' },
        { path: '/piutang',   label: t('receivable'),        icon: HandCoins,   module: 'Piutang' },
        { path: '/saldo',     label: t('accountBalance'),    icon: Landmark,    module: 'Saldo Rekening' },
        { path: '/networth',  label: t('netWorth'),          icon: TrendingUp,  module: 'Net Worth' },
      ]
    },
    {
      label: t('system'),
      items: [
        { path: '/pengaturan',label: t('settings'),          icon: Settings, module: 'Pengaturan' },
        { path: '/log',       label: t('activityLog'),       icon: Shield,   module: 'Log Aktivitas' },
      ]
    },
  ];

  const navGroups = allNavGroups
    .map(g => ({ ...g, items: g.items.filter(i => hasModule(i.module)) }))
    .filter(g => g.items.length > 0);

  const handleLogout = async () => {
    await logLogout();
    supabase.auth.signOut().then(() => { window.location.href = '/login'; });
  };

  return (
    <>
      {/* Toggle button — menempel di kanan layar */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 lg:hidden flex flex-col items-center justify-center gap-1 py-4 px-2 no-print"
        style={{
          background: 'hsl(var(--sidebar-background))',
          borderRadius: '12px 0 0 12px',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.35)',
          minWidth: 40,
        }}
        aria-label="Buka menu"
      >
        <Menu size={18} className="text-white" />
        <span className="text-[8px] text-white/70 font-semibold uppercase tracking-wide" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: 1 }}>Menu</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full z-50 flex flex-col lg:hidden transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{
          width: 260,
          background: 'hsl(var(--sidebar-background))',
          boxShadow: '-6px 0 30px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <BrandLogo className="w-40 h-auto" />
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Info Card */}
        {currentUser && (
          <button onClick={() => { setShowProfil(true); setOpen(false); }}
            className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-2xl border border-white/15 bg-white/8 hover:bg-white/15 transition-all flex items-center gap-2.5 shrink-0 text-left w-[calc(100%-24px)]">
            <RoleCrest role={userRole} size="md">
              {currentUser.avatar_url
                ? <img src={currentUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : null}
            </RoleCrest>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-white text-[11px] font-semibold truncate leading-tight">
                  {currentUser.email}
                </p>
                <BadgeCheck size={12} className="text-blue-400 fill-blue-400 shrink-0" />
              </div>
              <span className="inline-block mt-1"><RoleBadge role={userRole} size="sm" /></span>
            </div>
          </button>
        )}
        <ProfilModal open={showProfil} onClose={() => setShowProfil(false)} />

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1.5 mb-1">
                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.12em]">{group.label}</p>
              </div>
              <div className="space-y-0.5">
                {group.items.map(({ path, label, icon: NavIcon }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 group relative',
                        isActive ? 'bg-white/15' : 'hover:bg-white/8'
                      )}
                    >
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4/5 rounded-full bg-info" />}
                      <NavIcon className={cn('shrink-0 ml-0.5', isActive ? 'text-info' : 'text-white/45 group-hover:text-white/70')} size={15} />
                      <span className={cn('text-xs font-medium flex-1 leading-tight', isActive ? 'text-white font-semibold' : 'text-white/60 group-hover:text-white/85')}>
                        {label}
                      </span>
                      {isActive && <ChevronRight className="w-3 h-3 text-white/40" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 shrink-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs flex-1"
            >
              <Globe size={12} />
              {lang.toUpperCase()}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 rounded-lg text-white/40 hover:text-emerald-300 hover:bg-white/10 transition-all"
                title="Warna tema"
              >
                <Palette size={13} />
              </button>
              {showColorPicker && (
                <div className="absolute bottom-full mb-2 right-0 bg-sidebar border border-white/20 rounded-lg p-2 space-y-1 w-32 z-10">
                  {FEATURE_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setColor(idx); setShowColorPicker(false); }}
                      className={cn(
                        'w-full text-left px-2.5 py-1 rounded text-xs text-white transition-all',
                        colorIndex === idx ? 'bg-white/30 font-semibold' : 'hover:bg-white/20'
                      )}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-white/40 hover:text-yellow-300 hover:bg-white/10 transition-all"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-white/40 hover:text-red-300 hover:bg-white/10 transition-all"
              title="Logout"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}