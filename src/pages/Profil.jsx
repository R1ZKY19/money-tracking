import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User, Mail, Lock, Shield, Crown, Gem, Star, Users,
  Check, Loader2, Eye, EyeOff, Calendar, Sparkles,
  BadgeCheck, Trophy, KeyRound, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { changePasswordSecure } from '@/lib/changePassword';

// ─── ROLE CONFIG ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  super_master: {
    label: 'SUPER MASTER',
    icon: Crown,
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #92400E 100%)',
    gradientSoft: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
    glow: '0 0 24px rgba(217,119,6,0.35)',
    accent: '#D97706',
    border: 'border-amber-400',
    color: 'text-amber-700',
    badge: 'from-amber-400 via-yellow-400 to-amber-500',
    tier: 'ULTIMATE',
    tierIcon: Trophy,
    stars: 5,
    desc: 'Akses penuh ke seluruh sistem. Tidak ada batasan fitur.',
    modules: ['Semua Fitur'],
  },
  master_1: {
    label: 'MASTER I',
    icon: Gem,
    gradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #3730A3 100%)',
    gradientSoft: 'linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
    glow: '0 0 20px rgba(99,102,241,0.3)',
    accent: '#4F46E5',
    border: 'border-indigo-400',
    color: 'text-indigo-700',
    badge: 'from-indigo-500 via-violet-500 to-indigo-600',
    tier: 'PREMIUM',
    tierIcon: BadgeCheck,
    stars: 4,
    desc: 'Akses premium ke semua fitur keuangan utama.',
    modules: ['Dashboard', 'Transaksi', 'Hutang', 'Piutang', 'Tabungan', 'Budget', 'Saldo', 'Transfer', 'Export'],
  },
  master_2: {
    label: 'MASTER II',
    icon: Star,
    gradient: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 50%, #0E7490 100%)',
    gradientSoft: 'linear-gradient(135deg, #F0FDFF 0%, #ECFEFF 100%)',
    shimmer: null,
    glow: null,
    accent: '#0891B2',
    border: 'border-cyan-300',
    color: 'text-cyan-700',
    badge: 'from-cyan-500 via-sky-500 to-cyan-600',
    tier: 'STANDAR',
    tierIcon: Star,
    stars: 3,
    desc: 'Akses fitur keuangan standar tanpa pengaturan sistem.',
    modules: ['Dashboard', 'Transaksi', 'Hutang', 'Piutang', 'Tabungan', 'Budget', 'Saldo', 'Export'],
  },
  staf: {
    label: 'STAF',
    icon: Users,
    gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)',
    gradientSoft: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
    shimmer: null,
    glow: null,
    accent: '#059669',
    border: 'border-emerald-300',
    color: 'text-emerald-700',
    badge: 'from-emerald-500 via-teal-500 to-emerald-600',
    tier: 'DASAR',
    tierIcon: Shield,
    stars: 2,
    desc: 'Akses terbatas: lihat dashboard dan laporan saja.',
    modules: ['Dashboard', 'Budget', 'Tabungan', 'Saldo', 'Panduan'],
  },
};

function StarRating({ count, accent }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11}
          className={i >= count ? 'opacity-20' : ''}
          style={{ color: i < count ? accent : undefined }}
          fill={i < count ? accent : 'none'}
        />
      ))}
    </div>
  );
}

export default function Profil() {
  const [user, setUser] = useState(null);
  const [approvedUser, setApprovedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const fullUser = {
        ...authUser,
        ...(profile || {}),
        email: authUser.email,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
      };
      setUser(fullUser);

      const { data: approvedDetail } = await supabase
        .from('approved_users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (approvedDetail) {
        setApprovedUser(approvedDetail);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Fallback: get role from user object or approvedUser
  const rawRole = approvedUser?.role || user?.role || 'staf';
  const roleCfg = ROLE_CONFIG[rawRole] || ROLE_CONFIG['staf'];
  const RoleIcon = roleCfg.icon;
  const TierIcon = roleCfg.tierIcon;
  const isPremium = rawRole === 'super_master' || rawRole === 'master_1';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.current) return toast.error('Masukkan kata sandi saat ini');
    if (!pwForm.newPw || pwForm.newPw.length < 6) return toast.error('Password minimal 6 karakter');
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Konfirmasi password tidak cocok');

    setSavingPw(true);
    const result = await changePasswordSecure({
      currentPassword: pwForm.current,
      newPassword: pwForm.newPw,
      confirmPassword: pwForm.confirm,
    });
    setSavingPw(false);
    if (!result.ok) return toast.error(result.error);
    toast.success('Password berhasil diubah!');
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* ── HERO ROLE CARD ── */}
      <div className={`relative overflow-hidden rounded-3xl border-2 shadow-xl ${roleCfg.border}`}
        style={{ boxShadow: isPremium && roleCfg.glow ? roleCfg.glow : undefined }}>

        {/* Gradient background */}
        <div className="h-32 relative overflow-hidden flex items-center justify-center"
          style={{ background: roleCfg.gradient }}>
          {/* Shimmer for premium */}
          {isPremium && roleCfg.shimmer && (
            <div className="absolute inset-0 -skew-x-12"
              style={{ background: roleCfg.shimmer, animation: 'shimmerSlide 3s ease-in-out infinite' }} />
          )}
          {/* Decorative circles */}
          <div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute bottom-2 left-4 w-12 h-12 rounded-full bg-white/8" />
          {/* Tier badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
            <TierIcon size={10} className="text-white" />
            <span className="text-[9px] font-black text-white tracking-widest">{roleCfg.tier}</span>
          </div>
        </div>

        {/* Avatar overlapping */}
        <div className="relative px-6 pb-5">
          <div className="absolute -top-8 left-6">
            <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center relative overflow-hidden"
              style={{ background: roleCfg.gradient }}>
              {isPremium && roleCfg.shimmer && (
                <div className="absolute inset-0 -skew-x-12" style={{ background: roleCfg.shimmer, animation: 'shimmerSlide 3s ease-in-out infinite' }} />
              )}
              <RoleIcon size={28} className="text-white relative z-10" />
            </div>
          </div>

          <div className="pt-10">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-black text-foreground">
                  {user?.full_name || 'Pengguna'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r ${roleCfg.badge} text-white`}>
                    <RoleIcon size={10} /> {roleCfg.label}
                  </span>
                  <StarRating count={roleCfg.stars} accent={roleCfg.accent} />
                </div>
              </div>
            </div>

            {/* Role description */}
            <div className="mt-4 p-3 rounded-xl border" style={{ background: roleCfg.gradientSoft, borderColor: roleCfg.accent + '30' }}>
              <p className="text-xs font-semibold" style={{ color: roleCfg.accent }}>{roleCfg.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── DATA PROFIL ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <User size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Informasi Akun</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail size={15} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
              <p className="text-sm font-semibold text-foreground">{user?.email || '—'}</p>
            </div>
          </div>

          {/* Nama */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User size={15} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Nama Lengkap</p>
              <p className="text-sm font-semibold text-foreground">{user?.full_name || '—'}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-3 p-3 rounded-xl border-2"
            style={{ background: roleCfg.gradientSoft, borderColor: roleCfg.accent + '40' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
              style={{ background: roleCfg.gradient }}>
              {isPremium && roleCfg.shimmer && (
                <div className="absolute inset-0 -skew-x-12" style={{ background: roleCfg.shimmer, animation: 'shimmerSlide 3s ease-in-out infinite' }} />
              )}
              <RoleIcon size={15} className="text-white relative z-10" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Role / Tingkat Akses</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-black" style={{ color: roleCfg.accent }}>{roleCfg.label}</p>
                <StarRating count={roleCfg.stars} accent={roleCfg.accent} />
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: roleCfg.accent + '20' }}>
              <TierIcon size={10} style={{ color: roleCfg.accent }} />
              <span className="text-[9px] font-black" style={{ color: roleCfg.accent }}>{roleCfg.tier}</span>
            </div>
          </div>

          {/* Bergabung */}
          {user?.created_date && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar size={15} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Bergabung Sejak</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(user.created_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}

          {/* Akses Modul */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-muted-foreground" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Modul yang Dapat Diakses</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(approvedUser?.access_modules?.length > 0 ? approvedUser.access_modules : roleCfg.modules).map(m => (
                <span key={m} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                  style={{ background: roleCfg.accent + '18', color: roleCfg.accent }}>
                  <Check size={9} /> {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── GANTI PASSWORD ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <KeyRound size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Ganti Password</h2>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">Gunakan password yang kuat dan unik. Minimal 6 karakter.</p>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            {/* Current Password */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kata Sandi Saat Ini</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPw.current ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi saat ini"
                  value={pwForm.current}
                  onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw.current ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password Baru</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPw.newPw ? 'text' : 'password'}
                  placeholder="Masukkan password baru"
                  value={pwForm.newPw}
                  onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, newPw: !p.newPw }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw.newPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Konfirmasi Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPw.confirm ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Match indicator */}
            {pwForm.newPw && pwForm.confirm && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${pwForm.newPw === pwForm.confirm ? 'text-emerald-600' : 'text-red-500'}`}>
                {pwForm.newPw === pwForm.confirm
                  ? <><Check size={12} /> Password cocok</>
                  : <><AlertCircle size={12} /> Password tidak cocok</>}
              </div>
            )}

            <Button type="submit" disabled={savingPw || !pwForm.current || !pwForm.newPw || !pwForm.confirm} className="w-full bg-[#0D4F6D] hover:bg-[#0a3d55]">
              {savingPw ? <Loader2 size={14} className="animate-spin mr-2" /> : <Lock size={14} className="mr-2" />}
              Simpan Password Baru
            </Button>
          </form>
        </div>
      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmerSlide {
          0% { transform: skewX(-12deg) translateX(-120%); }
          60% { transform: skewX(-12deg) translateX(320%); }
          100% { transform: skewX(-12deg) translateX(320%); }
        }
      `}</style>
    </div>
  );
}