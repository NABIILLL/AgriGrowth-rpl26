"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import AgrigrowthLogo from "@/components/AgrigrowthLogo";
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
      { label: "Observations", href: "/admin/observations", icon: "ti ti-notes" },
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
            <AgrigrowthLogo tone="light" textClassName="logo-text" />
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
