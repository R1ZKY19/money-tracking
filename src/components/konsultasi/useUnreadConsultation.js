import { useCallback, useEffect, useState } from 'react';
import { ConsultationMessage } from '@/api/entities';
import { useUserRole } from '@/lib/UserRoleContext';

// Jumlah pesan konsultasi yang belum dibaca, dipakai badge global di header/sidebar.
// Admin (Super Master) menghitung pesan dari semua pengguna; pengguna menghitung
// balasan admin pada thread miliknya sendiri.
export default function useUnreadConsultation() {
  const { user, role, hasModule } = useUserRole();
  const [count, setCount] = useState(0);
  const email = (user?.email || '').toLowerCase();
  const isAdmin = role === 'super_master';
  const enabled = !!email && hasModule('Konsultasi');

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const rows = isAdmin
        ? await ConsultationMessage.list()
        : await ConsultationMessage.list();
      setCount(rows.filter(r => !r.read_at).length);
    } catch { /* biarkan nilai terakhir */ }
  }, [enabled, isAdmin, email]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!enabled) return;
    let unsub;
    try { unsub = ConsultationMessage.subscribe(() => load()); } catch { /* noop */ }
    const timer = setInterval(load, 20000);
    return () => { clearInterval(timer); try { unsub?.(); } catch { /* noop */ } };
  }, [enabled, load]);

  return count;
}