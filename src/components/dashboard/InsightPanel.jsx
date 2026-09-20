import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatCurrency, groupByCategory } from '@/lib/utils/finance';
import { useLanguage } from '@/lib/LanguageContext';

export default function InsightPanel({ transactions, accounts, debts, receivables }) {
  const { lang } = useLanguage();

  const labels = {
    id: {
      biggestExpense: 'Pengeluaran Terbesar',
      biggestIncome: 'Pendapatan Terbesar',
      biggestBalance: 'Saldo Terbesar',
      mostActiveAccount: 'Akun Teraktif',
      transactions: 'transaksi',
      biggestDebt: 'Hutang Terbesar',
      biggestReceivable: 'Piutang Terbesar',
      savingRate: 'Saving Rate',
      savingRateText: 'dari total pendapatan bulan ini',
      cashFlowPositive: 'Cash Flow Positif',
      cashFlowNegative: 'Cash Flow Negatif',
      noData: 'Belum ada data untuk insight',
    },
    en: {
      biggestExpense: 'Biggest Expense',
      biggestIncome: 'Biggest Income',
      biggestBalance: 'Highest Balance',
      mostActiveAccount: 'Most Active Account',
      transactions: 'transactions',
      biggestDebt: 'Biggest Debt',
      biggestReceivable: 'Biggest Receivable',
      savingRate: 'Saving Rate',
      savingRateText: 'of total income this month',
      cashFlowPositive: 'Positive Cash Flow',
      cashFlowNegative: 'Negative Cash Flow',
      noData: 'No data yet for insights',
    },
    ja: {
      biggestExpense: '最大支出',
      biggestIncome: '最大収入',
      biggestBalance: '最高残高',
      mostActiveAccount: '最活発口座',
      transactions: '取引',
      biggestDebt: '最大負債',
      biggestReceivable: '最大売掛金',
      savingRate: '貯蓄率',
      savingRateText: '今月の総収入の',
      cashFlowPositive: 'プラスキャッシュフロー',
      cashFlowNegative: 'マイナスキャッシュフロー',
      noData: 'インサイトのデータがありません',
    },
    ko: {
      biggestExpense: '최대 지출',
      biggestIncome: '최대 수입',
      biggestBalance: '최고 잔액',
      mostActiveAccount: '가장 활발한 계좌',
      transactions: '거래',
      biggestDebt: '최대 부채',
      biggestReceivable: '최대 매출채권',
      savingRate: '저축률',
      savingRateText: '이번 달 총 수입 대비',
      cashFlowPositive: '플러스 현금 흐름',
      cashFlowNegative: '마이너스 현금 흐름',
      noData: '인사이트 데이터 없음',
    },
    km: {
      biggestExpense: 'ចំណាយច្រើនបំផុត',
      biggestIncome: 'ចំណូលច្រើនបំផុត',
      biggestBalance: 'សមតុល្យខ្ពស់បំផុត',
      mostActiveAccount: 'គណនីសកម្មបំផុត',
      transactions: 'ប្រតិបត្តិការ',
      biggestDebt: 'បំណុលច្រើនបំផុត',
      biggestReceivable: 'គណនីទទួលច្រើនបំផុត',
      savingRate: 'អត្រាសន្សំ',
      savingRateText: 'នៃចំណូលសរុបខែនេះ',
      cashFlowPositive: 'លំហូរសាច់ប្រាក់វិជ្ជមាន',
      cashFlowNegative: 'លំហូរសាច់ប្រាក់អវិជ្ជមាន',
      noData: 'មិនទាន់មានទិន្នន័យ',
    },
    zh: {
      biggestExpense: '最大支出',
      biggestIncome: '最大收入',
      biggestBalance: '最高余额',
      mostActiveAccount: '最活跃账户',
      transactions: '笔交易',
      biggestDebt: '最大债务',
      biggestReceivable: '最大应收',
      savingRate: '储蓄率',
      savingRateText: '占本月总收入',
      cashFlowPositive: '正现金流',
      cashFlowNegative: '负现金流',
      noData: '暂无洞察数据',
    },
  };
  const L = labels[lang] || labels['id'];
  const insights = [];

  const expenses = transactions.filter(t => t.type === 'expense');
  const incomes = transactions.filter(t => t.type === 'income');

  if (expenses.length > 0) {
    const byCat = groupByCategory(expenses);
    if (byCat[0]) {
      insights.push({
        icon: TrendingDown, iconColor: '#EF4444', borderColor: 'border-red-400', badgeBg: 'bg-red-500',
        label: L.biggestExpense,
        text: `${byCat[0].name} — ${formatCurrency(byCat[0].total, transactions[0]?.currency || 'IDR')}`
      });
    }
  }

  if (incomes.length > 0) {
    const byCat = groupByCategory(incomes);
    if (byCat[0]) {
      insights.push({
        icon: TrendingUp, iconColor: '#10B981', borderColor: 'border-emerald-400', badgeBg: 'bg-emerald-500',
        label: L.biggestIncome,
        text: `${byCat[0].name} — ${formatCurrency(byCat[0].total, transactions[0]?.currency || 'IDR')}`
      });
    }
  }

  if (accounts.length > 0) {
    const sorted = [...accounts].sort((a, b) => (b.current_balance || 0) - (a.current_balance || 0));
    insights.push({
      icon: CheckCircle, iconColor: '#3B82F6', borderColor: 'border-blue-400', badgeBg: 'bg-blue-500',
      label: L.biggestBalance,
      text: `${sorted[0].name} — ${formatCurrency(sorted[0].current_balance || 0, sorted[0].currency)}`
    });

    const txCount = {};
    transactions.forEach(t => { if (t.account_id) txCount[t.account_id] = (txCount[t.account_id] || 0) + 1; });
    const maxEntry = Object.entries(txCount).sort((a, b) => b[1] - a[1])[0];
    if (maxEntry) {
      const acct = accounts.find(a => a.id === maxEntry[0]);
      if (acct) {
        insights.push({
          icon: Info, iconColor: '#8B5CF6', borderColor: 'border-violet-400', badgeBg: 'bg-violet-500',
          label: L.mostActiveAccount,
          text: `${acct.name} — ${maxEntry[1]} ${L.transactions}`
        });
      }
    }
  }

  if (debts.length > 0) {
    const biggest = [...debts].sort((a, b) => (b.remaining_amount || 0) - (a.remaining_amount || 0))[0];
    insights.push({
      icon: AlertTriangle, iconColor: '#F59E0B', borderColor: 'border-amber-400', badgeBg: 'bg-amber-500',
      label: L.biggestDebt,
      text: `${biggest.creditor_name} — ${formatCurrency(biggest.remaining_amount || 0, biggest.currency)}`
    });
  }

  if (receivables.length > 0) {
    const biggest = [...receivables].sort((a, b) => (b.remaining_amount || 0) - (a.remaining_amount || 0))[0];
    insights.push({
      icon: TrendingUp, iconColor: '#14B8A6', borderColor: 'border-teal-400', badgeBg: 'bg-teal-500',
      label: L.biggestReceivable,
      text: `${biggest.debtor_name} — ${formatCurrency(biggest.remaining_amount || 0, biggest.currency)}`
    });
  }

  const totalIncome = incomes.reduce((s, t) => s + (t.amount || 0), 0);
  const totalSaving = transactions.filter(t => t.type === 'saving').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = expenses.reduce((s, t) => s + (t.amount || 0), 0);

  if (totalIncome > 0) {
    const rate = ((totalSaving / totalIncome) * 100).toFixed(1);
    insights.push({
      icon: CheckCircle, iconColor: '#10B981', borderColor: 'border-emerald-400', badgeBg: 'bg-emerald-500',
      label: L.savingRate,
      text: `${rate}% ${L.savingRateText}`
    });
  }

  const cashFlow = totalIncome - totalExpense;
  insights.push({
    icon: cashFlow >= 0 ? TrendingUp : TrendingDown,
    iconColor: cashFlow >= 0 ? '#10B981' : '#EF4444',
    borderColor: cashFlow >= 0 ? 'border-emerald-400' : 'border-red-400',
    badgeBg: cashFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500',
    label: cashFlow >= 0 ? L.cashFlowPositive : L.cashFlowNegative,
    text: `${formatCurrency(Math.abs(cashFlow), 'IDR')}`
  });

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Lightbulb size={32} className="mb-2 opacity-30" />
        <p className="text-sm">{L.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {insights.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border-l-4 ${item.borderColor} bg-muted/40`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.badgeBg}`}>
              <Icon size={13} color="white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">{item.label}</p>
              <p className="text-sm font-medium text-foreground leading-snug truncate">{item.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}