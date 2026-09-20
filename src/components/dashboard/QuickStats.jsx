import { useQuery } from '@tanstack/react-query';
import { Category, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { Star, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { formatCompact } from '@/lib/utils/finance';
import { filterTransactionsByPeriod } from '@/lib/utils/finance';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function QuickStats({ year = currentYear, month = currentMonth, currency = 'IDR' }) {
  const { user } = useAuth();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => Category.list(),
    enabled: !!user?.id
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => $entity.list('-date', 5000),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000
  });

  const periodTxs = filterTransactionsByPeriod(transactions, year, month);
  const favoriteCats = categories.filter(c => c.is_favorite && c.is_active);

  const getTotal = (type, catName) => {
    return periodTxs
      .filter(t => t.type === type && (t.category_name === catName || (!t.category_name && catName === 'Lainnya')))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Favorit Categories */}
      {favoriteCats.slice(0, 3).map(cat => {
        const total = getTotal(cat.type, cat.name);
        const Icon = cat.type === 'income' ? TrendingUp : cat.type === 'expense' ? TrendingDown : PiggyBank;
        
        return (
          <div key={cat.id} className="bg-card rounded-lg border border-border p-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <Icon size={14} className="text-muted-foreground" />
              <Star size={12} className="text-amber-400 fill-amber-400" />
            </div>
            <p className="text-xs text-muted-foreground truncate">{cat.name}</p>
            <p className="text-sm font-bold text-foreground mt-1">{formatCompact(total)}</p>
          </div>
        );
      })}
    </div>
  );
}