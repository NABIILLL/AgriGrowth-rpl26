"use client";

// Import library dan fungsi utilitas API admin yang dibutuhkan
import { useEffect, useState } from "react";
import { adminFetch } from "@/app/admin/_lib/adminApi";

// Definisi tipe data untuk data pengguna, profil, dan tracker lahan
type AdminUser = { id: string; user_metadata?: { name?: string | null } | null; email?: string | null };
type SimpleProfile = { id: string; name?: string | null };

type Tracker = {
  id: string;
  user_id: string;
  title: string;
  plant_type?: string | null;
  created_at?: string | null;
};

// State awal formulir tracker baru
const emptyForm = {
  user_id: "",
  title: "",
  plant_type: "",
};

// Komponen utama halaman Kelola Tracker (Admin)
export default function AdminTrackersPage() {
  // State untuk menyimpan daftar tracker, status loading, error, formulir, dan ID tracker yang sedang diedit
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Map untuk mempermudah pencarian nama profil pengguna berdasarkan user_id
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());

  // Fungsi untuk mengambil data tracker dan pengguna secara paralel dari API admin
  const loadTrackers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trackerData, userData] = await Promise.all([
        adminFetch("/api/admin/trackers"),
        adminFetch("/api/admin/users")
      ]);
      setTrackers(trackerData.trackers || []);

      const profiles = userData.profiles || [];
      const users = userData.users || [];
      const newProfileMap = new Map<string, string>();
      
      users.forEach((u: AdminUser) => {
        const p = profiles.find((p: SimpleProfile) => p.id === u.id);
        newProfileMap.set(u.id, p?.name || u.user_metadata?.name || u.email || "User");
      });
      setProfileMap(newProfileMap);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal memuat tracker");
    } finally {
      setLoading(false);
    }
  };

  // Memuat data saat pertama kali halaman di-render
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadTrackers();
    })();
    return () => { mounted = false; };
  }, []);

  // Handler untuk menyimpan data tracker baru atau memperbarui data tracker (PATCH/POST)
  const handleSubmit = async () => {
    if (!form.title || !form.user_id) {
      setError("user_id dan title wajib diisi");
      return;
    }

    setError(null);
    try {
      if (editingId) {
        await adminFetch("/api/admin/trackers", {
          method: "PATCH",
          json: { id: editingId, title: form.title, plant_type: form.plant_type || null },
        });
      } else {
        await adminFetch("/api/admin/trackers", {
          method: "POST",
          json: { user_id: form.user_id, title: form.title, plant_type: form.plant_type || null },
        });
      }

      setForm({ ...emptyForm });
      setEditingId(null);
      await loadTrackers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal menyimpan tracker");
    }
  };

  // Handler untuk memuat data tracker terpilih ke formulir agar dapat diedit
  const handleEdit = (tracker: Tracker) => {
    setEditingId(tracker.id);
    setForm({
      user_id: tracker.user_id,
      title: tracker.title,
      plant_type: tracker.plant_type || "",
    });
  };

  // Handler untuk menghapus data tracker berdasarkan ID
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tracker ini?")) return;
    setError(null);
    try {
      await adminFetch("/api/admin/trackers", { method: "DELETE", json: { id } });
      await loadTrackers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal menghapus tracker");
    }
  };

  return (
    // Return JSX untuk merender UI halaman Kelola Tracker
    <>
      {/* Header Halaman dan Tombol Aksi */}
      <div className="page-header">
        <div>
          <div className="page-title">Kelola Tracker</div>
          <div className="page-sub">Pantau status tracker pertumbuhan dan fase tanaman</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setForm({ ...emptyForm })}><i className="ti ti-refresh"></i> Reset</button>
          <button className="btn btn-primary" onClick={handleSubmit}><i className="ti ti-device-floppy"></i> Simpan</button>
        </div>
      </div>

      {/* Tampilan pesan kesalahan jika ada */}
      {error && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", color: "var(--red)" }}>{error}</div>
        </div>
      )}

      {/* Grid Menu Kontrol Atas (Form Input, Statistik, Pencarian) */}
      <div className="grid-3" style={{ marginBottom: 14 }}>
        {/* Panel Form Tracker */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-plant-2"></i> Form Tracker</div>
          </div>
          <div style={{ padding: "14px 16px", display: "grid", gap: 10 }}>
            <input className="form-input" placeholder="user_id" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} />
            <input className="form-input" placeholder="Nama tracker" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="form-input" placeholder="Jenis tanaman" value={form.plant_type} onChange={(e) => setForm({ ...form, plant_type: e.target.value })} />
          </div>
        </div>

        {/* Panel Statistik Total Tracker */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-chart-bar"></i> Total Tracker</div>
          </div>
          <div className="stat-inline">
            <div className="stat-cell"><div className="stat-cell-num">{trackers.length}</div><div className="stat-cell-lbl">Total</div></div>
          </div>
        </div>

        {/* Panel Cari Tracker */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-search"></i> Cari Tracker</div>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <input className="form-input" placeholder="Nama tracker atau lahan" />
          </div>
        </div>
      </div>

      {/* Panel Tabel Daftar Tracker */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><i className="ti ti-list"></i> Daftar Tracker</div>
          <div className="panel-actions">
            <button className="mini-btn" onClick={loadTrackers}>Refresh</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Tracker</th>
                <th>User ID</th>
                <th>Jenis Tanaman</th>
                <th>Dibuat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>Loading...</td></tr>
              ) : trackers.length === 0 ? (
                <tr><td colSpan={5}>Belum ada tracker</td></tr>
              ) : (
                trackers.map((tracker) => {
                  const userName = profileMap.get(tracker.user_id) || "Unknown";
                  return (
                    <tr key={tracker.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div className="td-name">
                          <div className="avatar-sm" style={{ width: 24, height: 24, fontSize: 10 }}>{userName?.slice(0, 2).toUpperCase() || "?"}</div>
                          {userName}
                        </div>
                      </td>
                      <td>{tracker.title}</td>
                      <td style={{ color: "var(--text4)", fontSize: "12px" }}>{tracker.user_id.slice(0, 8)}...</td>
                      <td>{tracker.plant_type || "-"}</td>
                      <td style={{ color: "var(--text4)" }}>{tracker.created_at?.split("T")[0] || "-"}</td>
                      <td>
                        <button className="mini-btn" onClick={() => handleEdit(tracker)}>Edit</button>
                        <button className="mini-btn" style={{ marginLeft: 6 }} onClick={() => handleDelete(tracker.id)}>Hapus</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}