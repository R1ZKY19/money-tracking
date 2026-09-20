import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail, Lock, Loader2, Eye, EyeOff, ArrowRight,
  Shield, CheckCircle2, RefreshCw, KeyRound, User, Phone
} from "lucide-react";
import AuthTextField from "@/components/auth/AuthTextField";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import AuthLayout, { fieldStyle, primaryBtn, accentBtn } from "@/components/AuthLayout";

const COPY = {
  id: {
    title: "Buat Akun Baru", sub: "Isi data berikut untuk memulai",
    googleBtn: "Daftar dengan Google", orDivider: "atau daftar dengan email",
    emailLabel: "Email", passLabel: "Kata Sandi", confirmLabel: "Konfirmasi Kata Sandi",
    emailPlaceholder: "contoh@email.com", passPlaceholder: "Minimal 8 karakter", confirmPlaceholder: "Ulangi kata sandi",
    nameLabel: "Nama Lengkap", namePlaceholder: "Sesuai identitas Anda",
    phoneLabel: "Nomor WhatsApp", phonePlaceholder: "0812xxxxxxxx",
    phoneHint: "Nomor & nama ini dipakai untuk verifikasi saat lupa kata sandi.",
    agree: "Saya menyetujui penggunaan data saya untuk keperluan akun MONEY TRACKING.",
    nameRequired: "Nama lengkap minimal 3 karakter.",
    phoneRequired: "Nomor WhatsApp minimal 9 digit angka.",
    agreeRequired: "Anda harus menyetujui pernyataan di atas.",
    emailTaken: "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.",
    emailChecking: "Memeriksa email...",
    otpHint: "Kode OTP akan dikirim ke email Anda untuk verifikasi.",
    submitBtn: "Buat Akun & Kirim OTP", submitting: "Membuat Akun...",
    hasAccount: "Sudah punya akun?", loginLink: "Masuk di sini",
    passMatch: "✓ Kata sandi cocok", passMismatch: "✕ Kata sandi tidak cocok",
    notApproved: "Email Anda belum disetujui admin.",
    passTooShort: "Kata sandi minimal 6 karakter.", passNoMatch: "Kata sandi tidak cocok.",
    registerFail: "Pendaftaran gagal. Coba lagi.",
    otpTitle: "Verifikasi OTP", otpSentTo: "Kode 6 digit dikirim ke",
    verifyBtn: "Verifikasi & Masuk", verifying: "Memverifikasi...",
    noCode: "Tidak menerima kode?", resendBtn: "Kirim Ulang Kode",
    resendIn: "Kirim ulang dalam", back: "← Kembali & Ubah Email",
    weak: "Lemah", medium: "Sedang", strong: "Kuat",
    c1: "Min. 8 karakter", c2: "Huruf kapital", c3: "Angka",
    pendingApproval: "Akun berhasil dibuat! Akun Anda sedang menunggu persetujuan admin.",
  },
  en: {
    title: "Create New Account", sub: "Fill in the details to get started",
    googleBtn: "Sign up with Google", orDivider: "or sign up with email",
    emailLabel: "Email", passLabel: "Password", confirmLabel: "Confirm Password",
    emailPlaceholder: "example@email.com", passPlaceholder: "At least 8 characters", confirmPlaceholder: "Repeat password",
    nameLabel: "Full Name", namePlaceholder: "As on your ID",
    phoneLabel: "WhatsApp Number", phonePlaceholder: "0812xxxxxxxx",
    phoneHint: "Your name & number are used to verify you when resetting a password.",
    agree: "I agree to the use of my data for my MONEY TRACKING account.",
    nameRequired: "Full name must be at least 3 characters.",
    phoneRequired: "WhatsApp number must have at least 9 digits.",
    agreeRequired: "You must accept the statement above.",
    emailTaken: "This email is already registered. Please sign in or use another email.",
    emailChecking: "Checking email...",
    otpHint: "An OTP code will be sent to your email for verification.",
    submitBtn: "Create Account & Send OTP", submitting: "Creating Account...",
    hasAccount: "Already have an account?", loginLink: "Sign in here",
    passMatch: "✓ Passwords match", passMismatch: "✕ Passwords do not match",
    notApproved: "Your email has not been approved by admin.",
    passTooShort: "Password must be at least 6 characters.", passNoMatch: "Passwords do not match.",
    registerFail: "Registration failed. Please try again.",
    otpTitle: "OTP Verification", otpSentTo: "6-digit code sent to",
    verifyBtn: "Verify & Sign In", verifying: "Verifying...",
    noCode: "Didn't receive the code?", resendBtn: "Resend Code",
    resendIn: "Resend in", back: "← Back & Change Email",
    weak: "Weak", medium: "Medium", strong: "Strong",
    c1: "Min. 8 chars", c2: "Uppercase", c3: "Number",
    pendingApproval: "Account created! Your account is pending admin approval.",
  }
};

function PasswordStrength({ password, c }) {
  const checks = [
    { label: c.c1, ok: password.length >= 8 },
    { label: c.c2, ok: /[A-Z]/.test(password) },
    { label: c.c3, ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(x => x.ok).length;
  const colors = ["#EF4444", "#F59E0B", "#22C55E"];
  const labels = [c.weak, c.medium, c.strong];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : "#E5E7EB" }} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {checks.map((ch, i) => (
            <span key={i} className="text-[10px]" style={{ color: ch.ok ? "#16A34A" : "#9CA3AF" }}>
              {ch.ok ? "✓" : "○"} {ch.label}
            </span>
          ))}
        </div>
        {score > 0 && <span className="text-[10px] font-bold" style={{ color: colors[score - 1] }}>{labels[score - 1]}</span>}
      </div>
    </div>
  );
}

export default function Register() {
  const { checkUserAuth } = useAuth();
  const { language } = useLanguage();
  const c = COPY[language] || COPY.id;

  const [fullName, setFullName]               = useState("");
  const [phone, setPhone]                     = useState("");
  const [agree, setAgree]                     = useState(false);
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]               = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [showOtp, setShowOtp]                 = useState(false);
  const [otpCode, setOtpCode]                 = useState("");
  const [resendCooldown, setResendCooldown]   = useState(0);
  const [focusEmail, setFocusEmail]           = useState(false);
  const [focusPass, setFocusPass]             = useState(false);
  const [focusConfirm, setFocusConfirm]       = useState(false);
  const [pendingUserId, setPendingUserId]     = useState(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (fullName.trim().length < 3) { setError(c.nameRequired); return; }
    if (phone.replace(/\D/g, '').length < 9) { setError(c.phoneRequired); return; }
    if (password !== confirmPassword) { setError(c.passNoMatch); return; }
    if (password.length < 6) { setError(c.passTooShort); return; }
    if (!agree) { setError(c.agreeRequired); return; }
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Daftar dengan Supabase — kirim OTP otomatis via email
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          setError(c.emailTaken);
        } else {
          setError(signUpError.message || c.registerFail);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        setPendingUserId(data.user.id);
        // Simpan profil awal ke tabel profiles (is_approved = false saat menunggu admin)
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: 'user',
          is_approved: false,
        }, { onConflict: 'id' });
      }

      setShowOtp(true);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || c.registerFail);
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setError(""); setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      // Verifikasi OTP dengan Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otpCode,
        type: 'signup',
      });

      if (verifyError) {
        setError(verifyError.message || (language === 'en' ? "Invalid OTP code." : "Kode OTP tidak valid."));
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Update profil dengan data lengkap
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: 'user',
          is_approved: false, // Tetap false sampai admin approve
        }, { onConflict: 'id' });
      }

      // Langsung redirect ke halaman menunggu approval
      window.location.href = "/";
    } catch (err) {
      setError(err.message || (language === 'en' ? "Invalid OTP code." : "Kode OTP tidak valid."));
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (resendError) throw resendError;
      setResendCooldown(60);
      setOtpCode("");
    }
    catch (err) { setError(err.message || (language === 'en' ? "Failed to resend code." : "Gagal mengirim ulang kode.")); }
  };

  const handleGoogle = () => { window.location.href = '/google-belum-tersedia'; };
  const passMatch    = confirmPassword && password === confirmPassword;
  const passMismatch = confirmPassword && password !== confirmPassword;

  const illustrationTitle = language === 'en' ? "Start Your Financial Journey" : "Mulai Perjalanan Finansialmu";
  const illustrationSub   = language === 'en' ? "Free registration, no hidden fees" : "Daftar gratis, tanpa biaya tersembunyi";

  return (
    <AuthLayout illustrationTitle={illustrationTitle} illustrationSub={illustrationSub}>
      <div className="ex-auth-head">
        <p className="ex-auth-eyebrow">MONEY TRACKING</p>
        <h2>{c.title}</h2>
        <p>{c.sub}</p>
      </div>

      <button onClick={handleGoogle} disabled={loading} className="ex-auth-google">
        <GoogleIcon className="w-5 h-5" />
        {c.googleBtn}
      </button>

      <div className="ex-auth-divider"><i /><span>{c.orDivider}</span><i /></div>

      {error && (
        <div className="ex-auth-error"><span>⚠</span> {error}</div>
      )}

      <form onSubmit={handleSubmit} className="ex-auth-form">
        <AuthTextField id="reg-name" label={c.nameLabel} icon={User} type="text" autoComplete="name" autoFocus
          placeholder={c.namePlaceholder} value={fullName} onChange={e => setFullName(e.target.value)} required minLength={3} />
        <AuthTextField id="reg-phone" label={c.phoneLabel} icon={Phone} type="tel" inputMode="numeric" autoComplete="tel"
          placeholder={c.phonePlaceholder} value={phone} onChange={e => setPhone(e.target.value)} required hint={c.phoneHint} />
        <div className="ex-auth-field">
          <Label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest mb-1.5 block">{c.emailLabel}</Label>
          <div className="ex-auth-input">
            <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusEmail ? 'text-blue-600' : 'text-gray-300'}`} />
            <Input type="email" autoComplete="email" placeholder={c.emailPlaceholder}
              value={email} onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusEmail(true)} onBlur={() => setFocusEmail(false)}
              className="pl-10 h-11 rounded-xl text-sm transition-all"
              style={fieldStyle(focusEmail)} required />
          </div>
        </div>

        <div className="ex-auth-field">
          <Label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest mb-1.5 block">{c.passLabel}</Label>
          <div className="ex-auth-input">
            <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusPass ? 'text-blue-600' : 'text-gray-300'}`} />
            <Input type={showPass ? "text" : "password"} autoComplete="new-password" placeholder={c.passPlaceholder}
              value={password} onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusPass(true)} onBlur={() => setFocusPass(false)}
              className="pl-10 pr-11 h-11 rounded-xl text-sm transition-all"
              style={fieldStyle(focusPass)} required />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="ex-auth-toggle">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <PasswordStrength password={password} c={c} />
        </div>

        <div className="ex-auth-field">
          <Label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest mb-1.5 block">{c.confirmLabel}</Label>
          <div className="ex-auth-input">
            <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusConfirm ? 'text-blue-600' : 'text-gray-300'}`} />
            <Input type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder={c.confirmPlaceholder}
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusConfirm(true)} onBlur={() => setFocusConfirm(false)}
              className="pl-10 pr-11 h-11 rounded-xl text-sm transition-all"
              style={{
                borderColor: passMismatch ? '#EF4444' : passMatch ? '#22C55E' : focusConfirm ? '#1976D2' : '#E5E7EB',
                boxShadow: focusConfirm ? '0 0 0 3px rgba(25,118,210,0.12)' : 'none',
                background: passMismatch ? '#FFF5F5' : passMatch ? '#F0FDF4' : '#F9FAFB',
              }} required />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {passMatch && <CheckCircle2 size={13} className="text-green-500" />}
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {passMismatch && <p className="text-[11px] text-red-500 mt-1">{c.passMismatch}</p>}
          {passMatch    && <p className="text-[11px] text-green-600 mt-1">{c.passMatch}</p>}
        </div>

        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-500">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600" />
          <span>{c.agree}</span>
        </label>

        <div className="ex-auth-hint">
          <Shield size={13} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-blue-600 text-xs leading-relaxed">{c.otpHint}</p>
        </div>

        <button type="submit" disabled={loading} className={`ex-auth-primary ${loading ? 'ex-auth-loading' : ''}`}>
          {loading
            ? <><Loader2 size={15} className="animate-spin" />{c.submitting}</>
            : <><ArrowRight size={15} />{c.submitBtn}</>}
        </button>
      </form>

      <p className="ex-auth-switch">
        {c.hasAccount}{' '}
        <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">{c.loginLink}</Link>
      </p>

      {/* OTP Modal */}
      {showOtp && (
        <div className="ex-auth-otp-backdrop">
          <div className="ex-auth-otp">
            <div className="ex-auth-otp-icon">
              <KeyRound size={28} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">{c.otpTitle}</h3>
            <p className="text-gray-400 text-sm mb-1">{c.otpSentTo}</p>
            <p className="font-bold text-gray-800 text-sm mb-6">{email}</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
                style={{ animation: 'shake 0.35s ease' }}>
                <span>⚠</span> {error}
              </div>
            )}

            <div className="ex-auth-otp-slots">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                <InputOTPGroup className="gap-2">
                  {[0,1,2,3,4,5].map(i => (
                    <InputOTPSlot key={i} index={i}
                      className="w-10 h-12 text-lg font-bold rounded-xl border-2 transition-all"
                      style={{ borderColor: otpCode.length > i ? '#1976D2' : '#E5E7EB' }} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button onClick={handleVerify} disabled={loading || otpCode.length < 6} className="ex-auth-primary">
              {loading
                ? <><Loader2 size={15} className="animate-spin" />{c.verifying}</>
                : <><CheckCircle2 size={15} />{c.verifyBtn}</>}
            </button>

            <p className="text-gray-400 text-sm mb-2">{c.noCode}</p>
            <button onClick={handleResend} disabled={resendCooldown > 0}
              className="ex-auth-resend">
              <RefreshCw size={13} />
              {resendCooldown > 0 ? `${c.resendIn} ${resendCooldown}s` : c.resendBtn}
            </button>

            <button onClick={() => { setShowOtp(false); setOtpCode(""); setError(""); }}
              className="ex-auth-back">
              {c.back}
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}