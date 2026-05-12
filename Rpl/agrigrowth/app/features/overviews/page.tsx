"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { clearUser } from "@/lib/auth";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";

const imgRice2 = "https://www.figma.com/api/mcp/asset/2d7af9f5-776e-41f7-851d-32ef06f4449b";
const imgDownload41 = "https://www.figma.com/api/mcp/asset/d97cf4c8-1d28-42b7-b2d3-6398d7fe15a0";
const imgPadiPraktikum = "https://www.figma.com/api/mcp/asset/f5e4867b-98ce-4c79-8726-44f31b684eb1";
const imgOverviewImage = "https://www.figma.com/api/mcp/asset/c54148b2-7c65-4659-a5fa-527677b9aead";
const imgLogo = "https://www.figma.com/api/mcp/asset/90530aab-9c02-498f-97a0-e57018497d3e";
const imgProfile = "https://www.figma.com/api/mcp/asset/03caec6e-0209-4de6-a510-5e7ebeb6fffd";

const plantImages: { [key: string]: string } = {
  padi: imgRice2,
  jagung: imgDownload41,
  bawang: imgPadiPraktikum,
};

export default function Overviews() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [trackers, setTrackers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const displayName = !isLoading && user ? user.name : "Guest";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearUser();
      router.push("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  useEffect(() => {
    if (isLoading || !user) {
      if (!isLoading) setLoading(false);
      return;
    }

    const fetchTrackers = async () => {
      try {
        const { data, error } = await supabase
          .from("trackers")
          .select("*")
          .eq("user_id", user.id)
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
  }, [user, isLoading]);

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
      toast.success("Tracker berhasil dihapus");
    } catch (error) {
      console.error("Error deleting tracker:", error);
      toast.error("Gagal menghapus tracker");
    } finally {
      setDeleting(null);
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
                <span>{displayName}</span>
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
              <img alt="Overviews" className="h-full w-full object-cover" src={imgOverviewImage} />
            </div>

            <div className="w-full md:max-w-[578px]">
              <h1 className="text-[42px] font-extrabold leading-[1.05] text-[#365a1a] lg:text-[60px]">
                Overviews
              </h1>
              <p className="mt-3 text-[15px] font-medium leading-[1.35] text-[#365a1a] lg:text-[18px]">
                Menyediakan gambaran menyeluruh untuk setiap aktivitas pengamatan pada sawah, ladang, maupun tanaman yang sedang dibudidayakan, sehingga pengguna dapat memantau kondisi secara lebih terstruktur dan terorganisir.
              </p>
            </div>
          </div>
        </article>

        {/* Overview Cards or Empty State */}
        <div className="rounded-[30px] bg-white p-6 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)] sm:p-8">
          <h2 className="text-[32px] font-bold sm:text-[40px]">Ringkasan Lahan Anda</h2>

          {loading ? (
            <div className="mt-6 flex items-center justify-center py-12">
              <p className="text-lg text-gray-600">Loading...</p>
            </div>
          ) : trackers.length === 0 ? (
            <div className="mt-6 rounded-lg bg-gray-50 p-12 text-center">
              <p className="text-lg font-medium text-gray-600 mb-4">Belum ada lahan yang terdaftar</p>
              <p className="text-gray-500 mb-6">Mulai dengan membuat Growth Tracker pertama Anda</p>
              <Link
                href="/dashboard"
                className="inline-block rounded-full bg-[#365a1a] px-8 py-3 font-semibold text-white transition hover:bg-[#2d4915]"
              >
                Buat Tracker Baru
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {trackers.map((tracker) => (
                <div
                  key={tracker.id}
                  className="flex flex-col gap-5 rounded-[25px] border-2 border-[#365a1a] p-5 md:flex-row md:items-center md:gap-6 lg:p-6"
                >
                  {/* Image */}
                  <div className="h-[150px] w-full overflow-hidden rounded-[20px] md:h-[180px] md:w-[240px] md:flex-shrink-0">
                    <img
                      alt={tracker.title}
                      className="h-full w-full object-cover"
                      src={getPlantImage(tracker.plant_type)}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-[24px] font-bold text-[#365a1a] sm:text-[28px]">
                      {tracker.title}
                    </h3>
                    <p className="mt-1 text-[14px] text-[#365a1a]/70">
                      Jenis tanaman: {getPlantLabel(tracker.plant_type)}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[13px] font-semibold text-[#365a1a]/60">Dibuat</p>
                        <p className="text-[16px] font-bold text-[#365a1a]">
                          {new Date(tracker.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#365a1a]/60">Status</p>
                        <p className="text-[16px] font-bold text-green-600">Aktif</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-[#365a1a]">
                        ID: <span className="font-mono text-[12px]">{tracker.id.substring(0, 8)}...</span>
                      </p>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/observation/${tracker.plant_type}/history?trackerId=${tracker.id}`}
                          className="rounded-full bg-[#365a1a] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#2d4915]"
                        >
                          Lihat Detail →
                        </Link>
                        <button
                          onClick={() => handleDeleteTracker(tracker.id)}
                          disabled={deleting === tracker.id}
                          className="flex items-center gap-2 rounded-full bg-red-500 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Hapus tracker"
                        >
                          <Trash2 size={16} />
                          {deleting === tracker.id ? "Menghapus..." : "Hapus"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
