import { useQuery } from '@tanstack/react-query';
import { Debt, Receivable } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { AlertCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/finance';

export default function DebtDueAlert() {
  const { user } = useAuth();

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => Debt.list(),
    enabled: !!user?.id
  });

  const { data: receivables = [] } = useQuery({
    queryKey: ['receivables'],
    queryFn: () => Receivable.list(),
    enabled: !!user?.id
  });

  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Filter hutang jatuh tempo dalam 7 hari
  const dueSoon = debts.filter(d => {
    if (!d.due_date || d.status === 'paid') return false;
    const dueDate = new Date(d.due_date);
    return dueDate >= today && dueDate <= sevenDaysFromNow;
  }).concat(
    receivables.filter(r => {
      if (!r.due_date || r.status === 'completed') return false;
      const dueDate = new Date(r.due_date);
      return dueDate >= today && dueDate <= sevenDaysFromNow;
    })
  );

  if (dueSoon.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
        <h4 className="font-semibold text-amber-900 dark:text-amber-200">Jatuh Tempo Minggu Ini</h4>
      </div>
      <div className="space-y-2">
        {dueSoon.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Clock size={12} className="text-amber-600 shrink-0" />
              <span className="text-amber-900 dark:text-amber-100 truncate">
                {item.creditor_name || item.debtor_name}
              </span>
            </div>
            <span className="text-amber-700 dark:text-amber-300 font-semibold shrink-0 ml-2">
              {formatCurrency(item.remaining_amount || item.total_amount)}
            </span>
          </div>
        ))}
        {dueSoon.length > 3 && (
          <p className="text-xs text-amber-700 dark:text-amber-300 pt-2">+{dueSoon.length - 3} lainnya</p>
        )}
      </div>
    </div>
  );
}