import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Debt, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertTriangle, Clock, ArrowRight, Eye } from 'lucide-react';
import DebtDetail from '@/components/hutang/DebtDetail';
import DebtMobileList from '@/components/hutang/DebtMobileList';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import KpiCard from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatCompact, formatDate } from '@/lib/utils/finance';
import { CatDebt } from '@/components/ui/CatIllustration';
import { usePageLang } from '@/lib/pageTranslations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Hutang() {
  const T = usePageLang('hutang');
  const { user } = useAuth();
  const uid = user?.id;
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('active');
  const [detailDebt, setDetailDebt] = useState(null);
  const { data: debts = [] } = useQuery({ queryKey: ['debts', uid], queryFn: () => uid ? Debt.list() : [], enabled: !!uid });
  const { data: allTransactions = [] } = useQuery({ queryKey: ['transactions', uid], queryFn: () => uid ? Transaction.list() : [], enabled: !!uid });
  const transactions = useMemo(() => allTransactions.filter(t => t.type === 'debt_payment'), [allTransactions]);

  const filtered = useMemo(() => debts.filter(d => statusFilter === 'all' || d.status === statusFilter), [debts, statusFilter]);
  const activeDebts = debts.filter(d => d.status === 'active');
  const totalActive = activeDebts.reduce((s, d) => s + (d.remaining_amount || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = activeDebts.filter(d => d.due_date && d.due_date < today);

  // Chart: monthly debt payments dari transaksi
  const chartData = useMemo(() => {
    const byMonth = {};
    transactions.forEach(p => {
      const m = p.date?.substring(0, 7);
      if (m) byMonth[m] = (byMonth[m] || 0) + (p.amount || 0);
    });
    return Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ label: k, amount: v }));
  }, [transactions]);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-5 flex items-center justify-between overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
        <div>
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">Debt Tracker</p>
          <h1 className="text-white font-heading font-bold text-2xl">{T.pageTitle}</h1>
          <p className="text-white/80 text-sm mt-1">{T.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <CatDebt size={65} />
          <Button onClick={() => navigate('/transaksi')} size="sm" className="bg-white text-amber-700 hover:bg-white/90 font-semibold">
            <ArrowRight size={14} className="mr-1.5" /> {T.recordDebt}
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm">
        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <ArrowRight size={13} className="text-amber-600" />
        </div>
        <p className="text-amber-800 text-xs flex-1">{T.infoBanner}</p>
        <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 text-xs shrink-0" onClick={() => navigate('/transaksi')}>{T.toTransaction}</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title={T.totalActiveDebt} value={formatCompact(totalActive)} icon={CreditCard} color="amber" />
        <KpiCard title={T.activeCount} value={activeDebts.length} icon={AlertTriangle} color="red" />
        <KpiCard title={T.dueDate} value={overdue.length} icon={Clock} color="red" />
        <KpiCard title={T.paidOff} value={debts.filter(d => d.status === 'paid').length} icon={CheckCircle} color="emerald" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {chartData.length > 0 && (
          <SectionCard title={T.paymentHistory} subtitle={T.clusteredPerMonth}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} />
                <Tooltip formatter={v => formatCompact(v)} />
                <Bar dataKey="amount" name={T.paymentHistory} fill="#F59E0B" radius={[10,10,0,0]} maxBarSize={44} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        )}
        {debts.length > 0 && (
          <SectionCard title={T.repaymentProgress} subtitle={T.totalVsRemaining}>
            <div className="space-y-3 pt-1">
              {debts.filter(d => d.status === 'active').slice(0, 5).map((d, i) => {
                const paid = (d.total_amount || 0) - (d.remaining_amount || 0);
                const pct = d.total_amount > 0 ? (paid / d.total_amount) * 100 : 0;
                return (
                  <div key={d.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{d.creditor_name}</span>
                      <span className="text-muted-foreground">{pct.toFixed(0)}% {T.percentPaid}</span>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: pct >= 100 ? 'linear-gradient(90deg,#10B981,#34D399)' : 'linear-gradient(90deg,#D97706,#FBBF24)' }} />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-card/70" />
                    </div>
                    <div className="flex justify-between text-xs mt-0.5 text-muted-foreground">
                      <span>{T.paidLabel}: {formatCompact(paid)}</span>
                      <span>{T.remaining}: {formatCompact(d.remaining_amount || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Debt list */}
      <SectionCard
        title={T.debtList}
        action={
          <div className="flex gap-1.5">
            {['all', 'active', 'paid'].map(s => (
              <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} className={`h-7 text-xs ${statusFilter === s ? 'bg-[#0D4F6D]' : ''}`} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? T.allFilter : s === 'active' ? T.activeFilter : T.paidFilter}
              </Button>
            ))}
          </div>
        }
        noPadding
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CreditCard size={40} className="mb-3 opacity-30" />
            <p className="text-sm">{T.noDebt}</p>
            <p className="text-xs mt-1 opacity-60">{T.noDebtHint}</p>
          </div>
        ) : (
          <>
          <DebtMobileList debts={filtered} today={today} onDetail={setDetailDebt} onPay={() => navigate('/transaksi')} T={T} />
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[T.colNo, T.colCreditor, 'Pokok Pinjaman', 'Bunga & Total', T.colRemaining, T.colDue, T.colStatus, T.colAction].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, idx) => {
                  const isOverdue = d.due_date && d.due_date < today && d.status === 'active';
                  const progress = d.total_amount > 0 ? (1 - (d.remaining_amount || 0) / d.total_amount) * 100 : 0;
                  const paidAmt = (d.total_amount || 0) - (d.remaining_amount || 0);
                  // Hitung bunga: interest_rate = % per bulan, dihitung dari pokok
                  const hasInterest = d.interest_rate > 0;
                  const interestPerMonth = hasInterest ? (d.total_amount || 0) * (d.interest_rate / 100) : 0;
                  // Estimasi bunga total berdasarkan durasi (jika ada due_date dan created_date)
                  let totalInterest = 0;
                  if (hasInterest && d.due_date && d.created_date) {
                    const start = new Date(d.created_date);
                    const end = new Date(d.due_date);
                    const months = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)));
                    totalInterest = interestPerMonth * months;
                  } else if (hasInterest) {
                    totalInterest = interestPerMonth; // minimal 1 bulan
                  }
                  const totalWithInterest = (d.total_amount || 0) + totalInterest;
                  return (
                    <tr key={d.id} className={`border-b border-border last:border-0 transition-colors ${isOverdue ? 'bg-red-50/30 hover:bg-red-50/50 dark:bg-red-950/10' : 'hover:bg-muted/20'}`}>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <span className="text-amber-700 font-bold text-xs">{d.creditor_name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{d.creditor_name}</div>
                            <div className="text-xs text-muted-foreground">{d.currency}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{formatCurrency(d.total_amount, d.currency)}</div>
                        <div className="text-xs text-muted-foreground">Terbayar: {formatCurrency(paidAmt, d.currency)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {hasInterest ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-orange-500 font-bold bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">{d.interest_rate}%/bln</span>
                            </div>
                            <div className="text-xs text-orange-600 font-semibold">+{formatCurrency(totalInterest, d.currency)}</div>
                            <div className="text-xs font-bold text-red-600 border-t border-dashed border-red-200 pt-0.5">
                              Total: {formatCurrency(totalWithInterest, d.currency)}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">Tanpa bunga</span>
                            <div className="text-xs font-bold text-foreground mt-0.5">= {formatCurrency(d.total_amount, d.currency)}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-amber-600 text-sm">{formatCurrency(d.remaining_amount || 0, d.currency)}</div>
                        <div className="mt-1.5 w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress >= 100 ? '#10B981' : 'linear-gradient(90deg, #F59E0B, #D97706)' }} />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{progress.toFixed(0)}% {T.percentPaid}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm font-medium ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {d.due_date ? formatDate(d.due_date) : '—'}
                        </div>
                        {isOverdue && <Badge className="mt-1 text-xs bg-red-100 text-red-600 border-red-200 border">{T.overdue}</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs font-medium px-2 py-1 ${d.status === 'active' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                          {d.status === 'active' ? T.statusActive : T.statusPaid}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setDetailDebt(d)}>
                            <Eye size={12} className="mr-1" /> Detail
                          </Button>
                         {d.status === 'active' && (
                           <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 whitespace-nowrap" onClick={() => navigate('/transaksi')}>
                              {T.payBtn}
                           </Button>
                         )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </SectionCard>



      <DebtDetail debt={detailDebt} open={!!detailDebt} onClose={() => setDetailDebt(null)} />
    </div>
  );
}