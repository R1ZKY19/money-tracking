import { Camera, Loader2, User, CalendarDays, ShieldCheck, MessageCircle } from 'lucide-react';
import { useUserRole } from '@/lib/UserRoleContext';
import ProfileRoleCard from '@/components/profile/ProfileRoleCard';
import { roleVisual } from '@/lib/roleVisuals';

export default function ProfileIdentity({ user, avatarUrl, uploadingAvatar, avatarInputRef, handleAvatarUpload, joinDate, modules }) {
  const { approvedUser } = useUserRole();
  const role = approvedUser?.role || 'none';
  const cfg = roleVisual(role);

  return (
    <aside className="relative shrink-0 space-y-4 overflow-hidden border-b border-sidebar-border bg-sidebar p-4 text-sidebar-foreground sm:space-y-5 sm:p-6 lg:w-80 lg:border-b-0 lg:border-r">
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full blur-3xl" style={{ background: cfg.accent, opacity: 0.1 }} />

      <div className="relative flex items-center gap-4 lg:flex-col lg:items-start">
        <button
          type="button"
          aria-label="Ubah foto profil"
          disabled={uploadingAvatar}
          onClick={() => avatarInputRef.current?.click()}
          className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-sidebar-accent transition-transform duration-200 hover:scale-[1.03] active:scale-95 sm:h-20 sm:w-20"
          style={{ border: `1px solid ${cfg.ring}`, boxShadow: cfg.glow }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
            : <span className="flex h-full w-full items-center justify-center"><User size={28} /></span>}
          <span className="absolute inset-x-0 bottom-0 flex justify-center bg-sidebar/85 py-1 backdrop-blur-sm">
            {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          </span>
        </button>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

        <div className="min-w-0 lg:mt-1">
          <h2 className="truncate text-base font-semibold text-sidebar-primary sm:text-lg lg:whitespace-normal lg:break-words">
            {user?.full_name || user?.email?.split('@')[0] || 'Pengguna'}
          </h2>
          <p className="mt-0.5 truncate text-xs text-sidebar-foreground/70 lg:break-all lg:whitespace-normal">{user?.email}</p>
        </div>
      </div>

      <div className="relative"><ProfileRoleCard role={role} moduleCount={modules.length} /></div>

      <dl className="relative grid grid-cols-2 gap-2 lg:grid-cols-1">
        {[
          [CalendarDays, 'Bergabung', joinDate],
          [ShieldCheck, 'Hak akses', `${modules.length} modul tersedia`],
        ].map(([Icon, label, value]) => (
          <div key={label} className="min-w-0 rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/60">
              <Icon size={11} className="shrink-0" />{label}
            </dt>
            <dd className="mt-1 truncate text-sm font-medium text-sidebar-primary">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="relative text-[11px] leading-relaxed text-sidebar-foreground/60">
        Klik foto untuk memperbarui profil. Ukuran maksimum 5 MB.
      </p>

      <a
        href="https://wa.me/6283812595110?text=Halo%20Admin%20MONEY%20TRACKING%2C%20saya%20butuh%20bantuan%20akun."
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/30 px-3 py-2.5 text-sm font-medium text-sidebar-primary transition-colors hover:bg-sidebar-accent"
      >
        <MessageCircle size={14} />Hubungi admin
      </a>
    </aside>
  );
}