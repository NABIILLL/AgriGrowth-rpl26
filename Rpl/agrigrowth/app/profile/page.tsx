"use client";

// Import library, icon Lucide React, hooks custom, dan komponen UI yang digunakan
import Link from "next/link";
import { useState, type ElementType } from "react";
import {
  BarChart3,
  CalendarDays,
  CloudRain,
  CloudSun,
  Droplet,
  Edit2,
  History,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Sprout,
  Sun,
  TrendingUp,
  Wind,
} from "lucide-react";

import { useUser } from "@/hooks/useUser";
import { useClerk } from "@clerk/nextjs";
import GlobalHeader from "@/components/GlobalHeader";
import ProfileEditor from "@/components/ProfileEditor";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import { motion, Variants } from "framer-motion";

// Animasi transisi masuk menggunakan Framer Motion
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

// URL Aset Gambar & Default profil data cadangan (fallback mock data)
const imgLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";
const imgProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

const defaultProfile = {
  name: "Budi Raharjo",
  role: "Agronomist Senior",
  subtitle: "Peneliti & Pengelola Lahan",
  location: "Bogor, Jawa Barat",
  email: "budi@agri.id",
  phone: "+62 812-3456-789",
  joined: "Maret 2022",
  tags: ["Padi", "Jagung", "Tanah Alluvial", "Pertanian Digital"],
};

// Mock data statistik buatan
const stats = [
  { label: "Lahan Aktif", value: "12" },
  { label: "Tahun Exp.", value: "8+" },
  { label: "Keberhasilan", value: "94%" },
  { label: "Analisis Baru", value: "3" },
];

// Mock data keahlian budidaya
const skills = [
  { label: "Analisis Tanah", value: 92 },
  { label: "Pemantauan Cuaca", value: 85 },
  { label: "Rotasi Tanaman", value: 78 },
  { label: "Data Digital", value: 88 },
];

// Mock data lahan tanaman milik pengguna
const fields = [
  { name: "Padi lahan Bogor", badge: "Aktif", tone: "emerald" },
  { name: "Jagung Rezon", badge: "Panen", tone: "amber" },
  { name: "Padi Praktikum", badge: "Monitor", tone: "blue" },
  { name: "Sawah belakang kampus", badge: "Aktif", tone: "emerald" },
];

// Mock data aktivitas log terbaru pengguna
const activities = [
  {
    title: "Analisis selesai - Sawah belakang kampus",
    time: "2 jam lalu",
    tag: "Selesai",
    icon: TrendingUp,
  },
  {
    title: "Pembaruan data cuaca otomatis",
    time: "6 jam lalu",
    tag: "Otomatis",
    icon: CloudRain,
  },
  {
    title: "Tracker baru dibuat - Jagung Rezon",
    time: "1 hari lalu",
    tag: "Baru",
    icon: Sprout,
  },
];

// Komponen utama halaman Profil Pengguna
export default function ProfilePage() {
  // State dan hooks untuk mengambil status user, Clerk login, modal edit profil, dan konfirmasi logout
  const { user, isLoading } = useUser();
  const { openSignIn } = useClerk();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Menentukan variabel display berdasarkan prioritas data user aktif dari DB dibanding data dummy
  const displayName = user?.name || defaultProfile.name;
  const displayEmail = user?.email || defaultProfile.email;
  const displayPhone = user?.phone || defaultProfile.phone;
  const displayLocation = user?.location || defaultProfile.location;
  const displayRole = user?.role || defaultProfile.role;
  const displayInitials = (
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "AG"
  ).toUpperCase();
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();

  return (
    // Return JSX untuk merender UI Halaman Profil Pengguna
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      {/* Komponen Modal Editor Profil */}
      <ProfileEditor
        key={isEditModalOpen ? `profile-editor-open-${user?.id || "guest"}` : `profile-editor-closed-${user?.id || "guest"}`}
        isOpen={isEditModalOpen}
        user={user}
        onClose={() => setIsEditModalOpen(false)}
      />

      <GlobalHeader variant="light" />

      {/* Kontainer Utama Konten Profil */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-[1440px] px-5 pb-16 sm:px-10 lg:px-14"
      >
        <h1 className="sr-only">Halaman profil pengguna AgriGrowth Monitor</h1>

        {/* Panel Profil Card Hero (Foto inisial, nama, bio, tombol edit) */}
        <motion.div variants={fadeUpVariant} className="relative overflow-hidden rounded-[24px] bg-[#1f4b1a] text-white shadow-[0_24px_60px_rgba(23,52,4,0.25)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_42%),repeating-linear-gradient(45deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_14px)]" />
          <div className="relative flex flex-col gap-6 px-6 pb-6 pt-8 sm:px-10 lg:flex-row lg:items-start lg:gap-10">
            <div className="flex items-start gap-5">
              <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full border-2 border-[#9fcd6a] bg-[#6aa439] text-[28px] font-semibold text-white">
                {displayInitials}
              </div>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#9fcd6a] bg-[rgba(151,196,89,0.18)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#d8edae]">
                  <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                  {displayRole || defaultProfile.role}
                </span>
                <h2 className="mt-3 text-xl sm:text-2xl md:text-[32px] font-semibold leading-tight">
                  {displayName}
                </h2>
                <p className="mt-1 text-xs sm:text-[13px] md:text-[14px] text-[#d8edae]">
                  {user?.bio || defaultProfile.subtitle} · {displayLocation}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {defaultProfile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-[11px] text-white/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:ml-auto">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9fcd6a] px-4 py-2 text-[13px] font-semibold text-[#1f4b1a] transition hover:bg-white"
              >
                <Edit2 className="h-4 w-4" aria-hidden="true" />
                Edit Profil
              </button>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center text-white sm:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 px-2 sm:px-3 py-3 sm:py-4"
                  >
                    <div className="text-lg sm:text-2xl md:text-[24px] font-semibold">{stat.value}</div>
                    <div className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#d8edae]">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid Informasi Detail Diri & Bar Keahlian */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Panel Detail Informasi Personal */}
          <motion.div variants={fadeUpVariant} className="rounded-[18px] border border-[#e0e5da] bg-white p-6 shadow-[0_14px_30px_rgba(54,90,26,0.08)]">
            <div className="flex items-center gap-3 text-[#365a1a]">
              <InfoBadge icon={Mail} label="Informasi" />
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <InfoRow icon={Mail} label="Email" value={displayEmail} />
              <InfoRow icon={Phone} label="Telepon" value={displayPhone} />
              <InfoRow icon={MapPin} label="Lokasi" value={displayLocation} />
              <InfoRow icon={CalendarDays} label="Bergabung" value={defaultProfile.joined} />
            </div>
          </motion.div>

          {/* Panel Keahlian / Skill Meter */}
          <motion.div variants={fadeUpVariant} className="rounded-[18px] border border-[#e0e5da] bg-white p-6 shadow-[0_14px_30px_rgba(54,90,26,0.08)]">
            <div className="flex items-center gap-3 text-[#365a1a]">
              <InfoBadge icon={BarChart3} label="Keahlian" />
            </div>
            <div className="mt-5 space-y-4">
              {skills.map((skill) => (
                <div key={skill.label} className="flex items-center gap-2 sm:gap-4">
                  <div className="min-w-[80px] sm:min-w-[120px] text-xs sm:text-[13px] text-[#6a7f55]">
                    {skill.label}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ecf1e6]">
                    <div
                      className="h-full rounded-full bg-[#6aa439]"
                      style={{ width: `${skill.value}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-[12px] font-semibold text-[#4b6d2c]">
                    {skill.value}%
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Grid Lahan Saya & Monitoring Cuaca */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Panel Lahan Saya */}
          <motion.div variants={fadeUpVariant} className="rounded-[18px] border border-[#e0e5da] bg-white p-6 shadow-[0_14px_30px_rgba(54,90,26,0.08)]">
            <div className="flex items-center gap-3 text-[#365a1a]">
              <InfoBadge icon={Sprout} label="Lahan Saya" />
            </div>
            <div className="mt-5 space-y-3">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className="flex items-center justify-between rounded-xl border border-[#eef2ea] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        field.tone === "amber"
                          ? "h-2.5 w-2.5 rounded-full bg-[#c7852e]"
                          : field.tone === "blue"
                          ? "h-2.5 w-2.5 rounded-full bg-[#1f6bb6]"
                          : "h-2.5 w-2.5 rounded-full bg-[#6aa439]"
                      }
                    />
                    <span className="text-[14px] font-medium text-[#2f4a19]">
                      {field.name}
                    </span>
                  </div>
                  <span
                    className={
                      field.tone === "amber"
                        ? "rounded-full border border-[#f6d7a3] bg-[#fff6e7] px-3 py-1 text-[11px] font-semibold text-[#b36b1c]"
                        : field.tone === "blue"
                        ? "rounded-full border border-[#bcd6f3] bg-[#eff5ff] px-3 py-1 text-[11px] font-semibold text-[#1c5fa0]"
                        : "rounded-full border border-[#cfe3ad] bg-[#f1f8e7] px-3 py-1 text-[11px] font-semibold text-[#4b6d2c]"
                    }
                  >
                    {field.badge}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Panel Widget Pemantau Cuaca Hari Ini */}
          <motion.div variants={fadeUpVariant} className="rounded-[18px] border border-[#e0e5da] bg-white p-6 shadow-[0_14px_30px_rgba(54,90,26,0.08)]">
            <div className="flex items-center gap-3 text-[#365a1a]">
              <InfoBadge icon={CloudSun} label="Cuaca Hari Ini" />
            </div>
            <div className="mt-6 text-center">
              <div className="text-[44px] font-semibold text-[#4b6d2c]">26°</div>
              <div className="text-[13px] text-[#6a7f55]">Berawan - Bogor</div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <WeatherCard icon={Droplet} label="Kelembapan" value="78%" />
              <WeatherCard icon={Wind} label="Angin" value="12km/j" />
              <WeatherCard icon={Sun} label="Curah Hujan" value="4.2mm" />
            </div>
          </motion.div>
        </div>

        {/* Panel Aktivitas Terbaru Logbook */}
        <motion.div variants={fadeUpVariant} className="mt-6 rounded-[18px] border border-[#e0e5da] bg-white p-6 shadow-[0_14px_30px_rgba(54,90,26,0.08)]">
          <div className="flex items-center gap-3 text-[#365a1a]">
            <InfoBadge icon={History} label="Aktivitas Terbaru" />
          </div>
          <div className="mt-5 space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.title}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#eef2ea] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f7e9] text-[#4b6d2c]">
                    <activity.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="text-[14px] font-medium text-[#2f4a19]">
                      {activity.title}
                    </div>
                    <div className="text-[12px] text-[#6a7f55]">{activity.time}</div>
                  </div>
                </div>
                <span className="rounded-full border border-[#cfe3ad] bg-[#f1f8e7] px-3 py-1 text-[11px] font-semibold text-[#4b6d2c]">
                  {activity.tag}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tombol pintas navigasi menu aksi bawah */}
        <motion.div variants={fadeUpVariant} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#365a1a] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#2d4915]"
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            Analisis Baru
          </button>
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#9fcd6a] bg-white px-5 py-3 text-[14px] font-semibold text-[#365a1a] transition hover:border-[#6aa439] hover:text-[#2d4915]"
          >
            <History className="h-4 w-4" aria-hidden="true" />
            Lihat Laporan
          </button>
        </motion.div>
      </motion.section>
    </main>
  );
}

// Sub-komponen lencana informasi badge
function InfoBadge({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.25em] text-[#365a1a]">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </div>
  );
}

// Sub-komponen baris info
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#eef2ea] pb-3 last:border-none last:pb-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f7e9] text-[#4b6d2c]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-[72px] text-[11px] uppercase tracking-[0.15em] text-[#6a7f55]">
        {label}
      </div>
      <div className="text-[14px] font-medium text-[#2f4a19]">{value}</div>
    </div>
  );
}

// Sub-komponen kartu widget cuaca
function WeatherCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#e7efe0] bg-[#f4f9ee] px-3 py-3">
      <Icon className="mx-auto h-4 w-4 text-[#4b6d2c]" aria-hidden="true" />
      <div className="mt-2 text-[12px] font-semibold text-[#2f4a19]">{value}</div>
      <div className="text-[11px] text-[#6a7f55]">{label}</div>
    </div>
  );
}
