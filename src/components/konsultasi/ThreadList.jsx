import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Users } from 'lucide-react';
import ThreadAvatar from '@/components/konsultasi/ThreadAvatar';

const when = (v) => v ? new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export default function ThreadList({ threads, loading, activeEmail, onSelect }) {
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return threads;
    return threads.filter(t =>
      (t.email || '').toLowerCase().includes(key) || (t.last || '').toLowerCase().includes(key)
    );
  }, [threads, q]);

  const totalUnread = threads.reduce((s, t) => s + (t.unread || 0), 0);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-[calc(100dvh-13.5rem)] lg:h-[calc(100vh-13rem)] min-h-[340px] lg:min-h-[420px] shadow-sm">
      <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">Percakapan</p>
          </div>
          <div className="flex items-center gap-1.5">
            {totalUnread > 0 && (
              <span className="text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5">{totalUnread}</span>
            )}
            <span className="text-[10px] font-bold text-primary">{threads.length}</span>
          </div>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Cari email atau isi pesan…"
            className="h-9 pl-8 rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            {q ? 'Tidak ada percakapan yang cocok.' : 'Belum ada pengguna yang mengirim pesan.'}
          </p>
        ) : list.map(t => (
          <button key={t.email} onClick={() => onSelect(t.email)}
            className={`w-full text-left px-4 py-3 transition-colors ${activeEmail === t.email ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50'}`}>
            <div className="flex items-start gap-2.5">
              <ThreadAvatar email={t.email} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{t.email}</p>
                  {t.unread > 0 && (
                    <span className="text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5 shrink-0">{t.unread}</span>
                  )}
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${t.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{t.last}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-muted-foreground/70">{when(t.at)}</p>
                  {t.total > 0 && (
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-1.5">{t.total} pesan</span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}