import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, SendHorizonal } from 'lucide-react';

export default function ChatComposer({ onSend, sending, disabled, onTyping, hint }) {
  const [text, setText] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const ok = await onSend(text);
    if (ok) setText('');
  };

  return (
    <form onSubmit={submit} className="border-t border-border bg-card p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={e => { setText(e.target.value); onTyping?.(); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
          placeholder={disabled ? 'Pilih percakapan terlebih dahulu…' : 'Tulis pesan… (Enter kirim, Shift+Enter baris baru)'}
          disabled={disabled}
          rows={1}
          className="min-h-[44px] max-h-32 resize-none rounded-xl text-sm"
        />
        <Button type="submit" disabled={disabled || sending || !text.trim()} className="h-11 w-11 p-0 rounded-xl shrink-0">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
        </Button>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground mt-1.5 px-1">{hint}</p>}
    </form>
  );
}