import { useEffect, useState } from 'react';
import { ShieldAlert, Lock, RotateCcw } from 'lucide-react';

const GUARD_VIDEO = 'https://media.base44.com/videos/public/6a2817e4a27a25c626d7a995/170bfb409_Guard_Robot.mp4';

const isBlockedKey = (e) => {
  if (e.key === 'F12') return true;
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) return true;
  if ((e.ctrlKey || e.metaKey) && ['U', 'u', 'S', 's'].includes(e.key)) return true;
  return false;
};

export default function CodeGuard() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isBlockedKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        setBlocked(true);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);

    // Blokir klik kanan (context menu) & drag gambar untuk mengantisipasi penyalinan/inspeksi
    const onContextMenu = (e) => { e.preventDefault(); };
    const onDragStart = (e) => { e.preventDefault(); };
    window.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('dragstart', onDragStart, true);

    // Bersihkan & bisukan console agar tidak ada jejak kode/data yang terlihat
    const noop = () => {};
    const methods = ['log', 'info', 'warn', 'debug', 'table', 'dir', 'trace', 'group', 'groupEnd'];
    const original = {};
    methods.forEach((m) => { original[m] = console[m]; console[m] = noop; });
    try { console.clear(); } catch { /* ignore */ }
    const clearLoop = setInterval(() => { try { console.clear(); } catch { /* ignore */ } }, 1500);

    // Peringatan HANYA muncul saat ada upaya membuka kode / developer tools.
    // Pemakaian normal di HP, tablet, maupun komputer tidak pernah terblokir:
    // di layar sentuh pengecekan ukuran jendela dilewati (bilah alamat & keyboard
    // membuat selisihnya besar), penyalahgunaan di HP tetap tercegat lewat
    // blokir klik kanan / pintasan keyboard di atas.
    // Pengecekan ukuran jendela dimatikan sepenuhnya: di HP/tablet dan di dalam
    // iframe/preview selisihnya wajar besar sehingga menghasilkan blokir palsu.
    // Peringatan kini hanya muncul dari upaya nyata: pintasan devtools / view-source.
    const detect = null;

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('contextmenu', onContextMenu, true);
      window.removeEventListener('dragstart', onDragStart, true);
      if (detect) clearInterval(detect);
      clearInterval(clearLoop);
      methods.forEach((m) => { console[m] = original[m]; });
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = blocked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [blocked]);

  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-y-auto bg-[#070E1A] px-4 py-8 safe-top safe-bottom">
      <style>{`
        @keyframes guardRise { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes guardScan { 0% { transform: translateY(-100%) } 100% { transform: translateY(1200%) } }
        @keyframes guardPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.35) } 50% { box-shadow: 0 0 0 18px rgba(239,68,68,0) } }
      `}</style>

      <div className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,.18), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(14,165,233,.12), transparent 60%)' }} />

      <div className="relative w-full max-w-md text-center" style={{ animation: 'guardRise .35s cubic-bezier(.22,1,.36,1) both' }}>
        <div className="relative mx-auto mb-6 w-full max-w-[300px] overflow-hidden rounded-3xl"
          style={{ border: '1px solid rgba(239,68,68,.4)', animation: 'guardPulse 2.4s ease-in-out infinite' }}>
          <video src={GUARD_VIDEO} autoPlay loop muted playsInline className="block h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(239,68,68,.35), transparent)', animation: 'guardScan 3s linear infinite' }} />
        </div>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-300"
          style={{ border: '1px solid rgba(239,68,68,.3)' }}>
          <ShieldAlert size={12} /> Akses Diblokir
        </div>

        <h1 className="text-xl font-semibold leading-snug text-white sm:text-2xl">
          JANGAN MENCOBA MENCURI ATAU MENYERANG SISTEM INI
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-white/55 sm:text-sm">
          Sistem mendeteksi upaya membuka kode sumber atau developer tools. Aktivitas ini dicatat oleh keamanan MONEY TRACKING. Tutup developer tools untuk melanjutkan.
        </p>

        <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2 rounded-xl bg-white/[.04] px-3 py-2.5 text-[11px] text-white/50"
          style={{ border: '1px solid rgba(255,255,255,.08)' }}>
          <Lock size={12} className="shrink-0 text-amber-300" />
          Semua aktivitas terenkripsi &amp; dipantau
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mx-auto mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.98]"
        >
          <RotateCcw size={14} /> Muat Ulang Aplikasi
        </button>
      </div>
    </div>
  );
}