import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Account, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import GlobalFilter from '@/components/ui/GlobalFilter';
import { formatCurrency, formatCompact, groupByCategory, CHART_COLORS, filterTransactionsByPeriod, MONTHS_ID } from '@/lib/utils/finance';
import AccountLogo from '@/components/ui/AccountLogo';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function DashboardTahunan() {
  const { user } = useAuth();
  const uid = user?.id;
  const [filters, setFilters] = useState({ year: String(currentYear), month: String(currentMonth), currency: '' });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', uid],
    queryFn: () => uid ? Transaction.list() : [],
    enabled: !!uid,
    staleTime: 60000,
    gcTime: 15 * 60 * 1000
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', uid],
    queryFn: () => uid ? Account.list() : [],
    enabled: !!uid,
    staleTime: 60000,
  });

  // Filter berdasarkan year (dan month jika dipilih)
  const txFiltered = useMemo(() => {
    let txs = filterTransactionsByPeriod(transactions, filters.year, filters.month);
    if (filters.currency) txs = txs.filter(t => t.currency === filters.currency);
    return txs;
  }, [transactions, filters]);
  
  // Jika pilih bulan spesifik, hanya tampilkan bulan itu; jika pilih tahun, tampilkan seluruh tahun
  const isSingleMonth = filters.month && filters.month !== '';
  
  const txThisYear = useMemo(() =>
    filterTransactionsByPeriod(transactions, filters.year, ''),
    [transactions, filters.year]
  );

  // Rekap per bulan tahun ini
  const monthlyData = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, (_, i) => ({
      label: MONTHS_ID[i],
      bulan: i + 1,
      income: 0, expense: 0, saving: 0, debt: 0, receivable: 0
    }));
    txThisYear.forEach(t => {
      const m = new Date(t.date).getMonth(); // 0-indexed
      if (filters.currency && t.currency !== filters.currency) return;
      if (t.type === 'income') byMonth[m].income += t.amount || 0;
      if (t.type === 'expense') byMonth[m].expense += t.amount || 0;
      if (t.type === 'saving') byMonth[m].saving += t.amount || 0;
      if (t.type === 'debt_payment') byMonth[m].debt += t.amount || 0;
      if (t.type === 'receivable_receipt') byMonth[m].receivable += t.amount || 0;
    });
    return byMonth;
  }, [txThisYear, filters.currency]);

  // Ringkasan tahunan
  const yearSummary = useMemo(() => {
    return monthlyData.reduce((acc, m) => ({
      income: acc.income + m.income,
      expense: acc.expense + m.expense,
      saving: acc.saving + m.saving,
      debt: acc.debt + m.debt,
      receivable: acc.receivable + m.receivable,
    }), { income: 0, expense: 0, saving: 0, debt: 0, receivable: 0 });
  }, [monthlyData]);

  // Kategori pengeluaran & pendapatan periode filter
  const incomeByCategory = useMemo(() => {
    return groupByCategory(txFiltered.filter(t => t.type === 'income')).slice(0, 8).map((c, i) => ({ ...c, fill: CHART_COLORS[i] }));
  }, [txFiltered]);

  const expenseByCategory = useMemo(() => {
    return groupByCategory(txFiltered.filter(t => t.type === 'expense')).slice(0, 8).map((c, i) => ({ ...c, fill: CHART_COLORS[i] }));
  }, [txFiltered]);

  const cf = yearSummary.income - yearSummary.expense;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Rekap ${isSingleMonth ? MONTHS_ID[parseInt(filters.month) - 1] + ' ' : ''}${filters.year}`}
        subtitle="Analisis keuangan per periode"
      />

      <GlobalFilter filters={filters} onChange={setFilters} showAccount={false} />

      {/* KPI Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Pendapatan', value: yearSummary.income, color: 'text-emerald-600' },
          { label: 'Total Pengeluaran', value: yearSummary.expense, color: 'text-red-500' },
          { label: 'Total Tabungan', value: yearSummary.saving, color: 'text-indigo-600' },
          { label: 'Bayar Hutang', value: yearSummary.debt, color: 'text-amber-600' },
          { label: 'Cash Flow', value: cf, color: cf >= 0 ? 'text-emerald-600' : 'text-red-500' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-[1.2px] text-muted-foreground mb-1">{k.label}</p>
            <p className={`text-base font-heading font-bold ${k.color}`}>
              {cf >= 0 && k.label === 'Cash Flow' ? '+' : ''}{formatCurrency(k.value, filters.currency || 'IDR')}
            </p>
          </div>
        ))}
      </div>

      {/* Grafik Bulanan Tahun Ini */}
      {!isSingleMonth && (
      <SectionCard title={`Tren Bulanan ${filters.year}`} subtitle={`Pendapatan vs Pengeluaran • ${filters.currency || 'IDR'}`}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
            <Tooltip formatter={v => formatCompact(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="income" name="Pendapatan" fill="#10B981" radius={[10,10,0,0]} />
            <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[10,10,0,0]} />
            <Bar dataKey="saving" name="Tabungan" fill="#6366F1" radius={[10,10,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
      )}

      {/* Tabel Rekap Per Bulan */}
      {!isSingleMonth && (
      <SectionCard title={`Rekap Per Bulan — ${filters.year}`} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Bulan', 'Pendapatan', 'Pengeluaran', 'Tabungan', 'Bayar Hutang', 'Terima Piutang', 'Cash Flow'].map(h => (
                  <th key={h} className="text-right first:text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((r, i) => {
                const mcf = r.income - r.expense;
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#0D4F6D]">{r.label}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCurrency(r.income, filters.currency || 'IDR')}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">{formatCurrency(r.expense, filters.currency || 'IDR')}</td>
                    <td className="px-4 py-3 text-right text-indigo-600 font-medium">{formatCurrency(r.saving, filters.currency || 'IDR')}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(r.debt, filters.currency || 'IDR')}</td>
                    <td className="px-4 py-3 text-right text-teal-600">{formatCurrency(r.receivable, filters.currency || 'IDR')}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${mcf >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {mcf >= 0 ? '+' : ''}{formatCurrency(mcf, filters.currency || 'IDR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 font-bold text-sm">
                <td className="px-4 py-3 text-[#0D4F6D]">TOTAL</td>
                <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(yearSummary.income, filters.currency || 'IDR')}</td>
                <td className="px-4 py-3 text-right text-red-500">{formatCurrency(yearSummary.expense, filters.currency || 'IDR')}</td>
                <td className="px-4 py-3 text-right text-indigo-600">{formatCurrency(yearSummary.saving, filters.currency || 'IDR')}</td>
                <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(yearSummary.debt, filters.currency || 'IDR')}</td>
                <td className="px-4 py-3 text-right text-teal-600">{formatCurrency(yearSummary.receivable, filters.currency || 'IDR')}</td>
                <td className={`px-4 py-3 text-right ${cf >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {cf >= 0 ? '+' : ''}{formatCurrency(cf, filters.currency || 'IDR')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        </SectionCard>
        )}

        {/* Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Pendapatan per Kategori" subtitle={`${isSingleMonth ? MONTHS_ID[parseInt(filters.month) - 1] : 'Tahun'} ${filters.year}`}>
          {incomeByCategory.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">Belum ada data pendapatan</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incomeByCategory} layout="vertical" margin={{ top: 0, right: 10, left: 70, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={v => formatCompact(v)} />
                <Bar dataKey="total" name="Total" radius={[0, 10, 10, 0]} maxBarSize={24} animationDuration={800}>
                  {incomeByCategory.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Pengeluaran per Kategori" subtitle={`${isSingleMonth ? MONTHS_ID[parseInt(filters.month) - 1] : 'Tahun'} ${filters.year}`}>
          {expenseByCategory.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">Belum ada data pengeluaran</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={expenseByCategory} layout="vertical" margin={{ top: 0, right: 10, left: 70, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={v => formatCompact(v)} />
                <Bar dataKey="total" name="Total" radius={[0, 10, 10, 0]} maxBarSize={24} animationDuration={800}>
                  {expenseByCategory.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Rekap Saldo Akun */}
      {accounts.filter(a => a.is_active !== false).length > 0 && (
        <SectionCard title="Rekap Saldo Akun" subtitle="Saldo terkini per rekening">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.filter(a => a.is_active !== false).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AccountLogo account={a} size={40} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{a.currency}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${(a.current_balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatCurrency(a.current_balance || 0, a.currency)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}