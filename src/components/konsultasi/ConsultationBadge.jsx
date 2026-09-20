import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import useUnreadConsultation from '@/components/konsultasi/useUnreadConsultation';
import { useUserRole } from '@/lib/UserRoleContext';

// Tombol pintasan Konsultasi di header dengan badge pesan belum dibaca.
export default function ConsultationBadge() {
  const { hasModule } = useUserRole();
  const count = useUnreadConsultation();
  if (!hasModule('Konsultasi')) return null;

  return (
    <Link
      to="/konsultasi"
      aria-label={`Konsultasi${count ? `: ${count} pesan belum dibaca` : ''}`}
      className="relative shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground hover:text-sidebar-primary transition-colors"
    >
      <MessageCircle size={15} className={count ? 'text-sky-300' : ''} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-sidebar">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}