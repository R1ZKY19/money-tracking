import { format, isToday, isYesterday } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const dayKey = (value) => {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d) ? format(d, 'yyyy-MM-dd') : 'tanpa-tanggal';
};

const dayLabel = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || isNaN(d)) return 'Percakapan Sebelumnya';
  if (isToday(d)) return `Hari Ini · ${format(d, 'd MMM yyyy', { locale: localeId })}`;
  if (isYesterday(d)) return `Kemarin · ${format(d, 'd MMM yyyy', { locale: localeId })}`;
  return format(d, 'EEEE, d MMMM yyyy', { locale: localeId });
};

export default function ChatDateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-border" />
      <span className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {dayLabel(date)}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}