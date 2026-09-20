import { LayoutDashboard, List, PiggyBank, CreditCard, HandCoins, Calendar, TrendingUp, History, ArrowRightLeft, ClipboardList, Landmark, ScanSearch, Settings, Shield, BookOpen, FileText, Repeat, CalendarDays, MessageCircle } from 'lucide-react';

export const MOBILE_PRIMARY = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, module: 'Dashboard Bulanan' },
  { path: '/transaksi', label: 'Transaksi', icon: List, module: 'Input Transaksi' },
  { path: '/tabungan', label: 'Tabungan', icon: PiggyBank, module: 'Tabungan' },
  { path: '/hutang', label: 'Hutang', icon: CreditCard, module: 'Hutang' },
  { path: '/piutang', label: 'Piutang', icon: HandCoins, module: 'Piutang' },
];

export const MOBILE_MORE_GROUPS = [
  { label: 'Dashboard', items: [
    { path: '/panduan', label: 'Panduan', icon: BookOpen, module: 'Panduan' },
    { path: '/tahunan', label: 'Tahunan', icon: Calendar, module: 'Dashboard Tahunan' },
    { path: '/yoy', label: 'Perbandingan YoY', icon: TrendingUp, module: 'YoY Comparison' },
  ]},
  { label: 'Manajemen', items: [
    { path: '/riwayat', label: 'Riwayat', icon: History, module: 'Riwayat Transaksi' },
    { path: '/transfer', label: 'Transfer', icon: ArrowRightLeft, module: 'Transfer' },
    { path: '/budget', label: 'Budget', icon: ClipboardList, module: 'Budget' },
    { path: '/laporan', label: 'Laporan', icon: FileText, module: 'Laporan' },
    { path: '/rutin', label: 'Transaksi Rutin', icon: Repeat, module: 'Transaksi Rutin' },
    { path: '/kalender', label: 'Kalender', icon: CalendarDays, module: 'Kalender' },
  ]},
  { label: 'Keuangan', items: [
    { path: '/saldo', label: 'Saldo Akun', icon: Landmark, module: 'Saldo Rekening' },
    { path: '/cross-check-saldo', label: 'Cross Check', icon: ScanSearch, module: 'Saldo Rekening' },
    { path: '/networth', label: 'Net Worth', icon: TrendingUp, module: 'Net Worth' },
  ]},
  { label: 'Sistem', items: [
    { path: '/konsultasi', label: 'Konsultasi', icon: MessageCircle, module: 'Konsultasi' },
    { path: '/pengaturan', label: 'Pengaturan', icon: Settings, module: 'Pengaturan' },
    { path: '/log', label: 'Aktivitas', icon: Shield, module: 'Log Aktivitas' },
  ]},
];