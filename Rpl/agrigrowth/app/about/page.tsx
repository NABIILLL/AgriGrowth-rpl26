"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import AgrigrowthLogo from "../../components/AgrigrowthLogo";
import { motion, Variants } from "framer-motion";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 70, damping: 15 } as const
  }
};

const imgProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

export default function About() {
  const { user, isLoading } = useUser();
  const { openSignIn } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();

  return (
    <main className="min-h-screen bg-white text-[#365a1a]">
      {/* Header */}
      <header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 sm:gap-4 px-5 py-4 sm:py-6 sm:px-10 lg:px-14">
        <AgrigrowthLogo
          tone="light"
          textClassName="text-[20px] font-bold leading-none text-[#365a1a] sm:text-[21px]"
        />

        <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-4 sm:gap-6 md:gap-10 text-sm sm:text-base md:text-lg font-bold lg:flex">
          <Link href={user ? "/dashboard" : "/"} className="transition hover:opacity-80">
            Home
          </Link>
          <Link href="/about" className="border-b-2 border-[#365a1a]">
            About
          </Link>
          <Link href="/wireframe4" className="transition hover:opacity-80">
            Features
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!isLoading && (
            user ? (
              <div className="hidden sm:flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full bg-[rgba(54,90,26,0.75)] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-medium text-[#d7e4cd] shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] transition hover:opacity-90"
                >
                  <span>{user.name}</span>
                  <img alt="Profile" loading="lazy" className="h-8 w-8 object-contain" src={imgProfile} />
                </Link>
                <button onClick={handleLogout} disabled={isLoggingOut} className="text-xs sm:text-sm font-bold text-[#365a1a] hover:opacity-80 transition">
                  {isLoggingOut ? "Keluar..." : "Logout"}
                </button>
              </div>
            ) : (
              <button onClick={() => openSignIn()} className="hidden sm:block rounded-full bg-[#365a1a] px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-medium text-white shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] hover:bg-[#2d4915] transition">
                Login / Sign Up
              </button>
            )
          )}

          {/* Mobile menu toggle */}
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((s) => !s)}
            className="inline-flex items-center justify-center rounded-md p-2 text-[#365a1a] sm:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="sm:hidden absolute right-4 top-16 z-20 w-64 rounded-md bg-white border border-[#e0e0e0] p-4 shadow-lg">
            <nav className="flex flex-col gap-3">
              <Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-[#365a1a] hover:opacity-80" href={user ? "/dashboard" : "/"}>Home</Link>
              <Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-[#365a1a] hover:opacity-80" href="/about">About</Link>
              <Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-[#365a1a] hover:opacity-80" href="/wireframe4">Features</Link>
            </nav>

            <div className="mt-3 border-t border-[#e0e0e0] pt-3">
              {!isLoading ? (
                user ? (
                  <div className="flex flex-col gap-2">
                    <Link onClick={() => setMobileOpen(false)} href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 bg-[rgba(54,90,26,0.9)] text-white">
                      <img alt="Profile" loading="lazy" className="h-5 w-5 object-contain" src={imgProfile} />
                      <span className="font-medium">{user.name}</span>
                    </Link>
                    <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="text-left text-sm font-semibold text-[#365a1a]">{isLoggingOut ? 'Keluar...' : 'Logout'}</button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      openSignIn();
                    }}
                    className="w-full rounded-full bg-[#365a1a] px-3 py-2 text-sm font-medium text-white hover:bg-[#2d4915] transition"
                  >
                    Login / Sign Up
                  </button>
                )
              ) : null}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto w-full px-4 sm:px-5 py-8 sm:py-12 sm:px-10 lg:px-14"
      >
        <div className="mx-auto max-w-[1299px]">
          {/* Title */}
          <motion.h1 variants={fadeUpVariant} className="text-3xl font-extrabold leading-[1.2] sm:text-4xl md:text-5xl lg:text-[56px]">
            Tentang AgriGrowth Monitor
          </motion.h1>

          {/* Description */}
          <div className="mt-8 space-y-5 text-sm sm:text-base md:text-lg lg:text-[20px] leading-[1.6] text-[#365a1a]">
            <motion.p variants={fadeUpVariant}>
              AgriGrowth Monitor adalah platform digital berbasis web yang dirancang untuk membantu
              mahasiswa pertanian dan petani dalam mencatat, memonitor, dan menganalisis data
              budidaya tanaman secara efisien. Sistem ini mendukung tiga komoditas utama: padi,
              jagung, dan bawang merah. Mulai dari logbook digital pertanian, monitoring pertumbuhan,
              hingga analisis dan visualisasi data. Karena berbasis web, aplikasi membutuhkan koneksi
              internet untuk akses penuh.
            </motion.p>

            <motion.p variants={fadeUpVariant}>
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget
              dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes,
              nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis,
              sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec,
              vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.
              Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus
              elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor
              eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis,
              feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum.
              Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi.
              Nam eget dui.
            </motion.p>
          </div>

          {/* Stats Cards */}
          <div 
            className="mt-12"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'center'
            }}
          >
            {/* Komoditas Card */}
            <motion.div 
              variants={fadeUpVariant}
              className="rounded-[20px] border-2 border-[#d9d9d9] bg-white p-4 sm:p-6 shadow-[0px_4px_4px_rgba(0,0,0,0.1)]"
              style={{ flex: '1 1 calc(100% - 1rem)', minWidth: '250px', maxWidth: '350px' }}
            >
              <p className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wide text-[#8e938a]">
                Komoditas
              </p>
              <p className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-black">3</p>
              <p className="mt-2 text-xs sm:text-[13px] text-[#365a1a]">
                Padi · Jagung · Bawang Merah
              </p>
            </motion.div>

            {/* Fitur Utama Card */}
            <motion.div 
              variants={fadeUpVariant}
              className="rounded-[20px] border-2 border-[#d9d9d9] bg-white p-4 sm:p-6 shadow-[0px_4px_4px_rgba(0,0,0,0.1)]"
              style={{ flex: '1 1 calc(100% - 1rem)', minWidth: '250px', maxWidth: '350px' }}
            >
              <p className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wide text-[#8e938a]">
                Fitur Utama
              </p>
              <p className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-black">8+</p>
              <p className="mt-2 text-xs sm:text-[13px] text-[#365a1a]">Terintegrasi penuh</p>
            </motion.div>

            {/* Platform Card */}
            <motion.div 
              variants={fadeUpVariant}
              className="rounded-[20px] border-2 border-[#d9d9d9] bg-white p-4 sm:p-6 shadow-[0px_4px_4px_rgba(0,0,0,0.1)]"
              style={{ flex: '1 1 calc(100% - 1rem)', minWidth: '250px', maxWidth: '350px' }}
            >
              <p className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wide text-[#8e938a]">
                Platform
              </p>
              <p className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-black">Web</p>
              <p className="mt-2 text-xs sm:text-[13px] text-[#365a1a]">Mobile &amp; desktop</p>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
