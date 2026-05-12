"use client";

import Link from "next/link";
import { useEffect } from "react";
import { UserCircle2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { clearUser } from "@/lib/auth";

const logoMark = "https://www.figma.com/api/mcp/asset/eb8b6bb8-e06c-41c9-9ec8-8aca0e559999";

interface HeaderWithModalProps {
  onSignUpClick: () => void;
}

export default function HeaderWithModal({ onSignUpClick }: HeaderWithModalProps) {
  const { user, isLoading } = useUser();

  const handleLogout = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    clearUser();
    window.location.reload();
  };

  return (
    <>
      <div className="absolute inset-x-6 top-4 z-10 mx-auto flex max-w-[1280px] items-center justify-between">
        <div className="flex items-center gap-3">
          <img alt="Agrigrowth Monitor logo" className="h-9 w-9 object-contain" src={logoMark} />
          <div className="text-xl font-bold text-white">Agrigrowth Monitor</div>
        </div>

        <nav className="hidden items-center gap-8 lg:flex opacity-90">
          <Link className="text-lg font-semibold text-white/90 hover:text-white transition" href="/">Home</Link>
          <Link className="text-lg font-semibold text-white/90 hover:text-white transition" href="/about">About</Link>
          <Link className="text-lg font-semibold text-white/90 hover:text-white transition" href="/wireframe4">Features</Link>
        </nav>

        {!isLoading && (
          user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full bg-[rgba(54,90,26,0.9)] px-4 py-2 shadow-md text-white transition hover:bg-[rgba(54,90,26,1)]"
              >
                <span className="text-lg font-medium">{user.name}</span>
                <UserCircle2 className="h-8 w-8 text-white/95" strokeWidth={1.7} />
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-white/90 hover:text-white transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onSignUpClick}
              className="inline-flex items-center gap-3 rounded-full bg-[rgba(53,90,26,0.9)] px-4 py-2 shadow-md hover:bg-[rgba(53,90,26,1)] transition text-white"
            >
              <span className="text-lg font-medium">Sign Up</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-bold">›</span>
            </button>
          )
        )}
      </div>
    </>
  );
}
