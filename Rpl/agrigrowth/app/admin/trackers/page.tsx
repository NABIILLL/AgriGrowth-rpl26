"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/app/admin/_lib/adminApi";

type Tracker = {
  id: string;
  user_id: string;
  title: string;
  plant_type?: string | null;
  created_at?: string | null;
};

const emptyForm = {
  user_id: "",
  title: "",
  plant_type: "",
};

export default function AdminTrackersPage() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadTrackers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch("/api/admin/trackers");
      setTrackers(data.trackers || []);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat tracker");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackers();
  }, []);

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
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan tracker");
    }
  };

  const handleEdit = (tracker: Tracker) => {
    setEditingId(tracker.id);
    setForm({
      user_id: tracker.user_id,
      title: tracker.title,
      plant_type: tracker.plant_type || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tracker ini?")) return;
    setError(null);
    try {
      await adminFetch("/api/admin/trackers", { method: "DELETE", json: { id } });
      await loadTrackers();
    } catch (err: any) {
      setError(err?.message || "Gagal menghapus tracker");
    }
  };

  return (
    <>
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

      {error && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", color: "var(--red)" }}>{error}</div>
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: 14 }}>
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

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-chart-bar"></i> Total Tracker</div>
          </div>
          <div className="stat-inline">
            <div className="stat-cell"><div className="stat-cell-num">{trackers.length}</div><div className="stat-cell-lbl">Total</div></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-search"></i> Cari Tracker</div>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <input className="form-input" placeholder="Nama tracker atau lahan" />
          </div>
        </div>
      </div>

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
                trackers.map((tracker) => (
                  <tr key={tracker.id}>
                    <td>{tracker.title}</td>
                    <td style={{ color: "var(--text4)" }}>{tracker.user_id}</td>
                    <td>{tracker.plant_type || "-"}</td>
                    <td style={{ color: "var(--text4)" }}>{tracker.created_at?.split("T")[0] || "-"}</td>
                    <td>
                      <button className="mini-btn" onClick={() => handleEdit(tracker)}>Edit</button>
                      <button className="mini-btn" style={{ marginLeft: 6 }} onClick={() => handleDelete(tracker.id)}>Hapus</button>
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