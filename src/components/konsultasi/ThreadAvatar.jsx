const PALETTE = [
  'linear-gradient(135deg,#0EA5E9,#0369A1)',
  'linear-gradient(135deg,#14B8A6,#0F766E)',
  'linear-gradient(135deg,#8B5CF6,#5B21B6)',
  'linear-gradient(135deg,#F59E0B,#B45309)',
  'linear-gradient(135deg,#EC4899,#9D174D)',
  'linear-gradient(135deg,#10B981,#047857)',
];

const pick = (key = '') => PALETTE[[...key].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTE.length];

export default function ThreadAvatar({ email = '', name, size = 38, online }) {
  const label = (name || email || '?').trim();
  const initials = label.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-xl flex items-center justify-center font-bold text-white"
        style={{ background: pick(email || label), fontSize: size * 0.36 }}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-card ${online ? 'bg-emerald-500' : 'bg-slate-400'}`}
          style={{ width: size * 0.3, height: size * 0.3 }} />
      )}
    </div>
  );
}