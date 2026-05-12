'use client';

import { useEffect, useState } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  role?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let channel: any = null;
    const loadingTimeout = window.setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 3000);

    // Fetch profile from Supabase
    const fetchProfile = async (userId: string) => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          if (Object.keys(error as object).length === 0) {
            return null;
          }

          const message = (error as { message?: string }).message || '';
          const code = (error as { code?: string }).code || '';

          // Ignore "no rows found" and "table does not exist" errors
          if (
            code === 'PGRST116' || 
            code === '42P01' || 
            /no rows found/i.test(message) ||
            /could not find the table/i.test(message) ||
            /relation .* does not exist/i.test(message)
          ) {
            return null;
          }

          const isEmptyError = !code && !message;
          if (isEmptyError) {
            return null;
          }

          console.warn('Warning: Could not fetch profile', { code, message });
          return null;
        }
        
        return data || null;
      } catch (err) {
        console.warn('Warning: Failed to fetch profile', err);
        return null;
      }
    };

    const fetchUserRole = async (userId: string, token?: string) => {
      try {
        if (!token) {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token;
        }

        if (!token) return null;

        const res = await fetch('/api/auth/role', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) return null;
        
        const data = await res.json();
        return data?.role ?? null;
      } catch (err) {
        console.warn('Warning: Failed to fetch user role via API', err);
        return null;
      }
    };

    // Load function to sync state
    const syncSession = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          const [profile, roleFromDb] = await Promise.all([
            fetchProfile(session.user.id),
            fetchUserRole(session.user.id, session.access_token),
          ]);
          const u: UserProfile = {
            id: session.user.id,
            name: profile?.name || resolveUserName(session.user),
            email: session.user.email,
            phone: profile?.phone,
            location: profile?.location,
            role: roleFromDb || profile?.role || session.user.user_metadata?.role,
            bio: profile?.bio,
            created_at: profile?.created_at,
            updated_at: profile?.updated_at,
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
        console.warn('Warning: Failed to load session', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    syncSession();

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<UserProfile>;
      if (mounted && customEvent.detail) {
        const nextUser = customEvent.detail;
        localStorage.setItem('user', JSON.stringify(nextUser));
        setUser(nextUser);
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdated as EventListener);

    // Listen to changes (login, logout, token refresh, email confirm)
    import('@/lib/supabase').then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && mounted) {
          const [profile, roleFromDb] = await Promise.all([
            fetchProfile(session.user.id),
            fetchUserRole(session.user.id, session.access_token),
          ]);
          const u: UserProfile = {
            id: session.user.id,
            name: profile?.name || resolveUserName(session.user),
            email: session.user.email,
            phone: profile?.phone,
            location: profile?.location,
            role: roleFromDb || profile?.role || session.user.user_metadata?.role,
            bio: profile?.bio,
            created_at: profile?.created_at,
            updated_at: profile?.updated_at,
          };
          localStorage.setItem('user', JSON.stringify(u));
          setUser(u);
          
          // Subscribe to realtime updates on profiles table
          if (session.user.id) {
            if (channel) {
              await supabase.removeChannel(channel);
            }

            channel = supabase
              .channel(`profile:${session.user.id}`)
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'profiles',
                  filter: `id=eq.${session.user.id}`,
                },
                (payload) => {
                  if (payload.new && mounted) {
                    const updatedProfile = payload.new as any;
                    const updatedUser: UserProfile = {
                      id: session.user.id,
                      name: updatedProfile.name || resolveUserName(session.user),
                      email: session.user.email,
                      phone: updatedProfile.phone,
                      location: updatedProfile.location,
                      role: updatedProfile.role,
                      bio: updatedProfile.bio,
                      created_at: updatedProfile.created_at,
                      updated_at: updatedProfile.updated_at,
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                  }
                }
              )
              .subscribe();
          }
        } else if (event === 'SIGNED_OUT' && mounted) {
          setUser(null);
          localStorage.removeItem('user');
          if (channel) {
            await supabase.removeChannel(channel);
            channel = null;
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    });

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimeout);
      window.removeEventListener('profile-updated', handleProfileUpdated as EventListener);
    };
  }, []);

  return { user, isLoading };
}
