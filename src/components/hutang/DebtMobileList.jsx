import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/finance';

// Daftar hutang versi mobile — kartu bertumpuk, tidak perlu digeser ke samping.
export default function DebtMobileList({ debts, today, onDetail, onPay, T }) {
  return (
    <div className="md:hidden divide-y divide-border">
      {debts.map((d) => {
        const isOverdue = d.due_date && d.due_date < today && d.status === 'active';
        const isPaid = d.status !== 'active';
        const progress = d.total_amount > 0 ? (1 - (d.remaining_amount || 0) / d.total_amount) * 100 : 0;
        return (
          <div key={d.id} className={`p-4 ${isPaid ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : isOverdue ? 'bg-red-50/40 dark:bg-red-950/10' : ''}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-amber-700 font-bold text-sm">{d.creditor_name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{d.creditor_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.currency} · {d.due_date ? formatDate(d.due_date) : 'Tanpa jatuh tempo'}
                  </p>
                </div>
              </div>
              <Badge className={`text-[10px] font-bold shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : isOverdue ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                {isPaid ? T.statusPaid : isOverdue ? T.overdue : T.statusActive}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-[10px] text-muted-foreground">Pokok Pinjaman</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(d.total_amount, d.currency)}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-[10px] text-muted-foreground">{T.colRemaining}</p>
                <p className="text-sm font-bold text-amber-600">{formatCurrency(d.remaining_amount || 0, d.currency)}</p>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{T.percentPaid}</span><span>{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, progress)}%`, background: progress >= 100 ? '#10B981' : 'linear-gradient(90deg,#F59E0B,#D97706)' }} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-9 flex-1 text-xs" onClick={() => onDetail(d)}>
                <Eye size={13} className="mr-1" /> Detail
              </Button>
              {d.status === 'active' && (
                <Button size="sm" className="h-9 flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={onPay}>
                  {T.payBtn}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}