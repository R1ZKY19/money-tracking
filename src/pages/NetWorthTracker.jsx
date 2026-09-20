import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Account, Debt, Receivable, SavingTarget } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import KpiCard from '@/components/ui/KpiCard';
import { formatCurrency, formatCompact, CHART_COLORS } from '@/lib/utils/finance';
import { useLanguage } from '@/lib/LanguageContext';

export default function NetWorthTracker() {
  const { user } = useAuth();
  const uid = user?.id;
  const { t } = useLanguage();

  const { data: accounts = [] } = useQuery({ 
    queryKey: ['accounts', uid], 
    queryFn: () => uid ? Account.list() : [], 
    enabled: !!uid 
  });
  const { data: debts = [] } = useQuery({ 
    queryKey: ['debts', uid], 
    queryFn: () => uid ? Debt.list() : [], 
    enabled: !!uid 
  });
  const { data: receivables = [] } = useQuery({ 
    queryKey: ['receivables', uid], 
    queryFn: () => uid ? Receivable.list() : [], 
    enabled: !!uid 
  });
  const { data: savingTargets = [] } = useQuery({ 
    queryKey: ['savingTargets', uid], 
    queryFn: () => uid ? SavingTarget.list() : [], 
    enabled: !!uid 
  });

  // Calculate Assets
  const assets = useMemo(() => {
    const byCurrency = {};
    accounts.filter(a => a.is_active !== false).forEach(a => {
      const c = a.currency || 'IDR';
      byCurrency[c] = (byCurrency[c] || 0) + (a.current_balance || 0);
    });
    receivables.filter(r => r.status === 'active').forEach(r => {
      const c = r.currency || 'IDR';
      byCurrency[c] = (byCurrency[c] || 0) + (r.remaining_amount || 0);
    });
    return byCurrency;
  }, [accounts, receivables]);

  // Calculate Liabilities
  const liabilities = useMemo(() => {
    const byCurrency = {};
    debts.filter(d => d.status === 'active').forEach(d => {
      const c = d.currency || 'IDR';
      byCurrency[c] = (byCurrency[c] || 0) + (d.remaining_amount || 0);
    });
    return byCurrency;
  }, [debts]);

  // Calculate Net Worth per currency
  const netWorth = useMemo(() => {
    const currencies = new Set([...Object.keys(assets), ...Object.keys(liabilities)]);
    const result = {};
    currencies.forEach(c => {
      result[c] = (assets[c] || 0) - (liabilities[c] || 0);
    });
    return result;
  }, [assets, liabilities]);

  // Primary currency — selalu IDR sebagai utama
  const primaryCurrency = 'IDR';
  const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);
  const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);
  const totalNetWorth = totalAssets - totalLiabilities;

  // Chart data
  const comparisonData = Object.keys(netWorth).map(c => ({
    currency: c,
    assets: assets[c] || 0,
    liabilities: liabilities[c] || 0,
    netWorth: netWorth[c] || 0,
  }));

  // Asset breakdown
  const accountsList = accounts.filter(a => a.is_active !== false).map((a, i) => ({
    name: a.name,
    value: a.current_balance || 0,
    currency: a.currency,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Liability breakdown
  const debtsList = debts.filter(d => d.status === 'active').map((d, i) => ({
    name: d.creditor_name,
    value: d.remaining_amount || 0,
    currency: d.currency,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
              {p.name}: <span className="font-bold">{formatCompact(p.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      <PageHeader 
        title={t('netWorthTitle')} 
        subtitle={t('netWorthSubtitle')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard
          title={t('totalAssets')}
          value={formatCompact(totalAssets, 'IDR')}
          subtitle={`${accounts.filter(a => a.is_active !== false).length} ${t('accountsPlusReceivable')}`}
          icon={Wallet}
          color="emerald"
        />
        <KpiCard
          title={t('totalLiabilities')}
          value={formatCompact(totalLiabilities, 'IDR')}
          subtitle={`${debts.filter(d => d.status === 'active').length} ${t('activeDebts')}`}
          icon={AlertCircle}
          color="red"
        />
        <KpiCard
          title={t('netWorthLabel')}
          value={formatCompact(totalNetWorth, 'IDR')}
          subtitle={totalNetWorth >= 0 ? t('assetsAboveLiabilities') : t('liabilitiesAboveAssets')}
          icon={totalNetWorth >= 0 ? TrendingUp : TrendingDown}
          color={totalNetWorth >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* Multi-Currency Comparison */}
      <SectionCard title={t('comparisonByCurrency')} subtitle={t('assetsVsLiabilities')}>
        {comparisonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
              <XAxis dataKey="currency" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="assets" name={t('assets')} fill="#10B981" radius={[10, 10, 0, 0]} maxBarSize={46} animationDuration={800} />
              <Bar dataKey="liabilities" name={t('liabilities')} fill="#EF4444" radius={[10, 10, 0, 0]} maxBarSize={46} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">{t('noData')}</div>
        )}
      </SectionCard>

      {/* Asset & Liability Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title={t('assetDistribution')} subtitle={`${t('total')}: ${formatCompact(totalAssets, 'IDR')}`}>
          {accountsList.length > 0 ? (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={accountsList} cx="50%" cy="50%" innerRadius={48} outerRadius={80} cornerRadius={8} dataKey="value" paddingAngle={4} animationDuration={800}>
                    {accountsList.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCompact(v, 'IDR')} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {accountsList.map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.fill }} />
                      <span className="text-xs text-muted-foreground truncate">{a.name}</span>
                    </div>
                    <span className="text-xs font-semibold shrink-0">{formatCompact(a.value, a.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">{t('noAssets')}</div>
          )}
        </SectionCard>

        <SectionCard title={t('liabilityDistribution')} subtitle={`${t('total')}: ${formatCompact(totalLiabilities, 'IDR')}`}>
          {debtsList.length > 0 ? (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={debtsList} cx="50%" cy="50%" innerRadius={48} outerRadius={80} cornerRadius={8} dataKey="value" paddingAngle={4} animationDuration={800}>
                    {debtsList.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCompact(v, 'IDR')} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {debtsList.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                      <span className="text-xs text-muted-foreground truncate">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold shrink-0">{formatCompact(d.value, d.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">{t('noLiabilities')}</div>
          )}
        </SectionCard>
      </div>

      {/* Summary Table */}
      <SectionCard title={t('summaryByCurrency')} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{t('currency')}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-emerald-600">{t('assets')}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-red-500">{t('liabilities')}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground">{t('netWorthLabel')}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{t('assetRatio')}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => {
                const ratio = row.assets > 0 ? ((row.assets / (row.assets + row.liabilities)) * 100) : 0;
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold">{row.currency}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCurrency(row.assets, row.currency)}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">{formatCurrency(row.liabilities, row.currency)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${row.netWorth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {row.netWorth >= 0 ? '+' : ''}{formatCurrency(row.netWorth, row.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">{ratio.toFixed(1)}% {t('assets')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}