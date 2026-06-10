"use client";

// Import library, hooks kustom, ikon Lucide, dan komponen header global
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import { useSession } from "@clerk/nextjs";

// Fungsi pembantu untuk membuat header otorisasi API menggunakan token dari Clerk session
async function createAuthHeaders(session: ReturnType<typeof useSession>["session"]) {
  const token = await session?.getToken().catch(() => null);
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Varian animasi Framer Motion untuk transisi transisi masuk
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

// Aset Gambar Latar Belakang Kartu Dan Default Komoditas
const imgRice2 = "/padi.png";
const imgDownload41 = "/jagung.png";
const imgPadiPraktikum = "/bawang.png";
const imgHistoryImage = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800&auto=format&fit=crop";
const imgLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";
const imgProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

// Map ilustrasi gambar berdasarkan jenis tanaman
const plantImages: { [key: string]: string } = {
  padi: imgRice2,
  jagung: imgDownload41,
  bawang: imgPadiPraktikum,
};

// Komponen utama halaman Riwayat Pengamatan (History)
export default function History() {
  // State management untuk menyimpan tracker, status loading, dan Clerk user
  const { user, isLoading } = useUser();
  const [trackers, setTrackers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const displayName = !isLoading && user ? user.name : "Guest";
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();
  const userId = user?.id;
  const { session } = useSession();

  // Effect untuk memuat riwayat tracker lahan milik user dari API
  useEffect(() => {
    if (isLoading || !userId) {
      if (!isLoading) setLoading(false);
      return;
    }

    const fetchTrackers = async () => {
      try {
        const response = await fetch("/api/observation/history", {
          headers: await createAuthHeaders(session),
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || "Gagal memuat tracker");
        
        setTrackers(result.trackers || []);
      } catch (error) {
        console.error("Error fetching trackers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackers();
  }, [userId, isLoading]);

  // Fungsi pembantu untuk memformat nama label tanaman
  const getPlantLabel = (plantType: string) => {
    switch (plantType) {
      case "jagung":
        return "Jagung";
      case "bawang":
        return "Bawang Merah";
      default:
        return "Padi";
    }
  };

  // Fungsi pembantu untuk mencocokkan gambar ilustrasi tanaman
  const getPlantImage = (plantType: string) => {
    return plantImages[plantType] || imgRice2;
  };

  // Handler kustom untuk menampilkan pop-up konfirmasi toast sebelum menghapus
  const confirmAction = (message: string, onConfirm: () => void) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-semibold text-gray-800 text-sm">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Batal
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
          >
            Hapus
          </button>
        </div>
      </div>
    ), { duration: Infinity, id: `confirm-${Date.now()}` });
  };

  // Handler untuk memicu penghapusan data tracker beserta relasinya via API
  const handleDeleteTracker = (trackerId: string) => {
    confirmAction("Apakah Anda yakin ingin menghapus tracker ini? Data yang terhubung juga akan ikut terhapus.", async () => {
      setDeleting(trackerId);
      try {
        const response = await fetch(`/api/observation/history?trackerId=${encodeURIComponent(trackerId)}`, {
          method: "DELETE",
          headers: await createAuthHeaders(session),
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || "Gagal menghapus tracker");

        // Perbarui UI dengan menyaring tracker yang telah terhapus
        setTrackers((prev) => prev.filter(t => t.id !== trackerId));
        toast.success("Tracker berhasil dihapus", { id: "Tracker berhasil dihapus" });
      } catch (error) {
        console.error("Error deleting tracker:", error);
        toast.error("Gagal menghapus tracker", { id: "Gagal menghapus tracker" });
      } finally {
        setDeleting(null);
      }
    });
  };

  return (
    // Return JSX untuk merender UI Halaman Riwayat Pengamatan (History)
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      {/* Header */}
      <GlobalHeader variant="light" />

      {/* Konten Utama */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 sm:gap-8 px-4 sm:px-5 pb-10 sm:pb-12 pt-4 sm:pt-6 md:px-10 lg:px-14 lg:pt-8"
      >
        {/* Banner Hero Riwayat */}
        <motion.article variants={fadeUpVariant} className="rounded-[20px] sm:rounded-[30px] bg-white p-4 sm:p-5 md:p-6 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:gap-8">
            <div className="h-[150px] sm:h-[190px] w-full overflow-hidden rounded-[16px] sm:rounded-[20px] md:h-[273px] md:max-w-[605px]">
              <img alt="History" loading="lazy" className="h-full w-full object-cover" src={imgHistoryImage} />
            </div>

            <div className="w-full md:max-w-[578px]">
              <h1 className="text-[32px] sm:text-[42px] font-extrabold leading-[1.05] text-[#365a1a] lg:text-[60px]">
                History
              </h1>
              <p className="mt-2 sm:mt-3 text-[13px] sm:text-[15px] font-medium leading-[1.35] text-[#365a1a] lg:text-[18px]">
                Menyediakan gambaran menyeluruh untuk setiap aktivitas pengamatan pada sawah, ladang, maupun tanaman yang sedang dibudidayakan, sehingga pengguna dapat memantau kondisi secara lebih terstruktur dan terorganisir.
              </p>
            </div>
          </div>
        </motion.article>

        {/* Panel Riwayat Lahan Pengguna (Menampilkan daftar kartu atau pesan kosong) */}
        <motion.div variants={fadeUpVariant} className="rounded-[20px] sm:rounded-[30px] bg-white p-4 sm:p-6 md:p-8 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-[24px] sm:text-[32px] font-bold md:text-[40px]">Ringkasan Lahan Anda</h2>

          {loading ? (
            <div className="mt-6 flex items-center justify-center py-8 sm:py-12">
              <p className="text-base sm:text-lg text-gray-600">Loading...</p>
            </div>
          ) : trackers.length === 0 ? (
            <div className="mt-6 rounded-lg bg-gray-50 p-6 sm:p-12 text-center">
              <p className="text-base sm:text-lg font-medium text-gray-600 mb-3 sm:mb-4">Belum ada lahan yang terdaftar</p>
              <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Mulai dengan membuat Growth Tracker pertama Anda</p>
              <Link
                href="/dashboard"
                className="inline-block rounded-full bg-[#365a1a] px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-[#2d4915]"
              >
                Buat Tracker Baru
              </Link>
            </div>
          ) : (
            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              {trackers.map((tracker) => (
                <div
                  key={tracker.id}
                  className="flex flex-col gap-4 sm:gap-5 rounded-[20px] sm:rounded-[25px] border-2 border-[#365a1a] p-4 sm:p-5 md:flex-row md:items-center md:gap-6 lg:p-6"
                >
                  {/* Gambar Mini Ilustrasi Tanaman Lahan */}
                  <div className="h-[120px] sm:h-[150px] w-full overflow-hidden rounded-[16px] sm:rounded-[20px] md:h-[180px] md:w-[240px] md:flex-shrink-0">
                    <img
                      alt={tracker.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      src={getPlantImage(tracker.plant_type)}
                    />
                  </div>

                  {/* Informasi Detail Lahan */}
                  <div className="flex-1">
                    <h3 className="text-[20px] sm:text-[24px] font-bold text-[#365a1a] md:text-[28px]">
                      {tracker.title}
                    </h3>
                    <p className="mt-1 text-[12px] sm:text-[14px] text-[#365a1a]/70">
                      Jenis tanaman: {getPlantLabel(tracker.plant_type)}
                    </p>

                    <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] sm:text-[13px] font-semibold text-[#365a1a]/60">Dibuat</p>
                        <p className="text-[14px] sm:text-[16px] font-bold text-[#365a1a]">
                          {new Date(tracker.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-[13px] font-semibold text-[#365a1a]/60">Status</p>
                        <p className="text-[14px] sm:text-[16px] font-bold text-green-600">Aktif</p>
                      </div>
                    </div>

                    {/* Tombol pintas navigasi detail and tombol hapus */}
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                      <p className="text-[12px] sm:text-[14px] font-semibold text-[#365a1a]">
                        ID: <span className="font-mono text-[11px] sm:text-[12px]">{tracker.id.substring(0, 8)}...</span>
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <Link
                          href={`/observation/${tracker.plant_type}/history?trackerId=${tracker.id}`}
                          replace
                          className="rounded-full bg-[#365a1a] px-3 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold text-white transition hover:bg-[#2d4915] text-center"
                        >
                          Lihat Detail →
                        </Link>
                        <button
                          onClick={() => handleDeleteTracker(tracker.id)}
                          disabled={deleting === tracker.id}
                          className="flex items-center justify-center gap-1 sm:gap-2 rounded-full bg-red-500 px-3 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Hapus tracker"
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">{deleting === tracker.id ? "Menghapus..." : "Hapus"}</span>
                          <span className="sm:hidden">{deleting === tracker.id ? "..." : "X"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.section>
    </main>
  );
}
