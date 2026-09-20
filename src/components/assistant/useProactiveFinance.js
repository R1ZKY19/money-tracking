import { useEffect, useState } from 'react';
import { Debt, SavingTarget, Transaction } from '@/api/entities';

export default function useProactiveFinance(enabled) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    Promise.all([
      $entity.list('-date', 120),
      $entity.list('-due_date', 30),
      $entity.list('-deadline', 30),
    ]).then(([transactions, debts, targets]) => {
      const now = new Date();
      const month = transactions.filter(t => {
        const d = new Date(`${t.date}T00:00:00`);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const currencies = [...new Set(month.map(t => t.currency || 'IDR'))];
      const next = [];
      if (currencies.length === 1) {
        const income = month.filter(t => t.type === 'income').reduce((n, t) => n + Number(t.amount || 0), 0);
        const expense = month.filter(t => t.type === 'expense').reduce((n, t) => n + Number(t.amount || 0), 0);
        if (expense > income && expense > 0) next.push({ tone: 'warning', text: 'Pengeluaran bulan ini lebih tinggi dari pemasukan. Yuk cek kategori terbesar sebelum dompet protes.' });
        else if (income > 0) next.push({ tone: 'good', text: `Arus kas bulan ini masih positif. Pertahankan ritmenya—robot kecilmu ikut senang!` });
      }
      const dueSoon = debts.find(d => d.status === 'active' && d.due_date && new Date(d.due_date) <= new Date(Date.now() + 7 * 86400000));
      if (dueSoon) next.push({ tone: 'warning', text: `Ada hutang yang jatuh tempo dalam 7 hari. Siapkan dananya agar tidak terlewat.` });
      const lagging = targets.find(t => t.status === 'active' && Number(t.target_amount) > 0 && Number(t.current_amount || 0) / Number(t.target_amount) < .5 && t.deadline && new Date(t.deadline) < new Date(Date.now() + 30 * 86400000));
      if (lagging) next.push({ tone: 'info', text: `Target “${lagging.name}” masih di bawah 50% dan tenggatnya sudah dekat.` });
      if (active) setInsights(next.slice(0, 2));
    }).catch(() => { if (active) setInsights([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled]);

  return { insights, loading };
}