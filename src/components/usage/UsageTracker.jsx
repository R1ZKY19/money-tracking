import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';

export default function UsageTracker({ userId }) {
  const location = useLocation();
  const [failed, setFailed] = useState(false);
  const pathRef = useRef(location.pathname);

  useEffect(() => { pathRef.current = location.pathname; }, [location.pathname]);

  useEffect(() => {
    if (!userId) return;
    const sessionKey = crypto.randomUUID();
    let queue = Promise.resolve();
    let lastVisibleAt = document.visibilityState === 'visible' ? Date.now() : null;

    const send = (action, seconds = 0) => {
      const payload = { action, session_key: sessionKey, delta_seconds: seconds > 45 ? 0 : seconds, page_path: pathRef.current, user_agent: navigator.userAgent };
      queue = queue.then(async () => { const { error } = await supabase.from('usage_sessions').upsert(payload, { onConflict: 'session_key' }); if (error) setFailed(true); else setFailed(false); });
    };

    const flush = (action = 'heartbeat') => {
      const now = Date.now();
      const seconds = lastVisibleAt ? Math.floor((now - lastVisibleAt) / 1000) : 0;
      if (document.visibilityState === 'visible' || action === 'pause') send(action, seconds);
      lastVisibleAt = document.visibilityState === 'visible' && action !== 'pause' ? now : null;
    };

    if (document.visibilityState === 'visible') send('heartbeat', 0);
    const interval = setInterval(() => flush('heartbeat'), 30000);
    const visibility = () => {
      if (document.visibilityState === 'hidden') flush('pause');
      else { lastVisibleAt = Date.now(); send('heartbeat', 0); }
    };
    const pagehide = () => flush('pause');
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pagehide);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pagehide);
      flush('pause');
    };
  }, [userId]);

  return <p className={`text-[11px] mb-3 ${failed ? 'text-destructive' : 'text-muted-foreground'}`}>{failed ? 'Pencatatan sesi terputus; akan mencoba kembali.' : 'Durasi halaman yang terlihat, perangkat, dan halaman terakhir dicatat untuk pemantauan owner. Tab tersembunyi tidak dihitung.'}</p>;
}