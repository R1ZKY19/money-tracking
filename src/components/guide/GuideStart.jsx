import { BookOpen, MessageCircle } from 'lucide-react';
import { openMoneyAssistant } from '@/components/guide/guideHelp';
export default function GuideStart() {
  return <section className="grid gap-4 md:grid-cols-3 mb-6">
    <div className="rounded-xl border border-border bg-card p-5 md:col-span-2"><div className="flex items-center gap-2 text-primary mb-3"><BookOpen size={17} /><h2 className="text-sm font-semibold">Mulai dari sini</h2></div><p className="text-sm leading-relaxed text-muted-foreground">1. Siapkan rekening & kategori → 2. Catat transaksi → 3. Periksa saldo → 4. Evaluasi budget & target.</p><p className="mt-3 text-xs text-muted-foreground">Buka panduan untuk melihat langkah, contoh, hasil yang diharapkan, dan cara mencari letak kesalahan.</p></div>
    <button onClick={() => openMoneyAssistant('Saya baru menggunakan MONEY TRACKING. Mulai dari mana?')} className="rounded-xl border border-border bg-accent p-5 text-left hover:bg-muted"><MessageCircle size={20} className="text-primary mb-3" /><span className="block text-sm font-semibold">Bingung? Tanya asisten AI</span><span className="block text-xs text-muted-foreground mt-2 leading-relaxed">Jelaskan bagian yang belum dipahami. Kita bahas satu per satu.</span></button>
  </section>;
}