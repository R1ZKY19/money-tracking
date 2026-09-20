import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receivable } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HandCoins, CheckCircle, Clock, Eye, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import ReceivableDetail from '@/components/piutang/ReceivableDetail';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import KpiCard from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatCompact, formatDate } from '@/lib/utils/finance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePageLang } from '@/lib/pageTranslations';
import { CatMoney } from '@/components/ui/CatIllustration';
import LoanStatusIcon from '@/components/shared/LoanStatusIcon';

export default function Piutang() {
  const T = usePageLang('piutang');
  const { user } = useAuth();
  const uid = user?.id;
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('active');
  const [detailReceivable, setDetailReceivable] = useState(null);
  const { data: receivables = [] } = useQuery({ queryKey: ['receivables', uid], queryFn: () => uid ? Receivable.list() : [], enabled: !!uid });

  const filtered = useMemo(() => receivables.filter(r => statusFilter === 'all' || r.status === statusFilter), [receivables, statusFilter]);
  const active = receivables.filter(r => r.status === 'active');
  const totalActive = active.reduce((s, r) => s + (r.remaining_amount || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = active.filter(r => r.due_date && r.due_date < today);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative rounded-2xl p-5 flex items-center justify-between overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 55%, #22D3EE 100%)' }}>
        <div className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 w-56 h-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">Receivable Tracker</p>
          <h1 className="text-white font-heading font-bold text-2xl">{T.pageTitle}</h1>
          <p className="text-white/80 text-sm mt-1">{T.pageSubtitle}</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <CatMoney size={65} />
          <Button onClick={() => navigate('/transaksi')} size="sm" className="bg-white text-teal-700 hover:bg-white/90 font-semibold shadow-lg">
            <ArrowRight size={14} className="mr-1.5" /> {T.recordReceivable}
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-teal-200 text-sm"
        style={{ background: 'linear-gradient(90deg, rgba(20,184,166,.12), rgba(34,211,238,.08) 60%, transparent)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg,#14B8A6,#0D9488)' }}>
          <ArrowRight size={13} />
        </div>
        <p className="text-teal-800 dark:text-teal-300 text-xs flex-1">{T.infoBanner}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title={T.totalActive} value={formatCompact(totalActive)} icon={HandCoins} color="teal" />
        <KpiCard title={T.activeCount} value={active.length} icon={HandCoins} color="navy" />
        <KpiCard title={T.overdue} value={overdue.length} icon={Clock} color="red" />
        <KpiCard title={T.completed} value={receivables.filter(r => r.status === 'completed').length} icon={CheckCircle} color="emerald" />
      </div>

      {/* Charts */}
      {receivables.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title={T.totalVsSisa} subtitle={T.perDebtor}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={receivables.map(r => ({ name: r.debtor_name?.length > 10 ? r.debtor_name.slice(0, 10) + '…' : r.debtor_name, terbayar: (r.total_amount||0) - (r.remaining_amount||0), sisa: r.remaining_amount || 0 }))} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCompact(v)} axisLine={false} tickLine={false} width={56} />
                <Tooltip formatter={(v, n) => [formatCompact(v), n === 'terbayar' ? T.terbayar : T.sisa]} />
                <Bar dataKey="terbayar" name={T.terbayar} fill="#14B8A6" radius={[0,0,0,0]} stackId="a" maxBarSize={42} animationDuration={800} />
                <Bar dataKey="sisa" name={T.sisa} fill="#CBD5E1" radius={[10,10,0,0]} stackId="a" maxBarSize={42} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
          <SectionCard title={T.progressReceivable} subtitle={T.progressPerDebtor}>
            <div className="space-y-4 pt-1 max-h-52 overflow-y-auto pr-1">
              {receivables.map((r) => {
                const hasInt = r.interest_rate > 0;
                const tInt = hasInt ? (r.total_amount || 0) * (r.interest_rate / 100) : 0;
                const totalDue = (r.total_amount || 0) + tInt;
                const paid = Math.max(0, totalDue - (r.remaining_amount || 0));
                const pct = totalDue > 0 ? Math.min(100, (paid / totalDue) * 100) : 0;
                const isLunas = r.status === 'completed';
                const isOverdue = r.due_date && r.due_date < today && r.status === 'active';
                const barColor = isLunas ? '#10B981' : isOverdue ? '#EF4444' : '#14B8A6';
                return (
                  <div key={r.id} className={`p-3 rounded-xl border ${isLunas ? 'bg-emerald-50 border-emerald-200' : isOverdue ? 'bg-red-50 border-red-200' : 'bg-muted/20 border-border'}`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold truncate max-w-[120px]">{r.debtor_name}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLunas ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-700'}`}>
                        {isLunas ? '✓ Lunas' : isOverdue ? '⚠ Menunggak' : `${pct.toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-card/80 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}bb)` }} />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-border/80" />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 text-muted-foreground">
                      <span>✓ {formatCompact(paid)}</span>
                      <span>Sisa {formatCompact(r.remaining_amount || 0)} / {formatCompact(totalDue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      <SectionCard
        title={T.receivableList}
        action={
          <div className="flex gap-1.5">
            {['all', 'active', 'completed'].map(s => (
              <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'}
                className={`h-7 text-xs ${statusFilter === s ? 'bg-[#0D4F6D]' : ''}`}
                onClick={() => setStatusFilter(s)}>
                {s === 'all' ? T.allFilter : s === 'active' ? T.activeFilter : T.completedFilter}
              </Button>
            ))}
          </div>
        }
        noPadding
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <HandCoins size={40} className="mb-3 opacity-30" />
            <p className="text-sm">{T.noReceivable}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {[T.colNo, T.colDebtor, 'Pokok Pinjaman', 'Bunga & Total', T.colRemaining, T.colDue, T.colStatus, T.colAction].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => {
                    const isOverdue = r.due_date && r.due_date < today && r.status === 'active';
                    const isLunas = r.status === 'completed';
                    const hasInterest = r.interest_rate > 0;
                    const totalInterest = hasInterest ? (r.total_amount || 0) * (r.interest_rate / 100) : 0;
                    const totalWithInterest = (r.total_amount || 0) + totalInterest;
                    // totalPaid = total yg harus dibayar - sisa
                    const receivedAmt = Math.max(0, totalWithInterest - (r.remaining_amount || 0));
                    const progress = totalWithInterest > 0 ? Math.min(100, (receivedAmt / totalWithInterest) * 100) : 0;
                    const rowBg = isLunas
                      ? 'bg-emerald-50 hover:bg-emerald-100/70 dark:bg-emerald-950/20 border-l-4 border-l-emerald-400'
                      : isOverdue
                      ? 'bg-red-50/60 hover:bg-red-50 dark:bg-red-950/15 border-l-4 border-l-red-400'
                      : 'hover:bg-muted/20 border-l-4 border-l-transparent';
                    return (
                      <tr key={r.id} className={`border-b border-border last:border-0 transition-colors ${rowBg}`}>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <LoanStatusIcon size={36} kind="receivable" state={isLunas ? 'paid' : isOverdue ? 'overdue' : 'active'} />
                            <div>
                              <div className="font-semibold text-foreground">{r.debtor_name}</div>
                              <div className="text-xs text-muted-foreground">{r.currency}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{formatCurrency(r.total_amount, r.currency)}</div>
                          <div className="text-xs text-muted-foreground">{T.receivedLabel}: {formatCurrency(receivedAmt, r.currency)}</div>
                        </td>
                        <td className="px-4 py-3">
                          {hasInterest ? (
                            <div className="space-y-0.5">
                              <span className="text-xs text-teal-600 font-bold bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5">{r.interest_rate}% flat</span>
                              <div className="text-xs text-teal-700 font-semibold">+{formatCurrency(totalInterest, r.currency)}</div>
                              <div className="text-xs font-bold text-emerald-700 border-t border-dashed border-emerald-200 pt-0.5">= {formatCurrency(totalWithInterest, r.currency)}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">Tanpa bunga</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`font-bold text-sm ${isLunas ? 'text-emerald-600' : 'text-teal-600'}`}>{formatCurrency(r.remaining_amount || 0, r.currency)}</div>
                          <div className="mt-1.5 w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: isLunas ? '#10B981' : isOverdue ? '#EF4444' : 'linear-gradient(90deg, #14B8A6, #0D9488)' }} />
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{progress.toFixed(0)}%</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-sm font-medium ${isOverdue ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                            {r.due_date ? formatDate(r.due_date) : '—'}
                          </div>
                          {isOverdue && <Badge className="mt-1 text-[10px] bg-red-100 text-red-600 border border-red-200">{T.overdueLabel}</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs font-bold px-2.5 py-1 ${isLunas ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-teal-100 text-teal-700 border border-teal-200'}`}>
                            {isLunas ? T.statusCompleted : T.statusActive}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setDetailReceivable(r)}>
                              <Eye size={12} className="mr-1" />{T.detailBtn}
                            </Button>
                            {!isLunas && (
                              <Button size="sm" variant="outline" className="h-7 text-xs text-teal-600 border-teal-200 hover:bg-teal-50 whitespace-nowrap" onClick={() => navigate('/transaksi')}>
                                {T.receiveBtn}
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

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((r, idx) => {
                const isOverdue = r.due_date && r.due_date < today && r.status === 'active';
                const isLunas = r.status === 'completed';
                const hasIntM = r.interest_rate > 0;
                const tIntM = hasIntM ? (r.total_amount || 0) * (r.interest_rate / 100) : 0;
                const totalDueM = (r.total_amount || 0) + tIntM;
                const progress = totalDueM > 0 ? Math.min(100, ((totalDueM - (r.remaining_amount || 0)) / totalDueM) * 100) : 0;
                return (
                  <div key={r.id} className={`p-4 ${isLunas ? 'bg-emerald-50/60' : isOverdue ? 'bg-red-50/40' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <LoanStatusIcon size={40} kind="receivable" state={isLunas ? 'paid' : isOverdue ? 'overdue' : 'active'} />
                        <div>
                          <p className="font-bold text-foreground text-sm">{r.debtor_name}</p>
                          <p className="text-xs text-muted-foreground">{r.currency} · {r.due_date ? formatDate(r.due_date) : 'Tanpa jatuh tempo'}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs font-bold shrink-0 ${isLunas ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : isOverdue ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-teal-100 text-teal-700 border border-teal-200'}`}>
                        {isLunas ? '✓ Lunas' : isOverdue ? '⚠ Telat' : 'Aktif'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white/70 rounded-lg p-2 border border-border">
                        <p className="text-[10px] text-muted-foreground">Total Tagihan{hasIntM ? '+Bunga' : ''}</p>
                        <p className="text-sm font-bold">{formatCurrency(totalDueM, r.currency)}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2 border border-border">
                        <p className="text-[10px] text-muted-foreground">Sisa Tagihan</p>
                        <p className={`text-sm font-bold ${isLunas ? 'text-emerald-600' : 'text-teal-600'}`}>{formatCurrency(r.remaining_amount || 0, r.currency)}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progress</span><span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: isLunas ? '#10B981' : isOverdue ? '#EF4444' : 'linear-gradient(90deg,#14B8A6,#0D9488)' }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-blue-600 border-blue-200" onClick={() => setDetailReceivable(r)}>
                        <Eye size={12} className="mr-1" /> Detail
                      </Button>
                      {!isLunas && (
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-teal-600 border-teal-200" onClick={() => navigate('/transaksi')}>
                          {T.receiveBtn}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SectionCard>

      <ReceivableDetail receivable={detailReceivable} open={!!detailReceivable} onClose={() => setDetailReceivable(null)} />


    </div>
  );
}