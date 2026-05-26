"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Cek jika ada parameter code di URL (untuk flow PKCE)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          // Tukar code menjadi session jika menggunakan flow PKCE
          // Di client-side, Supabase-js sebenarnya bisa menangani ini secara otomatis,
          // tapi melakukan exchange secara eksplisit memastikan keamanan & kepastian.
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (user?.id) {
          const mode = urlParams.get("mode");
          const createdAt = new Date(user.created_at).getTime();
          const isNewUser = Date.now() - createdAt < 30000; // Account created within last 30 seconds

          if (mode === "signup" && !isNewUser) {
            await supabase.auth.signOut();
            throw new Error("Akun Google sudah terdaftar. Silakan gunakan menu Masuk (Login).");
          }
          let role = user.user_metadata?.role || null;

          if (session?.access_token) {
            const response = await fetch("/api/auth/role", {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (response.ok) {
              const payload = await response.json();
              role = payload?.role || role;
            } else {
              console.error("Error fetching user role:", response.status);
            }
          }

          const target = role === "admin" ? "/admin" : "/growth-tracker";
          router.replace(target);
          return;
        }

        router.replace("/growth-tracker");
        
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Terjadi kesalahan saat memproses login Google.");
        setTimeout(() => {
          router.replace("/");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        {error ? (
          <p className="text-red-500 font-medium">{error}</p>
        ) : (
          <p className="text-green-600 font-medium">Memproses login, mohon tunggu...</p>
        )}
      </div>
    </div>
  );
}
