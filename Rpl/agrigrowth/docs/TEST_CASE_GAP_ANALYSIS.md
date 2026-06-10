# Analisis Gap Test Case AgriGrowth

Sumber pembanding:
- Dokumen test case: `LKP 12 - Software Testing - Kelompok 9.docx (1).pdf`
- Fitur aplikasi pada route `app/`, `app/api/`, dan halaman admin.

## Ringkasan Cakupan Saat Ini

Dokumen PDF berisi 54 test case dengan cakupan utama:

| Area | Status cakupan |
|---|---|
| Landing page | Sudah diuji |
| Login dan register | Sudah diuji, termasuk beberapa validasi negatif |
| Navbar dan About | Sudah diuji |
| Growth tracker dasar | Sudah diuji |
| Form analisis pertumbuhan | Sudah diuji |
| Hasil analisis dan overview lahan | Sudah diuji |
| Weather info | Sudah diuji |
| Logout dan session | Sudah diuji |
| Edit profil user | Sudah diuji sebagian |

Fitur yang sudah ada di kode tetapi belum atau belum cukup tercakup:

| Area fitur | Bukti fitur di aplikasi | Gap test case |
|---|---|---|
| Analisis penyakit tanaman | `app/analisis-penyakit/page.tsx`, `app/api/analisis-penyakit/route.ts` | Belum ada test case untuk pilih tanaman, pilih lahan, upload gambar, validasi file, hasil AI, rate limit, simpan riwayat penyakit |
| Riwayat pengamatan per sampel | `app/observation/[id]/history/page.tsx` | Belum ada test case untuk jumlah sampel, tambah sampel, input pengamatan sampel, validasi nilai sampel |
| Prediksi panen | `PredictionsSection` di halaman history | Belum ada test case untuk prediksi saat data cukup/tidak cukup |
| Biaya produksi user | Tab biaya di halaman history dan `app/api/observation/costs/route.ts` | Belum ada test case untuk tambah, edit, hapus, ringkasan biaya, kategori biaya |
| Export laporan | PDF dan Excel di halaman history | Belum ada test case untuk export berhasil dan kondisi data kosong |
| Admin dashboard | `app/admin/page.tsx` dan `app/admin/layout.tsx` | Belum ada test case untuk akses admin, sidebar, notifikasi, dashboard statistik |
| Admin CRUD users/profiles/trackers/growth logs/costs | `app/admin/users`, `profiles`, `trackers`, `observations`, `costs` | Belum ada test case CRUD admin |
| Authorization API | `requireUser`, `requireAdmin` di `app/api/admin/_utils.ts` | Belum ada test case akses 401/403 dan proteksi data milik user lain |
| Profile API validation | `app/api/profile/route.ts` | Baru diuji edit profil gagal; belum diuji validasi nomor telepon, bio, dan load profile |
| Clerk webhook | `app/api/webhooks/clerk/route.ts` | Belum ada test case signature webhook dan sinkronisasi user |

## Test Case Tambahan yang Disarankan

### Analisis Penyakit Tanaman

| No | Test Case | Deskripsi | Langkah-Langkah | Input | Output yang diharapkan | Actual Output | Status | Catatan |
|---:|---|---|---|---|---|---|---|---|
| 55 | TC_DIS_001 | Menguji tampilan halaman analisis penyakit | 1. Login. 2. Buka menu Analisis Penyakit. | User valid | Halaman menampilkan pilihan tanaman Padi, Jagung, dan Bawang Merah. | Belum diuji | Not Run | Test case baru |
| 56 | TC_DIS_002 | Menguji pemilihan jenis tanaman | 1. Buka halaman analisis penyakit. 2. Pilih Padi. | Tanaman: Padi | Kartu Padi aktif dan daftar lahan Padi milik user dimuat. | Belum diuji | Not Run | Test case baru |
| 57 | TC_DIS_003 | Menguji kondisi belum ada lahan untuk tanaman terpilih | 1. Login sebagai user tanpa lahan Padi. 2. Pilih Padi. | User tanpa tracker Padi | Muncul empty state dan link/tombol untuk membuat lahan di dashboard. | Belum diuji | Not Run | Test case baru |
| 58 | TC_DIS_004 | Menguji pemilihan lahan untuk menyimpan hasil analisis | 1. Pilih tanaman. 2. Pilih salah satu lahan. | Lahan valid | Sistem lanjut ke step upload foto dan nama lahan terpilih tampil. | Belum diuji | Not Run | Test case baru |
| 59 | TC_DIS_005 | Menguji upload gambar valid | 1. Pilih tanaman dan lahan. 2. Upload gambar JPG/PNG/WebP valid. | File tanaman valid di bawah 5 MB | Preview gambar tampil dan tombol analisis aktif. | Belum diuji | Not Run | Test case baru |
| 60 | TC_DIS_006 | Menguji validasi tipe file tidak didukung | 1. Pilih tanaman dan lahan. 2. Upload file PDF/TXT. | File: `.pdf` atau `.txt` | Muncul pesan "Format file tidak didukung. Gunakan JPG, PNG, atau WebP." | Belum diuji | Not Run | Test case baru |
| 61 | TC_DIS_007 | Menguji validasi ukuran file terlalu besar | 1. Pilih tanaman dan lahan. 2. Upload gambar lebih dari 5 MB. | File gambar > 5 MB | Muncul pesan "Ukuran file terlalu besar. Maksimal 5MB." | Belum diuji | Not Run | Test case baru |
| 62 | TC_DIS_008 | Menguji analisis berhasil untuk foto tanaman valid | 1. Upload foto tanaman valid. 2. Klik Analisis. | Foto tanaman sesuai jenis | Sistem menampilkan status, diagnosis, gejala, penyebab, solusi, pencegahan, dan urgensi. | Belum diuji | Not Run | Membutuhkan API Gemini aktif |
| 63 | TC_DIS_009 | Menguji foto bukan tanaman / bukan jenis tanaman yang dipilih | 1. Pilih Padi. 2. Upload foto benda/orang/tanaman lain. 3. Klik Analisis. | Foto tidak valid | Sistem menampilkan status "Foto Tidak Valid" dan instruksi upload ulang. | Belum diuji | Not Run | Test case baru |
| 64 | TC_DIS_010 | Menguji hasil analisis tersimpan ke riwayat lahan | 1. Jalankan analisis dengan tracker terpilih. 2. Buka detail/history lahan. | Hasil analisis valid | Riwayat penyakit menampilkan diagnosis, status, severity, urgency, dan waktu analisis. | Belum diuji | Not Run | Test case baru |
| 65 | TC_DIS_011 | Menguji rate limit AI | 1. Simulasikan response API 429. 2. Amati UI. | Response 429 dengan `retryAfter` | Tombol analisis disabled sementara dan countdown tampil. | Belum diuji | Not Run | Bisa diuji dengan mock API |
| 66 | TC_DIS_012 | Menguji API key Gemini belum dikonfigurasi | 1. Jalankan server tanpa `GEMINI_API_KEY`. 2. Kirim request analisis. | Env kosong | API mengembalikan error "API Key Gemini belum dikonfigurasi." dengan status 500. | Belum diuji | Not Run | Test API |

### Riwayat Pengamatan, Sampel, dan Prediksi

| No | Test Case | Deskripsi | Langkah-Langkah | Input | Output yang diharapkan | Actual Output | Status | Catatan |
|---:|---|---|---|---|---|---|---|---|
| 67 | TC_HIS_001 | Menguji halaman history memuat daftar tracker sesuai tanaman | 1. Login. 2. Buka `/observation/padi/history`. | User dengan tracker Padi | Daftar tracker Padi tampil dan tracker lain tidak tampil. | Belum diuji | Not Run | Test case baru |
| 68 | TC_HIS_002 | Menguji buat tracker dengan beberapa sampel awal | 1. Buka history tanaman. 2. Klik buat tracker. 3. Isi nama lahan dan 3 sampel. 4. Simpan. | Nama lahan, 3 sampel lengkap | Tracker baru tersimpan, sampel dibuat, dan chart awal tampil. | Belum diuji | Not Run | Test case baru |
| 69 | TC_HIS_003 | Menguji validasi nama lahan kosong saat membuat tracker | 1. Buka modal buat tracker. 2. Kosongkan nama lahan. 3. Simpan. | Nama lahan kosong | Muncul pesan "Nama lahan wajib diisi". | Belum diuji | Not Run | Test case baru |
| 70 | TC_HIS_004 | Menguji validasi sampel awal belum lengkap | 1. Isi nama lahan. 2. Kosongkan tinggi/jumlah daun pada salah satu sampel. 3. Simpan. | Sampel tidak lengkap | Muncul pesan detail field yang belum lengkap pada sampel terkait. | Belum diuji | Not Run | Test case baru |
| 71 | TC_HIS_005 | Menguji validasi nilai numerik sampel awal | 1. Isi sampel dengan pH > 14 atau tinggi negatif. 2. Simpan. | pH: 15 / tinggi: -1 | Muncul pesan "Nilai pada Sampel X tidak valid". | Belum diuji | Not Run | Test case baru |
| 72 | TC_HIS_006 | Menguji tambah sampel tanaman pada tracker yang sudah ada | 1. Pilih tracker. 2. Klik Tambah Sampel. | Tracker valid | Sampel baru dibuat, terpilih, dan modal input pengamatan muncul. | Belum diuji | Not Run | Test case baru |
| 73 | TC_HIS_007 | Menguji input pengamatan untuk sampel | 1. Pilih sampel. 2. Isi hari, tinggi, daun, cabang, pH, kondisi, pupuk, luas. 3. Simpan. | Data pengamatan valid | Data sample log tersimpan, growth log agregat diperbarui, chart berubah. | Belum diuji | Not Run | Test case baru |
| 74 | TC_HIS_008 | Menguji validasi pH pada input pengamatan sampel | 1. Isi pH 15 atau -1. 2. Simpan. | pH invalid | Muncul pesan "Masukkan nilai pH tanah yang valid (0-14)". | Belum diuji | Not Run | Test case baru |
| 75 | TC_HIS_009 | Menguji prediksi panen saat data belum cukup | 1. Buat tracker dengan hanya 1 titik pengamatan. 2. Buka tab pengamatan. | 1 data pengamatan | Muncul pesan bahwa data belum cukup untuk memprediksi panen. | Belum diuji | Not Run | Test case baru |
| 76 | TC_HIS_010 | Menguji prediksi panen saat data cukup | 1. Buat minimal 2 pengamatan. 2. Buka bagian prediksi. | Minimal 2 data tinggi | Sistem menampilkan perkiraan hari hingga panen, tanggal panen, estimasi hasil, dan kebutuhan pupuk. | Belum diuji | Not Run | Test case baru |
| 77 | TC_HIS_011 | Menguji hapus tracker dari halaman history | 1. Pilih tracker. 2. Klik hapus. 3. Konfirmasi. | Tracker valid | Tracker beserta data terkait terhapus dan daftar refresh. | Belum diuji | Not Run | Sebagian mirip PLT_005, tetapi level tracker |

### Biaya Produksi User

| No | Test Case | Deskripsi | Langkah-Langkah | Input | Output yang diharapkan | Actual Output | Status | Catatan |
|---:|---|---|---|---|---|---|---|---|
| 78 | TC_COST_001 | Menguji tampilan tab biaya produksi | 1. Buka detail/history tracker. 2. Klik tab Biaya. | Tracker valid | Tab biaya menampilkan ringkasan total biaya, kategori, dan tabel biaya. | Belum diuji | Not Run | Test case baru |
| 79 | TC_COST_002 | Menguji tambah biaya produksi | 1. Klik Tambah Biaya. 2. Isi tanggal, kategori, keterangan, nominal. 3. Simpan. | Kategori: Pupuk, nominal: 50000 | Biaya tersimpan, tabel bertambah, total biaya diperbarui. | Belum diuji | Not Run | Test case baru |
| 80 | TC_COST_003 | Menguji edit biaya produksi | 1. Pilih biaya. 2. Klik Edit. 3. Ubah nominal. 4. Simpan. | Nominal baru: 75000 | Data biaya diperbarui dan total biaya mengikuti nominal baru. | Belum diuji | Not Run | Test case baru |
| 81 | TC_COST_004 | Menguji hapus biaya produksi | 1. Pilih biaya. 2. Klik Hapus. 3. Konfirmasi. | ID biaya valid | Biaya terhapus dan total biaya berkurang. | Belum diuji | Not Run | Test case baru |
| 82 | TC_COST_005 | Menguji validasi field biaya kosong | 1. Klik Tambah Biaya. 2. Kosongkan nominal atau kategori. 3. Simpan. | Nominal kosong | Sistem menolak simpan dan menampilkan pesan error. | Belum diuji | Not Run | Test case baru |
| 83 | TC_COST_006 | Menguji akses biaya tracker milik user lain | 1. Login user A. 2. Panggil API biaya dengan `trackerId` milik user B. | Tracker user lain | API mengembalikan 403 atau pesan akses ditolak. | Belum diuji | Not Run | Test authorization |

### Export Laporan

| No | Test Case | Deskripsi | Langkah-Langkah | Input | Output yang diharapkan | Actual Output | Status | Catatan |
|---:|---|---|---|---|---|---|---|---|
| 84 | TC_EXP_001 | Menguji export PDF berhasil | 1. Pilih tracker dengan data pengamatan/biaya. 2. Klik menu export. 3. Pilih PDF. | Tracker berisi data | File PDF terunduh dan berisi ringkasan pengamatan, sampel, dan biaya. | Belum diuji | Not Run | Test case baru |
| 85 | TC_EXP_002 | Menguji export Excel berhasil | 1. Pilih tracker dengan data. 2. Klik menu export. 3. Pilih Excel. | Tracker berisi data | File XLSX terunduh dengan sheet data pengamatan, detail sampel, dan biaya. | Belum diuji | Not Run | Test case baru |
| 86 | TC_EXP_003 | Menguji export saat tidak ada data | 1. Pilih tracker kosong. 2. Klik export PDF/Excel. | Tracker tanpa data | Muncul pesan "Tidak ada data untuk di-export" dan tidak ada file dibuat. | Belum diuji | Not Run | Test case baru |

### Admin Panel dan Hak Akses

| No | Test Case | Deskripsi | Langkah-Langkah | Input | Output yang diharapkan | Actual Output | Status | Catatan |
|---:|---|---|---|---|---|---|---|---|
| 87 | TC_ADM_001 | Menguji admin dapat membuka dashboard admin | 1. Login sebagai admin. 2. Akses `/admin`. | Akun role admin | Dashboard admin tampil dengan sidebar, statistik, aktivitas, dan notifikasi. | Belum diuji | Not Run | Test case baru |
| 88 | TC_ADM_002 | Menguji user non-admin ditolak dari dashboard admin | 1. Login sebagai user biasa. 2. Akses `/admin`. | Akun role user | Muncul halaman "Akses Admin Dibatasi" dan tombol kembali ke dashboard. | Belum diuji | Not Run | Test case baru |
| 89 | TC_ADM_003 | Menguji API admin tanpa login | 1. Kirim request ke `/api/admin/users` tanpa token/session. | Tidak ada auth | API mengembalikan 401 Unauthorized. | Belum diuji | Not Run | Test API |
| 90 | TC_ADM_004 | Menguji API admin dengan user non-admin | 1. Login user biasa. 2. Panggil `/api/admin/users`. | Token user | API mengembalikan 403 Forbidden. | Belum diuji | Not Run | Test API |
| 91 | TC_ADM_005 | Menguji sidebar admin mobile | 1. Login admin. 2. Buka viewport mobile. 3. Klik menu. | Viewport mobile | Sidebar terbuka/tertutup, link admin dapat diklik, layout tidak overlap. | Belum diuji | Not Run | Test responsive |
| 92 | TC_ADM_006 | Menguji notifikasi admin | 1. Login admin. 2. Klik ikon notifikasi. | Data user/tracker/log tersedia | Dropdown menampilkan aktivitas terbaru dan link mengarah ke halaman terkait. | Belum diuji | Not Run | Test case baru |

### Admin CRUD Users

| No | Test Case | Deskripsi | Langkah-Langkah | Input | Output yang diharapkan | Actual Output | Status | Catatan |
|---:|---|---|---|---|---|---|---|---|
| 93 | TC_ADM_USER_001 | Menguji daftar pengguna tampil | 1. Login admin. 2. Buka `/admin/users`. | Admin valid | Tabel pengguna menampilkan nama, email, peran, tanggal bergabung. | Belum diuji | Not Run | Test case baru |
| 94 | TC_ADM_USER_002 | Menguji tambah pengguna oleh admin | 1. Isi nama, email, password, role. 2. Klik Simpan. | Email baru, password valid | User baru dibuat dan muncul di tabel. | Belum diuji | Not Run | Test case baru |
| 95 | TC_ADM_USER_003 | Menguji validasi tambah user tanpa email | 1. Kosongkan email. 2. Klik Simpan. | Email kosong | Muncul pesan "Email wajib diisi". | Belum diuji | Not Run | Test case baru |
| 96 | TC_ADM_USER_004 | Menguji validasi tambah user tanpa password | 1. Isi email user baru. 2. Kosongkan password. 3. Simpan. | Password kosong | Muncul pesan "Password wajib diisi untuk user baru". | Belum diuji | Not Run | Test case baru |
| 97 | TC_ADM_USER_005 | Menguji edit pengguna oleh admin | 1. Klik Edit pada user. 2. Ubah nama/role. 3. Simpan. | Role: admin/user | Data user dan role diperbarui di tabel. | Belum diuji | Not Run | Test case baru |
| 98 | TC_ADM_USER_006 | Menguji hapus pengguna oleh admin | 1. Klik Hapus pada user. 2. Konfirmasi. | User valid | User terhapus dari daftar. | Belum diuji | Not Run | Test case baru |

### Admin CRUD Profiles, Trackers, Growth Logs, dan Costs

| No | Test Case | Deskripsi | Langkah-Langkah | Input | Output yang diharapkan | Actual Output | Status | Catatan |
|---:|---|---|---|---|---|---|---|---|
| 99 | TC_ADM_PROF_001 | Menguji daftar profile admin tampil | 1. Login admin. 2. Buka `/admin/profiles`. | Admin valid | Tabel profiles menampilkan ID, nama, telepon, lokasi, role. | Belum diuji | Not Run | Test case baru |
| 100 | TC_ADM_PROF_002 | Menguji tambah profile oleh admin | 1. Isi ID dan nama. 2. Klik Simpan. | ID auth user valid, nama valid | Profile baru tersimpan dan tampil di tabel. | Belum diuji | Not Run | Test case baru |
| 101 | TC_ADM_PROF_003 | Menguji validasi profile tanpa ID/nama | 1. Kosongkan ID atau nama. 2. Simpan. | ID/nama kosong | Muncul pesan "ID dan nama wajib diisi". | Belum diuji | Not Run | Test case baru |
| 102 | TC_ADM_TRK_001 | Menguji daftar tracker admin tampil | 1. Login admin. 2. Buka `/admin/trackers`. | Admin valid | Tabel tracker menampilkan user, tracker, user ID, jenis tanaman, tanggal dibuat. | Belum diuji | Not Run | Test case baru |
| 103 | TC_ADM_TRK_002 | Menguji tambah tracker oleh admin | 1. Isi user_id, nama tracker, jenis tanaman. 2. Simpan. | Data tracker valid | Tracker baru dibuat dan muncul di tabel. | Belum diuji | Not Run | Test case baru |
| 104 | TC_ADM_TRK_003 | Menguji validasi tracker tanpa user_id/title | 1. Kosongkan user_id atau title. 2. Simpan. | Field wajib kosong | Muncul pesan "user_id dan title wajib diisi". | Belum diuji | Not Run | Test case baru |
| 105 | TC_ADM_OBS_001 | Menguji daftar growth logs admin tampil | 1. Login admin. 2. Buka `/admin/observations`. | Admin valid | Tabel growth logs, jumlah sample logs, dan tracker samples tampil. | Belum diuji | Not Run | Test case baru |
| 106 | TC_ADM_OBS_002 | Menguji tambah growth log oleh admin | 1. Isi tracker_id, day_number, dan data pengamatan. 2. Simpan. | Data valid | Growth log baru dibuat dan muncul di tabel. | Belum diuji | Not Run | Test case baru |
| 107 | TC_ADM_OBS_003 | Menguji validasi growth log tanpa tracker_id/day_number | 1. Kosongkan tracker_id atau day_number. 2. Simpan. | Field wajib kosong | Muncul pesan "tracker_id dan day_number wajib diisi". | Belum diuji | Not Run | Test case baru |
| 108 | TC_ADM_COST_001 | Menguji daftar biaya produksi admin tampil | 1. Login admin. 2. Buka `/admin/costs`. | Admin valid | Tabel biaya menampilkan user, tracker ID, tanggal, kategori, nominal. | Belum diuji | Not Run | Test case baru |
| 109 | TC_ADM_COST_002 | Menguji tambah biaya oleh admin | 1. Isi tracker_id, tanggal, kategori, nominal. 2. Simpan. | Data biaya valid | Biaya baru dibuat dan total biaya admin diperbarui. | Belum diuji | Not Run | Test case baru |
| 110 | TC_ADM_COST_003 | Menguji validasi biaya admin tanpa field wajib | 1. Kosongkan tracker_id/tanggal/kategori/amount. 2. Simpan. | Field wajib kosong | Muncul pesan "tracker_id, tanggal, kategori, dan jumlah biaya wajib diisi". | Belum diuji | Not Run | Test case baru |

### Profile dan Webhook

| No | Test Case | Deskripsi | Langkah-Langkah | Input | Output yang diharapkan | Actual Output | Status | Catatan |
|---:|---|---|---|---|---|---|---|---|
| 111 | TC_PRO_002 | Menguji halaman profil memuat data user | 1. Login. 2. Buka `/profile`. | User valid | Nama, role, kontak, lokasi, bio, dan statistik profil tampil. | Belum diuji | Not Run | Melengkapi TC_PRO_001 |
| 112 | TC_PRO_003 | Menguji validasi nomor telepon profil | 1. Buka edit profil. 2. Isi nomor tidak valid. 3. Simpan. | Telepon: `12345` | Muncul pesan format nomor HP Indonesia. | Belum diuji | Not Run | Test API/UI |
| 113 | TC_PRO_004 | Menguji validasi bio terlalu pendek | 1. Buka edit profil. 2. Isi bio kurang dari 10 karakter. 3. Simpan. | Bio: `Petani` | Muncul pesan "Bio minimal 10 karakter atau kosongkan saja." | Belum diuji | Not Run | Test API/UI |
| 114 | TC_WEBHOOK_001 | Menguji webhook Clerk tanpa signature | 1. Kirim POST ke `/api/webhooks/clerk` tanpa header Svix. | Payload user.created | API menolak request dengan error signature/header. | Belum diuji | Not Run | Test security |
| 115 | TC_WEBHOOK_002 | Menguji webhook Clerk user.created valid | 1. Kirim event `user.created` dengan signature valid. | Payload user Clerk valid | Supabase user/profile dibuat atau di-skip jika sudah ada, response 200. | Belum diuji | Not Run | Butuh secret webhook/mocking |

## Prioritas Eksekusi

Prioritas tinggi:
- TC_DIS_001 sampai TC_DIS_012, karena analisis penyakit adalah fitur utama yang belum diuji sama sekali.
- TC_ADM_001 sampai TC_ADM_004, karena menyangkut proteksi akses admin.
- TC_COST_001 sampai TC_COST_006, karena menyangkut data finansial dan ownership tracker.

Prioritas menengah:
- TC_HIS_001 sampai TC_HIS_011, karena fitur sampel dan prediksi memperluas growth tracker.
- TC_EXP_001 sampai TC_EXP_003, karena export rawan gagal di browser.

Prioritas rendah:
- TC_WEBHOOK_001 dan TC_WEBHOOK_002, kecuali webhook Clerk aktif dipakai di deployment.

