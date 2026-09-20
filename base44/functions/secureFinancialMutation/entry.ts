import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const TYPES = new Set(['income','expense','saving','debt','receivable','debt_payment','receivable_receipt','investment']);
const CREDIT_TYPES = new Set(['income','debt','receivable_receipt']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function clean(value, max = 1000) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

function validDate(value) {
  if (!DATE_RE.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

async function throttle(base44, userId, action) {
  const now = Date.now();
  const rows = await base44.asServiceRole.entities.SecurityThrottle.filter({ user_id: userId, action });
  const row = rows?.[0];
  const start = row ? new Date(row.window_start).getTime() : 0;
  if (row && now - start < 60000) {
    if ((row.count || 0) >= 30) throw Object.assign(new Error('Terlalu banyak permintaan. Coba lagi dalam satu menit.'), { status: 429 });
    await base44.asServiceRole.entities.SecurityThrottle.update(row.id, { count: (row.count || 0) + 1 });
  } else if (row) {
    await base44.asServiceRole.entities.SecurityThrottle.update(row.id, { window_start: new Date(now).toISOString(), count: 1 });
  } else {
    await base44.asServiceRole.entities.SecurityThrottle.create({ user_id: userId, action, window_start: new Date(now).toISOString(), count: 1 });
  }
}

async function ownAccount(base44, id) {
  if (!id) throw Object.assign(new Error('Akun wajib dipilih.'), { status: 400 });
  const account = await base44.entities.Account.get(id);
  if (!account) throw Object.assign(new Error('Akun tidak ditemukan.'), { status: 404 });
  return account;
}

function normalize(raw, account) {
  const amount = Number(raw?.amount);
  const type = clean(raw?.type, 40);
  const date = clean(raw?.date, 10);
  if (!TYPES.has(type)) throw Object.assign(new Error('Jenis transaksi tidak valid.'), { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000000000000) throw Object.assign(new Error('Nominal transaksi tidak valid.'), { status: 400 });
  if (!validDate(date)) throw Object.assign(new Error('Tanggal transaksi tidak valid.'), { status: 400 });
  return {
    date, type, amount, currency: account.currency, account_id: account.id, account_name: clean(account.name, 200),
    category_id: clean(raw.category_id, 100), category_name: clean(raw.category_name, 200),
    description: clean(raw.description), reference: clean(raw.reference, 200), related_id: clean(raw.related_id, 100),
    related_type: clean(raw.related_type, 60), creditor_name: clean(raw.creditor_name, 200), debtor_name: clean(raw.debtor_name, 200),
    due_date: raw.due_date ? clean(raw.due_date, 10) : '', interest_rate: Math.max(0, Number(raw.interest_rate) || 0),
    destination_account_id: clean(raw.destination_account_id, 100), destination_account_name: clean(raw.destination_account_name, 200),
    operation_key: clean(raw.operation_key, 100)
  };
}

async function changeBalance(base44, accountId, amount) {
  if (!amount) return;
  await base44.entities.Account.updateMany({ id: accountId }, { $inc: { current_balance: amount } });
}

async function applyEffects(base44, tx) {
  const delta = CREDIT_TYPES.has(tx.type) ? tx.amount : -tx.amount;
  const account = await ownAccount(base44, tx.account_id);
  if (delta < 0 && (account.current_balance || 0) < tx.amount) throw Object.assign(new Error('Saldo akun tidak mencukupi.'), { status: 400 });
  let relatedId = tx.related_id;
  if (tx.type === 'debt') {
    if (!tx.creditor_name) throw Object.assign(new Error('Nama pemberi hutang wajib diisi.'), { status: 400 });
    const row = await base44.entities.Debt.create({ creditor_name: tx.creditor_name, total_amount: tx.amount, remaining_amount: tx.amount, currency: tx.currency, due_date: tx.due_date || undefined, notes: tx.description, status: 'active' });
    relatedId = row.id;
  } else if (tx.type === 'receivable') {
    if (!tx.debtor_name) throw Object.assign(new Error('Nama peminjam wajib diisi.'), { status: 400 });
    const row = await base44.entities.Receivable.create({ debtor_name: tx.debtor_name, total_amount: tx.amount, remaining_amount: tx.amount, currency: tx.currency, due_date: tx.due_date || undefined, notes: tx.description, status: 'active', interest_rate: tx.interest_rate });
    relatedId = row.id;
  } else if (tx.type === 'debt_payment') {
    const debt = await base44.entities.Debt.get(tx.related_id);
    if (!debt || debt.status !== 'active' || tx.amount > (debt.remaining_amount || 0)) throw Object.assign(new Error('Pembayaran melebihi sisa hutang atau data tidak valid.'), { status: 400 });
    const remaining = (debt.remaining_amount || 0) - tx.amount;
    await base44.entities.Debt.update(debt.id, { remaining_amount: remaining, status: remaining === 0 ? 'paid' : 'active' });
  } else if (tx.type === 'receivable_receipt') {
    const rec = await base44.entities.Receivable.get(tx.related_id);
    if (!rec || rec.status !== 'active' || tx.amount > (rec.remaining_amount || 0)) throw Object.assign(new Error('Penerimaan melebihi sisa piutang atau data tidak valid.'), { status: 400 });
    const remaining = (rec.remaining_amount || 0) - tx.amount;
    await base44.entities.Receivable.update(rec.id, { remaining_amount: remaining, status: remaining === 0 ? 'completed' : 'active' });
  } else if (tx.type === 'saving') {
    const target = await base44.entities.SavingTarget.get(tx.related_id);
    if (!target) throw Object.assign(new Error('Target tabungan tidak ditemukan.'), { status: 404 });
    const current = (target.current_amount || 0) + tx.amount;
    await base44.entities.SavingTarget.update(target.id, { current_amount: current, status: current >= target.target_amount ? 'achieved' : 'active' });
    if (tx.destination_account_id) {
      const destination = await ownAccount(base44, tx.destination_account_id);
      if (destination.id === account.id || destination.currency !== account.currency) throw Object.assign(new Error('Rekening tujuan tabungan tidak valid.'), { status: 400 });
      await changeBalance(base44, destination.id, tx.amount);
      tx.destination_account_name = destination.name;
    }
  }
  await changeBalance(base44, account.id, delta);
  return relatedId;
}

async function reverseEffects(base44, tx) {
  const delta = CREDIT_TYPES.has(tx.type) ? tx.amount : -tx.amount;
  await changeBalance(base44, tx.account_id, -delta);
  if (tx.type === 'debt' && tx.related_id) {
    const row = await base44.entities.Debt.get(tx.related_id); if (row) await base44.entities.Debt.delete(row.id);
  } else if (tx.type === 'receivable' && tx.related_id) {
    const row = await base44.entities.Receivable.get(tx.related_id); if (row) await base44.entities.Receivable.delete(row.id);
  } else if (tx.type === 'debt_payment' && tx.related_id) {
    const row = await base44.entities.Debt.get(tx.related_id); if (row) await base44.entities.Debt.update(row.id, { remaining_amount: Math.min(row.total_amount, (row.remaining_amount || 0) + tx.amount), status: 'active' });
  } else if (tx.type === 'receivable_receipt' && tx.related_id) {
    const row = await base44.entities.Receivable.get(tx.related_id); if (row) await base44.entities.Receivable.update(row.id, { remaining_amount: Math.min(row.total_amount, (row.remaining_amount || 0) + tx.amount), status: 'active' });
  } else if (tx.type === 'saving' && tx.related_id) {
    const row = await base44.entities.SavingTarget.get(tx.related_id); if (row) await base44.entities.SavingTarget.update(row.id, { current_amount: Math.max(0, (row.current_amount || 0) - tx.amount), status: 'active' });
    if (tx.destination_account_id) await changeBalance(base44, tx.destination_account_id, -tx.amount);
  }
}

async function createTransfer(base44, raw) {
  const from = await ownAccount(base44, raw.from_account_id);
  const to = await ownAccount(base44, raw.to_account_id);
  const amount = Number(raw.amount);
  const date = clean(raw.date, 10);
  if (from.id === to.id) throw Object.assign(new Error('Akun asal dan tujuan harus berbeda.'), { status: 400 });
  if (from.currency !== to.currency) throw Object.assign(new Error('Transfer beda mata uang memerlukan konversi kurs dan tidak dapat diproses langsung.'), { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > (from.current_balance || 0)) throw Object.assign(new Error('Nominal atau saldo transfer tidak valid.'), { status: 400 });
  if (!validDate(date)) throw Object.assign(new Error('Tanggal transfer tidak valid.'), { status: 400 });
  const operationKey = clean(raw.operation_key, 100);
  if (operationKey) {
    const duplicate = await base44.entities.Transaction.filter({ operation_key: operationKey });
    if (duplicate.length) return { duplicate: true, transactions: duplicate };
  }
  const pairId = crypto.randomUUID();
  const description = clean(raw.description || `Transfer ${from.name} → ${to.name}`);
  const common = { date, type: 'transfer', amount, currency: from.currency, description, operation_key: operationKey, transfer_pair_id: pairId };
  const out = await base44.entities.Transaction.create({ ...common, account_id: from.id, account_name: from.name, reference: 'TRANSFER-OUT' });
  let incoming;
  try {
    incoming = await base44.entities.Transaction.create({ ...common, account_id: to.id, account_name: to.name, reference: 'TRANSFER-IN' });
    await changeBalance(base44, from.id, -amount);
    await changeBalance(base44, to.id, amount);
  } catch (error) {
    await base44.entities.Transaction.delete(out.id);
    throw error;
  }
  return { transactions: [out, incoming], from_balance_after: (from.current_balance || 0) - amount, to_balance_after: (to.current_balance || 0) + amount };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const action = clean(body.action, 30);
    await throttle(base44, user.id, action || 'unknown');
    if (action === 'transfer') return Response.json(await createTransfer(base44, body.data || {}));
    if (action === 'create') {
      const account = await ownAccount(base44, body.data?.account_id);
      const tx = normalize(body.data || {}, account);
      if (tx.operation_key) {
        const duplicate = await base44.entities.Transaction.filter({ operation_key: tx.operation_key });
        if (duplicate.length) return Response.json({ duplicate: true, transaction: duplicate[0] });
      }
      const relatedId = await applyEffects(base44, tx);
      const created = await base44.entities.Transaction.create({ ...tx, related_id: relatedId });
      return Response.json({ transaction: created });
    }
    const existing = await base44.entities.Transaction.get(clean(body.id, 100));
    if (!existing) return Response.json({ error: 'Transaksi tidak ditemukan.' }, { status: 404 });
    if (action === 'delete') {
      if (existing.type === 'transfer') {
        const pair = existing.transfer_pair_id ? await base44.entities.Transaction.filter({ transfer_pair_id: existing.transfer_pair_id }) : [existing];
        for (const item of pair) await changeBalance(base44, item.account_id, item.reference === 'TRANSFER-IN' ? -item.amount : item.amount);
        for (const item of pair) await base44.entities.Transaction.delete(item.id);
      } else {
        await reverseEffects(base44, existing);
        await base44.entities.Transaction.delete(existing.id);
      }
      return Response.json({ success: true });
    }
    if (action === 'update') {
      if (existing.type === 'transfer') return Response.json({ error: 'Transfer harus dibatalkan dan dibuat ulang.' }, { status: 400 });
      const account = await ownAccount(base44, body.data?.account_id);
      const next = normalize(body.data || {}, account);
      await reverseEffects(base44, existing);
      try {
        const relatedId = await applyEffects(base44, next);
        const updated = await base44.entities.Transaction.update(existing.id, { ...next, related_id: relatedId });
        return Response.json({ transaction: updated });
      } catch (error) {
        await applyEffects(base44, existing);
        throw error;
      }
    }
    return Response.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  } catch (error) {
    const status = Number(error?.status) || 500;
    return Response.json({ error: status >= 500 ? 'Terjadi kesalahan server.' : error.message }, { status });
  }
}