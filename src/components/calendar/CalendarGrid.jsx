import { eventStyle, todayISO } from '@/lib/financialCalendar';

const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function CalendarGrid({ cells, events, selected, onSelect }) {
  const today = todayISO();
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map(d => <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(cell => {
          const list = events[cell.date] || [];
          const dots = [...new Map(list.map(e => [eventStyle(e).dot, eventStyle(e).dot])).keys()].slice(0, 4);
          const isToday = cell.date === today;
          const isSel = cell.date === selected;
          return (
            <button key={cell.date} onClick={() => onSelect(cell.date)}
              className={`relative aspect-square sm:aspect-[1/0.85] rounded-xl border p-1.5 flex flex-col items-start transition-all text-left
                ${isSel ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/40'}
                ${cell.inMonth ? 'bg-card' : 'bg-muted/20'}`}>
              <span className={`text-[11px] font-bold leading-none ${isToday ? 'text-primary' : cell.inMonth ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {cell.day}
              </span>
              {isToday && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />}
              <div className="flex flex-wrap gap-0.5 mt-auto">
                {dots.map(c => <span key={c} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />)}
              </div>
              {list.length > 0 && <span className="text-[9px] text-muted-foreground leading-none mt-0.5">{list.length} item</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}