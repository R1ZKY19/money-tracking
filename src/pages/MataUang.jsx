import { useState, useMemo } from 'react';
import { useCurrency } from '@/lib/CurrencyContext';
import { COUNTRY_CURRENCIES } from '@/lib/CurrencyContext';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  RefreshCw, CheckCircle2, Clock, TrendingUp, Globe,
  ArrowRightLeft, Loader2, Search, Star, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

function timeAgo(iso) {
  if (!iso) return 'Belum pernah';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: idLocale }); }
  catch { return '-'; }
}

function RateCard({ c, rates, isDefault, onSelect }) {
  const rate = rates[c.code];
  return (
    <button
      onClick={() => onSelect(c.code)}
      className={`p-3 rounded-xl border text-left transition-all w-full group ${
        isDefault
          ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
          : 'border-border bg-muted/20 hover:border-primary/30 hover:bg-primary/5'
      }`}
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">{c.flag}</span>
          {isDefault && <CheckCircle2 size={11} className="text-primary shrink-0" />}
        </div>
        <span className="text-xs font-bold text-primary">{c.symbol}</span>
      </div>
      <p className="font-bold text-sm text-foreground">{c.code}</p>
      <p className="text-xs text-muted-foreground leading-tight truncate">{c.name}</p>
      {rate && c.code !== 'IDR' && (
        <p className="text-xs font-medium text-emerald-600 mt-1.5">
          Rp {new Intl.NumberFormat('id-ID').format(rate)}
        </p>
      )}
      {c.code === 'IDR' && (
        <p className="text-xs font-medium text-emerald-600 mt-1.5">Mata uang dasar</p>
      )}
    </button>
  );
}

export default function MataUang() {
  const { defaultCurrency, setDefaultCurrency, rates, lastSync, syncStatus, refreshRates } = useCurrency();
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [convertAmount, setConvertAmount] = useState('1000000');
  const [convertFrom, setConvertFrom] = useState('IDR');
  const [convertTo, setConvertTo] = useState('USD');

  const handleSync = async () => {
    setSyncing(true);
    await refreshRates();
    setSyncing(false);
  };

  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) return COUNTRY_CURRENCIES;
    const q = search.toLowerCase();
    return COUNTRY_CURRENCIES.filter(c =>
      c.country.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q)
    );
  }, [search]);

  const convertResult = useMemo(() => {
    const amt = parseFloat(convertAmount) || 0;
    if (convertFrom === convertTo) return amt;
    const inIDR = convertFrom === 'IDR' ? amt : (rates[convertFrom] || 1) * amt;
    if (convertTo === 'IDR') return inIDR;
    return inIDR / (rates[convertTo] || 1);
  }, [convertAmount, convertFrom, convertTo, rates]);

  const getCurrencyInfo = (code) => COUNTRY_CURRENCIES.find(c => c.code === code);
  const defaultInfo = getCurrencyInfo(defaultCurrency);
  const rateCount = Object.keys(rates).filter(k => k !== 'IDR').length;

  const statusCfg = {
    success: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Terkini', icon: CheckCircle2 },
    failed: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', label: 'Gagal', icon: Clock },
    pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Menunggu', icon: Clock },
  }[syncStatus] || { bg: 'bg-muted border-border', text: 'text-muted-foreground', label: '-', icon: Clock };

  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Mata Uang & Kurs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Pilih mata uang utama — nilai tukar diperbarui otomatis setiap hari
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} className="bg-[#0D4F6D] hover:bg-[#0a3d55] shrink-0">
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Perbarui Kurs
        </Button>
      </div>

      {/* Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Star size={16} className="text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Mata Uang Utama</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span>{defaultInfo?.flag || '🌐'}</span>
              <p className="font-bold text-base text-foreground">{defaultCurrency}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Globe size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Mata Uang Aktif</p>
            <p className="font-bold text-base text-foreground mt-0.5">{rateCount + 1} Mata Uang</p>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${statusCfg.bg}`}>
          <div className={`w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0`}>
            <StatusIcon size={16} className={statusCfg.text} />
          </div>
          <div>
            <p className={`text-xs font-medium ${statusCfg.text}`}>Status Sinkronisasi</p>
            <p className={`font-bold text-base mt-0.5 ${statusCfg.text}`}>{statusCfg.label}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Clock size={16} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Update Terakhir</p>
            <p className="font-semibold text-sm text-foreground mt-0.5 truncate">{timeAgo(lastSync)}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kiri: Pilih Mata Uang + Kurs */}
        <div className="lg:col-span-2 space-y-5">

          {/* Pilih Mata Uang Utama */}
          <SectionCard
            title="Pilih Mata Uang Utama"
            subtitle="Klik untuk menjadikan mata uang ini sebagai mata uang utama di seluruh aplikasi"
          >
            {/* Search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari negara atau kode mata uang..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 text-sm h-9"
              />
            </div>

            {/* Mata Uang Aktif Terpilih */}
            {defaultCurrency && (
              <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-primary/5 border border-primary/20">
                <span className="text-2xl">{defaultInfo?.flag}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-primary">{defaultCurrency} — {defaultInfo?.name}</p>
                  <p className="text-xs text-muted-foreground">{defaultInfo?.country}</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Aktif</Badge>
              </div>
            )}

            {/* Grid mata uang */}
            {filteredCurrencies.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Mata uang tidak ditemukan</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredCurrencies.map(c => (
                  <RateCard
                    key={c.code}
                    c={c}
                    rates={rates}
                    isDefault={defaultCurrency === c.code}
                    onSelect={setDefaultCurrency}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Nilai Tukar ke IDR */}
          <SectionCard
            title="Nilai Tukar ke IDR"
            subtitle="Diperbarui otomatis setiap hari pukul 07.00 WIB"
            action={
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                <StatusIcon size={11} />
                {statusCfg.label}
              </div>
            }
          >
            {rateCount === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <TrendingUp size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-3">Belum ada data kurs. Klik Perbarui Kurs untuk memuat.</p>
                <Button onClick={handleSync} disabled={syncing} size="sm" className="bg-[#0D4F6D] hover:bg-[#0a3d55]">
                  {syncing ? <Loader2 size={13} className="animate-spin mr-1" /> : <RefreshCw size={13} className="mr-1" />}
                  Ambil Kurs Sekarang
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {COUNTRY_CURRENCIES.filter(c => c.code !== 'IDR' && rates[c.code]).map(c => (
                  <div key={c.code} className="p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">{c.flag}</span>
                      <span className="font-bold text-sm">{c.code}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">1 {c.code} =</p>
                    <p className="font-bold text-primary text-sm mt-0.5">
                      Rp {new Intl.NumberFormat('id-ID').format(rates[c.code])}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.name}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Kanan: Konverter */}
        <div className="space-y-5">
          <SectionCard title="Konverter Mata Uang" subtitle="Hitung konversi dengan kurs terkini">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Jumlah</label>
                <Input
                  type="number"
                  value={convertAmount}
                  onChange={e => setConvertAmount(e.target.value)}
                  placeholder="0"
                  className="text-right font-semibold"
                />
              </div>

              {/* From */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Dari</label>
                <Select value={convertFrom} onValueChange={setConvertFrom}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-1.5">{c.flag} {c.code} — {c.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Swap */}
              <button
                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                onClick={() => { setConvertFrom(convertTo); setConvertTo(convertFrom); }}
              >
                <ArrowRightLeft size={13} /> Tukar posisi
              </button>

              {/* To */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ke</label>
                <Select value={convertTo} onValueChange={setConvertTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-1.5">{c.flag} {c.code} — {c.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hasil */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {new Intl.NumberFormat('id-ID').format(parseFloat(convertAmount) || 0)} {convertFrom} =
                </p>
                <p className="font-bold text-2xl text-primary">
                  {getCurrencyInfo(convertTo)?.symbol || convertTo} {new Intl.NumberFormat('id-ID').format(Math.round(convertResult))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{getCurrencyInfo(convertTo)?.name || convertTo}</p>
              </div>

              {convertFrom !== 'IDR' && convertTo !== 'IDR' && rates[convertFrom] && (
                <div className="text-xs text-muted-foreground text-center space-y-0.5">
                  <p>1 {convertFrom} ≈ Rp {new Intl.NumberFormat('id-ID').format(rates[convertFrom])}</p>
                  {rates[convertTo] && (
                    <p>1 {convertTo} ≈ Rp {new Intl.NumberFormat('id-ID').format(rates[convertTo])}</p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Info kurs otomatis */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-blue-600" />
              <p className="text-sm font-semibold text-blue-800">Kurs Otomatis</p>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Nilai tukar diperbarui otomatis setiap hari pukul 07.00 WIB dari sumber data global. Kamu juga bisa memperbarui manual kapan saja dengan tombol <strong>Perbarui Kurs</strong>.
            </p>
            {lastSync && (
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border w-fit ${statusCfg.bg} ${statusCfg.text}`}>
                <StatusIcon size={11} />
                Update {timeAgo(lastSync)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}