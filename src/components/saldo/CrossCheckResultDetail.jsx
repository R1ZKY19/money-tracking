import { CheckCircle2, TrendingUp, TrendingDown, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/finance';
import AccountLogo from '@/components/ui/AccountLogo';

function explain(r) {
  if (r.diff === 0) return { text: 'Saldo sesuai — tidak ada selisih antara sistem dan bank.', icon: CheckCircle2 };
  const arah = r.diff > 0 ? 'Plus (saldo bank lebih besar dari sistem)' : 'Minus (saldo bank lebih kecil dari sistem)';
  const besar = r.statusLabel.includes('Banyak') ? 'Selisih Banyak' : 'Selisih Sedikit';
  return {
    text: `${besar} · ${arah} sebesar ${formatCurrency(Math.abs(r.diff), r.account.currency)}`,
    icon: r.diff > 0 ? TrendingUp : TrendingDown,
  };
}

export default function CrossCheckResultDetail({ results, onClose }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card animate-fade-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <h4 className="text-sm font-heading font-bold text-foreground">Hasil Pengecekan</h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="divide-y divide-border">
        {results.map(r => {
          const e = explain(r);
          const Icon = e.icon;
          return (
            <div key={r.account.id} className="p-3.5 sm:p-4" style={{ borderLeft: `4px solid ${r.statusColor}` }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AccountLogo account={r.account} size={26} />
                  <span className="font-semibold text-foreground text-sm truncate">{r.account.name}</span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: r.statusColor + '18', color: r.statusColor }}
                  >
                    {r.statusLabel}
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Sistem: <strong className="text-foreground">{formatCurrency(r.systemBalance, r.account.currency)}</strong></span>
                  <span className="text-muted-foreground">Aktual: <strong className="text-foreground">{formatCurrency(r.actualBalance, r.account.currency)}</strong></span>
                  <span className={r.diff === 0 ? 'text-emerald-600 font-bold' : r.diff > 0 ? 'text-amber-600 font-bold' : 'text-red-500 font-bold'}>
                    {r.diff > 0 ? '+' : ''}{formatCurrency(r.diff, r.account.currency)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs font-semibold" style={{ color: r.statusColor }}>
                <Icon size={13} />
                {e.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}