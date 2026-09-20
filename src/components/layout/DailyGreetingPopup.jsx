import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/ui/BrandLogo';
import { Quote } from 'lucide-react';

const QUOTES = [
  'Setiap rupiah yang kamu catat hari ini adalah langkah menuju kebebasan finansial esok.',
  'Disiplin kecil hari ini, kebebasan besar di masa depan.',
  'Uang yang dikelola dengan baik akan bekerja untukmu, bukan sebaliknya.',
  'Menabung bukan soal sisa uang, tapi soal prioritas.',
  'Catat, evaluasi, dan tumbuh — begitu cara keuangan sehat dibangun.',
  'Kebiasaan finansial baik dimulai dari keputusan kecil hari ini.',
  'Jangan tunggu kaya untuk mulai mengatur uang, atur uang untuk jadi kaya.',
];

const greetingByHour = (h) => {
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
};

// Popup sapaan & motivasi finansial, tampil sekali per hari per pengguna.
export default function DailyGreetingPopup({ userId, userName }) {
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `daily_greeting_${userId}_${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setOpen(true);
  }, [userId]);

  const firstName = (userName || '').split(' ')[0];
  const greeting = greetingByHour(new Date().getHours());
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header brand */}
        <div className="px-6 pt-7 pb-6 text-center" style={{ background: 'linear-gradient(135deg, #0D1117 0%, #14304a 100%)' }}>
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/95 flex items-center justify-center shadow-lg mb-3">
            <BrandLogo className="w-11 h-11" />
          </div>
          <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Money Tracking</p>
          <h3 className="text-xl font-bold text-white mt-1">
            {greeting}{firstName ? `, ${firstName}` : ''} 👋
          </h3>
          <p className="text-[11px] text-white/45 mt-1">{todayLabel}</p>
        </div>

        {/* Motivasi */}
        <div className="px-6 py-5 bg-card">
          <div className="rounded-2xl border border-border bg-muted/40 p-4 flex gap-3">
            <Quote size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Motivasi Keuangan Hari Ini</p>
              <p className="text-sm text-foreground leading-relaxed">{quote}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            Yuk mulai dengan mencatat transaksi hari ini — keuangan rapi, keputusan makin tenang.
          </p>
          <Button className="mt-4 w-full h-10" onClick={() => setOpen(false)}>
            Mulai Kelola Keuangan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}