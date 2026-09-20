import { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import RobotAvatar from '@/components/assistant/RobotAvatar';
import AssistantChatPanel from '@/components/assistant/AssistantChatPanel';
import useMoneyChat from '@/components/assistant/useMoneyChat';

const SIZES = {
  compact: 'right-3 bottom-24 lg:right-6 lg:bottom-6 w-[calc(100%-1.5rem)] sm:w-[400px] h-[min(650px,calc(100dvh-8rem))] rounded-2xl',
  large: 'right-3 bottom-24 lg:right-6 lg:bottom-6 w-[calc(100%-1.5rem)] sm:w-[640px] h-[min(880px,calc(100dvh-6rem))] rounded-2xl',
  full: 'inset-2 sm:inset-6 w-auto h-auto rounded-2xl',
};

export default function MoneyAssistant({ uid }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState('compact');
  const [draft, setDraft] = useState('');
  const chat = useMoneyChat(open, uid);

  useEffect(() => {
    const show = e => { setOpen(true); if (e.detail?.question) setDraft(e.detail.question); };
    window.addEventListener('money-assistant-open', show);
    return () => window.removeEventListener('money-assistant-open', show);
  }, []);

  const cycle = () => setSize(s => (s === 'compact' ? 'large' : s === 'large' ? 'full' : 'compact'));

  return <>
    {!open && (
      <button onClick={() => setOpen(true)} aria-label="Buka asisten AI" title="Tanya AI"
        className="group fixed z-40 right-4 bottom-24 lg:bottom-6 flex items-center gap-2 rounded-full bg-gradient-to-br from-[#0F5F86] to-[#1683B8] text-white pl-2 pr-3 py-2 shadow-xl ring-1 ring-white/20 hover:scale-105 active:scale-95 transition-transform">
        <span className="rounded-full bg-white/10 p-1"><RobotAvatar size={34} waving /></span>
        <span className="text-sm font-semibold">Tanya AI</span>
      </button>
    )}

    {open && (
      <section role="dialog" aria-label="Chat asisten MONEY TRACKING"
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
        className={`fixed z-40 flex flex-col border border-border bg-background shadow-xl overflow-hidden transition-all duration-300 ${SIZES[size]}`}>
        <header className="bg-sidebar text-sidebar-foreground flex items-center gap-3 px-4 py-3.5">
          <RobotAvatar size={34} waving />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-sidebar-primary truncate">Asisten MONEY TRACKING</h2>
            <p className="text-xs mt-0.5 truncate">Panduan, analisis, catat &amp; hapus transaksi</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a href="/asisten" target="_blank" rel="noopener noreferrer" title="Buka di tab baru"
              aria-label="Buka asisten di tab baru" className="p-2 rounded-lg hover:bg-sidebar-accent">
              <ExternalLink size={16} />
            </a>
            <button onClick={cycle} title={size === 'full' ? 'Perkecil' : 'Perbesar'}
              aria-label={size === 'full' ? 'Perkecil chat' : 'Perbesar chat'} className="p-2 rounded-lg hover:bg-sidebar-accent">
              {size === 'full' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button aria-label="Tutup chat" onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-sidebar-accent">
              <X size={18} />
            </button>
          </div>
        </header>
        <AssistantChatPanel chat={chat} draft={draft} setDraft={setDraft} wide={size !== 'compact'} />
      </section>
    )}
  </>;
}