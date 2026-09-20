import { CheckCircle2, Crown, Phone, Minus, CreditCard, Loader2, Info } from 'lucide-react';
import { WA_NUMBER, formatRp } from '@/components/guide/pricingTiers';
import PricingOutcome from '@/components/guide/PricingOutcome';

// Kartu paket tunggal — hero gelap premium, penjelasan rinci per fitur, CTA bayar + WhatsApp.
export default function PricingCard({ tier, isOwned, onCheckout, isCheckingOut }) {
  const saving = (tier.originalPrice || 0) - (tier.price || 0);

  return (
    <div className={`relative flex flex-col rounded-3xl bg-card overflow-hidden transition-all duration-300 ${
      isOwned
        ? 'border border-border opacity-75'
        : tier.popular
          ? 'border-2 border-indigo-400 shadow-xl lg:-mt-3 lg:mb-3'
          : 'border border-border shadow-sm hover:-translate-y-1 hover:shadow-lg'
    }`}>
      {tier.popular && !isOwned && (
        <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-[9px] font-bold uppercase tracking-widest text-amber-950 shadow">
          <Crown size={9} /> Paling Populer
        </div>
      )}

      {/* Hero */}
      <div className="relative p-6 text-white overflow-hidden"
        style={{ background: isOwned ? 'linear-gradient(135deg,#4B5563,#9CA3AF)' : tier.gradient }}>
        <div className="absolute -top-10 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-12 -left-10 w-36 h-36 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">{tier.badge}</p>
          <h3 className="text-lg font-heading font-bold mt-1.5">{tier.label}</h3>
          <p className="text-white/70 text-xs mt-1">{tier.tagline}</p>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-3xl font-bold tracking-tight">
              {tier.isFree ? 'Gratis' : formatRp(tier.price)}
            </span>
            <span className="text-white/60 text-[11px] mb-1.5">/{tier.period}</span>
          </div>
          {!tier.isFree && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-white/50 line-through">{formatRp(tier.originalPrice)}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/25 font-bold">
                hemat {formatRp(saving)} · {tier.discount}
              </span>
            </div>
          )}
          {tier.isFree && (
            <p className="mt-1.5 text-[11px] text-white/60">Status bawaan akun baru — belum bisa mencatat data.</p>
          )}
        </div>
      </div>

      {/* Deskripsi */}
      <p className="px-6 py-4 text-xs leading-relaxed text-muted-foreground border-b border-border">{tier.desc}</p>

      {/* Cocok untuk & hasil */}
      <PricingOutcome tier={tier} />

      {/* Fitur rinci */}
      <ul className="p-4 space-y-1.5 flex-1">
        {tier.features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2.5 px-2.5 py-2 rounded-xl ${f.included && f.highlight ? 'bg-primary/5' : ''}`}>
            {f.included
              ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: tier.accent }} />
              : <Minus size={14} className="shrink-0 mt-0.5 text-muted-foreground/40" />}
            <div className="min-w-0">
              <p className={`text-[11.5px] leading-snug ${f.included
                ? `text-foreground ${f.highlight ? 'font-semibold' : 'font-medium'}`
                : 'text-muted-foreground/50 line-through'}`}>{f.name}</p>
              {f.detail && (
                <p className={`text-[10.5px] leading-snug mt-0.5 ${f.included ? 'text-muted-foreground' : 'text-muted-foreground/45'}`}>
                  {f.detail}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="p-5 pt-0">
        {isOwned ? (
          <div className="w-full h-11 rounded-xl bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 size={14} /> {tier.isFree ? 'Status Akun Saat Ini' : 'Paket Anda Aktif'}
          </div>
        ) : tier.isFree ? (
          <div className="w-full rounded-xl border border-dashed border-border px-3 py-3 flex items-start gap-2 text-[10.5px] leading-snug text-muted-foreground">
            <Info size={13} className="shrink-0 mt-px" />
            Level ini tidak perlu dibeli — akun baru otomatis berada di sini sampai memilih paket.
          </div>
        ) : (
          <>
            <button type="button" disabled={isCheckingOut} onClick={() => onCheckout?.(tier.tier)}
              className="w-full h-11 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: tier.gradient }}>
              {isCheckingOut ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
              {isCheckingOut ? 'Menyiapkan…' : 'Bayar via Transfer'}
            </button>
            <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(tier.waMsg)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-2 w-full h-10 rounded-xl text-[11px] font-bold border border-border text-foreground flex items-center justify-center gap-2 transition-colors hover:bg-muted">
              <Phone size={12} /> Tanya Admin Dulu
            </a>
            <p className="text-center text-[10px] text-muted-foreground mt-2">Bayar sekali · aktif selamanya</p>
          </>
        )}
      </div>
    </div>
  );
}