import { Star } from 'lucide-react';
import RoleCrest from '@/components/role/RoleCrest';
import RoleBadge from '@/components/role/RoleBadge';
import { roleVisual } from '@/lib/roleVisuals';

// Kartu role mewah di panel profil — medali, badge, peringkat bintang, dan deskripsi akses.
export default function ProfileRoleCard({ role, moduleCount = 0 }) {
  const cfg = roleVisual(role);

  return (
    <div className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.03) 100%)',
        border: `1px solid ${cfg.ring}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.14), ${cfg.glow}`,
      }}>
      <div className="pointer-events-none absolute -top-10 -right-8 w-32 h-32 rounded-full blur-2xl"
        style={{ background: cfg.accent, opacity: 0.18 }} />

      <div className="relative flex items-center gap-3">
        <RoleCrest role={role} size="lg" />
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: cfg.accent }}>
            Tingkat {cfg.tier}
          </p>
          <div className="mt-1"><RoleBadge role={role} /></div>
          <div className="mt-1.5 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11}
                style={{ color: i < cfg.stars ? cfg.accent : 'rgba(255,255,255,0.22)' }}
                fill={i < cfg.stars ? cfg.accent : 'none'} />
            ))}
          </div>
        </div>
      </div>

      <p className="relative mt-3 text-[11px] leading-relaxed opacity-75">{cfg.desc}</p>

      <div className="relative mt-3 flex items-center justify-between rounded-xl px-3 py-2"
        style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Modul aktif</span>
        <span className="text-xs font-bold" style={{ color: cfg.accent }}>{moduleCount} modul</span>
      </div>
    </div>
  );
}