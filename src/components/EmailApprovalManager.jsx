import { useState, useEffect, useRef } from 'react';
import { ApprovedUser } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Check, X, Loader2, Mail, AlertCircle, Lock,
  Crown, Star, Gem, Users, Pencil, Trash2, Plus, Shield, Zap, Send, Percent,
  LayoutDashboard, Calendar, PiggyBank, CreditCard, HandCoins,
  Landmark, List, Settings, ClipboardList, History,
  Globe, ArrowRightLeft, BookOpen, TrendingUp, FileDown, LogIn,
  Sparkles, BadgeCheck, Trophy, Eye, FileText, Repeat, CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import MemberProfileModal from '@/components/settings/MemberProfileModal';
import MemberRow from '@/components/settings/MemberRow';
import MemberResetPasswordDialog from '@/components/settings/MemberResetPasswordDialog';
import { notifyUsers } from '@/lib/notify';
import { MODULE_OPTIONS, FEATURE_GROUPS, roleModules } from '@/lib/featureRegistry';

// ─── EMAIL WHITELIST ──────────────────────────────────────────────────────────
const ADMIN_ONLY_EMAIL = 'rizkykucuk19@gmail.com';

// ─── MODULE DEFINITIONS — bersumber dari registry fitur ──────────────────────
// Fitur baru/berubah/dihapus di registry otomatis ikut di daftar akses ini.
const ALL_MODULES = MODULE_OPTIONS;

const getModuleDef = (key) => ALL_MODULES.find(m => m.key === key) || { key, icon: Globe, label: key };

// ─── ROLE DEFINITIONS ─────────────────────────────────────────────────────────
const ROLES = [
  {
    value: 'none',
    label: 'BELUM ADA ROLE',
    shortLabel: 'PENDING',
    icon: AlertCircle,
    logo: '',
    gradient: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
    gradientSoft: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
    shimmer: null,
    glow: null,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    borderActive: 'border-gray-400',
    badge: 'from-gray-400 to-gray-500',
    accent: '#6B7280',
    accentLight: '#F3F4F6',
    desc: 'Member baru menunggu penetapan role. Hanya bisa membuka Panduan Fitur.',
    tier: 'PENDING',
    tierIcon: AlertCircle,
    stars: 0,
    modules: roleModules('none'),
  },
  {
    value: 'super_master',
    label: 'SUPER MASTER',
    shortLabel: 'S.MASTER',
    icon: Crown,
    logo: 'https://i.ibb.co/WW8mbTrH/image.png',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #92400E 100%)',
    gradientSoft: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 60%, #FDE68A 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
    glow: '0 0 20px rgba(217,119,6,0.35), 0 4px 12px rgba(217,119,6,0.2)',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    borderActive: 'border-amber-500',
    badge: 'from-amber-400 via-yellow-400 to-amber-500',
    accent: '#D97706',
    accentLight: '#FEF3C7',
    desc: 'Akses penuh ke seluruh sistem. Tidak ada batasan.',
    tier: 'ULTIMATE',
    tierIcon: Trophy,
    stars: 5,
    modules: roleModules('super_master'),
  },
  {
    value: 'master_1',
    label: 'MASTER I',
    shortLabel: 'MASTER I',
    icon: Gem,
    logo: 'https://i.ibb.co/5yMMTVY/image.png',
    gradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #3730A3 100%)',
    gradientSoft: 'linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 60%, #E0E7FF 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
    glow: '0 0 20px rgba(99,102,241,0.3), 0 4px 12px rgba(99,102,241,0.15)',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-400',
    borderActive: 'border-indigo-500',
    badge: 'from-indigo-500 via-violet-500 to-indigo-600',
    accent: '#4F46E5',
    accentLight: '#EEF2FF',
    desc: 'Akses premium ke semua fitur keuangan utama.',
    tier: 'PREMIUM',
    tierIcon: BadgeCheck,
    stars: 4,
    modules: roleModules('master_1'),
  },
  {
    value: 'master_2',
    label: 'MASTER II',
    shortLabel: 'MASTER II',
    icon: Star,
    logo: 'https://i.ibb.co/Q70PjFxc/image.png',
    gradient: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 50%, #0E7490 100%)',
    gradientSoft: 'linear-gradient(135deg, #F0FDFF 0%, #ECFEFF 60%, #CFFAFE 100%)',
    shimmer: null,
    glow: null,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-300',
    borderActive: 'border-cyan-400',
    badge: 'from-cyan-500 via-sky-500 to-cyan-600',
    accent: '#0891B2',
    accentLight: '#ECFEFF',
    desc: 'Akses fitur keuangan standar tanpa pengaturan sistem.',
    tier: 'STANDAR',
    tierIcon: Star,
    stars: 3,
    modules: roleModules('master_2'),
  },
  {
    value: 'staf',
    label: 'STAF',
    shortLabel: 'STAF',
    icon: Users,
    logo: 'https://i.ibb.co/XG0Qvfb/image.png',
    gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)',
    gradientSoft: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 60%, #D1FAE5 100%)',
    shimmer: null,
    glow: null,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    borderActive: 'border-emerald-400',
    badge: 'from-emerald-500 via-teal-500 to-emerald-600',
    accent: '#059669',
    accentLight: '#ECFDF5',
    desc: 'Akses terbatas: lihat dashboard dan laporan saja.',
    tier: 'DASAR',
    tierIcon: Shield,
    stars: 2,
    modules: roleModules('staf'),
  },
];

const getRoleConfig = (val) => ROLES.find(r => r.value === val) || ROLES[0];

// ─── STAR RATING ──────────────────────────────────────────────────────────────
function StarRating({ count, active, accent }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={8}
          className={i < count ? '' : 'opacity-20'}
          style={{ color: i < count ? (active ? 'white' : accent) : undefined }}
          fill={i < count ? (active ? 'white' : accent) : 'none'}
        />
      ))}
    </div>
  );
}

// ─── ROLE BADGE ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = getRoleConfig(role);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${cfg.badge} text-white`}
      style={{ letterSpacing: '0.04em' }}>
      <Icon size={8} />
      {cfg.shortLabel}
    </span>
  );
}

// ─── ROLE PICKER CARD ─────────────────────────────────────────────────────────
function RolePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ROLES.map((role) => {
        const Icon = role.icon;
        const TierIcon = role.tierIcon;
        const active = value === role.value;
        const isPremium = role.value === 'super_master' || role.value === 'master_1';

        return (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className={`relative flex flex-col items-center gap-0 p-0 rounded-2xl border-2 text-center transition-all overflow-hidden ${active
              ? `${role.borderActive} shadow-xl`
              : 'border-border hover:border-border/70 hover:shadow-md'}`}
            style={active && role.glow ? { boxShadow: role.glow } : undefined}
          >
            {/* Top gradient section */}
            <div className="w-full h-20 flex flex-col items-center justify-center relative overflow-hidden"
              style={{ background: active ? role.gradient : `${role.accent}12` }}>

              {/* Shimmer for premium roles */}
              {isPremium && active && (
                <div className="absolute inset-0 -skew-x-12 translate-x-[-100%]"
                  style={{
                    background: role.shimmer,
                    animation: 'shimmerSlide 2.5s ease-in-out infinite',
                  }} />
              )}

              {/* Tier badge */}
              <div className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-muted/50'}`}>
                <TierIcon size={8} className={active ? 'text-white' : 'text-muted-foreground'} />
                <span className={`text-[8px] font-black tracking-widest ${active ? 'text-white' : 'text-muted-foreground'}`}>{role.tier}</span>
              </div>

              {/* Check */}
              {active && (
                <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center">
                  <Check size={9} className="text-white" />
                </div>
              )}

              {/* Main icon */}
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 mb-1 ${active ? 'bg-white/20 border-white/30' : `${role.bg} ${role.border}`}`}>
                <Icon size={22} style={{ color: active ? 'white' : role.accent }} />
              </div>

              {/* Stars */}
              <StarRating count={role.stars} active={active} accent={role.accent} />
            </div>

            {/* Content */}
            <div className={`w-full px-3 py-2.5 ${active ? '' : 'bg-card'}`}
              style={{ background: active ? role.gradientSoft : undefined }}>
              <p className={`text-[11px] font-black tracking-widest ${active ? role.color : 'text-foreground'}`}>
                {role.label}
              </p>
              <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{role.desc}</p>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                <Shield size={8} className="text-muted-foreground" />
                <span className="text-[8px] text-muted-foreground font-medium">{role.modules.length} modul akses</span>
              </div>
            </div>

            {/* Premium glow border animation */}
            {isPremium && active && (
              <div className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${role.accent}30, transparent, ${role.accent}20)`,
                  animation: 'pulseBorder 2s ease-in-out infinite',
                }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── MODULE TOGGLE ────────────────────────────────────────────────────────────
function ModuleToggle({ selected, onChange, roleDefault }) {
  // null = ikuti default role; [] atau [...] = kustom
  const isDefault = selected === null || selected === undefined;

  const isOn = (key) => isDefault
    ? (roleDefault?.modules?.includes(key) || false)
    : selected.includes(key);

  const toggle = (key) => {
    const base = isDefault ? (roleDefault?.modules || []) : selected;
    const next = base.includes(key) ? base.filter(k => k !== key) : [...base, key];
    onChange(next);
  };

  // Group modules by category (mengikuti grup pada registry fitur)
  const groupedModules = Object.fromEntries(
    FEATURE_GROUPS.map(group => [group, ALL_MODULES.filter(m => m.group === group)])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-primary" />
          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Akses Modul</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {isDefault
              ? `${roleDefault?.modules?.length || 0} aktif`
              : `${(selected || []).length} aktif`}
          </span>
        </div>
        {!isDefault && (
          <button type="button" onClick={() => onChange(null)}
            className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1">
            <X size={9} /> Reset default
          </button>
        )}
      </div>

      {isDefault && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-xl border border-primary/15">
          <Check size={11} className="text-primary shrink-0" />
          <p className="text-[11px] text-primary font-medium">Mengikuti akses bawaan role. Klik modul untuk kustomisasi per-user.</p>
        </div>
      )}

      {/* Grouped modules by category */}
      <div className="space-y-3">
        {Object.entries(groupedModules).map(([category, mods]) => mods.length > 0 && (
          <div key={category} className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-1">{category}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {mods.map(mod => {
                const on = isOn(mod.key);
                const ModIcon = mod.icon;
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => toggle(mod.key)}
                    className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg border-2 text-left transition-all text-[11px] ${on
                      ? 'border-primary/50 bg-primary/10 shadow-sm'
                      : 'border-border bg-muted/30 hover:border-border/70 hover:bg-muted/50'}`}
                  >
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${on ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {on && <Check size={10} className="text-white" />}
                    </div>
                    <ModIcon size={10} className={`shrink-0 ${on ? 'text-primary' : 'text-muted-foreground/50'}`} />
                    <span className={`font-semibold leading-tight truncate ${on ? 'text-primary' : 'text-muted-foreground'}`}>
                      {mod.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmerSlide {
          0% { transform: skewX(-12deg) translateX(-120%); }
          60% { transform: skewX(-12deg) translateX(320%); }
          100% { transform: skewX(-12deg) translateX(320%); }
        }
        @keyframes pulseBorder {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

// ─── MEMBER DIRECTORY ROW ─────────────────────────────────────────────────────
function MemberCard({ u, onEdit, onDelete, onViewProfile, onResetPassword, onToggleLock, saving }) {
  const cfg = getRoleConfig(u.role || 'none');
  const customModules = u.access_modules?.length > 0;
  const activeModules = customModules ? u.access_modules : cfg.modules;

  return (
    <MemberRow
      u={u}
      cfg={cfg}
      isOwner={u.email === ADMIN_ONLY_EMAIL}
      moduleCount={activeModules.length}
      isCustom={customModules}
      onView={onViewProfile}
      onEdit={onEdit}
      onDelete={onDelete}
      onResetPassword={onResetPassword}
      onToggleLock={onToggleLock}
      saving={saving}
    />
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function EmailApprovalManager() {
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ email: '', role: 'none', access_modules: [], notes: '' });
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMember, setProfileMember] = useState(null);
  const [resetMember, setResetMember] = useState(null);

  useEffect(() => { fetchApprovedUsers(); }, []);

  const fetchApprovedUsers = async () => {
    setLoading(true);
    try {
      const users = await ApprovedUser.list();
      setApprovedUsers(users || []);
    } catch {
      toast.error('Gagal memuat daftar email');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ email: '', role: 'none', access_modules: [], notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    const mods = u.access_modules;
    setForm({ email: u.email, role: u.role || 'none', access_modules: Array.isArray(mods) ? mods : null, notes: u.notes || '' });
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const emailTrimmed = form.email.trim().toLowerCase();
    if (!emailTrimmed) return toast.error('Masukkan email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) return toast.error('Format email tidak valid');
    if (!editing && approvedUsers.find(u => u.email === emailTrimmed)) return toast.error('Email sudah ada');

    setSaving(true);
    try {
      const payload = {
        email: emailTrimmed,
        is_approved: true,
        role: form.role,
        // null = ikuti default role; array = kustom
        access_modules: Array.isArray(form.access_modules) ? form.access_modules : null,
        notes: form.notes,
        ...(editing ? {} : { approved_at: new Date().toISOString() }),
      };
      if (editing) {
        await ApprovedUser.update(editing.id, payload);
        toast.success(`${emailTrimmed} diperbarui`);
        notifyUsers({
          title: 'Akses & role diperbarui',
          message: `Role Anda kini ${getRoleConfig(form.role).label} dengan ${Array.isArray(payload.access_modules) ? payload.access_modules.length : getRoleConfig(form.role).modules.length} modul akses.`,
          type: 'role',
          targetEmail: emailTrimmed,
        });
      } else {
        await ApprovedUser.create(payload);
        toast.success(`${emailTrimmed} → ${getRoleConfig(form.role).label}`);
        notifyUsers({
          title: 'Akses login disetujui',
          message: `Anda telah didaftarkan sebagai ${getRoleConfig(form.role).label}.`,
          type: 'role',
          targetEmail: emailTrimmed,
        });
      }
      setDialogOpen(false);
      await fetchApprovedUsers();
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async (u) => {
    setSaving(true);
    try {
      const nextApproved = !(u.is_approved !== false);
      await ApprovedUser.update(u.id, { is_approved: nextApproved });
      toast.success(nextApproved ? `${u.email} dibuka kembali` : `${u.email} dikunci — tidak bisa login`);
      await fetchApprovedUsers();
    } catch {
      toast.error('Gagal mengubah status kunci');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await Promise.race([
        ApprovedUser.delete(id),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 15000))
      ]);
      toast.success('Email dihapus dari whitelist');
      setDeleteId(null);
      await fetchApprovedUsers();
    } catch {
      toast.error('Gagal menghapus');
    } finally {
      setSaving(false);
    }
  };

  const [sortOrder, setSortOrder] = useState('role'); // 'role' | 'date' | 'email'

  const ROLE_ORDER = { super_master: 0, master_1: 1, master_2: 2, staf: 3, none: 4 };

  const filtered = approvedUsers
    .filter(u => filterRole === 'all' || (u.role || 'none') === filterRole)
    .filter(u => !searchQuery || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.notes || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'role') return (ROLE_ORDER[a.role || 'none'] ?? 9) - (ROLE_ORDER[b.role || 'none'] ?? 9);
      if (sortOrder === 'date') return new Date(b.approved_at || 0) - new Date(a.approved_at || 0);
      if (sortOrder === 'email') return (a.email || '').localeCompare(b.email || '');
      return 0;
    });

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r.value] = approvedUsers.filter(u => (u.role || 'none') === r.value).length;
    return acc;
  }, {});
  const selectedRoleCfg = getRoleConfig(form.role);

  return (
    <>
      <section className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.06), transparent 70%)' }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-1.5">Kontrol Akses</p>
              <h3 className="text-base font-heading font-bold text-foreground tracking-tight">Manajemen Akses Member</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Whitelist email yang diizinkan login ke aplikasi</p>
            </div>
            <Button size="sm" onClick={openAdd} className="gap-1.5 text-xs rounded-xl shadow-sm">
              <Plus size={13} /> Tambah Member
            </Button>
          </div>

          {/* Role filter chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => setFilterRole('all')}
              className={`h-8 px-3 rounded-xl border text-[11px] font-bold transition-colors ${filterRole === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}>
              Semua · {approvedUsers.length}
            </button>
            {ROLES.map(r => {
              const active = filterRole === r.value;
              const Icon = r.icon;
              return (
                <button key={r.value} onClick={() => setFilterRole(active ? 'all' : r.value)}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-bold transition-colors ${active ? 'text-white border-transparent shadow-sm' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
                  style={active ? { background: r.gradient } : undefined}>
                  <Icon size={11} style={{ color: active ? '#fff' : r.accent }} />
                  {r.shortLabel} · {roleCounts[r.value] || 0}
                </button>
              );
            })}
          </div>

          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <div className="relative flex-1">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                aria-label="Cari email atau catatan member"
                placeholder="Cari email atau catatan member…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-9 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} aria-label="Bersihkan pencarian" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex rounded-xl border border-border overflow-hidden text-[10px] font-bold shrink-0">
              {[{ key: 'role', label: 'Role' }, { key: 'date', label: 'Terbaru' }, { key: 'email', label: 'Email' }].map(({ key, label }) => (
                <button key={key} onClick={() => setSortOrder(key)}
                  className={`px-3 h-9 transition-colors ${sortOrder === key ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meta bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-muted/40 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Direktori Member</p>
          <p className="text-[10px] font-bold text-primary">{filtered.length} dari {approvedUsers.length}</p>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-14 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-muted-foreground">
            <Mail size={30} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Belum ada member{filterRole !== 'all' ? ` dengan role ${getRoleConfig(filterRole).label}` : ''}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(u => (
              <MemberCard key={u.id} u={u} onEdit={openEdit} onDelete={setDeleteId} onViewProfile={setProfileMember} onResetPassword={setResetMember} onToggleLock={handleToggleLock} saving={saving} />
            ))}
          </div>
        )}
      </section>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!saving) setDialogOpen(v); }}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0 border-0 shadow-2xl">
          <div className="h-1.5 w-full rounded-t-xl" style={{ background: selectedRoleCfg.gradient }} />
          <div className="p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{ background: selectedRoleCfg.gradient }}>
                  {(form.role === 'super_master' || form.role === 'master_1') && (
                    <div className="absolute inset-0 -skew-x-12" style={{ background: selectedRoleCfg.shimmer, animation: 'shimmerSlide 2.5s ease-in-out infinite' }} />
                  )}
                  {(() => { const I = selectedRoleCfg.icon; return <I size={20} className="text-white relative z-10" />; })()}
                </div>
                <div>
                  <DialogTitle className="text-base">{editing ? 'Edit Akses Member' : 'Tambah Member Baru'}</DialogTitle>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarRating count={selectedRoleCfg.stars} active={false} accent={selectedRoleCfg.accent} />
                    <span className="text-xs font-bold" style={{ color: selectedRoleCfg.accent }}>{selectedRoleCfg.label}</span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alamat Email</Label>
                <Input type="email" placeholder="user@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  disabled={!!editing} className="mt-1.5" />
                {editing && <p className="text-[11px] text-muted-foreground mt-1">Email tidak bisa diubah.</p>}
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5 block">Pilih Role</Label>
                <RolePicker value={form.role} onChange={v => setForm({ ...form, role: v, access_modules: [] })} />
              </div>

              <div className="rounded-2xl border border-border p-4" style={{ background: selectedRoleCfg.accentLight + '50' }}>
                <ModuleToggle
                  selected={form.access_modules}
                  onChange={v => setForm({ ...form, access_modules: v })}
                  roleDefault={getRoleConfig(form.role)}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Catatan Admin (opsional)</Label>
                <Input placeholder="Nama, paket, tanggal langganan..." value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1.5" />
              </div>

              <div className="flex gap-2.5 pt-1">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving} className="flex-1">Batal</Button>
                <Button type="submit" disabled={saving || !form.email.trim()} className="flex-1"
                  style={{ background: selectedRoleCfg.gradient, border: 'none' }}>
                  {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
                  {editing ? 'Simpan Perubahan' : 'Tambah & Setujui'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* PROFILE MODAL — Lihat profil, IP, dan riwayat aktivitas realtime */}
      <MemberResetPasswordDialog member={resetMember} onClose={() => setResetMember(null)} />

      <MemberProfileModal
        member={profileMember}
        open={!!profileMember}
        onClose={() => setProfileMember(null)}
      />

      {/* DELETE CONFIRM */}
      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 shadow-2xl">
          <div className="h-1 w-full bg-red-500" />
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 uppercase">Tindakan Berbahaya</span>
                <h3 className="text-base font-bold text-foreground mt-1">Hapus Member?</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Member ini tidak akan bisa login lagi setelah dihapus dari whitelist.</p>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)} disabled={saving}>Batal</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(deleteId)} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Trash2 size={14} className="mr-1.5" />}Ya, Hapus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}