import { useEffect, useRef, useState } from 'react';
import { useUserRole } from '@/lib/UserRoleContext';

export default function useMoneyChat(open, uid) {
  const { user, role, accessModules } = useUserRole();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const initialize = async () => {
    // Fitur chat AI standalone/Supabase
    setConversation({ id: 'local_chat' });
    setMessages([
      { id: 'welcome', role: 'assistant', content: 'Halo! Ada yang bisa saya bantu terkait pencatatan keuangan Anda?' }
    ]);
  };

  useEffect(() => {
    if (open) initialize();
  }, [open, uid]);

  const send = async (content) => {
    if (!content.trim() || lock.current) return false;
    lock.current = true;
    setSending(true);
    setError('');
    try {
      const userMsg = { id: String(Date.now()), role: 'user', content };
      const replyMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: 'Asisten AI saat ini sedang dalam pemeliharaan setelah migrasi database. Fitur keuangan utama Anda tetap berjalan normal.'
      };
      setMessages(prev => [...prev, userMsg, replyMsg]);
      return true;
    } catch {
      if (active.current) setError('Pesan belum berhasil diproses.');
      return false;
    } finally {
      lock.current = false;
      if (active.current) setSending(false);
    }
  };

  return { messages, loading, sending, error, ready: !!conversation, initialize, send };
}