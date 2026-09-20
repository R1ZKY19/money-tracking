import { Bot, UserCheck } from 'lucide-react';

// Kontrol khusus Admin: mode AI AUTO-REPLY vs ADMIN MANUAL (ambil alih).
export default function ThreadModeControl({ mode, onChange, disabled }) {
  const ai = mode === 'ai_auto';

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5">
        <button
          type="button" disabled={disabled} onClick={() => onChange('ai_auto')}
          className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-colors ${ai
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Bot size={11} /> AI AUTO
        </button>
        <button
          type="button" disabled={disabled} onClick={() => onChange('manual')}
          className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-bold transition-colors ${!ai
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground'}`}
        >
          <UserCheck size={11} /> ADMIN MANUAL
        </button>
      </div>
      {ai && (
        <button
          type="button" disabled={disabled} onClick={() => onChange('manual')}
          className="h-7 px-2.5 rounded-xl text-[10px] font-bold border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        >
          AMBIL ALIH
        </button>
      )}
    </div>
  );
}