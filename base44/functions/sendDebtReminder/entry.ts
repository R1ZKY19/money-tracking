import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { isInternalOrAdmin } from '../../shared/internalAuth.ts';

// Build RFC 2822 base64url message for Gmail API
function buildMimeMessage({ to, subject, htmlBody, fromName }) {
  const encodeSubject = (s) => {
    // RFC 2047 encode non-ASCII subject
    const b64 = btoa(unescape(encodeURIComponent(s)));
    return `=?UTF-8?B?${b64}?=`;
  };
  const boundary = `boundary_${Date.now()}`;
  const raw = [
    `From: ${fromName} <me>`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(htmlBody))),
    `--${boundary}--`,
  ].join('\r\n');

  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(accessToken, { to, subject, htmlBody, fromName }) {
  const raw = buildMimeMessage({ to, subject, htmlBody, fromName });
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed: ${err}`);
  }
  return res.json();
}

const escHtml = (t) => String(t ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const fmt = (n) => (n || 0).toLocaleString('id-ID');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (!(await isInternalOrAdmin(base44, body))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const now = new Date();

    // Ambil semua user untuk kirim ke masing-masing
    const allDebts = await base44.asServiceRole.entities.Debt.filter({ status: 'active' });
    const allReceivables = await base44.asServiceRole.entities.Receivable.filter({ status: 'active' });
    const allUsers = await base44.asServiceRole.entities.User.list();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    let totalSent = 0;

    for (const user of allUsers) {
      if (!user.email) continue;

      const debts = allDebts.filter(d => d.created_by_id === user.id);
      const receivables = allReceivables.filter(r => r.created_by_id === user.id);

      const overdueDebts = debts.filter(d => d.due_date && new Date(d.due_date) < now);
      const dueSoonDebts = debts.filter(d => {
        if (!d.due_date) return false;
        const days = Math.floor((new Date(d.due_date) - now) / 86400000);
        return days >= 0 && days <= 7;
      });
      const overdueRec = receivables.filter(r => r.due_date && new Date(r.due_date) < now);
      const dueSoonRec = receivables.filter(r => {
        if (!r.due_date) return false;
        const days = Math.floor((new Date(r.due_date) - now) / 86400000);
        return days >= 0 && days <= 7;
      });

      const hasAlert = overdueDebts.length || dueSoonDebts.length || overdueRec.length || dueSoonRec.length;
      if (!hasAlert) continue;

      let html = `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#0D4F6D,#0a3d55);padding:20px 24px;border-radius:10px;margin-bottom:20px;">
            <img src="https://media.base44.com/images/public/6a2817e4a27a25c626d7a995/a10ef6b54_image.png" alt="MONEY TRACKING" style="height:32px;margin-bottom:8px;" />
            <h1 style="color:#fff;margin:0;font-size:20px;">Pengingat Keuangan</h1>
            <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">${now.toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          </div>`;

      if (overdueDebts.length) {
        html += `<div style="background:#FEF2F2;border-left:4px solid #EF4444;padding:14px 16px;border-radius:8px;margin-bottom:12px;">
          <h3 style="color:#DC2626;margin:0 0 8px;">⚠️ Hutang Sudah Jatuh Tempo (${overdueDebts.length})</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="background:#FCA5A5;"><th style="padding:6px 8px;text-align:left;">Kreditor</th><th style="text-align:right;padding:6px 8px;">Sisa</th><th style="text-align:center;padding:6px 8px;">Jatuh Tempo</th></tr>
            ${overdueDebts.map(d => `<tr style="border-top:1px solid #FECACA;"><td style="padding:6px 8px;">${escHtml(d.creditor_name)}</td><td style="text-align:right;padding:6px 8px;color:#DC2626;font-weight:bold;">${fmt(d.remaining_amount)} ${escHtml(d.currency)}</td><td style="text-align:center;padding:6px 8px;">${d.due_date}</td></tr>`).join('')}
          </table></div>`;
      }

      if (dueSoonDebts.length) {
        html += `<div style="background:#FFFBEB;border-left:4px solid #F59E0B;padding:14px 16px;border-radius:8px;margin-bottom:12px;">
          <h3 style="color:#D97706;margin:0 0 8px;">📌 Hutang Jatuh Tempo ≤7 Hari (${dueSoonDebts.length})</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="background:#FDE68A;"><th style="padding:6px 8px;text-align:left;">Kreditor</th><th style="text-align:right;padding:6px 8px;">Sisa</th><th style="text-align:center;padding:6px 8px;">Sisa Hari</th></tr>
            ${dueSoonDebts.map(d => { const days = Math.floor((new Date(d.due_date) - now) / 86400000); return `<tr style="border-top:1px solid #FDE68A;"><td style="padding:6px 8px;">${escHtml(d.creditor_name)}</td><td style="text-align:right;padding:6px 8px;font-weight:bold;">${fmt(d.remaining_amount)} ${escHtml(d.currency)}</td><td style="text-align:center;padding:6px 8px;color:#D97706;font-weight:bold;">${days} hari</td></tr>`; }).join('')}
          </table></div>`;
      }

      if (overdueRec.length) {
        html += `<div style="background:#EFF6FF;border-left:4px solid #3B82F6;padding:14px 16px;border-radius:8px;margin-bottom:12px;">
          <h3 style="color:#2563EB;margin:0 0 8px;">💙 Piutang Sudah Jatuh Tempo (${overdueRec.length})</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="background:#BFDBFE;"><th style="padding:6px 8px;text-align:left;">Debitur</th><th style="text-align:right;padding:6px 8px;">Sisa</th><th style="text-align:center;padding:6px 8px;">Jatuh Tempo</th></tr>
            ${overdueRec.map(r => `<tr style="border-top:1px solid #DBEAFE;"><td style="padding:6px 8px;">${escHtml(r.debtor_name)}</td><td style="text-align:right;padding:6px 8px;font-weight:bold;">${fmt(r.remaining_amount)} ${escHtml(r.currency)}</td><td style="text-align:center;padding:6px 8px;">${r.due_date}</td></tr>`).join('')}
          </table></div>`;
      }

      if (dueSoonRec.length) {
        html += `<div style="background:#F0FDF4;border-left:4px solid #10B981;padding:14px 16px;border-radius:8px;margin-bottom:12px;">
          <h3 style="color:#059669;margin:0 0 8px;">📅 Piutang Jatuh Tempo ≤7 Hari (${dueSoonRec.length})</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="background:#A7F3D0;"><th style="padding:6px 8px;text-align:left;">Debitur</th><th style="text-align:right;padding:6px 8px;">Sisa</th><th style="text-align:center;padding:6px 8px;">Sisa Hari</th></tr>
            ${dueSoonRec.map(r => { const days = Math.floor((new Date(r.due_date) - now) / 86400000); return `<tr style="border-top:1px solid #D1FAE5;"><td style="padding:6px 8px;">${escHtml(r.debtor_name)}</td><td style="text-align:right;padding:6px 8px;font-weight:bold;">${fmt(r.remaining_amount)} ${escHtml(r.currency)}</td><td style="text-align:center;padding:6px 8px;color:#059669;font-weight:bold;">${days} hari</td></tr>`; }).join('')}
          </table></div>`;
      }

      html += `<p style="text-align:center;color:#94A3B8;font-size:11px;margin-top:20px;">MONEY TRACKING – Platform Manajemen Keuangan Pribadi</p></div>`;

      const totalAlerts = overdueDebts.length + dueSoonDebts.length + overdueRec.length + dueSoonRec.length;
      await sendGmail(accessToken, {
        to: user.email,
        subject: `MONEY TRACKING: ${totalAlerts} Pengingat Jatuh Tempo Hutang & Piutang`,
        htmlBody: html,
        fromName: 'MONEY TRACKING Notifikasi',
      });
      totalSent++;
    }

    return Response.json({ success: true, emailsSent: totalSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});