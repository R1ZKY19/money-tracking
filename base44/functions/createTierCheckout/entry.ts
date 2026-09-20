import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const PRICES = {
  STAF: 'price_1UEmtdPzO1ImBBM645ocB9gS',
  MASTER_2: 'price_1UEmtdPzO1ImBBM6ZLzFghoQ',
  MASTER_1: 'price_1UEmtePzO1ImBBM6WEZeQfl6',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier } = await req.json();
    const price = PRICES[tier];
    if (!price) return Response.json({ error: 'Paket tidak dikenal' }, { status: 400 });

    // Domain tujuan ditetapkan di server — jangan pernah dari input klien (open redirect).
    const base = 'https://moneyt.base44.app';
    const body = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price]': price,
      'line_items[0][quantity]': '1',
      customer_email: user.email,
      success_url: `${base}/panduan?bayar=sukses`,
      cancel_url: `${base}/panduan?bayar=batal`,
      'metadata[base44_app_id]': secrets.get('BASE44_APP_ID'),
      'metadata[tier]': tier,
      'metadata[user_email]': user.email,
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Stripe-Version': '2025-10-29.clover',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const session = await res.json();
    if (!res.ok) {
      console.error('Stripe checkout error', session.error);
      return Response.json({ error: session.error?.message || 'Gagal membuat checkout' }, { status: 500 });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createTierCheckout failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}