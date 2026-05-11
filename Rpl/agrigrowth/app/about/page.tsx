"use client";

import Link from "next/link";

const imgLogo = "https://www.figma.com/api/mcp/asset/2a7fcedd-9f30-4d90-8e58-295d41707608";
const imgProfile = "https://www.figma.com/api/mcp/asset/6e3b48fa-6d46-4818-a4c8-3a548e391ebd";

import { useUser } from "@/hooks/useUser";
import AuthModal from "@/components/AuthModal";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { clearUser } from "@/lib/auth";

export default function About() {
  const { user, isLoading } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearUser();
      window.location.reload();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#365a1a]">
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* Header */}
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center gap-2.5">
          <img alt="Agrigrowth logo" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
          <b className="text-[20px] leading-none sm:text-[21px]">Agrigrowth Monitor</b>
        </div>

        <nav className="hidden items-center gap-10 text-[21px] font-bold lg:flex">
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

        {!isLoading && (
          user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-[rgba(54,90,26,0.75)] px-3 py-2 text-[16px] font-medium text-[#d7e4cd] shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] sm:text-[18px]">
                <span>{user.name}</span>
                <img alt="Profile" className="h-8 w-8 object-contain" src={imgProfile} />
              </div>
              <button onClick={handleLogout} className="text-sm font-bold text-[#365a1a] hover:opacity-80 transition">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setIsModalOpen(true)} className="rounded-full bg-[#365a1a] px-5 py-2 text-[16px] font-medium text-white shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] sm:text-[18px] hover:bg-[#2d4915] transition">
              Login / Sign Up
            </button>
          )
        )}
      </header>

      {/* Content */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[1299px]">
          {/* Title */}
          <h1 className="text-[48px] font-extrabold leading-[1.2] sm:text-[56px]">
            Tentang AgriGrowth Monitor
          </h1>

          {/* Description */}
          <div className="mt-8 space-y-5 text-[18px] leading-[1.6] text-[#365a1a] sm:text-[20px]">
            <p>
              AgriGrowth Monitor adalah platform digital berbasis web yang dirancang untuk membantu
              mahasiswa pertanian dan petani dalam mencatat, memonitor, dan menganalisis data
              budidaya tanaman secara efisien. Sistem ini mendukung tiga komoditas utama: padi,
              jagung, dan bawang merah. Mulai dari logbook digital pertanian, monitoring pertumbuhan,
              hingga analisis dan visualisasi data. Karena berbasis web, aplikasi membutuhkan koneksi
              internet untuk akses penuh.
            </p>

            <p>
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
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Komoditas Card */}
            <div className="rounded-[20px] border-2 border-[#d9d9d9] bg-white p-6 shadow-[0px_4px_4px_rgba(0,0,0,0.1)]">
              <p className="text-[13px] font-extrabold uppercase tracking-wide text-[#8e938a]">
                Komoditas
              </p>
              <p className="mt-2 text-[40px] font-extrabold text-black">3</p>
              <p className="mt-2 text-[13px] text-[#365a1a]">
                Padi · Jagung · Bawang Merah
              </p>
            </div>

            {/* Fitur Utama Card */}
            <div className="rounded-[20px] border-2 border-[#d9d9d9] bg-white p-6 shadow-[0px_4px_4px_rgba(0,0,0,0.1)]">
              <p className="text-[13px] font-extrabold uppercase tracking-wide text-[#8e938a]">
                Fitur Utama
              </p>
              <p className="mt-2 text-[40px] font-extrabold text-black">8+</p>
              <p className="mt-2 text-[13px] text-[#365a1a]">Terintegrasi penuh</p>
            </div>

            {/* Platform Card */}
            <div className="rounded-[20px] border-2 border-[#d9d9d9] bg-white p-6 shadow-[0px_4px_4px_rgba(0,0,0,0.1)]">
              <p className="text-[13px] font-extrabold uppercase tracking-wide text-[#8e938a]">
                Platform
              </p>
              <p className="mt-2 text-[40px] font-extrabold text-black">Web</p>
              <p className="mt-2 text-[13px] text-[#365a1a]">Mobile &amp; desktop</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
