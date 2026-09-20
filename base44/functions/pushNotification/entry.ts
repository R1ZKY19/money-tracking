import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isApprovalOwner } from '../../shared/approvalAccess.ts';

// Membuat notifikasi sistem (perubahan role/permission, fitur baru, update penting).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isApprovalOwner(user) && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const title = String(body.title || '').slice(0, 200);
    if (!title) return Response.json({ error: 'title required' }, { status: 400 });
    const allowed = ['system', 'feature', 'role', 'login_request', 'activity'];

    const created = await base44.asServiceRole.entities.AppNotification.create({
      title,
      message: String(body.message || '').slice(0, 1000),
      type: allowed.includes(body.type) ? body.type : 'system',
      target_email: String(body.target_email || '').toLowerCase().trim(),
      link: String(body.link || '').slice(0, 200),
    });

    return Response.json({ ok: true, id: created?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}