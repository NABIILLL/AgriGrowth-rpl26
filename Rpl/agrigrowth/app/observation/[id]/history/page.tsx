"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const imgLogo = "https://www.figma.com/api/mcp/asset/2a7fcedd-9f30-4d90-8e58-295d41707608";

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
  const [trackers, setTrackers] = useState<TrackerData[]>([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [logsRaw, setLogsRaw] = useState<any[]>([]);
  const [trackerTitle, setTrackerTitle] = useState("Tanaman");
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<any | null>(null);
  
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

  // Fetch list of trackers first
  useEffect(() => {
    async function fetchTrackers() {
      if (!id || isLoading || !user) {
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
          .eq("user_id", user.id)
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
  }, [id, user, isLoading, trackerIdFromQuery]);

  // Fetch chart/logs data when tracker is selected
  useEffect(() => {
    async function fetchLogs() {
      if (!selectedTrackerId || !user) return;

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
  }, [selectedTrackerId, user]);

  // Helper to reload logs (used after edit/delete)
  async function reloadLogs() {
    if (!selectedTrackerId || !user) return;
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
      toast.error("Gagal memuat ulang data");
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
        toast.error(`Gagal menghapus data: ${error.message || "unknown"}`);
        return;
      }

      // Success
      toast.success("Data pengamatan berhasil dihapus");
      // ensure UI consistent
      await reloadLogs();
    } catch (err: any) {
      console.error("Error deleting log (unexpected):", err);
      toast.error(`Gagal menghapus data: ${err?.message ?? "unknown"}`);
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

      toast.success("Data pengamatan berhasil diperbarui");
      setEditingLog(null);
      await reloadLogs();
    } catch (err: any) {
      console.error("Error updating log:", err);
      toast.error(`Gagal memperbarui data: ${err?.message ?? "unknown"}`);
    }
  }

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

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      {/* Header */}
      <header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 hover:opacity-80 transition">
          <img alt="Agrigrowth logo" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
          <b className="text-[20px] leading-none sm:text-[21px]">Agrigrowth Monitor</b>
        </Link>

        <nav className="hidden items-center gap-10 text-[21px] font-bold lg:flex">
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

        <div className="flex items-center gap-2 rounded-full bg-[rgba(54,90,26,0.75)] px-3 py-2 text-[16px] font-medium text-[#d7e4cd] shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] sm:text-[18px]">
          <span>{!isLoading && user ? user.name : "Guest"}</span>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto w-full max-w-[1440px] px-5 pb-12 sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2 sm:mt-4">
          <h1 className="text-[32px] font-extrabold leading-[1.08] text-[#365a1a] sm:text-[42px] lg:text-[58px]">
            Monitoring Grafik {trackerTitle}
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/observation/form"
              className="rounded-full bg-[#365a1a] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#2d4915] hover:shadow-lg transition"
            >
              ➕ Input Data
            </Link>
            <button className="rounded-full bg-white px-6 py-2.5 text-sm font-bold shadow-md border border-[#365a1a]/20 hover:bg-gray-50 hover:shadow-lg transition">
              📥 Export PDF
            </button>
            <button className="rounded-full bg-white px-6 py-2.5 text-sm font-bold shadow-md border border-[#365a1a]/20 hover:bg-gray-50 hover:shadow-lg transition">
              📤 Share
            </button>
          </div>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-[20px] bg-white py-16 px-6 text-center shadow-sm border border-gray-100">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#365a1a] border-t-transparent"></div>
              <p className="mt-4 text-[#365a1a] font-medium">Memuat data lahan...</p>
            </div>
          ) : trackers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-[#9fb08d] bg-white py-24 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f4eb] mb-6">
                <span className="text-5xl">🚜</span>
              </div>
              <h3 className="text-[24px] font-bold text-[#365a1a]">Belum Ada Data Lahan</h3>
              <p className="mt-3 text-[16px] text-[#365a1a]/70 max-w-md">
                Anda belum membuat tracker lahan untuk {trackerTitle}. Buat tracker dan mulai input data pengamatan.
              </p>
              <Link
                href="/dashboard"
                className="mt-6 inline-block rounded-full bg-[#365a1a] px-8 py-3 text-sm font-bold text-white hover:bg-[#2d4915] transition"
              >
                Buat Tracker Lahan
              </Link>
            </div>
          ) : !selectedTrackerId ? (
            <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-[24px] font-bold sm:text-[28px]">🌾 Pilih Lahan yang Ingin Dimonitor</h2>
              <p className="text-[#365a1a]/70 mb-6">Anda memiliki {trackers.length} lahan yang telah dicatat untuk {trackerTitle}:</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trackers.map((tracker) => (
                  <button
                    key={tracker.id}
                    onClick={() => setSelectedTrackerId(tracker.id)}
                    className="p-4 rounded-[16px] border-2 border-[#365a1a] bg-gradient-to-br from-[#f0f4eb] to-white hover:bg-[#e8ede0] hover:shadow-md transition text-left"
                  >
                    <h3 className="font-bold text-[18px] text-[#365a1a] mb-2">{tracker.title}</h3>
                    <p className="text-sm text-[#365a1a]/60">
                      Dibuat: {new Date(tracker.created_at).toLocaleDateString('id-ID', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between rounded-[16px] bg-[#f0f4eb] p-4 border-l-4 border-[#365a1a]">
                <div>
                  <p className="text-sm text-[#365a1a]/70">Lahan yang dipilih:</p>
                  <p className="text-[20px] font-bold text-[#365a1a]">{trackers.find(t => t.id === selectedTrackerId)?.title}</p>
                </div>
                <button
                  onClick={() => setSelectedTrackerId(null)}
                  className="rounded-full bg-[#365a1a] text-white px-4 py-2 text-sm font-semibold hover:bg-[#2d4915] transition"
                >
                  ← Kembali ke Daftar
                </button>
              </div>
              
              {/* Grafik Tinggi Tanaman */}
              <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-[20px] font-bold sm:text-[24px]">📊 GRAFIK TINGGI TANAMAN</h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#365a1a' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#365a1a' }} dx={-10} unit=" cm" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#365a1a' }}
                      />
                      <Line type="monotone" dataKey="height" name="Tinggi Tanaman" stroke="#365a1a" strokeWidth={4} dot={{ r: 6, fill: '#365a1a', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <p className="text-[16px] font-semibold text-[#365a1a]">Tren: {stats.avgHeightGrowth >= 0 ? '↑ Meningkat' : '↓ Menurun'} ({stats.avgHeightGrowth.toFixed(2)} cm/hari)</p>
                  <p className="text-[14px] text-gray-600">Total tinggi terakhir: {stats.endHeight} cm</p>
                </div>
              </div>

              {/* Grafik Jumlah Daun */}
              <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-[20px] font-bold sm:text-[24px]">📊 GRAFIK JUMLAH DAUN</h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#365a1a' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#365a1a' }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#365a1a' }}
                      />
                      <Line type="monotone" dataKey="leaf" name="Jumlah Daun" stroke="#61ae25" strokeWidth={4} dot={{ r: 6, fill: '#61ae25', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <p className="text-[16px] font-semibold text-[#365a1a]">Tren: {stats.avgLeafGrowth >= 0 ? '↑ Bertambah' : '↓ Berkurang'} ({stats.avgLeafGrowth.toFixed(2)} daun/hari)</p>
                  <p className="text-[14px] text-gray-600">Total daun terakhir: {stats.endLeaf} helai</p>
                </div>
              </div>

              {/* Analisis Pertumbuhan */}
              <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-[20px] font-bold sm:text-[24px] uppercase">Analisis Pertumbuhan</h2>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Tinggi Tanaman:</h3>
                    <ul className="space-y-1 text-sm text-[#365a1a]/80">
                      <li>• Awal: {stats.startHeight} cm</li>
                      <li>• Akhir: {stats.endHeight} cm</li>
                      <li>• Total pertumbuhan: {(stats.endHeight - stats.startHeight).toFixed(2)} cm</li>
                      <li>• Rata-rata: {stats.avgHeightGrowth.toFixed(2)} cm/hari</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Jumlah Daun:</h3>
                    <ul className="space-y-1 text-sm text-[#365a1a]/80">
                      <li>• Awal: {stats.startLeaf} helai</li>
                      <li>• Akhir: {stats.endLeaf} helai</li>
                      <li>• Total pertambahan: {stats.endLeaf - stats.startLeaf} helai</li>
                      <li>• Rata-rata: {stats.avgLeafGrowth.toFixed(2)} daun/hari</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <h3 className="font-semibold mb-2">Kesimpulan:</h3>
                  <div className="text-sm space-y-1">
                    <p className="flex items-center gap-2"><span>✓</span> Pertumbuhan tercatat selama {stats.daysSpan} hari dengan baik.</p>
                    <p className="flex items-center gap-2"><span>✓</span> Tidak ada penurunan ekstrim yang tercatat.</p>
                  </div>
                </div>
              </div>

                {/* Prediksi Panen & Rekomendasi Pupuk */}
                <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-[20px] font-bold sm:text-[24px]">🔮 Prediksi Panen & Rekomendasi Pupuk</h2>
                  <PredictionsSection
                    plantType={id}
                    avgHeightGrowth={stats.avgHeightGrowth}
                    currentHeight={stats.endHeight}
                    latestLog={logsRaw.length ? logsRaw[logsRaw.length - 1] : null}
                  />
                </div>

                {/* Logs list with edit/delete */}
                <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
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
                </div>

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

        {/* Back Button */}
        <Link
          href="/dashboard"
          className="mt-10 inline-block rounded-full bg-[#365a1a] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#2d4915]"
        >
          ← Kembali ke Dashboard
        </Link>
      </section>
    </main>
  );
}
