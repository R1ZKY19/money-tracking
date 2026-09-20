// Currency formatting utilities
const BASE_CURRENCIES = {
  IDR: { symbol: 'Rp', name: 'Rupiah', locale: 'id-ID', decimals: 0 },
};

function buildCurrencies() {
  try {
    const custom = JSON.parse(localStorage.getItem('fincat_custom_currencies') || '[]');
    const merged = { ...BASE_CURRENCIES };
    custom.forEach(c => {
      if (c.code && !merged[c.code]) {
        merged[c.code] = { symbol: c.symbol, name: c.name || c.code, locale: 'id-ID', decimals: c.decimals || 0 };
      }
    });
    return merged;
  } catch {
    return { ...BASE_CURRENCIES };
  }
}

export let CURRENCIES = buildCurrencies();

export function refreshCurrencies() {
  CURRENCIES = buildCurrencies();
}

export const formatCurrency = (amount, currency = 'IDR') => {
  const config = CURRENCIES[currency] || CURRENCIES.IDR;
  
  // Validate and coerce amount to number
  let numAmount = 0;
  if (typeof amount === 'number') {
    numAmount = isFinite(amount) ? amount : 0;
  } else if (typeof amount === 'string') {
    numAmount = parseFloat(amount) || 0;
  }
  
  const absAmount = Math.abs(numAmount);
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(absAmount);
  const sign = numAmount < 0 ? '-' : '';
  return `${sign}${config.symbol} ${formatted}`;
};

// Scale constants
const SCALE = {
  BILLION: 1_000_000_000,
  MILLION: 1_000_000,
  THOUSAND: 1_000,
};

export const formatCompact = (amount, currency = 'IDR') => {
  const config = CURRENCIES[currency] || CURRENCIES.IDR;
  
  // Validate and coerce amount
  let numAmount = 0;
  if (typeof amount === 'number') {
    numAmount = isFinite(amount) ? amount : 0;
  } else if (typeof amount === 'string') {
    numAmount = parseFloat(amount) || 0;
  }
  
  const abs = Math.abs(numAmount);
  let formatted;
  
  if (abs >= SCALE.BILLION) formatted = `${(abs / SCALE.BILLION).toFixed(1)}M`;
  else if (abs >= SCALE.MILLION) formatted = `${(abs / SCALE.MILLION).toFixed(1)}Jt`;
  else if (abs >= SCALE.THOUSAND) formatted = `${(abs / SCALE.THOUSAND).toFixed(0)}K`;
  else formatted = abs.toString();
  
  const sign = numAmount < 0 ? '-' : '';
  return `${sign}${config.symbol}${formatted}`;
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num || 0);
};

// Date utilities
export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  // Parse YYYY-MM-DD tanpa konversi timezone (hindari off-by-one)
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    return `${d} ${MONTHS_ID[m - 1]} ${y}`;
  }
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
};

export const getMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
};

export const filterTransactionsByPeriod = (transactions, year, month) => {
  return transactions.filter(t => {
    if (!t.date) return false;
    // Parse date string langsung untuk hindari timezone shift
    const dateStr = String(t.date).split('T')[0];
    const [y, m] = dateStr.split('-').map(Number);
    if (year && y !== parseInt(year)) return false;
    if (month && m !== parseInt(month)) return false;
    return true;
  });
};

export const filterTransactionsByDateRange = (transactions, startDate, endDate) => {
  return transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate)) return false;
    return true;
  });
};

// Financial KPI calculations — OPTIMIZED: single pass instead of multiple filter/reduce
export const calcKPIs = (transactions, currency = null) => {
  // Single-pass accumulation instead of filter+reduce x6
  let income = 0, expense = 0, investment = 0, saving = 0, debtPayment = 0, receivableReceipt = 0;
  
  for (const t of transactions) {
    if (currency && t.currency !== currency) continue;
    const amt = t.amount || 0;
    if (t.type === 'income') income += amt;
    else if (t.type === 'expense') expense += amt;
    else if (t.type === 'investment') investment += amt;
    else if (t.type === 'saving') saving += amt;
    else if (t.type === 'debt_payment') debtPayment += amt;
    else if (t.type === 'receivable_receipt') receivableReceipt += amt;
  }
  
  const cashFlow = income - expense - investment;
  const savingRate = income > 0 ? (saving / income) * 100 : 0;

  return { income, expense, saving, investment, debtPayment, receivableReceipt, cashFlow, savingRate };
};

// Financial health score (0-100)
export const calcFinancialScore = (cashFlow, savingRate, debtRatio) => {
  let score = 0;
  
  // Cash flow: 40 points
  if (cashFlow > 0) {
    score += Math.min(40, 20 + (cashFlow / 1_000_000) * 2);
  }
  
  // Saving rate: 40 points
  if (savingRate >= 30) score += 40;
  else if (savingRate >= 20) score += 30;
  else if (savingRate >= 10) score += 20;
  else if (savingRate >= 5) score += 10;
  else if (savingRate > 0) score += 5;
  
  // Debt ratio: 20 points
  if (debtRatio === 0) score += 20;
  else if (debtRatio < 20) score += 15;
  else if (debtRatio < 40) score += 10;
  else if (debtRatio < 60) score += 5;
  
  score = Math.min(100, Math.max(0, Math.round(score)));
  
  let label, color;
  if (score >= 80) { label = 'Sangat Baik'; color = '#10B981'; }
  else if (score >= 60) { label = 'Baik'; color = '#6EE7B7'; }
  else if (score >= 40) { label = 'Cukup'; color = '#F59E0B'; }
  else if (score >= 20) { label = 'Buruk'; color = '#EF4444'; }
  else { label = 'Sangat Buruk'; color = '#991B1B'; }
  
  return { score, label, color };
};

// Group transactions by category — OPTIMIZED: pre-allocate and single pass
export const groupByCategory = (transactions) => {
  if (!transactions?.length) return [];
  const groups = {};
  for (const t of transactions) {
    const key = t.category_name || 'Lainnya';
    const group = groups[key] || (groups[key] = { name: key, total: 0, count: 0, category_id: t.category_id });
    group.total += t.amount || 0;
    group.count++;
  }
  return Object.values(groups).sort((a, b) => b.total - a.total);
};

// Monthly trend data — OPTIMIZED: pre-parse year
export const buildMonthlyTrend = (transactions, year) => {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: MONTHS_SHORT[i],
    income: 0, expense: 0, saving: 0, investment: 0, debt: 0, receivable: 0
  }));

  if (!transactions?.length) return months;

  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  for (const t of transactions) {
    if (!t.date) continue;
    // Timezone-safe parsing
    const parts = String(t.date).split('T')[0].split('-').map(Number);
    if (parts.length < 3 || parts[0] !== targetYear) continue;
    const monthIdx = parts[1] - 1;
    if (monthIdx < 0 || monthIdx > 11) continue;
    const m = months[monthIdx];
    const amt = t.amount || 0;
    if (t.type === 'income') m.income += amt;
    else if (t.type === 'expense') m.expense += amt;
    else if (t.type === 'saving') m.saving += amt;
    else if (t.type === 'investment') m.investment += amt;
    else if (t.type === 'debt_payment') m.debt += amt;
    else if (t.type === 'receivable_receipt') m.receivable += amt;
  }

  return months;
};

// CHART COLORS
export const CHART_COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary) / .65)',
  'hsl(var(--info) / .7)', 'hsl(var(--success) / .7)', 'hsl(var(--warning) / .7)',
  'hsl(var(--muted-foreground))', 'hsl(var(--destructive))', 'hsl(var(--primary) / .45)'
];

export const TYPE_COLORS = {
  income: 'hsl(var(--success))',
  expense: 'hsl(var(--destructive))',
  saving: 'hsl(var(--primary))',
  investment: 'hsl(var(--chart-3))',
  debt_payment: 'hsl(var(--warning))',
  receivable_receipt: 'hsl(var(--info))',
};