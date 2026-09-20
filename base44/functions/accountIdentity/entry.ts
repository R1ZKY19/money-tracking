import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const norm = (v) => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();
const digits = (v) => String(v || '').replace(/\D/g, '');

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const email = String(body.email || '').toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Email tidak valid' }, { status: 400 });
    }

    // Batasi percobaan anonim per alamat IP agar tidak bisa dipakai memetakan email terdaftar.
    if (action === 'checkEmail' || action === 'verifyForReset') {
      const ip = String(req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 60);
      const key = `identity:${ip}`;
      const rows = await base44.asServiceRole.entities.SecurityThrottle.filter({ user_id: key, action: 'identity' });
      const row = rows?.[0] || null;
      const now = new Date();
      const fresh = row?.window_start && (now - new Date(row.window_start)) < 3600000;
      const count = fresh ? (row.count || 0) : 0;
      if (count >= 10) {
        return Response.json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' }, { status: 429 });
      }
      if (row) {
        await base44.asServiceRole.entities.SecurityThrottle.update(row.id, {
          count: count + 1,
          window_start: fresh ? row.window_start : now.toISOString(),
          last_failed_at: now.toISOString(),
        });
      } else {
        await base44.asServiceRole.entities.SecurityThrottle.create({
          user_id: key, action: 'identity', window_start: now.toISOString(), count: 1, last_failed_at: now.toISOString(),
        });
      }
    }

    const users = await base44.asServiceRole.entities.User.filter({ email });
    const account = users?.[0] || null;

    // Cek email ganda sebelum pendaftaran
    if (action === 'checkEmail') {
      return Response.json({ registered: !!account });
    }

    // Verifikasi identitas sebelum kirim link reset kata sandi
    if (action === 'verifyForReset') {
      const fullName = norm(body.full_name);
      const phone = digits(body.phone);
      // Respons seragam: tidak membedakan "email belum terdaftar" dan "data tidak cocok".
      if (!account) return Response.json({ verified: false, reason: 'mismatch' });

      const nameOk = !!fullName && norm(account.full_name) === fullName;
      const storedPhone = digits(account.phone);
      // Akun lama yang belum menyimpan nomor WhatsApp cukup diverifikasi lewat nama lengkap.
      const phoneOk = storedPhone ? storedPhone.slice(-8) === phone.slice(-8) : true;
      if (!nameOk || !phoneOk) return Response.json({ verified: false, reason: 'mismatch' });

      return Response.json({ verified: true });
    }

    // Super Master melihat data lengkap member untuk membantu reset kata sandi
    if (action === 'adminMemberInfo') {
      const me = await base44.auth.me().catch(() => null);
      if (norm(me?.email) !== 'rizkykucuk19@gmail.com') {
        return Response.json({ error: 'Akses ditolak' }, { status: 403 });
      }
      if (!account) return Response.json({ found: false });

      const approvals = await base44.asServiceRole.entities.ApprovedUser.filter({ email });
      return Response.json({
        found: true,
        member: {
          id: account.id,
          email: account.email,
          full_name: account.full_name || '',
          phone: account.phone || '',
          created_date: account.created_date,
          role: approvals?.[0]?.role || 'staf',
          notes: approvals?.[0]?.notes || '',
          approved_at: approvals?.[0]?.approved_at || null,
        },
      });
    }

    return Response.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error) {
    console.error('[accountIdentity]', error.message);
    return Response.json({ error: 'Verifikasi gagal' }, { status: 500 });
  }
}