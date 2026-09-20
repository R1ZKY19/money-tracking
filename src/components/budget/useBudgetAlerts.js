import { useQuery } from '@tanstack/react-query';
import { BudgetPlan, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';

const nowWIB = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

/**
 * Peringatan anggaran: kategori pengeluaran bulan ini yang sudah
 * mencapai >= 80% dari budget yang direncanakan.
 */
export default function useBudgetAlerts() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data: alerts = [] } = useQuery({
    queryKey: ['budget-alerts', uid],
    enabled: !!uid,
    staleTime: 60000,
    queryFn: async () => {
      const now = nowWIB();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const [plans, txns] = await Promise.all([
        BudgetPlan.list(),
        Transaction.list(),
      ]);

      const plan = plans[0];
      const rows = (plan?.expense || []).filter(r => Number(r.budget) > 0);
      if (!rows.length) return [];

      const inMonth = txns.filter(t => {
        if (t.type !== 'expense' || !t.date) return false;
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });

      return rows
        .map(r => {
          const actual = inMonth
            .filter(t => t.category_name === r.name)
            .reduce((s, t) => s + (Number(t.amount) || 0), 0);
          const pct = (actual / Number(r.budget)) * 100;
          return { name: r.name, actual, budget: Number(r.budget), pct };
        })
        .filter(r => r.pct >= 80)
        .sort((a, b) => b.pct - a.pct);
    },
  });

  return alerts;
}