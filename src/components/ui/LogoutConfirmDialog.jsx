import { Shield, LogOut, Database, Lock, X, Check } from 'lucide-react';

const AUTH_LOGO = 'https://media.base44.com/images/public/6a2817e4a27a25c626d7a995/628dd9086_image.png';

const ASSURANCES = [
  { icon: Database, title: 'Data Anda tetap utuh', desc: 'Transaksi, hutang, piutang & tabungan tersimpan di server.' },
  { icon: Lock, title: 'Sesi ditutup aman', desc: 'Hanya token login perangkat ini yang dihapus.' },
  { icon: Shield, title: 'Bisa masuk kembali', desc: 'Seluruh data tampil lengkap saat Anda login lagi.' },
];

export default function LogoutConfirmDialog({ open, onClose, onConfirm, userName }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 safe-top safe-bottom" style={{ animation: 'logoutFade 0.2s ease' }}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <style>{`
        @keyframes logoutFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes logoutRise { from { opacity: 0; transform: translateY(14px) scale(0.985) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-xl"
        style={{ animation: 'logoutRise 0.24s cubic-bezier(0.22,1,0.36,1) both', border: '1px solid hsl(var(--border))' }}
      >
        {/* Header */}
        <div className="relative flex items-center gap-3.5 border-b border-border bg-muted/40 px-5 py-4">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
            <img src={AUTH_LOGO} alt="MONEY TRACKING" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Konfirmasi Keluar</p>
            <h2 className="truncate text-base font-semibold text-foreground">Akhiri sesi MONEY TRACKING</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-sm text-muted-foreground">
            Halo <span className="font-semibold text-foreground">{userName}</span>, Anda akan keluar dari sesi pada perangkat ini.
          </p>

          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {ASSURANCES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 bg-muted/25 px-3.5 py-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={13} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
                </div>
                <Check size={14} className="ml-auto mt-1 shrink-0 text-emerald-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:min-w-[110px]"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:min-w-[150px]"
          >
            <LogOut size={15} />
            Ya, Keluar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}