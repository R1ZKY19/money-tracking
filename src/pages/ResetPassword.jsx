import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, Eye, EyeOff, ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import AuthLayout, { fieldStyle, primaryBtn } from "@/components/AuthLayout";

const COPY = {
  id: {
    title: "Buat Kata Sandi Baru",
    sub: "Masukkan kata sandi baru yang kuat untuk akun Anda.",
    passLabel: "Kata Sandi Baru", confirmLabel: "Konfirmasi Kata Sandi",
    passPlaceholder: "••••••••", confirmPlaceholder: "••••••••",
    submitBtn: "Simpan Kata Sandi Baru", saving: "Menyimpan...",
    passMatch: "✓ Kata sandi cocok", passMismatch: "✕ Kata sandi tidak cocok",
    passNoMatch: "Kata sandi tidak cocok.", passTooShort: "Kata sandi minimal 6 karakter.",
    saveFail: "Gagal mereset kata sandi. Silakan minta link baru.",
    tokenUsed: "⚠ Token ini sudah pernah digunakan",
    invalidTitle: "Link Tidak Valid",
    invalidDesc: "Link reset ini tidak lengkap atau sudah kedaluwarsa.",
    newLinkBtn: "Minta Link Baru",
    successTitle: "Kata Sandi Diperbarui!",
    successDesc: "Kata sandi Anda berhasil diubah. Masuk dengan kata sandi baru.",
    loginBtn: "Masuk Sekarang",
    securityNote: "Kata sandi baru langsung aktif setelah tersimpan",
    weak: "Lemah", medium: "Sedang", strong: "Kuat",
    c1: "Min. 8 karakter", c2: "Huruf kapital", c3: "Angka",
  },
  en: {
    title: "Create New Password",
    sub: "Enter a strong new password for your account.",
    passLabel: "New Password", confirmLabel: "Confirm Password",
    passPlaceholder: "••••••••", confirmPlaceholder: "••••••••",
    submitBtn: "Save New Password", saving: "Saving...",
    passMatch: "✓ Passwords match", passMismatch: "✕ Passwords do not match",
    passNoMatch: "Passwords do not match.", passTooShort: "Password must be at least 6 characters.",
    saveFail: "Failed to reset password. Please request a new link.",
    tokenUsed: "⚠ This token has already been used",
    invalidTitle: "Invalid Link",
    invalidDesc: "This reset link is incomplete or has expired.",
    newLinkBtn: "Request New Link",
    successTitle: "Password Updated!",
    successDesc: "Your password has been changed. Sign in with your new password.",
    loginBtn: "Sign In Now",
    securityNote: "New password is active immediately after saving",
    weak: "Weak", medium: "Medium", strong: "Strong",
    c1: "Min. 8 chars", c2: "Uppercase", c3: "Number",
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
        <div className="flex gap-3 flex-wrap">
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const { language } = useLanguage();
  const c = COPY[language] || COPY.id;

  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]               = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);
  const [focusPass, setFocusPass]             = useState(false);
  const [focusConfirm, setFocusConfirm]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError(c.passNoMatch); return; }
    if (newPassword.length < 6) { setError(c.passTooShort); return; }
    setLoading(true);
    try {
      // Supabase otomatis menangani token dari URL (PKCE flow)
      // saat user klik link di email, session sudah di-set otomatis
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) {
        const msg = updateErr.message || "";
        setError(msg.toLowerCase().includes("token") ? c.tokenUsed : msg || c.saveFail);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => { window.location.href = '/login'; }, 2500);
    } catch (err) {
      const msg = err.message || "";
      setError(msg.toLowerCase().includes("not found") ? c.tokenUsed : msg || c.saveFail);
    } finally { setLoading(false); }
  };

  const passMatch    = confirmPassword && newPassword === confirmPassword;
  const passMismatch = confirmPassword && newPassword !== confirmPassword;

  const illustrationTitle = language === 'en' ? "Create New Password" : "Buat Kata Sandi Baru";
  const illustrationSub   = language === 'en' ? "Use letters, numbers & symbols" : "Gunakan kombinasi huruf, angka & simbol";

  return (
    <AuthLayout illustrationTitle={illustrationTitle} illustrationSub={illustrationSub}>
      {!resetToken ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: '#FEF2F2', border: '2px solid #FECACA' }}>
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">{c.invalidTitle}</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{c.invalidDesc}</p>
          <Link to="/forgot-password">
            <button className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
              style={primaryBtn}>
              {c.newLinkBtn} <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      ) : success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: '#F0FDF4', border: '2px solid #86EFAC' }}>
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{c.successTitle}</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{c.successDesc}</p>
          <Link to="/login">
            <button className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
              style={primaryBtn}>
              {c.loginBtn} <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-[26px] font-black text-gray-900 mb-1">{c.title}</h2>
            <p className="text-gray-400 text-sm">{c.sub}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2"
              style={{ animation: 'shake 0.35s ease' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest mb-1.5 block">{c.passLabel}</Label>
              <div className="relative">
                <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusPass ? 'text-blue-600' : 'text-gray-300'}`} />
                <Input type={showPass ? "text" : "password"} autoComplete="new-password" autoFocus placeholder={c.passPlaceholder}
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  onFocus={() => setFocusPass(true)} onBlur={() => setFocusPass(false)}
                  className="pl-10 pr-11 h-11 rounded-xl text-sm transition-all"
                  style={fieldStyle(focusPass)} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordStrength password={newPassword} c={c} />
            </div>

            <div>
              <Label className="text-gray-500 text-[11px] font-semibold uppercase tracking-widest mb-1.5 block">{c.confirmLabel}</Label>
              <div className="relative">
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

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={primaryBtn}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" />{c.saving}</>
                : <>{c.submitBtn} <ArrowRight size={14} /></>}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-gray-100">
            <Shield size={11} className="text-gray-300" />
            <p className="text-gray-300 text-[11px] tracking-wide">{c.securityNote}</p>
          </div>
        </>
      )}
    </AuthLayout>
  );
}