'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/hooks/useUser';

interface ProfileEditorProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
}

export default function ProfileEditor({ isOpen, user, onClose }: ProfileEditorProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    phone: '',
    location: '',
    role: '',
    bio: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        role: user.role || '',
        bio: user.bio || '',
      });
    }
  }, [user, isOpen]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save profile to Supabase
  const handleSave = async () => {
    if (!user?.id) {
      toast.error('User ID tidak ditemukan');
      return;
    }

    if (!formData.name?.trim()) {
      toast.error('Nama tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            name: formData.name?.trim(),
            phone: formData.phone?.trim(),
            location: formData.location?.trim(),
            role: formData.role?.trim(),
            bio: formData.bio?.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        console.error('Error saving profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        if (error.code === '42501' || /permission denied/i.test(error.message || '')) {
          toast.error('Supabase belum mengizinkan edit profile. Cek RLS policy pada tabel profiles.');
        } else {
          toast.error(`Gagal menyimpan profil: ${error.message || 'unknown'}`);
        }
        return;
      }

      const updatedUser: UserProfile = {
        id: user.id,
        name: data?.name || formData.name?.trim() || user.name,
        email: user.email,
        phone: data?.phone || formData.phone?.trim(),
        location: data?.location || formData.location?.trim(),
        role: data?.role || formData.role?.trim(),
        bio: data?.bio || formData.bio?.trim(),
        created_at: data?.created_at || user.created_at,
        updated_at: data?.updated_at || new Date().toISOString(),
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedUser }));

      toast.success('Profil berhasil disimpan');
      onClose();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error(`Gagal menyimpan profil: ${err?.message ?? 'unknown'}`);
    } finally {
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
              className="mt-2 w-full rounded-lg border border-[#e0e5da] bg-white px-4 py-2.5 text-[14px] text-[#365a1a] placeholder-[#c0c5ba] transition focus:border-[#6aa439] focus:outline-none focus:ring-2 focus:ring-[#6aa439]/20 disabled:opacity-50"
            />
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
              className="mt-2 w-full rounded-lg border border-[#e0e5da] bg-white px-4 py-2.5 text-[14px] text-[#365a1a] placeholder-[#c0c5ba] transition focus:border-[#6aa439] focus:outline-none focus:ring-2 focus:ring-[#6aa439]/20 disabled:opacity-50"
            />
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
              className="mt-2 w-full rounded-lg border border-[#e0e5da] bg-white px-4 py-2.5 text-[14px] text-[#365a1a] placeholder-[#c0c5ba] transition focus:border-[#6aa439] focus:outline-none focus:ring-2 focus:ring-[#6aa439]/20 disabled:opacity-50"
            />
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
              className="mt-2 w-full rounded-lg border border-[#e0e5da] bg-white px-4 py-2.5 text-[14px] text-[#365a1a] transition focus:border-[#6aa439] focus:outline-none focus:ring-2 focus:ring-[#6aa439]/20 disabled:opacity-50"
            >
              <option value="">Pilih peran...</option>
              <option value="Petani">Petani</option>
              <option value="Agronomist">Agronomist</option>
              <option value="Peneliti">Peneliti</option>
              <option value="Penyuluh">Penyuluh</option>
              <option value="Mahasiswa">Mahasiswa</option>
            </select>
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
              className="mt-2 w-full rounded-lg border border-[#e0e5da] bg-white px-4 py-2.5 text-[14px] text-[#365a1a] placeholder-[#c0c5ba] transition focus:border-[#6aa439] focus:outline-none focus:ring-2 focus:ring-[#6aa439]/20 disabled:opacity-50"
            />
          </div>
        </div>

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
            disabled={isSubmitting}
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
