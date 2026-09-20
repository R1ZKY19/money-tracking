import { History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/finance';

const isPositive = (t) =>
  t.type === 'transfer' ? t.reference === 'TRANSFER-IN' : ['income', 'debt', 'receivable_receipt'].includes(t.type);

// Riwayat transaksi versi mobile — kartu bertumpuk agar terbaca tanpa scroll horizontal.
export default function TxMobileList({ items, getTypeLabel, getTypeColor, emptyText }) {
  if (items.length === 0) {
    return (
      <div className="md:hidden py-12 text-center text-muted-foreground">
        <History size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="md:hidden divide-y divide-border">
      {items.map(t => {
        const positive = isPositive(t);
        return (
          <div key={t.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] ${getTypeColor(t.type)}`}>{getTypeLabel(t.type)}</Badge>
                  <span className="text-[11px] text-muted-foreground">{formatDate(t.date)}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground truncate">{t.category_name || '-'}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {t.account_name || '-'}{t.description ? ` · ${t.description}` : ''}
                </p>
              </div>
              <p className={`shrink-0 text-sm font-bold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                {positive ? '+' : '-'}{formatCurrency(t.amount || 0, t.currency)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}