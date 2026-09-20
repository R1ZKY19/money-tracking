import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isApprovalOwner } from '../../shared/approvalAccess.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isApprovalOwner(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');
    const svc = base44.asServiceRole.entities;

    if (action === 'list') {
      const requests = await svc.LoginRequest.list('-attempted_at', 100);
      return Response.json({ requests: requests || [] });
    }

    const id = String(body.id || '');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const found = await svc.LoginRequest.filter({ id });
    const reqRow = (found || [])[0];
    if (!reqRow) return Response.json({ error: 'Not found' }, { status: 404 });

    const now = new Date().toISOString();

    if (action === 'approve') {
      const role = ['super_master', 'master_1', 'master_2', 'staf'].includes(body.role) ? body.role : 'staf';
      const existing = await svc.ApprovedUser.filter({ email: reqRow.email });
      if (existing && existing.length) {
        await svc.ApprovedUser.update(existing[0].id, { is_approved: true, role });
      } else {
        await svc.ApprovedUser.create({ email: reqRow.email, is_approved: true, role, approved_at: now });
      }
      await svc.LoginRequest.update(id, { status: 'approved', decided_at: now, decided_by: user.email });
      await svc.AppNotification.create({
        title: 'Akses login disetujui',
        message: `${reqRow.email} kini dapat login dengan role ${role}.`,
        type: 'role',
        target_email: reqRow.email,
      });
      return Response.json({ ok: true, status: 'approved' });
    }

    if (action === 'reject') {
      await svc.LoginRequest.update(id, { status: 'rejected', decided_at: now, decided_by: user.email });
      await svc.AppNotification.create({
        title: 'Permintaan login ditolak',
        message: `Permintaan login ${reqRow.email} ditolak oleh admin.`,
        type: 'login_request',
        target_email: user.email,
      });
      return Response.json({ ok: true, status: 'rejected' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}