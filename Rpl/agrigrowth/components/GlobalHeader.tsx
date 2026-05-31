"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import AgrigrowthLogo from "@/components/AgrigrowthLogo";

interface GlobalHeaderProps {
  variant?: "light" | "dark";
}

export default function GlobalHeader({ variant = "light" }: GlobalHeaderProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isDark = variant === "dark";

  // Colors
  const textColor = isDark ? "text-white" : "text-[#365a1a]";
  const textHover = isDark ? "hover:text-white/80" : "hover:opacity-80";
  const navTextBase = isDark ? "text-white/90" : "text-[#365a1a]";
  const navTextHover = isDark ? "hover:text-white" : "hover:opacity-80";
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/growth-tracker", label: "Growth Tracker" },
    { href: "/weather", label: "Weather" },
    { href: "/history", label: "History" },
    { href: "/analisis-penyakit", label: "Analisis Penyakit" },
  ];

  return (
    <>
      <header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        {/* Logo */}
        <Link href="/" className={`flex items-center transition ${textHover}`}>
          <AgrigrowthLogo imageSrc="/logo%202.png" showText={false} className="h-10 w-[170px] sm:h-11 sm:w-[190px]" />
        </Link>

        {/* Desktop Nav */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-6 text-[15px] xl:text-[16px] font-bold lg:flex whitespace-nowrap">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition ${navTextBase} ${navTextHover} ${
                  isActive && !isDark ? "border-b-2 border-[#365a1a]" : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3 min-h-[48px]">
          <div className="hidden lg:flex items-center gap-3">
            {isLoaded && isSignedIn && (
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8 xl:w-10 xl:h-10 shadow-md",
                  },
                }}
              />
            )}
            {isLoaded && !isSignedIn && (
              <>
                <SignInButton mode="modal">
                  <button className={`text-sm font-semibold transition ${isDark ? 'text-white/85 hover:text-white' : 'text-[#365a1a] hover:opacity-80'}`}>
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  {isDark ? (
                    <button className="inline-flex items-center gap-3 rounded-full bg-[#365a1a] px-4 py-2 shadow-lg hover:bg-[#2d4915] transition text-white">
                      <span className="text-lg font-medium">Sign Up</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3b300] font-bold text-black">›</span>
                    </button>
                  ) : (
                    <button className="rounded-full bg-[#365a1a] px-5 py-2 text-[16px] font-medium text-white shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] transition hover:bg-[#2d4915] sm:text-[18px]">
                      Login / Sign Up
                    </button>
                  )}
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((s) => !s)}
            className={`inline-flex items-center justify-center rounded-md p-2 lg:hidden ${textColor}`}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className={`lg:hidden absolute right-4 top-20 z-20 w-64 rounded-xl p-5 shadow-2xl ${isDark ? 'bg-[rgba(2,6,23,0.95)] backdrop-blur-md' : 'bg-white border border-gray-100'}`}>
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  onClick={() => setMobileOpen(false)}
                  href={link.href}
                  className={`text-base font-semibold ${isDark ? 'text-white/95 hover:text-white' : 'text-[#365a1a] hover:opacity-80'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className={`mt-5 border-t pt-5 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              {isLoaded && isSignedIn && (
                <div className="flex flex-col gap-2 items-start">
                  <UserButton showName={true} />
                </div>
              )}
              {isLoaded && !isSignedIn && (
                <div className="flex flex-col gap-3">
                  <SignInButton mode="modal">
                    <button className={`text-left text-sm font-semibold ${isDark ? 'text-white/90' : 'text-[#365a1a]'}`}>Sign In</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="rounded-md bg-[#365a1a] px-4 py-2.5 text-white font-medium text-center w-full shadow-md">Sign Up</button>
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
