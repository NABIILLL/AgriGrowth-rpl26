"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
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
      { label: "Observations", href: "/admin/observations", icon: "ti ti-notes" },
    ],
  },
];

const flattenNav = navSections.flatMap((section) => section.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const current = flattenNav.find((item) => item.href === pathname);
  const currentLabel = current?.label ?? "Dashboard";

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
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">
              <div className="logo-icon"><i className="ti ti-leaf"></i></div>
              <div className="logo-text">AgriGrowth<span>Monitor · Admin</span></div>
            </div>
            <div className="env-badge"><div className="env-dot"></div> Production</div>
          </div>

          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <div className="nav-label">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item${pathname === item.href ? " active" : ""}`}
                >
                  <i className={item.icon}></i>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="sidebar-footer">
            <div className="admin-chip">
              <div className="admin-avatar">SA</div>
              <div className="admin-info">
                <div className="admin-name">Super Admin</div>
                <div className="admin-role">Full Access · Online</div>
              </div>
              <i className="ti ti-dots-vertical" style={{ fontSize: 15, color: "var(--text4)", cursor: "pointer" }}></i>
            </div>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div className="topbar-breadcrumb">Admin <i className="ti ti-chevron-right" style={{ fontSize: 12 }}></i> <span>{currentLabel}</span></div>
            <div className="topbar-search">
              <i className="ti ti-search"></i>
              <input type="text" placeholder="Search users, trackers, logs… (⌘K)" />
            </div>
            <div className="topbar-actions">
              <div className="icon-btn"><i className="ti ti-bell" style={{ fontSize: 16 }}></i><div className="notif-dot"></div></div>
              <div className="icon-btn"><i className="ti ti-refresh" style={{ fontSize: 16 }}></i></div>
            </div>
          </div>

          <div className="content">{children}</div>
        </div>
      </div>
    </div>
  );
}