import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { isInternalOrAdmin } from '../../shared/internalAuth.ts';

const OWNER_EMAIL = 'rizkykucuk19@gmail.com';

function escHtml(t) {
  return String(t ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

async function sendTelegram(chatId, text) {
  const token = secrets.get('TELEGRAM_BOT_TOKEN');
  if (!token || !chatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  return res.ok;
}

// Notifikasi pesan konsultasi baru: Telegram (jika akun tertaut) + notifikasi in-app.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (!(await isInternalOrAdmin(base44, body))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const messageId = body.message_id;
    if (!messageId) return Response.json({ error: 'message_id required' }, { status: 400 });

    let msg = null;
    try { msg = await base44.asServiceRole.entities.ConsultationMessage.get(messageId); } catch { msg = null; }
    if (!msg) return Response.json({ ok: true, skipped: 'message not found' });

    const fromAdmin = msg.sender_role === 'admin';
    const recipientEmail = (fromAdmin ? msg.thread_email : OWNER_EMAIL).toLowerCase();

    const users = await base44.asServiceRole.entities.User.list();
    const recipient = users.find(u => (u.email || '').toLowerCase() === recipientEmail);

    const senderLabel = fromAdmin ? 'Admin' : (msg.sender_name || msg.thread_email || 'Pengguna');
    const preview = String(msg.message || '').slice(0, 300);

    await base44.asServiceRole.entities.AppNotification.create({
      title: `💬 Pesan konsultasi baru dari ${senderLabel}`,
      message: preview,
      type: 'activity',
      target_email: recipientEmail,
      link: '/konsultasi',
    });

    let telegram = false;
    if (recipient?.telegram_chat_id) {
      let text = `💬 <b>PESAN KONSULTASI BARU</b>\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `👤 <b>Dari :</b> ${escHtml(senderLabel)}\n`;
      if (!fromAdmin) text += `📧 <b>Thread:</b> ${escHtml(msg.thread_email)}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `${escHtml(preview)}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📲 Buka menu Konsultasi untuk membalas.`;
      telegram = await sendTelegram(recipient.telegram_chat_id, text);
    }

    return Response.json({ ok: true, telegram });
  } catch (error) {
    console.error('notifyConsultationMessage error:', error?.message);
    return Response.json({ error: 'Notification failed' }, { status: 500 });
  }
}