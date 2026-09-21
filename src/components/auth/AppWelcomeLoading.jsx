import '@/components/auth/executive-auth.css';

const AUTH_LOGO = '/logo.png';

export default function AppWelcomeLoading() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#102A43] px-6 text-white" role="status" aria-live="polite">
      <div className="text-center">
        <div className="ex-auth-dashboard-mark mx-auto overflow-hidden"><img src={AUTH_LOGO} alt="Logo Money Tracking" className="h-full w-full object-cover" /></div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[.2em] text-[#8ED3DF]">Money Tracking</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Menyiapkan dashboard Anda</h1>
        <div className="mx-auto mt-6 h-0.5 w-40 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 bg-[#8ED3DF]" style={{ animation: 'lineMove 1.4s ease-in-out infinite' }} /></div>
        <p className="mt-4 text-xs text-white/55">Memuat data dengan aman...</p>
      </div>
    </div>
  );
}