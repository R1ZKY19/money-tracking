import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import RobotAvatar from '@/components/assistant/RobotAvatar';
import AssistantChatPanel from '@/components/assistant/AssistantChatPanel';
import useMoneyChat from '@/components/assistant/useMoneyChat';

export default function AsistenAI() {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const chat = useMoneyChat(true, user?.id);

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] min-h-[420px] rounded-2xl border border-border bg-background overflow-hidden shadow-sm">
      <header className="bg-sidebar text-sidebar-foreground flex items-center gap-3 px-5 py-4">
        <RobotAvatar size={38} waving />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-sidebar-primary">Asisten MONEY TRACKING</h1>
          <p className="text-xs mt-0.5">
            {(user?.email || '').toLowerCase().trim() === 'rizkykucuk19@gmail.com'
              ? 'Mode Super Master · analisis mendalam + kelola role & member langsung dari chat'
              : 'Mode layar penuh · panduan, analisis, catat & hapus transaksi sesuai paket Anda'}
          </p>
        </div>
      </header>
      <AssistantChatPanel chat={chat} draft={draft} setDraft={setDraft} wide />
    </div>
  );
}