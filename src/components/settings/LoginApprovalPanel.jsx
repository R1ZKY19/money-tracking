import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Loader2, LogIn, Check, X, Clock, ShieldCheck, ShieldX, UserCheck, Phone, Mail } from 'lucide-react';

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
      // Ambil seluruh user yang berstatus belum disetujui (is_approved: false)
      const { data: pendingUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(pendingUsers || []);
    } catch {
      toast.error('Gagal memuat antrean persetujuan login');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const decide = async (row, action) => {
    setBusyId(row.id);
    try {
      const selectedRole = roleFor[row.id] || 'staf';
      if (action === 'approve') {
        // 1. Update profil menjadi approved
        await supabase
          .from('profiles')
          .update({ is_approved: true, role: selectedRole })
          .eq('id', row.id);

        // 2. Catat ke tabel approved_users
        await supabase
          .from('approved_users')
          .upsert({
            email: row.email,
            is_approved: true,
            role: selectedRole,
            approved_by: 'admin',
            approved_at: new Date().toISOString(),
          }, { onConflict: 'email' });

        toast.success(`Akun ${row.email} berhasil disetujui sebagai ${selectedRole.toUpperCase()}`);
      } else {
        // Tolak pendaftaran
        await supabase
          .from('profiles')
          .update({ is_approved: false, role: 'none' })
          .eq('id', row.id);

        toast.success(`Pendaftaran ${row.email} ditolak`);
      }
      await load();
    } catch {
      toast.error('Gagal memproses persetujuan');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-border" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.07), transparent 70%)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-1.5">Keamanan Akses Pendaftaran</p>
            <h3 className="text-base font-heading font-bold text-foreground tracking-tight">Persetujuan Akun &amp; Login</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Pengguna yang baru mendaftar menunggu persetujuan Anda</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 pulse-dot" />
            <span className="text-lg font-heading font-bold leading-none tabular-nums">{requests.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">menunggu</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <UserCheck size={32} className="mx-auto mb-2 opacity-30 text-emerald-600" />
          <p className="text-sm font-medium">Semua pendaftar telah diproses.</p>
          <p className="text-xs text-muted-foreground mt-1">Tidak ada pendaftaran baru yang menunggu persetujuan.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {requests.map(row => (
            <div key={row.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4 hover:bg-muted/40 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 flex items-center justify-center shrink-0">
                <LogIn size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground truncate">{row.full_name || 'Member Baru'}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">Menunggu</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>✉ {row.email}</span>
                  {row.phone && <span>• 📱 {row.phone}</span>}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock size={10} /> Mendaftar {timeAgo(row.created_at)} ({fmt(row.created_at)})
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  aria-label={`Role untuk ${row.email}`}
                  value={roleFor[row.id] || 'staf'}
                  onChange={e => setRoleFor(s => ({ ...s, [row.id]: e.target.value }))}
                  className="h-9 rounded-xl border border-border bg-background text-xs font-semibold px-2.5 shrink-0"
                >
                  {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button onClick={() => decide(row, 'approve')} disabled={busyId === row.id}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
                  {busyId === row.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />} Setujui
                </button>
                <button onClick={() => decide(row, 'reject')} disabled={busyId === row.id}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-card text-red-500 text-xs font-bold hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors">
                  <X size={13} /> Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}