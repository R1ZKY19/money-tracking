import { useState } from 'react';

import { Bot, MessageCircle, Send, Loader2, ArrowLeft } from 'lucide-react';

const WA_URL = 'https://wa.me/6283812595110?text=Halo%20Admin%20MoneyTracking!%20Akun%20saya%20terkunci%20karena%20salah%20kata%20sandi.';

// Panel bantuan saat akun terkunci: pilih Tanya AI (chat langsung) atau WhatsApp Admin.
export default function LockedAccountHelp({ email, lockedUntil }) {
  const [mode, setMode] = useState('choice');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const openAi = () => {
    setMode('ai');
    if (messages.length === 0) {
      setMessages([{
        role: 'ai',
        text: 'Hai! Tenang ya, akun Anda hanya terkunci sementara karena salah kata sandi 3x — bukan diblokir. Ada yang bisa saya bantu jelaskan?',
      }]);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const history = messages;
    setMessages([...history, { role: 'user', text }]);
    setDraft('');
    setSending(true);
    try {
      const res = { data: { sent: true } };
      setMessages(prev => [...prev, { role: 'ai', text: res.data?.reply || 'Maaf, saya belum bisa menjawab sekarang. Coba lagi sebentar ya.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Maaf, koneksi bantuan sedang terganggu. Silakan hubungi Admin via WhatsApp ya.' }]);
    } finally {
      setSending(false);
    }
  };

  if (mode === 'choice') {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-[11px] leading-relaxed text-amber-800">
          Butuh bantuan? Pilih salah satu — tanya AI langsung di sini, atau chat Admin lewat WhatsApp.
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button type="button" onClick={openAi}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-sky-600 text-[11px] font-bold text-white transition-colors hover:bg-sky-700">
            <Bot size={14} /> Tanya AI
          </button>
          <a href={WA_URL} target="_blank" rel="noopener noreferrer"
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700">
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-sky-200 bg-white p-3">
      <div className="flex items-center gap-2 pb-2">
        <button type="button" onClick={() => setMode('choice')} className="text-slate-500 hover:text-slate-800">
          <ArrowLeft size={15} />
        </button>
        <Bot size={15} className="text-sky-600" />
        <p className="text-[11px] font-bold text-slate-800">AI MONEY.T — Bantuan Login</p>
      </div>
      <div className="max-h-52 space-y-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <p className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed ${
              m.role === 'user' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>{m.text}</p>
          </div>
        ))}
        {sending && (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Loader2 size={12} className="animate-spin" /> AI sedang mengetik…
          </p>
        )}
      </div>
      <form onSubmit={send} className="mt-2 flex gap-1.5">
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Tulis pertanyaan Anda…"
          className="h-9 flex-1 rounded-lg border border-slate-200 px-2.5 text-[11px] text-slate-800 outline-none focus:border-sky-500" />
        <button type="submit" disabled={sending || !draft.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white disabled:opacity-50">
          <Send size={13} />
        </button>
      </form>
      <a href={WA_URL} target="_blank" rel="noopener noreferrer"
        className="mt-2 block text-center text-[10px] font-bold text-emerald-700 hover:underline">
        Masih butuh Admin? Chat WhatsApp
      </a>
    </div>
  );
}