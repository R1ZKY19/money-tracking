import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConsultationMessage } from '@/api/entities';
import PageHeader from '@/components/ui/PageHeader';
import ThreadList from '@/components/konsultasi/ThreadList';
import ChatWindow from '@/components/konsultasi/ChatWindow';
import CustomerProfileCard from '@/components/konsultasi/CustomerProfileCard';
import useConsultation from '@/components/konsultasi/useConsultation';
import useConsultationThread from '@/components/konsultasi/useConsultationThread';
import { useUserRole } from '@/lib/UserRoleContext';
import { MessageCircle } from 'lucide-react';

const OWNER_EMAIL = 'rizkykucuk19@gmail.com';

export default function Konsultasi() {
  const navigate = useNavigate();
  const { user, role } = useUserRole();
  const myEmail = (user?.email || '').toLowerCase().trim();
  const isAdmin = myEmail === OWNER_EMAIL;

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(isAdmin);
  const [selected, setSelected] = useState('');

  const loadThreads = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const rows = await $entity.list('-created_date', 1000);
      const map = new Map();
      rows.forEach(r => {
        const key = r.thread_email;
        if (!key) return;
        const current = map.get(key) || { email: key, last: r.message, at: r.created_date, firstAt: r.created_date, unread: 0, total: 0 };
        if (new Date(r.created_date) > new Date(current.at)) { current.last = r.message; current.at = r.created_date; }
        if (new Date(r.created_date) < new Date(current.firstAt)) current.firstAt = r.created_date;
        current.total += 1;
        if (r.sender_role === 'user' && !r.read_at) current.unread += 1;
        map.set(key, current);
      });
      setThreads([...map.values()].sort((a, b) => new Date(b.at) - new Date(a.at)));
    } catch { /* biarkan daftar sebelumnya */ }
    finally { setThreadsLoading(false); }
  }, [isAdmin]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  useEffect(() => {
    if (!isAdmin) return;
    let unsub;
    try { unsub = ConsultationMessage.subscribe(() => loadThreads()); } catch { /* noop */ }
    return () => { try { unsub?.(); } catch { /* noop */ } };
  }, [isAdmin, loadThreads]);

  const threadEmail = isAdmin ? selected : myEmail;
  const meRole = isAdmin ? 'admin' : 'user';

  const chatState = useConsultation({
    threadEmail,
    meRole,
    meEmail: myEmail,
    meName: isAdmin ? 'Admin MONEY TRACKING' : (user?.full_name || myEmail),
  });

  const threadState = useConsultationThread({ threadEmail, meRole });

  // Admin mengirim pesan manual = otomatis ambil alih, AI berhenti membalas.
  const send = useCallback(async (text) => {
    if (isAdmin && threadState.mode !== 'manual') await threadState.setMode('manual');
    return chatState.send(text);
  }, [isAdmin, threadState, chatState]);

  const chat = useMemo(
    () => ({ ...chatState, send, threadReady: !!threadEmail }),
    [chatState, send, threadEmail]
  );

  return (
    <div className="max-w-7xl mx-auto w-full min-w-0">
      <PageHeader
        icon={MessageCircle}
        title="Konsultasi"
        subtitle={isAdmin
          ? 'Live chat realtime dengan seluruh pengguna — mode AI AUTO-REPLY atau ADMIN MANUAL'
          : 'Chat langsung dengan Admin & AI MONEY.T — balasan muncul tanpa refresh'}
      />

      {isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)] gap-3 lg:gap-4 items-start">
          <div className={`min-w-0 ${selected ? 'hidden lg:block' : 'block'}`}>
            <ThreadList
              threads={threads}
              loading={threadsLoading}
              activeEmail={selected}
              onSelect={setSelected}
            />
          </div>
          <div className={`min-w-0 space-y-3 ${selected ? 'block' : 'hidden lg:block'}`}>
            {selected && (
              <CustomerProfileCard
                thread={threads.find(t => t.email === selected) || { email: selected }}
                online={threadState.otherOnline}
                typing={threadState.otherTyping}
                mode={threadState.mode}
              />
            )}
            <ChatWindow
              onBack={selected ? () => setSelected('') : undefined}
              backLabel="Kembali ke daftar percakapan"
              title={selected || 'Pilih percakapan'}
              subtitle={selected ? 'Percakapan pengguna' : 'Daftar pengguna ada di panel kiri'}
              chat={chat}
              meRole="admin"
              otherLabel="Pengguna"
              otherOnline={threadState.otherOnline}
              otherTyping={threadState.otherTyping}
              mode={threadState.mode}
              onModeChange={threadState.setMode}
              showModeControl
              onTyping={threadState.notifyTyping}
              waMessage={`Halo, ini Admin MONEY TRACKING mengenai konsultasi ${selected || ''}.`}
            />
          </div>
        </div>
      ) : (
        <ChatWindow
          onBack={() => navigate('/')}
          backLabel="Kembali ke dashboard"
          title="Admin MONEY TRACKING"
          subtitle={`Anda masuk sebagai ${myEmail || 'pengguna'}`}
          chat={chat}
          meRole="user"
          otherLabel={threadState.aiActive ? 'AI MONEY.T' : 'Admin'}
          otherOnline={threadState.otherOnline || threadState.aiActive}
          otherTyping={threadState.otherTyping}
          mode={threadState.mode}
          aiActive={threadState.aiActive}
          onTyping={threadState.notifyTyping}
          waMessage={`Halo Admin MONEY TRACKING, saya ${myEmail} ingin konsultasi. Role saya: ${role}.`}
        />
      )}
    </div>
  );
}