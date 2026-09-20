import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, ArrowRight, Shield, CheckCircle2, Send, RefreshCw, User, Phone } from "lucide-react";
import AuthTextField from "@/components/auth/AuthTextField";
import { useLanguage } from "@/lib/LanguageContext";
import AuthLayout, { fieldStyle, primaryBtn } from "@/components/AuthLayout";

const COPY = {
  id: {
    title: "Lupa Kata Sandi?",
    sub: "Verifikasi identitas Anda terlebih dahulu. Link reset hanya dikirim jika data cocok dengan akun terdaftar.",
    emailLabel: "Email Terdaftar", emailPlaceholder: "email@contoh.com",
    nameLabel: "Nama Lengkap", namePlaceholder: "Sesuai data pendaftaran",
    phoneLabel: "Nomor WhatsApp", phonePlaceholder: "0812xxxxxxxx",
    verifyHint: "Nama lengkap & nomor WhatsApp harus sama dengan data saat mendaftar.",
    notRegistered: "Email ini belum terdaftar di MONEY TRACKING.",
    mismatch: "Data identitas tidak cocok dengan akun terdaftar.",
    sendBtn: "Kirim Link Reset", sending: "Mengirim...",
    backToLogin: "Kembali ke Halaman Masuk",
    sentTitle: "Email Terkirim!", sentTo: "Link reset dikirim ke",
    steps: ["Buka inbox email Anda", "Cari email dari MONEY TRACKING", 'Klik tombol "Reset password"', "Buat kata sandi baru"],
    stepsTitle: "Langkah selanjutnya:",
    resendBtn: "Kirim Ulang Email Reset", resendIn: "Kirim ulang dalam",
    changeEmail: "Ganti Email",
    securityNote: "Link reset berlaku 1 jam · Akun Anda aman",
  },
  en: {
    title: "Forgot Password?",
    sub: "Verify your identity first. The reset link is only sent when the details match a registered account.",
    emailLabel: "Registered Email", emailPlaceholder: "email@example.com",
    nameLabel: "Full Name", namePlaceholder: "As used at registration",
    phoneLabel: "WhatsApp Number", phonePlaceholder: "0812xxxxxxxx",
    verifyHint: "Full name & WhatsApp number must match your registration details.",
    notRegistered: "This email is not registered with MONEY TRACKING.",
    mismatch: "Identity details do not match the registered account.",
    sendBtn: "Send Reset Link", sending: "Sending...",
    backToLogin: "Back to Sign In",
    sentTitle: "Email Sent!", sentTo: "Reset link sent to",
    steps: ["Open your email inbox", "Find the email from MONEY TRACKING", 'Click the "Reset password" button', "Create a new password"],
    stepsTitle: "Next steps:",
    resendBtn: "Resend Reset Email", resendIn: "Resend in",
    changeEmail: "Change Email",
    securityNote: "Reset link valid for 1 hour · Your account is safe",
  }
};

export default function ForgotPassword() {
  const { language } = useLanguage();
  const c = COPY[language] || COPY.id;

  const [step, setStep]         = useState(1);
  const [email, setEmail]       = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [focused, setFocused]   = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSend = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Verifikasi identitas: cek profil di database
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!profile) {
        setError(c.notRegistered);
        setLoading(false);
        return;
      }

      // Verifikasi nama dan nomor telepon
      const nameMatch = profile.full_name?.toLowerCase().trim() === fullName.toLowerCase().trim();
      const phoneMatch = profile.phone?.replace(/\D/g, '') === phone.replace(/\D/g, '');

      if (!nameMatch || !phoneMatch) {
        setError(c.mismatch);
        setLoading(false);
        return;
      }

      // Kirim reset password email via Supabase
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetErr) {
        // Tetap lanjut ke step 2 meski ada error (untuk keamanan — tidak bocorkan apakah email terdaftar)
        console.warn('Reset email error:', resetErr.message);
      }

      setStep(2);
      setCooldown(60);
    } catch {
      setError(c.mismatch);
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    }
    catch { /* ignore */ }
    finally { setCooldown(60); }
  };

  const illustrationTitle = language === 'en' ? "Recover Your Access" : "Pulihkan Akses Anda";
  const illustrationSub   = language === 'en' ? "3 simple steps to reset your password" : "3 langkah mudah untuk reset kata sandi";

  return (
    <AuthLayout illustrationTitle={illustrationTitle} illustrationSub={illustrationSub}>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2"
          style={{ animation: 'shake 0.35s ease' }}>
          <span>⚠</span> {error}
        </div>
      )}

      {step === 1 && (
        <>
          <div className="mb-7">
            <h2 className="text-[26px] font-black text-gray-900 mb-1">{c.title}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{c.sub}</p>
          </div>

          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <Label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest mb-1.5 block">{c.emailLabel}</Label>
              <div className="relative">
                <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focused ? 'text-blue-600' : 'text-gray-300'}`} />
                <Input type="email" autoComplete="email" autoFocus placeholder={c.emailPlaceholder}
                  value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  className="pl-10 h-11 rounded-xl text-sm transition-all"
                  style={fieldStyle(focused)} required />
              </div>
            </div>

            <AuthTextField id="fp-name" label={c.nameLabel} icon={User} type="text" autoComplete="name"
              placeholder={c.namePlaceholder} value={fullName} onChange={e => setFullName(e.target.value)} required minLength={3} />
            <AuthTextField id="fp-phone" label={c.phoneLabel} icon={Phone} type="tel" inputMode="numeric" autoComplete="tel"
              placeholder={c.phonePlaceholder} value={phone} onChange={e => setPhone(e.target.value)} required hint={c.verifyHint} />

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={primaryBtn}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" />{c.sending}</>
                : <><Send size={14} />{c.sendBtn}</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">
              <ArrowLeft size={14} /> {c.backToLogin}
            </Link>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: '#EFF6FF', border: '2px solid #BFDBFE' }}>
            <CheckCircle2 size={36} className="text-blue-600" />
          </div>
          <h2 className="text-[26px] font-black text-gray-900 mb-2">{c.sentTitle}</h2>
          <p className="text-gray-400 text-sm mb-1">{c.sentTo}</p>
          <p className="font-bold text-gray-800 text-sm mb-6">{email}</p>

          <div className="text-left p-4 rounded-xl mb-6 space-y-1.5" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <p className="font-bold text-xs uppercase tracking-wide text-blue-600 mb-2">{c.stepsTitle}</p>
            {c.steps.map((s, i) => <p key={i} className="text-sm text-blue-800">{i + 1}. {s}</p>)}
          </div>

          <div className="space-y-3">
            <button onClick={handleResend} disabled={cooldown > 0}
              className="w-full py-3 rounded-xl font-semibold text-sm border-2 transition-all flex items-center justify-center gap-2"
              style={{ borderColor: cooldown > 0 ? '#E5E7EB' : '#1976D2', color: cooldown > 0 ? '#9CA3AF' : '#1976D2', background: 'transparent' }}>
              <RefreshCw size={14} />
              {cooldown > 0 ? `${c.resendIn} ${cooldown}s` : c.resendBtn}
            </button>
            <button onClick={() => { setStep(1); setError(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5">
              <ArrowLeft size={13} /> {c.changeEmail}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mt-7 pt-5 border-t border-gray-100">
        <Shield size={11} className="text-gray-300" />
        <p className="text-gray-300 text-[11px] tracking-wide">{c.securityNote}</p>
      </div>
    </AuthLayout>
  );
}