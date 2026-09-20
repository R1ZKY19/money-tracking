import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Account, BudgetPlan, Debt, Receivable, Transaction } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { FileText, Wallet, ArrowUpRight, ArrowDownRight, Activity, CreditCard, HandCoins, Sparkles } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import KpiCard from '@/components/ui/KpiCard';
import GlobalFilter from '@/components/ui/GlobalFilter';
import AiFinancialCheck from '@/components/ai/AiFinancialCheck';
import ReportCategoryTable from '@/components/report/ReportCategoryTable';
import ReportBudgetTable from '@/components/report/ReportBudgetTable';
import ReportDueTable from '@/components/report/ReportDueTable';
import ReportExportMenu from '@/components/report/ReportExportMenu';
import AccountLogo from '@/components/ui/AccountLogo';
import { buildReport } from '@/lib/utils/financialReport';
import { formatCurrency, MONTHS_ID } from '@/lib/utils/finance';

const now = new Date();

export default function LaporanKeuangan() {
  const { user } = useAuth();
  const uid = user?.id;
  const [filters, setFilters] = useState({ year: String(now.getFullYear()), month: String(now.getMonth() + 1), currency: '' });
  const { data: transactions = [], isLoading } = useQuery({ queryKey: ['transactions', uid], queryFn: () => uid ? Transaction.list() : [], enabled: !!uid, staleTime: 60000 });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts', uid], queryFn: () => uid ? Account.list() : [], enabled: !!uid, staleTime: 60000 });
  const { data: debts = [] } = useQuery({ queryKey: ['debts', uid], queryFn: () => uid ? Debt.list() : [], enabled: !!uid, staleTime: 60000 });
  const { data: receivables = [] } = useQuery({ queryKey: ['receivables', uid], queryFn: () => uid ? Receivable.list() : [], enabled: !!uid, staleTime: 60000 });
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgetPlan', uid, filters.year, filters.month],
    queryFn: () => BudgetPlan.list(),
    enabled: !!uid && !!filters.month, staleTime: 60000,
  });

  const report = useMemo(() => buildReport({
    transactions: filters.currency ? transactions.filter(t => t.currency === filters.currency) : transactions,
    accounts: filters.currency ? accounts.filter(a => a.currency === filters.currency) : accounts,
    debts, receivables, budget: filters.month ? budgets[0] : null, year: filters.year, month: filters.month,
  }), [transactions, accounts, debts, receivables, budgets, filters]);

  const label = `${filters.month ? MONTHS_ID[Number(filters.month) - 1] : 'Semua Bulan'} ${filters.year}`;
  const cur = filters.currency || 'IDR';

  return (
    <div className="space-y-5 stagger">
      <PageHeader icon={FileText} title="Laporan Keuangan" subtitle={`Ringkasan lengkap periode ${label}`} action={<ReportExportMenu report={report} />} />
      <GlobalFilter filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard title="Total Saldo" value={formatCurrency(report.totalBalance, cur)} icon={Wallet} iconBg="rgba(37,99,235,0.1)" iconColor="#2563EB" accentClass="kpi-blue" loading={isLoading} />
        <KpiCard title="Pemasukan" value={formatCurrency(report.kpis.income, cur)} icon={ArrowUpRight} iconBg="rgba(16,185,129,0.1)" iconColor="#10B981" accentClass="kpi-green" loading={isLoading} />
        <KpiCard title="Pengeluaran" value={formatCurrency(report.kpis.expense, cur)} icon={ArrowDownRight} iconBg="rgba(239,68,68,0.1)" iconColor="#EF4444" accentClass="kpi-red" loading={isLoading} />
        <KpiCard title="Cash Flow" value={formatCurrency(report.kpis.cashFlow, cur)} icon={Activity} iconBg={report.kpis.cashFlow >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'} iconColor={report.kpis.cashFlow >= 0 ? '#10B981' : '#EF4444'} accentClass={report.kpis.cashFlow >= 0 ? 'kpi-green' : 'kpi-red'} loading={isLoading} />
        <KpiCard title="Hutang Aktif" value={formatCurrency(report.totalDebt, cur)} icon={CreditCard} iconBg="rgba(245,158,11,0.1)" iconColor="#F59E0B" accentClass="kpi-amber" loading={isLoading} />
        <KpiCard title="Piutang Aktif" value={formatCurrency(report.totalReceivable, cur)} icon={HandCoins} iconBg="rgba(20,184,166,0.1)" iconColor="#14B8A6" accentClass="kpi-teal" loading={isLoading} />
      </div>

      <SectionCard title="AI Financial Check" subtitle="Analisis pengeluaran, skor kesehatan & rekomendasi"
        action={<span className="flex items-center gap-1 text-[10px] font-bold text-amber-600"><Sparkles size={10} /> AI</span>}>
        <AiFinancialCheck report={report} />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Pendapatan per Kategori" subtitle={label} noPadding>
          <div className="overflow-x-auto"><ReportCategoryTable rows={report.incomeByCategory} total={report.kpis.income} color="#10B981" emptyText="Belum ada pendapatan" /></div>
        </SectionCard>
        <SectionCard title="Pengeluaran per Kategori" subtitle={label} noPadding>
          <div className="overflow-x-auto"><ReportCategoryTable rows={report.expenseByCategory} total={report.kpis.expense} color="#EF4444" emptyText="Belum ada pengeluaran" /></div>
        </SectionCard>
      </div>

      <SectionCard title="Budget vs Aktual" subtitle={filters.month ? label : 'Pilih bulan tertentu untuk melihat budget'} noPadding>
        <div className="overflow-x-auto"><ReportBudgetTable rows={report.budgetRows} /></div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Saldo Rekening" subtitle="Posisi saldo saat ini">
          {report.accounts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Belum ada rekening aktif</p> : (
            <div className="space-y-2">
              {report.accounts.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-primary/30 transition-colors">
                  <AccountLogo account={a} size={34} />
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{a.name}</p><p className="text-[10px] text-muted-foreground">{a.currency}</p></div>
                  <p className={`text-sm font-bold ${(a.current_balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(a.current_balance || 0, a.currency)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        <SectionCard title="Jatuh Tempo Hutang & Piutang" subtitle="Diurutkan dari yang paling dekat" noPadding>
          <div className="overflow-x-auto"><ReportDueTable items={report.dueItems} /></div>
        </SectionCard>
      </div>
    </div>
  );
}