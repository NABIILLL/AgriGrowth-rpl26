"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import { UserButton } from "@clerk/nextjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";
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

const imgLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";
const imgProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

interface TrackerData {
  id: string;
  title: string;
  plant_type: string;
  user_id: string;
  created_at: string;
}

export default function ObservationHistory() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const trackerIdFromQuery = searchParams.get("trackerId");
  const { user, isLoading } = useUser();
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();
  const [trackers, setTrackers] = useState<TrackerData[]>([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [logsRaw, setLogsRaw] = useState<any[]>([]);
  const [trackerTitle, setTrackerTitle] = useState("Tanaman");
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<any | null>(null);
  
  // Cost Management State
  const [activeTab, setActiveTab] = useState<"pengamatan" | "biaya">("pengamatan");
  const [costs, setCosts] = useState<any[]>([]);
  const [editingCost, setEditingCost] = useState<any | null>(null);
  const [showCostForm, setShowCostForm] = useState(false);
  
  // Analysis stats
  const [stats, setStats] = useState({
    startHeight: 0,
    endHeight: 0,
    startLeaf: 0,
    endLeaf: 0,
    daysSpan: 0,
    avgHeightGrowth: 0,
    avgLeafGrowth: 0
  });
  const userId = user?.id;
  const [isExporting, setIsExporting] = useState(false);

  // Fetch list of trackers first
  useEffect(() => {
    async function fetchTrackers() {
      if (!id || isLoading || !userId) {
        if (!isLoading) setLoading(false);
        return;
      }
      
      try {
        const typeLabel = id === "jagung" ? "Jagung" : id === "bawang" ? "Bawang Merah" : "Padi";
        setTrackerTitle(typeLabel);

        // Fetch all distinct trackers for this plant type
        const { data, error } = await supabase
          .from("trackers")
          .select("id, title, plant_type, user_id, created_at")
          .eq("plant_type", id)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        const fetchedTrackers = data || [];
        setTrackers(fetchedTrackers);

        if (trackerIdFromQuery) {
          const isTrackerOwned = fetchedTrackers.some((tracker) => tracker.id === trackerIdFromQuery);
          if (isTrackerOwned) {
            setSelectedTrackerId(trackerIdFromQuery);
          }
        }
      } catch (error) {
        console.error("Error fetching trackers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrackers();
  }, [id, userId, isLoading, trackerIdFromQuery]);

  // Fetch chart/logs data when tracker is selected
  useEffect(() => {
    async function fetchLogs() {
      if (!selectedTrackerId || !userId) return;

      try {
        const { data: logsData, error } = await supabase
          .from("growth_logs")
          .select("*")
          .eq("tracker_id", selectedTrackerId)
          .order("day_number", { ascending: true });

        if (error) throw error;

        const logs = logsData || [];
        setLogsRaw(logs);

        if (logs.length > 0) {
          const data = logs.map((log: any) => ({
            day: `Hari ${log.day_number}`,
            dayNumber: log.day_number,
            height: log.plant_height || 0,
            leaf: log.leaf_count || 0,
          }));

          setChartData(data);

          const first = data[0];
          const last = data[data.length - 1];
          const daysSpan = last.dayNumber - first.dayNumber || 1;

          const newStats = {
            startHeight: first.height,
            endHeight: last.height,
            startLeaf: first.leaf,
            endLeaf: last.leaf,
            daysSpan,
            avgHeightGrowth: (last.height - first.height) / daysSpan,
            avgLeafGrowth: (last.leaf - first.leaf) / daysSpan
          };
          setStats(newStats);
        } else {
          setChartData([]);
          setStats({ startHeight: 0, endHeight: 0, startLeaf: 0, endLeaf: 0, daysSpan: 0, avgHeightGrowth: 0, avgLeafGrowth: 0 });
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    }
    fetchLogs();
  }, [selectedTrackerId, userId]);

  // Helper to reload logs (used after edit/delete)
  async function reloadLogs() {
    if (!selectedTrackerId || !userId) return;
    try {
      const { data: logsData, error } = await supabase
        .from("growth_logs")
        .select("*")
        .eq("tracker_id", selectedTrackerId)
        .order("day_number", { ascending: true });

      if (error) throw error;

      const logs = logsData || [];
      setLogsRaw(logs);

      if (logs.length > 0) {
        const data = logs.map((log: any) => ({
          day: `Hari ${log.day_number}`,
          dayNumber: log.day_number,
          height: log.plant_height || 0,
          leaf: log.leaf_count || 0,
        }));

        setChartData(data);

        const first = data[0];
        const last = data[data.length - 1];
        const daysSpan = last.dayNumber - first.dayNumber || 1;

        const newStats = {
          startHeight: first.height,
          endHeight: last.height,
          startLeaf: first.leaf,
          endLeaf: last.leaf,
          daysSpan,
          avgHeightGrowth: (last.height - first.height) / daysSpan,
          avgLeafGrowth: (last.leaf - first.leaf) / daysSpan
        };
        setStats(newStats);
      } else {
        setChartData([]);
        setStats({ startHeight: 0, endHeight: 0, startLeaf: 0, endLeaf: 0, daysSpan: 0, avgHeightGrowth: 0, avgLeafGrowth: 0 });
      }
    } catch (err) {
      console.error("Error reloading logs:", err);
      toast.error("Gagal memuat ulang data", { id: "Gagal memuat ulang data" });
    }
  }

  // Delete a log entry
  async function handleDeleteLog(logId: string) {
    if (!confirm("Hapus data pengamatan ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      // Optimistic UI update: remove locally immediately
      setLogsRaw((prev) => prev.filter((l) => String(l.id) !== String(logId)));

      // Send delete request. Include tracker_id to match RLS policies if present.
      const query = supabase.from("growth_logs").delete().eq("id", logId);
      if (selectedTrackerId) query.eq("tracker_id", selectedTrackerId);

      const { data, error } = await query.select();
      console.log('delete result', { data, error });

      if (error) {
        // revert optimistic removal on failure
        await reloadLogs();
        console.error("Error deleting log:", error);
        toast.error(`Gagal menghapus data: ${error.message || "unknown"}`, { id: `Gagal menghapus data: ${error.message || "unknown"}` });
        return;
      }

      // Success
      toast.success("Data pengamatan berhasil dihapus", { id: "Data pengamatan berhasil dihapus" });
      // ensure UI consistent
      await reloadLogs();
    } catch (err: any) {
      console.error("Error deleting log (unexpected):", err);
      toast.error(`Gagal menghapus data: ${err?.message ?? "unknown"}`, { id: `Gagal menghapus data: ${err?.message ?? "unknown"}` });
      await reloadLogs();
    }
  }

  // Update a log entry
  async function handleUpdateLog(updated: any) {
    try {
      const payload: any = {
        day_number: parseInt(String(updated.day_number)),
        plant_height: parseFloat(String(updated.plant_height)),
        leaf_count: parseInt(String(updated.leaf_count)),
        branch_count: updated.branch_count ? parseInt(String(updated.branch_count)) : 0,
        soil_ph: parseFloat(String(updated.soil_ph || 7)),
        light_condition: updated.light_condition || "",
        plant_condition: updated.plant_condition || "",
        fertilizer_type: updated.fertilizer_type || "",
        land_area: updated.land_area ? parseFloat(String(updated.land_area)) : 1,
      };

      const { error } = await supabase.from("growth_logs").update(payload).eq("id", updated.id);
      if (error) throw error;

      toast.success("Data pengamatan berhasil diperbarui", { id: "Data pengamatan berhasil diperbarui" });
      setEditingLog(null);
      await reloadLogs();
    } catch (err: any) {
      console.error("Error updating log:", err);
      toast.error(`Gagal memperbarui data: ${err?.message ?? "unknown"}`, { id: `Gagal memperbarui data: ${err?.message ?? "unknown"}` });
    }
  }

  // Reload Costs
  async function reloadCosts() {
    if (!selectedTrackerId || !userId) return;
    try {
      const { data, error } = await supabase
        .from("production_costs")
        .select("*")
        .eq("tracker_id", selectedTrackerId)
        .order("date", { ascending: false });
      
      if (error) {
        // If table doesn't exist yet, just ignore or log
        console.error("Error loading costs (maybe table not created?):", error);
        return;
      }
      setCosts(data || []);
    } catch (err) {
      console.error("Failed to load costs", err);
    }
  }

  // Effect to load costs when tracker selected
  useEffect(() => {
    reloadCosts();
  }, [selectedTrackerId, userId]);

  // Handle Save Cost
  async function handleSaveCost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTrackerId) return;
    
    const formData = new FormData(e.currentTarget);
    const costData = {
      tracker_id: selectedTrackerId,
      date: formData.get("date") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
    };

    try {
      if (editingCost) {
        const { error } = await supabase.from("production_costs").update(costData).eq("id", editingCost.id);
        if (error) throw error;
        toast.success("Biaya berhasil diperbarui", { id: "Biaya berhasil diperbarui" });
      } else {
        const { error } = await supabase.from("production_costs").insert(costData);
        if (error) throw error;
        toast.success("Biaya berhasil ditambahkan", { id: "Biaya berhasil ditambahkan" });
      }
      setShowCostForm(false);
      setEditingCost(null);
      reloadCosts();
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menyimpan biaya: " + err.message, { id: "Gagal menyimpan biaya: " + err.message });
    }
  }

  // Delete Cost
  async function handleDeleteCost(id: string) {
    if (!confirm("Hapus data biaya ini?")) return;
    try {
      const { error } = await supabase.from("production_costs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Biaya dihapus", { id: "Biaya dihapus" });
      reloadCosts();
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menghapus biaya", { id: "Gagal menghapus biaya" });
    }
  }

  // Cost categories
  const costCategories = [
    "Bibit", "Pupuk", "Obat-obatan/Pestisida", "Tenaga Kerja", "Sewa Alat", "Transportasi", "Lain-lain"
  ];

  // Calculate Total Costs
  const totalCost = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
  const costByCategory = costs.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + Number(cost.amount);
    return acc;
  }, {} as Record<string, number>);

  // Predictions component (simple heuristic)
  function PredictionsSection({ plantType, avgHeightGrowth, currentHeight, latestLog }: any) {
    const defaults: any = {
      padi: { maturityHeight: 100, ratesPerHa: { N: 150, P: 50, K: 50 } },
      jagung: { maturityHeight: 250, ratesPerHa: { N: 200, P: 60, K: 80 } },
      bawang: { maturityHeight: 50, ratesPerHa: { N: 120, P: 40, K: 60 } },
    };

    const key = plantType === "jagung" ? "jagung" : plantType === "bawang" ? "bawang" : "padi";
    const cfg = defaults[key] || defaults.padi;

    let daysToMaturity: number | null = null;
    let predictedDate: string | null = null;
    if (avgHeightGrowth > 0) {
      daysToMaturity = Math.ceil((cfg.maturityHeight - (currentHeight || 0)) / avgHeightGrowth);
      if (daysToMaturity < 0) daysToMaturity = 0;
      const d = new Date();
      d.setDate(d.getDate() + daysToMaturity);
      predictedDate = d.toLocaleDateString('id-ID');
    }

    // land area from latestLog if available (stored in hectares in the form)
    const landArea = latestLog?.land_area || 1;
    const fertilizer = Object.fromEntries(Object.entries(cfg.ratesPerHa).map(([k, v]) => [k, ((v as number) * landArea).toFixed(1)]));

    return (
      <div>
        <p className="text-sm text-[#365a1a]/80 mb-2">Estimasi sederhana berdasarkan rata-rata pertumbuhan tinggi tanaman.</p>
        {daysToMaturity === null || !predictedDate ? (
          <p className="text-sm text-red-600">Belum cukup data untuk memprediksi panen. Tambah minimal dua titik pengamatan dengan nilai tinggi.</p>
        ) : (
          <div className="space-y-2">
            <p className="font-semibold">Perkiraan hari hingga panen: {daysToMaturity} hari</p>
            <p className="text-sm text-gray-700">Perkiraan tanggal panen: {predictedDate} (estimasi)</p>
            <div className="mt-3">
              <h4 className="font-semibold">Rekomendasi pupuk untuk luas lahan {landArea} ha</h4>
              <ul className="text-sm text-[#365a1a]/80">
                {Object.entries(fertilizer).map(([nutrient, qty]) => (
                  <li key={nutrient}>• {nutrient}: {qty} kg</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-gray-500">Catatan: Angka di atas adalah estimasi dasar. Sesuaikan dengan kondisi lapang dan rekomendasi teknis setempat.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  async function handleExportPDF() {
    if (!userId) {
      toast.error("Anda harus login untuk export PDF", { id: "Anda harus login untuk export PDF" });
      return;
    }
    const element = document.getElementById("pdf-content");
    if (!element) {
      toast.error("Tidak ada konten untuk di-export", { id: "Tidak ada konten untuk di-export" });
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Menyiapkan dan mengunggah PDF...");

    try {
      // Use toJpeg to reduce file size (quality 0.8 is usually a good balance)
      const dataUrl = await htmlToImage.toJpeg(element, { 
        quality: 0.8, 
        pixelRatio: 1.5,
        backgroundColor: '#f4f4f4', // to ensure no black backgrounds on transparent areas
      });
      
      const pdfWidth = 210; // A4 width in mm
      // Calculate dynamic height based on the full scrollHeight of the container
      const pdfHeight = (element.scrollHeight * pdfWidth) / element.scrollWidth;
      
      // Create a PDF with a custom height so it fits exactly one long continuous page
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output("blob");

      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const dateStr = `${dd}${mm}${yy}`;
      const baseFileName = `Laporan_${trackerTitle}_${dateStr}.pdf`;
      const fileName = `${userId}/${baseFileName}`;
      
      const { data, error } = await supabase
        .storage
        .from("agrigrowthpdf")
        .upload(fileName, pdfBlob, {
          contentType: "application/pdf",
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Automatically download the file to the user's device
      pdf.save(baseFileName);

      toast.success("PDF berhasil diunduh dan disimpan!", { id: toastId });
    } catch (err: any) {
      console.error("Export PDF Error:", err);
      toast.error(`Gagal menyimpan PDF: ${err.message}`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      {/* Header */}
      <header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 hover:opacity-80 transition">
          <img alt="Agrigrowth logo" loading="lazy" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
          <b className="text-[20px] leading-none sm:text-[21px]">Agrigrowth Monitor</b>
        </Link>

        <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-10 text-[21px] font-bold lg:flex">
          <Link href={user ? "/dashboard" : "/"} className="transition hover:opacity-80">
            Home
          </Link>
          <Link href="/about" className="transition hover:opacity-80">
            About
          </Link>
          <Link href="/wireframe4" className="transition hover:opacity-80">
            Features
          </Link>
        </nav>

        {!isLoading && user ? (
          <div className="flex items-center gap-4"><UserButton showName={true} appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 shadow-md" } }} /></div>
        ) : null}
      </header>

      {/* Content */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-[1440px] px-3 sm:px-5 pb-10 sm:pb-12 md:px-10 lg:px-14"
      >
        <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mt-2 sm:mt-4">
          <h1 className="text-lg sm:text-2xl md:text-4xl lg:text-[58px] font-extrabold leading-[1.08] text-[#365a1a]">
            Monitoring Grafik {trackerTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/observation/form"
              className="rounded-full bg-[#365a1a] px-3 sm:px-6 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-bold text-white shadow-md hover:bg-[#2d4915] hover:shadow-lg transition"
            >
              ➕ Input
            </Link>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting || !selectedTrackerId || chartData.length === 0}
              className="rounded-full bg-white px-3 sm:px-6 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-bold shadow-md border border-[#365a1a]/20 hover:bg-gray-50 hover:shadow-lg transition disabled:opacity-50"
            >
              {isExporting ? "..." : "📥 Export"}
            </button>
            <button className="rounded-full bg-white px-3 sm:px-6 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-bold shadow-md border border-[#365a1a]/20 hover:bg-gray-50 hover:shadow-lg transition">
              📤
            </button>
          </div>
        </motion.div>

        <div id="pdf-content" className="mt-6 sm:mt-10 p-2 sm:p-4 bg-[#f4f4f4]">
          {loading ? (
            <motion.div variants={fadeUpVariant} className="flex flex-col items-center justify-center rounded-[20px] bg-white py-12 sm:py-16 px-4 sm:px-6 text-center shadow-sm border border-gray-100">
              <div className="h-8 sm:h-10 w-8 sm:w-10 animate-spin rounded-full border-4 border-[#365a1a] border-t-transparent"></div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#365a1a] font-medium">Memuat data lahan...</p>
            </motion.div>
          ) : trackers.length === 0 ? (
            <motion.div variants={fadeUpVariant} className="flex flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-[#9fb08d] bg-white py-16 sm:py-24 px-4 sm:px-6 text-center">
              <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-[#f0f4eb] mb-4 sm:mb-6">
                <span className="text-3xl sm:text-5xl">🚜</span>
              </div>
              <h3 className="text-[20px] sm:text-[24px] font-bold text-[#365a1a]">Belum Ada Data Lahan</h3>
              <p className="mt-2 sm:mt-3 text-[14px] sm:text-[16px] text-[#365a1a]/70 max-w-md">
                Anda belum membuat tracker lahan untuk {trackerTitle}. Buat tracker dan mulai input data pengamatan.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 sm:mt-6 inline-block rounded-full bg-[#365a1a] px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#2d4915] transition"
              >
                Buat Tracker Lahan
              </Link>
            </motion.div>
          ) : !selectedTrackerId ? (
            <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-4 sm:p-8 shadow-sm">
              <h2 className="mb-4 sm:mb-6 text-[20px] font-bold sm:text-[28px]">🌾 Pilih Lahan yang Ingin Dimonitor</h2>
              <p className="text-[13px] sm:text-base text-[#365a1a]/70 mb-4 sm:mb-6">Anda memiliki {trackers.length} lahan yang telah dicatat untuk {trackerTitle}:</p>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {trackers.map((tracker) => (
                  <button
                    key={tracker.id}
                    onClick={() => setSelectedTrackerId(tracker.id)}
                    className="p-3 sm:p-4 rounded-[16px] border-2 border-[#365a1a] bg-gradient-to-br from-[#f0f4eb] to-white hover:bg-[#e8ede0] hover:shadow-md transition text-left"
                  >
                    <h3 className="font-bold text-[16px] sm:text-[18px] text-[#365a1a] mb-1 sm:mb-2">{tracker.title}</h3>
                    <p className="text-xs sm:text-sm text-[#365a1a]/60">
                      Dibuat: {new Date(tracker.created_at).toLocaleDateString('id-ID', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : chartData.length > 0 ? (
            <div className="space-y-6 sm:space-y-8">
              <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between rounded-[16px] bg-[#f0f4eb] p-3 sm:p-4 border-l-4 border-[#365a1a] gap-3 sm:gap-4">
                <div>
                  <p className="text-[11px] sm:text-sm text-[#365a1a]/70">Lahan yang dipilih:</p>
                  <p className="text-[16px] sm:text-[20px] font-bold text-[#365a1a]">{trackers.find(t => t.id === selectedTrackerId)?.title}</p>
                </div>
                <button
                  onClick={() => setSelectedTrackerId(null)}
                  className="rounded-full bg-[#365a1a] text-white px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold hover:bg-[#2d4915] transition"
                >
                  ← Kembali ke Daftar
                </button>
              </motion.div>

              {/* Tabs */}
              <motion.div variants={fadeUpVariant} className="flex gap-3 sm:gap-4 border-b-2 border-gray-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("pengamatan")}
                  className={`pb-2 text-[14px] sm:text-[18px] font-bold transition-all whitespace-nowrap ${
                    activeTab === "pengamatan" 
                      ? "border-b-4 border-[#365a1a] text-[#365a1a]" 
                      : "text-gray-400 hover:text-[#365a1a]"
                  }`}
                >
                  📈 Pengamatan & Analisis
                </button>
                <button
                  onClick={() => setActiveTab("biaya")}
                  className={`pb-2 text-[14px] sm:text-[18px] font-bold transition-all whitespace-nowrap ${
                    activeTab === "biaya" 
                      ? "border-b-4 border-[#365a1a] text-[#365a1a]" 
                      : "text-gray-400 hover:text-[#365a1a]"
                  }`}
                >
                  💰 Pengelolaan Biaya
                </button>
              </motion.div>
              
              {activeTab === "pengamatan" && (
                <>
              {/* Grafik Tinggi Tanaman */}
              <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-3 sm:p-4 md:p-6 shadow-sm overflow-hidden">
                <h2 className="mb-3 sm:mb-4 md:mb-6 text-[18px] sm:text-[20px] font-bold md:text-[24px]">📊 GRAFIK TINGGI TANAMAN</h2>
                <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#365a1a', fontSize: 11 }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#365a1a', fontSize: 11 }} dx={-10} unit=" cm" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#365a1a' }}
                      />
                      <Line type="monotone" dataKey="height" name="Tinggi Tanaman" stroke="#365a1a" strokeWidth={3} dot={{ r: 4, fill: '#365a1a', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 sm:mt-4 md:mt-6 border-t border-gray-100 pt-3 sm:pt-4">
                  <p className="text-[13px] sm:text-[16px] font-semibold text-[#365a1a]">Tren: {stats.avgHeightGrowth >= 0 ? '↑ Meningkat' : '↓ Menurun'} ({stats.avgHeightGrowth.toFixed(2)} cm/hari)</p>
                  <p className="text-[12px] sm:text-[14px] text-gray-600">Total tinggi terakhir: {stats.endHeight} cm</p>
                </div>
              </motion.div>

              {/* Grafik Jumlah Daun */}
              <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-3 sm:p-4 md:p-6 shadow-sm overflow-hidden">
                <h2 className="mb-3 sm:mb-4 md:mb-6 text-[18px] sm:text-[20px] font-bold md:text-[24px]">📊 GRAFIK JUMLAH DAUN</h2>
                <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#365a1a', fontSize: 11 }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#365a1a', fontSize: 11 }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#365a1a' }}
                      />
                      <Line type="monotone" dataKey="leaf" name="Jumlah Daun" stroke="#61ae25" strokeWidth={3} dot={{ r: 4, fill: '#61ae25', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 sm:mt-4 md:mt-6 border-t border-gray-100 pt-3 sm:pt-4">
                  <p className="text-[13px] sm:text-[16px] font-semibold text-[#365a1a]">Tren: {stats.avgLeafGrowth >= 0 ? '↑ Bertambah' : '↓ Berkurang'} ({stats.avgLeafGrowth.toFixed(2)} daun/hari)</p>
                  <p className="text-[12px] sm:text-[14px] text-gray-600">Total daun terakhir: {stats.endLeaf} helai</p>
                </div>
              </motion.div>

              {/* Analisis Pertumbuhan */}
              <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-3 sm:p-4 md:p-6 shadow-sm">
                <h2 className="mb-4 sm:mb-6 text-[18px] sm:text-[20px] font-bold md:text-[24px] uppercase">Analisis Pertumbuhan</h2>
                <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Tinggi Tanaman:</h3>
                    <ul className="space-y-1 text-[12px] sm:text-sm text-[#365a1a]/80">
                      <li>• Awal: {stats.startHeight} cm</li>
                      <li>• Akhir: {stats.endHeight} cm</li>
                      <li>• Total pertumbuhan: {(stats.endHeight - stats.startHeight).toFixed(2)} cm</li>
                      <li>• Rata-rata: {stats.avgHeightGrowth.toFixed(2)} cm/hari</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Jumlah Daun:</h3>
                    <ul className="space-y-1 text-[12px] sm:text-sm text-[#365a1a]/80">
                      <li>• Awal: {stats.startLeaf} helai</li>
                      <li>• Akhir: {stats.endLeaf} helai</li>
                      <li>• Total pertambahan: {stats.endLeaf - stats.startLeaf} helai</li>
                      <li>• Rata-rata: {stats.avgLeafGrowth.toFixed(2)} daun/hari</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 border-t border-gray-100 pt-3 sm:pt-4">
                  <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Kesimpulan:</h3>
                  <div className="text-[12px] sm:text-sm space-y-1">
                    <p className="flex items-center gap-2"><span>✓</span> Pertumbuhan tercatat selama {stats.daysSpan} hari dengan baik.</p>
                    <p className="flex items-center gap-2"><span>✓</span> Tidak ada penurunan ekstrim yang tercatat.</p>
                  </div>
                </div>
              </motion.div>

                {/* Prediksi Panen & Rekomendasi Pupuk */}
                <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-[20px] font-bold sm:text-[24px]">🔮 Prediksi Panen & Rekomendasi Pupuk</h2>
                  <PredictionsSection
                    plantType={id}
                    avgHeightGrowth={stats.avgHeightGrowth}
                    currentHeight={stats.endHeight}
                    latestLog={logsRaw.length ? logsRaw[logsRaw.length - 1] : null}
                  />
                </motion.div>

                {/* Logs list with edit/delete */}
                <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-[20px] font-bold sm:text-[24px]">📝 Daftar Pengamatan (Edit / Hapus)</h2>
                  <div className="space-y-3">
                    {logsRaw.map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <div className="font-semibold text-[#365a1a]">Hari {log.day_number} — {log.plant_height} cm • {log.leaf_count} daun</div>
                          <div className="text-sm text-gray-600">pH: {log.soil_ph} • Pupuk: {log.fertilizer_type} • Luas: {log.land_area} ha</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingLog(log)} className="rounded bg-[#365a1a] text-white px-3 py-1 text-sm">Edit</button>
                          <button onClick={() => handleDeleteLog(log.id)} className="rounded bg-white border border-red-400 text-red-600 px-3 py-1 text-sm">Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                </>
              )}

              {activeTab === "biaya" && (
                <div className="space-y-8">
                  {/* Cost Summary Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-[20px] border-2 border-[#365a1a] bg-gradient-to-br from-[#f0f4eb] to-white p-5 shadow-sm">
                      <p className="text-sm font-semibold text-[#365a1a]/70 mb-1">Total Biaya Produksi</p>
                      <h3 className="text-2xl font-extrabold text-[#365a1a]">Rp {totalCost.toLocaleString('id-ID')}</h3>
                    </div>
                    {costCategories.slice(0, 3).map(cat => (
                       <div key={cat} className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm">
                         <p className="text-sm font-semibold text-gray-500 mb-1">{cat}</p>
                         <h3 className="text-xl font-bold text-gray-800">Rp {(costByCategory[cat] || 0).toLocaleString('id-ID')}</h3>
                       </div>
                    ))}
                  </div>

                  {/* Add Cost Button & List */}
                  <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[20px] font-bold sm:text-[24px]">Daftar Biaya</h2>
                      <button 
                        onClick={() => { setEditingCost(null); setShowCostForm(true); }}
                        className="rounded-full bg-[#365a1a] px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-[#2d4915] transition"
                      >
                        + Tambah Biaya
                      </button>
                    </div>

                    {costs.length === 0 ? (
                      <div className="py-12 text-center text-gray-500">
                        Belum ada catatan biaya. Klik "Tambah Biaya" untuk memulai.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b-2 border-gray-100">
                              <th className="py-3 px-2 text-[#365a1a] font-semibold">Tanggal</th>
                              <th className="py-3 px-2 text-[#365a1a] font-semibold">Kategori</th>
                              <th className="py-3 px-2 text-[#365a1a] font-semibold">Keterangan</th>
                              <th className="py-3 px-2 text-[#365a1a] font-semibold">Jumlah (Rp)</th>
                              <th className="py-3 px-2 text-right text-[#365a1a] font-semibold">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {costs.map(cost => (
                              <tr key={cost.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-2 text-sm">{new Date(cost.date).toLocaleDateString('id-ID')}</td>
                                <td className="py-3 px-2 text-sm">
                                  <span className="bg-[#f0f4eb] text-[#365a1a] px-2 py-1 rounded-md font-medium text-xs">
                                    {cost.category}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-sm text-gray-600">{cost.description || "-"}</td>
                                <td className="py-3 px-2 text-sm font-semibold">{Number(cost.amount).toLocaleString('id-ID')}</td>
                                <td className="py-3 px-2 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => { setEditingCost(cost); setShowCostForm(true); }} className="text-[#365a1a] hover:underline text-xs">Edit</button>
                                    <button onClick={() => handleDeleteCost(cost.id)} className="text-red-500 hover:underline text-xs">Hapus</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  
                  {/* Recap Chart / Detailed List */}
                  {costs.length > 0 && (
                    <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                      <h2 className="mb-4 text-[20px] font-bold sm:text-[24px]">📊 Rekap Biaya per Kategori</h2>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(costByCategory).sort((a,b) => (b[1] as number) - (a[1] as number)).map(([cat, amt]) => (
                          <div key={cat} className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="font-medium text-gray-700">{cat}</span>
                            <span className="font-bold text-[#365a1a]">Rp {(amt as number).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-[#9fb08d] bg-white py-24 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f4eb] mb-6">
                <span className="text-5xl">📊</span>
              </div>
              <h3 className="text-[24px] font-bold text-[#365a1a]">Belum Ada Data Pengamatan</h3>
              <p className="mt-3 text-[16px] text-[#365a1a]/70 max-w-md">
                Lahan "{trackers.find(t => t.id === selectedTrackerId)?.title}" belum memiliki data pengamatan. Mulai dengan input data pengamatan sekarang.
              </p>
              <button
                onClick={() => setSelectedTrackerId(null)}
                className="mt-6 inline-block rounded-full bg-[#9fb08d] px-8 py-3 text-sm font-bold text-white hover:bg-[#8a9d7a] transition"
              >
                ← Kembali ke Daftar Lahan
              </button>
            </div>
          )}
        </div>

        {/* Edit modal */}
        {editingLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-xl rounded-lg bg-white p-6">
              <h3 className="text-lg font-bold text-[#365a1a] mb-4">Edit Pengamatan - Hari {editingLog.day_number}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Hari ke-</label>
                  <input type="number" name="day_number" value={editingLog.day_number} onChange={(e) => setEditingLog({...editingLog, day_number: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Tinggi (cm)</label>
                  <input type="number" step="0.1" name="plant_height" value={editingLog.plant_height} onChange={(e) => setEditingLog({...editingLog, plant_height: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Jumlah Daun</label>
                  <input type="number" name="leaf_count" value={editingLog.leaf_count} onChange={(e) => setEditingLog({...editingLog, leaf_count: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Jumlah Cabang</label>
                  <input type="number" name="branch_count" value={editingLog.branch_count} onChange={(e) => setEditingLog({...editingLog, branch_count: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">pH Tanah</label>
                  <input type="number" step="0.1" name="soil_ph" value={editingLog.soil_ph} onChange={(e) => setEditingLog({...editingLog, soil_ph: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Jenis Pupuk</label>
                  <input type="text" name="fertilizer_type" value={editingLog.fertilizer_type} onChange={(e) => setEditingLog({...editingLog, fertilizer_type: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Luas Lahan (ha)</label>
                  <input type="number" step="0.1" name="land_area" value={editingLog.land_area} onChange={(e) => setEditingLog({...editingLog, land_area: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setEditingLog(null)} className="rounded border px-4 py-2">Batal</button>
                <button onClick={() => handleUpdateLog(editingLog)} className="rounded bg-[#365a1a] px-4 py-2 text-white">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {/* Cost Form Modal */}
        {showCostForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
              <h3 className="text-xl font-bold text-[#365a1a] mb-5">
                {editingCost ? "Edit Biaya" : "Tambah Biaya"}
              </h3>
              <form onSubmit={handleSaveCost} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Tanggal</label>
                  <input 
                    type="date" 
                    name="date" 
                    required 
                    defaultValue={editingCost ? editingCost.date : new Date().toISOString().split('T')[0]} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Kategori</label>
                  <select 
                    name="category" 
                    required 
                    defaultValue={editingCost ? editingCost.category : costCategories[0]} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] outline-none bg-white"
                  >
                    {costCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Keterangan</label>
                  <input 
                    type="text" 
                    name="description" 
                    placeholder="Contoh: Beli bibit unggul 5kg"
                    defaultValue={editingCost?.description || ""} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Jumlah Biaya (Rp)</label>
                  <input 
                    type="number" 
                    name="amount" 
                    required 
                    min="0"
                    placeholder="Contoh: 150000"
                    defaultValue={editingCost?.amount || ""} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] outline-none" 
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setShowCostForm(false); setEditingCost(null); }} 
                    className="rounded-full border border-gray-300 px-5 py-2 font-medium hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="rounded-full bg-[#365a1a] px-5 py-2 font-medium text-white hover:bg-[#2d4915] transition shadow-md"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Back Button */}
        <Link
          href="/dashboard"
          className="mt-10 inline-block rounded-full bg-[#365a1a] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#2d4915]"
        >
          ← Kembali ke Dashboard
        </Link>
      </motion.section>
    </main>
  );
}
