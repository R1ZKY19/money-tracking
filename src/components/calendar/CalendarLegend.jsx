import { EVENT_STYLE } from '@/lib/financialCalendar';

export default function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {Object.entries(EVENT_STYLE).filter(([k]) => k !== 'other').map(([k, s]) => (
        <span key={k} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} /> {s.label}
        </span>
      ))}
    </div>
  );
}