import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, PiggyBank, CreditCard, HandCoins,
  Landmark, List, Settings, ChevronRight, ClipboardList, History,
  Shield, ArrowRightLeft, BookOpen, TrendingUp, ScanSearch,
  Crown, Gem, Star, Users, BadgeCheck, FileText, Repeat, CalendarDays, MessageCircle, Tag
} from 'lucide-react';
import ProfilModal from '@/components/ProfilModal';
import BrandLogo from '@/components/ui/BrandLogo';
import SidebarFooter from '@/components/layout/SidebarFooter';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useUserRole } from '@/lib/UserRoleContext';
import useUnreadConsultation from '@/components/konsultasi/useUnreadConsultation';
import { ROLE_VISUALS } from '@/lib/roleVisuals';

const ROLE_CFG = ROLE_VISUALS;



export default function Sidebar({ onClose }) {
  const location = useLocation();
  const { t } = useLanguage();
  const [showProfil, setShowProfil] = useState(false);
  const { user: currentUser, role: userRole, hasModule, refresh } = useUserRole();
  const unreadChat = useUnreadConsultation();

  const roleCfg = ROLE_CFG[userRole] || ROLE_CFG.none;
  const RoleIcon = roleCfg.icon;

  useEffect(() => { if (!showProfil) refresh(); }, [showProfil]);

  const NAV_GROUPS = [
    {
      key: t('dashboard').toUpperCase(), emoji: '📊',
      items: [
        { path: '/paket-harga', label: 'Paket & Harga',      icon: Tag },
        { path: '/panduan',  label: t('featureGuide'),      icon: BookOpen,        module: 'Panduan' },
        { path: '/',         label: t('monthlyDashboard'),   icon: LayoutDashboard, module: 'Dashboard Bulanan' },
        { path: '/tahunan',  label: t('yearlyDashboard'),    icon: Calendar,        module: 'Dashboard Tahunan' },
        { path: '/yoy',      label: t('yoyComparison'),      icon: TrendingUp,      module: 'YoY Comparison' },
      ]
    },
    {
      key: t('management').toUpperCase(), emoji: '💼',
      items: [
        { path: '/transaksi', label: t('inputTransaction'),   icon: List,           module: 'Input Transaksi' },
        { path: '/riwayat',   label: t('transactionHistory'), icon: History,        module: 'Riwayat Transaksi' },
        { path: '/transfer',  label: t('transferAccount'),    icon: ArrowRightLeft,  module: 'Transfer' },
        { path: '/rutin',     label: 'Transaksi Rutin',       icon: Repeat,          module: 'Transaksi Rutin' },
        { path: '/kalender',  label: 'Kalender Keuangan',     icon: CalendarDays,    module: 'Kalender' },
      ]
    },
    {
      key: t('budgetPlan').toUpperCase(), emoji: '📋',
      items: [
        { path: '/budget',   label: t('budgetPlan'),      icon: ClipboardList, module: 'Budget' },
        { path: '/tabungan', label: t('financialGoals'),  icon: PiggyBank,     module: 'Tabungan' },
        { path: '/laporan',  label: 'Laporan Keuangan',   icon: FileText,      module: 'Laporan' },
      ]
    },
    {
      key: t('finance').toUpperCase(), emoji: '💰',
      items: [
        { path: '/hutang',   label: t('debt'),       icon: CreditCard, module: 'Hutang' },
        { path: '/piutang',  label: t('receivable'), icon: HandCoins,  module: 'Piutang' },
        { path: '/saldo',    label: t('accountBalance'), icon: Landmark, module: 'Saldo Rekening' },
        { path: '/cross-check-saldo', label: 'Cross Check Saldo', icon: ScanSearch, module: 'Saldo Rekening' },
        { path: '/networth', label: t('netWorth'),    icon: TrendingUp, module: 'Net Worth' },
      ]
    },
    {
      key: t('system').toUpperCase(), emoji: '⚙️',
      items: [
        { path: '/konsultasi', label: 'Konsultasi',      icon: MessageCircle, module: 'Konsultasi' },
        { path: '/pengaturan', label: t('settings'),     icon: Settings, module: 'Pengaturan' },
        { path: '/log',        label: t('activityLog'),  icon: Shield,   module: 'Log Aktivitas' },
      ]
    },
  ];

  const navGroups = NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => !i.module || hasModule(i.module)) }))
    .filter(g => g.items.length > 0);

  return (
    <aside
      className="enterprise-sidebar fixed left-0 top-0 h-screen w-64 flex flex-col z-30 overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
    >
      {/* ── LOGO HEADER ── */}
      <div className="flex flex-col items-center pt-6 pb-5 px-5 shrink-0">
        <BrandLogo className="w-full h-auto mb-3" />
        <div className="text-center">
          <h1 className="text-sidebar-primary font-heading font-semibold text-[13px] tracking-[1.2px] uppercase leading-tight">
            MONEY TRACKING
          </h1>
          <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase mt-0.5 font-body">
            Smart Financial Management
          </p>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="mx-5 mb-4 shrink-0"
        style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 px-3 overflow-y-auto" style={{ scrollbarWidth: 'none', paddingBottom: 4 }}>
        {navGroups.map((group, gi) => (
          <div key={group.key} className={gi > 0 ? 'mt-4' : ''}>
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-[9.5px] font-black uppercase tracking-[0.15em] text-white/30">
                {group.key}
              </span>
              <div className="flex-1 ml-1" style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ path, label, icon: NavIcon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link key={path} to={path} onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden',
                      isActive ? 'text-white' : 'text-white/55 hover:text-white/90'
                    )}
                    style={isActive ? {
                      background: 'hsl(var(--sidebar-accent))',
                      borderLeft: '3px solid hsl(var(--info))',
                    } : { borderLeft: '3px solid transparent' }}
                  >
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: 'rgba(255,255,255,0.05)' }} />
                    )}
                    <div className={cn(
                      'relative shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200',
                      isActive ? 'bg-sky-500/20' : 'bg-white/5 group-hover:bg-white/10'
                    )}>
                      <NavIcon size={14} className={cn(
                        'transition-colors duration-200',
                        isActive ? 'text-sky-300' : 'text-white/45 group-hover:text-white/80'
                      )} />
                    </div>
                    <span className={cn(
                      'relative text-[12.5px] leading-tight font-medium flex-1 truncate transition-all duration-200',
                      isActive ? 'font-semibold text-white' : 'group-hover:text-white/90'
                    )}>
                      {label}
                    </span>
                    {path === '/konsultasi' && unreadChat > 0 && (
                      <span className="relative shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadChat > 9 ? '9+' : unreadChat}
                      </span>
                    )}
                    {isActive && <ChevronRight size={12} className="shrink-0 text-sky-400/60 relative" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <div className="h-3" />
      </nav>

      {/* ── FOOTER (includes profile card) ── */}
      <div className="px-3 pb-3 pt-1 shrink-0">
        <SidebarFooter
          currentUser={currentUser}
          roleCfg={roleCfg}
          role={userRole}
          RoleIcon={RoleIcon}
          onOpenProfil={() => setShowProfil(true)}
        />
      </div>

      <ProfilModal open={showProfil} onClose={() => setShowProfil(false)} />

      <style>{`
        @keyframes sidebarPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%       { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </aside>
  );
}