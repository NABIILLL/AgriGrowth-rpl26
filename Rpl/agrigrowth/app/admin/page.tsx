"use client";

// Import library, hooks, dan klien Supabase yang dibutuhkan
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/app/admin/_lib/adminApi";
import { supabase } from "@/lib/supabase";

// Definisi tipe data untuk user, tracker, logs, sampel, dan kalkulasi prediksi panen
type SupabaseUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  user_metadata?: { name?: string | null } | null;
};

type RoleRow = { user_id: string; role: string | null };
type ProfileRow = { id: string; name?: string | null; location?: string | null };
type Tracker = { id: string; user_id: string; title: string; plant_type?: string | null; created_at?: string | null };
type GrowthLog = {
  id: string;
  tracker_id: string;
  day_number: number;
  plant_height?: number | null;
  leaf_count?: number | null;
  branch_count?: number | null;
  soil_ph?: number | null;
  light_condition?: string | null;
  plant_condition?: string | null;
  fertilizer_type?: string | null;
  land_area?: number | null;
  created_at?: string | null;
};
type GrowthSampleLog = { id: string; tracker_id: string; sample_id?: string | null; day_number?: number | null; created_at?: string | null };
type TrackerSample = { id: string; tracker_id: string; sample_no: number; name: string; created_at?: string | null };

type TrackerPrediction = {
  trackerId: string;
  trackerTitle: string;
  plantType: string;
  currentHeight: number;
  avgDailyGrowth: number;
  daysToHarvest: number | null;
  harvestDate: string | null;
  estimatedYieldTon: number;
  estimatedYieldKg: number;
  fertilizerNeedKg: number;
  confidenceLabel: string;
  dataPoints: number;
};

// Fungsi pembantu untuk memformat tanggal ke format string sederhana
const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return value.split("T")[0];
};

// Fungsi pembantu untuk mendapatkan nama hari singkat (contoh: Mon, Tue)
const getShortDay = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });

// Parameter dasar heuristik untuk estimasi panen dan kebutuhan pupuk berdasarkan jenis tanaman
const cropDefaults: Record<string, { maturityHeight: number; maturityDays: number; baseYieldTonPerHa: number; fertilizerKgPerHa: number }> = {
  padi: { maturityHeight: 100, maturityDays: 110, baseYieldTonPerHa: 6.2, fertilizerKgPerHa: 250 },
  jagung: { maturityHeight: 250, maturityDays: 100, baseYieldTonPerHa: 8.5, fertilizerKgPerHa: 300 },
  bawang: { maturityHeight: 50, maturityDays: 65, baseYieldTonPerHa: 18.0, fertilizerKgPerHa: 350 },
};

// Fungsi pembantu untuk memformat label tanaman
const cropLabel = (plantType?: string | null) => {
  if (plantType === "jagung") return "Jagung";
  if (plantType === "bawang") return "Bawang Merah";
  return "Padi";
};

// Fungsi pembantu untuk menormalisasi kunci tanaman
const cropKey = (plantType?: string | null) => {
  if (plantType === "jagung") return "jagung";
  if (plantType === "bawang") return "bawang";
  return "padi";
};

// Komponen utama halaman Dashboard Admin
export default function AdminDashboardPage() {
  // State management untuk menyimpan seluruh data relasional sistem dan status monitoring
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
  const [growthSampleLogs, setGrowthSampleLogs] = useState<GrowthSampleLog[]>([]);
  const [trackerSamples, setTrackerSamples] = useState<TrackerSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string>("");

  // useMemo untuk efisiensi mapping data relasi
  const roleMap = useMemo(() => new Map(roles.map((row) => [row.user_id, row.role || "user"])), [roles]);
  const profileMap = useMemo(() => new Map(profiles.map((row) => [row.id, row])), [profiles]);
  
  // useMemo menghitung jumlah tracker per pengguna
  const trackerCountMap = useMemo(() => {
    const map = new Map<string, number>();
    trackers.forEach((tracker) => {
      map.set(tracker.user_id, (map.get(tracker.user_id) || 0) + 1);
    });
    return map;
  }, [trackers]);

  const trackerMap = useMemo(() => new Map(trackers.map((tracker) => [tracker.id, tracker])), [trackers]);

  // useMemo mengurutkan pengguna yang baru bergabung
  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 4);
  }, [users]);

  // useMemo menghitung persentase peran (role) pengguna
  const roleDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    roles.forEach((row) => {
      const key = row.role || "user";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [roles]);

  // Kalkulasi heuristik untuk prediksi panen, taksiran hasil panen (yield), dan pupuk
  const trackerPredictions = useMemo<TrackerPrediction[]>(() => {
    const byTracker = new Map<string, GrowthLog[]>();
    growthLogs.forEach((log) => {
      const list = byTracker.get(log.tracker_id) || [];
      list.push(log);
      byTracker.set(log.tracker_id, list);
    });

    return trackers
      .map((tracker) => {
        const logs = (byTracker.get(tracker.id) || [])
          .filter((item) => typeof item.day_number === "number" && typeof item.plant_height === "number")
          .sort((a, b) => (a.day_number || 0) - (b.day_number || 0));

        const key = cropKey(tracker.plant_type);
        const cfg = cropDefaults[key];
        const latest = logs[logs.length - 1];
        const first = logs[0];
        const daysSpan = logs.length > 1 ? Math.max(1, (latest?.day_number || 1) - (first?.day_number || 1)) : 1;
        const avgDailyGrowth = logs.length > 1 && latest && first ? Math.max(0, ((latest.plant_height || 0) - (first.plant_height || 0)) / daysSpan) : 0;
        const currentHeight = latest?.plant_height || 0;
        const predictedDaysFromGrowth = avgDailyGrowth > 0 ? Math.max(0, Math.ceil((cfg.maturityHeight - currentHeight) / avgDailyGrowth)) : null;
        const daysToHarvest = predictedDaysFromGrowth ?? cfg.maturityDays;
        const harvestDate = new Date();
        harvestDate.setDate(harvestDate.getDate() + (daysToHarvest || cfg.maturityDays));

        const landArea = latest?.land_area || 1;
        const estimatedYieldTon = Number((cfg.baseYieldTonPerHa * landArea).toFixed(2));
        const estimatedYieldKg = Math.round(estimatedYieldTon * 1000);
        const fertilizerNeedKg = Number((cfg.fertilizerKgPerHa * landArea).toFixed(1));

        const confidenceLabel =
          logs.length >= 4
            ? "Tinggi"
            : logs.length >= 2
              ? "Sedang"
              : "Rendah";

        return {
          trackerId: tracker.id,
          trackerTitle: tracker.title,
          plantType: cropLabel(tracker.plant_type),
          currentHeight,
          avgDailyGrowth: Number(avgDailyGrowth.toFixed(2)),
          daysToHarvest,
          harvestDate: harvestDate.toLocaleDateString("id-ID"),
          estimatedYieldTon,
          estimatedYieldKg,
          fertilizerNeedKg,
          confidenceLabel,
          dataPoints: logs.length,
        };
      })
      .sort((a, b) => a.daysToHarvest === null ? 1 : b.daysToHarvest === null ? -1 : a.daysToHarvest - b.daysToHarvest);
  }, [growthLogs, trackers]);

  // useMemo menghitung statistik ringkasan data prediksi panen
  const predictionStats = useMemo(() => {
    const ready = trackerPredictions.filter((item) => item.dataPoints >= 2);
    const urgent = ready.filter((item) => item.daysToHarvest !== null && item.daysToHarvest <= 14);
    const averageDays = ready.length
      ? Math.round(ready.reduce((sum, item) => sum + (item.daysToHarvest || 0), 0) / ready.length)
      : 0;

    return {
      readyCount: ready.length,
      urgentCount: urgent.length,
      averageDays,
    };
  }, [trackerPredictions]);

  // Effect untuk menginisialisasi pengambilan data secara berkala dan sinkronisasi real-time via WebSockets Supabase
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadData = async () => {
      try {
        const [userData, trackerData, observationData] = await Promise.all([
          adminFetch("/api/admin/users"),
          adminFetch("/api/admin/trackers"),
          adminFetch("/api/admin/observations"),
        ]);

        if (isMounted) {
          setUsers(userData.users || []);
          setRoles(userData.roles || []);
          setProfiles(userData.profiles || []);
          setTrackers(trackerData.trackers || []);
          setGrowthLogs(observationData.growth_logs || observationData.observations || []);
          setGrowthSampleLogs(observationData.growth_sample_logs || []);
          setTrackerSamples(observationData.tracker_samples || []);
          setLastSynced(new Date().toLocaleTimeString("id-ID"));
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg || "Gagal memuat data admin");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Pemuatan data pertama kali
    loadData();

    // Supabase Realtime Listener (WebSockets) untuk sinkronisasi data instan saat ada perubahan di database
    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
            // Segarkan data ketika terjadi perubahan pada skema publik
            if (isMounted) loadData();
          }
      )
      .subscribe();

    // Polling otomatis setiap 15 detik sebagai fallback
    const startPolling = () => {
      timeoutId = setTimeout(() => {
        loadData().finally(startPolling);
      }, 15000);
    };
    startPolling();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, []);

  // Effect untuk menggambar grafik batang aktivitas harian log pertumbuhan 7 hari terakhir
  useEffect(() => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      return date;
    });

    const counts = last7Days.map((date) => {
      const dayKey = date.toISOString().slice(0, 10);
      return growthLogs.filter((obs) => obs.created_at?.startsWith(dayKey)).length;
    });

    const max = Math.max(...counts, 1);
    const chart = document.getElementById("barChart");
    if (!chart) return;
    chart.innerHTML = "";

    counts.forEach((value, index) => {
      const height = Math.round((value / max) * 130);
      const el = document.createElement("div");
      el.className = "bar-wrap";
      el.innerHTML = `<div class="bar-val">${value}</div><div class="bar-fill" style="height:${height}px;background:${index === 5 ? "var(--g400)" : "var(--g700)"};transition:height .4s ${index * 60}ms"></div><div class="bar-label">${getShortDay(last7Days[index])}</div>`;
      chart.appendChild(el);
    });
  }, [growthLogs]);

  // useMemo untuk menyusun daftar 5 aktivitas log terbaru di seluruh sistem
  const activityItems = useMemo(() => {
    const recentGrowthLogs = [...growthLogs]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 2)
      .map((item) => ({
        icon: "ti ti-chart-line",
        tone: "a",
        text: `Growth log baru untuk tracker ${item.tracker_id.slice(0, 8)}...`,
        time: formatDate(item.created_at),
      }));

    const recentSampleLogs = [...growthSampleLogs]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 1)
      .map((item) => ({
        icon: "ti ti-logs",
        tone: "b",
        text: `Sample log tracker ${item.tracker_id.slice(0, 8)}...`,
        time: formatDate(item.created_at),
      }));

    const recentTrackers = [...trackers]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 2)
      .map((item) => ({
        icon: "ti ti-plant-2",
        tone: "g",
        text: `Tracker baru dibuat: ${item.title}`,
        time: formatDate(item.created_at),
      }));

    const recentAccounts = [...users]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 1)
      .map((item) => {
        const profile = profileMap.get(item.id);
        return {
          icon: "ti ti-user-plus",
          tone: "g",
          text: `${profile?.name || item.user_metadata?.name || item.email || "User baru"} registrasi akun`,
          time: formatDate(item.created_at),
        };
      });

    const recentTrackerSamples = [...trackerSamples]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 1)
      .map((item) => ({
        icon: "ti ti-database",
        tone: "g",
        text: `Tracker sample ${item.name} dibuat untuk ${trackerMap.get(item.tracker_id)?.title || item.tracker_id.slice(0, 8)}...`,
        time: formatDate(item.created_at),
      }));

    return [...recentAccounts, ...recentGrowthLogs, ...recentSampleLogs, ...recentTrackerSamples, ...recentTrackers].slice(0, 5);
  }, [growthLogs, growthSampleLogs, trackerSamples, trackers, users, profileMap, trackerMap]);

  return (
    // Return JSX UI Dashboard Utama Admin
    <>
      {/* Notifikasi Error jika ada */}
      {error && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", color: "var(--red)" }}>{error}</div>
        </div>
      )}

      {/* Header Dashboard & Sinkronisasi */}
      <div className="page-header">
        <div>
          <div className="page-title">System Overview</div>
          <div className="page-sub">Last synced {lastSynced || "-"} · Data Supabase terkini</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary"><i className="ti ti-plus"></i> Add User</button>
        </div>
      </div>

      {/* Grid Kartu KPI (Key Performance Indicator) */}
      <div className="kpi-grid">
        <div className="kpi-card g">
          <div className="kpi-icon g"><i className="ti ti-users"></i></div>
          <div className="kpi-num">{users.length}</div>
          <div className="kpi-label">Users</div>
        </div>
        <div className="kpi-card a">
          <div className="kpi-icon a"><i className="ti ti-plant"></i></div>
          <div className="kpi-num">{trackers.length}</div>
          <div className="kpi-label">Trackers</div>
        </div>
        <div className="kpi-card b">
          <div className="kpi-icon b"><i className="ti ti-notes"></i></div>
          <div className="kpi-num">{growthLogs.length}</div>
          <div className="kpi-label">Growth Logs</div>
        </div>
      </div>

      {/* Layout Grid Panel Prediksi Panen Lahan */}
      <div className="grid-3-2" style={{ marginBottom: 18 }}>
        <div className="panel" style={{ background: "linear-gradient(135deg, rgba(54,90,26,0.08), rgba(97,174,37,0.04))", border: "1px solid rgba(54,90,26,0.14)" }}>
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-sparkles"></i> Prediksi Panen Lahan</div>
            <div className="panel-actions">
              <span className="mini-btn active" style={{ cursor: "default" }}>Heuristik</span>
            </div>
          </div>

          <div style={{ padding: 12, display: "grid", gap: 12 }}>
            {/* Ringkasan status prediksi */}
            <div className="stat-inline" style={{ marginBottom: 0 }}>
              <div className="stat-cell">
                <div className="stat-cell-num">{predictionStats.readyCount}</div>
                <div className="stat-cell-lbl">Siap diprediksi</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-num">{predictionStats.urgentCount}</div>
                <div className="stat-cell-lbl">Panen &lt;= 14 hari</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell-num" style={{ color: "var(--teal)" }}>{predictionStats.averageDays}</div>
                <div className="stat-cell-lbl">Rata-rata hari</div>
              </div>
            </div>

            {/* Daftar detail prediksi panen tracker lahan */}
            {trackerPredictions.length === 0 ? (
              <div style={{ padding: "12px 0", color: "var(--text4)" }}>Belum ada tracker untuk dihitung prediksi panennya.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {trackerPredictions.slice(0, 4).map((item) => (
                  <div key={item.trackerId} style={{ border: "1px solid rgba(54,90,26,0.12)", borderRadius: 16, padding: 12, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "var(--text2)" }}>{item.trackerTitle}</div>
                        <div style={{ fontSize: 12, color: "var(--text4)" }}>{item.plantType} · {item.dataPoints} data point</div>
                      </div>
                      <span className="mini-btn" style={{ cursor: "default" }}>{item.confidenceLabel}</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginTop: 10, fontSize: 13 }}>
                      <div><span style={{ color: "var(--text4)" }}>Panen:</span> <b>{item.daysToHarvest ?? "-"} hari</b></div>
                      <div><span style={{ color: "var(--text4)" }}>Tanggal:</span> <b>{item.harvestDate || "-"}</b></div>
                      <div><span style={{ color: "var(--text4)" }}>Hasil:</span> <b>{item.estimatedYieldTon} ton</b></div>
                      <div><span style={{ color: "var(--text4)" }}>Pupuk:</span> <b>{item.fertilizerNeedKg} kg</b></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Grid Grafik Batang Harian & Feed Aktivitas Live */}
      <div className="grid-3-2">
        {/* Panel Grafik Pertumbuhan */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-chart-bar"></i> Growth Logs — Daily</div>
            <div className="panel-actions">
              <button className="mini-btn active">Week</button>
            </div>
          </div>
          <div className="chart-area" id="barChart"></div>
          <div className="stat-inline">
            <div className="stat-cell"><div className="stat-cell-num">{growthLogs.length}</div><div className="stat-cell-lbl">Total</div></div>
            <div className="stat-cell"><div className="stat-cell-num">{trackers.length}</div><div className="stat-cell-lbl">Trackers</div></div>
            <div className="stat-cell"><div className="stat-cell-num" style={{ color: "var(--teal)" }}>{trackerSamples.length}</div><div className="stat-cell-lbl">Samples</div></div>
          </div>
        </div>

        {/* Panel Live Activity Feed */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-activity"></i> Live Activity</div>
          </div>
          {activityItems.length === 0 ? (
            <div style={{ padding: "16px", color: "var(--text4)" }}>Belum ada aktivitas terbaru</div>
          ) : (
            activityItems.slice(0,3).map((item, index) => (
              <div className="feed-item" key={`${item.text}-${index}`}>
                <div className={`feed-icon ${item.tone}`}><i className={item.icon}></i></div>
                <div className="feed-body">
                  <div className="feed-text">{item.text}</div>
                  <div className="feed-time">{item.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Grid Daftar Pengguna Baru & Distribusi Role */}
      <div className="grid-3-2">
        {/* Panel Recent Users */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-users"></i> Recent Users</div>
            <div className="panel-actions">
              <button className="mini-btn">Manage all</button>
            </div>
          </div>
          <div style={{ padding: 12 }} className="simple-list">
            {loading ? (
              <div style={{ color: "var(--text4)" }}>Loading...</div>
            ) : recentUsers.length === 0 ? (
              <div style={{ color: "var(--text4)" }}>Belum ada pengguna</div>
            ) : (
              recentUsers.map((user) => {
                const profile = profileMap.get(user.id);
                const name = profile?.name || user.user_metadata?.name || user.email || "User";
                return (
                  <div key={user.id} className="simple-item">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar-sm">{name.slice(0, 2).toUpperCase()}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        <div style={{ fontSize: 12, color: "var(--text4)" }}>{formatDate(user.created_at)}</div>
                      </div>
                    </div>
                    <div>
                      <button className="mini-btn">Edit</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Role Distribution */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-chart-donut"></i> Role Distribution</div>
          </div>
          <div style={{ padding: 12 }}>
            {roleDistribution.size === 0 ? (
              <div style={{ color: "var(--text4)" }}>belum ada data</div>
            ) : (
              Array.from(roleDistribution.entries()).map(([role, count]) => (
                <div key={role} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <div style={{ color: "var(--text2)", fontWeight: 600 }}>{role}</div>
                  <div style={{ color: "var(--text4)" }}>{count}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}