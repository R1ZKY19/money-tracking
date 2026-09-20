import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isApprovalOwner } from '../../shared/approvalAccess.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'check');
    const requestedEmail = String(body.email || '').toLowerCase().trim();

    // Login yang gagal belum memiliki sesi. Catat hanya bila email benar-benar akun app terdaftar.
    if (action === 'recordAttempt') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) {
        return Response.json({ recorded: false });
      }
      const registered = await base44.asServiceRole.entities.User.filter({ email: requestedEmail });
      if (!registered?.length) return Response.json({ recorded: false });

      const approved = await base44.asServiceRole.entities.ApprovedUser.filter({ email: requestedEmail, is_approved: true });
      if (approved?.length) return Response.json({ recorded: false });

      const now = new Date().toISOString();
      const existing = await base44.asServiceRole.entities.LoginRequest.filter({ email: requestedEmail });
      const openReq = (existing || []).find(r => r.status === 'pending');
      if (openReq) {
        await base44.asServiceRole.entities.LoginRequest.update(openReq.id, {
          attempted_at: now,
          attempts: (openReq.attempts || 1) + 1,
          user_agent: String(req.headers.get('user-agent') || '').slice(0, 300),
        });
      } else {
        await base44.asServiceRole.entities.LoginRequest.create({
          email: requestedEmail,
          status: 'pending',
          attempted_at: now,
          attempts: 1,
          user_agent: String(req.headers.get('user-agent') || '').slice(0, 300),
        });
        await base44.asServiceRole.entities.AppNotification.create({
          title: 'Permintaan login baru',
          message: `${requestedEmail} mencoba login dan menunggu persetujuan.`,
          type: 'login_request',
          target_email: 'rizkykucuk19@gmail.com',
          link: '/pengaturan',
        });
      }
      return Response.json({ recorded: true });
    }

    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const email = String(requestedEmail || user.email || '').toLowerCase().trim();
    if (email !== String(user.email || '').toLowerCase().trim() && !isApprovalOwner(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const emailLower = email;

    // Check if email is approved
    let approved;
    try {
      approved = await base44.asServiceRole.entities.ApprovedUser.filter({ 
        email: emailLower, 
        is_approved: true 
      });
      console.log(`[checkEmailApproval] Query result: ${approved?.length || 0} records found`);
    } catch (queryError) {
      console.error(`[checkEmailApproval] Query error:`, queryError.message);
      // Fallback: allow login jika ApprovedUser entity belum ada/kosong (development mode)
      approved = [];
    }

    if (!approved || approved.length === 0) {
      // Member baru: belum pernah ada catatan sama sekali → beri role paling bawah ('none')
      // sehingga bisa langsung masuk & melihat Panduan Fitur + Paket & Harga.
      const anyRecord = await base44.asServiceRole.entities.ApprovedUser.filter({ email: emailLower });
      if (!anyRecord || anyRecord.length === 0) {
        await base44.asServiceRole.entities.ApprovedUser.create({
          email: emailLower,
          role: 'none',
          is_approved: true,
          approved_at: new Date().toISOString(),
          notes: 'Pendaftaran baru — akses dasar (belum berpaket)',
        });
        await base44.asServiceRole.entities.AppNotification.create({
          title: 'Member baru mendaftar',
          message: `${emailLower} baru masuk dengan akses dasar (belum berpaket).`,
          type: 'system',
          target_email: 'rizkykucuk19@gmail.com',
          link: '/pengaturan',
        }).catch(() => {});
        return Response.json({ approved: true, message: 'Member baru — akses dasar aktif' });
      }

      console.log(`[checkEmailApproval] Email ${emailLower} not approved`);
      // Catat percobaan login agar owner bisa menyetujui/menolak dari Pengaturan
      try {
        const now = new Date().toISOString();
        const existing = await base44.asServiceRole.entities.LoginRequest.filter({ email: emailLower });
        const openReq = (existing || []).find(r => r.status === 'pending');
        if (openReq) {
          await base44.asServiceRole.entities.LoginRequest.update(openReq.id, {
            attempted_at: now,
            attempts: (openReq.attempts || 1) + 1,
            user_agent: String(req.headers.get('user-agent') || '').slice(0, 300),
          });
        } else {
          await base44.asServiceRole.entities.LoginRequest.create({
            email: emailLower,
            status: 'pending',
            attempted_at: now,
            attempts: 1,
            user_agent: String(req.headers.get('user-agent') || '').slice(0, 300),
          });
          await base44.asServiceRole.entities.AppNotification.create({
            title: 'Permintaan login baru',
            message: `${emailLower} mencoba login dan menunggu persetujuan.`,
            type: 'login_request',
            target_email: 'rizkykucuk19@gmail.com',
            link: '/pengaturan',
          });
        }
      } catch (logErr) {
        console.error('[checkEmailApproval] gagal mencatat login request:', logErr.message);
      }
      return Response.json({ 
        approved: false,
        message: 'Email belum disetujui oleh admin'
      }, { status: 403 });
    }

    console.log(`[checkEmailApproval] Email ${emailLower} approved`);
    return Response.json({ 
      approved: true,
      message: 'Email approved'
    });
  } catch (error) {
    console.error('[checkEmailApproval] Fatal error:', error.message);
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}