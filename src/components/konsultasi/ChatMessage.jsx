import { Bot, Check, CheckCheck, UserCheck } from 'lucide-react';

const time = (v) => v ? new Date(v).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

export default function ChatMessage({ msg, mine }) {
  const status = msg.read_at ? 'Dibaca' : msg.delivered_at ? 'Diterima' : 'Terkirim';
  const isAi = !!msg.is_ai;

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[68%] px-3.5 py-2.5 shadow-sm ${mine
        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
        : isAi
          ? 'bg-accent text-accent-foreground rounded-2xl rounded-bl-md border border-primary/25'
          : 'bg-muted text-foreground rounded-2xl rounded-bl-md border border-border'}`}>
        <div className={`flex items-center gap-1.5 mb-1 ${mine ? 'justify-end' : ''}`}>
          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${isAi
            ? 'bg-primary/15 text-primary'
            : msg.sender_role === 'admin'
              ? 'bg-foreground/10 opacity-80'
              : 'bg-foreground/10 opacity-70'}`}>
            {isAi ? <Bot size={9} /> : msg.sender_role === 'admin' ? <UserCheck size={9} /> : null}
            {isAi ? 'AI MONEY.T' : msg.sender_role === 'admin' ? 'ADMIN' : (msg.sender_name || 'PENGGUNA')}
          </span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
        <div className={`flex items-center gap-1.5 mt-1 ${mine ? 'justify-end' : ''}`}>
          <span className="text-[10px] opacity-60">{time(msg.created_date)}</span>
          {mine && (
            <span className="flex items-center gap-0.5 text-[10px] opacity-80">
              {msg.read_at ? <CheckCheck size={11} /> : msg.delivered_at ? <CheckCheck size={11} className="opacity-60" /> : <Check size={11} />}
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}