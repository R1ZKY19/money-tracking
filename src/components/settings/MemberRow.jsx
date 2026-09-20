import { Eye, Pencil, Trash2, Lock, Unlock, Shield, KeyRound } from 'lucide-react';

// Satu baris member pada direktori akses — tampilan card elegan, fungsi tetap.
export default function MemberRow({ u, cfg, isOwner, moduleCount, isCustom, onView, onEdit, onDelete, onResetPassword, onToggleLock, saving }) {
  const Icon = cfg.icon;
  const isLocked = u.is_approved === false;
  return (
    <div className="group flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/40 transition-colors">
      {/* Avatar role */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: cfg.gradient }}>
          <Icon size={17} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-bold text-foreground truncate">{u.email}</p>
            {isOwner && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                <Lock size={7} /> Owner
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cfg.accent }}>
              {cfg.shortLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              <Shield size={8} /> {moduleCount} modul
            </span>
            {isCustom && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Kustom</span>
            )}
          </div>
        </div>
      </div>

      {/* Status akses */}
      <div className="shrink-0 sm:w-[112px]">
        {isLocked ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            <Lock size={9} /> Dikunci
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Disetujui
          </span>
        )}
      </div>

      {/* Aksi */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onToggleLock && !isOwner && (
          <button onClick={() => onToggleLock(u)} disabled={saving} title={isLocked ? 'Buka kunci akun' : 'Kunci akun (blokir login)'}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-semibold transition-colors disabled:opacity-30 ${
              isLocked
                ? 'border-emerald-200 bg-card text-emerald-600 hover:bg-emerald-50'
                : 'border-border bg-card text-amber-600 hover:bg-amber-50 hover:border-amber-200'
            }`}>
            {isLocked ? <Unlock size={12} /> : <Lock size={12} />} {isLocked ? 'Buka' : 'Kunci'}
          </button>
        )}
        <button onClick={() => onView(u)} title="Detail member"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-card text-[11px] font-semibold text-sky-600 hover:bg-sky-50 hover:border-sky-200 transition-colors">
          <Eye size={12} /> Detail
        </button>
        <button onClick={() => onEdit(u)} title="Edit akses"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-card text-[11px] font-semibold text-foreground hover:bg-muted transition-colors">
          <Pencil size={12} /> Edit
        </button>
        {onResetPassword && !isOwner && (
          <button onClick={() => onResetPassword(u)} title="Bantu reset kata sandi member"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-card text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
            <KeyRound size={12} /> Reset Sandi
          </button>
        )}
        <button onClick={() => onDelete(u.id)} disabled={saving || isOwner} title="Hapus dari whitelist"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-card text-[11px] font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-30 disabled:hover:bg-card">
          <Trash2 size={12} /> Hapus
        </button>
      </div>
    </div>
  );
}