"use client";

// Import library dan fungsi utilitas API admin yang dibutuhkan
import { useEffect, useState } from "react";
import { adminFetch } from "@/app/admin/_lib/adminApi";

// Definisi tipe data untuk data pengguna, profil, tracker, dan biaya produksi
type AdminUser = { id: string; user_metadata?: { name?: string | null } | null; email?: string | null };
type SimpleProfile = { id: string; name?: string | null };
type TrackerRow = { id: string; user_id: string };

type ProductionCost = {
  id: string;
  tracker_id: string;
  date: string;
  category: string;
  description?: string | null;
  amount: number;
  created_at?: string | null;
};

// State awal formulir biaya produksi
const emptyForm = {
  tracker_id: "",
  date: "",
  category: "Bibit",
  description: "",
  amount: "",
};

// Kategori biaya produksi yang tersedia
const costCategories = [
  "Bibit", "Pupuk", "Obat-obatan/Pestisida", "Tenaga Kerja", "Sewa Alat", "Transportasi", "Lain-lain"
];

// Komponen utama halaman Kelola Biaya Produksi (Admin)
export default function AdminCostsPage() {
  // State untuk menyimpan daftar biaya, loading, error, formulir, dan ID entri yang sedang diedit
  const [costs, setCosts] = useState<ProductionCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Map untuk mempermudah pencarian nama profil dan pemetaan tracker ke user
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [trackerUserMap, setTrackerUserMap] = useState<Map<string, string>>(new Map());

  // Fungsi untuk mengambil data biaya, user, dan tracker secara paralel dari API admin
  const loadCosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [costData, userData, trackerData] = await Promise.all([
        adminFetch("/api/admin/costs"),
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/trackers")
      ]);
      setCosts(costData.costs || []);

      const profiles = userData.profiles || [];
      const users = userData.users || [];
      const newProfileMap = new Map<string, string>();
      
      users.forEach((u: AdminUser) => {
        const p = profiles.find((p: SimpleProfile) => p.id === u.id);
        newProfileMap.set(u.id, p?.name || u.user_metadata?.name || u.email || "User");
      });
      setProfileMap(newProfileMap);

      const trackers = trackerData.trackers || [];
      const newTrackerMap = new Map<string, string>();
      trackers.forEach((t: TrackerRow) => {
        newTrackerMap.set(t.id, t.user_id);
      });
      setTrackerUserMap(newTrackerMap);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal memuat daftar biaya");
    } finally {
      setLoading(false);
    }
  };

  // Memuat data saat pertama kali halaman di-render
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadCosts();
    })();
    return () => { mounted = false; };
  }, []);

  // Handler untuk menyimpan data biaya baru atau memperbarui data yang sudah ada (PATCH/POST)
  const handleSubmit = async () => {
    if (!form.tracker_id || !form.date || !form.category || !form.amount) {
      setError("tracker_id, tanggal, kategori, dan jumlah biaya wajib diisi");
      return;
    }

    setError(null);
    try {
      const payload = {
        tracker_id: form.tracker_id,
        date: form.date,
        category: form.category,
        description: form.description || null,
        amount: Number(form.amount),
      };

      if (editingId) {
        await adminFetch("/api/admin/costs", {
          method: "PATCH",
          json: { id: editingId, ...payload },
        });
      } else {
        await adminFetch("/api/admin/costs", {
          method: "POST",
          json: payload,
        });
      }

      setForm({ ...emptyForm, date: form.date }); // keep the date for convenience
      setEditingId(null);
      await loadCosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal menyimpan biaya");
    }
  };

  // Handler untuk memuat data item terpilih ke dalam formulir agar dapat diedit
  const handleEdit = (item: ProductionCost) => {
    setEditingId(item.id);
    setForm({
      tracker_id: item.tracker_id,
      date: item.date,
      category: item.category,
      description: item.description || "",
      amount: String(item.amount),
    });
  };

  // Handler untuk menghapus data biaya produksi berdasarkan ID
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus biaya produksi ini?")) return;
    setError(null);
    try {
      await adminFetch("/api/admin/costs", { method: "DELETE", json: { id } });
      await loadCosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Gagal menghapus biaya");
    }
  };

  // Menghitung total seluruh biaya yang tercatat
  const totalCost = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);

  return (
    // Return JSX untuk merender UI Kelola Biaya Produksi
    <>
      {/* Header Halaman dan Tombol Aksi Utama */}
      <div className="page-header">
        <div>
          <div className="page-title">Kelola Biaya Produksi</div>
          <div className="page-sub">Monitoring input biaya produksi untuk seluruh tracker</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => { setForm({ ...emptyForm }); setEditingId(null); }}><i className="ti ti-refresh"></i> Reset Form</button>
          <button className="btn btn-primary" onClick={handleSubmit}><i className="ti ti-device-floppy"></i> Simpan</button>
        </div>
      </div>

      {/* Tampilan pesan kesalahan jika ada */}
      {error && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", color: "var(--red)" }}>{error}</div>
        </div>
      )}

      {/* Grid Kiri (Ringkasan) dan Kanan (Form Input) */}
      <div className="grid-equal" style={{ marginBottom: 14 }}>
        {/* Panel Ringkasan Biaya */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-wallet"></i> Ringkasan Biaya Keseluruhan</div>
          </div>
          <div className="stat-inline">
            <div className="stat-cell">
              <div className="stat-cell-num">{costs.length}</div>
              <div className="stat-cell-lbl">Total Entri Data</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-num" style={{ color: "var(--green)" }}>Rp {totalCost.toLocaleString('id-ID')}</div>
              <div className="stat-cell-lbl">Total Nilai Biaya</div>
            </div>
          </div>
        </div>
        
        {/* Panel Formulir Input Data Biaya */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><i className="ti ti-edit"></i> Form Biaya Produksi</div>
          </div>
          <div style={{ padding: "14px 16px", display: "grid", gap: 10 }}>
            <input className="form-input" placeholder="ID Tracker" value={form.tracker_id} onChange={(e) => setForm({ ...form, tracker_id: e.target.value })} />
            <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {costCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input className="form-input" placeholder="Keterangan (opsional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input type="number" className="form-input" placeholder="Jumlah Biaya (Rp)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Tabel Daftar Biaya Produksi */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><i className="ti ti-list"></i> Daftar Biaya Produksi</div>
          <div className="panel-actions">
            <button className="mini-btn" onClick={loadCosts}>Refresh</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Tracker ID</th>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                <th>Jumlah (Rp)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>Loading...</td></tr>
              ) : costs.length === 0 ? (
                <tr><td colSpan={6}>Belum ada data</td></tr>
              ) : (
                costs.map((item) => {
                  const userId = trackerUserMap.get(item.tracker_id);
                  const userName = userId ? profileMap.get(userId) : "Unknown";
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div className="td-name">
                          <div className="avatar-sm" style={{ width: 24, height: 24, fontSize: 10 }}>{userName?.slice(0, 2).toUpperCase() || "?"}</div>
                          {userName}
                        </div>
                      </td>
                      <td style={{ color: "var(--text4)", fontSize: "12px" }}>{item.tracker_id.slice(0, 8)}...</td>
                      <td>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                      <td><span className="badge" style={{ background: "var(--bg3)", color: "var(--text)", padding: "4px 8px" }}>{item.category}</span></td>
                      <td style={{ color: "var(--text4)" }}>{item.description || "-"}</td>
                      <td style={{ fontWeight: 600 }}>{Number(item.amount).toLocaleString('id-ID')}</td>
                      <td>
                        <button className="mini-btn" onClick={() => handleEdit(item)}>Edit</button>
                        <button className="mini-btn" style={{ marginLeft: 6, color: "var(--red)" }} onClick={() => handleDelete(item.id)}>Hapus</button>
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
