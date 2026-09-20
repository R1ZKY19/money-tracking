import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isApprovalOwner } from '../../shared/approvalAccess.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isApprovalOwner(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const email = 'rizkykucuk19@gmail.com';
    const existing = await base44.asServiceRole.entities.ApprovedUser.filter({ email });
    if (existing.length) return Response.json({ success: true, message: 'Email sudah disetujui' });
    const result = await base44.asServiceRole.entities.ApprovedUser.create({
      email: email,
      is_approved: true,
      approved_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      message: `Email ${email} berhasil di-approve`,
      data: result
    });
  } catch (error) {
    return Response.json({ error: 'Approval failed' }, { status: 500 });
  }
}