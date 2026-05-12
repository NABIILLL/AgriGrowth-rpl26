'use client';

import { useEffect, useState } from 'react';

interface User {
  name: string;
  email?: string;
  id?: string;
}

const resolveUserName = (sessionUser: any) => {
  const metadata = sessionUser?.user_metadata || {};
  return (
    metadata.name ||
    metadata.full_name ||
    metadata.preferred_username ||
    sessionUser?.email?.split('@')[0] ||
    'User'
  );
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Load function to sync state
    const syncSession = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          const u = {
            name: resolveUserName(session.user),
            email: session.user.email,
            id: session.user.id,
            role: session.user.user_metadata?.role
          };
          localStorage.setItem('user', JSON.stringify(u));
          setUser(u);
        } else if (mounted) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    syncSession();

    // Listen to changes (login, logout, token refresh, email confirm)
    import('@/lib/supabase').then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && mounted) {
          const u = {
            name: resolveUserName(session.user),
            email: session.user.email,
            id: session.user.id,
            role: session.user.user_metadata?.role
          };
          localStorage.setItem('user', JSON.stringify(u));
          setUser(u);
        } else if (event === 'SIGNED_OUT' && mounted) {
          setUser(null);
          localStorage.removeItem('user');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { user, isLoading };
}
