"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/app/admin/_lib/adminApi";

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

const emptyForm = {
  id: "",
  name: "",
  phone: "",
  location: "",
  role: "",
  bio: "",
};

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      total: profiles.length,
    };
  }, [profiles]);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch("/api/admin/profiles");
      setProfiles(data.profiles || []);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

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
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan profile");
    }
  };

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

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus profile ini?")) return;
    setError(null);
    try {
      await adminFetch("/api/admin/profiles", { method: "DELETE", json: { id } });
      await loadProfiles();
    } catch (err: any) {
      setError(err?.message || "Gagal menghapus profile");
    }
  };

  return (
    <>
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

      {error && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", color: "var(--red)" }}>{error}</div>
        </div>
      )}

      <div className="grid-equal" style={{ marginBottom: 14 }}>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-id"></i> Ringkasan</div>
          </div>
          <div className="stat-inline">
            <div className="stat-cell"><div className="stat-cell-num">{stats.total}</div><div className="stat-cell-lbl">Total</div></div>
          </div>
        </div>
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