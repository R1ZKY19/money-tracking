import { formatCurrency } from '@/lib/utils/finance';

export const CATEGORIES = {
  rumah: { label: 'Rumah', icon: 'Home', color: '#0D4F6D' },
  kendaraan: { label: 'Kendaraan', icon: 'Car', color: '#3B82F6' },
  investasi: { label: 'Investasi', icon: 'TrendingUp', color: '#8B5CF6' },
  liburan: { label: 'Liburan', icon: 'Plane', color: '#0EA5E9' },
  pendidikan: { label: 'Pendidikan', icon: 'GraduationCap', color: '#10B981' },
  dana_darurat: { label: 'Dana Darurat', icon: 'ShieldAlert', color: '#EF4444' },
  gadget: { label: 'Gadget', icon: 'Smartphone', color: '#6366F1' },
  emas: { label: 'Emas', icon: 'Gem', color: '#F59E0B' },
  lainnya: { label: 'Lainnya', icon: 'Target', color: '#64748B' },
};

export const DURATIONS = [6, 12, 18, 24, 36, 48, 60];
export const FREQUENCIES = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' };
export const PRIORITIES = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };
export const FLEXIBILITY = { strict: 'Ketat', normal: 'Normal', flexible: 'Fleksibel' };

export function freqToMonthlyMultiplier(freq) {
  if (freq === 'daily') return 30;
  if (freq === 'weekly') return 4.33;
  return 1;
}

export function getMonthsBetween(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
}

export function getMonthsElapsed(startDate) {
  if (!startDate) return 0;
  return getMonthsBetween(startDate, new Date().toISOString().slice(0, 10));
}

export function getMonthsRemaining(deadline) {
  if (!deadline) return 0;
  return getMonthsBetween(new Date().toISOString().slice(0, 10), deadline);
}

export function getTotalMonths(startDate, deadline) {
  return Math.max(1, getMonthsBetween(startDate, deadline));
}

export function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function computeDeadlineFromDuration(startDate, durationMonths) {
  if (!startDate || !durationMonths) return '';
  return addMonths(startDate, durationMonths);
}

export function calcProgress(current, target) {
  return target > 0 ? Math.min(100, (current / target) * 100) : 0;
}

export function calcRemaining(target, current) {
  return Math.max(0, target - current);
}

export function idealMonthlyDeposit(target, current, monthsRemaining) {
  const sisa = Math.max(0, target - current);
  return monthsRemaining > 0 ? sisa / monthsRemaining : sisa;
}

export function projectedFundAtDeadline(current, monthlyDeposit, monthsRemaining) {
  return current + monthlyDeposit * monthsRemaining;
}

export function estimateCompletionDate(current, target, monthlyDeposit) {
  if (monthlyDeposit <= 0) return null;
  const sisa = target - current;
  if (sisa <= 0) return new Date().toISOString().slice(0, 10);
  const months = Math.ceil(sisa / monthlyDeposit);
  return addMonths(new Date().toISOString().slice(0, 10), months);
}

export function calcLateMonths(estimatedDate, deadline) {
  if (!estimatedDate || !deadline) return 0;
  return Math.max(0, getMonthsBetween(deadline, estimatedDate));
}

export function getStatusFromProgress(pct) {
  if (pct >= 90) return { label: 'Sangat Aman', color: '#10B981', key: 'very_safe' };
  if (pct >= 75) return { label: 'Aman', color: '#84CC16', key: 'safe' };
  if (pct >= 50) return { label: 'Perlu Ditingkatkan', color: '#F59E0B', key: 'needs_improvement' };
  if (pct >= 30) return { label: 'Risiko Terlambat', color: '#F97316', key: 'risky' };
  return { label: 'Hampir Mustahil', color: '#EF4444', key: 'critical' };
}

// Weighted success probability
export function calcSuccessProbability(goal, monthlyHistory) {
  const target = goal.target_amount || 0;
  const current = goal.current_amount || 0;
  const sisa = Math.max(0, target - current);

  const monthsRemaining = getMonthsRemaining(goal.deadline);
  const monthsTotal = getTotalMonths(goal.start_date, goal.deadline);
  const monthsElapsed = getMonthsElapsed(goal.start_date);

  const monthlyDeposit = (goal.deposit_amount || 0) * freqToMonthlyMultiplier(goal.frequency);
  const ideal = monthsRemaining > 0 ? sisa / monthsRemaining : sisa;

  // 50% - Kecukupan setoran
  const sufficiency = ideal > 0 ? Math.min(1, monthlyDeposit / ideal) : (sisa === 0 ? 1 : 0);

  // 20% - Konsistensi
  let consistency = 0.5;
  if (monthlyHistory && monthlyHistory.length > 0) {
    const monthsWithDeposit = monthlyHistory.filter(m => m.amount > 0).length;
    const span = Math.max(1, monthsElapsed || monthsTotal);
    consistency = Math.min(1, monthsWithDeposit / span);
  }

  // 15% - Progress vs waktu berjalan
  const timeProgress = monthsTotal > 0 ? Math.min(1, monthsElapsed / monthsTotal) : 0;
  const fundProgress = target > 0 ? Math.min(1, current / target) : 0;
  const paceScore = timeProgress > 0 ? Math.min(1, fundProgress / timeProgress) : fundProgress;

  // 10% - Dana awal
  const initialRatio = target > 0 ? Math.min(1, (goal.initial_amount || current) / target) : 0;

  // 5% - Cadangan waktu
  const timeBuffer = monthsTotal > 0 ? Math.min(1, monthsRemaining / monthsTotal) : 0;

  const score = sufficiency * 0.50 + consistency * 0.20 + paceScore * 0.15 + initialRatio * 0.10 + timeBuffer * 0.05;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

export function generateRecommendations(goal, monthlyDeposit, ideal, prob) {
  const recs = [];
  const sisa = Math.max(0, goal.target_amount - goal.current_amount);

  if (monthlyDeposit < ideal && ideal > 0) {
    const need = Math.ceil(ideal - monthlyDeposit);
    recs.push({
      type: 'increase_deposit',
      title: 'Tingkatkan Tabungan Bulanan',
      desc: `Tambah setoran sebesar ${formatCurrency(need, goal.currency)} per bulan agar target tercapai tepat waktu.`,
      priority: 'high',
      color: '#EF4444',
    });
  }

  if (prob < 80 && monthlyDeposit > 0) {
    const newMonths = Math.ceil(sisa / monthlyDeposit);
    if (newMonths > 0 && goal.deadline) {
      recs.push({
        type: 'extend_duration',
        title: 'Perpanjang Durasi Target',
        desc: `Dengan setoran saat ini, target baru selesai dalam ~${newMonths} bulan. Pertimbangkan memperpanjang deadline.`,
        priority: 'medium',
        color: '#F59E0B',
      });
    }
  }

  if (goal.target_amount > 0 && (goal.current_amount || 0) / goal.target_amount < 0.1) {
    recs.push({
      type: 'add_initial',
      title: 'Tambah Dana Awal',
      desc: 'Dana awal yang lebih besar akan meringankan beban tabungan bulanan dan meningkatkan peluang keberhasilan.',
      priority: 'low',
      color: '#0EA5E9',
    });
  }

  if (prob < 45 && goal.target_amount > 0) {
    recs.push({
      type: 'reduce_target',
      title: 'Kurangi Nominal Target',
      desc: 'Target saat ini terlalu tinggi untuk kemampuan menabung. Pertimbangkan menurunkan target agar lebih realistis.',
      priority: 'high',
      color: '#F97316',
    });
  }

  if (recs.length === 0) {
    recs.push({
      type: 'good',
      title: 'Target Anda Realistis',
      desc: 'Dengan setoran dan timeline saat ini, target diperkirakan tercapai tepat waktu. Pertahankan konsistensi!',
      priority: 'low',
      color: '#10B981',
    });
  }

  return recs;
}

export function generateTimeline(goal, monthlyHistory) {
  if (!goal.start_date || !goal.deadline) return [];
  const months = getMonthsBetween(goal.start_date, goal.deadline);
  const result = [];
  const start = new Date(goal.start_date);
  const todayKey = new Date().toISOString().slice(0, 7);
  for (let i = 0; i <= months; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const key = d.toISOString().slice(0, 7);
    const monthLabel = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const historyEntry = monthlyHistory.find(m => m.key === key);
    result.push({
      key,
      label: monthLabel,
      amount: historyEntry?.amount || 0,
      deposited: !!historyEntry,
      isCurrent: key === todayKey,
    });
  }
  return result;
}

// Check if user deposited this month
export function hasDepositedThisMonth(monthlyHistory) {
  const todayKey = new Date().toISOString().slice(0, 7);
  return monthlyHistory.some(m => m.key === todayKey && m.amount > 0);
}

// Aggregate saving transactions to monthly by target
export function aggregateMonthlyByTarget(transactions, target) {
  const targetTxs = transactions.filter(t =>
    t.type === 'saving' && (t.category_name === target.name || t.related_id === target.id)
  );
  const byMonth = {};
  targetTxs.forEach(t => {
    const key = t.date?.substring(0, 7);
    if (key) byMonth[key] = (byMonth[key] || 0) + (t.amount || 0);
  });
  return Object.entries(byMonth).map(([key, amount]) => ({ key, amount })).sort((a, b) => a.key.localeCompare(b.key));
}