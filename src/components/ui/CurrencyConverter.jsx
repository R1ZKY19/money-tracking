import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExchangeRate } from '@/api/entities';
import { ArrowRightLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/finance';
import { CURRENCIES } from '@/lib/utils/finance';

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('IDR');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState(null);

  const { data: rates = [] } = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: () => ExchangeRate.list()
  });

  // Calculate conversion
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setResult(null);
      return;
    }

    const rate = rates.find(r => r.from_currency === fromCurrency && r.to_currency === toCurrency);
    if (rate) {
      const converted = parseFloat(amount) * rate.rate;
      setResult({ rate: rate.rate, converted });
    } else if (fromCurrency === toCurrency) {
      setResult({ rate: 1, converted: parseFloat(amount) });
    } else {
      setResult(null);
    }
  }, [amount, fromCurrency, toCurrency, rates]);

  const swap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground">💱 Konverter Mata Uang</h4>
      </div>

      <div className="space-y-3">
        {/* From */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Dari</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Jumlah"
              className="flex-1"
            />
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(CURRENCIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={swap}
            className="rounded-full"
          >
            <ArrowRightLeft size={14} />
          </Button>
        </div>

        {/* To */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Ke</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={result?.converted.toFixed(2) || '0'}
              readOnly
              placeholder="Hasil"
              className="flex-1 bg-muted/50"
            />
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(CURRENCIES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rate info */}
        {result && (
          <p className="text-xs text-muted-foreground text-center">
            1 {fromCurrency} = {result.rate.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
          </p>
        )}
        {!result && fromCurrency !== toCurrency && (
          <p className="text-xs text-amber-600 text-center">Kurs tidak tersedia. Tambahkan di Pengaturan.</p>
        )}
      </div>
    </div>
  );
}