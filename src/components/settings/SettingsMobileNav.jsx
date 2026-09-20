import { ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';

// Navigasi pengaturan versi mobile: satu tombol pemilih + panel grid, tanpa scroll horizontal.
export default function SettingsMobileNav({ tabs, activeId, onSelect }) {
  const [open, setOpen] = useState(false);
  const active = tabs.find(t => t.id === activeId) || tabs[0];
  if (!active) return null;
  const ActiveIcon = active.icon;

  return (
    <div className="md:hidden w-full mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-border bg-card text-left"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${active.color}, ${active.color}cc)` }}>
          <ActiveIcon size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{active.label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{active.desc}</p>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                onClick={() => { onSelect(tab.id); setOpen(false); }}
                className={`flex items-center gap-2 px-2.5 py-2.5 rounded-xl border text-left transition-colors ${
                  isActive ? 'border-transparent text-white' : 'border-border bg-card text-foreground'
                }`}
                style={isActive ? { background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)` } : {}}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : 'bg-muted'}`}>
                  <Icon size={13} className={isActive ? 'text-white' : ''} style={!isActive ? { color: tab.color } : {}} />
                </div>
                <span className="text-[11px] font-bold leading-tight flex-1 min-w-0">{tab.label}</span>
                {isActive && <Check size={12} className="text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}