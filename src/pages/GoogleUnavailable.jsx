import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';

const ROBOT = '/logo.png';

export default function GoogleUnavailable() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-5" style={{ background: 'linear-gradient(160deg,#081428 0%,#0d2145 55%,#081428 100%)' }}>
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-7 text-center backdrop-blur-xl">
        <img src={ROBOT} alt="Robot MONEY TRACKING" className="mx-auto mb-6 w-56 rounded-2xl" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-300">
          <Clock size={12} /> Belum Tersedia
        </span>
        <h1 className="mt-4 text-2xl font-bold text-white">Masuk dengan Google belum tersedia</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Fitur login/daftar melalui akun Google sedang dalam tahap penyiapan (maintenance).
          Untuk sementara, silakan gunakan email dan kata sandi Anda.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/login" className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-amber-400 text-sm font-bold text-[#0d2145]">
            <ArrowLeft size={16} /> Masuk dengan Email & Kata Sandi
          </Link>
          <Link to="/register" className="flex min-h-[46px] items-center justify-center rounded-xl border border-white/20 text-sm font-semibold text-white/80">
            Buat Akun Baru
          </Link>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-white/35">
          <ShieldCheck size={12} /> Keamanan akun Anda tetap terjaga
        </p>
      </section>
    </main>
  );
}