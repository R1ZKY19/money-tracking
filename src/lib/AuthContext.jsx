import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

import { DEMO_MODE } from '@/components/demo/demoSession';
import { DEMO_USER } from '@/components/demo/demoSeed';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({ public_settings: {} });

  useEffect(() => {
    let isMounted = true;

    if (DEMO_MODE) {
      enterLocalDemo();
      return;
    }

    // Cek session awal
    checkAppState();

    // Listen untuk perubahan auth state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        setAuthError(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadUserProfile(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const enterLocalDemo = () => {
    setUser(DEMO_USER);
    setIsAuthenticated(true);
    setAuthError(null);
    setAuthChecked(true);
    setIsLoadingAuth(false);
    setIsLoadingPublicSettings(false);
    setAppPublicSettings({ public_settings: {} });
  };

  const loadUserProfile = async (authUser) => {
    if (!authUser) return;
    try {
      const emailLower = authUser.email?.toLowerCase();
      const isOwner = emailLower === 'rizkykucuk19@gmail.com';

      // Ambil profil dari tabel profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      // Gabungkan data auth user dengan profil
      const fullUser = {
        ...authUser,
        ...(profile || {}),
        email: authUser.email,
        id: authUser.id,
        role: isOwner ? 'super_master' : (profile?.role || 'user'),
        is_approved: isOwner ? true : (profile?.is_approved ?? false),
        full_name: profile?.full_name || authUser.user_metadata?.full_name || 'Super Master',
      };

      // JIKA OWNER / SUPER MASTER: Selalu aktif dan langsung tembus!
      if (isOwner) {
        // Pastikan database profiles & approved_users tersimpan sebagai super_master
        supabase.from('profiles').upsert({
          id: authUser.id,
          email: authUser.email,
          full_name: fullUser.full_name,
          role: 'super_master',
          is_approved: true,
        }, { onConflict: 'id' }).then(() => {});

        supabase.from('approved_users').upsert({
          email: authUser.email,
          role: 'super_master',
          is_approved: true,
          approved_by: 'system',
        }, { onConflict: 'email' }).then(() => {});

        setUser(fullUser);
        setIsAuthenticated(true);
        setAuthChecked(true);
        setAuthError(null);
        setIsLoadingAuth(false);
        return;
      }

      // Cek apakah email sudah diapprove oleh admin (untuk user biasa)
      if (profile && profile.is_approved === false) {
        setIsAuthenticated(false);
        setUser(fullUser);
        setAuthChecked(true);
        setAuthError({
          type: 'email_not_approved',
          message: 'Email sedang menunggu validasi administrator.',
        });
        setIsLoadingAuth(false);
        return;
      }

      // Cek apakah profil ada di approved_users
      if (!profile?.is_approved) {
        const { data: approvedRecord } = await supabase
          .from('approved_users')
          .select('id')
          .eq('email', authUser.email)
          .maybeSingle();

        if (!approvedRecord) {
          setIsAuthenticated(false);
          setUser(fullUser);
          setAuthChecked(true);
          setAuthError({
            type: 'email_not_approved',
            message: 'Email sedang menunggu validasi administrator.',
          });
          setIsLoadingAuth(false);
          return;
        }

        // Update profile menjadi approved
        await supabase
          .from('profiles')
          .update({ is_approved: true })
          .eq('id', authUser.id);
        
        fullUser.is_approved = true;
      }

      setUser(fullUser);
      setIsAuthenticated(true);
      setAuthChecked(true);
      setAuthError(null);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setAuthError({
        type: 'auth_error',
        message: 'Authentication error. Please try again.',
      });
      setIsAuthenticated(false);
      setAuthChecked(true);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const checkAppState = async () => {
    if (DEMO_MODE) { enterLocalDemo(); return; }
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        return;
      }

      await loadUserProfile(session.user);
    } catch (error) {
      console.error('Unexpected error in checkAppState:', error);
      setAuthError({
        type: 'unknown',
        message: error?.message || 'An unexpected error occurred',
      });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    if (DEMO_MODE) { enterLocalDemo(); return; }
    try {
      setIsLoadingAuth(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || !authUser.id) {
        throw new Error('Invalid user response');
      }
      await loadUserProfile(authUser);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
      setAuthChecked(true);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_expired', message: 'Your session has expired. Please log in again.' });
      } else {
        setAuthError({ type: 'auth_error', message: 'Authentication error. Please try again.' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await supabase.auth.signOut();
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    const returnTo = encodeURIComponent(window.location.href);
    window.location.href = `/login?next=${returnTo}`;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isDemo: DEMO_MODE,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};