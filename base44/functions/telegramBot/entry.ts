import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId, text, parseMode = 'HTML') {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true }),
  });
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

// Format: 500000 / USD 100 / 100 USD
function parseAmount(str) {
  const clean = str.replace(/[.,\s]/g, '').toUpperCase();
  const currencies = ['IDR', 'USD', 'SAR', 'JPY', 'EUR', 'SGD', 'MYR', 'AUD', 'GBP'];
  let currency = 'IDR';
  let numStr = clean;
  for (const c of currencies) {
    if (clean.startsWith(c)) { currency = c; numStr = clean.slice(c.length); break; }
    if (clean.endsWith(c)) { currency = c; numStr = clean.slice(0, -c.length); break; }
  }
  const amount = parseFloat(numStr);
  return isNaN(amount) ? null : { amount, currency };
}

// Cari rekening berdasarkan keyword @nama atau nama yang cocok
function findAccount(accounts, keyword) {
  if (!keyword) return accounts[0] || null;
  const kw = keyword.toLowerCase().replace('@', '').trim();
  return accounts.find(a => a.name.toLowerCase().includes(kw)) || null;
}

// Parse tanggal: today/hari ini/kemarin/yesterday/YYYY-MM-DD/DD-MM-YYYY
function parseDate(str) {
  if (!str) return new Date().toISOString().split('T')[0];
  const s = str.toLowerCase().trim();
  if (['today', 'hari ini', 'sekarang'].includes(s)) return new Date().toISOString().split('T')[0];
  if (['yesterday', 'kemarin'].includes(s)) {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  const dmy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  const ymd = str.match(/^\d{4}-\d{2}-\d{2}$/);
  if (ymd) return str;
  return new Date().toISOString().split('T')[0];
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const HELP_TEXT = `🤖 <b>MONEY TRACKING Bot</b>
━━━━━━━━━━━━━━━━━━━━

📊 <b>CEK SALDO &amp; RINGKASAN</b>
<code>/saldo</code> — Saldo semua rekening
<code>/saldo BCA</code> — Saldo rekening tertentu
<code>/rekening</code> — Daftar semua rekeningmu
<code>/ringkasan</code> — Ringkasan keuangan bulan ini
<code>/hutanglist</code> — Daftar hutang aktif
<code>/piutanglist</code> — Daftar piutang aktif

━━━━━━━━━━━━━━━━━━━━
💸 <b>CATAT TRANSAKSI</b>
<code>/income 500000 Gaji</code> — ke rekening pertama
<code>/income 500000 Gaji @BCA</code> — ke rekening BCA
<code>/expense 150000 Makan @OVO</code> — dari rekening OVO
<code>/saving 200000 Dana darurat @Mandiri</code>

📌 Alias Indonesia:
<code>/pemasukan</code> · <code>/pengeluaran</code> · <code>/tabungan</code>

📌 Cara pilih rekening: tambahkan <b>@NamaRekening</b> di akhir
Contoh: <code>/pemasukan 100000 Gaji @BCA</code>
Nama tidak harus persis — cukup sebagian: <code>@bca</code>, <code>@ovo</code>, <code>@mandiri</code>

━━━━━━━━━━━━━━━━━━━━
💳 <b>HUTANG &amp; PIUTANG</b>
<code>/hutang 1000000 BRI jt 2026-12-31</code>
<code>/piutang 500000 Ani jt 2026-08-15</code>

Kata kunci jatuh tempo: <code>jt</code> / <code>jatuh tempo</code> / <code>due</code>

━━━━━━━━━━━━━━━━━━━━
🌍 <b>MATA UANG ASING</b>
<code>/income USD 100 Freelance @BCA</code>
<code>/expense SAR 200 Belanja @BRI</code>
Tersedia: USD · EUR · SAR · JPY · SGD · MYR

━━━━━━━━━━━━━━━━━━━━
📅 <b>CUSTOM TANGGAL</b> (di akhir perintah, sebelum @rekening)
<code>tanggal kemarin</code>
<code>tanggal 2026-06-10</code>
<code>tgl 15-06-2026</code>

💡 Ketik /help kapan saja untuk melihat panduan ini.
💡 Ketik /rekening untuk melihat daftar rekeningmu.`;

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    const expectedSecret = BOT_TOKEN?.slice(-10);
    if (secret !== expectedSecret) {
      console.warn('Invalid secret');
      return Response.json({ ok: true });
    }

    const body = await req.json();
    const message = body?.message;
    if (!message?.text) return Response.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.trim();
    const telegramUserId = String(message.from?.id);

    const base44 = createClientFromRequest(req);
    const allUsers = await base44.asServiceRole.entities.User.list();
    const linkedUser = allUsers.find(u => u.telegram_chat_id === telegramUserId);

    // ── /start atau /link ──
    if (text.startsWith('/start') || text.startsWith('/link')) {
      if (linkedUser) {
        await sendMessage(chatId,
          `✅ <b>Akun Terhubung!</b>\n\nHalo, <b>${escHtml(linkedUser.full_name || linkedUser.email)}</b>!\n\nKamu sudah bisa menggunakan semua fitur bot. Ketik /help untuk melihat daftar perintah lengkap.`
        );
      } else {
        await sendMessage(chatId,
          `👋 <b>Selamat Datang di MONEY TRACKING Bot!</b>\n\n` +
          `Untuk menghubungkan akun:\n\n` +
          `1️⃣ Buka <b>MONEY TRACKING → Pengaturan → Telegram Bot</b>\n` +
          `2️⃣ Masukkan kode ini di kolom Telegram ID:\n\n` +
          `<code>${telegramUserId}</code>\n\n` +
          `3️⃣ Klik <b>Hubungkan</b>\n\n` +
          `Setelah terhubung, kamu bisa catat transaksi dan cek saldo langsung dari Telegram!`
        );
      }
      return Response.json({ ok: true });
    }

    if (!linkedUser) {
      await sendMessage(chatId,
        `⚠️ <b>Akun belum terhubung.</b>\n\nKetik /start untuk instruksi menghubungkan akun MONEY TRACKING ke Telegram.`
      );
      return Response.json({ ok: true });
    }

    const userId = linkedUser.id;
    const userName = escHtml(linkedUser.full_name || 'Kamu');

    // ── /help ──
    if (text.startsWith('/help')) {
      await sendMessage(chatId, HELP_TEXT);
      return Response.json({ ok: true });
    }

    // ── /rekening — daftar semua rekening user ──
    if (text.startsWith('/rekening')) {
      const allAccounts = await base44.asServiceRole.entities.Account.filter({ created_by_id: userId });
      const accounts = allAccounts.filter(a => a.is_active !== false);
      if (!accounts.length) {
        await sendMessage(chatId, `📭 <b>Belum ada rekening terdaftar.</b>\n\nBuka menu <b>Saldo Akun</b> di MONEY TRACKING untuk menambahkan rekening.`);
        return Response.json({ ok: true });
      }
      const now = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      let msg = `🏦 <b>Daftar Rekeningmu</b>\n🕐 ${now}\n━━━━━━━━━━━━━━━━━━━━\n`;
      accounts.forEach((acc, i) => {
        const bal = acc.current_balance || 0;
        const icon = bal < 0 ? '🔴' : bal === 0 ? '⚪' : '💚';
        msg += `${i + 1}. ${icon} <b>${escHtml(acc.name)}</b> (${acc.currency})\n`;
        msg += `    Saldo: <b>${fmt(bal, acc.currency)}</b>\n`;
      });
      msg += `\n💡 Gunakan <code>@NamaRekening</code> saat transaksi\nContoh: <code>/pemasukan 500000 Gaji @${escHtml(accounts[0].name)}</code>`;
      await sendMessage(chatId, msg);
      return Response.json({ ok: true });
    }

    // ── /saldo [keyword opsional] ──
    if (text.startsWith('/saldo')) {
      const allAccounts = await base44.asServiceRole.entities.Account.filter({ created_by_id: userId });
      const accounts = allAccounts.filter(a => a.is_active !== false);

      if (!accounts.length) {
        await sendMessage(chatId,
          `📭 <b>Belum ada rekening terdaftar.</b>\n\nBuka menu <b>Saldo Akun</b> di MONEY TRACKING untuk menambahkan rekening pertama kamu.`
        );
        return Response.json({ ok: true });
      }

      const keyword = text.replace(/^\/saldo\s*/i, '').trim().toLowerCase();
      const filtered = keyword ? accounts.filter(a => a.name.toLowerCase().includes(keyword)) : accounts;

      if (keyword && !filtered.length) {
        await sendMessage(chatId,
          `❓ Tidak ada rekening dengan nama "<b>${escHtml(keyword)}</b>".\n\nKetik <code>/saldo</code> untuk melihat semua rekening.`
        );
        return Response.json({ ok: true });
      }

      const now = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      let msg = keyword
        ? `💳 <b>Saldo Rekening "${escHtml(keyword.toUpperCase())}"</b>\n`
        : `🏦 <b>Saldo Semua Rekening</b>\n`;
      msg += `🕐 ${now}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;

      let totalIDR = 0;
      for (const acc of filtered) {
        const bal = acc.current_balance || 0;
        const icon = bal < 0 ? '🔴' : bal === 0 ? '⚪' : '✅';
        msg += `${icon} <b>${escHtml(acc.name)}</b>\n`;
        msg += `   💰 <b>${fmt(bal, acc.currency)}</b>\n`;
        if (acc.currency === 'IDR') totalIDR += bal;
      }

      if (filtered.filter(a => a.currency === 'IDR').length > 1) {
        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `💵 <b>Total IDR: ${fmt(totalIDR)}</b>\n`;
      }

      msg += `\n💡 <code>/saldo BCA</code> untuk filter rekening tertentu`;
      await sendMessage(chatId, msg);
      return Response.json({ ok: true });
    }

    // ── /ringkasan ──
    if (text.startsWith('/ringkasan')) {
      const now = new Date();
      const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0');
      const startDate = `${y}-${m}-01`;
      const today = now.toISOString().split('T')[0];
      const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

      const [txns, accounts] = await Promise.all([
        base44.asServiceRole.entities.Transaction.filter({ created_by_id: userId }),
        base44.asServiceRole.entities.Account.filter({ created_by_id: userId }),
      ]);

      const monthly = txns.filter(t => t.date >= startDate && t.date <= today);
      const income = monthly.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
      const expense = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
      const saving = monthly.filter(t => t.type === 'saving').reduce((s, t) => s + (t.amount || 0), 0);
      const debtPay = monthly.filter(t => t.type === 'debt_payment').reduce((s, t) => s + (t.amount || 0), 0);
      const transfers = monthly.filter(t => t.type === 'transfer' && t.reference === 'TRANSFER-OUT');
      const totalTransfer = transfers.reduce((s, t) => s + (t.amount || 0), 0);
      const cashFlow = income - expense - saving - debtPay;

      const activeAccounts = accounts.filter(a => a.is_active !== false && a.currency === 'IDR');
      const totalSaldo = activeAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);

      let msg = `📊 <b>Ringkasan Keuangan</b>\n`;
      msg += `📅 ${escHtml(monthName)}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💚 Pemasukan   : <b>Rp ${fmtNum(income)}</b>\n`;
      msg += `🔴 Pengeluaran : <b>Rp ${fmtNum(expense)}</b>\n`;
      msg += `💙 Tabungan    : <b>Rp ${fmtNum(saving)}</b>\n`;
      if (debtPay > 0) msg += `🟡 Bayar Hutang : <b>Rp ${fmtNum(debtPay)}</b>\n`;
      if (totalTransfer > 0) msg += `🔄 Transfer     : <b>Rp ${fmtNum(totalTransfer)}</b> (${transfers.length}x)\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `${cashFlow >= 0 ? '✅' : '⚠️'} Cash Flow     : <b>Rp ${fmtNum(cashFlow)}</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      if (activeAccounts.length > 0) {
        msg += `🏦 Total Saldo IDR: <b>Rp ${fmtNum(totalSaldo)}</b>\n`;
      }
      msg += `\n📝 Total transaksi bulan ini: <b>${monthly.length}</b>`;

      await sendMessage(chatId, msg);
      return Response.json({ ok: true });
    }

    // ── /hutanglist ──
    if (text.startsWith('/hutanglist')) {
      const debts = await base44.asServiceRole.entities.Debt.filter({ created_by_id: userId, status: 'active' });
      if (!debts.length) {
        await sendMessage(chatId, `✅ <b>Tidak ada hutang aktif.</b>\n\nSemua hutang sudah lunas!`);
        return Response.json({ ok: true });
      }
      const total = debts.reduce((s, d) => s + (d.remaining_amount || 0), 0);
      const now = new Date();
      let msg = `💳 <b>Daftar Hutang Aktif</b>\n`;
      msg += `📊 ${debts.length} hutang · Total: <b>Rp ${fmtNum(total)}</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      for (const d of debts) {
        const sisa = fmt(d.remaining_amount || 0, d.currency);
        const isOverdue = d.due_date && new Date(d.due_date) < now;
        const isDueSoon = d.due_date && !isOverdue && (new Date(d.due_date) - now) < 7 * 24 * 3600 * 1000;
        const statusIcon = isOverdue ? '🔴' : isDueSoon ? '⚠️' : '🟡';
        msg += `${statusIcon} <b>${escHtml(d.creditor_name)}</b>\n`;
        msg += `   💰 Sisa: <b>${sisa}</b>\n`;
        if (d.due_date) {
          msg += `   📅 Jatuh tempo: ${formatDate(d.due_date)}`;
          if (isOverdue) msg += ` <b>(LEWAT!)</b>`;
          else if (isDueSoon) msg += ` <b>(Segera!)</b>`;
          msg += `\n`;
        }
      }
      msg += `\n💡 Catat pembayaran hutang di menu <b>Transaksi → Bayar Hutang</b>`;
      await sendMessage(chatId, msg);
      return Response.json({ ok: true });
    }

    // ── /piutanglist ──
    if (text.startsWith('/piutanglist')) {
      const recs = await base44.asServiceRole.entities.Receivable.filter({ created_by_id: userId, status: 'active' });
      if (!recs.length) {
        await sendMessage(chatId, `✅ <b>Tidak ada piutang aktif.</b>\n\nSemua piutang sudah diterima!`);
        return Response.json({ ok: true });
      }
      const total = recs.reduce((s, r) => s + (r.remaining_amount || 0), 0);
      const now = new Date();
      let msg = `💰 <b>Daftar Piutang Aktif</b>\n`;
      msg += `📊 ${recs.length} piutang · Total: <b>Rp ${fmtNum(total)}</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      for (const r of recs) {
        const sisa = fmt(r.remaining_amount || 0, r.currency);
        const isOverdue = r.due_date && new Date(r.due_date) < now;
        const isDueSoon = r.due_date && !isOverdue && (new Date(r.due_date) - now) < 7 * 24 * 3600 * 1000;
        const statusIcon = isOverdue ? '🔴' : isDueSoon ? '⚠️' : '💚';
        msg += `${statusIcon} <b>${escHtml(r.debtor_name)}</b>\n`;
        msg += `   💰 Sisa: <b>${sisa}</b>\n`;
        if (r.due_date) {
          msg += `   📅 Jatuh tempo: ${formatDate(r.due_date)}`;
          if (isOverdue) msg += ` <b>(LEWAT!)</b>`;
          else if (isDueSoon) msg += ` <b>(Segera!)</b>`;
          msg += `\n`;
        }
      }
      msg += `\n💡 Catat penerimaan di menu <b>Transaksi → Terima Piutang</b>`;
      await sendMessage(chatId, msg);
      return Response.json({ ok: true });
    }

    // ── Catat Transaksi: /income /expense /saving + alias ──
    const txMatch = text.match(/^\/(income|expense|saving|pemasukan|pengeluaran|tabungan)\s+(.+)/i);
    if (txMatch) {
      const cmdRaw = txMatch[1].toLowerCase();
      const typeMap = { income: 'income', pemasukan: 'income', expense: 'expense', pengeluaran: 'expense', saving: 'saving', tabungan: 'saving' };
      const txType = typeMap[cmdRaw];
      const typeLabel = { income: '💚 PEMASUKAN', expense: '🔴 PENGELUARAN', saving: '💙 TABUNGAN' }[txType];
      let rest = txMatch[2].trim();

      // Extract @rekening di akhir kalimat (setelah semua token lain)
      let accountKeyword = null;
      const accMatch = rest.match(/\s+@(\S+)$/i);
      if (accMatch) {
        accountKeyword = accMatch[1];
        rest = rest.slice(0, accMatch.index).trim();
      }

      // Extract tanggal opsional (tanggal/tgl) di akhir
      let dateStr = null;
      let descAndAmount = rest;
      const dateMatch = rest.match(/\s+(?:tanggal|tgl)\s+(\S+)$/i);
      if (dateMatch) {
        dateStr = parseDate(dateMatch[1]);
        descAndAmount = rest.slice(0, dateMatch.index).trim();
      }

      const tokens = descAndAmount.split(/\s+/);
      const parsed = parseAmount(tokens[0]);
      if (!parsed) {
        await sendMessage(chatId,
          `❌ <b>Format tidak valid.</b>\n\nContoh:\n` +
          `<code>/${cmdRaw} 150000 Makan siang</code>\n` +
          `<code>/${cmdRaw} 150000 Makan siang @BCA</code>\n` +
          `<code>/${cmdRaw} USD 50 Belanja @OVO</code>\n\n` +
          `💡 Ketik /rekening untuk melihat daftar rekening kamu.`
        );
        return Response.json({ ok: true });
      }
      const description = tokens.slice(1).join(' ') || '-';
      const txDate = dateStr || new Date().toISOString().split('T')[0];

      const allAccounts = await base44.asServiceRole.entities.Account.filter({ created_by_id: userId });
      const accounts = allAccounts.filter(a => a.is_active !== false);
      if (!accounts.length) {
        await sendMessage(chatId,
          `⚠️ <b>Belum ada rekening terdaftar.</b>\n\nBuka menu <b>Saldo Akun</b> di MONEY TRACKING dan tambahkan rekening terlebih dahulu.`
        );
        return Response.json({ ok: true });
      }

      // Cari rekening berdasarkan @keyword atau gunakan rekening pertama
      const account = findAccount(accounts, accountKeyword);
      if (!account) {
        const listRek = accounts.map((a, i) => `${i + 1}. <code>@${escHtml(a.name)}</code>`).join('\n');
        await sendMessage(chatId,
          `❓ <b>Rekening "@${escHtml(accountKeyword)}" tidak ditemukan.</b>\n\n` +
          `Rekening yang tersedia:\n${listRek}\n\n` +
          `Contoh: <code>/${cmdRaw} ${fmtNum(parsed.amount)} ${escHtml(description)} @${escHtml(accounts[0].name)}</code>`
        );
        return Response.json({ ok: true });
      }

      const categories = await base44.asServiceRole.entities.Category.filter({ created_by_id: userId, type: txType, is_active: true });
      const category = categories[0] || null;

      await base44.asServiceRole.entities.Transaction.create({
        date: txDate,
        type: txType,
        amount: parsed.amount,
        currency: parsed.currency,
        description,
        account_id: account.id,
        account_name: account.name,
        category_id: category?.id || '',
        category_name: category?.name || '-',
        created_by_id: userId,
      });

      const currentBal = account.current_balance || 0;
      const newBal = txType === 'income' ? currentBal + parsed.amount : currentBal - parsed.amount;
      await base44.asServiceRole.entities.Account.update(account.id, { current_balance: newBal });

      const sign = txType === 'income' ? '+' : '−';
      const accountInfo = accountKeyword ? ` ✓` : ` (rekening pertama)`;
      let msg = `✅ <b>Transaksi Berhasil Dicatat!</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `${typeLabel}\n`;
      msg += `💵 Nominal   : <b>${sign} ${fmt(parsed.amount, parsed.currency)}</b>\n`;
      msg += `📝 Keterangan: ${escHtml(description)}\n`;
      msg += `📅 Tanggal   : ${formatDate(txDate)}\n`;
      msg += `🏦 Rekening  : <b>${escHtml(account.name)}</b>${accountInfo}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💰 Saldo ${escHtml(account.name)}: <b>${fmt(newBal, account.currency)}</b>\n`;
      msg += `\n💡 Ketik /rekening untuk lihat semua saldo`;

      await sendMessage(chatId, msg);
      return Response.json({ ok: true });
    }

    // ── /hutang (catat hutang baru) ──
    const hutangMatch = text.match(/^\/hutang\s+(.+)/i);
    if (hutangMatch) {
      const parts = hutangMatch[1].split(/\s+/);
      const parsed = parseAmount(parts[0]);
      if (!parsed) {
        await sendMessage(chatId,
          `❌ <b>Format tidak valid.</b>\n\nContoh:\n<code>/hutang 1000000 BRI jt 2026-12-31</code>\n<code>/hutang 500000 Pak Budi</code>`
        );
        return Response.json({ ok: true });
      }
      const rest = parts.slice(1).join(' ');
      const jatuhMatch = rest.match(/(?:jatuh tempo|jt|due)\s+(\S+)/i);
      const dueDate = jatuhMatch ? parseDate(jatuhMatch[1]) : null;
      const creditorName = rest.replace(/(?:jatuh tempo|jt|due)\s+\S+/i, '').trim() || 'Tidak diketahui';

      await base44.asServiceRole.entities.Debt.create({
        creditor_name: creditorName,
        total_amount: parsed.amount,
        remaining_amount: parsed.amount,
        currency: parsed.currency,
        due_date: dueDate,
        status: 'active',
        created_by_id: userId,
      });

      let msg = `✅ <b>Hutang Berhasil Dicatat!</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🟡 HUTANG BARU\n`;
      msg += `👤 Kepada    : <b>${escHtml(creditorName)}</b>\n`;
      msg += `💵 Jumlah    : <b>${fmt(parsed.amount, parsed.currency)}</b>\n`;
      msg += dueDate ? `📅 Jatuh Tempo: <b>${formatDate(dueDate)}</b>\n` : `📅 Jatuh Tempo: -\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💡 Lihat daftar hutang: <code>/hutanglist</code>`;

      await sendMessage(chatId, msg);
      return Response.json({ ok: true });
    }

    // ── /piutang (catat piutang baru) ──
    const piutangMatch = text.match(/^\/piutang\s+(.+)/i);
    if (piutangMatch) {
      const parts = piutangMatch[1].split(/\s+/);
      const parsed = parseAmount(parts[0]);
      if (!parsed) {
        await sendMessage(chatId,
          `❌ <b>Format tidak valid.</b>\n\nContoh:\n<code>/piutang 500000 Ani jt 2026-08-15</code>\n<code>/piutang 200000 Budi</code>`
        );
        return Response.json({ ok: true });
      }
      const rest = parts.slice(1).join(' ');
      const jatuhMatch = rest.match(/(?:jatuh tempo|jt|due)\s+(\S+)/i);
      const dueDate = jatuhMatch ? parseDate(jatuhMatch[1]) : null;
      const debtorName = rest.replace(/(?:jatuh tempo|jt|due)\s+\S+/i, '').trim() || 'Tidak diketahui';

      await base44.asServiceRole.entities.Receivable.create({
        debtor_name: debtorName,
        total_amount: parsed.amount,
        remaining_amount: parsed.amount,
        currency: parsed.currency,
        due_date: dueDate,
        status: 'active',
        created_by_id: userId,
      });

      let msg = `✅ <b>Piutang Berhasil Dicatat!</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💚 PIUTANG BARU\n`;
      msg += `👤 Dari      : <b>${escHtml(debtorName)}</b>\n`;
      msg += `💵 Jumlah    : <b>${fmt(parsed.amount, parsed.currency)}</b>\n`;
      msg += dueDate ? `📅 Jatuh Tempo: <b>${formatDate(dueDate)}</b>\n` : `📅 Jatuh Tempo: -\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💡 Lihat daftar piutang: <code>/piutanglist</code>`;

      await sendMessage(chatId, msg);
      return Response.json({ ok: true });
    }

    // Default: perintah tidak dikenali
    await sendMessage(chatId,
      `❓ <b>Perintah tidak dikenali.</b>\n\nKetik /help untuk melihat daftar semua perintah yang tersedia.`
    );
    return Response.json({ ok: true });

  } catch (error) {
    console.error('Telegram bot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});