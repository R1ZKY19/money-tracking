import { Target, Sparkles } from 'lucide-react';

// Blok "cocok untuk siapa" + "hasil yang Anda dapat" pada tiap kartu paket.
export default function PricingOutcome({ tier }) {
  return (
    <div className="px-5 py-4 space-y-3 border-b border-border bg-muted/30">
      <div className="flex gap-2.5">
        <Target size={13} className="mt-0.5 shrink-0" style={{ color: tier.accent }} />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cocok untuk</p>
          <p className="text-[11.5px] leading-snug text-foreground mt-0.5">{tier.bestFor}</p>
        </div>
      </div>
      <div className="flex gap-2.5">
        <Sparkles size={13} className="mt-0.5 shrink-0" style={{ color: tier.accent }} />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Yang Anda dapatkan</p>
          <p className="text-[11.5px] leading-snug text-muted-foreground mt-0.5">{tier.outcome}</p>
        </div>
      </div>
    </div>
  );
}