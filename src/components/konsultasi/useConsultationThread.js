import { useCallback, useEffect, useRef, useState } from 'react';
import { ConsultationThread } from '@/api/entities';

const FRESH_MS = 6000;
const isFresh = (v) => !!v && (Date.now() - new Date(v).getTime()) < FRESH_MS;
const isOnline = (v) => !!v && (Date.now() - new Date(v).getTime()) < 45000;

// State thread konsultasi: mode AI/Manual, presence online, dan typing indicator.
export default function useConsultationThread({ threadEmail, meRole }) {
  const [thread, setThread] = useState(null);
  const [tick, setTick] = useState(0);
  const idRef = useRef(null);
  const lastTypingRef = useRef(0);

  const ensure = useCallback(async () => {
    if (!threadEmail) return null;
    const rows = await ConsultationThread.list();
    let row = rows[0];
    if (!row) row = await ConsultationThread.create({ thread_email: threadEmail, mode: 'ai_auto' });
    idRef.current = row.id;
    setThread(row);
    return row;
  }, [threadEmail]);

  const load = useCallback(async () => {
    if (!threadEmail) { setThread(null); return; }
    try {
      const rows = await ConsultationThread.list();
      if (rows[0]) { idRef.current = rows[0].id; setThread(rows[0]); }
      else await ensure();
    } catch { /* biarkan state sebelumnya */ }
  }, [threadEmail, ensure]);

  useEffect(() => { idRef.current = null; setThread(null); load(); }, [load]);

  // Realtime perubahan mode / typing / presence
  useEffect(() => {
    if (!threadEmail) return;
    let unsub;
    try {
      unsub = ConsultationThread.subscribe(event => {
        if (!event?.data || event.data.thread_email === threadEmail) load();
      });
    } catch { /* noop */ }
    return () => { try { unsub?.(); } catch { /* noop */ } };
  }, [threadEmail, load]);

  // Heartbeat presence + refresh berkala agar indikator selalu akurat
  useEffect(() => {
    if (!threadEmail) return;
    const beat = async () => {
      try {
        const row = idRef.current ? { id: idRef.current } : await ensure();
        if (!row?.id) return;
        await ConsultationThread.update(row.id, {
          [meRole === 'admin' ? 'admin_online_at' : 'user_online_at']: new Date().toISOString(),
        });
      } catch { /* noop */ }
    };
    beat();
    const timer = setInterval(beat, 20000);
    const ui = setInterval(() => setTick(t => t + 1), 2500);
    return () => { clearInterval(timer); clearInterval(ui); };
  }, [threadEmail, meRole, ensure]);

  const notifyTyping = useCallback(async () => {
    const now = Date.now();
    if (now - lastTypingRef.current < 2500) return;
    lastTypingRef.current = now;
    try {
      const row = idRef.current ? { id: idRef.current } : await ensure();
      if (!row?.id) return;
      await ConsultationThread.update(row.id, {
        [meRole === 'admin' ? 'admin_typing_at' : 'user_typing_at']: new Date().toISOString(),
      });
    } catch { /* noop */ }
  }, [meRole, ensure]);

  const setMode = useCallback(async (mode) => {
    try {
      const row = idRef.current ? { id: idRef.current } : await ensure();
      if (!row?.id) return;
      const payload = { mode };
      if (mode === 'manual') payload.takeover_at = new Date().toISOString();
      await ConsultationThread.update(row.id, payload);
      await load();
    } catch { /* noop */ }
  }, [ensure, load]);

  void tick;
  const otherTyping = meRole === 'admin' ? isFresh(thread?.user_typing_at) : isFresh(thread?.admin_typing_at);
  const otherOnline = meRole === 'admin' ? isOnline(thread?.user_online_at) : isOnline(thread?.admin_online_at);

  return {
    thread,
    mode: thread?.mode || 'ai_auto',
    aiActive: (thread?.mode || 'ai_auto') === 'ai_auto',
    otherTyping,
    otherOnline,
    notifyTyping,
    setMode,
  };
}