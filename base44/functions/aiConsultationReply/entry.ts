import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildAiSystemPrompt, OWNER_EMAIL } from '../../shared/moneyKnowledge.ts';
import { isInternalOrAdmin } from '../../shared/internalAuth.ts';

// Balasan otomatis AI MONEY.T untuk thread konsultasi yang berada pada mode ai_auto.
// Admin yang mengambil alih akan mengubah mode menjadi manual sehingga AI berhenti membalas.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const messageId = body.message_id;
    if (!messageId) return Response.json({ error: 'message_id required' }, { status: 400 });
    if (!(await isInternalOrAdmin(base44, body))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let msg = null;
    try { msg = await base44.asServiceRole.entities.ConsultationMessage.get(messageId); } catch { msg = null; }
    if (!msg) return Response.json({ ok: true, skipped: 'message not found' });
    if (msg.sender_role !== 'user') return Response.json({ ok: true, skipped: 'not a user message' });

    const threadEmail = String(msg.thread_email || '').toLowerCase().trim();
    if (!threadEmail) return Response.json({ ok: true, skipped: 'no thread' });

    const threads = await base44.asServiceRole.entities.ConsultationThread.filter({ thread_email: threadEmail });
    const thread = threads[0];
    if (thread && thread.mode === 'manual') {
      return Response.json({ ok: true, skipped: 'admin took over this thread' });
    }

    const rows = await base44.asServiceRole.entities.ConsultationMessage.filter(
      { thread_email: threadEmail }, '-created_date', 12
    );
    const history = rows
      .slice()
      .reverse()
      .map(r => `${r.sender_role === 'user' ? 'Pengguna' : (r.is_ai ? 'AI MONEY.T' : 'Admin')}: ${String(r.message || '').slice(0, 400)}`)
      .join('\n');

    let role = 'staf';
    try {
      const approvals = await base44.asServiceRole.entities.ApprovedUser.filter({ email: threadEmail });
      if (approvals[0]?.role) role = approvals[0].role;
    } catch { /* pakai default */ }
    if (threadEmail === OWNER_EMAIL) role = 'super_master';

    const prompt = buildAiSystemPrompt({
      userEmail: threadEmail,
      role,
      history,
      question: String(msg.message || '').slice(0, 1500),
    });

    const answer = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const text = String(answer || '').trim();
    if (!text) return Response.json({ ok: true, skipped: 'empty ai answer' });

    const created = await base44.asServiceRole.entities.ConsultationMessage.create({
      thread_email: threadEmail,
      sender_role: 'admin',
      sender_email: OWNER_EMAIL,
      sender_name: 'AI MONEY.T (Balasan Otomatis)',
      is_ai: true,
      message: text.slice(0, 3900),
    });

    return Response.json({ ok: true, reply_id: created?.id });
  } catch (error) {
    console.error('aiConsultationReply error:', error?.message);
    return Response.json({ error: 'AI reply failed' }, { status: 500 });
  }
}