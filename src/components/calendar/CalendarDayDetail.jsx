import { CalendarDays } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/finance';
import { eventStyle } from '@/lib/financialCalendar';

export default function CalendarDayDetail({ date, events }) {
  const list = events || [];
  return (
    <div>
      <p className="text-xs font-bold text-foreground mb-3">{formatDate(date)}</p>
      {list.length === 0 ? (
        <div className="py-10 text-center">
          <CalendarDays size={22} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs text-muted-foreground">Tidak ada aktivitas keuangan pada tanggal ini.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((ev, i) => {
            const s = eventStyle(ev);
            return (
              <div key={ev.id || i} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border bg-card">
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: s.dot }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{ev.title}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}{ev.meta ? ` · ${ev.meta}` : ''}{ev.kind === 'recurring' ? ' · terjadwal' : ''}</p>
                </div>
                <p className="text-xs font-bold whitespace-nowrap" style={{ color: s.dot }}>{formatCurrency(ev.amount, ev.currency)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}