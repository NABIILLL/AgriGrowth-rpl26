"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import AgrigrowthLogo from "@/components/AgrigrowthLogo";

interface HeaderWithModalProps {
  onSignUpClick: () => void;
  onSignInClick?: () => void;
}

export default function HeaderWithModal({ onSignUpClick, onSignInClick }: HeaderWithModalProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        <AgrigrowthLogo />

        <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-6 text-[15px] xl:text-[16px] font-bold lg:flex whitespace-nowrap opacity-90">
          <Link className="text-white/90 hover:text-white transition" href="/">Home</Link>
          <Link className="text-white/90 hover:text-white transition" href="/about">About</Link>
          <Link className="text-white/90 hover:text-white transition" href="/growth-tracker">Growth Tracker</Link>
          <Link className="text-white/90 hover:text-white transition" href="/weather">Weather</Link>
          <Link className="text-white/90 hover:text-white transition" href="/history">History</Link>
          <Link className="text-white/90 hover:text-white transition" href="/analisis-penyakit">Analisis Penyakit</Link>
        </nav>

        <div className="flex items-center gap-3 min-h-[48px]">
          <div className="hidden lg:flex items-center gap-3">
            {isLoaded && isSignedIn && (
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 shadow-md",
                  }
                }}
              />
            )}
            {isLoaded && !isSignedIn && (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-semibold text-white/85 hover:text-white transition">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center gap-3 rounded-full bg-[#365a1a] px-4 py-2 shadow-lg hover:bg-[#2d4915] transition text-white">
                    <span className="text-lg font-medium">Sign Up</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3b300] font-bold text-black">›</span>
                  </button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((s) => !s)}
            className="inline-flex items-center justify-center rounded-md p-2 text-white lg:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="lg:hidden absolute right-4 top-16 z-20 w-64 rounded-md bg-[rgba(2,6,23,0.72)] p-4 shadow-lg">
            <nav className="flex flex-col gap-3">
              <Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-white/95 hover:text-white" href="/">Home</Link>
              <Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-white/95 hover:text-white" href="/about">About</Link>
              <Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-white/95 hover:text-white" href="/growth-tracker">Growth Tracker</Link>
              <Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-white/95 hover:text-white" href="/weather">Weather</Link>
              <Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-white/95 hover:text-white" href="/history">History</Link>
              <Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-white/95 hover:text-white" href="/analisis-penyakit">Analisis Penyakit</Link>
            </nav>

            <div className="mt-3 border-t border-white/10 pt-3">
              {isLoaded && isSignedIn && (
                <div className="flex flex-col gap-2 mt-2 items-start">
                  <UserButton showName={true} />
                </div>
              )}
              {isLoaded && !isSignedIn && (
                <div className="flex flex-col gap-2">
                  <SignInButton mode="modal">
                    <button className="text-left text-sm font-semibold text-white/90">Sign In</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="rounded-md bg-[rgba(54,90,26,0.9)] px-3 py-2 text-white font-medium text-left">Sign Up</button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
