import { useState, useEffect, useRef } from 'react';
import { useUserRole } from '@/lib/UserRoleContext';
import {
  Crown, Star, Gem, Users, LogOut, Mail, Calendar, Lock, Eye, EyeOff,
  Copy, Check, Shield, Phone, CheckCircle, XCircle, Monitor, Globe,
  Activity, Clock, BadgeCheck, Trophy, ChevronDown, ChevronRight,
  Layers, Key, AlertTriangle, BarChart3, PuzzleIcon, Camera, Loader2,
  LayoutDashboard, ArrowRightLeft, PiggyBank, CreditCard, Wallet,
  FileText, Settings, Bell, Smartphone
} from 'lucide-react';
import { ActivityLog } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { changePasswordSecure } from '@/lib/changePassword';

const ROLE_CFG = {
  super_master: {
    label: 'SUPER MASTER', tier: 'ULTIMATE', sublabel: 'Akses penuh ke seluruh sistem. Tidak ada batasan fitur.',
    icon: Crown, tierIcon: Trophy,
    accent: '#F59E0B', accentDim: 'rgba(245,158,11,0.12)', accentBorder: 'rgba(245,158,11,0.25)',
    gradient: 'linear-gradient(135deg, #92400E, #D97706, #F59E0B)',
    badgeBg: 'linear-gradient(90deg, #B45309, #F59E0B, #B45309)',
    glow: 'rgba(245,158,11,0.4)', stars: 5,
  },
  master_1: {
    label: 'MASTER I', tier: 'PREMIUM', sublabel: 'Akses premium ke semua fitur keuangan utama.',
    icon: Gem, tierIcon: BadgeCheck,
    accent: '#8B5CF6', accentDim: 'rgba(139,92,246,0.12)', accentBorder: 'rgba(139,92,246,0.25)',
    gradient: 'linear-gradient(135deg, #4C1D95, #6D28D9, #8B5CF6)',
    badgeBg: 'linear-gradient(90deg, #6D28D9, #8B5CF6, #6D28D9)',
    glow: 'rgba(139,92,246,0.4)', stars: 4,
  },
  master_2: {
    label: 'MASTER II', tier: 'STANDAR', sublabel: 'Akses fitur keuangan standar.',
    icon: Star, tierIcon: Star,
    accent: 'hsl(var(--info))', accentDim: 'rgba(34,211,238,0.10)', accentBorder: 'rgba(34,211,238,0.2)',
    gradient: 'linear-gradient(135deg, #164E63, #0891B2, hsl(var(--info)))',
    badgeBg: 'linear-gradient(90deg, #0891B2, hsl(var(--info)), #0891B2)',
    glow: 'rgba(34,211,238,0.4)', stars: 3,
  },
  staf: {
    label: 'STAF', tier: 'DASAR', sublabel: 'Akses terbatas sesuai role staf.',
    icon: Users, tierIcon: Shield,
    accent: 'hsl(var(--success))', accentDim: 'rgba(52,211,153,0.10)', accentBorder: 'rgba(52,211,153,0.2)',
    gradient: 'linear-gradient(135deg, #064E3B, #059669, hsl(var(--success)))',
    badgeBg: 'linear-gradient(90deg, #059669, hsl(var(--success)), #059669)',
    glow: 'rgba(52,211,153,0.4)', stars: 2,
  },
};

const APP_MODULES = [
  { name: 'Dashboard Bulanan', desc: 'Ringkasan keuangan bulanan', icon: LayoutDashboard, color: 'hsl(var(--success))', roles: ['super_master','master_1','master_2','staf'] },
  { name: 'Transaksi', desc: 'Catat pemasukan & pengeluaran', icon: ArrowRightLeft, color: 'hsl(var(--primary))', roles: ['super_master','master_1','master_2','staf'] },
  { name: 'Tabungan', desc: 'Target & progress tabungan', icon: PiggyBank, color: 'hsl(var(--warning))', roles: ['super_master','master_1','master_2'] },
  { name: 'Hutang & Piutang', desc: 'Kelola pinjaman & tagihan', icon: CreditCard, color: 'hsl(var(--chart-3))', roles: ['super_master','master_1','master_2'] },
  { name: 'Saldo Rekening', desc: 'Monitor semua akun bank', icon: Wallet, color: 'hsl(var(--info))', roles: ['super_master','master_1','master_2','staf'] },
  { name: 'Budget Plan', desc: 'Perencanaan anggaran bulanan', icon: BarChart3, color: '#F59E0B', roles: ['super_master','master_1'] },
  { name: 'Transfer', desc: 'Transfer antar rekening', icon: ArrowRightLeft, color: 'hsl(var(--success))', roles: ['super_master','master_1','master_2'] },
  { name: 'Export Data', desc: 'Export laporan ke Excel/PDF', icon: FileText, color: '#60A5FA', roles: ['super_master','master_1'] },
  { name: 'Pengaturan Sistem', desc: 'Konfigurasi & manajemen akun', icon: Settings, color: '#EF4444', roles: ['super_master'] },
];

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

function getBrowser(ua = '') {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua)) return 'Safari';
  return 'Browser';
}
function getOS(ua = '') {
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Device';
}
function getDeviceIcon(ua = '') {
  if (/Android|iPhone|iPad/i.test(ua)) return <Smartphone size={16} />;
  return <Monitor size={16} />;
}

function StarRow({ count, accent }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} fill={i < count ? accent : 'none'}
          style={{ color: i < count ? accent : 'rgba(255,255,255,0.2)' }} />
      ))}
    </div>
  );
}

function SectionCard({ icon: Icon, iconColor, iconBg, title, subtitle, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden mb-4 transition-all"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconBg, color: iconColor }}>
            <Icon size={15} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">{title}</p>
            <p className="text-[11px] text-foreground/30 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <ChevronDown size={14} className="text-foreground/30 transition-transform shrink-0"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
      </button>
      {open && (
        <>
          <div style={{ height: 1, background: 'hsl(var(--border))', margin: '0 20px' }} />
          <div className="px-5 py-4">{children}</div>
        </>
      )}
    </div>
  );
}

function checkPasswordStrength(pw) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
}

export default function PremiumProfile() {
  const { user, approvedUser, refresh } = useUserRole();
  const role = approvedUser?.role || 'staf';
  const cfg = { ...(ROLE_CFG[role] || ROLE_CFG.staf), accent: 'hsl(var(--primary))', accentDim: 'hsl(var(--primary) / .08)', accentBorder: 'hsl(var(--border))', gradient: 'hsl(var(--muted))', badgeBg: 'hsl(var(--muted))', glow: 'transparent' };
  const RoleIcon = cfg.icon;
  const TierIcon = cfg.tierIcon;

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const strength = checkPasswordStrength(pwForm.new);
  const allStrong = Object.values(strength).every(Boolean);

  useEffect(() => {
    if (user) setAvatarUrl(user.avatar_url || null);
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    setLogsLoading(true);
    $entity.list('-created_date', 200)
      .then(all => setLogs(all.filter(l => l.created_by_id === user.id)))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [user?.id]);

  const loginLogs = logs.filter(l => l.action === 'login');
  const thisMonthLogins = loginLogs.filter(l => {
    const d = new Date(l.created_date), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastLog = logs[0];

  const memberDate = user?.created_date
    ? new Date(user.created_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Ukuran foto max 5MB');
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      const file_url = urlData.publicUrl;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id) {
        await supabase.from('profiles').update({ avatar_url: file_url }).eq('id', currentUser.id);
      }
      setAvatarUrl(file_url);
      refresh?.();
      toast.success('Foto profil diperbarui!');
    } catch { toast.error('Gagal upload foto'); }
    finally { setUploadingAvatar(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.email || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Email disalin!');
  };

  const handleSavePassword = async () => {
    if (!pwForm.current) { toast.error('Masukkan kata sandi saat ini'); return; }
    if (!allStrong) { toast.error('Password belum memenuhi semua syarat'); return; }
    if (pwForm.new !== pwForm.confirm) { toast.error('Konfirmasi password tidak cocok'); return; }
    setPwLoading(true);
    const result = await changePasswordSecure({
      currentPassword: pwForm.current,
      newPassword: pwForm.new,
      confirmPassword: pwForm.confirm,
    });
    setPwLoading(false);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success('Password berhasil diubah!');
    setPwForm({ current: '', new: '', confirm: '' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };
  const handleWhatsApp = () => window.open('https://wa.me/6281234567890?text=Halo%20Admin%2C%20butuh%20bantuan.', '_blank');

  const userModules = APP_MODULES.map(m => ({
    ...m,
    active: role === 'super_master' || m.roles.includes(role),
  }));

  return (
    <div className="enterprise-profile min-h-screen pb-20 text-foreground" style={{ background: 'hsl(var(--background))' }}>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-foreground/30 mb-5">
          <span className="text-foreground/50 hover:text-foreground/70 cursor-pointer">Dashboard</span>
          <ChevronRight size={10} />
          <span className="text-foreground font-semibold">Personal Center</span>
        </div>

        {/* ── PROFILE HEADER CARD ── */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          {/* Banner */}
          <div className="h-28 relative overflow-hidden" style={{
            background: 'hsl(var(--sidebar-background))'
          }}>
            <div className="absolute inset-0" style={{
              background: `radial-gradient(circle at 20% 50%, ${cfg.accentDim} 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(245,166,35,0.08) 0%, transparent 60%)`
            }} />
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          {/* Info section */}
          <div className="px-5 pb-5">
            {/* Avatar */}
            <div className="relative w-20 h-20 -mt-10 mb-3 cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}>
              <div className="absolute -inset-1 rounded-full blur-md opacity-50"
                style={{ background: cfg.gradient }} />
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-3 flex items-center justify-center"
                style={{ border: `3px solid hsl(var(--card))`, background: 'hsl(var(--card))', boxShadow: `0 0 20px ${cfg.glow}` }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  : <RoleIcon size={30} style={{ color: cfg.accent }} />
                }
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingAvatar ? <Loader2 size={16} className="text-sidebar-primary animate-spin" /> : <Camera size={16} className="text-sidebar-primary" />}
                </div>
              </div>
              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2"
                style={{ borderColor: 'hsl(var(--card))', boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

            {/* Name row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-foreground tracking-tight">
                {(user?.full_name || user?.email?.split('@')[0] || 'User').toUpperCase()}
              </h1>
              <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <Check size={10} className="text-sidebar-primary" />
              </span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-foreground"
                style={{ background: cfg.badgeBg }}>
                <RoleIcon size={9} /> {cfg.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(245,166,35,0.12)', color: 'hsl(var(--warning))', border: '1px solid rgba(245,166,35,0.2)' }}>
                <TierIcon size={9} /> {cfg.tier}
              </span>
              <StarRow count={cfg.stars} accent={cfg.accent} />
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(0,212,126,0.08)', color: 'hsl(var(--success))', border: '1px solid rgba(0,212,126,0.15)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Aktif
              </span>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 mt-2.5">
              <Mail size={12} className="text-foreground/30" />
              <span className="text-sm text-foreground/50">{user?.email}</span>
              <button onClick={handleCopy} className="hover:text-foreground/60 transition-colors text-foreground/25">
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-5 mt-4 pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              {[
                { label: 'BERGABUNG', value: memberDate },
                { label: 'TERAKHIR LOGIN', value: lastLog ? timeAgo(lastLog.created_date) : '—' },
                { label: 'IP TERAKHIR', value: lastLog?.ip_address && lastLog.ip_address !== 'unknown' ? lastLog.ip_address : '—' },
                { label: 'DEVICE', value: lastLog?.user_agent ? `${getBrowser(lastLog.user_agent)} / ${getOS(lastLog.user_agent)}` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] uppercase tracking-widest font-bold text-foreground/25 mb-1">{label}</p>
                  <p className="text-xs font-semibold text-foreground/80 font-mono">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TENTANG SAYA ── */}
        <SectionCard icon={Users} iconColor="hsl(var(--success))" iconBg="rgba(0,212,126,0.12)"
          title="Tentang Saya" subtitle="Informasi dasar profil Anda">
          <p className="text-sm leading-relaxed text-foreground/50">
            {approvedUser?.notes ||
              `Pengguna aktif dengan level `}
            <span style={{ color: cfg.accent }} className="font-bold">{cfg.label}</span>
            {` dan status membership `}
            <span style={{ color: 'hsl(var(--warning))', fontWeight: 600 }}>{cfg.tier}</span>
            {`. ${cfg.sublabel}`}
          </p>
        </SectionCard>

        {/* ── STATISTIK AKUN ── */}
        <SectionCard icon={BarChart3} iconColor="hsl(var(--warning))" iconBg="rgba(245,166,35,0.12)"
          title="Statistik Akun" subtitle="Ringkasan aktivitas dan penggunaan">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Login', value: loginLogs.length, suffix: 'x', color: 'hsl(var(--success))' },
              { label: 'Login Bulan Ini', value: thisMonthLogins.length, suffix: 'x', color: 'hsl(var(--primary))' },
              { label: 'Total Aktivitas', value: logs.length, suffix: '', color: 'hsl(var(--warning))' },
              { label: 'Modul Aktif', value: userModules.filter(m => m.active).length, suffix: `/${APP_MODULES.length}`, color: 'hsl(var(--chart-3))' },
              { label: 'Sesi Aktif', value: 1, suffix: '', color: 'hsl(var(--info))' },
              { label: 'Status', value: '99', suffix: '%', color: 'hsl(var(--success))' },
            ].map(({ label, value, suffix, color }, i) => (
              <div key={label} className="relative rounded-xl p-4 overflow-hidden"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: color }} />
                <p className="text-[10px] uppercase tracking-wide font-bold text-foreground/25 mb-2">{label}</p>
                <p className="text-2xl font-black font-mono" style={{ color }}>
                  {value}<span className="text-sm font-medium text-foreground/30 ml-0.5">{suffix}</span>
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── MODUL AKSES ── */}
        <SectionCard icon={PuzzleIcon} iconColor="hsl(var(--primary))" iconBg="rgba(62,166,255,0.1)"
          title="Modul Akses" subtitle="Daftar fitur yang dapat diakses" defaultOpen={false}>
          <div className="space-y-2">
            {userModules.map(m => {
              const MIcon = m.icon;
              return (
                <div key={m.name} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/[0.03]"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: m.active ? 'hsl(var(--primary) / .08)' : 'hsl(var(--muted))', color: m.active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                      <MIcon size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: m.active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>{m.name}</p>
                      <p className="text-[10px] text-foreground/25 mt-0.5">{m.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={m.active
                      ? { background: 'rgba(0,212,126,0.12)', color: 'hsl(var(--success))' }
                      : { background: 'rgba(255,71,87,0.1)', color: 'hsl(var(--destructive))' }}>
                    {m.active ? 'Aktif' : 'Terkunci'}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── KEAMANAN AKUN ── */}
        <SectionCard icon={Lock} iconColor="hsl(var(--destructive))" iconBg="rgba(255,71,87,0.1)"
          title="Keamanan Akun" subtitle="Pengaturan proteksi dan keamanan" defaultOpen={false}>
          <div className="space-y-0">
            {[
              { icon: Key, bg: 'rgba(0,212,126,0.12)', color: 'hsl(var(--success))', label: 'Password', sub: 'Ubah password akun Anda' },
              { icon: Bell, bg: 'rgba(245,166,35,0.12)', color: 'hsl(var(--warning))', label: 'Notifikasi Login', sub: 'Kirim notifikasi saat login baru' },
              { icon: Globe, bg: 'rgba(62,166,255,0.1)', color: 'hsl(var(--primary))', label: 'Sesi Aktif', sub: 'Kelola perangkat yang login' },
            ].map(({ icon: Icon, bg, color, label, sub }, i) => (
              <div key={label} className="flex items-center justify-between py-4"
                style={{ borderBottom: i < 2 ? '1px solid hsl(var(--border))' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-[10px] text-foreground/30 mt-0.5">{sub}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-foreground/20" />
              </div>
            ))}
          </div>

          {/* Password form */}
          <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid hsl(var(--border))' }}>
              <Shield size={12} style={{ color: cfg.accent }} />
              <p className="text-[11px] text-foreground/40">Gunakan password yang kuat. Minimal 8 karakter.</p>
            </div>
            {['current', 'new', 'confirm'].map(field => {
              const labels = { current: 'KATA SANDI SAAT INI', new: 'PASSWORD BARU', confirm: 'KONFIRMASI PASSWORD' };
              const placeholders = { current: 'Masukkan kata sandi saat ini', new: 'Masukkan password baru', confirm: 'Ulangi password baru' };
              return (
                <div key={field}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mb-1.5">{labels[field]}</p>
                  <div className="relative">
                    <input
                      type={showPw[field] ? 'text' : 'password'}
                      value={pwForm[field]}
                      onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholders[field]}
                      className="w-full h-10 pl-4 pr-10 rounded-xl text-sm outline-none text-foreground placeholder:text-foreground/20"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                      className="absolute inset-y-0 right-3 flex items-center text-foreground/25 hover:text-foreground/50 transition-colors">
                      {showPw[field] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
            {pwForm.new.length > 0 && (
              <div className="grid grid-cols-2 gap-1">
                {[
                  { key: 'length', label: 'Min 8 karakter' },
                  { key: 'upper', label: 'Huruf besar' },
                  { key: 'lower', label: 'Huruf kecil' },
                  { key: 'number', label: 'Angka' },
                  { key: 'symbol', label: 'Simbol' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1">
                    {strength[key] ? <CheckCircle size={9} className="text-emerald-400" /> : <XCircle size={9} className="text-red-500" />}
                    <span className={`text-[9px] ${strength[key] ? 'text-emerald-400' : 'text-red-500'}`}>{label}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleSavePassword}
              disabled={pwLoading || !pwForm.current || !pwForm.new || !pwForm.confirm || !allStrong || pwForm.new !== pwForm.confirm}
              className="w-full h-10 rounded-xl text-sm font-bold text-primary-foreground transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'hsl(var(--primary))' }}>
              {pwLoading ? <><Loader2 size={14} className="animate-spin text-primary-foreground" /> Menyimpan...</> : <><Lock size={14} /> Simpan Password Baru</>}
            </button>
          </div>
        </SectionCard>

        {/* ── LOGIN PATH ── */}
        <SectionCard icon={Clock} iconColor="hsl(var(--chart-3))" iconBg="rgba(168,85,247,0.1)"
          title="Login Path" subtitle="Riwayat perangkat dan lokasi login" defaultOpen={false}>
          {logsLoading ? (
            <div className="py-4 text-center text-foreground/30 text-sm">Memuat...</div>
          ) : loginLogs.length === 0 ? (
            <div className="py-4 text-center text-foreground/30 text-sm">Belum ada riwayat login</div>
          ) : (
            <div className="space-y-2">
              {loginLogs.slice(0, 5).map((log, i) => (
                <div key={log.id || i} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground/30">{getDeviceIcon(log.user_agent)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {getOS(log.user_agent)} - {getBrowser(log.user_agent)}
                        </p>
                        {i === 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(0,212,126,0.12)', color: 'hsl(var(--success))' }}>
                            <span className="w-1 h-1 rounded-full bg-emerald-400" /> Sesi Ini
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-foreground/30 mt-0.5 font-mono">
                        {log.ip_address && log.ip_address !== 'unknown' ? log.ip_address : '—'} · Indonesia
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-foreground/30 font-mono shrink-0">{timeAgo(log.created_date)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── HUBUNGI ADMIN ── */}
        <div className="rounded-2xl p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,126,0.06) 0%, rgba(62,166,255,0.04) 100%)', border: '1px solid rgba(0,212,126,0.15)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,212,126,0.12)', color: 'hsl(var(--success))' }}>
              <Phone size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Butuh Bantuan?</p>
              <p className="text-xs text-foreground/40 mt-0.5">Hubungi admin untuk pertanyaan, kendala teknis, atau upgrade akun.</p>
            </div>
          </div>
          <button onClick={handleWhatsApp}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-primary-foreground whitespace-nowrap transition-all hover:brightness-110"
            style={{ background: 'hsl(var(--primary))' }}>
            Hubungi Admin
          </button>
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,71,87,0.2)' }}>
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,71,87,0.1)', color: 'hsl(var(--destructive))' }}>
              <AlertTriangle size={15} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--destructive))' }}>Zona Berbahaya</p>
              <p className="text-[11px] text-foreground/30">Tindakan yang tidak dapat dibatalkan</p>
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,71,87,0.1)', margin: '0 20px' }} />
          <div className="px-5 py-4 flex flex-wrap gap-3">
            <button onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
              style={{ border: '1px solid rgba(255,71,87,0.3)', color: 'hsl(var(--destructive))', background: 'transparent' }}>
              <LogOut size={13} /> Logout Semua Perangkat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}