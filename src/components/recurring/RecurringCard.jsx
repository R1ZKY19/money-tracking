import { Pencil, Trash2, Repeat, Pause, Play, ArrowDown, ArrowUp, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils/finance';
import { freqLabel, nextDueDate, daysUntil } from '@/lib/recurring';

const TYPE_META = {
  income:  { icon: ArrowDown, cls: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', sign: '+', label: 'Pendapatan' },
  expense: { icon: ArrowUp,   cls: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20',         sign: '−', label: 'Pengeluaran' },
  saving:  { icon: PiggyBank, cls: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-900/20',   sign: '−', label: 'Tabungan' },
};

export default function RecurringCard({ rt, onEdit, onDelete, onToggle, busy }) {
  const meta = TYPE_META[rt.type] || TYPE_META.expense;
  const Icon = meta.icon;
  const next = nextDueDate(rt);
  const days = daysUntil(next);
  const inactive = rt.is_active === false;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border transition-all ${inactive ? 'border-border bg-muted/30 opacity-70' : 'border-border bg-card hover:shadow-md'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
        <Icon size={18} className={meta.cls} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-heading font-bold text-foreground truncate">{rt.name}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-neutral flex items-center gap-1"><Repeat size={9} /> {freqLabel(rt.frequency)}</span>
          {inactive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-warning">Nonaktif</span>}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {meta.label}{rt.category_name ? ` · ${rt.category_name}` : ''}{rt.account_name ? ` · ${rt.account_name}` : ''}
        </p>
        <p className="text-[11px] mt-1">
          {next ? (
            <span className={days <= 3 ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}>
              Berikutnya {formatDate(next)}{days === 0 ? ' · hari ini' : days > 0 ? ` · ${days} hari lagi` : ''}
            </span>
          ) : <span className="text-muted-foreground">Tidak ada jadwal berikutnya</span>}
          {rt.last_created_date && <span className="text-muted-foreground"> · terakhir {formatDate(rt.last_created_date)}</span>}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <p className={`font-heading font-bold text-sm whitespace-nowrap ${meta.cls}`}>{meta.sign}{formatCurrency(rt.amount || 0, rt.currency)}</p>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title={inactive ? 'Aktifkan' : 'Jeda'} disabled={busy} onClick={() => onToggle(rt)}>
          {inactive ? <Play size={14} className="text-emerald-600" /> : <Pause size={14} className="text-amber-600" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Edit" disabled={busy} onClick={() => onEdit(rt)}><Pencil size={14} /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Hapus" disabled={busy} onClick={() => onDelete(rt)}><Trash2 size={14} /></Button>
      </div>
    </div>
  );
}