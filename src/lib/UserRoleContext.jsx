import { useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import UserRoleContext from '@/components/auth/UserRoleContextValue';
// Akses default per role dihitung dari registry fitur → selalu sinkron
// saat ada fitur baru, diubah, atau dihapus.
import { ROLE_DEFAULT_MODULES } from '@/lib/featureRegistry';

export function UserRoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [approvedUser, setApprovedUser] = useState(null);
  const [role, setRole] = useState('none');
  const [accessModules, setAccessModules] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setLoading(false); return; }

      // Ambil profil dari tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const fullUser = { ...authUser, ...(profile || {}) };
      setUser(fullUser);

      if (profile?.is_approved) {
        // Ambil data approved_user yang mungkin punya role & access_modules kustom
        const { data: approvedRecord } = await supabase
          .from('approved_users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (approvedRecord) {
          setApprovedUser(approvedRecord);
          setRole(profile.role || approvedRecord.role || 'user');
          const mods = approvedRecord.access_modules;
          setAccessModules(Array.isArray(mods) ? mods : null);
        } else {
          setRole(profile.role || 'user');
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: perubahan profil langsung berlaku tanpa refresh halaman
  useEffect(() => {
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approved_users' }, () => refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  // Check if a module key is accessible by current user
  // accessModules === null means "use role default"
  // accessModules === [] means "truly empty / no access (custom override)"
  // accessModules === [...] means "custom list"
  const hasModule = useCallback((moduleKey) => {
    if (moduleKey === 'Email Approval') return user?.email?.toLowerCase().trim() === 'rizkykucuk19@gmail.com';
    // null/undefined = belum dikustomisasi → pakai role default
    if (accessModules === null || accessModules === undefined) {
      // Default tertutup: modul yang tidak terdaftar untuk role ini ditolak,
      // termasuk saat diakses langsung lewat URL.
      return ROLE_DEFAULT_MODULES[role]?.includes(moduleKey) ?? false;
    }
    // Array (kosong atau berisi) = kustom per-user → ikuti list ini
    return accessModules.includes(moduleKey);
  }, [role, accessModules, user?.email]);

  return (
    <UserRoleContext.Provider value={{ user, approvedUser, role, accessModules, loading, refresh, hasModule }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export const useUserRole = () => {
  const ctx = useContext(UserRoleContext);
  if (!ctx) throw new Error('useUserRole must be used inside UserRoleProvider');
  return ctx;
};