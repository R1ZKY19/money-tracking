import { useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AssistantMessage from '@/components/assistant/AssistantMessage';
import ChatDateDivider, { dayKey } from '@/components/assistant/ChatDateDivider';

const QUICK = [
  'Catat pengeluaran 50.000 untuk makan hari ini',
  'Cek kondisi keuangan saya bulan ini',
  'Hapus transaksi terakhir yang salah',
  'Apakah target tabungan saya tertinggal?',
];

export default function AssistantChatPanel({ chat, draft, setDraft, wide }) {
  const bottom = useRef(null);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [chat.messages]);

  const submit = async (e) => { e.preventDefault(); if (await chat.send(draft)) setDraft(''); };

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 overscroll-contain"
        aria-live="polite" aria-busy={chat.loading || chat.sending}>
        <div className={`mx-auto w-full ${wide ? 'max-w-3xl' : ''} space-y-4`}>
          <div className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
            <p className="flex items-center gap-2 font-semibold"><Sparkles size={14} className="text-primary" /> Halo! Mau mulai dari mana?</p>
            <p className="text-muted-foreground mt-2">
              Saya bisa menjelaskan fitur, menganalisis keuangan Anda, serta <span className="font-semibold text-foreground">mencatat, mengubah, atau menghapus transaksi</span> bila Anda minta — selalu dalam batas hak akses Anda.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Saya AI, bukan petugas live chat. Perubahan data hanya dilakukan setelah Anda konfirmasi.</p>
          </div>

          <div className={`grid gap-2 ${wide ? 'sm:grid-cols-2' : ''}`}>
            {QUICK.map(q => (
              <button key={q} onClick={() => setDraft(q)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-primary text-left hover:bg-accent">
                {q}
              </button>
            ))}
          </div>

          {chat.loading && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 size={14} className="animate-spin" />Memuat percakapan…</p>}
          {chat.messages.map((m, i) => {
            const stamp = m.created_date || m.created_at || m.timestamp;
            const prev = chat.messages[i - 1];
            const newDay = i === 0 || dayKey(stamp) !== dayKey(prev?.created_date || prev?.created_at || prev?.timestamp);
            return (
              <div key={m.id || i} className="space-y-4">
                {newDay && <ChatDateDivider date={stamp} />}
                <AssistantMessage message={m} />
              </div>
            );
          })}
          {chat.sending && <p className="flex gap-2 items-center text-xs text-muted-foreground"><Loader2 size={14} className="animate-spin" />Asisten sedang memproses…</p>}
          {chat.error && (
            <div role="alert" className="text-sm text-destructive">
              {chat.error}
              {!chat.ready && <button onClick={chat.initialize} disabled={chat.loading} className="block underline mt-2">Coba muat lagi</button>}
            </div>
          )}
          <div ref={bottom} />
        </div>
      </div>

      <form onSubmit={submit} className="border-t border-border bg-card p-3">
        <div className={`mx-auto w-full ${wide ? 'max-w-3xl' : ''}`}>
          <div className="flex gap-2 items-end">
            <textarea
              aria-label="Pesan untuk asisten"
              placeholder="Tulis pertanyaan atau perintah, mis. “catat pengeluaran 25.000 parkir”…"
              maxLength={3000} rows={wide ? 3 : 2} value={draft} disabled={chat.sending}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (draft.trim() && chat.ready && !chat.sending) submit(e);
                }
              }}
              className="resize-none rounded-lg border border-input bg-background p-3 text-sm min-w-0 flex-1 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button type="submit" size="icon" aria-label="Kirim pesan" className="h-11 w-11" disabled={!draft.trim() || !chat.ready || chat.sending}>
              {chat.sending ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Menggunakan kredit AI · Jangan kirim kata sandi atau OTP · Perubahan data mengikuti hak akses Anda.</p>
        </div>
      </form>
    </>
  );
}