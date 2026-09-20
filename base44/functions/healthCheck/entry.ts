import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check user auth
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      console.log('User not authenticated');
    }

    if (!user?.id) {
      return Response.json({ status: 'unauthenticated', timestamp: new Date().toISOString() }, { status: 401 });
    }

    // Check critical entities
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      user: user.email,
      checks: {}
    };

    try {
      const accts = await base44.entities.Account.list();
      health.checks.accounts = { status: 'ok', count: accts?.length || 0 };
    } catch (e) {
      health.checks.accounts = { status: 'error', message: e.message };
      health.status = 'degraded';
    }

    try {
      const txs = await base44.entities.Transaction.list();
      health.checks.transactions = { status: 'ok', count: txs?.length || 0 };
    } catch (e) {
      health.checks.transactions = { status: 'error', message: e.message };
      health.status = 'degraded';
    }

    try {
      const cats = await base44.entities.Category.list();
      health.checks.categories = { status: 'ok', count: cats?.length || 0 };
    } catch (e) {
      health.checks.categories = { status: 'error', message: e.message };
      health.status = 'degraded';
    }

    return Response.json(health, { status: health.status === 'healthy' ? 200 : 503 });
  } catch (error) {
    console.error('Health check failed:', error);
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});