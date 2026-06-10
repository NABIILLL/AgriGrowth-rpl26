"use client";

// Import library dan fungsi utilitas API admin yang dibutuhkan
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/app/admin/_lib/adminApi";

// Definisi tipe data untuk data profil pengguna
type Profile = {
  id: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  role: string | null;
  bio: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// State awal untuk formulir profil baru/edit
const emptyForm = {
  id: "",
  name: "",
  phone: "",
  location: "",
  role: "",
  bio: "",
};

// Komponen utama halaman Kelola Profil Pengguna (Admin)
export default function AdminProfilesPage() {
  // State management untuk menyimpan daftar profil, loading, error, formulir, dan ID profil yang sedang diedit
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  // useMemo untuk menghitung statistik jumlah profil secara efisien
  const stats = useMemo(() => {
    return {
      total: profiles.length,
    };
  }, [profiles]);

  // Fungsi untuk mengambil daftar profil pengguna dari API admin
  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch("/api/admin/profiles");
      setProfiles(data.profiles || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal memuat profiles");
    } finally {
      setLoading(false);
    }
  };

  // Memuat data saat pertama kali halaman di-render
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadProfiles();
    })();
    return () => { mounted = false; };
  }, []);

  // Handler untuk mengosongkan formulir dan mereset status edit
  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  // Handler untuk menyimpan data profil baru atau memperbarui data profil yang ada (PATCH/POST)
  const handleSubmit = async () => {
    if (!form.id || !form.name) {
      setError("ID dan nama wajib diisi");
      return;
    }

    setError(null);
    try {
      if (editingId) {
        await adminFetch("/api/admin/profiles", {
          method: "PATCH",
          json: {
            id: editingId,
            name: form.name,
            phone: form.phone || null,
            location: form.location || null,
            role: form.role || null,
            bio: form.bio || null,
          },
        });
      } else {
        await adminFetch("/api/admin/profiles", {
          method: "POST",
          json: {
            id: form.id,
            name: form.name,
            phone: form.phone || null,
            location: form.location || null,
            role: form.role || null,
            bio: form.bio || null,
          },
        });
      }

      resetForm();
      await loadProfiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal menyimpan profile");
    }
  };

  // Handler untuk memuat data profil terpilih ke formulir agar dapat diedit
  const handleEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setForm({
      id: profile.id,
      name: profile.name || "",
      phone: profile.phone || "",
      location: profile.location || "",
      role: profile.role || "",
      bio: profile.bio || "",
    });
  };

  // Handler untuk menghapus data profil pengguna berdasarkan ID
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus profile ini?")) return;
    setError(null);
    try {
      await adminFetch("/api/admin/profiles", { method: "DELETE", json: { id } });
      await loadProfiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal menghapus profile");
    }
  };

  return (
    // Return JSX untuk merender UI Kelola Profiles
    <>
      {/* Header Halaman dan Tombol Aksi Utama */}
      <div className="page-header">
        <div>
          <div className="page-title">Kelola Profiles</div>
          <div className="page-sub">Kelola informasi profile pengguna untuk dashboard</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={resetForm}><i className="ti ti-refresh"></i> Reset Form</button>
          <button className="btn btn-primary" onClick={handleSubmit}><i className="ti ti-device-floppy"></i> Simpan</button>
        </div>
      </div>

      {/* Tampilan pesan kesalahan jika ada */}
      {error && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", color: "var(--red)" }}>{error}</div>
        </div>
      )}

      {/* Grid Kiri (Ringkasan Statistik) dan Kanan (Form Input Profil) */}
      <div className="grid-equal" style={{ marginBottom: 14 }}>
        {/* Panel Ringkasan */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-id"></i> Ringkasan</div>
          </div>
          <div className="stat-inline">
            <div className="stat-cell"><div className="stat-cell-num">{stats.total}</div><div className="stat-cell-lbl">Total</div></div>
          </div>
        </div>
        {/* Panel Formulir Input/Edit Profil */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-edit"></i> Form Profile</div>
          </div>
          <div style={{ padding: "14px 16px", display: "grid", gap: 10 }}>
            <input className="form-input" placeholder="ID (auth.users.id)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
            <input className="form-input" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="form-input" placeholder="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="form-input" placeholder="Lokasi" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input className="form-input" placeholder="Role (profile)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <input className="form-input" placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Tabel Daftar Profiles */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><i className="ti ti-list"></i> Daftar Profiles</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Telepon</th>
                <th>Lokasi</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>Loading...</td></tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan={6}>Belum ada data</td></tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td style={{ color: "var(--text4)" }}>{profile.id}</td>
                    <td>{profile.name}</td>
                    <td>{profile.phone}</td>
                    <td>{profile.location}</td>
                    <td>{profile.role}</td>
                    <td>
                      <button className="mini-btn" onClick={() => handleEdit(profile)}>Edit</button>
                      <button className="mini-btn" style={{ marginLeft: 6 }} onClick={() => handleDelete(profile.id)}>Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}