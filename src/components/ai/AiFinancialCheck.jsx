import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { DEMO_MODE } from '@/components/demo/demoSession';
import { reportToAiPayload, localFinancialCheck } from '@/lib/utils/financialReport';
import { useLanguage } from '@/lib/LanguageContext';
import AiCheckResult from '@/components/ai/AiCheckResult';

const SCHEMA = { type: 'object', properties: {
  score: { type: 'integer' }, label: { type: 'string' }, summary: { type: 'string' },
  findings: { type: 'array', items: { type: 'object', properties: { type: { type: 'string', enum: ['good', 'info', 'warning', 'danger'] }, text: { type: 'string' } } } },
  recommendations: { type: 'array', items: { type: 'string' } },
} };

export default function AiFinancialCheck({ report }) {
  const { lang } = useLanguage();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasData = report.period.length > 0;

  const run = async () => {
    setLoading(true); setError('');
    try {
      if (DEMO_MODE) { await new Promise(r => setTimeout(r, 600)); setResult(localFinancialCheck(report)); return; }
      const res = { result: 'Fitur AI memerlukan konfigurasi Supabase Edge Function.' };
      setResult({ ...res, score: Math.max(0, Math.min(100, Number(res.score) || report.score.score)), findings: res.findings || [], recommendations: res.recommendations || [] });
    } catch (e) {
      setError(e?.message || 'Analisis gagal. Coba lagi.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground max-w-md">
          {DEMO_MODE ? 'Mode demo: analisis dijalankan lokal tanpa AI online.' : 'Hanya angka agregat yang dianalisis — catatan, nama, dan nomor rekening tidak dikirim.'}
        </p>
        <Button onClick={run} disabled={loading || !hasData} size="sm" className="gap-2 rounded-xl">
          {loading ? <Loader2 size={14} className="animate-spin" /> : result ? <RefreshCw size={14} /> : <Sparkles size={14} />}
          {loading ? 'Menganalisis...' : result ? 'Analisis Ulang' : 'Jalankan AI Check'}
        </Button>
      </div>
      {!hasData && <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi pada periode ini.</p>}
      {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
      {result && <AiCheckResult result={result} />}
    </div>
  );
}