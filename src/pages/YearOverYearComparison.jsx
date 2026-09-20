import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { formatCurrency, formatCompact } from '@/lib/utils/finance';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear + 15 - i);

export default function YearOverYearComparison() {
  const { user } = useAuth();
  const uid = user?.id;
  const [yearA, setYearA] = useState(currentYear);
  const [yearB, setYearB] = useState(currentYear - 1);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', uid],
    queryFn: () => uid ? Transaction.list() : [],
    enabled: !!uid
  });

  const getMonthIdx = (d) => d ? new Date(d).getMonth() : -1;
  const getYear = (d) => d ? new Date(d).getFullYear() : null;

  const monthlyData = useMemo(() => {
    const data = MONTHS.map(month => ({ month, yearAIncome: 0, yearAExpense: 0, yearBIncome: 0, yearBExpense: 0 }));
    transactions.forEach(tx => {
      if (tx.currency !== 'IDR') return;
      const m = getMonthIdx(tx.date);
      const y = getYear(tx.date);
      if (m === -1 || !y) return;
      if (tx.type === 'income' || tx.type === 'receivable_receipt') {
        if (y === yearA) data[m].yearAIncome += tx.amount || 0;
        if (y === yearB) data[m].yearBIncome += tx.amount || 0;
      } else if (tx.type === 'expense') {
        if (y === yearA) data[m].yearAExpense += tx.amount || 0;
        if (y === yearB) data[m].yearBExpense += tx.amount || 0;
      }
    });
    return data;
  }, [transactions, yearA, yearB]);

  const totals = useMemo(() => {
    let aInc = 0, aExp = 0, aSav = 0, bInc = 0, bExp = 0, bSav = 0;
    transactions.forEach(tx => {
      if (tx.currency !== 'IDR') return;
      const y = getYear(tx.date);
      const amt = tx.amount || 0;
      if (tx.type === 'income' || tx.type === 'receivable_receipt') {
        if (y === yearA) aInc += amt; if (y === yearB) bInc += amt;
      } else if (tx.type === 'expense') {
        if (y === yearA) aExp += amt; if (y === yearB) bExp += amt;
      } else if (tx.type === 'saving') {
        if (y === yearA) aSav += amt; if (y === yearB) bSav += amt;
      }
    });
    return { aInc, aExp, aSav, bInc, bExp, bSav, aNet: aInc - aExp, bNet: bInc - bExp };
  }, [transactions, yearA, yearB]);

  const pct = (a, b) => b > 0 ? ((a - b) / b) * 100 : 0;
  const incG = pct(totals.aInc, totals.bInc);
  const expG = pct(totals.aExp, totals.bExp);
  const savG = pct(totals.aSav, totals.bSav);
  const netG = pct(totals.aNet, totals.bNet);

  const summary = useMemo(() => {
    const pts = [];
    if (incG > 0) pts.push(`Pendapatan meningkat ${incG.toFixed(1)}% dibanding ${yearB}.`);
    else if (incG < 0) pts.push(`Pendapatan turun ${Math.abs(incG).toFixed(1)}% dibanding ${yearB}.`);
    if (expG < 0) pts.push(`Pengeluaran berhasil ditekan sebesar ${Math.abs(expG).toFixed(1)}%.`);
    else if (expG > 0) pts.push(`Pengeluaran meningkat ${expG.toFixed(1)}%, perlu diwaspadai.`);
    if (totals.aNet > totals.bNet) pts.push(`Net income ${yearA} lebih baik +${formatCompact(totals.aNet - totals.bNet)} dari ${yearB}.`);
    else if (totals.aNet < totals.bNet) pts.push(`Net income ${yearA} lebih rendah dibanding ${yearB}.`);
    if (savG > 0) pts.push(`Tabungan meningkat ${savG.toFixed(1)}%.`);
    return pts;
  }, [incG, expG, savG, totals, yearA, yearB]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{formatCompact(p.value)}</span></p>
          ))}
        </div>
      );
    }
    return null;
  };

  const GrowthBadge = ({ growth, inverse = false }) => {
    const isGood = inverse ? growth <= 0 : growth >= 0;
    return (
      <div className={`flex items-center gap-1 text-xs ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
        {isGood ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        <span>{growth > 0 ? '+' : ''}{growth.toFixed(1)}% vs {yearB}</span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="Year-over-Year Comparison" subtitle="Bandingkan data keuangan antara dua tahun manapun secara fleksibel" />

      {/* Year Selectors */}
      <div className="bg-card border border-border rounded-2xl px-5 py-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#0D4F6D]" />
          <span className="text-sm font-semibold text-muted-foreground">Tahun Pertama:</span>
          <select
            value={yearA}
            onChange={e => setYearA(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-bold text-[#0D4F6D] focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <span className="text-2xl font-bold text-muted-foreground select-none">↔</span>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-muted-foreground">Tahun Pembanding:</span>
          <select
            value={yearB}
            onChange={e => setYearB(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-bold text-emerald-600 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Analysis Summary */}
      {summary.length > 0 && (
        <div className="bg-gradient-to-r from-[#0D4F6D]/8 to-emerald-50 dark:from-[#0D4F6D]/20 dark:to-emerald-950/20 border border-[#0D4F6D]/20 rounded-2xl p-4">
          <p className="text-xs font-bold text-[#0D4F6D] uppercase tracking-wide mb-2">Ringkasan Analisis — {yearA} vs {yearB}</p>
          <div className="space-y-1">
            {summary.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#0D4F6D] text-sm">•</span>
                <p className="text-sm text-foreground">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: `Pendapatan ${yearA}`, val: totals.aInc, comp: totals.bInc, g: incG, color: 'text-emerald-600' },
          { label: `Pengeluaran ${yearA}`, val: totals.aExp, comp: totals.bExp, g: expG, color: 'text-red-500', inverse: true },
          { label: `Tabungan ${yearA}`, val: totals.aSav, comp: totals.bSav, g: savG, color: 'text-indigo-600' },
          { label: `Net Income ${yearA}`, val: totals.aNet, comp: totals.bNet, g: netG, color: totals.aNet >= 0 ? 'text-emerald-600' : 'text-red-500' },
        ].map((k, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
            <p className={`text-base font-bold ${k.color}`}>{formatCompact(k.val)}</p>
            <GrowthBadge growth={k.g} inverse={k.inverse} />
            <p className="text-xs text-muted-foreground mt-0.5">{yearB}: {formatCompact(k.comp)}</p>
          </div>
        ))}
      </div>

      {/* Selisih Nominal */}
      <SectionCard title="Selisih Nominal" subtitle={`${yearA} vs ${yearB}`} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Metrik</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#0D4F6D]">{yearA}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-emerald-600">{yearB}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Selisih</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">%</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Pendapatan', a: totals.aInc, b: totals.bInc, g: incG },
                { name: 'Pengeluaran', a: totals.aExp, b: totals.bExp, g: expG },
                { name: 'Tabungan', a: totals.aSav, b: totals.bSav, g: savG },
                { name: 'Net Income', a: totals.aNet, b: totals.bNet, g: netG },
              ].map((row, i) => {
                const diff = row.a - row.b;
                const isGood = i === 1 ? diff <= 0 : diff >= 0;
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold">{row.name}</td>
                    <td className="px-4 py-3 text-right text-[#0D4F6D] font-medium">{formatCurrency(row.a, 'IDR')}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCurrency(row.b, 'IDR')}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff, 'IDR')}
                    </td>
                    <td className={`px-4 py-3 text-right text-xs font-bold ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
                      {row.g > 0 ? '+' : ''}{row.g.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Monthly Income Chart */}
      <SectionCard title="Perbandingan Pendapatan Bulanan" subtitle={`${yearA} vs ${yearB}`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="yearAIncome" stroke="#0D4F6D" name={`Pendapatan ${yearA}`} strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} animationDuration={900} />
            <Line type="monotone" dataKey="yearBIncome" stroke="#10B981" name={`Pendapatan ${yearB}`} strokeWidth={2.5} strokeDasharray="7 5" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} animationDuration={900} />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Monthly Expense Chart */}
      <SectionCard title="Perbandingan Pengeluaran Bulanan" subtitle={`${yearA} vs ${yearB}`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="yearAExpense" stroke="#EF4444" name={`Pengeluaran ${yearA}`} strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} animationDuration={900} />
            <Line type="monotone" dataKey="yearBExpense" stroke="#F97316" name={`Pengeluaran ${yearB}`} strokeWidth={2.5} strokeDasharray="7 5" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} animationDuration={900} />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Bar Comparison */}
      <SectionCard title="Perbandingan Total Tahunan" subtitle={`Semua metrik: ${yearA} vs ${yearB}`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { name: 'Pendapatan', [yearA]: totals.aInc, [yearB]: totals.bInc },
              { name: 'Pengeluaran', [yearA]: totals.aExp, [yearB]: totals.bExp },
              { name: 'Tabungan', [yearA]: totals.aSav, [yearB]: totals.bSav },
              { name: 'Net Income', [yearA]: Math.max(0, totals.aNet), [yearB]: Math.max(0, totals.bNet) },
            ]}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" opacity={0.55} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey={String(yearA)} fill="#0D4F6D" radius={[10, 10, 0, 0]} maxBarSize={48} name={String(yearA)} animationDuration={800} />
            <Bar dataKey={String(yearB)} fill="#10B981" radius={[10, 10, 0, 0]} maxBarSize={48} name={String(yearB)} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Monthly Detail Table */}
      <SectionCard title="Rekap Bulanan Detail" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Bulan</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#0D4F6D]">{yearA} Income</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-emerald-600">{yearB} Income</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Δ</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-red-500">{yearA} Expense</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-orange-500">{yearB} Expense</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Δ</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row, i) => {
                const incD = row.yearAIncome - row.yearBIncome;
                const expD = row.yearAExpense - row.yearBExpense;
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold">{row.month}</td>
                    <td className="px-4 py-3 text-right text-[#0D4F6D] font-medium">{formatCurrency(row.yearAIncome, 'IDR')}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCurrency(row.yearBIncome, 'IDR')}</td>
                    <td className={`px-4 py-3 text-right text-xs font-bold ${incD >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {incD >= 0 ? '+' : ''}{formatCompact(Math.abs(incD))}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">{formatCurrency(row.yearAExpense, 'IDR')}</td>
                    <td className="px-4 py-3 text-right text-orange-500 font-medium">{formatCurrency(row.yearBExpense, 'IDR')}</td>
                    <td className={`px-4 py-3 text-right text-xs font-bold ${expD <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {expD > 0 ? '+' : ''}{formatCompact(Math.abs(expD))}
                    </td>
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