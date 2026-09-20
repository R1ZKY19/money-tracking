import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'set'; // 'set' | 'info' | 'delete'

    // Webhook URL: fungsi telegramBot dengan secret param
    const secret = BOT_TOKEN?.slice(-10);
    const webhookUrl = body.webhook_url; // dikirim dari frontend

    if (action === 'info') {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const data = await res.json();
      return Response.json(data);
    }

    if (action === 'delete') {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drop_pending_updates: true }),
      });
      const data = await res.json();
      return Response.json(data);
    }

    // action === 'set'
    if (!webhookUrl) {
      return Response.json({ error: 'webhook_url required' }, { status: 400 });
    }

    const fullUrl = `${webhookUrl}?secret=${secret}`;
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fullUrl, allowed_updates: ['message'] }),
    });
    const data = await res.json();
    return Response.json({ ...data, webhook_set: fullUrl });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});