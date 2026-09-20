import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { logLogout } from '@/lib/activityLogger';
import { useAuth } from '@/lib/AuthContext';
import LogoutConfirmDialog from '@/components/ui/LogoutConfirmDialog';

export default function MobileLogoutButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try { await logLogout(); } catch {}
    supabase.auth.signOut().then(() => { window.location.href = '/login'; });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 text-sm font-semibold text-destructive active:bg-destructive/20"
      >
        <LogOut size={17} /> Keluar dari Aplikasi
      </button>
      <LogoutConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleLogout}
        userName={user?.full_name || user?.email?.split('@')[0] || 'Pengguna'}
      />
    </>
  );
}