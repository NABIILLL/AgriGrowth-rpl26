'use client';

import { useEffect, useState } from 'react';
import { useUser as useClerkUser, useSession as useClerkSession } from '@clerk/nextjs';

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

type ProfileRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  role?: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function useUser() {
  const { user: clerkUser, isLoaded: isClerkUserLoaded } = useClerkUser();
  const { session, isLoaded: isSessionLoaded } = useClerkSession();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function syncSupabaseProfile() {
      // Tunggu hingga Clerk selesai dimuat
      if (!isClerkUserLoaded || !isSessionLoaded) return;

      // Jika user belum login di Clerk, pastikan state kosong
      if (!clerkUser || !session) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
          localStorage.removeItem('user');
        }
        return;
      }

      try {
        const token = await session.getToken().catch(() => null);

        const clerkRole = clerkUser.publicMetadata?.role as string | undefined;
        let resolvedRole = clerkRole || undefined;
        const getAuthHeaders = () => (
          token ? { Authorization: `Bearer ${token}` } : undefined
        );

        try {
          const roleResponse = await fetch('/api/auth/role', {
            headers: getAuthHeaders(),
            credentials: 'include',
          });

          if (roleResponse.ok) {
            const payload = await roleResponse.json();
            resolvedRole = payload?.role || resolvedRole;
          }
        } catch (error) {
          console.warn('Failed to resolve role from /api/auth/role', error);
        }

        const email = clerkUser.primaryEmailAddress?.emailAddress;
        const supabaseUuid = clerkUser.publicMetadata?.supabase_uuid as string | undefined;

        let data: ProfileRow | null = null;

        try {
          const profileResponse = await fetch('/api/profile', {
            headers: getAuthHeaders(),
            credentials: 'include',
          });

          if (profileResponse.ok) {
            const payload = await profileResponse.json();
            data = payload?.profile || null;
          } else {
            console.warn('Failed to resolve profile from /api/profile', profileResponse.status);
          }
        } catch (error) {
          console.warn('Failed to fetch /api/profile', error);
        }

        const profileId = data?.id || supabaseUuid;

        if (!profileId) {
          const fallbackUser: UserProfile = {
            id: clerkUser.id,
            name: clerkUser.fullName || clerkUser.firstName || email?.split('@')[0] || 'User',
            email,
            role: resolvedRole,
          };

          if (mounted) {
            localStorage.setItem('user', JSON.stringify(fallbackUser));
            setUser(fallbackUser);
          }

          console.warn('Supabase profile not found by Clerk metadata or email');
          return;
        }

        const resolvedDbRole = data?.role || resolvedRole;

        // Gabungkan data dasar Clerk dengan data spesifik dari Supabase Profiles
        if (mounted) {
          const u: UserProfile = {
            id: profileId,
            name: data?.name || clerkUser.fullName || clerkUser.firstName || email?.split('@')[0] || 'User',
            email: email,
            phone: data?.phone || undefined,
            location: data?.location || undefined,
            role: resolvedDbRole || undefined,
            bio: data?.bio || undefined,
            created_at: data?.created_at || undefined,
            updated_at: data?.updated_at || undefined,
          };

          localStorage.setItem('user', JSON.stringify(u));
          setUser(u);
        }
      } catch (err) {
        console.warn('Failed to sync profile from Supabase', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    syncSupabaseProfile();

    return () => {
      mounted = false;
    };
  }, [clerkUser, session, isClerkUserLoaded, isSessionLoaded]);

  // Hapus Supabase Realtime sementara, jika sangat dibutuhkan nanti bisa dipasang dengan token JWT dari Clerk
  
  return { user, isLoading };
}
