import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isApprovalOwner } from '../../shared/approvalAccess.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const email = (body.email || user.email || '').toLowerCase().trim();

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Hanya bisa lihat data sendiri, kecuali admin
    if (email !== String(user.email || '').toLowerCase().trim() && !isApprovalOwner(user)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const results = await base44.asServiceRole.entities.ApprovedUser.filter({
      email: email,
      is_approved: true,
    });

    if (!results || results.length === 0) {
      return Response.json(null);
    }

    const { email: em, role, access_modules, notes, approved_at } = results[0];
    return Response.json({ email: em, role, access_modules, notes, approved_at });
  } catch (error) {
    return Response.json({ error: 'Unable to load approval data' }, { status: 500 });
  }
}