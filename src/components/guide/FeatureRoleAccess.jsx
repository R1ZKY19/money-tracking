import { ALL_ROLES, ROLE_LABELS } from '@/lib/featureRegistry';
import { Check, X, Lock } from 'lucide-react';

// Baris hak akses role untuk satu fitur — otomatis mengikuti registry fitur.
export default function FeatureRoleAccess({ roles = [], route, myRole }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/40 border border-border">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
        <Lock size={10} /> Akses Role
      </span>
      {ALL_ROLES.map(r => {
        const allowed = roles.includes(r);
        return (
          <span key={r}
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${allowed
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-muted text-muted-foreground/60 border-border'} ${r === myRole ? 'ring-1 ring-primary/40' : ''}`}>
            {allowed ? <Check size={9} /> : <X size={9} />}
            {ROLE_LABELS[r]}
          </span>
        );
      })}
      {route && <span className="text-[10px] text-muted-foreground ml-auto font-mono">{route}</span>}
    </div>
  );
}