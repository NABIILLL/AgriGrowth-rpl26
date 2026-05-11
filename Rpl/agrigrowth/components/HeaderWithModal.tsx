"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserCircle2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { clearUser } from "@/lib/auth";

const logoMark = "https://www.figma.com/api/mcp/asset/eb8b6bb8-e06c-41c9-9ec8-8aca0e559999";

interface HeaderWithModalProps {
  onSignUpClick: () => void;
}

export default function HeaderWithModal({ onSignUpClick }: HeaderWithModalProps) {
  const { user, isLoading } = useUser();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    clearUser();
    setShowMenu(false);
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
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 rounded-full bg-[rgba(54,90,26,0.9)] px-4 py-2 shadow-md text-white hover:bg-[rgba(54,90,26,1)] transition"
              >
                <span className="text-lg font-medium">{user.name}</span>
                <UserCircle2 className="h-8 w-8 text-white/95" strokeWidth={1.7} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">{user.email || user.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-gray-100 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
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
