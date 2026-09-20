import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isApprovalOwner } from '../../shared/approvalAccess.ts';
import { summarizeUsage } from './summarize.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = String(body.action || '');
    const email = String(user.email || '').toLowerCase().trim();

    if (action === 'heartbeat' || action === 'pause') {
      const sessionKey = String(body.session_key || '').slice(0, 100);
      if (!/^[a-zA-Z0-9-]{10,100}$/.test(sessionKey)) return Response.json({ error: 'Invalid session' }, { status: 400 });
      const approved = await base44.asServiceRole.entities.ApprovedUser.filter({ email, is_approved: true }, '-created_date', 1);
      if (!approved.length) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const now = new Date().toISOString();
      const rawSeconds = body.delta_seconds;
      if (typeof rawSeconds !== 'number' || !Number.isFinite(rawSeconds) || rawSeconds < 0 || rawSeconds > 45) return Response.json({ error: 'Invalid duration' }, { status: 400 });
      const deltaSeconds = Math.floor(rawSeconds);
      const existing = await base44.asServiceRole.entities.UsageSession.filter({ session_key: sessionKey, user_id: user.id });
      if (existing.length) {
        const current = existing[0];
        const gap = Math.max(0, Math.round((Date.parse(now) - Date.parse(current.last_seen)) / 1000));
        const increment = current.is_active && gap <= 90 ? Math.min(deltaSeconds, gap) : 0;
        await base44.asServiceRole.entities.UsageSession.update(current.id, {
          last_seen: now,
          duration_seconds: Math.max(0, Number(current.duration_seconds) || 0) + increment,
          is_active: action === 'heartbeat',
          page_path: String(body.page_path || '/').slice(0, 200)
        });
      } else {
        await base44.asServiceRole.entities.UsageSession.create({
          session_key: sessionKey,
          user_id: user.id,
          user_email: email,
          started_at: now,
          last_seen: now,
          duration_seconds: 0,
          is_active: action === 'heartbeat',
          page_path: String(body.page_path || '/').slice(0, 200),
          user_agent: String(body.user_agent || '').slice(0, 300)
        });
      }
      return Response.json({ ok: true });
    }

    if (!isApprovalOwner(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (action === 'overview') {
      const summaries = await summarizeUsage(base44.asServiceRole.entities.UsageSession);
      const overview = [];
      let offset = 0;
      while (true) {
        const members = await base44.asServiceRole.entities.ApprovedUser.list('email', 200, offset);
        for (const member of members) {
          const summary = summaries.get(String(member.email || '').toLowerCase());
          const { sessions, ...stats } = summary || { total_seconds: 0, session_count: 0, last_seen: null, page_path: null, is_active: false };
          overview.push({ email: member.email, role: member.role, notes: member.notes, approved_at: member.approved_at, ...stats });
        }
        if (members.length < 200) break;
        offset += members.length;
      }
      return Response.json({ overview });
    }
    if (action === 'detail') {
      const targetEmail = String(body.email || '').toLowerCase().trim();
      if (!targetEmail || targetEmail.length > 254) return Response.json({ error: 'Invalid email' }, { status: 400 });
      const summaries = await summarizeUsage(base44.asServiceRole.entities.UsageSession, { user_email: targetEmail });
      const stats = summaries.get(targetEmail) || { sessions: [], total_seconds: 0, session_count: 0 };
      const users = await base44.asServiceRole.entities.User.filter({ email: targetEmail }, '-created_date', 1);
      const targetUser = users[0] || null;
      const logs = targetUser ? await base44.asServiceRole.entities.ActivityLog.filter({ created_by_id: targetUser.id }, '-created_date', 200) : [];
      return Response.json({ ...stats, logs, profile: targetUser ? { full_name: targetUser.full_name, email: targetUser.email, created_date: targetUser.created_date } : null });
    }
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to monitor usage' }, { status: 500 });
  }
}