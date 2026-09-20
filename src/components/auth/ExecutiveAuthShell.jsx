import '@/components/auth/executive-auth.css';

const AUTH_LOGO = 'https://media.base44.com/images/public/6a2817e4a27a25c626d7a995/628dd9086_image.png';

export default function ExecutiveAuthShell({ children, mode = 'login', english = false }) {
  const register = mode === 'register';
  const title = register
    ? (english ? 'Start your financial journey.' : 'Mulai perjalanan finansialmu.')
    : (english ? 'Welcome back.' : 'Selamat datang kembali.');
  const description = register
    ? (english ? 'Build stronger financial habits with clear, consistent records.' : 'Bangun kebiasaan keuangan yang lebih kuat melalui catatan yang jelas dan konsisten.')
    : (english ? 'Every record is a step toward clearer, stronger finances.' : 'Setiap catatan adalah langkah menuju keuangan yang lebih terarah. Konsistensi hari ini membangun masa depan yang lebih kuat.');

  return (
    <main className="enterprise-login ex-auth-page">
      <div className="ex-auth-shell">
        <aside className="ex-auth-welcome">
          <div className="ex-auth-brand"><span className="ex-auth-brand-mark"><img src={AUTH_LOGO} alt="Logo Money Tracking" /></span>MONEY TRACKING</div>
          <div className="ex-auth-welcome-copy">
            <p className="ex-auth-eyebrow">{english ? 'SMALL STEPS, A STRONGER FUTURE' : 'LANGKAH KECIL, MASA DEPAN LEBIH BAIK'}</p>
            <h1>{title}</h1><p>{description}</p>
            <div className="ex-auth-metrics"><div className="ex-auth-metric-grid"><div className="ex-auth-metric"><strong>01</strong><span>{english ? 'Record every income' : 'Catat setiap pemasukan'}<small>{english ? 'Value every result of your hard work.' : 'Hargai hasil kerja keras, sekecil apa pun nilainya.'}</small></span></div><div className="ex-auth-metric"><strong>02</strong><span>{english ? 'Know every expense' : 'Kenali setiap pengeluaran'}<small>{english ? 'Manage consciously and prioritize what matters.' : 'Kelola dengan sadar, prioritaskan yang berarti.'}</small></span></div></div><div className="ex-auth-chart"><svg viewBox="0 0 600 130" preserveAspectRatio="none"><path d="M0 108 C60 96 72 103 120 81 S190 96 235 62 S302 77 350 48 S420 70 470 29 S540 52 600 12" /><path className="fill" d="M0 108 C60 96 72 103 120 81 S190 96 235 62 S302 77 350 48 S420 70 470 29 S540 52 600 12V130H0Z" /></svg></div></div>
          </div>
          <p className="ex-auth-foot">{english ? 'Small steps. Clear records. Stronger finances.' : 'Langkah kecil. Catatan rapi. Keuangan lebih kuat.'}</p>
        </aside>
        <section className="ex-auth-form-column"><div className={`ex-auth-card ${register ? 'ex-auth-register-card' : ''}`}>{children}</div><p className="ex-auth-copyright">© {new Date().getFullYear()} MONEY TRACKING · {english ? 'Personal Finance Manager' : 'Manajer Keuangan Pribadi'}</p></section>
      </div>
    </main>
  );
}