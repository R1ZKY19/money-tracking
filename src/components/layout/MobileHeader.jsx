import { useLocation } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';
import ReminderBell from '@/components/layout/ReminderBell';
import ConsultationBadge from '@/components/konsultasi/ConsultationBadge';

const PAGE_TITLES = {
  '/':               { title: 'Dashboard Bulanan',   subtitle: 'Monthly Overview' },
  '/tahunan':        { title: 'Dashboard Tahunan',   subtitle: 'Annual Overview' },
  '/yoy':            { title: 'Year-over-Year',       subtitle: 'Trend Comparison' },
  '/budget':         { title: 'Budget Plan',          subtitle: 'Financial Planning' },
  '/laporan':        { title: 'Laporan Keuangan',     subtitle: 'Financial Report' },
  '/rutin':          { title: 'Transaksi Rutin',      subtitle: 'Recurring Transactions' },
  '/kalender':       { title: 'Kalender Keuangan',    subtitle: 'Financial Calendar' },
  '/tabungan':       { title: 'Target Tabungan',      subtitle: 'Savings Goals' },
  '/transaksi':      { title: 'Input Transaksi',      subtitle: 'Record Transaction' },
  '/riwayat':        { title: 'Riwayat Transaksi',   subtitle: 'Transaction History' },
  '/transfer':       { title: 'Transfer Rekening',   subtitle: 'Account Transfer' },
  '/hutang':         { title: 'Manajemen Hutang',     subtitle: 'Debt Management' },
  '/piutang':        { title: 'Piutang',              subtitle: 'Receivables' },
  '/saldo':          { title: 'Saldo Akun',           subtitle: 'Account Balance' },
  '/cross-check-saldo': { title: 'Cross Check Saldo Bank', subtitle: 'Rekonsiliasi Rekening' },
  '/networth':       { title: 'Net Worth',            subtitle: 'Wealth Tracker' },
  '/pengaturan':     { title: 'Pengaturan',           subtitle: 'Settings' },
  '/log':            { title: 'Log Aktivitas',        subtitle: 'Activity Log' },
  '/panduan':        { title: 'Panduan Fitur',        subtitle: 'Feature Guide' },
  '/profile-premium':{ title: 'Profil Premium',       subtitle: 'Your Profile' },
};

export default function MobileHeader() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const page = PAGE_TITLES[location.pathname] || { title: 'MONEY TRACKING', subtitle: 'Finance Dashboard' };

  return (
    <header
      className="enterprise-topbar flex items-center gap-3 bg-sidebar text-sidebar-foreground border-b border-sidebar-border"
      style={{
        padding: 'max(12px, env(safe-area-inset-top)) 16px 12px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Logo mark */}
      <BrandLogo className="w-24 sm:w-32 h-9 shrink-0" />

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-heading font-bold text-sidebar-foreground leading-tight truncate tracking-tight">
          {page.title}
        </p>
        <p className="text-[10px] text-sidebar-foreground/70 leading-none mt-0.5 font-medium">{page.subtitle}</p>
      </div>

      {/* Pesan konsultasi belum dibaca */}
      <ConsultationBadge />

      {/* Reminder jatuh tempo */}
      <ReminderBell />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground hover:text-sidebar-primary transition-colors shrink-0"
        aria-label={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </header>
  );
}