import { Clock } from 'lucide-react';
export default function UsageSessionDetails({ sessions, totalSeconds, sessionCount, profile }) {
  const duration = value => `${Math.floor((value || 0) / 3600)} jam ${Math.floor(((value || 0) % 3600) / 60)} menit`;
  const date = value => value ? new Date(value).toLocaleString('id-ID') : '—';
  return <section className="space-y-3">
    {profile?.full_name && <p className="text-sm font-semibold">{profile.full_name}<span className="block text-xs font-normal text-muted-foreground">Bergabung: {date(profile.created_date)}</span></p>}
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border bg-muted p-3"><p className="text-xs text-muted-foreground">Total penggunaan tercatat</p><p className="font-semibold text-primary mt-1">{duration(totalSeconds)}</p></div>
      <div className="rounded-xl border bg-muted p-3"><p className="text-xs text-muted-foreground">Sesi halaman tercatat</p><p className="font-semibold text-primary mt-1">{sessionCount}</p></div>
    </div>
    <p className="text-xs text-muted-foreground">Estimasi waktu halaman terlihat, bukan jam kerja. Tab tersembunyi tidak dihitung; sesi beberapa tab/perangkat dijumlahkan. Pencatatan dimulai sejak fitur diaktifkan.</p>
    <h4 className="text-xs font-semibold flex items-center gap-2"><Clock size={14} />Riwayat sesi (maks. 100 terbaru)</h4>
    <div className="max-h-56 overflow-y-auto space-y-2">
      {sessions.map(s => <div key={s.id} className="rounded-lg border p-3 text-xs space-y-1">
        <p className="font-medium">{date(s.started_at)} · {duration(s.duration_seconds)}</p>
        <p className="text-muted-foreground">Terakhir terlihat: {date(s.last_seen)}</p>
        <p className="text-muted-foreground">Halaman terakhir: {s.page_path || '—'}</p>
        <p className="text-muted-foreground break-words">Perangkat: {s.user_agent || 'Tidak tersedia'}</p>
      </div>)}
      {!sessions.length && <p className="text-xs text-muted-foreground">Belum ada sesi tercatat.</p>}
    </div>
  </section>;
}