import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Blokir sementara akun setelah 3x gagal login berturut-turut.
const LOCK_AFTER = 3;
const LOCK_MINUTES = 15;
const SUPER_MASTER_EMAIL = 'rizkykucuk19@gmail.com';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');
    const email = String(body.email || '').toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Email tidak valid' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    // Kunci login diikat ke kombinasi email + alamat IP pemanggil, sehingga pihak lain
    // tidak bisa mengunci akun orang dari jarak jauh (dan tidak bisa mengintip status akun lain).
    const callerIp = String(req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 60);
    const lockKey = `${email}|${callerIp}`;

    // 'reset' hanya boleh oleh pemilik akun yang sudah berhasil login (atau admin) —
    // kalau tidak, penyerang bisa menghapus hitungan gagal dan menembus proteksi brute-force.
    if (action === 'reset') {
      const caller = await base44.auth.me().catch(() => null);
      const callerEmail = String(caller?.email || '').toLowerCase();
      if (!caller || (callerEmail !== email && caller.role !== 'admin')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Batasi jumlah laporan 'fail' per alamat IP agar tidak dipakai mengunci akun orang lain massal.
    if (action === 'fail') {
      const ipKey = `ip:${callerIp}`;
      const ipRows = await svc.entities.SecurityThrottle.filter({ user_id: ipKey, action: 'login_ip' });
      const ipRow = ipRows?.[0] || null;
      const nowTs = new Date();
      const windowFresh = ipRow?.window_start && (nowTs - new Date(ipRow.window_start)) < 3600000;
      const ipCount = windowFresh ? (ipRow.count || 0) : 0;
      if (ipCount >= 15) {
        return Response.json({ locked: false, throttled: true });
      }
      if (ipRow) {
        await svc.entities.SecurityThrottle.update(ipRow.id, {
          count: ipCount + 1,
          window_start: windowFresh ? ipRow.window_start : nowTs.toISOString(),
          last_failed_at: nowTs.toISOString(),
        });
      } else {
        await svc.entities.SecurityThrottle.create({
          user_id: ipKey,
          action: 'login_ip',
          window_start: nowTs.toISOString(),
          count: 1,
          last_failed_at: nowTs.toISOString(),
        });
      }
    }

    const existing = await svc.entities.SecurityThrottle.filter({ user_id: lockKey, action: 'login' });
    const record = existing?.[0] || null;
    const now = new Date();
    const isLocked = record?.cooldown_until && new Date(record.cooldown_until) > now;

    if (action === 'status') {
      return Response.json(isLocked ? { locked: true, until: record.cooldown_until } : { locked: false });
    }

    if (action === 'fail') {
      if (isLocked) {
        return Response.json({ locked: true, until: record.cooldown_until });
      }
      const nextCount = (record?.count || 0) + 1;
      if (nextCount >= LOCK_AFTER) {
        const cooldownUntil = new Date(now.getTime() + LOCK_MINUTES * 60000).toISOString();
        if (record) {
          await svc.entities.SecurityThrottle.update(record.id, {
            count: 0,
            cooldown_until: cooldownUntil,
            last_failed_at: now.toISOString(),
            level: (record.level || 0) + 1,
          });
        } else {
          await svc.entities.SecurityThrottle.create({
            user_id: lockKey,
            action: 'login',
            window_start: now.toISOString(),
            count: 0,
            cooldown_until: cooldownUntil,
            last_failed_at: now.toISOString(),
            level: 1,
          });
        }
        await svc.entities.LoginRequest.create({
          email,
          status: 'rejected',
          attempted_at: now.toISOString(),
          attempts: nextCount,
          user_agent: String(req.headers.get('user-agent') || '').slice(0, 300),
        }).catch((e) => console.error('[loginLockGuard] LoginRequest log failed:', e.message));
        await svc.entities.AppNotification.create({
          title: 'Login diblokir sementara',
          message: `${email} gagal login 3x berturut-turut dan diblokir selama ${LOCK_MINUTES} menit.`,
          type: 'login_request',
          target_email: SUPER_MASTER_EMAIL,
          link: '/pengaturan',
        }).catch((e) => console.error('[loginLockGuard] Notification failed:', e.message));
        // Informasikan juga ke thread Konsultasi pengguna agar terlihat & bisa ditindaklanjuti AI/Admin.
        await svc.entities.ConsultationMessage.create({
          thread_email: email,
          sender_role: 'admin',
          sender_email: SUPER_MASTER_EMAIL,
          sender_name: 'AI MONEY.T (Balasan Otomatis)',
          is_ai: true,
          message: `Halo, akun ${email} baru saja terkunci sementara karena 3x gagal login berturut-turut. Akses login akan otomatis terbuka lagi dalam ${LOCK_MINUTES} menit. Kalau itu bukan Anda yang mencoba login, atau butuh bantuan lebih cepat, langsung balas di sini ya — Admin akan bantu cek.`,
        }).catch((e) => console.error('[loginLockGuard] Consultation message failed:', e.message));
        return Response.json({ locked: true, until: cooldownUntil });
      }
      if (record) {
        await svc.entities.SecurityThrottle.update(record.id, { count: nextCount, last_failed_at: now.toISOString() });
      } else {
        await svc.entities.SecurityThrottle.create({
          user_id: lockKey,
          action: 'login',
          window_start: now.toISOString(),
          count: nextCount,
          last_failed_at: now.toISOString(),
        });
      }
      return Response.json({ locked: false, remaining: LOCK_AFTER - nextCount });
    }

    if (action === 'reset') {
      if (record) await svc.entities.SecurityThrottle.update(record.id, { count: 0, cooldown_until: null });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error) {
    console.error('[loginLockGuard] Fatal error:', error.message);
    return Response.json({ error: 'Gagal memproses' }, { status: 500 });
  }
}