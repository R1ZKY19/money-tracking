import { useUserRole } from '@/lib/UserRoleContext';
import { BadgeCheck, Zap, Phone, ShieldCheck, Tag, MessageCircle, UserCircle2 } from 'lucide-react';
import PricingCard from '@/components/guide/PricingCard';
import PricingComparison from '@/components/guide/PricingComparison';
import { useState } from 'react';
import TransferPaymentModal from '@/components/guide/TransferPaymentModal';
import { usePaymentSetting } from '@/components/guide/usePaymentSetting';
import { PRICING_TIERS, TIER_MAP, TIER_LEVEL, WA_NUMBER } from '@/components/guide/pricingTiers';

const VALUE_PROPS = [
  { icon: BadgeCheck, label: 'Bayar 1×', sub: 'Tanpa langganan bulanan', color: '#059669' },
  { icon: Zap, label: 'Aktivasi Cepat', sub: 'Akses langsung dibuka', color: '#D97706' },
  { icon: ShieldCheck, label: 'Data Aman', sub: 'Terisolasi per akun', color: '#4F46E5' },
  { icon: Phone, label: 'Support WA', sub: 'Dibantu admin langsung', color: '#0891B2' },
];

const ROLE_LABEL = {
  none: 'Member Baru (tanpa role)',
  staf: 'Paket Staf',
  master_2: 'Paket Master II',
  master_1: 'Paket Master I',
  super_master: 'Super Master',
};

// Tab "Paket & Harga" — hero, value props, kartu paket rinci, tabel perbandingan, CTA konsultasi.
export default function PricingSection() {
  const { approvedUser } = useUserRole();
  const userRole = approvedUser?.role || 'none';
  const [payTier, setPayTier] = useState(null);
  const { priceOf } = usePaymentSetting();

  const isOwned = (tier) => tier.isFree
    ? userRole === 'none'
    : (TIER_LEVEL[userRole] || 0) >= TIER_LEVEL[TIER_MAP[tier.tier]];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 text-center bg-sidebar text-sidebar-primary">
        <div className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-[0.16em]">
            <Tag size={10} /> Paket &amp; Harga
          </span>
          <h2 className="text-2xl sm:text-4xl font-heading font-bold mt-4 tracking-tight">Satu Kali Bayar, Pakai Selamanya</h2>
          <p className="text-sm text-white/65 mt-3 max-w-2xl mx-auto leading-relaxed">
            Setiap paket menentukan sedalam apa Anda bisa membaca kondisi keuangan sendiri — dari catatan harian,
            kendali hutang &amp; piutang, sampai analitik kekayaan bersih tahunan.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-[11px] font-semibold">
            <UserCircle2 size={13} /> Level akses Anda sekarang: {ROLE_LABEL[userRole] || userRole}
          </div>
        </div>
      </div>

      {/* Value props */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {VALUE_PROPS.map(({ icon: Icon, label, sub, color }) => (
          <div key={label} className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kartu paket */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {PRICING_TIERS.map(t => ({ ...t, price: t.isFree ? 0 : priceOf(t.tier) })).map(tier => (
          <PricingCard
            key={tier.tier}
            tier={tier}
            isOwned={isOwned(tier)}
            onCheckout={() => setPayTier(tier)}
          />
        ))}
      </div>

      {/* Perbandingan rinci */}
      <PricingComparison />

      {/* CTA konsultasi */}
      <div className="rounded-3xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-sm font-bold text-foreground">Masih bingung pilih paket?</p>
          <p className="text-xs text-muted-foreground mt-1">Konsultasi gratis — admin bantu pilih paket paling sesuai kebutuhan Anda.</p>
        </div>
        <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Admin! Saya ingin konsultasi paket MONEY TRACKING yang sesuai.')}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-xs font-bold text-white shrink-0 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#128C7E,#25D366)' }}>
          <MessageCircle size={14} /> Konsultasi Gratis via WhatsApp
        </a>
      </div>

      <TransferPaymentModal tier={payTier} open={!!payTier} onClose={() => setPayTier(null)} />
    </div>
  );
}