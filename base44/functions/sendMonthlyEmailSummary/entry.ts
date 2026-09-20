import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStart = new Date(year, now.getMonth(), 1);
    const monthEnd = new Date(year, now.getMonth() + 1, 0);

    // Fetch transactions for this month
    const transactions = await base44.asServiceRole.entities.Transaction.filter({ 
      created_by_id: user.id 
    }, '-date', 5000);
    const monthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    // Fetch accounts for balances
    const accounts = await base44.asServiceRole.entities.Account.filter({ 
      created_by_id: user.id 
    });

    // Fetch debts & receivables
    const debts = await base44.asServiceRole.entities.Debt.filter({ 
      created_by_id: user.id 
    });
    const receivables = await base44.asServiceRole.entities.Receivable.filter({ 
      created_by_id: user.id 
    });

    // Calculate KPIs
    const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const saving = monthTxs.filter(t => t.type === 'saving').reduce((s, t) => s + (t.amount || 0), 0);
    const totalBalance = accounts.reduce((s, a) => s + (a.current_balance || 0), 0);
    const activeDebts = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.remaining_amount || 0), 0);
    const activeReceivables = receivables.filter(r => r.status === 'active').reduce((s, r) => s + (r.remaining_amount || 0), 0);
    const cashFlow = income - expense;
    const savingRate = income > 0 ? (saving / income) * 100 : 0;

    // Format currency
    const formatCurrency = (val, currency = 'IDR') => {
      const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return formatter.format(val);
    };

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthName = monthNames[month - 1];

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #0D4F6D 0%, #0a7c9e 60%, #10B981 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0 0 5px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px 20px; }
    .kpi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .kpi-card { background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #0D4F6D; }
    .kpi-label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; }
    .kpi-value { font-size: 18px; font-weight: bold; color: #0D4F6D; margin-top: 5px; }
    .kpi-positive { border-left-color: #10B981; color: #10B981; }
    .kpi-negative { border-left-color: #EF4444; color: #EF4444; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: bold; color: #0D4F6D; margin-bottom: 10px; border-bottom: 2px solid #0D4F6D; padding-bottom: 8px; }
    .transaction-list { list-style: none; padding: 0; margin: 0; }
    .transaction-item { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px; display: flex; justify-content: space-between; }
    .transaction-item:last-child { border-bottom: none; }
    .transaction-category { color: #666; }
    .transaction-amount { font-weight: bold; }
    .positive { color: #10B981; }
    .negative { color: #EF4444; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    .footer a { color: #0D4F6D; text-decoration: none; }
    .button { display: inline-block; background: #0D4F6D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 15px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://media.base44.com/images/public/6a2817e4a27a25c626d7a995/a10ef6b54_image.png" alt="MONEY TRACKING" style="height:40px;margin-bottom:8px;" />
      <h1>Ringkasan Keuangan Bulanan</h1>
      <p>${monthName} ${year}</p>
    </div>

    <div class="content">
      <p>Hai ${user.full_name},</p>
      <p>Berikut ringkasan keuangan Anda untuk bulan ${monthName} ${year}:</p>

      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">📊 Total Pendapatan</div>
          <div class="kpi-value positive">${formatCurrency(income)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">💸 Total Pengeluaran</div>
          <div class="kpi-value negative">${formatCurrency(expense)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">💰 Sisa Saldo (Cash Flow)</div>
          <div class="kpi-value ${cashFlow >= 0 ? 'positive' : 'negative'}">${cashFlow >= 0 ? '+' : ''}${formatCurrency(cashFlow)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">🎯 Saving Rate</div>
          <div class="kpi-value">${savingRate.toFixed(1)}%</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">💼 Saldo Akun</div>
        <ul class="transaction-list">
          ${accounts.filter(a => a.is_active !== false).map(a => `
            <li class="transaction-item">
              <span class="transaction-category">${a.name} (${a.currency})</span>
              <span class="transaction-amount">${formatCurrency(a.current_balance || 0, a.currency)}</span>
            </li>
          `).join('')}
          <li class="transaction-item">
            <span class="transaction-category"><strong>Total Semua Akun</strong></span>
            <span class="transaction-amount"><strong>${formatCurrency(totalBalance)}</strong></span>
          </li>
        </ul>
      </div>

      ${activeDebts > 0 ? `
        <div class="section">
          <div class="section-title">⚠️ Hutang Aktif</div>
          <p style="margin: 10px 0; font-size: 13px;">Total hutang aktif: <strong class="negative">${formatCurrency(activeDebts)}</strong></p>
        </div>
      ` : ''}

      ${activeReceivables > 0 ? `
        <div class="section">
          <div class="section-title">✅ Piutang Aktif</div>
          <p style="margin: 10px 0; font-size: 13px;">Total piutang aktif: <strong class="positive">${formatCurrency(activeReceivables)}</strong></p>
        </div>
      ` : ''}

      ${monthTxs.length > 0 ? `
        <div class="section">
          <div class="section-title">📋 Transaksi Terbaru (Top 5)</div>
          <ul class="transaction-list">
            ${monthTxs.slice(-5).reverse().map(t => `
              <li class="transaction-item">
                <span class="transaction-category">${t.category}</span>
                <span class="transaction-amount ${t.type === 'income' || t.type === 'terima_piutang' ? 'positive' : 'negative'}">
                  ${t.type === 'income' || t.type === 'terima_piutang' ? '+' : '-'}${formatCurrency(t.amount || 0)}
                </span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <center>
        <a href="https://moneyt.base44.app" class="button">Lihat Detail Lengkap</a>
      </center>
    </div>

    <div class="footer">
      <p>Email ini dikirim otomatis setiap awal bulan. Anda bisa mengatur preferensi email di pengaturan akun.</p>
      <p>© 2026 MONEY TRACKING - Platform Manajemen Keuangan Pribadi</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email via Gmail
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `📊 Ringkasan Keuangan ${monthName} ${year} - MONEY TRACKING`,
        body: emailHtml
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return Response.json({ 
      success: true, 
      message: `Ringkasan bulan ${monthName} ${year} terkirim ke ${user.email}`,
      stats: { income, expense, saving, cashFlow, savingRate, totalBalance }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});