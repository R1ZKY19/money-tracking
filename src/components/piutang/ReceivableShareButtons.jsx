import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check, Share2 } from 'lucide-react';
import { WhatsAppIcon, LineIcon, InstagramIcon } from '@/components/shared/SocialIcons';
import { buildReceivableShareText } from './receivableShareText';

export default function ReceivableShareButtons({ receivable, payments }) {
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const text = buildReceivableShareText({ receivable, payments });
  const encoded = encodeURIComponent(text);

  const openTab = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard tidak tersedia */ }
  };

  const sendWhatsApp = () => {
    const num = phone.replace(/\D/g, '');
    openTab(num ? `https://wa.me/${num}?text=${encoded}` : `https://wa.me/?text=${encoded}`);
  };

  const sendLine = () => openTab(`https://line.me/R/msg/text/?${encoded}`);

  const sendInstagram = async () => {
    await copyText();
    openTab('https://www.instagram.com/direct/inbox/');
  };

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
        <Share2 size={12} /> Kirim Rincian Utang ke Peminjam
      </p>

      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Nomor WhatsApp peminjam (opsional) — contoh: 6281234567890"
        className="mb-3"
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button onClick={sendWhatsApp} className="bg-emerald-600 text-white hover:bg-emerald-700">
          <WhatsAppIcon size={16} /> WhatsApp
        </Button>
        <Button onClick={sendLine} className="bg-green-600 text-white hover:bg-green-700">
          <LineIcon size={16} /> LINE
        </Button>
        <Button onClick={sendInstagram} className="bg-pink-600 text-white hover:bg-pink-700">
          <InstagramIcon size={16} /> Instagram
        </Button>
        <Button variant="outline" onClick={copyText}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Tersalin' : 'Salin Teks'}
        </Button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        Instagram tidak mendukung kiriman teks otomatis — rincian otomatis disalin, lalu tempel (paste) di DM Instagram yang terbuka.
      </p>
    </div>
  );
}