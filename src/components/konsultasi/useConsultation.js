import { useCallback, useEffect, useRef, useState } from 'react';
import { ConsultationMessage } from '@/api/entities';
import { toast } from 'sonner';

// Live chat realtime User ↔ Admin dengan status terkirim/diterima/dibaca,
// notifikasi pesan masuk, dan reconnect otomatis.
export default function useConsultation({ threadEmail, meRole, meEmail, meName }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(true);
  const seen = useRef(new Set());
  const first = useRef(true);

  const load = useCallback(async (silent) => {
    if (!threadEmail) return;
    if (!silent) setLoading(true);
    try {
      const rows = await ConsultationMessage.list();
      setConnected(true);
      setMessages(rows);

      const incoming = rows.filter(r => r.sender_role !== meRole);
      // Notifikasi pesan baru dari pihak lain
      if (!first.current) {
        const fresh = incoming.filter(r => !seen.current.has(r.id));
        if (fresh.length) toast.info(`Pesan baru dari ${fresh[fresh.length - 1].sender_name || (meRole === 'admin' ? 'pengguna' : 'Admin')}`);
      }
      incoming.forEach(r => seen.current.add(r.id));
      first.current = false;

      // Tandai diterima + dibaca
      const unread = incoming.filter(r => !r.read_at);
      if (unread.length) {
        const now = new Date().toISOString();
        await ConsultationMessage.bulkUpdate(
          unread.map(r => ({ id: r.id, delivered_at: r.delivered_at || now, read_at: now }))
        );
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [threadEmail, meRole]);

  useEffect(() => { first.current = true; seen.current = new Set(); load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!threadEmail) return;
    let unsub;
    try {
      unsub = ConsultationMessage.subscribe(event => {
        if (!event?.data || event.data.thread_email === threadEmail) load(true);
      });
    } catch { setConnected(false); }
    return () => { try { unsub?.(); } catch { /* noop */ } };
  }, [threadEmail, load]);

  // Reconnect otomatis: polling cadangan + saat jaringan kembali
  useEffect(() => {
    const timer = setInterval(() => load(true), 12000);
    const onOnline = () => load(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', () => setConnected(false));
    return () => { clearInterval(timer); window.removeEventListener('online', onOnline); };
  }, [load]);

  const send = async (text) => {
    const value = text.trim();
    if (!value || !threadEmail) return false;
    setSending(true);
    try {
      await ConsultationMessage.create({
        thread_email: threadEmail,
        sender_role: meRole,
        sender_email: meEmail,
        sender_name: meName,
        message: value,
      });
      await load(true);
      return true;
    } catch {
      setConnected(false);
      toast.error('Pesan gagal terkirim. Periksa koneksi lalu coba lagi.');
      return false;
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, connected, send, reload: () => load(true) };
}