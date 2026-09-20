import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UsageSession } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Clock, Loader2, Users } from 'lucide-react';

const dayKey = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const durationText = (sec) => {
  const s = sec || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
};

// Rekap durasi online tiap member per hari (Super Master).
export default function DailyUsagePanel() {
  const [date, setDate] = useState(() => dayKey(new Date()));

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['usage-sessions-daily'],
    queryFn: () => $entity.list('-started_at', 1000),
    staleTime: 30000,
  });

  const rows = useMemo(() => {
    const map = new Map();
    sessions.filter(s => dayKey(s.started_at) === date).forEach(s => {
      const email = s.user_email || '—';
      const cur = map.get(email) || { email, seconds: 0, count: 0, last: null };
      cur.seconds += s.duration_seconds || 0;
      cur.count += 1;
      if (!cur.last || new Date(s.last_seen) > new Date(cur.last)) cur.last = s.last_seen;
      map.set(email, cur);
    });
    return [...map.values()].sort((a, b) => b.seconds - a.seconds);
  }, [sessions, date]);

  const totalSeconds = rows.reduce((sum, r) => sum + r.seconds, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-sky-200 bg-sky-50 dark:bg-sky-950/20">
        <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
          <Clock size={18} className="text-sky-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-sky-900 dark:text-sky-200">Sesi Penggunaan Harian</h3>
          <p className="text-xs text-sky-700 dark:text-sky-400">Cek berapa jam tiap member online pada tanggal terpilih</p>
        </div>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 w-full sm:w-44 bg-card" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Member online hari ini</p>
          <p className="text-lg font-bold text-primary mt-1 flex items-center gap-2"><Users size={16} /> {rows.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total durasi semua member</p>
          <p className="text-lg font-bold text-primary mt-1">{durationText(totalSeconds)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-14"><Loader2 className="animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border-2 border-dashed border-border text-center">
          <Clock size={30} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Tidak ada aktivitas tercatat pada tanggal ini</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {rows.map((r, i) => (
            <div key={r.email} className="flex items-center gap-3 p-3.5">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{r.email}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.count} sesi · terakhir aktif {r.last ? new Date(r.last).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800">
                {durationText(r.seconds)}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Estimasi waktu halaman aktif (tab tersembunyi tidak dihitung). Sesi dari beberapa tab/perangkat dijumlahkan.
      </p>
    </div>
  );
}