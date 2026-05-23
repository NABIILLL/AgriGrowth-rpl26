'use client';

import { useEffect, useState } from 'react';
import { useUser as useClerkUser, useSession as useClerkSession } from '@clerk/nextjs';
import { createClerkSupabaseClient } from '@/lib/supabaseClient';

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
        // Minta Token JWT khusus untuk Supabase dari Clerk Session
        const token = await session.getToken({ template: 'supabase' });
        if (!token) throw new Error('No Supabase token generated from Clerk');

        // Buat Supabase Client khusus yang menyertakan token ini (melewati RLS)
        const supabase = createClerkSupabaseClient(token);

        // Ambil profil dari tabel 'profiles' Supabase
        const supabaseUuid = clerkUser.publicMetadata?.supabase_uuid as string | undefined;
        if (!supabaseUuid) {
          console.warn('Supabase UUID not found in Clerk metadata (Webhook might not have finished yet)');
          // Set isLoading false so it doesn't hang, it will re-fetch when metadata updates
          if (mounted) setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUuid)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching Supabase profile:', error);
        }

        // Gabungkan data dasar Clerk dengan data spesifik dari Supabase Profiles
        if (mounted) {
          const email = clerkUser.primaryEmailAddress?.emailAddress;
          const u: UserProfile = {
            id: supabaseUuid,
            name: data?.name || clerkUser.fullName || clerkUser.firstName || email?.split('@')[0] || 'User',
            email: email,
            phone: data?.phone,
            location: data?.location,
            role: data?.role,
            bio: data?.bio,
            created_at: data?.created_at,
            updated_at: data?.updated_at,
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
