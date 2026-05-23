"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import { ArrowLeft } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { UserButton } from "@clerk/nextjs";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } as const }
};

const imgGrowthTrackerImage = "https://images.unsplash.com/photo-1592982537447-6f2a6a0c5c8e?q=80&w=800&auto=format&fit=crop";
const imgLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";
const imgProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

export default function GrowthTracker() {
  const { user, isLoading } = useUser();
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      {/* Header */}
      <header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition">
          <img alt="Agrigrowth logo" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
          <b className="text-[20px] leading-none sm:text-[21px]">Agrigrowth Monitor</b>
        </Link>

        <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-8 text-base font-semibold lg:flex">
          <Link href="/dashboard" className="hover:opacity-80 transition">
            Home
          </Link>
          <Link href="/about" className="hover:opacity-80 transition">
            About
          </Link>
          <Link href="/wireframe4" className="hover:opacity-80 transition">
            Features
          </Link>
        </nav>

        {!isLoading && (
          user ? (
            <div className="flex items-center gap-4"><UserButton showName={true} appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 shadow-md" } }} /></div>
          ) : (
            <Link
              href="/"
              className="rounded-full bg-[#365a1a] px-5 py-2 text-[16px] font-medium text-white shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] transition hover:bg-[#2d4915] sm:text-[18px]"
            >
              Login / Sign Up
            </Link>
          )
        )}
      </header>

      {/* Content */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 sm:gap-8 px-4 sm:px-5 pb-10 sm:pb-12 pt-4 sm:pt-6 md:px-10 lg:px-14 lg:pt-8"
      >
        {/* Hero Section */}
        <motion.article variants={fadeUpVariant} className="rounded-[20px] sm:rounded-[30px] bg-white p-4 sm:p-5 md:p-6 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:gap-8">
            <div className="h-[150px] sm:h-[190px] w-full overflow-hidden rounded-[16px] sm:rounded-[20px] md:h-[273px] md:max-w-[605px]">
              <img alt="Growth Tracker" className="h-full w-full object-cover" src={imgGrowthTrackerImage} />
            </div>

            <div className="w-full md:max-w-[578px]">
              <h1 className="text-[32px] sm:text-[42px] font-extrabold leading-[1.05] text-[#365a1a] lg:text-[60px]">
                Growth Tracker
              </h1>
              <p className="mt-2 sm:mt-3 text-[13px] sm:text-[15px] font-medium leading-[1.35] text-[#365a1a] lg:text-[18px]">
                Berfungsi sebagai buku catatan digital untuk memasukkan data fisik tanaman secara berkala, meliputi parameter tinggi tanaman, jumlah daun, jumlah cabang, hingga kondisi visual tanaman di lapangan. Melakukan pemrosesan data secara otomatis untuk menghasilkan nilai statistik tanpa pengolahan manual.
              </p>
            </div>
          </div>
        </motion.article>

        {/* Features List */}
        <motion.div variants={fadeUpVariant} className="rounded-[20px] sm:rounded-[30px] bg-white p-4 sm:p-6 md:p-8 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-[24px] sm:text-[32px] font-bold md:text-[40px]">Fitur Growth Tracker</h2>

          <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            {[
              {
                title: "Pencatatan Data Berkala",
                description: "Masukkan data fisik tanaman secara berkala dengan parameter lengkap",
              },
              {
                title: "Analisis Otomatis",
                description: "Sistem otomatis menganalisis dan memberikan rekomendasi untuk tanaman Anda",
              },
              {
                title: "Perhitungan Statistik",
                description: "Hitung rata-rata pertumbuhan, produktivitas, dan kebutuhan pupuk secara akurat",
              },
              {
                title: "Konversi Luas Lahan",
                description: "Konversi kebutuhan pupuk berdasarkan luas lahan yang Anda budidayakan",
              },
              {
                title: "Riwayat Lengkap",
                description: "Simpan dan lihat riwayat pengamatan tanaman dari waktu ke waktu",
              },
              {
                title: "Rekomendasi Perawatan",
                description: "Dapatkan rekomendasi perawatan berdasarkan data yang telah dimasukkan",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-[16px] sm:rounded-[20px] border-2 border-[#365a1a] p-3 sm:p-4 md:p-6"
              >
                <h3 className="text-[16px] sm:text-[18px] font-bold text-[#365a1a] md:text-[20px]">
                  {feature.title}
                </h3>
                <p className="mt-1 sm:mt-2 text-[12px] sm:text-[14px] text-[#365a1a]/80 md:text-[16px]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={fadeUpVariant} className="rounded-[20px] sm:rounded-[30px] bg-[#365a1a] p-4 sm:p-6 md:p-8 text-center text-white">
          <h2 className="text-[20px] sm:text-[28px] font-bold md:text-[36px]">Mulai Tracking Tanaman Anda</h2>
          <p className="mt-2 sm:mt-3 text-[14px] sm:text-[16px] md:text-[18px]">
            Catat data tanaman Anda secara berkala dan dapatkan insight yang akurat
          </p>
          <Link
            href="/dashboard"
            className="mt-4 sm:mt-6 inline-block rounded-full bg-white px-6 sm:px-8 py-2 sm:py-3 text-[12px] sm:text-[14px] font-semibold text-[#365a1a] transition hover:bg-gray-100 md:text-[16px]"
          >
            Buka Dashboard
          </Link>
        </motion.div>

        {/* Back Button */}
        <Link
          href="/wireframe4"
          className="inline-block rounded-full bg-[#365a1a] px-4 sm:px-6 py-2 sm:py-3 text-[12px] sm:text-[14px] font-semibold text-white transition hover:bg-[#2d4915]"
        >
          ← Kembali ke Features
        </Link>
      </motion.section>
    </main>
  );
}
