import { Mail, MessageSquare, Clock, AlertCircle, Bot, UserCheck } from 'lucide-react';
import ThreadAvatar from '@/components/konsultasi/ThreadAvatar';

const when = (v) => v ? new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

export default function CustomerProfileCard({ thread, online, typing, mode }) {
  if (!thread) return null;

  const stats = [
    { icon: MessageSquare, label: 'Total pesan', value: thread.total || 0 },
    { icon: AlertCircle, label: 'Belum dibaca', value: thread.unread || 0, alert: (thread.unread || 0) > 0 },
    { icon: Clock, label: 'Pesan terakhir', value: when(thread.at) },
    { icon: Mail, label: 'Mulai konsultasi', value: when(thread.firstAt) },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-4 py-3.5 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, hsl(var(--sidebar-background)), hsl(var(--navy-light)))' }}>
        <ThreadAvatar email={thread.email} size={44} online={online} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Profil Pelanggan</p>
          <p className="text-sm font-semibold text-white truncate">{thread.email}</p>
          <p className="text-[11px] text-white/60 truncate">
            {typing ? 'Sedang menulis…' : online ? 'Online sekarang' : 'Terakhir aktif ' + when(thread.at)}
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${mode === 'manual'
          ? 'bg-amber-400/15 text-amber-200 border border-amber-300/30'
          : 'bg-sky-400/15 text-sky-200 border border-sky-300/30'}`}>
          {mode === 'manual' ? <><UserCheck size={10} /> Admin</> : <><Bot size={10} /> AI Auto</>}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
        {stats.map(s => {
          const SI = s.icon;
          return (
            <div key={s.label} className="px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <SI size={11} /> {s.label}
              </p>
              <p className={`text-xs font-bold mt-1 truncate ${s.alert ? 'text-red-600' : 'text-foreground'}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {thread.last && (
        <div className="px-4 py-2.5 border-t border-border bg-muted/30">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Keluhan terakhir</p>
          <p className="text-xs text-foreground line-clamp-2">{thread.last}</p>
        </div>
      )}
    </div>
  );
}