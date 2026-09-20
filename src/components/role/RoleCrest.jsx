import { roleVisual } from '@/lib/roleVisuals';

const SIZES = { sm: 28, md: 40, lg: 56, xl: 76 };

// Medali role — lingkaran gradasi mewah dengan cincin cahaya & kilau diagonal.
export default function RoleCrest({ role, size = 'md', className = '', children }) {
  const cfg = roleVisual(role);
  const Icon = cfg.icon;
  const px = SIZES[size] || SIZES.md;

  return (
    <div
      className={`relative shrink-0 rounded-full flex items-center justify-center overflow-hidden ${className}`}
      style={{
        width: px, height: px,
        background: cfg.gradient,
        boxShadow: `${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.45)`,
        border: `1px solid ${cfg.ring}`,
      }}
    >
      <div className="absolute inset-0 opacity-60"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.45) 0%, transparent 45%, rgba(0,0,0,.18) 100%)' }} />
      <div className="absolute inset-[3px] rounded-full" style={{ border: '1px solid rgba(255,255,255,0.30)' }} />
      <div className="relative flex items-center justify-center w-full h-full">
        {children || <Icon size={Math.round(px * 0.44)} className="text-white drop-shadow" />}
      </div>
    </div>
  );
}