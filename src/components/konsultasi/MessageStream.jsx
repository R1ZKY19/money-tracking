import ChatMessage from '@/components/konsultasi/ChatMessage';

const dayKey = (v) => new Date(v).toDateString();
const dayLabel = (v) => {
  const d = new Date(v);
  const today = new Date().toDateString();
  const yst = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === today) return 'Hari ini';
  if (d.toDateString() === yst) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Riwayat chat dengan pemisah tanggal.
export default function MessageStream({ messages, meRole, highlight }) {
  let last = '';
  const match = (m) => highlight && String(m.message || '').toLowerCase().includes(highlight.toLowerCase());

  return (
    <>
      {messages.map(m => {
        const key = dayKey(m.created_date);
        const showDay = key !== last;
        last = key;
        return (
          <div key={m.id}>
            {showDay && (
              <div className="flex justify-center my-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                  {dayLabel(m.created_date)}
                </span>
              </div>
            )}
            <div className={match(m) ? 'rounded-2xl ring-2 ring-amber-300/70' : ''}>
              <ChatMessage msg={m} mine={m.sender_role === meRole} />
            </div>
          </div>
        );
      })}
    </>
  );
}