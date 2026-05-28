"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
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

const imgRice2 = "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?q=80&w=800&auto=format&fit=crop";
const imgDownload41 = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800&auto=format&fit=crop";
const imgPadiPraktikum = "https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?q=80&w=800&auto=format&fit=crop";
const imgHistoryImage = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800&auto=format&fit=crop";
const imgLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";
const imgProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

const plantImages: { [key: string]: string } = {
  padi: imgRice2,
  jagung: imgDownload41,
  bawang: imgPadiPraktikum,
};

export default function History() {
  const { user, isLoading } = useUser();
  const [trackers, setTrackers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const displayName = !isLoading && user ? user.name : "Guest";
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();
  const userId = user?.id;

  useEffect(() => {
    if (isLoading || !userId) {
      if (!isLoading) setLoading(false);
      return;
    }

    const fetchTrackers = async () => {
      try {
        const { data, error } = await supabase
          .from("trackers")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTrackers(data || []);
      } catch (error) {
        console.error("Error fetching trackers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackers();
  }, [userId, isLoading]);

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

  const getPlantImage = (plantType: string) => {
    return plantImages[plantType] || imgRice2;
  };

  const handleDeleteTracker = async (trackerId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus tracker ini? Data yang terhubung juga akan ikut terhapus.")) {
      return;
    }

    setDeleting(trackerId);
    try {
      const { error } = await supabase
        .from("trackers")
        .delete()
        .eq("id", trackerId);

      if (error) throw error;

      // Update UI by removing the deleted tracker
      setTrackers(trackers.filter(t => t.id !== trackerId));
      toast.success("Tracker berhasil dihapus", { id: "Tracker berhasil dihapus" });
    } catch (error) {
      console.error("Error deleting tracker:", error);
      toast.error("Gagal menghapus tracker", { id: "Gagal menghapus tracker" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      {/* Header */}
      <header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
          <img alt="Agrigrowth logo" loading="lazy" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
          <b className="text-[20px] leading-none sm:text-[21px]">Agrigrowth Monitor</b>
        </Link>

        <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-10 text-[21px] font-bold lg:flex">
          <Link href="/" className="hover:opacity-80 transition">
            Home
          </Link>
          <Link href="/about" className="hover:opacity-80 transition">
            About
          </Link>
          <Link href="/growth-tracker" className="hover:opacity-80 transition">
            Growth Tracker
          </Link>
          <Link href="/weather" className="hover:opacity-80 transition">
            Weather
          </Link>
          <Link href="/history" className="hover:opacity-80 transition">
            History
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

        {/* History Cards or Empty State */}
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
                  {/* Image */}
                  <div className="h-[120px] sm:h-[150px] w-full overflow-hidden rounded-[16px] sm:rounded-[20px] md:h-[180px] md:w-[240px] md:flex-shrink-0">
                    <img
                      alt={tracker.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      src={getPlantImage(tracker.plant_type)}
                    />
                  </div>

                  {/* Info */}
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
