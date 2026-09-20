import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { useLanguage } from "@/lib/LanguageContext";
import { logLogin } from "@/lib/activityLogger";
import { useAuth } from "@/lib/AuthContext";
import LoginLayout from '@/components/auth/LoginLayout';
import DemoEntryButton from '@/components/demo/DemoEntryButton';
import LockedAccountHelp from '@/components/auth/LockedAccountHelp';
import { safeReturnTo } from '@/lib/authReturnTo';

const COPY = {
  id: {
    title: "Masuk ke akun Anda",
    sub: "Masukkan email dan password untuk melanjutkan",
    googleBtn: "Masuk dengan Google",
    orDivider: "atau masuk dengan email",
    emailLabel: "Email",
    passLabel: "Kata Sandi",
    forgotLink: "Lupa kata sandi?",
    submitBtn: "Masuk ke dashboard",
    submitting: "Masuk...",
    noAccount: "Belum punya akun?",
    registerLink: "Daftar sekarang",
    adminNote: "Belum punya akses? Hubungi admin via",
    whatsapp: "WhatsApp",
    emailPlaceholder: "contoh@email.com",
    passPlaceholder: "Masukkan kata sandi",
  },
  en: {
    title: "Access Your Account",
    sub: "Enter your email and password to continue",
    googleBtn: "Sign in with Google",
    orDivider: "or sign in with email",
    emailLabel: "Email",
    passLabel: "Password",
    forgotLink: "Forgot password?",
    submitBtn: "Sign in to dashboard",
    submitting: "Signing in...",
    noAccount: "Don't have an account?",
    registerLink: "Register now",
    adminNote: "No access yet? Contact admin via",
    whatsapp: "WhatsApp",
    emailPlaceholder: "example@email.com",
    passPlaceholder: "Enter password",
  }
};

export default function Login() {
  const { language } = useLanguage();
  const c = COPY[language] || COPY.id;
  const { checkUserAuth } = useAuth();
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [focusEmail, setFocusEmail]   = useState(false);
  const [focusPass, setFocusPass]     = useState(false);
  const [lockedUntil, setLockedUntil] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    if (errorMsg) setError(decodeURIComponent(errorMsg));
  }, []);

  // Validasi tujuan redirect (same-origin saja) agar tidak bisa dipakai open redirect / javascript:.
  const getNextUrl = () => safeReturnTo('next');

  const lockMessage = (untilIso) => {
    const mins = Math.max(1, Math.ceil((new Date(untilIso) - new Date()) / 60000));
    return language === 'en'
      ? `Too many failed attempts. Try again in ${mins} minute(s).`
      : `Terlalu banyak percobaan gagal. Coba lagi dalam ${mins} menit.`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLockedUntil(""); setLoading(true);
    const emailTrimmed = email.trim().toLowerCase();
    try {
      if (!emailTrimmed || !password) {
        setError(language === 'en' ? "Email and password are required" : "Email dan password tidak boleh kosong");
        setLoading(false); return;
      }

      // Cek security throttle dari Supabase
      const { data: throttle } = await supabase
        .from('security_throttles')
        .select('*')
        .eq('user_id', emailTrimmed)
        .eq('action', 'login')
        .gte('window_start', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .order('window_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (throttle && throttle.count >= 5) {
        const lockedUntilTime = new Date(new Date(throttle.window_start).getTime() + 15 * 60 * 1000).toISOString();
        if (new Date(lockedUntilTime) > new Date()) {
          setError(lockMessage(lockedUntilTime));
          setLockedUntil(lockedUntilTime);
          setLoading(false); return;
        }
      }

      // Login dengan Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (signInError) {
        // Catat percobaan gagal
        await recordFailedAttempt(emailTrimmed);
        throw signInError;
      }

      // Reset throttle setelah login berhasil
      await supabase
        .from('security_throttles')
        .delete()
        .eq('user_id', emailTrimmed)
        .eq('action', 'login');

      await logLogin(emailTrimmed);
      await checkUserAuth();
      window.location.href = getNextUrl();
    } catch (err) {
      const msg = err.message || (language === 'en' ? "Invalid email or password" : "Email atau password salah");
      // Terjemahkan pesan error Supabase yang umum
      if (msg.includes('Invalid login credentials')) {
        setError(language === 'en' ? "Invalid email or password" : "Email atau password salah");
      } else if (msg.includes('Email not confirmed')) {
        setError(language === 'en' ? "Please verify your email first" : "Harap verifikasi email Anda terlebih dahulu");
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  };

  const recordFailedAttempt = async (email) => {
    try {
      const windowStart = new Date(Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from('security_throttles')
        .select('*')
        .eq('user_id', email)
        .eq('action', 'login')
        .eq('window_start', windowStart)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('security_throttles')
          .update({ count: existing.count + 1 })
          .eq('id', existing.id);
        
        if (existing.count + 1 >= 5) {
          const lockedUntilTime = new Date(new Date(windowStart).getTime() + 15 * 60 * 1000).toISOString();
          setLockedUntil(lockedUntilTime);
        }
      } else {
        await supabase
          .from('security_throttles')
          .insert({ user_id: email, action: 'login', window_start: windowStart, count: 1 });
      }
    } catch { /* silent */ }
  };

  const handleGoogle = () => { window.location.href = '/google-belum-tersedia'; };

  return (
    <LoginLayout english={language === 'en'}>
      <div className="ex-auth-head">
        <p className="ex-auth-eyebrow">MONEY TRACKING</p>
        <h2>{c.title}</h2>
        <p>{c.sub}</p>
      </div>
      <button type="button" onClick={handleGoogle} disabled={loading} className="ex-auth-google">
        <GoogleIcon />{c.googleBtn}
      </button>
      <div className="ex-auth-divider"><i /><span>{c.orDivider}</span><i /></div>
      {error && <div role="alert" className="ex-auth-error">{error}</div>}
      {lockedUntil && <LockedAccountHelp email={email.trim().toLowerCase()} lockedUntil={lockedUntil} />}
      <form onSubmit={handleSubmit} className="ex-auth-form">
        <div className="ex-auth-field">
          <Label htmlFor="login-email">{c.emailLabel}</Label>
          <div className="ex-auth-input">
            <Mail size={17} />
            <Input id="login-email" type="email" autoComplete="email" autoFocus placeholder={c.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocusEmail(true)} onBlur={() => setFocusEmail(false)} required />
          </div>
        </div>
        <div className="ex-auth-field">
          <div className="ex-auth-pass-row"><Label htmlFor="login-password">{c.passLabel}</Label><Link to="/forgot-password">{c.forgotLink}</Link></div>
          <div className="ex-auth-input">
            <Lock size={17} />
            <Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder={c.passPlaceholder} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusPass(true)} onBlur={() => setFocusPass(false)} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={language === 'en' ? (showPassword ? 'Hide password' : 'Show password') : (showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi')} aria-pressed={showPassword} className="ex-auth-toggle">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </div>
        <button type="submit" disabled={loading} className={`ex-auth-primary ${loading ? 'ex-auth-loading' : ''}`}>
          {loading ? <><Loader2 size={17} className="animate-spin" />{c.submitting}</> : <>{c.submitBtn}<ArrowRight size={17} /></>}
        </button>
      </form>
      <DemoEntryButton disabled={loading} english={language === 'en'} />
      <p className="ex-auth-switch">{c.noAccount}{' '}<Link to="/register">{c.registerLink}</Link></p>
      <div className="ex-auth-admin"><p>{c.adminNote}{' '}<a href="https://wa.me/6283812595110?text=Halo%20Admin%20MoneyTracking!" target="_blank" rel="noopener noreferrer">{c.whatsapp}</a></p></div>
    </LoginLayout>
  );
}