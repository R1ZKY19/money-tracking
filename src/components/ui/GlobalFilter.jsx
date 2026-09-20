import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MONTHS_ID, CURRENCIES } from '@/lib/utils/finance';
import { Button } from '@/components/ui/button';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';

const currentYear = new Date().getFullYear();
// Tampilkan 5 tahun ke belakang + 10 tahun ke depan
const years = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

export default function GlobalFilter({ filters, onChange, showMonth = true, showCurrency = true, showAccount = false, accounts = [] }) {
  const update = (key, val) => onChange({ ...filters, [key]: val });
  const reset = () => onChange({ year: String(currentYear), month: '', currency: '', account: '' });

  return (
    <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-card rounded-2xl border border-border mb-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center gap-1.5 mr-1">
        <SlidersHorizontal size={13} className="text-muted-foreground" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline">Filter</span>
      </div>

      <Select value={filters.year || String(currentYear)} onValueChange={v => update('year', v)}>
        <SelectTrigger className="flex-1 min-w-[5.5rem] sm:flex-none sm:w-24 h-8 text-xs rounded-xl border-border">
          <SelectValue placeholder="Tahun" />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
        </SelectContent>
      </Select>

      {showMonth && (
        <Select value={filters.month || '_all'} onValueChange={v => update('month', v === '_all' ? '' : v)}>
          <SelectTrigger className="flex-1 min-w-[7rem] sm:flex-none sm:w-32 h-8 text-xs rounded-xl border-border">
            <SelectValue placeholder="Semua Bulan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua Bulan</SelectItem>
            {MONTHS_ID.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {showCurrency && (
        <Select value={filters.currency || '_all'} onValueChange={v => update('currency', v === '_all' ? '' : v)}>
          <SelectTrigger className="flex-1 min-w-[7rem] sm:flex-none sm:w-28 h-8 text-xs rounded-xl border-border">
            <SelectValue placeholder="Semua Mata Uang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua Mata Uang</SelectItem>
            {Object.entries(CURRENCIES).map(([code, cfg]) => (
              <SelectItem key={code} value={code}>{cfg.symbol} {code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showAccount && accounts.length > 0 && (
        <Select value={filters.account || '_all'} onValueChange={v => update('account', v === '_all' ? '' : v)}>
          <SelectTrigger className="flex-1 min-w-[7rem] sm:flex-none sm:w-32 h-8 text-xs rounded-xl border-border">
            <SelectValue placeholder="Semua Akun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Semua Akun</SelectItem>
            {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-muted-foreground rounded-xl hover:bg-muted" onClick={reset}>
        <RotateCcw size={11} className="mr-1" /> Reset
      </Button>
    </div>
  );
}