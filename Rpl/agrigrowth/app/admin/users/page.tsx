"use client";

// Import library dan fungsi utilitas API admin yang dibutuhkan
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/app/admin/_lib/adminApi";

// Definisi tipe data untuk data pengguna dari Supabase, perannya (role), dan profilnya
type SupabaseUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  user_metadata?: { name?: string | null } | null;
};

type RoleRow = { user_id: string; role: string | null };
type ProfileRow = { id: string; name?: string | null };

// State awal untuk formulir input pengguna baru
const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "user",
};

// Komponen utama halaman Kelola Pengguna (Admin)
export default function AdminUsersPage() {
  // State management untuk menyimpan daftar user, roles, profil, loading, error, formulir, dan ID user yang sedang diedit
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  // useMemo untuk memetakan peran (role) pengguna berdasarkan user_id secara efisien
  const roleMap = useMemo(() => {
    return new Map(roles.map((row) => [row.user_id, row.role || "user"]));
  }, [roles]);

  // useMemo untuk memetakan nama pengguna dari profil berdasarkan id pengguna secara efisien
  const nameMap = useMemo(() => {
    return new Map(profiles.map((row) => [row.id, row.name || ""]));
  }, [profiles]);

  // Fungsi untuk memuat seluruh daftar pengguna, peran, dan profil dari API admin
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch("/api/admin/users");
      setUsers(data.users || []);
      setRoles(data.roles || []);
      setProfiles(data.profiles || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  };

  // Memuat data saat pertama kali halaman di-render
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadUsers();
    })();
    return () => { mounted = false; };
  }, []);

  // Handler untuk menyimpan data pengguna baru atau memperbarui data pengguna yang ada (PATCH/POST)
  const handleSubmit = async () => {
    if (!form.email) {
      setError("Email wajib diisi");
      return;
    }

    setError(null);
    try {
      if (editingId) {
        await adminFetch("/api/admin/users", {
          method: "PATCH",
          json: {
            id: editingId,
            email: form.email,
            password: form.password || undefined,
            name: form.name,
            role: form.role,
          },
        });
      } else {
        if (!form.password) {
          setError("Password wajib diisi untuk user baru");
          return;
        }
        await adminFetch("/api/admin/users", {
          method: "POST",
          json: {
            email: form.email,
            password: form.password,
            name: form.name,
            role: form.role,
          },
        });
      }

      setForm({ ...emptyForm });
      setEditingId(null);
      await loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal menyimpan pengguna");
    }
  };

  // Handler untuk memuat data pengguna terpilih ke formulir agar dapat diedit
  const handleEdit = (user: SupabaseUser) => {
    setEditingId(user.id);
    setForm({
      name: nameMap.get(user.id) || user.user_metadata?.name || "",
      email: user.email || "",
      password: "",
      role: roleMap.get(user.id) || "user",
    });
  };

  // Handler untuk menghapus data akun pengguna berdasarkan ID
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus user ini?")) return;
    setError(null);
    try {
      await adminFetch("/api/admin/users", { method: "DELETE", json: { id } });
      await loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal menghapus pengguna");
    }
  };

  // Menghitung total jumlah pengguna yang terdaftar
  const totalUsers = users.length;

  return (
    // Return JSX untuk merender UI Kelola Pengguna
    <>
      {/* Header Halaman dan Tombol Aksi Utama */}
      <div className="page-header">
        <div>
          <div className="page-title">Kelola Pengguna</div>
          <div className="page-sub">Kelola akun pengguna, status aktif, dan peran akses</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => setForm({ ...emptyForm })}><i className="ti ti-refresh"></i> Reset Form</button>
          <button className="btn btn-primary" onClick={handleSubmit}><i className="ti ti-device-floppy"></i> Simpan</button>
        </div>
      </div>

      {/* Tampilan pesan kesalahan jika ada */}
      {error && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", color: "var(--red)" }}>{error}</div>
        </div>
      )}

      {/* Grid Kiri (Ringkasan Statistik) dan Kanan (Form Input Pengguna) */}
      <div className="grid-equal" style={{ marginBottom: 14 }}>
        {/* Panel Ringkasan Jumlah Pengguna */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-users"></i> Ringkasan Pengguna</div>
          </div>
          <div className="stat-inline">
            <div className="stat-cell"><div className="stat-cell-num">{totalUsers}</div><div className="stat-cell-lbl">Total</div></div>
          </div>
        </div>
        {/* Panel Formulir Input User */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-user-plus"></i> Form Pengguna</div>
          </div>
          <div style={{ padding: "14px 16px", display: "grid", gap: 10 }}>
            <input className="form-input" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="form-input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="form-input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Pengguna */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><i className="ti ti-user-check"></i> Daftar Pengguna</div>
          <div className="panel-actions">
            <button className="mini-btn" onClick={loadUsers}>Refresh</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Bergabung</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5}>Belum ada pengguna</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="td-name">
                        <div className="avatar-sm">{(nameMap.get(user.id) || user.user_metadata?.name || user.email || "U").slice(0, 2).toUpperCase()}</div>
                        {nameMap.get(user.id) || user.user_metadata?.name || "Tanpa Nama"}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td><span className="badge blue">{roleMap.get(user.id) || "user"}</span></td>
                    <td style={{ color: "var(--text4)" }}>{user.created_at?.split("T")[0] || "-"}</td>
                    <td>
                      <button className="mini-btn" onClick={() => handleEdit(user)}>Edit</button>
                      <button className="mini-btn" style={{ marginLeft: 6 }} onClick={() => handleDelete(user.id)}>Hapus</button>
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