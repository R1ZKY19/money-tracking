import { useState, useMemo } from 'react';
import TxMobileList from '@/components/transactions/TxMobileList';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { History, Search, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import ExportButton from '@/components/ui/ExportButton';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import KpiCard from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatCompact, formatDate, filterTransactionsByPeriod, buildMonthlyTrend, CHART_COLORS } from '@/lib/utils/finance';
import { usePageLang } from '@/lib/pageTranslations';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const TX_TYPE_COLORS = {
  income: 'bg-emerald-100 text-emerald-700',
  expense: 'bg-red-100 text-red-700',
  saving: 'bg-indigo-100 text-indigo-700',
  debt_payment: 'bg-amber-100 text-amber-700',
  receivable_receipt: 'bg-teal-100 text-teal-700',
};
const getTypeColor = (type) => TX_TYPE_COLORS[type] || 'bg-gray-100 text-gray-700';

const PAGE_SIZE = 50;

export default function RiwayatTransaksi() {
  const T = usePageLang('riwayat');
  const { user } = useAuth();
  const uid = user?.id;
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(currentMonth));
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', uid],
    queryFn: () => uid ? Transaction.list() : [],
    enabled: !!uid
  });

  const filtered = useMemo(() => {
    let txs = month ? filterTransactionsByPeriod(transactions, year, month) : transactions.filter(t => String(new Date(t.date).getFullYear()) === year);
    if (typeFilter) txs = txs.filter(t => t.type === typeFilter);
    if (categoryFilter) txs = txs.filter(t => (t.category_name || '') === categoryFilter);
    if (accountFilter) txs = txs.filter(t => (t.account_name || '') === accountFilter);
    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.category_name || '').toLowerCase().includes(q) ||
        (t.account_name || '').toLowerCase().includes(q)
      );
    }
    return txs.sort((a, b) => b.date?.localeCompare(a.date));
  }, [transactions, year, month, typeFilter, categoryFilter, accountFilter, search]);

  const categoryOptions = useMemo(() => [...new Set(transactions.map(t => t.category_name).filter(Boolean))].sort(), [transactions]);
  const accountOptions = useMemo(() => [...new Set(transactions.map(t => t.account_name).filter(Boolean))].sort(), [transactions]);

  // Group totals by currency
  const totalsByCurrency = useMemo(() => {
    const groups = {};
    filtered.forEach(t => {
      const c = t.currency || 'IDR';
      if (!groups[c]) groups[c] = { income: 0, expense: 0, saving: 0 };
      if (t.type === 'income') groups[c].income += t.amount || 0;
      if (t.type === 'expense') groups[c].expense += t.amount || 0;
      if (t.type === 'saving') groups[c].saving += t.amount || 0;
    });
    return groups;
  }, [filtered]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const totalSaving = filtered.filter(t => t.type === 'saving').reduce((s, t) => s + (t.amount || 0), 0);

  // Chart: monthly for selected year (all months)
  const getTypeLabel = (type) => {
    const map = { income: T.income, expense: T.expense, saving: T.saving, debt_payment: T.debtPayment, receivable_receipt: T.receivableReceipt };
    return map[type] || type;
  };

  const chartData = useMemo(() => {
    const trend = buildMonthlyTrend(transactions.filter(t => !typeFilter || t.type === typeFilter), year);
    return trend.map(m => ({ label: m.label, [T.income]: m.income, [T.expense]: m.expense, [T.saving]: m.saving }));
  }, [transactions, year, typeFilter, T.income, T.expense, T.saving]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{formatCompact(p.value)}</span></p>
        ))}
      </div>
    );
    return null;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={T.pageTitle}
        subtitle={T.pageSubtitle}
        action={
          <ExportButton
            transactions={filtered}
            title={`Riwayat_${MONTHS_ID[parseInt(month)-1] || 'Semua'}_${year}`}
            subtitle={`Periode: ${MONTHS_ID[parseInt(month)-1] || 'Semua Bulan'} ${year}`}
          />
        }
      />

      {/* Period filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={month || ''} onValueChange={v => { setMonth(v || ''); setPage(1); }}>
           <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
           <SelectContent>
             <SelectItem value={null}>{T.allMonths}</SelectItem>
             {MONTHS_ID.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
           </SelectContent>
         </Select>
        <Select value={year} onValueChange={v => { setYear(v); setPage(1); }}>
          <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 20 }, (_, i) => currentYear + 15 - i).map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter || ''} onValueChange={v => { setTypeFilter(v || ''); setPage(1); }}>
           <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder={T.allTypes} /></SelectTrigger>
           <SelectContent>
             <SelectItem value={null}>{T.allTypes}</SelectItem>
             {['income','expense','saving','debt_payment','receivable_receipt'].map(v => <SelectItem key={v} value={v}>{getTypeLabel(v)}</SelectItem>)}
           </SelectContent>
         </Select>
        <Select value={categoryFilter || ''} onValueChange={v => { setCategoryFilter(v || ''); setPage(1); }}>
           <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder={T.allCategories} /></SelectTrigger>
           <SelectContent>
             <SelectItem value={null}>{T.allCategories}</SelectItem>
             {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
           </SelectContent>
         </Select>
        <Select value={accountFilter || ''} onValueChange={v => { setAccountFilter(v || ''); setPage(1); }}>
           <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder={T.allAccounts} /></SelectTrigger>
           <SelectContent>
             <SelectItem value={null}>{T.allAccounts}</SelectItem>
             {accountOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
           </SelectContent>
         </Select>
        <div className="relative flex-1 min-w-36">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-7 h-8 text-xs" placeholder={T.search} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* KPIs + Chart side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <KpiCard
            title={T.totalIncome}
            value={Object.entries(totalsByCurrency).filter(([,v]) => v.income > 0).map(([c, v]) => formatCurrency(v.income, c)).join(' | ') || formatCurrency(0)}
            icon={TrendingUp}
            color="emerald"
          />
          <KpiCard
            title={T.totalExpense}
            value={Object.entries(totalsByCurrency).filter(([,v]) => v.expense > 0).map(([c, v]) => formatCurrency(v.expense, c)).join(' | ') || formatCurrency(0)}
            icon={TrendingDown}
            color="red"
          />
          <KpiCard
            title={T.totalSaving}
            value={Object.entries(totalsByCurrency).filter(([,v]) => v.saving > 0).map(([c, v]) => formatCurrency(v.saving, c)).join(' | ') || formatCurrency(0)}
            icon={PiggyBank}
            color="indigo"
          />
        </div>
        <div className="lg:col-span-2">
          <SectionCard title={T.incomeVsExpense} subtitle={`${T.trendYear} ${year}`}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey={T.income} fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={20} animationDuration={800} />
                <Bar dataKey={T.expense} fill="#EF4444" radius={[8, 8, 0, 0]} maxBarSize={20} animationDuration={800} />
                <Bar dataKey={T.saving} fill="#6366F1" radius={[8, 8, 0, 0]} maxBarSize={20} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>
      </div>

      {/* Table */}
      <SectionCard
        title={T.transactionList}
        subtitle={`${filtered.length} ${T.found}`}
        noPadding
      >
        <TxMobileList items={paginated} getTypeLabel={getTypeLabel} getTypeColor={getTypeColor} emptyText={T.noData} />
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[T.colDate, T.colType, T.colCategory, T.colFromTo, T.colNotes, T.colAmount].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <History size={32} className="mx-auto mb-2 opacity-30" />
                   {T.noData}
                </td></tr>
              ) : (
                paginated.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDate(t.date)}</td>
                    <td className="px-4 py-3"><Badge className={`text-xs ${getTypeColor(t.type)}`}>{getTypeLabel(t.type)}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.category_name || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.account_name || '-'}</td>
                    <td className="px-4 py-3 max-w-48 truncate text-xs">{t.description || '-'}</td>
                    <td className={`px-4 py-3 font-semibold whitespace-nowrap text-sm ${
                     t.type === 'transfer' 
                       ? (t.reference === 'TRANSFER-IN' ? 'text-emerald-600' : 'text-red-500')
                       : ['income', 'debt', 'receivable_receipt'].includes(t.type) ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                     {t.type === 'transfer'
                       ? (t.reference === 'TRANSFER-IN' ? '+' : '-')
                       : ['income', 'debt', 'receivable_receipt'].includes(t.type) ? '+' : '-'}
                     {formatCurrency(t.amount || 0, t.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{T.page} {page} {T.of} {totalPages}</span>
            <div className="flex gap-1">
              <button className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/50 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{T.prev}</button>
              <button className="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/50 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>{T.next}</button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}