import { useEffect, useState, useCallback } from 'react';
import { LoginRequest } from '@/api/entities';
import { toast } from 'sonner';
import { Loader2, LogIn, Check, X, Clock, ShieldCheck, ShieldX } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'staf', label: 'STAF' },
  { value: 'master_2', label: 'MASTER II' },
  { value: 'master_1', label: 'MASTER I' },
  { value: 'super_master', label: 'SUPER MASTER' },
];

const timeAgo = (iso) => {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

const fmt = (iso) => iso ? new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function LoginApprovalPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [roleFor, setRoleFor] = useState({});

  const load = useCallback(async () => {
    try {
      const { data: pendingUsers } = await supabase.from('profiles').select('*').eq('is_approved', false).order('created_at', { ascending: false }); const res = { data: { users: pendingUsers || [] } };
      setRequests(res.data?.requests || []);
    } catch {
      toast.error('Gagal memuat permintaan login');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    let unsub;
    try { unsub = LoginRequest.subscribe(() => load()); } catch { /* noop */ }
    const timer = setInterval(load, 30000);
    return () => { clearInterval(timer); try { unsub?.(); } catch { /* noop */ } };
  }, [load]);

  const decide = async (row, action) => {
    setBusyId(row.id);
    try {
      if (action === 'approve') { await supabase.from('profiles').update({ is_approved: true, role: roleFor[row.id] || 'user' }).eq('id', row.id); await supabase.from('approved_users').upsert({ email: row.email, approved_by: 'admin' }); }
      toast.success(action === 'approve' ? `${row.email} disetujui` : `${row.email} ditolak`);
      await load();
    } catch {
      toast.error('Gagal memproses permintaan');
    } finally {
      setBusyId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const history = requests.filter(r => r.status !== 'pending').slice(0, 10);

  return (
    <section className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-border" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.07), transparent 70%)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-1.5">Keamanan Akses</p>
            <h3 className="text-base font-heading font-bold text-foreground tracking-tight">Persetujuan Login</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Email yang mencoba login menunggu keputusan Anda</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 pulse-dot" />
            <span className="text-lg font-heading font-bold leading-none tabular-nums">{pending.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">menunggu</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : pending.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <LogIn size={28} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">Tidak ada permintaan login yang menunggu.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {pending.map(row => (
            <div key={row.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/40 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 flex items-center justify-center shrink-0">
                <LogIn size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-foreground truncate">{row.email}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock size={9} /> {fmt(row.attempted_at)} · {timeAgo(row.attempted_at)}
                  {row.attempts > 1 && <span className="ml-1">· {row.attempts}x percobaan</span>}
                </p>
              </div>
              <select
                aria-label={`Role untuk ${row.email}`}
                value={roleFor[row.id] || 'staf'}
                onChange={e => setRoleFor(s => ({ ...s, [row.id]: e.target.value }))}
                className="h-8 rounded-xl border border-border bg-background text-[11px] font-semibold px-2 shrink-0"
              >
                {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => decide(row, 'approve')} disabled={busyId === row.id}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {busyId === row.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Setujui
                </button>
                <button onClick={() => decide(row, 'reject')} disabled={busyId === row.id}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-card text-red-500 text-[11px] font-bold hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors">
                  <X size={12} /> Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <>
          <div className="px-5 py-2.5 bg-muted/40 border-y border-border">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Riwayat Keputusan</p>
          </div>
          <div className="divide-y divide-border">
            {history.map(row => (
              <div key={row.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                {row.status === 'approved'
                  ? <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                  : <ShieldX size={15} className="text-red-500 shrink-0" />}
                <p className="text-xs font-semibold text-foreground truncate flex-1">{row.email}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${row.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                  {row.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{fmt(row.decided_at)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}