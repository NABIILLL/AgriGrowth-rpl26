# Profile Edit Feature - Supabase Setup

## 📋 Fitur Baru

### ✅ Completed Features
1. **Edit Profile Modal** - Modal untuk mengedit informasi profil pengguna
2. **Realtime Sync** - Perubahan profil langsung tersinkronisasi ke semua halaman (realtime)
3. **Validasi Form** - Validasi pada form edit profil
4. **User Profile Storage** - Data profil disimpan di Supabase `profiles` table
5. **Auto-create Profile** - Profile otomatis dibuat/diupdate saat pengguna edit

## 🗄️ Supabase Setup Required

### SQL yang harus dijalankan di Supabase SQL Editor

Salin dan jalankan SQL berikut di **Supabase Dashboard → SQL Editor**:

```sql
-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  location TEXT,
  role TEXT DEFAULT 'Farmer',
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy - Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 4. Create RLS Policy - Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 5. Create RLS Policy - Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. Create trigger untuk auto-update timestamp
CREATE OR REPLACE FUNCTION update_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_timestamp();
```

### Verifikasi Setup
1. Pergi ke **Supabase Dashboard → Table Editor**
2. Cari table `profiles`
3. Cek kolom: `id`, `name`, `phone`, `location`, `role`, `bio`, `created_at`, `updated_at`
4. Pastikan **RLS Enabled** (lihat status di Table Editor)

## 📝 Code Changes

### 1. **hooks/useUser.ts** - Updated
- Mengubah `User` interface menjadi `UserProfile`
- Menambahkan fields: `phone`, `location`, `role`, `bio`, `created_at`, `updated_at`
- Fetch profile data dari `profiles` table saat user login
- Realtime subscription ke `profiles` table untuk live updates
- Sync ke localStorage otomatis

### 2. **components/ProfileEditor.tsx** - Created
- Form modal untuk edit profil
- Fields: nama, telepon, lokasi, peran, bio
- Validasi form (nama tidak boleh kosong)
- Auto-create atau update profile di Supabase
- Loading state saat menyimpan
- Toast notifications

### 3. **app/profile/page.tsx** - Updated
- Import `ProfileEditor` component
- Tampilkan actual user data dari hook (bukan hardcoded)
- Tambah tombol "Edit Profil" di header profil
- Display user role, phone, location, bio dari database

## 🔄 Realtime How It Works

1. User login → Hook fetch profile dari Supabase
2. User membuka profile page → Lihat data dari hook
3. User klik "Edit Profil" → Modal terbuka
4. User edit dan simpan → Simpan ke Supabase
5. Realtime subscription trigger → Update di hook
6. UI otomatis update di semua halaman yang pakai `useUser()`

## ✨ Next Steps

1. **Run Supabase SQL** - Salin SQL di atas ke Supabase SQL Editor dan jalankan
2. **Test Flow**:
   ```bash
   npm run dev
   ```
3. **Test Edit Profile**:
   - Login ke aplikasi
   - Klik "Edit Profil" (tombol di sebelah nama)
   - Edit informasi (nama, telepon, lokasi, peran, bio)
   - Klik "Simpan"
   - Cek realtime update di profile page

## 🐛 Troubleshooting

### Error: "Gagal menyimpan profil: relation 'public.profiles' does not exist"
- ✅ SQL belum dijalankan
- Jalankan SQL di Supabase SQL Editor

### Error: "Gagal menyimpan profil: new row violates row-level security policy"
- ✅ RLS policy belum di-create atau config salah
- Jalankan ulang SQL terutama bagian CREATE POLICY

### Profile tidak update realtime
- ✅ Periksa apakah Supabase realtime enabled di project
- Dashboard → Settings → Realtime → Enable untuk `profiles` table

## 📚 Database Schema

```
profiles table:
├── id (UUID) - PRIMARY KEY, references auth.users.id
├── name (TEXT)
├── phone (TEXT)
├── location (TEXT)
├── role (TEXT) - default: 'Farmer'
├── bio (TEXT)
├── created_at (TIMESTAMP WITH TIME ZONE)
└── updated_at (TIMESTAMP WITH TIME ZONE)
```

## 🎯 Features Integration dengan Fitur Existing

- ✅ Selaras dengan auth system (useUser hook)
- ✅ Realtime sync seperti growth logs edit/delete
- ✅ RLS policy pattern sama dengan trackers dan growth_logs
- ✅ Toast notifications sama dengan fitur lain
- ✅ UI design sesuai Agrigrowth design system
