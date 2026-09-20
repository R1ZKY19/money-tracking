import { supabase } from '@/api/supabaseClient';

/**
 * Satu-satunya jalur ganti password di aplikasi.
 * Verifikasi dilakukan oleh Supabase auth.
 */
export async function changePasswordSecure({ currentPassword, newPassword, confirmPassword }) {
  try {
    if (!newPassword || !confirmPassword) {
      return { ok: false, error: 'Password baru tidak boleh kosong.' };
    }
    if (newPassword !== confirmPassword) {
      return { ok: false, error: 'Konfirmasi kata sandi tidak cocok.' };
    }
    if (newPassword.length < 6) {
      return { ok: false, error: 'Kata sandi baru minimal 6 karakter.' };
    }

    // Re-autentikasi dulu dengan password lama untuk memverifikasi
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return { ok: false, error: 'Sesi tidak valid. Silakan login ulang.' };

    // Verifikasi password lama dengan mencoba sign-in ulang
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInErr) {
      return { ok: false, error: 'Kata sandi saat ini salah atau gagal diverifikasi. Kata sandi tidak diubah.' };
    }

    // Ganti password
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updateErr) {
      return { ok: false, error: updateErr.message || 'Gagal mengubah kata sandi.' };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || 'Kata sandi saat ini salah atau gagal diverifikasi. Kata sandi tidak diubah.',
    };
  }
}