# AgriGrowth UI Design System

## Color Palette

### Primary Colors
- **Primary Green**: `#10b981` - Used for main actions and highlights (agricultural theme)
- **Dark Green**: `#059669` - Used for hover states and secondary elements
- **Light Green**: `#d1fae5` - Used for backgrounds and borders

### Neutral Colors
- **Dark Gray**: `#1f2937` - Text and headers
- **Medium Gray**: `#6b7280` - Secondary text and borders
- **Light Gray**: `#f3f4f6` - Background surfaces
- **White**: `#ffffff` - Main background

### Semantic Colors
- **Success**: `#10b981` - Green
- **Warning**: `#f59e0b` - Amber
- **Danger**: `#ef4444` - Red
- **Info**: `#3b82f6` - Blue

## Typography

- **Headers**: Inter Bold, 24px (Titles), 20px (Subtitles), 16px (Section headers)
- **Body**: Inter Regular, 14px (Main text), 12px (Secondary text)
- **Buttons**: Inter Semi Bold, 14px

## Spacing System
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

## Component Library

### Button Variants
1. **Primary Button** - Green background, white text, rounded 8px
2. **Secondary Button** - Light green background, dark green text
3. **Danger Button** - Red background, white text
4. **Ghost Button** - No background, green text

### Input Fields
- Height: 40px
- Border: 1px solid light gray
- Rounded: 8px
- Focus: Border color changes to primary green

### Cards
- Border: 1px solid light gray
- Rounded: 12px
- Shadow: subtle (0 1px 3px rgba(0,0,0,0.1))
- Padding: 16px

---

# USE CASE DESIGNS

## 1️⃣ USE CASE 1: Kelola Data Tanaman (Manage Plant Data)

### Screen: Plant Data Management Dashboard

```
┌─────────────────────────────────────────┐
│  AgriGrowth  [≡ Menu]  [👤 Profile]    │
├─────────────────────────────────────────┤
│                                         │
│  Data Tanaman                          │
│  ─────────────────────────────────────│
│                                         │
│  [+ Tambah Tanaman Baru]               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Tanaman: Padi                   │   │
│  │ Varietas: IR-64                 │   │
│  │ Lokasi: Bogor, Jawa Barat       │   │
│  │ Tanggal Tanam: 01 Feb 2026      │   │
│  │ Status: Vegetatif               │   │
│  │                              [✏️][🗑️] │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Tanaman: Jagung                 │   │
│  │ Varietas: Bima-20               │   │
│  │ Lokasi: Indramayu, Jawa Barat   │   │
│  │ Tanggal Tanam: 15 Jan 2026      │   │
│  │ Status: Generatif               │   │
│  │                              [✏️][🗑️] │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Tanaman: Bawang Merah           │   │
│  │ Varietas: Brebes                │   │
│  │ Lokasi: Cirebon, Jawa Barat     │   │
│  │ Tanggal Tanam: 20 Dec 2025      │   │
│  │ Status: Panen Siap              │   │
│  │                              [✏️][🗑️] │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Screen: Add/Edit Plant Data Modal

```
┌─────────────────────────────────────┐
│  Tambah Data Tanaman        [✕]      │
├─────────────────────────────────────┤
│                                     │
│  Nama Tanaman *                     │
│  ┌─────────────────────────────────┐ │
│  │ Pilih: Padi / Jagung / Bawang   │ │
│  │ Merah                           │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Varietas *                         │
│  ┌─────────────────────────────────┐ │
│  │ Masukkan nama varietas          │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Lokasi Lahan *                     │
│  ┌─────────────────────────────────┐ │
│  │ Pilih provinsi / Buat lokasi baru│ │
│  └─────────────────────────────────┘ │
│                                     │
│  Tanggal Tanam *                    │
│  ┌─────────────────────────────────┐ │
│  │ 01/02/2026    [📅]              │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Luas Lahan (ha) *                  │
│  ┌─────────────────────────────────┐ │
│  │ 0.5                             │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Catatan (opsional)                 │
│  ┌─────────────────────────────────┐ │
│  │ Area cekungan, potensi banjir   │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│            [Batal]  [Simpan]       │
└─────────────────────────────────────┘
```

---

## 2️⃣ USE CASE 2: Input Data Pertumbuhan (Input Growth Data)

### Screen: Growth Data Input

```
┌─────────────────────────────────────┐
│  Input Data Pertumbuhan    [≡]     │
├─────────────────────────────────────┤
│                                     │
│  Pilih Tanaman:                     │
│  ┌─────────────────────────────────┐ │
│  │ Padi - IR64 (Bogor) ▼           │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Fase: Vegetatif                    │
│  [◆ Vegetatif] [○ Generatif] [○ Panen]│
│                                     │
│  Tanggal Pengamatan *               │
│  ┌─────────────────────────────────┐ │
│  │ 05/05/2026    [📅]              │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Tinggi Tanaman (cm) *              │
│  ┌─────────────────────────────────┐ │
│  │ 45.5                            │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Jumlah Daun *                      │
│  ┌─────────────────────────────────┐ │
│  │ 12                              │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Jumlah Cabang                      │
│  ┌─────────────────────────────────┐ │
│  │ 3                               │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Diameter Batang (cm)               │
│  ┌─────────────────────────────────┐ │
│  │ 0.8                             │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Catatan Kondisi                    │
│  ┌─────────────────────────────────┐ │
│  │ Tanaman sehat, tidak ada gejala │ │
│  │ penyakit                        │ │
│  └─────────────────────────────────┘ │
│                                     │
│       [Batal]  [Simpan & Lanjut]   │
└─────────────────────────────────────┘
```

### Screen: Growth Data Success Message

```
┌─────────────────────────────────────┐
│                                     │
│            ✓                        │
│                                     │
│   Data Pertumbuhan Tersimpan        │
│                                     │
│   Tanggal: 05/05/2026              │
│   Tinggi: 45.5 cm                  │
│   Jumlah Daun: 12                  │
│                                     │
│      [Lanjut Input] [Kembali]      │
│                                     │
└─────────────────────────────────────┘
```

---

## 3️⃣ USE CASE 3: Melihat Grafik Monitoring (View Monitoring Graphics)

### Screen: Growth Monitoring Dashboard

```
┌─────────────────────────────────────┐
│  Dashboard Monitoring     [≡]       │
├─────────────────────────────────────┤
│                                     │
│  Pilih Tanaman: [Padi - IR64 ▼]    │
│  Filter Periode: [1 Bulan ▼]       │
│                                     │
│  📊 GRAFIK TINGGI TANAMAN           │
│  ┌─────────────────────────────────┐ │
│  │  cm                             │ │
│  │ 50├─────────────●               │ │
│  │   │            / \              │ │
│  │ 40├───────●───/   \             │ │
│  │   │      / \─/     \            │ │
│  │ 30├────●/         ●─            │ │
│  │   │   /                         │ │
│  │ 20├●─/                          │ │
│  │   │/                            │ │
│  │ 10├                             │ │
│  │   └─────────────────────────    │ │
│  │   Feb Mar Apr Mei Jun            │ │
│  └─────────────────────────────────┘ │
│  Tren: ↑ Meningkat                  │
│                                     │
│  📊 GRAFIK JUMLAH DAUN              │
│  ┌─────────────────────────────────┐ │
│  │  daun                           │ │
│  │ 15├─────────────●               │ │
│  │   │            / \              │ │
│  │ 12├───────●───/   ●             │ │
│  │   │      / \ /                  │ │
│  │  9├────●/       \               │ │
│  │   │   /         ●               │ │
│  │  6├●─/                          │ │
│  │   │/                            │ │
│  │  3├                             │ │
│  │   └─────────────────────────    │ │
│  │   Feb Mar Apr Mei Jun            │ │
│  └─────────────────────────────────┘ │
│  Tren: ↑ Meningkat                  │
│                                     │
│  [Lihat Analisis Lanjutan]         │
│                                     │
└─────────────────────────────────────┘
```

---

## 4️⃣ USE CASE 4: Prediksi Panen (Harvest Prediction)

### Screen: Harvest Prediction

```
┌─────────────────────────────────────┐
│  Prediksi Panen      [≡]            │
├─────────────────────────────────────┤
│                                     │
│  Pilih Tanaman: [Padi - IR64 ▼]    │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  ⚠️  PREDIKSI PANEN              │ │
│  ├─────────────────────────────────┤ │
│  │                                 │ │
│  │  Estimasi Waktu Panen:          │ │
│  │  📅 15 Juni 2026 - 22 Juni 2026 │ │
│  │                                 │ │
│  │  Waktu Tersisa: 41 hari         │ │
│  │  ⏳ ███████████░░░░░░░░░░░  73%  │ │
│  │                                 │ │
│  │  Perkiraan Hasil Panen:         │ │
│  │  📦 8.5 - 9.2 ton/ha            │ │
│  │                                 │ │
│  │  Tingkat Kepercayaan: 85%       │ │
│  │  ⭐ ████████░░░  Tinggi         │ │
│  │                                 │ │
│  │  Kondisi Tanaman: Optimal       │ │
│  │  🌱 Status: Fase Generatif      │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│  💡 REKOMENDASI:                    │
│  • Pastikan drainase terjaga        │
│  • Pantau hama dan penyakit         │ │
│  • Jangan lakukan pemupukan kental  │
│                                     │
│  📊 Data Berdasarkan:               │
│  • 8 sampel pengamatan              │
│  • Fase generatif: 21 hari          │
│  • Rata-rata pertumbuhan: 2.1 cm/hr │
│                                     │
│  ⚠️  Akurasi mungkin terbatas jika  │
│  data terlalu sedikit atau ekstrim  │
│                                     │
│      [Detail Analisis] [Kembali]   │
│                                     │
└─────────────────────────────────────┘
```

---

## 5️⃣ USE CASE 5: Deteksi Penyakit Tanaman (Plant Disease Detection)

### Screen: Disease Detection Input

```
┌─────────────────────────────────────┐
│  Deteksi Penyakit      [≡]         │
├─────────────────────────────────────┤
│                                     │
│  Pilih Tanaman: [Padi - IR64 ▼]    │
│                                     │
│  GEJALA YANG DIAMATI:               │
│                                     │
│  ☐ Daun menguning                  │
│  ☑ Bercak coklat pada daun         │
│  ☑ Tepi daun keriting              │
│  ☐ Layu total                      │
│  ☐ Terdapat bubuk putih            │
│  ☐ Batang membusuk                 │
│  ☐ Akar membusuk                   │
│  ☐ Lain-lain:                      │
│    ┌─────────────────────────────┐ │
│    │ Hasil panen kurang berisi   │ │
│    └─────────────────────────────┘ │
│                                     │
│  Tingkat Keparahan: [Sedang ▼]     │
│                                     │
│  Foto Tanaman (opsional):          │
│  ┌─────────────────────────────────┐ │
│  │ [📷 Ambil Foto] [📁 Pilih File] │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Catatan Tambahan:                  │
│  ┌─────────────────────────────────┐ │
│  │ Gejala mulai terlihat 3 hari    │ │
│  │ lalu, menyebar cepat            │ │
│  └─────────────────────────────────┘ │
│                                     │
│    [Batal]  [Analisis Sekarang]   │
│                                     │
└─────────────────────────────────────┘
```

### Screen: Disease Detection Result

```
┌─────────────────────────────────────┐
│  Hasil Deteksi Penyakit             │
├─────────────────────────────────────┤
│                                     │
│  ⚠️  KEMUNGKINAN PENYAKIT:           │
│                                     │
│  1. BLAST (BERCAK COKLAT) - 92%    │
│     ┌─────────────────────────────┐ │
│     │ Penyakit: Pyricularia       │ │
│     │ Kondisi: Lembab, 28-30°C    │ │
│     │ Dampak: Tinggi              │ │
│     └─────────────────────────────┘ │
│     PENANGANAN:                     │
│     • Aplikasi fungisida: Karbamat  │
│       atau Triazol (2-3 hari)      │
│     • Kurangi irigasi              │
│     • Isolasi tanaman terserang    │
│     • Monitoring intensif           │
│                                     │
│  2. BLIGHT - 65%                   │
│     ┌─────────────────────────────┐ │
│     │ Penyakit: Xanthomonas       │ │
│     │ Kondisi: Basah, angin kuat  │ │
│     │ Dampak: Sedang              │ │
│     └─────────────────────────────┘ │
│     PENANGANAN:                     │
│     • Gunakan antibiotik nabati    │
│     • Singkirkan daun terserang    │
│     • Hindari kerja pada pagi hari │
│                                     │
│  3. BROWN SPOT - 45%                │
│     ┌─────────────────────────────┐ │
│     │ Penyakit: Cochliobolus      │ │
│     │ Kondisi: Stres tanaman      │ │
│     │ Dampak: Ringan              │ │
│     └─────────────────────────────┘ │
│     PENANGANAN:                     │
│     • Pupuk N sesuai dosis         │
│     • Tingkatkan aerasi            │
│     • Monitor kondisi umum         │
│                                     │
│  ⏱️  TINDAKAN SEGERA:                │
│  Aplikasikan fungisida hari ini    │
│  untuk mencegah penyebaran cepat   │
│                                     │
│  📞 HUBUNGI PENYULUH:               │
│  Jika gejala belum membaik setelah  │
│  5 hari pengobatan                 │
│                                     │
│  [Simpan Laporan] [Konsultasi]    │
│                                     │
└─────────────────────────────────────┘
```

---

## 6️⃣ USE CASE 6: Melihat Informasi Cuaca (View Weather Information)

### Screen: Weather Information

```
┌─────────────────────────────────────┐
│  Informasi Cuaca      [≡]           │
├─────────────────────────────────────┤
│                                     │
│  📍 Lokasi: Bogor, Jawa Barat       │
│             [Ubah Lokasi]           │
│                                     │
│  CUACA HARI INI (05 Mei 2026)      │
│  ┌─────────────────────────────────┐ │
│  │                                 │ │
│  │           ⛅                     │ │
│  │      Berawan Sebagian            │ │
│  │                                 │ │
│  │  Suhu: 28°C                     │ │
│  │  Kelembaban: 72%                │ │
│  │  Kecepatan Angin: 15 km/jam     │ │
│  │  Tekanan: 1012 mbar             │ │
│  │  UV Index: 7 (Tinggi)           │ │
│  │                                 │ │
│  │  Probabilitas Hujan: 40%        │ │
│  │  ⏱️ Periode risiko: 16:00-20:00  │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│  PRAKIRAAN 7 HARI KEDEPAN:          │
│  ┌────┬─────┬──────┬────────────┐   │
│  │Hari│Icon │Suhu  │ Hujan/Risiko│   │
│  ├────┼─────┼──────┼────────────┤   │
│  │ 6  │ 🌤  │27-30°│ 20%        │   │
│  │ 7  │ ⛈  │26-28°│ 80% ⚠️     │   │
│  │ 8  │ ⛈  │25-27°│ 90% ⚠️     │   │
│  │ 9  │ 🌤  │28-31°│ 30%        │   │
│  │10  │ ☀  │29-32°│ 10%        │   │
│  │11  │ ☀  │30-33°│ 5%         │   │
│  │12  │ 🌤  │28-30°│ 25%        │   │
│  └────┴─────┴──────┴────────────┘   │
│                                     │
│  💡 REKOMENDASI PERTANIAN:          │
│  • Hari ini: Cocok untuk penyiraman │
│  • 7-8 Mei: HINDARI aktivitas      │
│    intensif, siapkan drainase      │
│  • 9+ Mei: Kondisi ideal untuk     │
│    pemeliharaan                    │
│                                     │
│  🌾 DAMPAK UNTUK TANAMAN:           │
│  • Padi: Cuaca mendukung           │
│  • Jagung: Siapkan irigasi         │
│  • Bawang: Monitor penyakit jamur  │
│                                     │
│  📡 Update: 05 Mei 2026, 14:30     │
│     (Diperbarui dari BMKG)          │
│                                     │
│        [Detail Lengkap] [Notifikasi]│
│                                     │
└─────────────────────────────────────┘
```

---

## 7️⃣ USE CASE 7: Kelola Pengguna (Manage Users - Admin)

### Screen: User Management Dashboard (Admin)

```
┌─────────────────────────────────────┐
│  Kelola Pengguna (Admin) [≡]        │
├─────────────────────────────────────┤
│                                     │
│  Filter: [Status: Semua ▼]          │
│  Cari: ┌─────────────────────────┐  │
│        │ Ketik nama/email...     │  │
│        └─────────────────────────┘  │
│  [+ Tambah Pengguna]               │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ Pengguna Terdaftar: 24          │ │
│  │ Aktif: 22  | Nonaktif: 2       │ │
│  └─────────────────────────────────┘ │
│                                     │
│  DAFTAR PENGGUNA:                   │
│  ┌─────────────────────────────────┐ │
│  │ Nama         │Email       │Role │ │
│  ├─────────────────────────────────┤ │
│  │ Budi Santoso │budi@...    │User │ │
│  │ Status: ✓ Aktif                 │ │
│  │ Bergabung: 10 Feb 2026         │ │
│  │ Data Tanaman: 3 | Input: 24    │ │
│  │                        [✏️][🗑️][⋮] │
│  ├─────────────────────────────────┤ │
│  │ Siti Nurhaliza│siti@...    │User │ │
│  │ Status: ✓ Aktif                 │ │
│  │ Bergabung: 15 Feb 2026         │ │
│  │ Data Tanaman: 2 | Input: 18    │ │
│  │                        [✏️][🗑️][⋮] │
│  ├─────────────────────────────────┤ │
│  │ Rudi Hartono │rudi@...     │User │ │
│  │ Status: ✕ Nonaktif              │ │
│  │ Bergabung: 01 Feb 2026         │ │
│  │ Data Tanaman: 1 | Input: 5     │ │
│  │                        [✏️][🗑️][⋮] │
│  └─────────────────────────────────┘ │
│                                     │
│  [Halaman 1 ▼]  [< 1 2 3 ... >]   │
│                                     │
└─────────────────────────────────────┘
```

### Screen: Edit User Modal

```
┌─────────────────────────────────────┐
│  Edit Pengguna      [✕]             │
├─────────────────────────────────────┤
│                                     │
│  Nama Lengkap *                     │
│  ┌─────────────────────────────────┐ │
│  │ Budi Santoso                    │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Email *                            │
│  ┌─────────────────────────────────┐ │
│  │ budi.santoso@email.com          │ │
│  └─────────────────────────────────┘ │
│                                     │
│  No. Telepon                        │
│  ┌─────────────────────────────────┐ │
│  │ 08123456789                     │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Peran (Role) *                     │
│  ☑ User (Petani/Mahasiswa)         │
│  ☐ Admin                           │
│                                     │
│  Status Akun *                      │
│  ☑ Aktif                           │
│  ☐ Nonaktif (Akses dibatasi)       │
│                                     │
│  Reset Password                     │
│  [🔄 Kirim Link Reset Password]    │
│                                     │
│  Aktivitas Pengguna:                │
│  • Login terakhir: 05 Mei, 14:22    │
│  • Data tanaman: 3                  │
│  • Input pertumbuhan: 24            │
│  • Terakhir aktif: 05 Mei 2026      │
│                                     │
│            [Batal] [Simpan Perubahan]│
│                                     │
└─────────────────────────────────────┘
```

### Screen: Add New User Modal

```
┌─────────────────────────────────────┐
│  Tambah Pengguna Baru   [✕]         │
├─────────────────────────────────────┤
│                                     │
│  Nama Lengkap *                     │
│  ┌─────────────────────────────────┐ │
│  │ Masukkan nama lengkap           │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Email *                            │
│  ┌─────────────────────────────────┐ │
│  │ Masukkan email                  │ │
│  └─────────────────────────────────┘ │
│                                     │
│  No. Telepon *                      │
│  ┌─────────────────────────────────┐ │
│  │ Masukkan nomor telepon          │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Peran (Role) *                     │
│  ☑ User (Petani/Mahasiswa)         │
│  ☐ Admin                           │
│                                     │
│  Institusi / Kelompok Tani          │
│  ┌─────────────────────────────────┐ │
│  │ Kelompok Tani Subur             │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📧 Aksi Setelah Pendaftaran:       │
│  ☑ Kirim email verifikasi          │
│  ☑ Buat password default (random)  │
│                                     │
│  💡 Pengguna akan menerima email    │
│  dengan link verifikasi dan password│
│  sementara                          │
│                                     │
│       [Batal]  [Buat Akun]         │
│                                     │
└─────────────────────────────────────┘
```

---

## Navigation Structure

### Mobile Navigation
```
┌─────────────────────────────┐
│ Dashboard | More [≡]        │
├─────────────────────────────┤
│ Menu Items (Hamburger)      │
│ • Dashboard                 │
│ • Data Tanaman              │
│ • Input Data Pertumbuhan    │
│ • Monitoring Grafik         │
│ • Prediksi Panen            │
│ • Deteksi Penyakit          │
│ • Informasi Cuaca           │
│ • (Admin) Kelola Pengguna   │
│ • Profil                    │
│ • Pengaturan                │
│ • Logout                    │
└─────────────────────────────┘
```

### Desktop Sidebar Navigation
```
┌────────────────────────────────────┐
│ AGRIGROWTH                         │
├────────────────────────────────────┤
│ 📊 Dashboard                       │
│ 🌱 Data Tanaman                    │
│ 📝 Input Data Pertumbuhan          │
│ 📈 Monitoring Grafik               │
│ 🎯 Prediksi Panen                  │
│ 🔍 Deteksi Penyakit                │
│ ☁️  Informasi Cuaca                │
│                                    │
│ ADMIN                              │
│ 👥 Kelola Pengguna                 │
│                                    │
├────────────────────────────────────┤
│ ⚙️  Pengaturan                      │
│ ℹ️  Bantuan                        │
│ 📞 Hubungi Support                 │
│                                    │
│ [👤 Profile]                       │
│ [🔓 Logout]                        │
└────────────────────────────────────┘
```

---

## Responsive Design Breakpoints

- **Mobile**: 320px - 768px
  - Single column layouts
  - Touch-friendly buttons (48px min height)
  - Hamburger menu navigation

- **Tablet**: 769px - 1024px
  - Two column layouts
  - Sidebar + content
  
- **Desktop**: 1025px+
  - Full navigation sidebar
  - Multi-column layouts
  - Expanded data tables

---

## Interactive Elements Behavior

### Form Validation
- Real-time validation for critical fields
- Clear error messages in red
- Success checkmarks in green
- Helper text below inputs

### Loading States
- Skeleton loading for data fetching
- Spinner overlay for long operations
- Disable buttons during submission

### Notifications
- Toast notifications for quick feedback
- Modal dialogs for confirmation
- Inline error messages for forms

---

## Accessibility Guidelines

- Color contrast: WCAG AA standard minimum
- Font sizes: Minimum 14px for body text
- Keyboard navigation: All interactive elements accessible via Tab
- ARIA labels: Added to icons and buttons
- Alt text: All images have descriptive alt text

