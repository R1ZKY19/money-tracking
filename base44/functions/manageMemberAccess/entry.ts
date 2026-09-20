import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const OWNER_EMAIL = 'rizkykucuk19@gmail.com';
const ROLES = ['none', 'staf', 'master_2', 'master_1', 'super_master'];

// Panel Super Master untuk Asisten AI: lihat member, ubah role, tambah / kunci member.
// Hanya Super Master (pemilik sistem) yang diizinkan memakai fungsi ini.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = (user.email || '').toLowerCase().trim();
    if (email !== OWNER_EMAIL) {
      return Response.json({ error: 'Hanya Super Master yang dapat mengelola akses member.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const svc = base44.asServiceRole;
    const target = (body.email || '').toLowerCase().trim();

    if (action === 'list_members') {
      const rows = await svc.entities.ApprovedUser.list('-created_date', 200);
      return Response.json({
        members: rows.map(r => ({
          email: r.email,
          role: r.role || 'none',
          locked: r.is_approved === false,
          notes: r.notes || '',
        })),
      });
    }

    if (!target || !target.includes('@')) {
      return Response.json({ error: 'Email member wajib diisi dan valid.' }, { status: 400 });
    }
    const existing = (await svc.entities.ApprovedUser.filter({ email: target }))[0] || null;

    if (action === 'set_role') {
      const role = String(body.role || '').toLowerCase();
      if (!ROLES.includes(role)) {
        return Response.json({ error: `Role tidak dikenal. Pilihan: ${ROLES.join(', ')}` }, { status: 400 });
      }
      if (target === OWNER_EMAIL) {
        return Response.json({ error: 'Role Super Master tidak dapat diubah.' }, { status: 400 });
      }
      if (!existing) return Response.json({ error: `${target} belum terdaftar. Tambahkan dulu dengan action add_member.` }, { status: 404 });
      await svc.entities.ApprovedUser.update(existing.id, { role, access_modules: [] });
      return Response.json({ ok: true, message: `Role ${target} diubah menjadi ${role}.` });
    }

    if (action === 'add_member') {
      const role = ROLES.includes(String(body.role || '').toLowerCase()) ? String(body.role).toLowerCase() : 'none';
      if (existing) return Response.json({ ok: true, message: `${target} sudah terdaftar dengan role ${existing.role || 'none'}.` });
      await svc.entities.ApprovedUser.create({
        email: target,
        role,
        is_approved: true,
        approved_at: new Date().toISOString(),
        notes: body.notes || 'Ditambahkan via Asisten AI',
      });
      return Response.json({ ok: true, message: `${target} ditambahkan sebagai ${role}.` });
    }

    if (action === 'set_lock') {
      if (target === OWNER_EMAIL) return Response.json({ error: 'Akun Super Master tidak dapat dikunci.' }, { status: 400 });
      if (!existing) return Response.json({ error: `${target} belum terdaftar.` }, { status: 404 });
      const locked = body.locked === true;
      await svc.entities.ApprovedUser.update(existing.id, { is_approved: !locked });
      return Response.json({ ok: true, message: `${target} ${locked ? 'dikunci (tidak bisa login)' : 'dibuka kembali'}.` });
    }

    return Response.json({ error: 'action tidak dikenal. Gunakan: list_members, set_role, add_member, set_lock.' }, { status: 400 });
  } catch (error) {
    console.error('[manageMemberAccess]', error?.message);
    return Response.json({ error: error?.message || 'Gagal memproses permintaan' }, { status: 500 });
  }
}