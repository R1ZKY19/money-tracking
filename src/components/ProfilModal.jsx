import { useState, useEffect, useRef } from 'react';
import { useUserRole } from '@/lib/UserRoleContext';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { changePasswordSecure } from '@/lib/changePassword';
import {
  User, Mail, Lock, Shield, Crown, Gem, Star, Users,
  Check, Loader2, Eye, EyeOff, Calendar, Sparkles,
  BadgeCheck, Trophy, KeyRound, AlertCircle, X, Camera, Zap, Award,
  ChevronRight, LayoutGrid, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import ProfilePanel from '@/components/profile/ProfilePanel';

/* ─── Role Config ──────────────────────────────────────────────── */
const ROLE_CONFIG = {
  super_master: {
    label: 'SUPER MASTER', icon: Crown,
    tier: 'ULTIMATE', tierIcon: Trophy, stars: 5,
    logo: 'https://i.ibb.co/WW8mbTrH/image.png',
    desc: 'Akses penuh ke seluruh sistem. Tidak ada batasan fitur.',
    modules: ['Semua Fitur'],
    // Dark navy with gold accent
    accent: '#F59E0B',
    accentGlow: 'rgba(245,158,11,0.35)',
    accentDim: 'rgba(245,158,11,0.12)',
    accentBorder: 'rgba(245,158,11,0.3)',
    badgeBg: 'linear-gradient(90deg, #B45309, #F59E0B, #B45309)',
    badgeText: '#fff',
    iconBg: 'rgba(245,158,11,0.18)',
    avatarRing: '#F59E0B',
    heroBg: 'linear-gradient(160deg, #0f1e3d 0%, #1a2e55 50%, #0f1e3d 100%)',
    nebula: 'radial-gradient(ellipse at 70% 30%, rgba(245,158,11,0.15) 0%, transparent 60%)',
    modalBg: 'linear-gradient(180deg, #0B1628 0%, #0d1a30 60%, #0B1628 100%)',
    cardBg: 'rgba(255,255,255,0.04)',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
  },
  master_1: {
    label: 'MASTER I', icon: Gem,
    tier: 'PREMIUM', tierIcon: Award, stars: 4,
    logo: 'https://i.ibb.co/5yMMTVY/image.png',
    desc: 'Akses premium ke semua fitur keuangan utama.',
    modules: ['Dashboard', 'Transaksi', 'Hutang', 'Piutang', 'Tabungan', 'Budget', 'Saldo', 'Transfer', 'Export'],
    accent: '#C084FC',
    accentGlow: 'rgba(192,132,252,0.35)',
    accentDim: 'rgba(192,132,252,0.12)',
    accentBorder: 'rgba(192,132,252,0.3)',
    badgeBg: 'linear-gradient(90deg, #7C3AED, #C084FC, #7C3AED)',
    badgeText: '#fff',
    iconBg: 'rgba(192,132,252,0.18)',
    avatarRing: '#C084FC',
    heroBg: 'linear-gradient(160deg, #1a0f3d 0%, #2a1555 50%, #1a0f3d 100%)',
    nebula: 'radial-gradient(ellipse at 70% 30%, rgba(192,132,252,0.15) 0%, transparent 60%)',
    modalBg: 'linear-gradient(180deg, #120B28 0%, #1a0f35 60%, #120B28 100%)',
    cardBg: 'rgba(255,255,255,0.04)',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
  },
  master_2: {
    label: 'MASTER II', icon: Star,
    tier: 'STANDAR', tierIcon: Zap, stars: 3,
    logo: 'https://i.ibb.co/Q70PjFxc/image.png',
    desc: 'Akses fitur keuangan standar tanpa pengaturan sistem.',
    modules: ['Dashboard', 'Transaksi', 'Hutang', 'Piutang', 'Tabungan', 'Budget', 'Saldo', 'Export'],
    accent: '#22D3EE',
    accentGlow: 'rgba(34,211,238,0.3)',
    accentDim: 'rgba(34,211,238,0.10)',
    accentBorder: 'rgba(34,211,238,0.25)',
    badgeBg: 'linear-gradient(90deg, #0891B2, #22D3EE, #0891B2)',
    badgeText: '#fff',
    iconBg: 'rgba(34,211,238,0.15)',
    avatarRing: '#22D3EE',
    heroBg: 'linear-gradient(160deg, #0a1e2d 0%, #0f2a3d 50%, #0a1e2d 100%)',
    nebula: 'radial-gradient(ellipse at 70% 30%, rgba(34,211,238,0.12) 0%, transparent 60%)',
    modalBg: 'linear-gradient(180deg, #070F1A 0%, #0B1828 60%, #070F1A 100%)',
    cardBg: 'rgba(255,255,255,0.04)',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
  },
  staf: {
    label: 'STAF', icon: Users,
    tier: 'DASAR', tierIcon: Shield, stars: 2,
    logo: 'https://i.ibb.co/XG0Qvfb/image.png',
    desc: 'Akses terbatas: lihat dashboard dan laporan saja.',
    modules: ['Dashboard', 'Budget', 'Tabungan', 'Saldo', 'Panduan'],
    accent: '#34D399',
    accentGlow: 'rgba(52,211,153,0.3)',
    accentDim: 'rgba(52,211,153,0.10)',
    accentBorder: 'rgba(52,211,153,0.25)',
    badgeBg: 'linear-gradient(90deg, #059669, #34D399, #059669)',
    badgeText: '#fff',
    iconBg: 'rgba(52,211,153,0.15)',
    avatarRing: '#34D399',
    heroBg: 'linear-gradient(160deg, #071a12 0%, #0d2a1e 50%, #071a12 100%)',
    nebula: 'radial-gradient(ellipse at 70% 30%, rgba(52,211,153,0.12) 0%, transparent 60%)',
    modalBg: 'linear-gradient(180deg, #060F0B 0%, #09160F 60%, #060F0B 100%)',
    cardBg: 'rgba(255,255,255,0.04)',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
  },
};

function StarRating({ count, accent }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13}
          style={{ color: i < count ? accent : 'rgba(255,255,255,0.2)' }}
          fill={i < count ? accent : 'none'} />
      ))}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function ProfilModal({ open, onClose }) {
  const { user, approvedUser, refresh, hasModule } = useUserRole();
  const [pwForm, setPwForm] = useState({ oldPw: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ oldPw: false, newPw: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [confirmPw, setConfirmPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (open && user) {
      setAvatarUrl(user.avatar_url || null);
    }
  }, [open, user]);

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
      refresh();
      toast.success('Foto profil diperbarui!');
    } catch {
      toast.error('Gagal upload foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const rawRole = approvedUser?.role || 'staf';
  const cfg = ROLE_CONFIG[rawRole] || ROLE_CONFIG['staf'];
  const RoleIcon = cfg.icon;
  const TierIcon = cfg.tierIcon;

  // Tahap 1: validasi + verifikasi kata sandi saat ini, lalu minta konfirmasi kedua.
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPw) return toast.error('Masukkan kata sandi saat ini');
    if (!pwForm.newPw || pwForm.newPw.length < 6) return toast.error('Password minimal 6 karakter');
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Konfirmasi password tidak cocok');
    if (pwForm.newPw === pwForm.oldPw) return toast.error('Kata sandi baru harus berbeda dari yang lama');

    setPwError('');
    setConfirmPw(true);
  };

  // Tahap 2: eksekusi setelah pengguna menekan "Ya, ganti kata sandi".
  const applyPasswordChange = async () => {
    setSavingPw(true);
    setPwError('');
    const result = await changePasswordSecure({
      currentPassword: pwForm.oldPw,
      newPassword: pwForm.newPw,
      confirmPassword: pwForm.confirm,
    });
    setSavingPw(false);
    setConfirmPw(false);
    if (!result.ok) {
      setPwError(result.error);
      return toast.error(result.error);
    }
    toast.success('Password berhasil diubah!');
    setPwForm({ oldPw: '', newPw: '', confirm: '' });
  };

  if (!open) return null;

  const joinDate = user?.created_date
    ? new Date(user.created_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const modules = ['Dashboard Bulanan', 'Dashboard Tahunan', 'YoY Comparison', 'Input Transaksi', 'Riwayat Transaksi', 'Transfer', 'Budget', 'Tabungan', 'Hutang', 'Piutang', 'Saldo Rekening', 'Net Worth', 'Pengaturan', 'Pengaturan Telegram', 'Pengaturan Bunga', 'Log Aktivitas', 'Export Data', 'Email Approval', 'Panduan'].filter(hasModule);

  return <>
    <ProfilePanel open={open} onClose={onClose} user={user} cfg={cfg} avatarUrl={avatarUrl} uploadingAvatar={uploadingAvatar} avatarInputRef={avatarInputRef} handleAvatarUpload={handleAvatarUpload} joinDate={joinDate} modules={modules} pwForm={pwForm} setPwForm={setPwForm} showPw={showPw} setShowPw={setShowPw} savingPw={savingPw} handleChangePassword={handleChangePassword} pwError={pwError} />
    <ConfirmDialog
      open={confirmPw}
      onOpenChange={setConfirmPw}
      type="update"
      title="Ganti kata sandi sekarang?"
      description="Kata sandi saat ini sudah terverifikasi. Setelah diganti, gunakan kata sandi baru untuk login berikutnya."
      confirmLabel="Ya, ganti kata sandi"
      cancelLabel="Tidak, batalkan"
      loading={savingPw}
      onConfirm={applyPasswordChange}
    />
  </>;
}