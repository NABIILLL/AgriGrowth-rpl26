"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { clearUser } from "@/lib/auth";

const imgGrowthTrackerImage = "https://www.figma.com/api/mcp/asset/0f007e12-4c18-46b6-ad68-a156ab1be51b";
const imgLogo = "https://www.figma.com/api/mcp/asset/90530aab-9c02-498f-97a0-e57018497d3e";
const imgProfile = "https://www.figma.com/api/mcp/asset/03caec6e-0209-4de6-a510-5e7ebeb6fffd";

export default function GrowthTracker() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearUser();
      router.push("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      {/* Header */}
      <header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition">
          <img alt="Agrigrowth logo" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
          <b className="text-[20px] leading-none sm:text-[21px]">Agrigrowth Monitor</b>
        </Link>

        <nav className="hidden items-center gap-10 text-[21px] font-bold lg:flex">
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
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full bg-[rgba(54,90,26,0.75)] px-3 py-2 text-[16px] font-medium text-[#d7e4cd] shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] transition hover:opacity-90 sm:text-[18px]"
              >
                <span>{user.name}</span>
                <img alt="Profile" className="h-8 w-8 object-contain" src={imgProfile} />
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-[#365a1a] hover:opacity-80 transition"
              >
                Logout
              </button>
            </div>
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
      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 pb-12 pt-6 sm:px-10 lg:px-14 lg:pt-8">
        {/* Hero Section */}
        <article className="rounded-[30px] bg-white p-5 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)] sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
            <div className="h-[190px] w-full overflow-hidden rounded-[20px] md:h-[273px] md:max-w-[605px]">
              <img alt="Growth Tracker" className="h-full w-full object-cover" src={imgGrowthTrackerImage} />
            </div>

            <div className="w-full md:max-w-[578px]">
              <h1 className="text-[42px] font-extrabold leading-[1.05] text-[#365a1a] lg:text-[60px]">
                Growth Tracker
              </h1>
              <p className="mt-3 text-[15px] font-medium leading-[1.35] text-[#365a1a] lg:text-[18px]">
                Berfungsi sebagai buku catatan digital untuk memasukkan data fisik tanaman secara berkala, meliputi parameter tinggi tanaman, jumlah daun, jumlah cabang, hingga kondisi visual tanaman di lapangan. Melakukan pemrosesan data secara otomatis untuk menghasilkan nilai statistik tanpa pengolahan manual.
              </p>
            </div>
          </div>
        </article>

        {/* Features List */}
        <div className="rounded-[30px] bg-white p-6 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)] sm:p-8">
          <h2 className="text-[32px] font-bold sm:text-[40px]">Fitur Growth Tracker</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
                className="rounded-[20px] border-2 border-[#365a1a] p-4 sm:p-6"
              >
                <h3 className="text-[18px] font-bold text-[#365a1a] sm:text-[20px]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[14px] text-[#365a1a]/80 sm:text-[16px]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-[30px] bg-[#365a1a] p-6 text-center text-white sm:p-8">
          <h2 className="text-[28px] font-bold sm:text-[36px]">Mulai Tracking Tanaman Anda</h2>
          <p className="mt-3 text-[16px] sm:text-[18px]">
            Catat data tanaman Anda secara berkala dan dapatkan insight yang akurat
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-[14px] font-semibold text-[#365a1a] transition hover:bg-gray-100 sm:text-[16px]"
          >
            Buka Dashboard
          </Link>
        </div>

        {/* Back Button */}
        <Link
          href="/wireframe4"
          className="inline-block rounded-full bg-[#365a1a] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#2d4915]"
        >
          ← Kembali ke Features
        </Link>
      </section>
    </main>
  );
}
