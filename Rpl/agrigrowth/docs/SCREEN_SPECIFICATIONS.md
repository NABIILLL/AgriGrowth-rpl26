# AgriGrowth - Screen Specifications & Technical Details

## Screen Specifications Template

For each screen, the following specifications are defined:

### Basic Info
- **Screen Name**: Display name for the screen
- **Route**: API/URL path
- **Purpose**: Main objective of the screen
- **Actors**: Who can access this screen
- **Device Support**: Mobile/Tablet/Desktop compatibility

### Layout Structure
- **Header**: Navigation and title
- **Main Content Area**: Primary interaction space
- **Sidebar**: Secondary navigation (if applicable)
- **Footer**: Additional actions or info

### Components Used
- **Form Components**
- **Data Display Components**
- **Navigation Components**
- **Notification Components**

### States
- **Empty State**: No data available
- **Loading State**: Data is being fetched
- **Error State**: Something went wrong
- **Success State**: Action completed successfully
- **Default State**: Normal operation

---

# DETAILED SCREEN SPECIFICATIONS

## SCREEN 1: Login & Authentication

### Basic Info
```
Screen Name: User Login
Route: /auth/login
Purpose: User authentication and session initiation
Actors: All users (authenticated and non-authenticated)
Device Support: All devices (Mobile, Tablet, Desktop)
```

### Layout Structure
```
┌───────────────────────────────────┐
│     AGRIGROWTH SYSTEM             │
│                                   │
│  Email                            │
│  [________________]               │
│                                   │
│  Password                         │
│  [________________]  [👁 Show]    │
│                                   │
│  [✓] Remember Me   [Forgot Pass]  │
│                                   │
│  [SIGN IN]                        │
│                                   │
│  Don't have account? [Sign Up]    │
│                                   │
└───────────────────────────────────┘
```

### Form Fields
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Email | Text | Yes | Valid email format |
| Password | Password | Yes | Min 8 characters |

### Actions
- **Sign In**: Submit login form
- **Sign Up**: Navigate to registration
- **Forgot Password**: Navigate to password recovery
- **Remember Me**: Store credentials locally (optional)

### Error Handling
- Invalid email/password combination
- Account does not exist
- Too many login attempts
- Network error

### Success Scenario
```
1. User enters valid credentials
2. System validates against database
3. Session token created
4. Redirect to Dashboard
5. Show welcome notification
```

---

## SCREEN 2: Sign Up / Registration

### Basic Info
```
Screen Name: User Registration
Route: /auth/signup
Purpose: New user account creation
Actors: Unregistered users
Device Support: All devices
```

### Layout Structure
```
┌───────────────────────────────────┐
│  CREATE NEW ACCOUNT               │
│                                   │
│  Full Name                        │
│  [________________]               │
│                                   │
│  Email                            │
│  [________________]               │
│  ℹ️ We'll send a confirmation     │
│                                   │
│  Phone Number                     │
│  [________________]               │
│                                   │
│  Password                         │
│  [________________]  [👁 Show]    │
│  Must have 8+ chars, 1 number    │
│                                   │
│  Confirm Password                 │
│  [________________]  [👁 Show]    │
│                                   │
│  Institution/Organization         │
│  [________________] (optional)    │
│                                   │
│  [✓] I agree to Terms of Service │
│                                   │
│  [CREATE ACCOUNT]                 │
│                                   │
│  Already have account? [Sign In] │
│                                   │
└───────────────────────────────────┘
```

### Form Fields
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Full Name | Text | Yes | Min 3 characters |
| Email | Text | Yes | Valid email, unique |
| Phone | Text | Yes | Valid format, 10+ digits |
| Password | Password | Yes | Min 8 chars, mixed case, 1 number |
| Confirm Password | Password | Yes | Must match password |
| Institution | Text | No | Max 100 chars |
| Terms | Checkbox | Yes | Must be checked |

### Validation Rules
- Password must contain: uppercase, lowercase, number
- Email must be unique in system
- Phone number must be valid Indonesian format
- Terms must be accepted

### Success Scenario
```
1. User fills all required fields
2. System validates each field
3. Sends confirmation email
4. Creates account in pending state
5. Redirects to email confirmation page
6. User clicks confirmation link
7. Account becomes active
8. Redirect to login with success message
```

---

## SCREEN 3: Dashboard / Home

### Basic Info
```
Screen Name: Main Dashboard
Route: /dashboard
Purpose: User home page with quick summary
Actors: All authenticated users
Device Support: All devices
```

### Layout Structure
```
Desktop:
┌──────────────────────────────────────────────────┐
│ AgriGrowth  [🔍]  [🔔]  [👤 Profile]  [≡]       │
├─────────────┬─────────────────────────────────────┤
│             │                                     │
│ Navigation  │  Content Area                       │
│ Sidebar     │  - Welcome message                  │
│             │  - Quick stats                      │
│             │  - Recent activity                  │
│             │  - Quick action cards               │
│             │                                     │
└─────────────┴─────────────────────────────────────┘

Mobile:
┌──────────────────────────────┐
│ ≡ AgriGrowth [🔔] [👤]      │
├──────────────────────────────┤
│                              │
│ Welcome, [User Name]!        │
│                              │
│ Quick Stats Cards (stacked)  │
│                              │
│ Quick Actions (vertical)     │
│                              │
│ Recent Activity              │
│                              │
└──────────────────────────────┘
```

### Dashboard Components
1. **Welcome Card**
   - Greeting with user name
   - Date and location
   - Current season info

2. **Stats Cards** (2x2 or 1x4 depending on view)
   - Active plants: Count
   - Data entries this week: Count
   - Pending harvests: Count
   - Alerts/Issues: Count

3. **Quick Action Buttons**
   - Add new plant
   - Record observation
   - View monitoring
   - Check weather

4. **Recent Activity Widget**
   - Latest 5 entries
   - Timestamp
   - Plant name
   - Brief action description

5. **Upcoming Events**
   - Harvest predictions coming due
   - Weather alerts
   - Maintenance reminders

### States
- **Loading**: Show skeleton cards while fetching data
- **Empty**: No plants yet - show onboarding guide
- **Error**: Failed to load data - show retry button

---

## SCREEN 4: Data Tanaman Management

### Basic Info
```
Screen Name: Plant Data Management
Route: /plants
Purpose: Manage crop/plant records
Actors: All authenticated users
Device Support: All devices
```

### Layout Structure
```
┌────────────────────────────────────┐
│ Data Tanaman              [≡]      │
├────────────────────────────────────┤
│                                    │
│ [+ Tambah Tanaman Baru]           │
│ Search: [_____________]   [Filter▼]│
│                                    │
│ Plant Cards (Grid/List view):      │
│ ┌──────────┐ ┌──────────┐          │
│ │ Padi     │ │ Jagung   │          │
│ │ IR-64    │ │ Bima-20  │          │
│ │ Vegetatif│ │ Generatif│          │
│ │ [✏️][🗑️] │ │ [✏️][🗑️] │          │
│ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐          │
│ │ Bawang   │ │ ...      │          │
│ │ Brebes   │ │          │          │
│ │ Siap     │ │          │          │
│ │ [✏️][🗑️] │ │          │          │
│ └──────────┘ └──────────┘          │
│                                    │
│ Showing 3 of 5 | [< 1 2 >]        │
│                                    │
└────────────────────────────────────┘
```

### Card Content (Per Plant)
```
Plant Name: [Bold, large]
Variety: [Secondary text]
Location: [Icon] Address
Plant Date: [Icon] Date
Status: [Badge - Vegetative/Generative/Harvest Ready]
Last Update: [Small text] Date time
Actions: [Edit] [Delete] [More...]
```

### Add/Edit Plant Modal
```
┌──────────────────────────────────┐
│ Tambah/Edit Data Tanaman  [✕]    │
├──────────────────────────────────┤
│                                  │
│ Nama Tanaman *                   │
│ [Dropdown: Padi/Jagung/Bawang]   │
│                                  │
│ Varietas *                       │
│ [Text input: Auto-complete]      │
│                                  │
│ Lokasi *                         │
│ [Dropdown: Select/Add new]       │
│                                  │
│ Tanggal Tanam *                  │
│ [Date picker]                    │
│                                  │
│ Luas Lahan (ha) *                │
│ [Number input: 0-100]            │
│                                  │
│ Catatan (opsional)               │
│ [Textarea: 0-500 chars]          │
│                                  │
│ [Simpan] [Batal]                 │
│                                  │
└──────────────────────────────────┘
```

### Features
- **Search**: By plant name, variety, location
- **Filter**: By status, plant type, date range
- **View Toggle**: Card view / List view
- **Sort**: By date, name, status
- **Bulk Actions**: Delete multiple (if selected)

### Plant Detail View
```
┌──────────────────────────────────┐
│ Padi - IR64 Detail   [Back]      │
├──────────────────────────────────┤
│                                  │
│ [Plant Image if available]       │
│                                  │
│ Details:                         │
│ • Variety: IR-64                 │
│ • Location: Bogor, Jawa Barat    │
│ • Plant Date: 01 Feb 2026        │
│ • Land Area: 0.5 ha              │
│ • Current Status: Vegetative     │
│ • Days in Stage: 45              │
│ • Total Observations: 8          │
│ • Last Update: 05 May 2026, 14:30│
│                                  │
│ [Edit] [View History] [Delete]   │
│                                  │
│ Associated Data:                 │
│ • Growth records: 8              │
│ • Disease logs: 0                │
│ • Weather events: 3              │
│                                  │
│ [View Growth Timeline]           │
│                                  │
└──────────────────────────────────┘
```

---

## SCREEN 5: Input Data Pertumbuhan

### Basic Info
```
Screen Name: Growth Data Input
Route: /observations/new
Purpose: Record plant growth measurements
Actors: All authenticated users
Device Support: All devices (optimized for mobile field use)
```

### Layout Structure
```
┌──────────────────────────────────┐
│ Input Data Pertumbuhan   [?]     │
├──────────────────────────────────┤
│                                  │
│ Pilih Tanaman: [Padi - IR64 ▼]   │
│                                  │
│ Fase: [Vegetative ▼]             │
│                                  │
│ Tanggal Pengamatan *             │
│ [Date Picker Today]              │
│ [+ Use current time]             │
│                                  │
│ Tinggi Tanaman (cm) *            │
│ [Number input]  [📏 Measure]     │
│                                  │
│ Jumlah Daun *                    │
│ [Number input]                   │
│                                  │
│ Jumlah Cabang                    │
│ [Number input]                   │
│                                  │
│ Diameter Batang (cm)             │
│ [Number input]                   │
│                                  │
│ Lebar Daun Terpanjang (cm)       │
│ [Number input]                   │
│                                  │
│ Catatan Kondisi (optional)       │
│ [Textarea: Max 500]              │
│                                  │
│ [+ Add Photo] [+ Add Attachment] │
│                                  │
│ [Simpan] [Batal] [Simpan & Lanjut]│
│                                  │
└──────────────────────────────────┘
```

### Form Validation Rules
| Field | Validation |
|-------|-----------|
| Plant | Required |
| Date | Required, not future |
| Height | Required, positive number, reasonable range (0-300) |
| Leaf Count | Required, positive number, reasonable range (0-100) |
| Branch Count | Optional, positive number |
| Stem Diameter | Optional, positive number (cm) |
| Leaf Width | Optional, positive number |
| Notes | Optional, max 500 chars |

### Auto-calculations
- **Days Since Planting**: Calculate from plant date
- **Growth Rate**: (Current - Previous) / Days
- **Estimated Phase Duration**: Based on typical crop timelines
- **Next Observation Reminder**: Set 7 days from today

### Success State
```
┌──────────────────────────────────┐
│            ✓                     │
│                                  │
│ Data Pertumbuhan Tersimpan      │
│                                  │
│ Tanggal: 05 Mei 2026             │
│ Tinggi: 45.5 cm ↑ (+2.5 cm)     │
│ Daun: 12 ↑ (+1)                  │
│                                  │
│ Auto-calculated:                 │
│ • Growth rate: 2.1 cm/hari       │
│ • Phase progress: 65%            │
│ • Next prediction update: Soon   │
│                                  │
│ [Lanjut Input] [Kembali Dashboard]│
│                                  │
└──────────────────────────────────┘
```

---

## SCREEN 6: Monitoring Grafik

### Basic Info
```
Screen Name: Growth Monitoring Dashboard
Route: /monitoring
Purpose: Visualize plant growth over time
Actors: All authenticated users
Device Support: All devices (charts responsive)
```

### Layout Structure
```
┌────────────────────────────────────────┐
│ Monitoring Grafik             [≡]     │
├────────────────────────────────────────┤
│                                        │
│ Pilih Tanaman: [Padi - IR64 ▼]        │
│ Filter Periode: [1 Bulan ▼]           │
│ [Export PDF] [Share] [Analisis Penuh] │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 📊 GRAFIK TINGGI TANAMAN           │ │
│ │                                    │ │
│ │ Cm  │                              │ │
│ │ 50  ├─────────●                    │ │
│ │ 40  ├──────●    \                  │ │
│ │ 30  ├───●    \   \                 │ │
│ │ 20  ├─●      \   ●                 │ │
│ │ 10  ├          ●                   │ │
│ │     ├─────────────────────         │ │
│ │     Feb  Mar  Apr  Mei              │ │
│ │                                    │ │
│ │ Tren: ↑ Meningkat (2.1 cm/hari)    │ │
│ │ Prediksi akhir bulan: 55 cm        │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 📊 GRAFIK JUMLAH DAUN              │ │
│ │ [Similar chart layout]              │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 📊 GRAFIK DIAMETER BATANG          │ │
│ │ [Similar chart layout]              │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [Lihat Analisis Lanjutan]             │
│                                        │
└────────────────────────────────────────┘
```

### Chart Features
- **Multiple Series**: Show multiple plants if selected
- **Time Range**: Custom or preset (1 week, 1 month, 3 months, all)
- **Legend**: Show/hide series
- **Hover Tooltip**: Show exact values at data point
- **Zoom**: Pinch/scroll to zoom (mobile)
- **Export**: Download as PNG/PDF
- **Print**: Print-friendly view

### Analysis Panel
```
┌────────────────────────────────────┐
│ ANALISIS PERTUMBUHAN               │
├────────────────────────────────────┤
│                                    │
│ Periode: 01 Feb - 05 Mei (95 hari) │
│                                    │
│ Tinggi Tanaman:                    │
│ • Awal: 10 cm                      │
│ • Akhir: 45.5 cm                   │
│ • Total pertumbuhan: 35.5 cm       │
│ • Rata-rata: 0.37 cm/hari          │
│ • Tren: Meningkat → Stabil         │
│                                    │
│ Jumlah Daun:                       │
│ • Awal: 4                          │
│ • Akhir: 12                        │
│ • Total pertambahan: 8 daun        │
│ • Rata-rata: 0.08 daun/hari        │
│                                    │
│ Kesimpulan:                        │
│ ✓ Pertumbuhan normal untuk fase    │
│ ✓ Tidak ada penurunan anomali      │
│ ⚠️  Sedikit lebih lambat dari      │
│    rata-rata varietas (IR-64)      │
│                                    │
│ Rekomendasi:                       │
│ • Pastikan nutrisi cukup           │
│ • Cek ketersediaan air             │
│ • Monitor hama & penyakit          │
│                                    │
│ [Lanjutkan ke Prediksi Panen]      │
│ [Lihat Riwayat Lengkap]            │
│                                    │
└────────────────────────────────────┘
```

---

## SCREEN 7: Prediksi Panen

### Basic Info
```
Screen Name: Harvest Prediction
Route: /predictions/harvest
Purpose: Estimate harvest date and yield
Actors: All authenticated users
Device Support: All devices
```

### Layout Structure
```
┌────────────────────────────────────┐
│ Prediksi Panen          [≡]       │
├────────────────────────────────────┤
│                                    │
│ Pilih Tanaman: [Padi - IR64 ▼]    │
│                                    │
│ ┌──────────────────────────────────┐ │
│ │ 📊 ESTIMASI PANEN                │ │
│ │                                  │ │
│ │ 📅 Tanggal Perkiraan:            │ │
│ │    15 Juni 2026 - 22 Juni 2026   │ │
│ │    Waktu tersisa: 41 hari        │ │
│ │    ⏳ ████████░░░░░░░ 73%        │ │
│ │                                  │ │
│ │ 📦 Perkiraan Hasil:              │ │
│ │    8.5 - 9.2 ton/ha              │ │
│ │    Confidence: 85% ⭐⭐⭐⭐▭    │ │
│ │                                  │ │
│ │ 🌱 Status Tanaman:               │ │
│ │    Fase: Generatif (21 hari)     │ │
│ │    Kondisi: Optimal              │ │
│ │    Health Score: 8.5/10          │ │
│ │                                  │ │
│ │ ⚠️  Data Basis:                   │ │
│ │    • 8 pengamatan terdokumentasi │ │
│ │    • Rata-rata pertumbuhan       │ │
│ │      stabil 2.1 cm/hari          │ │
│ │    • Model prediksi: Linier +    │ │
│ │      AI (XGBoost)                │ │
│ │                                  │ │
│ │ Note: Akurasi dapat berkurang    │ │
│ │ jika ada perubahan lingkungan    │ │
│ │ atau serangan hama mendadak      │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                    │
│ 💡 REKOMENDASI PANEN:              │
│ ✓ Persiapkan lahan untuk panen     │ │
│ ✓ Cek ketersediaan alat & tenaga   │ │
│ ✓ Tinjau ramalan cuaca             │ │
│ ⚠️  Hindari stress tanaman         │ │
│                                    │
│ 🌦️ FAKTOR CUACA:                   │
│ • Prakiraan hujan Mei: 40%         │ │
│ • Juni: Musim kering dimulai      │ │
│ • Optimal untuk pemanenan          │ │
│                                    │
│ [Simpan Prediksi] [Bagikan]       │ │
│ [Lihat Detail Analisis]           │ │
│ [Riwayat Prediksi Sebelumnya]     │ │
│                                    │
└────────────────────────────────────┘
```

### Prediction Metrics
```
Harvest Date:
- Early Estimate (conservative)
- Mid Estimate (most likely)
- Late Estimate (optimistic)
- Confidence %

Yield Prediction:
- Low estimate
- Mid estimate
- High estimate
- Unit (kg/ton/number)

Factors Considered:
- Current growth rate
- Historical data for variety
- Growth phase duration
- Environmental factors
- Observed anomalies
```

### Detailed Analysis View
```
┌────────────────────────────────────┐
│ Prediksi Panen - Detail            │
├────────────────────────────────────┤
│                                    │
│ Metodologi Perhitungan:            │
│ • Model: Linier + Machine Learning │ │
│ • Akurasi historis: 82%            │
│ • Training data: 150+ records      │ │
│                                    │
│ Fase Pertumbuhan:                  │
│ 1. Vegetatif: 0-45 hari            │ │
│    ✓ Selesai: 43 hari              │ │
│                                    │
│ 2. Generatif: 45-90 hari           │ │
│    ⏳ Saat ini: 21/45 hari         │ │
│    Perkiraan selesai: 65 hari      │ │
│                                    │
│ 3. Panen: 90-110 hari              │ │
│    Perkiraan: 110-120 hari         │ │
│                                    │
│ Grafik Timeline:                   │
│ [Timeline visualization]           │ │
│                                    │
│ [Kembali]                          │ │
│                                    │
└────────────────────────────────────┘
```

---

## SCREEN 8: Deteksi Penyakit

### Basic Info
```
Screen Name: Plant Disease Detection
Route: /disease-detection
Purpose: Diagnose plant diseases based on symptoms
Actors: All authenticated users
Device Support: All devices (mobile optimized for field use)
```

### Layout Structure (Symptom Input)
```
┌────────────────────────────────────┐
│ Deteksi Penyakit        [≡]       │
├────────────────────────────────────┤
│                                    │
│ Pilih Tanaman: [Padi - IR64 ▼]    │
│                                    │
│ GEJALA YANG DIAMATI:               │
│                                    │
│ Gejala Daun:                       │
│ ☐ Daun menguning (kuning pucat)   │ │
│ ☐ Daun menguning (kuning karena   │ │
│   nitrogen rendah)                 │ │
│ ☑ Bercak coklat pada daun         │ │
│ ☑ Tepi daun keriting               │
│ ☐ Daun layu/kering                │ │
│ ☐ Permukaan daun berbintik putih  │ │
│ ☐ Lain-lain: [Text input]         │ │
│                                    │
│ Gejala Batang:                     │
│ ☐ Batang membusuk                 │ │
│ ☐ Batang terdapat bercak           │ │
│ ☐ Batang pecah/retak               │ │
│ ☐ Lain-lain: [Text input]         │ │
│                                    │
│ Gejala Umum:                       │
│ ☐ Pertumbuhan lambat               │ │
│ ☐ Tanaman layu                     │ │
│ ☐ Akar membusuk                    │ │
│ ☐ Lain-lain: [Text input]         │ │
│                                    │
│ Tingkat Keparahan:                 │
│ [Ringan ▼] (25% area terserang)   │ │
│                                    │
│ Foto Tanaman (opsional):           │ │
│ [📷 Ambil Foto] [📁 Pilih File]   │ │
│ [Preview jika ada]                │ │
│                                    │
│ Catatan Tambahan:                  │
│ ┌────────────────────────────────┐ │ │
│ │ Gejala mulai terlihat 3 hari   │ │ │
│ │ lalu, menyebar cepat           │ │ │
│ └────────────────────────────────┘ │ │
│                                    │
│ [Batal]  [Analisis Sekarang]      │ │
│                                    │
└────────────────────────────────────┘
```

### Layout Structure (Results Page)
```
┌────────────────────────────────────┐
│ Hasil Deteksi Penyakit             │
├────────────────────────────────────┤
│                                    │
│ ⚠️  TOP 3 DIAGNOSIS:                │
│                                    │
│ 1. BLAST (LEAF SPOT) - 92%        │
│    ┌──────────────────────────────┐│
│    │ 🦠 Penyakit: Pyricularia     ││
│    │    oryzae (Fungi)            ││
│    │                              ││
│    │ 🌡️  Kondisi Ideal:            ││
│    │    • Suhu: 28-30°C           ││
│    │    • Kelembaban: >90%        ││
│    │    • Musim: Hujan            ││
│    │                              ││
│    │ 📊 Dampak: TINGGI            ││
│    │    • Dapat mengurangi hasil  ││
│    │      hingga 50%              ││
│    │                              ││
│    │ 🔬 Gejala cocok 100%:        ││
│    │    ✓ Bercak coklat          ││
│    │    ✓ Tepi gelang            ││
│    │    ✓ Penyebaran cepat        ││
│    │                              ││
│    │ ⏱️  Tindakan SEGERA:           ││
│    │    1. Singkirkan daun        ││
│    │       terserang              ││
│    │    2. Aplikasi fungisida:    ││
│    │       • Karbamat (Propineb)  ││
│    │       • Triazol (Hex)        ││
│    │       • Dosis: sesuai label  ││
│    │       • Interval: 7-10 hari ││
│    │    3. Kurangi irigasi        ││
│    │    4. Tingkatkan aerasi      ││
│    │                              ││
│    │ 📋 Penanganan Terpadu:       ││
│    │    • Varietal resistance:    ││
│    │      ganti ke IR-72          ││
│    │    • Agronomic: spacing,     ││
│    │      nutrisi seimbang        ││
│    │    • Environment: ventilasi  ││
│    │                              ││
│    │ ☑ [Simpan Diagnosis]         ││
│    │                              ││
│    └──────────────────────────────┘│
│                                    │
│ 2. BLIGHT - 65%                   │ │
│    [Similar collapsed card]        │ │
│                                    │
│ 3. BROWN SPOT - 45%                │ │
│    [Similar collapsed card]        │ │
│                                    │
│ 📞 KONSULTASI DENGAN AHLI:         │
│ [Hubungi Penyuluh Pertanian]      │ │
│ [Chat dengan Expert]               │ │
│ [Cari Klinik Hewan Ternak]        │ │
│                                    │
│ 📚 REFERENSI LEBIH LANJUT:         │
│ [Panduan Penanganan Blast]        │ │
│ [Video Aplikasi Fungisida]        │ │
│ [Beli Produk Rekomendasi]         │ │
│                                    │
│ [Kembali] [Simpan Report]         │ │
│                                    │
└────────────────────────────────────┘
```

### Disease Cards Content
For each disease:
- Name and scientific name (if applicable)
- Confidence percentage
- Severity level
- Conditions that favor development
- Symptoms match overview
- Immediate actions
- Treatment options with dosages
- Prevention measures
- Impact on yield
- Alternative treatments
- Consultation option

---

## SCREEN 9: Informasi Cuaca

### Basic Info
```
Screen Name: Weather Information
Route: /weather
Purpose: Display weather data and agricultural forecasts
Actors: All authenticated users
Device Support: All devices
Source: Indonesian Meteorology & Geophysics Agency (BMKG) API
```

### Layout Structure
```
┌────────────────────────────────────┐
│ Informasi Cuaca         [≡]       │
├────────────────────────────────────┤
│                                    │
│ 📍 Bogor, Jawa Barat               │
│    [Ubah Lokasi] [📍 GPS]          │
│    Latitude: -6.57°, Longitude: ... │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ CUACA HARI INI (05 Mei 2026)   │ │
│ │                                │ │
│ │      ⛅                         │ │
│ │  Berawan Sebagian               │ │
│ │                                │ │
│ │  Suhu: 28°C (Range: 23-32°C)   │ │
│ │  Kelembaban: 72%                │ │
│ │  Tekanan Udara: 1012 mbar       │ │
│ │  Kecepatan Angin: 15 km/jam     │ │
│ │  Arah Angin: Barat Laut         │ │
│ │  UV Index: 7 (Tinggi)           │ │
│ │  Visibilitas: 10 km             │ │
│ │                                │ │
│ │  Probabilitas Hujan: 40%        │ │
│ │  Prediksi Hujan: 5-10 mm        │ │
│ │  ⏱️ Periode Berisiko: 16:00-20:00 │
│ │                                │ │
│ └────────────────────────────────┘ │
│                                    │
│ PRAKIRAAN 7 HARI:                  │
│ ┌────┬──────┬────┬────────────────┐│
│ │Day │ Icon │Temp│ Rain│ Note    ││
│ ├────┼──────┼────┼────────────────┤│
│ │ 6  │ 🌤  │28-31|20% │Cerah    ││
│ │ 7  │ ⛈  │26-28|80% │⚠️ HUJAN ││
│ │ 8  │ ⛈  │25-27|90% │⚠️ HUJAN ││
│ │ 9  │ 🌤  │28-31|30% │Cerah    ││
│ │ 10 │ ☀   │29-32|10% │Cerah    ││
│ │ 11 │ ☀   │30-33| 5% │Cerah    ││
│ │ 12 │ 🌤  │28-30|25% │Berawan  ││
│ └────┴──────┴────┴────────────────┘│
│                                    │
│ 🌾 DAMPAK UNTUK PERTANIAN:         │
│ • Padi (Vegetatif): ✓ Cocok untuk │
│   pemeliharaan & irigasi           │
│ • Jagung (Generatif): Kondisi baik │
│   untuk pengembangan buah           │
│ • Bawang (Siap): ⚠️ Waspadai      │
│   penyakit jamur dari hujan 7-8    │
│                                    │
│ 💧 KEBUTUHAN IRIGASI:              │
│ Konsumsi air: 5 mm/hari            │
│ Prakiraan hujan: 5 mm (hari 5)    │ │
│ Rekomendasi: Irrigasi sesuai norm  │
│                                    │
│ 🌱 FASE PENYAKIT:                  │
│ Fase risiko blast: TINGGI (7-8)   │ │
│ Fase risiko hawar bakteri: RENDAH  │
│ Fase risiko nematoda: SEDANG       │ │
│                                    │
│ 📊 Statistik Cuaca Musim Ini:      │
│ • Total hujan (Mei s/d Hari ini): │ │
│   145 mm (normal: 280 mm)          │ │
│ • Rata-rata suhu: 27.5°C           │ │
│ • Kelembaban rata-rata: 75%        │ │
│                                    │
│ 📡 Update: 05 Mei 2026, 14:30     │ │
│ Sumber: BMKG (Indonesia)           │ │
│                                    │
│ [Forecast Detail] [Set Alert]     │ │
│ [Historical Data] [Export]        │ │
│                                    │
└────────────────────────────────────┘
```

### Weather Alerts
```
🚨 ALERT TYPES:
1. Heavy Rain Warning
2. Strong Wind Warning
3. High Temperature Alert
4. Frost Warning
5. Disease Risk Alert

Each Alert Shows:
- Title
- Severity (Critical/High/Medium/Low)
- Duration
- Recommendations
- Dismiss option
```

---

## SCREEN 10: Admin - Kelola Pengguna

### Basic Info
```
Screen Name: User Management (Admin)
Route: /admin/users
Purpose: Manage user accounts and permissions
Actors: Admin only
Device Support: All devices (desktop optimized)
Permissions: Admin role required
```

### Layout Structure
```
┌─────────────────────────────────────┐
│ Kelola Pengguna (Admin)    [≡]     │
├─────────────────────────────────────┤
│                                     │
│ Filter: [All ▼]                    │
│ Search: [_______________]          │
│ [+ Tambah Pengguna]                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Stats:                          │ │
│ │ Total: 24 | Aktif: 22 | Baru: 2 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ DAFTAR PENGGUNA:                    │
│ ┌──────┬─────────┬──────┬──────────┐ │
│ │ Nama │ Email   │Role │ Status   ││
│ ├──────┼─────────┼──────┼──────────┤ │
│ │Budi  │budi@... │User │ ✓ Aktif  ││
│ │      │Bergabung: 10 Feb        ││
│ │      │Data: 3 | Input: 24       ││
│ │      │[✏️ Edit] [🗑️ Del] [⋮]   ││
│ ├──────┴─────────┴──────┴──────────┤ │
│ │Siti  │siti@... │User │ ✓ Aktif  ││
│ │      │Bergabung: 15 Feb        ││
│ │      │Data: 2 | Input: 18       ││
│ │      │[✏️ Edit] [🗑️ Del] [⋮]   ││
│ ├──────┴─────────┴──────┴──────────┤ │
│ │Rudi  │rudi@... │User │ ✕ Nonaktif││
│ │      │Bergabung: 01 Feb        ││
│ │      │Data: 1 | Input: 5        ││
│ │      │[✏️ Edit] [🗑️ Del] [⋮]   ││
│ └──────┴─────────┴──────┴──────────┘ │
│                                     │
│ [< Page 1 of 3 >]                   │
│                                     │
└─────────────────────────────────────┘
```

### Add User Modal
```
┌─────────────────────────────────────┐
│ Tambah Pengguna Baru       [✕]     │
├─────────────────────────────────────┤
│                                     │
│ Nama Lengkap *                      │
│ [________________]                  │
│                                     │
│ Email *                             │
│ [________________] @example.com     │
│ Check uniqueness: ✓ Available       │
│                                     │
│ Nomor Telepon *                     │
│ [________________]                  │
│ Format: +62... atau 0...            │
│                                     │
│ Peran (Role) *                      │
│ ○ User (Farmer/Student)             │
│ ○ Admin                             │
│                                     │
│ Institusi/Organisasi                │
│ [________________] (optional)       │
│                                     │
│ Status Awal                         │
│ ✓ Aktif                             │
│ ○ Nonaktif                          │
│                                     │
│ Notifikasi:                         │
│ ✓ Kirim email verifikasi            │
│ ✓ Generate password sementara       │
│                                     │
│ Password temporary akan dikirim via │
│ email dengan link reset password    │
│                                     │
│ [Batal] [Buat Akun]                 │
│                                     │
└─────────────────────────────────────┘
```

### Edit User Modal
```
┌─────────────────────────────────────┐
│ Edit Pengguna          [✕]         │
├─────────────────────────────────────┤
│                                     │
│ Nama Lengkap *                      │
│ [Budi Santoso]                      │
│                                     │
│ Email *                             │
│ [budi.santoso@email.com] (read-only)│
│                                     │
│ Nomor Telepon *                     │
│ [08123456789]                       │
│                                     │
│ Peran (Role) *                      │
│ ✓ User (Farmer/Student)             │
│ ○ Admin                             │
│                                     │
│ Institusi/Organisasi                │
│ [Kelompok Tani Subur]               │
│                                     │
│ Status Akun *                       │
│ ✓ Aktif                             │
│ ○ Nonaktif (Akses dibatasi)         │
│                                     │
│ Manajemen Password:                 │
│ [🔄 Send Password Reset Email]      │
│ Last reset: 02 May 2026, 10:15      │
│                                     │
│ Aktivitas:                          │
│ • Login terakhir: 05 May 14:22      │
│ • Total login: 23                   │
│ • Data tanaman: 3                   │
│ • Input pertumbuhan: 24             │
│ • Terakhir aktif: 05 Mei 2026       │
│                                     │
│ [Batal] [Simpan Perubahan]          │
│                                     │
└─────────────────────────────────────┘
```

### User Details View
```
┌─────────────────────────────────────┐
│ Detail Pengguna: Budi Santoso      │
├─────────────────────────────────────┤
│                                     │
│ 👤 INFORMASI DASAR                  │
│ • Nama: Budi Santoso                │
│ • Email: budi.santoso@email.com    │
│ • Telepon: 08123456789              │
│ • Role: User (Petani)               │
│ • Status: Aktif                     │
│ • Institusi: Kelompok Tani Subur   │
│                                     │
│ 📝 DATA STATISTIK                   │
│ • Bergabung: 10 Feb 2026            │
│ • Total login: 23                   │
│ • Login terakhir: 05 Mei 14:22      │
│ • Tanaman terdaftar: 3              │
│ • Input pertumbuhan: 24             │
│ • Report penyakit: 2                │
│                                     │
│ 🌱 TANAMAN YANG DIKELOLA:           │
│ 1. Padi - IR64 (Bogor)              │
│    • Observations: 12               │
│    • Status: Generatif              │
│                                     │
│ 2. Jagung - Bima20 (Indramayu)      │
│    • Observations: 8                │
│    • Status: Siap panen             │
│                                     │
│ 3. Bawang - Brebes (Cirebon)        │
│    • Observations: 4                │
│    • Status: Generatif              │
│                                     │
│ 🔐 KEAMANAN AKUN:                   │
│ • Password terakhir diubah: 02 Mei  │
│ • 2-FA: Tidak aktif                 │
│ • Sesi aktif: 1                     │
│ [Force Logout]                      │
│                                     │
│ ⚙️  AKSI:                            │
│ [✏️ Edit] [🔄 Reset Password]       │
│ [📧 Send Email] [🗑️ Delete Account]│
│ [⏸️ Suspend Account]                │
│                                     │
└─────────────────────────────────────┘
```

---

## RESPONSIVE DESIGN NOTES

### Mobile (320px - 768px)
- Single column layouts
- Hamburger menu navigation
- Larger touch targets (44px minimum)
- Simplified data tables (use cards instead)
- Date/time pickers optimized for touch
- Soft keyboard handling

### Tablet (769px - 1024px)
- Two column layouts
- Sidebar navigation (collapsible)
- Medium-sized cards
- Simplified charts with touch optimization

### Desktop (1025px+)
- Full navigation sidebar
- Multi-column grids
- Complex charts with hover interactions
- Keyboard shortcuts enabled
- Full-featured data tables

---

## Accessibility Requirements

- **Color Contrast**: WCAG AA minimum (4.5:1 for text)
- **Font Size**: Minimum 14px for body text
- **Interactive Elements**: 44px minimum touch target
- **Keyboard Navigation**: Tab-accessible all interactive elements
- **Screen Readers**: ARIA labels on icons, form labels
- **Focus Indicators**: Visible focus ring on all buttons
- **Error Messages**: Clear, associated with form fields
- **Loading States**: Announced to screen readers

---

## Performance Requirements

- **Page Load**: < 3 seconds on 4G
- **Chart Rendering**: < 1 second (charts.js or similar)
- **Form Submission**: < 2 seconds
- **Search/Filter**: < 500ms response
- **Image Optimization**: WebP with fallback
- **Code Splitting**: Route-based lazy loading

