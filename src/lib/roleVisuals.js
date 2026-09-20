import { Crown, Gem, Medal, ShieldCheck, Sparkles } from 'lucide-react';

// Sumber tunggal identitas visual (ikon mewah, gradasi, glow) untuk setiap role.
export const ROLE_VISUALS = {
  super_master: {
    label: 'SUPER MASTER', tier: 'ULTIMATE', stars: 5, icon: Crown,
    accent: '#F59E0B',
    gradient: 'linear-gradient(135deg,#78350F 0%,#F59E0B 45%,#FDE68A 100%)',
    ring: 'rgba(245,158,11,0.55)',
    dot: '#F59E0B',
    glow: '0 0 16px rgba(245,158,11,0.45)',
    desc: 'Akses penuh tanpa batas ke seluruh sistem.',
  },
  master_1: {
    label: 'MASTER I', tier: 'PREMIUM', stars: 4, icon: Gem,
    accent: '#818CF8',
    gradient: 'linear-gradient(135deg,#312E81 0%,#6366F1 45%,#C7D2FE 100%)',
    ring: 'rgba(99,102,241,0.55)',
    dot: '#818CF8',
    glow: '0 0 16px rgba(99,102,241,0.45)',
    desc: 'Analitik tahunan, net worth, dan otomasi lengkap.',
  },
  master_2: {
    label: 'MASTER II', tier: 'STANDAR', stars: 3, icon: Medal,
    accent: '#22D3EE',
    gradient: 'linear-gradient(135deg,#164E63 0%,#0891B2 45%,#A5F3FC 100%)',
    ring: 'rgba(8,145,178,0.55)',
    dot: '#22D3EE',
    glow: '0 0 16px rgba(8,145,178,0.45)',
    desc: 'Kendali hutang, piutang, tabungan, dan backup data.',
  },
  staf: {
    label: 'STAF', tier: 'DASAR', stars: 2, icon: ShieldCheck,
    accent: '#34D399',
    gradient: 'linear-gradient(135deg,#064E3B 0%,#10B981 45%,#A7F3D0 100%)',
    ring: 'rgba(16,185,129,0.55)',
    dot: '#34D399',
    glow: '0 0 16px rgba(16,185,129,0.45)',
    desc: 'Pencatatan harian, budget, dan saldo rekening.',
  },
  none: {
    label: 'MEMBER BARU', tier: 'TANPA ROLE', stars: 1, icon: Sparkles,
    accent: '#94A3B8',
    gradient: 'linear-gradient(135deg,#1E293B 0%,#475569 45%,#CBD5E1 100%)',
    ring: 'rgba(148,163,184,0.5)',
    dot: '#94A3B8',
    glow: '0 0 16px rgba(148,163,184,0.35)',
    desc: 'Belum berpaket — akses terbatas pada halaman informasi.',
  },
};

export const roleVisual = (role) => ROLE_VISUALS[role] || ROLE_VISUALS.none;