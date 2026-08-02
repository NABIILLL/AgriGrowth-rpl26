# AgriGrowth Monitor

Platform web untuk membantu mahasiswa pertanian dan petani mencatat, memantau, serta menganalisis data budidaya tanaman. AgriGrowth Monitor mendukung komoditas padi, jagung, dan bawang merah dalam satu ruang kerja digital.

![Tampilan AgriGrowth Monitor](public/foto%20dashboard.png)

## Fitur utama

- **Growth tracker** — pencatatan pengamatan tanaman berkala, termasuk parameter fisik dan kondisi tanaman.
- **Riwayat dan visualisasi** — melihat data pengamatan terdahulu serta perkembangan tanaman dari waktu ke waktu.
- **Pengelolaan biaya** — mencatat dan memantau biaya budidaya.
- **Analisis penyakit berbasis foto** — mengunggah foto tanaman untuk memperoleh indikasi penyakit atau hama dan rekomendasi penanganan menggunakan Gemini.
- **Informasi cuaca** — cuaca saat ini, prakiraan tujuh hari, dan data per jam dari Open-Meteo; pengguna dapat memakai lokasi perangkat.
- **Ekspor laporan** — dukungan ekspor data/laporan ke PDF dan spreadsheet.
- **Autentikasi dan profil** — login pengguna melalui Clerk serta pengelolaan profil.
- **Panel admin** — pengelolaan pengguna, profil, tracker, pengamatan, dan biaya.

## Teknologi

| Kebutuhan | Teknologi |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Antarmuka | Tailwind CSS, Framer Motion, Lucide |
| Autentikasi | Clerk |
| Basis data | Supabase |
| Cuaca | Open-Meteo API |
| Analisis gambar | Google Gemini API |
| Laporan | jsPDF, html2canvas, SheetJS |

## Menjalankan secara lokal

### Prasyarat

- Node.js 20 atau lebih baru
- Akun dan proyek [Clerk](https://clerk.com/)
- Proyek [Supabase](https://supabase.com/)
- API key Gemini apabila fitur analisis penyakit akan digunakan

### Instalasi

1. Kloning repositori dan masuk ke direktorinya.

   ```bash
   git clone <URL_REPOSITORI>
   cd agrigrowth
   ```

2. Instal dependensi.

   ```bash
   npm install
   ```

3. Buat file `.env.local` berdasarkan konfigurasi berikut.

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   WEBHOOK_SECRET=whsec_...

   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   GEMINI_API_KEY=...
   ```

   `GEMINI_API_KEY` diperlukan untuk analisis penyakit. `WEBHOOK_SECRET` diperlukan apabila sinkronisasi pengguna Clerk melalui webhook diaktifkan. Jangan pernah mengunggah file `.env.local` atau service role key ke GitHub.

4. Siapkan tabel, relasi, dan kebijakan akses di Supabase sesuai skema proyek Anda, lalu konfigurasikan webhook Clerk ke endpoint berikut bila digunakan:

   ```text
   /api/webhooks/clerk
   ```

5. Jalankan server pengembangan.

   ```bash
   npm run dev
   ```

   Aplikasi tersedia di [http://localhost:3000](http://localhost:3000). Untuk menjalankan pada port 3000 secara eksplisit, gunakan `npm run dev:3000`.

## Perintah yang tersedia

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan aplikasi dalam mode pengembangan |
| `npm run dev:3000` | Menjalankan server pengembangan pada port 3000 |
| `npm run build` | Membuat build produksi |
| `npm run start` | Menjalankan build produksi |
| `npm run lint` | Memeriksa kualitas kode dengan ESLint |

## Struktur proyek

```text
app/                    Halaman, layout, dan API routes Next.js
├── admin/              Panel administrasi
├── api/                Endpoint aplikasi, webhook, dan integrasi
├── observation/        Formulir dan riwayat pengamatan
components/             Komponen antarmuka yang dapat digunakan ulang
hooks/                  React hooks untuk pengguna, cuaca, dan logout
lib/                    Klien Supabase, autentikasi, dan layanan cuaca
public/                 Aset gambar dan ikon
docs/                   Dokumentasi desain serta integrasi
scripts/                Skrip utilitas pengembangan
```

## Dokumentasi tambahan

- [Integrasi cuaca](docs/WEATHER_API_INTEGRATION.md)
- [Sistem desain](docs/DESIGN_SYSTEM.md)
- [Alur navigasi UI](docs/UI_NAVIGATION_FLOW.md)
- [Spesifikasi layar](docs/SCREEN_SPECIFICATIONS.md)

## Catatan keamanan

- Gunakan `SUPABASE_SERVICE_ROLE_KEY` hanya di sisi server.
- Batasi akses data melalui Row Level Security (RLS) Supabase sesuai peran pengguna.
- Validasi dan batasi ukuran file gambar sebelum mengirimkannya ke layanan analisis.
- Hasil analisis penyakit bersifat bantuan awal; tetap lakukan verifikasi dengan ahli pertanian sebelum mengambil tindakan di lapangan.
