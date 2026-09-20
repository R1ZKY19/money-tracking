import { calcFinancialScore, formatCurrency, formatCompact } from '@/lib/utils/finance';
import { TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const CIRCUMFERENCE = 2 * Math.PI * 36; // r=36

const LABELS = {
  id: { targetAchieved: 'Target tercapai ✓', targetNot: 'Target >20%', safe: 'Aman', caution: 'Perhatian', danger: 'Berbahaya', good: 'Baik', ok: 'Cukup', bad: 'Buruk', healthScore: 'Skor Kesehatan Keuangan', recommendation: 'Rekomendasi', tip80: 'Keuangan Anda sangat sehat! Pertahankan pola saving dan kurangi utang secara konsisten.', tip60: 'Kondisi keuangan baik. Tingkatkan saving rate di atas 20% untuk hasil optimal.', tip40: 'Perlu perhatian. Coba kurangi pengeluaran tidak perlu dan mulai menabung rutin.', tip0: 'Kondisi keuangan berisiko. Prioritaskan bayar hutang dan kontrol pengeluaran segera.' },
  en: { targetAchieved: 'Target achieved ✓', targetNot: 'Target >20%', safe: 'Safe', caution: 'Caution', danger: 'Dangerous', good: 'Good', ok: 'Fair', bad: 'Poor', healthScore: 'Financial Health Score', recommendation: 'Recommendation', tip80: 'Your finances are very healthy! Keep saving and reduce debt consistently.', tip60: 'Finances are good. Increase saving rate above 20% for optimal results.', tip40: 'Needs attention. Try reducing unnecessary expenses and start saving regularly.', tip0: 'Finances are at risk. Prioritize paying off debt and control spending immediately.' },
  ja: { targetAchieved: '目標達成 ✓', targetNot: '目標 >20%', safe: '安全', caution: '注意', danger: '危険', good: '良好', ok: '普通', bad: '要改善', healthScore: '財務健全性スコア', recommendation: '推薦', tip80: '財務状況は非常に健全です！貯蓄を続け、借金を着実に減らしましょう。', tip60: '財務状況は良好です。最適な結果のために貯蓄率を20%以上に上げましょう。', tip40: '注意が必要です。不必要な支出を減らし、定期的な貯蓄を始めましょう。', tip0: '財務状況はリスクがあります。借金返済を優先し、すぐに支出をコントロールしましょう。' },
  ko: { targetAchieved: '목표 달성 ✓', targetNot: '목표 >20%', safe: '안전', caution: '주의', danger: '위험', good: '좋음', ok: '보통', bad: '나쁨', healthScore: '재무 건강 점수', recommendation: '추천', tip80: '재무 상태가 매우 건강합니다! 저축을 유지하고 부채를 줄이세요.', tip60: '재무 상태가 좋습니다. 최적의 결과를 위해 저축률을 20% 이상으로 높이세요.', tip40: '주의가 필요합니다. 불필요한 지출을 줄이고 정기적으로 저축을 시작하세요.', tip0: '재무 상태가 위험합니다. 부채 상환을 우선시하고 즉시 지출을 통제하세요.' },
  km: { targetAchieved: 'គោលដៅសម្រេច ✓', targetNot: 'គោលដៅ >20%', safe: 'សុវត្ថិភាព', caution: 'ប្រុងប្រយ័ត្ន', danger: 'គ្រោះថ្នាក់', good: 'ល្អ', ok: 'មធ្យម', bad: 'មិនល្អ', healthScore: 'ពិន្ទុសុខភាពហិរញ្ញវត្ថុ', recommendation: 'ការណែនាំ', tip80: 'ហិរញ្ញវត្ថុរបស់អ្នកមានសុខភាពល្អ! រក្សាការសន្សំ និងកាត់បន្ថយបំណុល។', tip60: 'ហិរញ្ញវត្ថុល្អ។ បង្កើនអត្រាសន្សំ >20% ដើម្បីលទ្ធផលល្អបំផុត។', tip40: 'ត្រូវការការយកចិត្តទុកដាក់។ កាត់បន្ថយការចំណាយ និងចាប់ផ្តើមសន្សំ។', tip0: 'ហិរញ្ញវត្ថុគ្រោះថ្នាក់។ ផ្តល់អាទិភាពបង់បំណុល និងគ្រប់គ្រងការចំណាយភ្លាមៗ។' },
  zh: { targetAchieved: '目标达成 ✓', targetNot: '目标 >20%', safe: '安全', caution: '注意', danger: '危险', good: '良好', ok: '一般', bad: '较差', healthScore: '财务健康评分', recommendation: '建议', tip80: '您的财务非常健康！保持储蓄并持续减少债务。', tip60: '财务状况良好。将储蓄率提高到20%以上以获得最佳效果。', tip40: '需要注意。尽量减少不必要的支出并开始定期储蓄。', tip0: '财务状况存在风险。优先还清债务并立即控制支出。' },
};

export default function FinancialHealthScore({ cashFlow, savingRate, debtRatio, totalIncome, totalExpense }) {
  const { lang } = useLanguage();
  const L = LABELS[lang] || LABELS['id'];
  const { score, label, color } = calcFinancialScore(cashFlow, savingRate, debtRatio);
  const strokeDash = (score / 100) * CIRCUMFERENCE;

  const metrics = [
    {
      label: 'Cash Flow',
      value: cashFlow >= 0
        ? `+${((cashFlow / Math.max(totalIncome, 1)) * 100).toFixed(0)}%`
        : `-${((Math.abs(cashFlow) / Math.max(totalIncome, 1)) * 100).toFixed(0)}%`,
      detail: formatCompact(Math.abs(cashFlow)),
      status: cashFlow >= 0 ? 'good' : 'bad',
      bar: Math.min(100, Math.abs(cashFlow) / Math.max(totalIncome, 1) * 100),
    },
    {
      label: 'Saving Rate',
      value: `${savingRate.toFixed(1)}%`,
      detail: savingRate >= 20 ? L.targetAchieved : L.targetNot,
      status: savingRate >= 20 ? 'good' : savingRate >= 10 ? 'ok' : 'bad',
      bar: Math.min(100, savingRate),
    },
    {
      label: 'Debt Ratio',
      value: `${debtRatio.toFixed(1)}%`,
      detail: debtRatio < 20 ? L.safe : debtRatio < 40 ? L.caution : L.danger,
      status: debtRatio < 20 ? 'good' : debtRatio < 40 ? 'ok' : 'bad',
      bar: Math.min(100, debtRatio),
    },
  ];

  const statusStyles = {
    good: { color: '#10B981', bar: '#10B981', icon: TrendingUp, label: L.good },
    ok:   { color: '#F59E0B', bar: '#F59E0B', icon: Minus,      label: L.ok },
    bad:  { color: '#EF4444', bar: '#EF4444', icon: TrendingDown, label: L.bad },
  };

  // Score ring colors
  const bgRingColor = 'hsl(var(--muted))';

  return (
    <div className="space-y-5">
      {/* Score ring */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 80 80">
            {/* Track */}
            <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
            {/* Progress */}
            <circle
              cx="40" cy="40" r="36" fill="none"
              stroke={color} strokeWidth="7"
              strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="font-heading font-extrabold text-2xl leading-none" style={{ color }}>{score}</span>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">/100</span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-heading font-bold text-base leading-tight" style={{ color }}>{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{L.healthScore}</p>
        </div>
      </div>

      {/* Metrics bars */}
      <div className="space-y-3">
        {metrics.map((m, i) => {
          const s = statusStyles[m.status];
          const Icon = s.icon;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{m.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold" style={{ color: s.color }}>{m.value}</span>
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: s.color }}>
                    <Icon size={9} />
                    <span>{s.label}</span>
                  </div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${m.bar}%`, background: s.color }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{m.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="rounded-xl p-3 bg-muted/50 border border-border">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={13} style={{ color }} />
          <span className="text-xs font-semibold text-foreground">{L.recommendation}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {score >= 80 ? L.tip80 : score >= 60 ? L.tip60 : score >= 40 ? L.tip40 : L.tip0}
        </p>
      </div>
    </div>
  );
}