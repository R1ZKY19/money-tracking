import { roleVisual } from '@/lib/roleVisuals';

// Pill nama role dengan gradasi metalik + efek kilau bergerak.
export default function RoleBadge({ role, size = 'md', className = '' }) {
  const cfg = roleVisual(role);
  const Icon = cfg.icon;
  const small = size === 'sm';

  return (
    <span
      className={`relative inline-flex items-center gap-1.5 overflow-hidden rounded-full font-black text-white ${
        small ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'
      } ${className}`}
      style={{
        background: cfg.gradient,
        border: `1px solid ${cfg.ring}`,
        boxShadow: cfg.glow,
        letterSpacing: '0.10em',
      }}
    >
      <span className="pointer-events-none absolute inset-y-0 w-1/3"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)', animation: 'shimmerMove 2.8s ease-in-out infinite' }} />
      <Icon size={small ? 9 : 11} className="relative shrink-0" />
      <span className="relative">{cfg.label}</span>
    </span>
  );
}