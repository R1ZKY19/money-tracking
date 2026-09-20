import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { isInternalOrAdmin } from '../../shared/internalAuth.ts';

function buildMimeMessage({ to, subject, htmlBody, fromName }) {
  const encodeSubject = (s) => {
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

const MODULE_LABELS = {
  Transaction: 'Transaksi',
  Debt: 'Hutang',
  Receivable: 'Piutang',
  SavingTarget: 'Target Tabungan',
  Account: 'Akun',
  Category: 'Kategori',
};

const ACTION_COLORS = {
  create: { bg: '#F0FDF4', border: '#10B981', text: '#059669', icon: '✅', label: 'Ditambahkan' },
  delete: { bg: '#FEF2F2', border: '#EF4444', text: '#DC2626', icon: '🗑️', label: 'Dihapus' },
  update: { bg: '#EFF6FF', border: '#3B82F6', text: '#2563EB', icon: '✏️', label: 'Diperbarui' },
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);
    if (!(await isInternalOrAdmin(base44, body))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { event, data } = body;
    const entityName = event?.entity_name || 'Data';
    const eventType = event?.type || 'update'; // create | update | delete

    const cfg = ACTION_COLORS[eventType] || ACTION_COLORS.update;
    const moduleLabel = MODULE_LABELS[entityName] || entityName;

    // Ambil info user yang melakukan aksi
    const userId = data?.created_by_id;
    let userEmail = null;
    let userName = 'Pengguna';
    if (userId) {
      const users = await base44.asServiceRole.entities.User.filter({ id: userId });
      if (users[0]) {
        userEmail = users[0].email;
        userName = users[0].full_name || users[0].email;
      }
    }

    if (!userEmail) {
      return Response.json({ skipped: true, reason: 'No user email found' });
    }

    const now = new Date();
    const timeStr = now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });

    // Buat ringkasan data yang relevan
    let dataRows = '';
    const relevantFields = {
      Transaction: ['date', 'type', 'amount', 'currency', 'account_name', 'category_name', 'description'],
      Debt: ['creditor_name', 'total_amount', 'remaining_amount', 'currency', 'due_date', 'status'],
      Receivable: ['debtor_name', 'total_amount', 'remaining_amount', 'currency', 'due_date', 'status'],
      SavingTarget: ['name', 'target_amount', 'current_amount', 'currency', 'deadline', 'status'],
      Account: ['name', 'currency', 'current_balance'],
      Category: ['name', 'type'],
    };
    const fields = relevantFields[entityName] || Object.keys(data || {}).slice(0, 6);
    fields.forEach(key => {
      if (data?.[key] !== undefined && data[key] !== null && data[key] !== '') {
        dataRows += `<tr style="border-top:1px solid #E2E8F0;">
          <td style="padding:6px 10px;color:#64748B;font-size:12px;">${escHtml(key)}</td>
          <td style="padding:6px 10px;font-size:12px;font-weight:500;">${escHtml(String(data[key]))}</td>
        </tr>`;
      }
    });

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:20px;border-radius:12px;">
        <div style="background:linear-gradient(135deg,#0D4F6D,#0a3d55);padding:18px 20px;border-radius:10px;margin-bottom:16px;">
          <img src="https://media.base44.com/images/public/6a2817e4a27a25c626d7a995/a10ef6b54_image.png" alt="MONEY TRACKING" style="height:28px;margin-bottom:6px;" />
          <h1 style="color:#fff;margin:0;font-size:18px;">Aktivitas Sistem</h1>
          <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;">${timeStr}</p>
        </div>
        <div style="background:${cfg.bg};border-left:4px solid ${cfg.border};padding:14px 16px;border-radius:8px;margin-bottom:14px;">
          <p style="margin:0;font-size:15px;font-weight:600;color:${cfg.text};">${cfg.icon} ${moduleLabel} ${cfg.label}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748B;">Oleh: <strong>${escHtml(userName)}</strong></p>
        </div>
        ${dataRows ? `
        <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:14px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr style="background:#F1F5F9;"><th colspan="2" style="padding:8px 10px;text-align:left;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Detail Data</th></tr>
            ${dataRows}
          </table>
        </div>` : ''}
        <p style="text-align:center;color:#94A3B8;font-size:11px;">MONEY TRACKING – Platform Manajemen Keuangan Pribadi</p>
      </div>`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    await sendGmail(accessToken, {
      to: userEmail,
      subject: `MONEY TRACKING: ${moduleLabel} ${cfg.label} – ${timeStr}`,
      htmlBody: html,
      fromName: 'MONEY TRACKING Notifikasi',
    });

    return Response.json({ success: true, sentTo: userEmail, event: eventType, entity: entityName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});