import { calcKPIs, calcFinancialScore, groupByCategory, filterTransactionsByPeriod } from '@/lib/utils/finance';

const dayDiff = (date) => Math.ceil((new Date(date) - new Date(new Date().toDateString())) / 86400000);

export function buildReport({ transactions = [], accounts = [], debts = [], receivables = [], budget = null, year, month }) {
  const period = filterTransactionsByPeriod(transactions, year, month);
  const kpis = calcKPIs(period);
  const activeAccounts = accounts.filter(a => a.is_active !== false);
  const totalBalance = activeAccounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  const activeDebts = debts.filter(d => d.status === 'active');
  const activeReceivables = receivables.filter(r => r.status === 'active');
  const totalDebt = activeDebts.reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const totalReceivable = activeReceivables.reduce((s, r) => s + (r.remaining_amount || 0), 0);
  const dueItems = [
    ...activeDebts.map(d => ({ kind: 'debt', name: d.creditor_name, amount: d.remaining_amount || 0, due: d.due_date, currency: d.currency })),
    ...activeReceivables.map(r => ({ kind: 'receivable', name: r.debtor_name, amount: r.remaining_amount || 0, due: r.due_date, currency: r.currency })),
  ].filter(x => x.due).map(x => ({ ...x, days: dayDiff(x.due) })).sort((a, b) => a.days - b.days);
  const budgetRows = budget ? ['income', 'expense', 'saving'].flatMap(group => (budget[group] || []).map(b => {
    const actual = period.filter(t => t.type === group && t.category_name === b.name).reduce((s, t) => s + (t.amount || 0), 0);
    return { group, name: b.name, budget: Number(b.budget || 0), actual, diff: Number(b.budget || 0) - actual };
  })) : [];
  const debtRatio = kpis.income > 0 ? (totalDebt / kpis.income) * 100 : 0;
  const score = calcFinancialScore(kpis.cashFlow, kpis.savingRate, debtRatio);
  return {
    year, month, period, kpis, debtRatio, score,
    expenseByCategory: groupByCategory(period.filter(t => t.type === 'expense')),
    incomeByCategory: groupByCategory(period.filter(t => t.type === 'income')),
    accounts: activeAccounts, totalBalance, activeDebts, activeReceivables, totalDebt, totalReceivable, dueItems, budgetRows,
  };
}

// Aggregates only — no descriptions, names, or account numbers leave the device.
export function reportToAiPayload(r) {
  return {
    period: { year: r.year, month: r.month || 'all' },
    income: r.kpis.income, expense: r.kpis.expense, saving: r.kpis.saving, cash_flow: r.kpis.cashFlow,
    saving_rate_pct: +r.kpis.savingRate.toFixed(1), debt_ratio_pct: +r.debtRatio.toFixed(1), baseline_score: r.score.score,
    total_balance: r.totalBalance, active_debt: r.totalDebt, active_receivable: r.totalReceivable,
    top_expenses: r.expenseByCategory.slice(0, 8).map(c => ({ category: c.name, total: c.total, count: c.count })),
    top_income: r.incomeByCategory.slice(0, 5).map(c => ({ category: c.name, total: c.total })),
    budget_over: r.budgetRows.filter(b => b.group === 'expense' && b.actual > b.budget && b.budget > 0).map(b => ({ category: b.name, budget: b.budget, actual: b.actual })),
    due_within_14_days: r.dueItems.filter(d => d.days <= 14).length,
    overdue: r.dueItems.filter(d => d.days < 0).length,
  };
}

export function localFinancialCheck(r) {
  const fmt = n => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
  const findings = [], recommendations = [];
  const top = r.expenseByCategory[0];
  if (top && r.kpis.expense > 0) {
    const pct = (top.total / r.kpis.expense) * 100;
    findings.push({ type: pct > 40 ? 'warning' : 'info', text: `Kategori "${top.name}" menyerap ${pct.toFixed(0)}% pengeluaran (${fmt(top.total)}).` });
    if (pct > 40) recommendations.push(`Tetapkan batas budget untuk "${top.name}" dan pantau tiap minggu.`);
  }
  if (r.kpis.cashFlow < 0) { findings.push({ type: 'danger', text: `Cash flow negatif ${fmt(Math.abs(r.kpis.cashFlow))}: pengeluaran melebihi pemasukan.` }); recommendations.push('Pangkas pengeluaran non-esensial hingga cash flow kembali positif.'); }
  else findings.push({ type: 'good', text: `Cash flow positif ${fmt(r.kpis.cashFlow)}.` });
  if (r.kpis.savingRate < 20) recommendations.push(`Saving rate ${r.kpis.savingRate.toFixed(1)}% — targetkan minimal 20% dari pemasukan.`);
  else findings.push({ type: 'good', text: `Saving rate ${r.kpis.savingRate.toFixed(1)}% sudah di atas target 20%.` });
  if (r.debtRatio >= 40) { findings.push({ type: 'danger', text: `Rasio hutang ${r.debtRatio.toFixed(0)}% terhadap pemasukan tergolong tinggi.` }); recommendations.push('Prioritaskan pelunasan hutang berbunga tertinggi terlebih dahulu.'); }
  const over = r.budgetRows.filter(b => b.group === 'expense' && b.budget > 0 && b.actual > b.budget);
  if (over.length) { findings.push({ type: 'warning', text: `${over.length} kategori melampaui budget: ${over.map(b => b.name).join(', ')}.` }); recommendations.push('Sesuaikan budget bulan depan atau kurangi realisasi pada kategori yang terlampaui.'); }
  const overdue = r.dueItems.filter(d => d.days < 0), soon = r.dueItems.filter(d => d.days >= 0 && d.days <= 14);
  if (overdue.length) findings.push({ type: 'danger', text: `${overdue.length} hutang/piutang sudah lewat jatuh tempo.` });
  if (soon.length) findings.push({ type: 'warning', text: `${soon.length} hutang/piutang jatuh tempo dalam 14 hari.` });
  if (!recommendations.length) recommendations.push('Pertahankan pola saat ini dan alokasikan surplus ke target tabungan.');
  return { score: r.score.score, label: r.score.label, summary: `Skor kesehatan keuangan ${r.score.score}/100 (${r.score.label}). Analisis berbasis aturan lokal.`, findings, recommendations };
}