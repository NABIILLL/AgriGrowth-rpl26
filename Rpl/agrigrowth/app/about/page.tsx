"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useClerk } from "@clerk/nextjs";
import GlobalHeader from "@/components/GlobalHeader";
import { useState } from "react";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";

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
      <GlobalHeader variant="light" />

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

        {/* Growth Tracker Section */}
        <div className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t-2 border-[#d9d9d9]">
          <motion.article variants={fadeUpVariant} className="rounded-[20px] sm:rounded-[30px] bg-white p-4 sm:p-5 md:p-6 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:gap-8">
              <div className="h-[150px] sm:h-[190px] w-full overflow-hidden rounded-[16px] sm:rounded-[20px] md:h-[273px] md:max-w-[605px]">
                <img alt="Growth Tracker" className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1592982537447-6f2a6a0c5c8e?q=80&w=800&auto=format&fit=crop" />
              </div>

              <div className="w-full md:max-w-[578px]">
                <h2 className="text-[32px] sm:text-[42px] font-extrabold leading-[1.05] text-[#365a1a] lg:text-[60px]">
                  Growth Tracker
                </h2>
                <p className="mt-2 sm:mt-3 text-[13px] sm:text-[15px] font-medium leading-[1.35] text-[#365a1a] lg:text-[18px]">
                  Berfungsi sebagai buku catatan digital untuk memasukkan data fisik tanaman secara berkala, meliputi parameter tinggi tanaman, jumlah daun, jumlah cabang, hingga kondisi visual tanaman di lapangan. Melakukan pemrosesan data secara otomatis untuk menghasilkan nilai statistik tanpa pengolahan manual.
                </p>
              </div>
            </div>
          </motion.article>

          {/* Features List */}
          <motion.div variants={fadeUpVariant} className="mt-6 rounded-[20px] sm:rounded-[30px] bg-white p-4 sm:p-6 md:p-8 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)]">
            <h3 className="text-[24px] sm:text-[32px] font-bold md:text-[40px]">Fitur Growth Tracker</h3>

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
                  <h4 className="text-[16px] sm:text-[18px] font-bold text-[#365a1a] md:text-[20px]">
                    {feature.title}
                  </h4>
                  <p className="mt-1 sm:mt-2 text-[12px] sm:text-[14px] text-[#365a1a]/80 md:text-[16px]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}
