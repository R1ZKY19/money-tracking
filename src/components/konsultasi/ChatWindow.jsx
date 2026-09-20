import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bot, Loader2, MessageCircle, Phone, Search, Wifi, WifiOff, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MessageStream from '@/components/konsultasi/MessageStream';
import ChatComposer from '@/components/konsultasi/ChatComposer';
import TypingIndicator from '@/components/konsultasi/TypingIndicator';
import ThreadModeControl from '@/components/konsultasi/ThreadModeControl';

const WA_NUMBER = '6283812595110';

export default function ChatWindow({
  title, subtitle, chat, meRole, waMessage,
  otherOnline, otherTyping, otherLabel,
  mode, onModeChange, showModeControl, aiActive, onTyping, onBack, backLabel,
}) {
  const endRef = useRef(null);
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat.messages.length, otherTyping]);

  const found = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return 0;
    return chat.messages.filter(m => String(m.message || '').toLowerCase().includes(key)).length;
  }, [chat.messages, q]);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden h-[calc(100dvh-13.5rem)] md:h-[calc(100vh-13rem)] min-h-[380px] shadow-sm">
      {/* Header */}
      <div className="px-3 md:px-4 py-2.5 md:py-3 border-b border-border bg-muted/30 space-y-2 md:space-y-2.5">
        <div className="flex items-center justify-between gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
            {onBack && (
              <button type="button" onClick={onBack} aria-label={backLabel || 'Kembali'}
                className="h-8 w-8 shrink-0 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} />
              </button>
            )}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                <MessageCircle size={16} className="text-primary" />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${otherOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{title}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {otherTyping ? `${otherLabel || 'Lawan bicara'} sedang menulis…` : otherOnline ? 'Online sekarang' : subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button type="button" onClick={() => { setSearching(s => !s); setQ(''); }}
              className="h-8 w-8 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              {searching ? <X size={13} /> : <Search size={13} />}
            </button>
            <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${chat.connected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {chat.connected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {chat.connected ? 'Realtime' : 'Menyambung ulang…'}
            </span>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage || 'Halo Admin MONEY TRACKING, saya ingin konsultasi.')}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 w-8 md:w-auto md:px-3 justify-center rounded-xl text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(90deg,#25D366,#128C7E)' }}
            >
              <Phone size={12} /> <span className="hidden md:inline">WhatsApp</span>
            </a>
          </div>
        </div>

        {searching && (
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} autoFocus
              placeholder="Cari dalam riwayat chat…" className="h-9 pl-8 rounded-xl text-xs" />
            {q && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{found} hasil</span>}
          </div>
        )}

        {showModeControl && chat.threadReady && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mode balasan</span>
            <ThreadModeControl mode={mode} onChange={onModeChange} />
          </div>
        )}

        {!showModeControl && chat.threadReady && aiActive && (
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-1">
            <Bot size={10} /> AI MONEY.T aktif — balasan cepat otomatis, Admin dapat mengambil alih kapan saja
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 md:p-4 space-y-2.5">
        {chat.loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : chat.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <MessageCircle size={30} className="mb-2 opacity-20" />
            <p className="text-sm font-medium">Belum ada pesan</p>
            <p className="text-xs mt-0.5">Mulai percakapan — balasan muncul otomatis tanpa refresh.</p>
          </div>
        ) : (
          <MessageStream messages={chat.messages} meRole={meRole} highlight={q.trim()} />
        )}
        {otherTyping && <TypingIndicator label={otherLabel || 'Lawan bicara'} />}
        <div ref={endRef} />
      </div>

      <ChatComposer
        onSend={chat.send}
        sending={chat.sending}
        disabled={!chat.threadReady}
        onTyping={onTyping}
        hint={showModeControl
          ? (mode === 'manual'
            ? 'Mode ADMIN MANUAL — AI berhenti membalas percakapan ini.'
            : 'Mode AI AUTO — AI membalas otomatis; kirim pesan atau klik AMBIL ALIH untuk menghentikannya.')
          : null}
      />
    </div>
  );
}