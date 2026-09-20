import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CheckCircle2, TrendingUp, TrendingDown, Calendar, Clock, User, FileText, History } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/finance';
import AccountLogo from '@/components/ui/AccountLogo';

export default function CrossCheckDetailPanel({ row, history, open, onClose }) {
  if (!row) return null;
  const { account, systemBalance, actualBalance, diff, hasActual, statusLabel, statusColor, lastCheckDate, lastCheckTime, lastStaff } = row;
  const pct = systemBalance ? (diff / systemBalance) * 100 : 0;
  const rowHistory = history.filter(h => h.account_id === account.id);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <AccountLogo account={account} size={36} />
            <span>{account.name}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">No. Rekening</p>
              <p className="font-semibold text-foreground">{account.account_number || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Pemilik Rekening</p>
              <p className="font-semibold text-foreground truncate">{account.account_holder_name || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Saldo Sistem</p>
              <p className="font-semibold text-foreground">{formatCurrency(systemBalance, account.currency)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Saldo Aktual Bank</p>
              <p className="font-semibold text-foreground">{hasActual ? formatCurrency(actualBalance, account.currency) : '—'}</p>
            </div>
          </div>

          <div className="rounded-2xl border p-4 space-y-2" style={{ borderColor: statusColor + '50', background: statusColor + '0c' }}>
            <div className="flex items-center gap-2 font-bold" style={{ color: statusColor }}>
              <CheckCircle2 size={16} /> {statusLabel}
            </div>
            {hasActual && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Selisih Nominal</span>
                <span className="font-bold" style={{ color: statusColor }}>{diff > 0 ? '+' : ''}{formatCurrency(diff, account.currency)}</span>
              </div>
            )}
            {hasActual && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Persentase Selisih</span>
                <span className="font-bold" style={{ color: statusColor }}>{pct > 0 ? '+' : ''}{pct.toFixed(2)}%</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-2">
              <Calendar size={13} className="text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase">Tanggal Cek</p>
                <p className="font-semibold text-foreground truncate">{lastCheckDate || '—'}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-2">
              <Clock size={13} className="text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase">Jam Cek</p>
                <p className="font-semibold text-foreground truncate">{lastCheckTime || '—'}</p>
              </div>
            </div>
            <div className="col-span-2 p-3 rounded-xl bg-muted/40 border border-border flex items-center gap-2">
              <User size={13} className="text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase">Staff</p>
                <p className="font-semibold text-foreground truncate">{lastStaff || '—'}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <History size={13} className="text-primary" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Riwayat Cross Check</p>
              <span className="text-[10px] text-muted-foreground">({rowHistory.length})</span>
            </div>
            {rowHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">Belum ada riwayat cross check</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {rowHistory.map(h => (
                  <div key={h.id} className="p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{formatCurrency(h.balance_after, h.currency)}</span>
                      <span className={h.difference >= 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {h.difference > 0 ? '+' : ''}{formatCurrency(h.difference, h.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{h.admin_name}</span>
                      <span>{formatDate(h.created_date)}</span>
                    </div>
                    {h.reason && (
                      <p className="text-muted-foreground italic flex items-center gap-1"><FileText size={9} /> "{h.reason}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}