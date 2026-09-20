import { Clock3, ShieldCheck, WalletCards, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function PendingValidationScreen() {
  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="min-h-full grid lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden lg:flex flex-col justify-between bg-sidebar p-12 text-sidebar-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10"><WalletCards size={21} /></div>
            <div><p className="text-sm font-semibold text-white">MONEY TRACKING</p><p className="text-xs text-white/50">Executive Financial Control</p></div>
          </div>
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[.2em] text-info">Dashboard Keuangan Terpadu</p>
            <h1 className="text-4xl font-semibold leading-tight text-white">Kendalikan arus kas, aset, hutang, dan target keuangan dalam satu dashboard.</h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/60">Money Tracking membantu pemilik dan tim memantau kondisi keuangan secara aman melalui laporan real-time dan kontrol akses terverifikasi.</p>
          </div>
          <p className="text-xs text-white/35">Akses dilindungi oleh validasi kepemilikan email.</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 shadow-xl sm:p-9">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck size={26} /></div>
              <span className="inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-warning"><span className="h-2 w-2 rounded-full bg-warning pulse-dot" />Dalam Validasi</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Permintaan Akses Diterima</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Mohon menunggu proses verifikasi</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Tim administrator sedang melakukan validasi terhadap kepemilikan email dan kelayakan akses Anda ke dashboard.</p>

            <div className="my-7 rounded-2xl border border-border bg-muted/35 p-4">
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-card text-primary shadow-sm"><Clock3 size={18} /></div><div><p className="text-xs text-muted-foreground">Estimasi waktu validasi</p><p className="text-base font-semibold text-foreground">Maksimal 1 × 24 jam</p></div></div>
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              {['Email dan akun Anda sedang diperiksa', 'Akses dashboard tetap terkunci selama validasi', 'Silakan buka kembali aplikasi setelah disetujui'].map(text => <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground"><CheckCircle2 size={15} className="shrink-0 text-primary" />{text}</div>)}
            </div>
            <p className="mt-7 text-center text-xs text-muted-foreground">Tidak perlu mencoba login berulang kali. Permintaan Anda sudah tercatat.</p>
            <button onClick={() => supabase.auth.signOut().then(() => { window.location.href = '/login'; })} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground shadow-sm hover:bg-muted"><ArrowLeft size={16} />Kembali ke Login</button>
          </div>
        </section>
      </div>
    </main>
  );
}