import { AlertTriangle, Clock, X } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils/finance';

function getDaysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DeadlineAlert({ debts = [], savingTargets = [] }) {
  const [dismissed, setDismissed] = useState([]);

  const items = [
    ...debts
      .filter(d => d.status === 'active' && d.due_date)
      .map(d => ({ ...d, _type: 'debt', label: `Hutang ke ${d.creditor_name}`, daysLeft: getDaysLeft(d.due_date) })),
    ...savingTargets
      .filter(s => s.status === 'active' && s.deadline)
      .map(s => ({ ...s, _type: 'saving', label: `Target: ${s.name}`, daysLeft: getDaysLeft(s.deadline), due_date: s.deadline, remaining_amount: s.target_amount - (s.current_amount || 0) })),
  ]
    .filter(i => i.daysLeft !== null && i.daysLeft <= 30 && !dismissed.includes(i.id))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      {items.map(item => {
        const isOverdue = item.daysLeft < 0;
        const isUrgent = item.daysLeft <= 7;
        return (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
              isOverdue ? 'bg-red-50 border-red-200' :
              isUrgent ? 'bg-amber-50 border-amber-200' :
              'bg-yellow-50 border-yellow-200'
            }`}
          >
            {isOverdue || isUrgent
              ? <AlertTriangle size={16} className={isOverdue ? 'text-red-500 shrink-0 mt-0.5' : 'text-amber-500 shrink-0 mt-0.5'} />
              : <Clock size={16} className="text-yellow-600 shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-xs ${isOverdue ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-yellow-700'}`}>
                {isOverdue ? '⚠️ JATUH TEMPO' : isUrgent ? '🔔 Segera!' : '📅 Reminder'} — {item.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isOverdue
                  ? `Telah lewat ${Math.abs(item.daysLeft)} hari`
                  : `${item.daysLeft} hari lagi`
                } • Jatuh tempo: {formatDate(item.due_date)}
                {item.remaining_amount > 0 && ` • Sisa: ${formatCurrency(item.remaining_amount, item.currency)}`}
              </p>
            </div>
            <button onClick={() => setDismissed(p => [...p, item.id])} className="text-muted-foreground hover:text-foreground shrink-0">
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}