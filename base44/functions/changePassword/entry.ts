import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Satu-satunya jalur aman ganti password:
// verifikasi password lama di server -> baru update password.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const currentPassword = String(body?.currentPassword || '');
    const newPassword = String(body?.newPassword || '');
    const confirmPassword = String(body?.confirmPassword || '');

    if (!currentPassword) return Response.json({ error: 'Kata sandi saat ini wajib diisi.' }, { status: 400 });
    if (newPassword.length < 6) return Response.json({ error: 'Kata sandi baru minimal 6 karakter.' }, { status: 400 });
    if (newPassword !== confirmPassword) return Response.json({ error: 'Konfirmasi kata sandi tidak cocok.' }, { status: 400 });
    if (newPassword === currentPassword) return Response.json({ error: 'Kata sandi baru harus berbeda dari yang lama.' }, { status: 400 });

    const appId = secrets.get('BASE44_APP_ID');
    const loginRes = await fetch(`https://base44.app/api/apps/${appId}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: currentPassword }),
    });

    if (!loginRes.ok) {
      console.error('changePassword verify failed', loginRes.status);
      return Response.json({ error: 'Kata sandi saat ini salah. Kata sandi tidak diubah.' }, { status: 403 });
    }
    const loginData = await loginRes.json().catch(() => ({}));
    if (!loginData?.access_token) {
      return Response.json({ error: 'Kata sandi saat ini salah. Kata sandi tidak diubah.' }, { status: 403 });
    }

    await base44.auth.updateMe({ password: newPassword });
    return Response.json({ success: true });
  } catch (error) {
    console.error('changePassword failed', error);
    return Response.json({ error: error?.message || 'Gagal mengubah kata sandi.' }, { status: 500 });
  }
}