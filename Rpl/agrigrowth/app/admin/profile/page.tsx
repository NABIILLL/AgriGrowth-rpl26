"use client";

import { useMemo, useState } from "react";
import { useUser, type UserProfile } from "@/hooks/useUser";

type ProfileForm = {
  name: string;
  phone: string;
  location: string;
  role: string;
  bio: string;
};

type SaveState = {
  type: "success" | "error";
  message: string;
} | null;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

const getInitials = (name: string) => {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "AD"
  ).toUpperCase();
};

const toForm = (user: UserProfile | null): ProfileForm => ({
  name: user?.name || "",
  phone: user?.phone || "",
  location: user?.location || "",
  role: user?.role || "admin",
  bio: user?.bio || "",
});

const withTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs = 15000) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Request timeout. Cek koneksi Supabase dan konfigurasi RLS profiles."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

const saveAdminProfile = async (payload: ProfileForm) => {
  const response = await withTimeout(
    fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
    12000
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || `Request failed (${response.status})`);
  }

  return result?.profile as UserProfile;
};

const normalizeIndonesianPhone = (rawValue?: string | null) => {
  const raw = rawValue?.trim() || "";
  if (!raw) return { value: "", error: "" };

  const compact = raw.replace(/[\s().-]/g, "");
  let normalized = compact;

  if (normalized.startsWith("08")) {
    normalized = `+62${normalized.slice(1)}`;
  } else if (normalized.startsWith("628")) {
    normalized = `+${normalized}`;
  } else if (normalized.startsWith("8")) {
    normalized = `+62${normalized}`;
  } else if (normalized.startsWith("+6208")) {
    normalized = `+62${normalized.slice(4)}`;
  }

  if (!/^\+628\d{8,11}$/.test(normalized)) {
    return {
      value: normalized,
      error: "Format telepon harus nomor HP Indonesia, contoh 081234567890 atau +6281234567890.",
    };
  }

  return { value: normalized, error: "" };
};

function AdminProfileForm({ user }: { user: UserProfile }) {
  const [form, setForm] = useState<ProfileForm>(() => toForm(user));
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(null);

  const hasChanges = useMemo(() => {
    const initial = toForm(user);
    return Object.keys(initial).some((key) => {
      const formKey = key as keyof ProfileForm;
      return form[formKey] !== initial[formKey];
    });
  }, [form, user]);

  const resetForm = () => {
    setForm(toForm(user));
    setSaveState(null);
  };

  const handleSave = async () => {
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    if (!form.name.trim()) {
      setSaveState({ type: "error", message: "Nama admin wajib diisi." });
      return;
    }

    const phone = normalizeIndonesianPhone(form.phone);
    if (phone.error) {
      setSaveState({ type: "error", message: phone.error });
      return;
    }

    setSaving(true);
    setSaveState(null);
    watchdog = setTimeout(() => {
      setSaving(false);
      setSaveState({
        type: "error",
        message: "Menyimpan terlalu lama. Cek koneksi/Supabase lalu coba lagi.",
      });
    }, 15000);

    try {
      const data = await saveAdminProfile({
        name: form.name.trim(),
        phone: phone.value,
        location: form.location.trim(),
        role: form.role.trim(),
        bio: form.bio.trim(),
      });

      const updatedUser: UserProfile = {
        id: data?.id || user.id,
        name: data?.name || form.name.trim(),
        email: user.email,
        phone: data?.phone || undefined,
        location: data?.location || undefined,
        role: data?.role || form.role.trim() || user.role,
        bio: data?.bio || undefined,
        created_at: data?.created_at || user.created_at,
        updated_at: data?.updated_at || new Date().toISOString(),
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: updatedUser }));
      setForm(toForm(updatedUser));
      setSaveState({ type: "success", message: "Profil admin berhasil diperbarui." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan profil admin.";
      setSaveState({ type: "error", message });
    } finally {
      if (watchdog) {
        clearTimeout(watchdog);
      }
      setSaving(false);
    }
  };

  return (
    <div className="admin-profile-grid">
      <section className="admin-profile-hero">
        <div className="admin-profile-avatar">{getInitials(user.name)}</div>
        <div className="admin-profile-main">
          <div className="admin-profile-kicker">Administrator Account</div>
          <h1>{user.name}</h1>
          <div className="admin-profile-email">{user.email || "Email belum tersedia"}</div>
          <div className="admin-profile-tags">
            <span className="badge green"><span className="badge-dot"></span> {user.role || "admin"}</span>
            <span className="badge blue"><span className="badge-dot"></span> Online</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="panel-title"><i className="ti ti-shield-lock"></i> Akses Admin</div>
        </div>
        <div className="admin-profile-meta">
          <div>
            <span>User ID</span>
            <strong>{user.id}</strong>
          </div>
          <div>
            <span>Bergabung</span>
            <strong>{formatDate(user.created_at)}</strong>
          </div>
          <div>
            <span>Terakhir Update</span>
            <strong>{formatDate(user.updated_at)}</strong>
          </div>
        </div>
      </section>

      <section className="panel admin-profile-form-panel">
        <div className="panel-header">
          <div className="panel-title"><i className="ti ti-edit"></i> Edit Profil Admin</div>
          <div className="panel-actions">
            <button className="mini-btn" onClick={resetForm} disabled={saving || !hasChanges}>Reset</button>
          </div>
        </div>
        <div className="admin-profile-form">
          <label>
            <span>Nama Admin</span>
            <input className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            <span>Telepon</span>
            <input
              className="form-input"
              value={form.phone}
              onChange={(event) => {
                const phone = normalizeIndonesianPhone(event.target.value);
                setSaveState(null);
                setForm({ ...form, phone: phone.value });
              }}
              placeholder="+6281234567890"
            />
          </label>
          <label>
            <span>Lokasi</span>
            <input className="form-input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </label>
          <label>
            <span>Jabatan Profil</span>
            <input className="form-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
          </label>
          <label className="admin-profile-wide">
            <span>Bio</span>
            <textarea className="form-input" rows={4} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          </label>

          {saveState && (
            <div className={`admin-profile-alert ${saveState.type}`}>
              {saveState.message}
            </div>
          )}

          <div className="admin-profile-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !hasChanges}>
              <i className={saving ? "ti ti-loader-2" : "ti ti-device-floppy"}></i>
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdminProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="panel">
        <div style={{ padding: "16px", color: "var(--text3)" }}>Loading profil admin...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="panel">
        <div style={{ padding: "16px", color: "var(--red)" }}>Sesi admin tidak ditemukan.</div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Profil Admin</div>
          <div className="page-sub">Kelola identitas admin tanpa keluar dari dashboard admin</div>
        </div>
      </div>

      <AdminProfileForm key={user.id} user={user} />
    </>
  );
}
