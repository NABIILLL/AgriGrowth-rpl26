"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/app/admin/_lib/adminApi";
import { supabase } from "@/lib/supabase";

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

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return value.split("T")[0];
};

const getShortDay = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });

export default function AdminDashboardPage() {
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

  const roleMap = useMemo(() => new Map(roles.map((row) => [row.user_id, row.role || "user"])), [roles]);
  const profileMap = useMemo(() => new Map(profiles.map((row) => [row.id, row])), [profiles]);
  const trackerCountMap = useMemo(() => {
    const map = new Map<string, number>();
    trackers.forEach((tracker) => {
      map.set(tracker.user_id, (map.get(tracker.user_id) || 0) + 1);
    });
    return map;
  }, [trackers]);

  const trackerMap = useMemo(() => new Map(trackers.map((tracker) => [tracker.id, tracker])), [trackers]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 4);
  }, [users]);

  const roleDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    roles.forEach((row) => {
      const key = row.role || "user";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [roles]);

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

    // Initial load
    loadData();

    // Supabase Realtime Listener (WebSockets)
    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
            // Whenever ANY table in public schema changes, refresh the data
            if (isMounted) loadData();
          }
      )
      .subscribe();

    // Auto-refresh every 15 seconds as a fallback
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
    <>
      {error && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", color: "var(--red)" }}>{error}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="page-title">System Overview</div>
          <div className="page-sub">Last synced {lastSynced || "-"} · Data Supabase terkini</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary"><i className="ti ti-plus"></i> Add User</button>
        </div>
      </div>

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

      <div className="grid-3-2">
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

      <div className="grid-3-2">
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