import { BadgeCheck, AlertTriangle, HandCoins, CreditCard } from 'lucide-react';

const STYLES = {
  paid: { icon: BadgeCheck, bg: 'linear-gradient(135deg,#059669,#34D399)', ring: 'ring-emerald-300/60' },
  overdue: { icon: AlertTriangle, bg: 'linear-gradient(135deg,#B91C1C,#F87171)', ring: 'ring-red-300/60' },
  receivable: { icon: HandCoins, bg: 'linear-gradient(135deg,#0F766E,#2DD4BF)', ring: 'ring-teal-300/60' },
  debt: { icon: CreditCard, bg: 'linear-gradient(135deg,#B45309,#FBBF24)', ring: 'ring-amber-300/60' },
};

// state: 'paid' | 'overdue' | 'active' — kind menentukan ikon saat aktif.
export default function LoanStatusIcon({ state = 'active', kind = 'receivable', size = 38 }) {
  const s = STYLES[state === 'paid' ? 'paid' : state === 'overdue' ? 'overdue' : kind];
  const Icon = s.icon;
  return (
    <div className={`rounded-xl flex items-center justify-center text-white shadow-md ring-2 ${s.ring}`}
      style={{ width: size, height: size, background: s.bg }}>
      <Icon size={size * 0.5} strokeWidth={2.2} />
    </div>
  );
}