# AgriGrowth - UI Component Library & Layout Templates

## 1. COMPONENT STRUCTURE

### Button Component
```tsx
// Primary Button
<button className="btn btn-primary">Simpan</button>

// Secondary Button
<button className="btn btn-secondary">Batal</button>

// Danger Button
<button className="btn btn-danger">Hapus</button>

// Small Button
<button className="btn btn-small">Ubah</button>
```

### Input Field Component
```tsx
// Text Input
<input type="text" placeholder="Masukkan nama" className="input" />

// Select Dropdown
<select className="input">
  <option>Pilih opsi</option>
</select>

// Date Input
<input type="date" className="input" />

// Textarea
<textarea placeholder="Masukkan catatan" className="input-lg"></textarea>
```

### Card Component
```tsx
<div className="card">
  <div className="card-header">
    <h3>Judul Card</h3>
  </div>
  <div className="card-body">
    Isi konten card
  </div>
  <div className="card-footer">
    Footer actions
  </div>
</div>
```

### Alert/Notification Component
```tsx
// Success Alert
<div className="alert alert-success">✓ Data tersimpan</div>

// Warning Alert
<div className="alert alert-warning">⚠️ Peringatan penting</div>

// Error Alert
<div className="alert alert-error">✕ Terjadi kesalahan</div>

// Info Alert
<div className="alert alert-info">ℹ️ Informasi tambahan</div>
```

---

## 2. PAGE LAYOUTS

### Dashboard Layout (Main Page)
```
┌──────────────────────────────────────────────┐
│ Header: Logo | Menu | Search | Profile       │
├──────────┬───────────────────────────────────┤
│          │                                   │
│ Sidebar  │ Main Content Area                 │
│          │ - Cards                           │
│          │ - Charts                          │
│          │ - Tables                          │
│          │ - Forms                           │
│          │                                   │
│          │                                   │
│          │                                   │
└──────────┴───────────────────────────────────┘
```

### Full-Width Layout (Entry Forms)
```
┌──────────────────────────────────────────────┐
│ Header: Logo | Back | Title | Help           │
├──────────────────────────────────────────────┤
│                                              │
│  Form Container (Max-width: 600px)           │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │  Fields with labels and helpers        │  │
│  │  Form validation messages              │  │
│  │                                        │  │
│  │  [Cancel] [Submit]                     │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### Modal Dialog Layout
```
┌─────────────────────────────────┐
│ Modal Title             [Close]  │
├─────────────────────────────────┤
│                                 │
│ Modal Content                   │
│ - Form fields                   │
│ - Information                   │
│ - Images                        │
│                                 │
├─────────────────────────────────┤
│ [Cancel]               [Submit]  │
└─────────────────────────────────┘
```

---

## 3. DATA DISPLAY COMPONENTS

### Table Component
```
┌─────────────────────────────────────────────┐
│ Columns: [Name] [Email] [Status] [Actions]  │
├─────────────────────────────────────────────┤
│ Row 1  │ data  │ data  │ ✓      │ [✏️] [🗑️] │
├─────────────────────────────────────────────┤
│ Row 2  │ data  │ data  │ ✕      │ [✏️] [🗑️] │
├─────────────────────────────────────────────┤
│ Row 3  │ data  │ data  │ ✓      │ [✏️] [🗑️] │
├─────────────────────────────────────────────┤
│ Showing 1-3 of 10 | [< 1 2 3 >]             │
└─────────────────────────────────────────────┘
```

### Chart Component
```
Line Chart:
  Y-axis (Value)
  │     ●
  │    / \
  │   /   ●
  │  /   / \
  │ ●---/   \
  │           ●
  └─────────────────── X-axis (Time)

Bar Chart:
  │ ███
  │ ███ ██
  │ ███ ██ ████
  └──────────────

Pie Chart:
      ┌─────┐
    ╱   A   ╲
   │         │
   │    B    │
   │         │
    ╲       ╱
      └─────┘
```

### Status Badges
```
✓ Aktif (Green) - Active status
✕ Nonaktif (Gray) - Inactive
⚠️ Pending (Amber) - Requires attention
⏳ Processing (Blue) - In progress
```

---

## 4. FORM PATTERNS

### Single Column Form
```
Label *
[Input field]
Helper text or error

Label
[Select dropdown]

[Checkbox] Label
[Checkbox] Label

Label *
[Textarea]

[Cancel] [Submit]
```

### Multi-Step Form / Wizard
```
Step 1: Basic Info  [✓]
Step 2: Details     [  ]
Step 3: Review      [  ]

Current Step Content
[Back] [Next]
```

### Inline Editing
```
Field Name: [Display Value] [✏️ Edit Icon]

When clicked:
Field Name: [Input Field] [✓ Save] [✕ Cancel]
```

---

## 5. SEARCH & FILTER PATTERNS

### Search Bar
```
┌──────────────────────────────────┐
│ 🔍 Cari berdasarkan nama...  [✕]  │
└──────────────────────────────────┘
```

### Filter Panel
```
Tipe:           [Filter ▼]
Status:         [Filter ▼]
Tanggal:        [Date] - [Date]
Lokasi:         [Multi-select ▼]

[Reset Semua] [Terapkan]
```

### Sorting
```
Column Headers with Sort Indicator:
Name ↕   │   Email   │   Status ↑
```

---

## 6. MOBILE RESPONSIVE ADJUSTMENTS

### Mobile Menu (Hamburger)
```
┌──────────────────────────┐
│ ≡ Logo      [🔔] [👤]    │
└──────────────────────────┘

Overlay Menu:
┌──────────────────────────┐
│ ✕                        │
├──────────────────────────┤
│ Dashboard                │
│ Data Tanaman             │
│ Input Data               │
│ Monitoring               │
│ Prediksi Panen          │
│ Deteksi Penyakit        │
│ Informasi Cuaca         │
├──────────────────────────┤
│ Pengaturan               │
│ Logout                   │
└──────────────────────────┘
```

### Mobile Card Layout
```
Full width cards with:
- Vertical stacking
- Large tap targets (48px+)
- Single column layout
- Swipe actions for delete/edit
```

---

## 7. EMPTY STATES

### No Data State
```
┌─────────────────────────────┐
│                             │
│         📭                  │
│                             │
│   Belum Ada Data            │
│   Mulai dengan menambahkan  │
│   data baru                 │
│                             │
│   [+ Tambah Data Baru]      │
│                             │
└─────────────────────────────┘
```

### No Results State
```
┌─────────────────────────────┐
│                             │
│         🔍                  │
│                             │
│   Tidak Ada Hasil           │
│   Coba ubah kriteria pencarian│
│                             │
│   [🔄 Reset Filter]         │
│                             │
└─────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────┐
│ ⏳ Memuat data...            │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────┘

Or Skeleton:
┌─────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────┘
```

---

## 8. ERROR HANDLING STATES

### Form Validation Error
```
Email *
┌─────────────────────────┐
│ invalid@                │  ✕ Invalid format
└─────────────────────────┘
Please enter valid email
```

### Network Error
```
┌─────────────────────────────┐
│ ✕ Koneksi Gagal             │
│                             │
│ Tidak dapat mengambil data  │
│ Periksa koneksi internet    │
│                             │
│ [Coba Lagi]  [Bantuan]      │
└─────────────────────────────┘
```

### Permission Error
```
┌─────────────────────────────┐
│ ✕ Akses Ditolak             │
│                             │
│ Anda tidak memiliki izin    │
│ untuk mengakses halaman ini │
│                             │
│ [Kembali ke Beranda]        │
└─────────────────────────────┘
```

---

## 9. SUCCESS STATES

### Submission Success
```
┌─────────────────────────────┐
│                             │
│         ✓                   │
│                             │
│   Data Berhasil Disimpan    │
│                             │
│   Anda akan dialihkan...    │
│                             │
│   [Kembali Manual]          │
│                             │
└─────────────────────────────┘
```

### Action Confirmation
```
┌─────────────────────────────┐
│ ✓ Aksi Berhasil             │
│                             │
│ Data telah dihapus          │
│ Anda dapat membatalkannya   │
│ dalam 30 detik              │
│                             │
│ [Batalkan Penghapusan]      │
│         ↓ 28 detik          │
└─────────────────────────────┘
```

---

## 10. DESIGN TOKENS

### Spacing Scale
```
xs: 4px    - Micro spacing
sm: 8px    - Padding in compact components
md: 16px   - Standard padding
lg: 24px   - Component margin
xl: 32px   - Section margin
2xl: 48px  - Page margin
```

### Border Radius
```
sm: 4px    - Subtle rounding
md: 8px    - Standard components
lg: 12px   - Cards
xl: 16px   - Large sections
full: 9999px - Buttons with full rounding
```

### Shadows
```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.1)
lg: 0 10px 15px rgba(0,0,0,0.1)
xl: 0 20px 25px rgba(0,0,0,0.1)
```

### Font Weights
```
Light: 300   - Disabled states
Regular: 400 - Body text
Medium: 500  - Slightly emphasized
SemiBold: 600 - Section headers
Bold: 700    - Main headers
```

---

## 11. INTERACTION PATTERNS

### Hover States
```
Button Hover: Darken color by 10%
Link Hover: Underline appears
Card Hover: Subtle shadow increase
Row Hover: Background color change to light gray
```

### Active/Focus States
```
Input Focus: Blue border, shadow
Button Active: Darker color
Tab Active: Underline indicator
Selected Item: Background highlight + checkmark
```

### Disabled States
```
Disabled Button: Gray, cursor: not-allowed
Disabled Input: Gray background, opacity 0.5
Disabled Link: Gray text, cursor: not-allowed
```

---

## 12. ANIMATION & TRANSITIONS

### Page Transitions
- Fade in (200ms) - When page content loads
- Slide in (300ms) - Sidebar navigation
- Scale (200ms) - Modal appearance

### Component Transitions
- Button press (100ms) - Scale down slightly
- Hover (150ms) - Color change
- Expand/collapse (200ms) - Accordion sections

### Notification Animations
- Toast slide in (300ms) - From top/bottom
- Toast slide out (300ms) - On dismiss
- Progress bar animation - Linear duration based on timeout

