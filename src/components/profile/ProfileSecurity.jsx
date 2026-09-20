import { Eye, EyeOff, Loader2, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FIELDS = [
  ['oldPw', 'Kata sandi saat ini', 'current-password'],
  ['newPw', 'Kata sandi baru', 'new-password'],
  ['confirm', 'Konfirmasi kata sandi baru', 'new-password'],
];

export default function ProfileSecurity({ pwForm, setPwForm, showPw, setShowPw, savingPw, handleChangePassword, pwError }) {
  const match = pwForm.newPw && pwForm.newPw === pwForm.confirm;
  const tooShort = pwForm.newPw && pwForm.newPw.length < 6;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Lock size={14} />
        </span>
        Keamanan akun
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Gunakan kata sandi unik minimal 6 karakter. Untuk keamanan, kata sandi saat ini wajib dikonfirmasi sebelum diganti.
      </p>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed text-primary sm:text-xs">
        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
        <span>Verifikasi ganda: sistem memeriksa kata sandi lama Anda terlebih dahulu.</span>
      </div>

      <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5 sm:space-y-4">
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 xl:grid-cols-2">
          {FIELDS.map(([key, label, ac], i) => (
            <div key={key} className={i === 0 ? 'xl:col-span-2' : ''}>
              <Label htmlFor={`profile-${key}`} className="text-xs font-medium text-muted-foreground">{label}</Label>
              <div className="relative mt-1.5">
                <Input
                  id={`profile-${key}`}
                  type={showPw[key] ? 'text' : 'password'}
                  autoComplete={ac}
                  required
                  minLength={key === 'oldPw' ? undefined : 6}
                  value={pwForm[key] || ''}
                  onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                  className={`h-11 rounded-xl bg-background pr-12 text-sm transition-shadow ${key === 'confirm' && pwForm.confirm && !match ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <button
                  type="button"
                  aria-label={showPw[key] ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPw[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {pwError && (
          <p className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle size={13} className="shrink-0" />{pwError}
          </p>
        )}
        {tooShort && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle size={13} className="shrink-0" />Kata sandi baru minimal 6 karakter.
          </p>
        )}
        {pwForm.confirm && (
          <p className={`flex items-center gap-1.5 text-xs ${match ? 'text-success' : 'text-destructive'}`}>
            {match ? <CheckCircle2 size={13} className="shrink-0" /> : <AlertCircle size={13} className="shrink-0" />}
            {match ? 'Konfirmasi cocok' : 'Konfirmasi tidak sama dengan kata sandi baru'}
          </p>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-sm font-semibold shadow-sm sm:w-auto sm:px-6"
          disabled={savingPw || !pwForm.oldPw || !pwForm.newPw || !pwForm.confirm || !match || pwForm.newPw.length < 6}
        >
          {savingPw && <Loader2 className="animate-spin" />}Simpan kata sandi
        </Button>
      </form>
    </section>
  );
}