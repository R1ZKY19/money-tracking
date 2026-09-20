import { Fragment } from 'react';
import { Check, Minus, Layers } from 'lucide-react';
import PricingComparisonMobile from '@/components/guide/PricingComparisonMobile';

const ROWS = [
  { group: 'Pencatatan Dasar', items: [
    ['Dashboard bulanan real-time', 0, 1, 1, 1],
    ['Input & riwayat transaksi', 0, 1, 1, 1],
    ['Saldo rekening multi-akun', 0, 1, 1, 1],
    ['Budget per kategori + alarm 80%', 0, 1, 1, 1],
    ['Kalender keuangan harian', 0, 1, 1, 1],
  ]},
  { group: 'Kendali Arus Kas', items: [
    ['Hutang + bunga & jatuh tempo', 0, 0, 1, 1],
    ['Piutang + kirim tagihan WA/LINE/IG', 0, 0, 1, 1],
    ['Target tabungan & progres', 0, 0, 1, 1],
    ['Transfer antar rekening', 0, 0, 1, 1],
    ['Transaksi rutin otomatis', 0, 0, 1, 1],
    ['Cross-check saldo bank', 0, 0, 1, 1],
    ['Export Excel & backup Drive', 0, 0, 1, 1],
  ]},
  { group: 'Analitik & Otomasi', items: [
    ['Dashboard tahunan', 0, 0, 0, 1],
    ['Perbandingan antar tahun (YoY)', 0, 0, 0, 1],
    ['Net worth tracker', 0, 0, 0, 1],
    ['Multi-mata uang & kurs', 0, 0, 0, 1],
    ['Notifikasi Telegram otomatis', 0, 0, 0, 1],
    ['Ringkasan email bulanan', 0, 0, 0, 1],
    ['Asisten AI analisis mendalam', 0, 0, 0, 1],
  ]},
  { group: 'Informasi & Bantuan', items: [
    ['Panduan fitur lengkap', 1, 1, 1, 1],
    ['Konsultasi admin', 1, 1, 1, 1],
    ['Prioritas dukungan', 0, 0, 0, 1],
  ]},
];

const HEADS = ['Member Baru', 'Staf', 'Master II', 'Master I'];

const Cell = ({ on }) => (
  <td className="px-3 py-2.5 text-center">
    {on
      ? <Check size={15} className="inline text-emerald-600 dark:text-emerald-400" />
      : <Minus size={15} className="inline text-muted-foreground/35" />}
  </td>
);

// Tabel perbandingan rinci semua paket termasuk status tanpa role.
export default function PricingComparison() {
  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Layers size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Perbandingan Rinci Semua Paket</p>
          <p className="text-[11px] text-muted-foreground">Lihat tepat fitur mana yang aktif di setiap level akses.</p>
        </div>
      </div>

      <PricingComparisonMobile rows={ROWS} heads={HEADS} />

      <div className="hidden md:block table-responsive">
        <table className="w-full text-[11.5px]">
          <thead className="sticky top-0">
            <tr className="bg-muted">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fitur</th>
              {HEADS.map(h => (
                <th key={h} className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ group, items }) => (
              <Fragment key={group}>
                <tr className="bg-muted/50">
                  <td colSpan={5} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground/70">{group}</td>
                </tr>
                {items.map(([name, ...flags]) => (
                  <tr key={name} className="border-t border-border hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-2.5 text-foreground">{name}</td>
                    {flags.map((f, i) => <Cell key={i} on={f} />)}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}