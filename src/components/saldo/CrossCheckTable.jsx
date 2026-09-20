import { formatCurrency } from '@/lib/utils/finance';
import AccountLogo from '@/components/ui/AccountLogo';

function formatRupiahDisplay(value) {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : parseInt(String(value).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return 'Rp' + new Intl.NumberFormat('id-ID').format(num);
}

export default function CrossCheckTable({ rows, inputValues, onInputChange, onRowClick }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card text-center py-12 text-muted-foreground text-sm">
        Tidak ada rekening yang cocok dengan filter
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {rows.map(r => {
        const rawInput = inputValues[r.account.id];
        const displayVal = rawInput !== undefined ? formatRupiahDisplay(rawInput) : (r.hasActual ? formatRupiahDisplay(r.actualBalance) : '');
        return (
          <div
            key={r.account.id}
            className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onRowClick(r)}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <AccountLogo account={r.account} size={32} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm truncate">{r.account.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {r.account.account_number || '—'}{r.account.account_holder_name ? ` · ${r.account.account_holder_name}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground">Saldo Sistem</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(r.systemBalance, r.account.currency)}</span>
            </div>

            <div onClick={e => e.stopPropagation()}>
              <label className="text-[11px] text-muted-foreground mb-1 block">Saldo Aktual Bank</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Rp0"
                value={displayVal}
                onChange={e => onInputChange(r.account.id, e.target.value.replace(/\D/g, ''))}
                className="w-full text-right font-semibold bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-colors"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}