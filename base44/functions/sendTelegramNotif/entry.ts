import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId, text) {
  try {
    await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch (e) {
    console.error('sendMessage error:', e.message);
  }
}

function escHtml(t) {
  return String(t ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString('id-ID');
}

function fmt(n, currency = 'IDR') {
  return `${currency} ${fmtNum(n)}`;
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime() {
  return new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
}

function balanceBar(amount, prev) {
  if (prev == null) return '';
  const diff = amount - prev;
  const sign = diff >= 0 ? '▲' : '▼';
  const color = diff >= 0 ? '+' : '';
  return ` (${sign} ${color}${fmtNum(diff)})`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { mode, data } = body;
    const requestedUserId = String(body.changed_by_id || user.id);
    if (requestedUserId !== user.id && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const changed_by_id = user.role === 'admin' ? requestedUserId : user.id;
    if (mode === 'daily_summary' && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const linkedUsers = allUsers.filter(u => u.telegram_chat_id);
    if (!linkedUsers.length) return Response.json({ ok: true, skipped: 'no linked users' });

    // ============================================================
    // MODE: daily_summary
    // ============================================================
    if (mode === 'daily_summary') {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const today = now.toISOString().split('T')[0];
      const startDate = `${y}-${m}-01`;
      const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      const dayName = now.toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      for (const user of linkedUsers) {
        const uid = user.id;
        const chatId = user.telegram_chat_id;

        const [txns, accounts, debts, receivables] = await Promise.all([
          base44.asServiceRole.entities.Transaction.filter({ created_by_id: uid }),
          base44.asServiceRole.entities.Account.filter({ created_by_id: uid }),
          base44.asServiceRole.entities.Debt.filter({ created_by_id: uid, status: 'active' }),
          base44.asServiceRole.entities.Receivable.filter({ created_by_id: uid, status: 'active' }),
        ]);

        const monthly = txns.filter(t => t.date >= startDate && t.date <= today);
        const todayTxns = txns.filter(t => t.date === today);

        const income  = monthly.filter(t => t.type === 'income').reduce((s,t) => s+(t.amount||0), 0);
        const expense = monthly.filter(t => t.type === 'expense').reduce((s,t) => s+(t.amount||0), 0);
        const saving  = monthly.filter(t => t.type === 'saving').reduce((s,t) => s+(t.amount||0), 0);
        const debtPay = monthly.filter(t => t.type === 'debt_payment').reduce((s,t) => s+(t.amount||0), 0);
        const transfers = monthly.filter(t => t.type === 'transfer' && t.reference === 'TRANSFER-OUT');
        const totalTransfer = transfers.reduce((s,t) => s+(t.amount||0), 0);
        const cashFlow = income - expense - saving - debtPay;

        const activeAccounts = accounts.filter(a => a.is_active !== false);
        const totalIDR = activeAccounts.filter(a => a.currency === 'IDR').reduce((s,a) => s+(a.current_balance||0), 0);
        const totalDebt = debts.reduce((s,d) => s+(d.remaining_amount||0), 0);
        const totalRec  = receivables.reduce((s,r) => s+(r.remaining_amount||0), 0);
        const soon = new Date(); soon.setDate(soon.getDate()+7);
        const dueSoon = debts.filter(d => d.due_date && new Date(d.due_date) <= soon && new Date(d.due_date) >= now);
        const overdue = debts.filter(d => d.due_date && new Date(d.due_date) < now);

        let msg = `🌅 <b>Selamat Pagi, ${escHtml(user.full_name || 'Sobat')}!</b>\n`;
        msg += `📅 ${escHtml(dayName)}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Saldo rekening
        msg += `🏦 <b>SALDO REKENING</b>\n`;
        for (const acc of activeAccounts) {
          const bal = acc.current_balance || 0;
          const icon = bal < 0 ? '🔴' : bal === 0 ? '⚪' : '✅';
          msg += `${icon} ${escHtml(acc.name)}\n`;
          msg += `   └ <b>${fmt(bal, acc.currency)}</b>\n`;
        }
        if (activeAccounts.filter(a => a.currency === 'IDR').length > 1) {
          msg += `💰 Total IDR: <b>Rp ${fmtNum(totalIDR)}</b>\n`;
        }

        // Ringkasan bulan
        msg += `\n📊 <b>RINGKASAN ${escHtml(monthName.toUpperCase())}</b>\n`;
        msg += `┌─────────────────────\n`;
        msg += `│ 💚 Pemasukan  : <b>+Rp ${fmtNum(income)}</b>\n`;
        msg += `│ 🔴 Pengeluaran: <b>-Rp ${fmtNum(expense)}</b>\n`;
        msg += `│ 💙 Tabungan   : <b>Rp ${fmtNum(saving)}</b>\n`;
        if (debtPay > 0)      msg += `│ 🟡 Bayar Hutang: <b>Rp ${fmtNum(debtPay)}</b>\n`;
        if (totalTransfer > 0) msg += `│ 🔄 Transfer    : <b>Rp ${fmtNum(totalTransfer)}</b> (${transfers.length}x)\n`;
        msg += `├─────────────────────\n`;
        msg += `│ ${cashFlow >= 0 ? '✅' : '⚠️'} Cash Flow  : <b>${cashFlow >= 0 ? '+' : ''}Rp ${fmtNum(cashFlow)}</b>\n`;
        msg += `└─────────────────────\n`;

        // Hutang & piutang
        if (totalDebt > 0 || totalRec > 0) {
          msg += `\n💸 <b>HUTANG & PIUTANG</b>\n`;
          if (totalDebt > 0) msg += `🔴 Hutang : <b>Rp ${fmtNum(totalDebt)}</b> (${debts.length} aktif)\n`;
          if (totalRec  > 0) msg += `💚 Piutang: <b>Rp ${fmtNum(totalRec)}</b> (${receivables.length} aktif)\n`;
        }

        // Peringatan
        if (overdue.length > 0) {
          msg += `\n🚨 <b>HUTANG SUDAH LEWAT JATUH TEMPO!</b>\n`;
          for (const d of overdue.slice(0,3)) {
            msg += `• ${escHtml(d.creditor_name)}: <b>Rp ${fmtNum(d.remaining_amount)}</b> — ${d.due_date}\n`;
          }
        } else if (dueSoon.length > 0) {
          msg += `\n⚠️ <b>JATUH TEMPO ≤7 HARI:</b>\n`;
          for (const d of dueSoon.slice(0,3)) {
            msg += `• ${escHtml(d.creditor_name)}: <b>Rp ${fmtNum(d.remaining_amount)}</b> — ${d.due_date}\n`;
          }
        }

        // Transaksi hari ini
        if (todayTxns.length > 0) {
          const txNonTrf = todayTxns.filter(t => t.type !== 'transfer');
          if (txNonTrf.length > 0) {
            msg += `\n📝 <b>TRANSAKSI HARI INI (${txNonTrf.length})</b>\n`;
            for (const t of txNonTrf.slice(0,5)) {
              const ic = { income:'💚', expense:'🔴', saving:'💙', debt_payment:'🟡', receivable_receipt:'🟢' }[t.type] || '📌';
              const sign = t.type === 'income' || t.type === 'receivable_receipt' ? '+' : '-';
              msg += `${ic} ${escHtml(t.description || t.category_name || '-')} | ${sign}Rp ${fmtNum(t.amount)}\n`;
            }
            if (txNonTrf.length > 5) msg += `… +${txNonTrf.length - 5} transaksi lainnya\n`;
          }
        }

        msg += `\n⏰ Terkirim: ${fmtTime()}\n`;
        msg += `💡 Ketik /help untuk panduan bot.`;

        await sendMessage(chatId, msg);
      }
      return Response.json({ ok: true, sent: linkedUsers.length });
    }

    // ============================================================
    // MODE: transaction_created
    // ============================================================
    if (mode === 'transaction_created') {
      const targetUsers = changed_by_id
        ? linkedUsers.filter(u => u.id === changed_by_id)
        : linkedUsers;
      if (!targetUsers.length) return Response.json({ ok: true, skipped: 'user not linked' });

      const ts = fmtTime();

      for (const user of targetUsers) {
        if (!data) continue;
        let msg = '';

        // ── TRANSFER ──
        if (data.type === 'transfer') {
          if (data.reference !== 'TRANSFER-OUT') continue;
          const fromAfter = data.from_balance_after;
          const toAfter   = data.to_balance_after;
          msg  = `🔄 <b>TRANSFER ANTAR REKENING</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `📤 <b>Dari     :</b> ${escHtml(data.account_name || '-')}\n`;
          msg += `📥 <b>Ke       :</b> ${escHtml(data.to_account_name || '-')}\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💵 <b>Nominal  :</b> <b>${fmt(data.amount, data.currency)}</b>\n`;
          if (data.description) msg += `📝 <b>Ket.     :</b> ${escHtml(data.description)}\n`;
          msg += `📅 <b>Tanggal  :</b> ${fmtDate(data.date)}\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `📊 <b>Saldo Setelah Transfer:</b>\n`;
          if (fromAfter !== undefined) msg += `  📤 ${escHtml(data.account_name)}: <b>${fmt(fromAfter, data.currency)}</b>\n`;
          if (toAfter   !== undefined) msg += `  📥 ${escHtml(data.to_account_name)}: <b>${fmt(toAfter, data.currency)}</b>\n`;
          msg += `⏰ ${ts}`;
        }

        // ── PEMASUKAN ──
        else if (data.type === 'income') {
          const balAfter = data.account_balance_after;
          msg  = `💚 <b>PEMASUKAN BARU</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💳 <b>Rekening  :</b> ${escHtml(data.account_name || '-')}\n`;
          msg += `🏷️ <b>Kategori  :</b> ${escHtml(data.category_name || '-')}\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💵 <b>Nominal   :</b> <b>+ ${fmt(data.amount, data.currency)}</b>\n`;
          if (data.description) msg += `📝 <b>Ket.      :</b> ${escHtml(data.description)}\n`;
          msg += `📅 <b>Tanggal   :</b> ${fmtDate(data.date)}\n`;
          if (balAfter !== undefined) {
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `🏦 <b>Saldo ${escHtml(data.account_name)}:</b>\n`;
            msg += `   <b>${fmt(balAfter, data.currency)}</b>${balanceBar(balAfter, balAfter - data.amount)}\n`;
          }
          msg += `⏰ ${ts}`;
        }

        // ── PENGELUARAN ──
        else if (data.type === 'expense') {
          const balAfter = data.account_balance_after;
          msg  = `🔴 <b>PENGELUARAN BARU</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💳 <b>Rekening  :</b> ${escHtml(data.account_name || '-')}\n`;
          msg += `🏷️ <b>Kategori  :</b> ${escHtml(data.category_name || '-')}\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💵 <b>Nominal   :</b> <b>− ${fmt(data.amount, data.currency)}</b>\n`;
          if (data.description) msg += `📝 <b>Ket.      :</b> ${escHtml(data.description)}\n`;
          msg += `📅 <b>Tanggal   :</b> ${fmtDate(data.date)}\n`;
          if (balAfter !== undefined) {
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            const balBefore = balAfter + data.amount;
            msg += `🏦 <b>Saldo ${escHtml(data.account_name)}:</b>\n`;
            msg += `   <b>${fmt(balAfter, data.currency)}</b> ${balanceBar(balAfter, balBefore)}\n`;
          }
          msg += `⏰ ${ts}`;
        }

        // ── TABUNGAN ──
        else if (data.type === 'saving') {
          const balAfter = data.account_balance_after;
          msg  = `💙 <b>TABUNGAN DICATAT</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💳 <b>Rekening  :</b> ${escHtml(data.account_name || '-')}\n`;
          msg += `🎯 <b>Target    :</b> ${escHtml(data.saving_target_name || data.category_name || '-')}\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💵 <b>Nominal   :</b> <b>${fmt(data.amount, data.currency)}</b>\n`;
          if (data.description) msg += `📝 <b>Ket.      :</b> ${escHtml(data.description)}\n`;
          msg += `📅 <b>Tanggal   :</b> ${fmtDate(data.date)}\n`;
          if (data.saving_progress !== undefined) {
            msg += `📈 <b>Progress  :</b> ${fmtNum(data.saving_progress)}%\n`;
          }
          if (balAfter !== undefined) {
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `🏦 <b>Saldo ${escHtml(data.account_name)}:</b>\n`;
            msg += `   <b>${fmt(balAfter, data.currency)}</b>${balanceBar(balAfter, balAfter + data.amount)}\n`;
          }
          msg += `⏰ ${ts}`;
        }

        // ── BAYAR HUTANG ──
        else if (data.type === 'debt_payment') {
          const balAfter = data.account_balance_after;
          msg  = `🟡 <b>BAYAR HUTANG</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💳 <b>Rekening  :</b> ${escHtml(data.account_name || '-')}\n`;
          msg += `👤 <b>Kreditur  :</b> ${escHtml(data.creditor_name || data.description || '-')}\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💵 <b>Dibayar   :</b> <b>− ${fmt(data.amount, data.currency)}</b>\n`;
          if (data.remaining_debt !== undefined) msg += `📉 <b>Sisa Hutang:</b> ${fmt(data.remaining_debt, data.currency)}\n`;
          msg += `📅 <b>Tanggal   :</b> ${fmtDate(data.date)}\n`;
          if (balAfter !== undefined) {
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `🏦 <b>Saldo ${escHtml(data.account_name)}:</b>\n`;
            msg += `   <b>${fmt(balAfter, data.currency)}</b>${balanceBar(balAfter, balAfter + data.amount)}\n`;
          }
          msg += `⏰ ${ts}`;
        }

        // ── TERIMA PIUTANG ──
        else if (data.type === 'receivable_receipt') {
          const balAfter = data.account_balance_after;
          msg  = `🟢 <b>TERIMA PIUTANG</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💳 <b>Rekening  :</b> ${escHtml(data.account_name || '-')}\n`;
          msg += `👤 <b>Dari      :</b> ${escHtml(data.debtor_name || data.description || '-')}\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💵 <b>Diterima  :</b> <b>+ ${fmt(data.amount, data.currency)}</b>\n`;
          if (data.remaining_receivable !== undefined) msg += `📉 <b>Sisa Piutang:</b> ${fmt(data.remaining_receivable, data.currency)}\n`;
          msg += `📅 <b>Tanggal   :</b> ${fmtDate(data.date)}\n`;
          if (balAfter !== undefined) {
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `🏦 <b>Saldo ${escHtml(data.account_name)}:</b>\n`;
            msg += `   <b>${fmt(balAfter, data.currency)}</b>${balanceBar(balAfter, balAfter - data.amount)}\n`;
          }
          msg += `⏰ ${ts}`;
        }

        // ── MUTASI SALDO MANUAL (penambahan saldo langsung) ──
        else if (data.type === 'balance_update' || data.type === 'account_topup') {
          const balAfter  = data.new_balance;
          const balBefore = data.old_balance;
          const diff = (balAfter || 0) - (balBefore || 0);
          msg  = `🏦 <b>MUTASI SALDO REKENING</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `💳 <b>Rekening  :</b> ${escHtml(data.account_name || '-')}\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `📊 <b>Saldo Lama :</b> ${fmt(balBefore, data.currency)}\n`;
          msg += `💵 <b>Perubahan  :</b> <b>${diff >= 0 ? '+' : ''}${fmt(diff, data.currency)}</b>\n`;
          msg += `💰 <b>Saldo Baru :</b> <b>${fmt(balAfter, data.currency)}</b>\n`;
          if (data.description) msg += `📝 <b>Ket.       :</b> ${escHtml(data.description)}\n`;
          msg += `⏰ ${ts}`;
        }

        if (msg) await sendMessage(user.telegram_chat_id, msg);
      }
      return Response.json({ ok: true });
    }

    // ============================================================
    // MODE: entity_change (legacy)
    // ============================================================
    if (mode === 'entity_change') {
      const { entity_name, event_type } = body;
      const targetUsers = changed_by_id
        ? linkedUsers.filter(u => u.id === changed_by_id)
        : linkedUsers;
      if (!targetUsers.length) return Response.json({ ok: true, skipped: 'user not linked' });

      const ts = fmtTime();
      const eventLabels  = { create:'✅ Ditambahkan', update:'✏️ Diperbarui', delete:'🗑️ Dihapus' };
      const entityLabels = { Account:'Rekening', Debt:'Hutang', Receivable:'Piutang', SavingTarget:'Target Tabungan' };

      for (const user of targetUsers) {
        let msg = `🔔 <b>${eventLabels[event_type] || event_type}: ${entityLabels[entity_name] || escHtml(entity_name)}</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        if (entity_name === 'Account' && data) {
          msg += `🏦 ${escHtml(data.name)}\n`;
          msg += `💰 Saldo: <b>${fmt(data.current_balance, data.currency || 'IDR')}</b>\n`;
        } else if (entity_name === 'Debt' && data) {
          msg += `👤 ${escHtml(data.creditor_name)}\n`;
          msg += `💵 Sisa: <b>${fmt(data.remaining_amount, data.currency)}</b>\n`;
          if (data.due_date) msg += `📅 Jatuh Tempo: ${fmtDate(data.due_date)}\n`;
        } else if (entity_name === 'Receivable' && data) {
          msg += `👤 ${escHtml(data.debtor_name)}\n`;
          msg += `💵 Sisa: <b>${fmt(data.remaining_amount, data.currency)}</b>\n`;
          if (data.due_date) msg += `📅 Jatuh Tempo: ${fmtDate(data.due_date)}\n`;
        }
        msg += `⏰ ${ts}`;
        await sendMessage(user.telegram_chat_id, msg);
      }
      return Response.json({ ok: true });
    }

    return Response.json({ ok: true, skipped: 'unknown mode' });

  } catch (error) {
    console.error('sendTelegramNotif error:', error?.message);
    return Response.json({ error: 'Notification failed' }, { status: 500 });
  }
}