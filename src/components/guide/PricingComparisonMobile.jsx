import { Check, Minus } from 'lucide-react';

// Versi mobile tabel perbandingan: satu kartu per fitur, tanpa perlu digeser ke samping.
export default function PricingComparisonMobile({ rows, heads }) {
  return (
    <div className="md:hidden divide-y divide-border">
      {rows.map(({ group, items }) => (
        <div key={group}>
          <p className="px-4 py-2 bg-muted/60 text-[10px] font-bold uppercase tracking-widest text-foreground/70">
            {group}
          </p>
          {items.map(([name, ...flags]) => (
            <div key={name} className="px-4 py-3 border-t border-border">
              <p className="text-xs font-semibold text-foreground mb-2">{name}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {flags.map((f, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border px-1.5 py-1.5 text-center ${
                      f ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : 'border-border bg-muted/40'
                    }`}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground leading-tight">
                      {heads[i]}
                    </p>
                    <div className="mt-1 flex justify-center">
                      {f
                        ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                        : <Minus size={13} className="text-muted-foreground/40" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}