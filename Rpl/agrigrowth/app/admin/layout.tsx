"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import AgrigrowthLogo from "@/components/AgrigrowthLogo";
import { adminFetch } from "@/app/admin/_lib/adminApi";
import { Menu, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import "./admin.css";

const navSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: "ti ti-layout-dashboard" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Users & Roles", href: "/admin/users", icon: "ti ti-users" },
      { label: "Profiles", href: "/admin/profiles", icon: "ti ti-id" },
      { label: "Trackers", href: "/admin/trackers", icon: "ti ti-plant-2" },
      { label: "Growth Logs", href: "/admin/observations", icon: "ti ti-chart-line" },
      { label: "Production Costs", href: "/admin/costs", icon: "ti ti-wallet" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Admin Profile", href: "/admin/profile", icon: "ti ti-user-circle" },
    ],
  },
];

const flattenNav = navSections.flatMap((section) => section.items);

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  createdAt?: string | null;
  href: string;
  tone: "g" | "a" | "b";
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();
  const bellRef = useRef<HTMLDivElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [trackers, setTrackers] = useState<any[]>([]);
  const [growthLogs, setGrowthLogs] = useState<any[]>([]);
  const [growthSampleLogs, setGrowthSampleLogs] = useState<any[]>([]);
  const [trackerSamples, setTrackerSamples] = useState<any[]>([]);
  const current = flattenNav.find((item) => item.href === pathname);
  const currentLabel = current?.label ?? "Dashboard";
  const adminName = user?.name || "Admin";
  const adminInitials = (
    adminName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "AD"
  ).toUpperCase();

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const [userData, trackerData, observationData] = await Promise.all([
          adminFetch("/api/admin/users"),
          adminFetch("/api/admin/trackers"),
          adminFetch("/api/admin/observations"),
        ]);

        if (!mounted) return;

        setUsers(userData.users || []);
        setTrackers(trackerData.trackers || []);
        setGrowthLogs(observationData.growth_logs || observationData.observations || []);
        setGrowthSampleLogs(observationData.growth_sample_logs || []);
        setTrackerSamples(observationData.tracker_samples || []);
      } catch {
        if (!mounted) return;
        setUsers([]);
        setTrackers([]);
        setGrowthLogs([]);
        setGrowthSampleLogs([]);
        setTrackerSamples([]);
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [
      ...[...users]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 2)
        .map((item) => ({
          id: `user-${item.id}`,
          title: "Pengguna baru",
          description: item.email || "Akun baru terdaftar di admin",
          createdAt: item.created_at,
          href: "/admin/users",
          tone: "g" as const,
        })),
      ...[...trackers]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 2)
        .map((item) => ({
          id: `tracker-${item.id}`,
          title: "Tracker baru",
          description: item.title || "Tracker baru dibuat",
          createdAt: item.created_at,
          href: "/admin/trackers",
          tone: "a" as const,
        })),
      ...[...growthLogs]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 2)
        .map((item) => ({
          id: `growth-${item.id}`,
          title: "Growth log baru",
          description: `Tracker ${item.tracker_id.slice(0, 8)}... hari ke-${item.day_number}`,
          createdAt: item.created_at,
          href: "/admin/observations",
          tone: "b" as const,
        })),
      ...[...trackerSamples]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 1)
        .map((item) => ({
          id: `sample-${item.id}`,
          title: "Sample tracker",
          description: `Sampel ke-${item.sample_no} untuk tracker ${item.tracker_id.slice(0, 8)}...`,
          createdAt: item.created_at,
          href: "/admin/observations",
          tone: "g" as const,
        })),
      ...[...growthSampleLogs]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 1)
        .map((item) => ({
          id: `samplelog-${item.id}`,
          title: "Sample log baru",
          description: `Tracker ${item.tracker_id.slice(0, 8)}...`,
          createdAt: item.created_at,
          href: "/admin/observations",
          tone: "b" as const,
        })),
    ];

    return items
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 6);
  }, [users, trackers, growthLogs, growthSampleLogs, trackerSamples]);

  const unreadCount = notifications.length;

  if (isLoading) {
    return (
      <div className="admin-app">
        <div className="app">
          <div style={{ margin: "auto", color: "var(--text3)" }}>Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="admin-app">
        <div className="app">
          <div style={{ margin: "auto", textAlign: "center" }}>
            <h1 style={{ fontFamily: "Fraunces,serif", fontSize: 24, marginBottom: 8 }}>
              Akses Admin Dibatasi
            </h1>
            <p style={{ color: "var(--text3)", marginBottom: 16 }}>
              Akun Anda belum terdaftar sebagai admin.
            </p>
            <Link href="/dashboard" className="btn btn-primary">
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <div className="app">
        <aside className={`sidebar${sidebarOpen ? " mobile-open" : ""}`}>
          <div className="sidebar-logo">
            <AgrigrowthLogo tone="light" showText={false} imageSrc="/logo%202.png" className="h-10 w-[170px] sm:h-11 sm:w-[190px]" />
            <div className="env-badge"><div className="env-dot"></div> Production</div>
            <button
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <div className="nav-label">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item${pathname === item.href ? " active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={item.icon}></i>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="sidebar-footer" style={{ display: 'flex', padding: '24px 28px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', alignItems: 'center', justifyContent: 'center' }}>
            <UserButton showName={true} appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 shadow-md" } }} />
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <button
              className="topbar-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="topbar-breadcrumb">Admin <i className="ti ti-chevron-right" style={{ fontSize: 12 }}></i> <span>{currentLabel}</span></div>
            <div className="topbar-search">
              <i className="ti ti-search"></i>
              <input type="text" placeholder="Search users, trackers, logs… (⌘K)" />
            </div>
            <div className="topbar-actions" ref={bellRef}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setNotifOpen((open) => !open)}
                aria-label="Toggle notifications"
                aria-expanded={notifOpen}
              >
                <i className="ti ti-bell" style={{ fontSize: 16 }}></i>
                {unreadCount > 0 && <div className="notif-dot"></div>}
              </button>
              <button type="button" className="icon-btn" onClick={() => window.location.reload()} aria-label="Refresh admin data">
                <i className="ti ti-refresh" style={{ fontSize: 16 }}></i>
              </button>

              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-panel-header">
                    <div>
                      <div className="notif-panel-title">Notifications</div>
                      <div className="notif-panel-sub">Data terbaru dari admin</div>
                    </div>
                    <button type="button" className="mini-btn" onClick={() => setNotifOpen(false)}>
                      Close
                    </button>
                  </div>

                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">Belum ada notifikasi baru</div>
                    ) : (
                      notifications.map((item) => (
                        <Link key={item.id} href={item.href} className="notif-item" onClick={() => setNotifOpen(false)}>
                          <div className={`feed-icon ${item.tone}`} style={{ width: 30, height: 30, marginTop: 0 }}>
                            <i className={`ti ${item.tone === "a" ? "ti-plant-2" : item.tone === "b" ? "ti-chart-line" : "ti-bell"}`}></i>
                          </div>
                          <div className="feed-body">
                            <div className="feed-text">{item.title}</div>
                            <div className="feed-time">{item.description}</div>
                            <div className="feed-time">{formatDate(item.createdAt)}</div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="content">{children}</div>
        </div>
      </div>
    </div>
  );
}
