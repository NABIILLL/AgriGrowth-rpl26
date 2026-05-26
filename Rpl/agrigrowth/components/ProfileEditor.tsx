'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getClerkSupabaseToken } from '@/lib/clerkSupabaseToken';
import type { UserProfile } from '@/hooks/useUser';

interface ProfileEditorProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
}

type ProfileForm = Partial<UserProfile>;
type FieldErrors = Partial<Record<'name' | 'phone' | 'location' | 'role' | 'bio', string>>;

const allowedRoles = new Set(['Petani', 'Agronomist', 'Peneliti', 'Penyuluh', 'Mahasiswa']);
const blockedBioWords = /\b(damn|anjing|bangsat|kontol|memek|tolol|goblok)\b/i;

const normalizeIndonesianPhone = (rawValue?: string | null) => {
  const raw = rawValue?.trim() || '';
  if (!raw) return { value: '', error: '' };

  const compact = raw.replace(/[\s().-]/g, '');
  let normalized = compact;

  if (normalized.startsWith('08')) {
    normalized = `+62${normalized.slice(1)}`;
  } else if (normalized.startsWith('628')) {
    normalized = `+${normalized}`;
  } else if (normalized.startsWith('8')) {
    normalized = `+62${normalized}`;
  } else if (normalized.startsWith('+6208')) {
    normalized = `+62${normalized.slice(4)}`;
  }

  if (!/^\+628\d{8,11}$/.test(normalized)) {
    return {
      value: normalized,
      error: 'Format telepon harus nomor HP Indonesia, contoh 081234567890 atau +6281234567890.',
    };
  }

  return { value: normalized, error: '' };
};

const validateProfileForm = (formData: ProfileForm) => {
  const errors: FieldErrors = {};
  const name = formData.name?.trim() || '';
  const phone = normalizeIndonesianPhone(formData.phone);
  const location = formData.location?.trim() || '';
  const role = formData.role?.trim() || '';
  const bio = formData.bio?.trim() || '';

  if (!name) {
    errors.name = 'Nama tidak boleh kosong.';
  } else if (name.length < 2) {
    errors.name = 'Nama minimal 2 karakter.';
  } else if (!/^[A-Za-zÀ-ÿ\s'.-]+$/.test(name)) {
    errors.name = 'Nama hanya boleh berisi huruf, spasi, titik, petik, atau tanda hubung.';
  }

  if (phone.error) {
    errors.phone = phone.error;
  }

  if (location && location.length < 2) {
    errors.location = 'Lokasi minimal 2 karakter.';
  }

  if (role && !allowedRoles.has(role)) {
    errors.role = 'Pilih peran dari daftar yang tersedia.';
  }

  if (bio) {
    if (bio.length < 10) {
      errors.bio = 'Bio minimal 10 karakter atau kosongkan saja.';
    } else if (bio.length > 200) {
      errors.bio = 'Bio maksimal 200 karakter.';
    } else if (blockedBioWords.test(bio)) {
      errors.bio = 'Bio tidak boleh berisi kata kasar.';
    }
  }

  return { errors, phone };
};

const firstError = (errors: FieldErrors) => Object.values(errors).find(Boolean) || '';

const saveProfile = async (token: string, payload: Partial<UserProfile>) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 14000);

  try {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || `Request failed (${response.status})`);
    }

    return result?.profile as Partial<UserProfile>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Menyimpan terlalu lama. Cek koneksi/Supabase lalu coba lagi.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export default function ProfileEditor({ isOpen, user, onClose }: ProfileEditorProps) {
  const [formData, setFormData] = useState<ProfileForm>({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    role: user?.role || '',
    bio: user?.bio || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const currentValidation = validateProfileForm(formData);
  const hasValidationError = Boolean(firstError(currentValidation.errors));

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? normalizeIndonesianPhone(value).value : value;
    if (name === 'phone') {
      setFormError('');
    }

    const nextForm = {
      ...formData,
      [name]: nextValue,
    };

    setFormData(nextForm);
    setFieldErrors(validateProfileForm(nextForm).errors);
    if (formError) {
      setFormError('');
    }
  };

  const errorFor = (field: keyof FieldErrors) => fieldErrors[field];

  const inputClassName = (field: keyof FieldErrors) =>
    `mt-2 w-full rounded-lg border bg-white px-4 py-2.5 text-[14px] text-[#365a1a] placeholder-[#c0c5ba] transition focus:outline-none focus:ring-2 disabled:opacity-50 ${
      errorFor(field)
        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
        : 'border-[#e0e5da] focus:border-[#6aa439] focus:ring-[#6aa439]/20'
    }`;

  const errorText = (field: keyof FieldErrors) => {
    const error = errorFor(field);
    if (!error) return null;

    return <p className="mt-1 text-[11px] text-red-600">{error}</p>;
  };

  const setSafeFormData = (nextData: ProfileForm) => {
    setFormData((prev) => ({
      ...prev,
      ...nextData,
    }));
  };

  // Save profile through the local API so the client request can be aborted cleanly.
  const handleSave = async () => {
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    if (!user?.id) {
      toast.error('User ID tidak ditemukan', { id: 'User ID tidak ditemukan' });
      return;
    }

    const { errors, phone } = validateProfileForm(formData);
    const message = firstError(errors);
    setFieldErrors(errors);
    if (message) {
      setFormError(message);
      toast.error(message, { id: message });
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    watchdog = setTimeout(() => {
      const message = 'Menyimpan terlalu lama. Cek koneksi/Supabase lalu coba lagi.';
      setIsSubmitting(false);
      setFormError(message);
      toast.error(message, { id: message });
    }, 15000);

    try {
      const token = await getClerkSupabaseToken();
      if (!token) {
        toast.error('Sesi login tidak ditemukan. Silakan login ulang.', { id: 'Sesi login tidak ditemukan. Silakan login ulang.' });
        return;
      }

      const profile = await saveProfile(token, {
        name: formData.name?.trim(),
        phone: phone.value || undefined,
        location: formData.location?.trim() || undefined,
        role: formData.role?.trim() || undefined,
        bio: formData.bio?.trim() || undefined,
      });

      const updatedUser: UserProfile = {
        id: user.id,
        name: profile?.name || formData.name?.trim() || user.name,
        email: user.email,
        phone: profile?.phone || phone.value,
        location: profile?.location || formData.location?.trim(),
        role: profile?.role || formData.role?.trim() || user.role,
        bio: profile?.bio || formData.bio?.trim(),
        created_at: profile?.created_at || user.created_at,
        updated_at: profile?.updated_at || new Date().toISOString(),
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedUser }));
      setSafeFormData({ phone: phone.value });

      toast.success('Profil berhasil disimpan', { id: 'Profil berhasil disimpan' });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      setFormError(message);
      toast.error(`Gagal menyimpan profil: ${message}`, { id: `Gagal menyimpan profil: ${message}` });
    } finally {
      if (watchdog) {
        clearTimeout(watchdog);
      }
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-[500px] rounded-2xl border border-[#e0e5da] bg-white p-6 shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 text-[#6a7f55] transition hover:text-[#365a1a] disabled:opacity-50"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <h2 className="text-[20px] font-semibold text-[#365a1a]">Edit Profil</h2>
        <p className="mt-1 text-[13px] text-[#6a7f55]">Perbarui informasi profil Anda</p>

        {/* Form */}
        <div className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6a7f55]">
              Nama Lengkap *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              disabled={isSubmitting}
              className={inputClassName('name')}
            />
            {errorText('name')}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6a7f55]">
              Telepon
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="+62 812-3456-789"
              disabled={isSubmitting}
              className={inputClassName('phone')}
            />
            <p className="mt-1 text-[11px] text-[#6a7f55]">Nomor 08... otomatis disimpan sebagai +62...</p>
            {errorText('phone')}
          </div>

          {/* Location */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6a7f55]">
              Lokasi
            </label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              placeholder="Kota, Provinsi"
              disabled={isSubmitting}
              className={inputClassName('location')}
            />
            {errorText('location')}
          </div>

          {/* Role */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6a7f55]">
              Peran
            </label>
            <select
              name="role"
              value={formData.role || ''}
              onChange={handleChange}
              disabled={isSubmitting}
              className={inputClassName('role')}
            >
              <option value="">Pilih peran...</option>
              <option value="Petani">Petani</option>
              <option value="Agronomist">Agronomist</option>
              <option value="Peneliti">Peneliti</option>
              <option value="Penyuluh">Penyuluh</option>
              <option value="Mahasiswa">Mahasiswa</option>
            </select>
            {errorText('role')}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6a7f55]">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              placeholder="Ceritakan tentang Anda..."
              disabled={isSubmitting}
              rows={3}
              className={inputClassName('bio')}
            />
            {errorText('bio')}
          </div>
        </div>

        {formError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700">
            {formError}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-[#e0e5da] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#365a1a] transition hover:bg-[#f4f4f4] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || hasValidationError}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#6aa439] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#5a9429] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
