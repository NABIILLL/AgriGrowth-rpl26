# Open-Meteo Weather API Integration Guide

## 📋 Ringkasan

Agrigrowth Monitor kini menggunakan **Open-Meteo API** untuk menampilkan data cuaca **real-time** tanpa memerlukan API key. Data di-cache selama 10 menit untuk performa optimal.

---

## 🌐 API Endpoint

```
https://api.open-meteo.com/v1/forecast
```

**Fitur:**
- ✅ Gratis, tanpa API key, tanpa registrasi
- ✅ Akurat dengan data dari weather services nasional
- ✅ Dukungan CORS
- ✅ Respons time < 10ms

---

## 📁 File Structure

```
lib/
├── weather.ts              # Weather service & utilities
hooks/
├── useWeather.ts           # Hook untuk fetch weather data
app/
└── features/
    └── weather/
        └── page.tsx        # Weather info page dengan real-time data
```

---

## 🔧 Cara Kerja

### 1. **Weather Service** (`lib/weather.ts`)

Fungsi-fungsi utama:

#### `getCurrentWeather(latitude, longitude, locationName)`
Fetch data cuaca terkini
```typescript
const weather = await getCurrentWeather(-6.5951, 106.8063, "Bogor");
// Returns:
// {
//   location: "Bogor",
//   temperature: 28,
//   condition: "Cerah Berawan",
//   humidity: 75,
//   windSpeed: 12,
//   ...
// }
```

#### `getWeatherForecast(latitude, longitude)`
Fetch prakiraan 7 hari
```typescript
const forecast = await getWeatherForecast(-6.5951, 106.8063);
// Returns array of DailyForecast
```

#### `getHourlyWeather(latitude, longitude)`
Fetch data per jam
```typescript
const hourly = await getHourlyWeather(-6.5951, 106.8063);
```

#### Helper Functions
```typescript
getWeatherDescription(code)   // Convert WMO code to Indonesian
getWeatherEmoji(code)         // Get emoji untuk kondisi cuaca
```

---

### 2. **Weather Hook** (`hooks/useWeather.ts`)

Wrapper React untuk fetch dan manage weather data:

```typescript
const { current, forecast, hourly, loading, error, refetch } = useWeather({
  latitude: -6.5951,
  longitude: 106.8063,
  locationName: "Bogor, Jawa Barat"
});
```

**Return values:**
- `current` - Data cuaca terkini (WeatherData | null)
- `forecast` - Prakiraan 7 hari (DailyForecast[])
- `hourly` - Data per jam (HourlyWeatherData | null)
- `loading` - Status loading (boolean)
- `error` - Pesan error (string | null)
- `refetch` - Function untuk manual refresh

**Auto-refresh:** Setiap 10 menit

---

### 3. **Weather Page** (`app/features/weather/page.tsx`)

Fitur:
- ✅ Display data cuaca real-time
- ✅ Tombol "Lokasi Saya" untuk menggunakan geolocation
- ✅ Tombol "Refresh" untuk manual update
- ✅ Prakiraan 7 hari
- ✅ Loading & error states
- ✅ 9 indikator cuaca: Suhu, Kelembaban, Angin, UV Index, Tekanan, Visibilitas, Arah Angin, Update Terakhir

---

## 📊 Data Yang Ditampilkan

### Current Weather
```
- Suhu (°C)
- Kondisi cuaca (Cerah, Hujan, dll)
- Kelembaban (%)
- Kecepatan angin (km/h)
- Indeks UV
- Tekanan (mb)
- Visibilitas (km)
- Arah angin (°)
- Waktu update terakhir
```

### Forecast
```
Per hari:
- Hari (Senin, Selasa, dll)
- Kondisi cuaca + emoji
- Suhu max/min (°C)
- Curah hujan jika ada (mm)
- Kecepatan angin (km/h)
```

---

## 🔄 Workflow

```
User buka Weather Page
    ↓
useWeather hook initialize dengan default location (Bogor)
    ↓
Fetch dari Open-Meteo API:
  - getCurrentWeather() → current conditions
  - getWeatherForecast() → 7-day forecast
  - getHourlyWeather() → hourly data
    ↓
Display data atau error message
    ↓
Auto-refresh setiap 10 menit
    ↓
User bisa:
  - Klik "Lokasi Saya" → Use geolocation → Fetch data baru
  - Klik "Refresh" → Manual fetch data terbaru
```

---

## 🗺️ Lokasi Default

- **Latitude:** -6.5951 (Bogor)
- **Longitude:** 106.8063 (Bogor)
- **Timezone:** Asia/Jakarta

---

## 🌍 Mengubah Lokasi

### Otomatis (Geolocation)
User klik tombol "📍 Lokasi Saya" → Browser request lokasi → Update map

### Manual di Code
```typescript
const [latitude, setLatitude] = useState(-7.2575); // Yogyakarta
const [longitude, setLongitude] = useState(110.3725);
const [locationName, setLocationName] = useState("Yogyakarta");

const { current, forecast } = useWeather({
  latitude,
  longitude,
  locationName,
});
```

---

## 🎯 WMO Weather Codes Mapping

Open-Meteo menggunakan WMO codes. Semua sudah di-map ke Bahasa Indonesia:

```typescript
0  → Cerah
1  → Cerah Berawan
2  → Sebagian Berawan
3  → Berawan
45 → Berkabut
51 → Gerimis Ringan
61 → Hujan Ringan
71 → Salju Ringan
95 → Badai Petir
... (dan 30+ kode lainnya)
```

---

## 💾 Caching Strategy

- **TTL:** 600 detik (10 menit)
- **Level:** Next.js `revalidate` di API calls
- **Manual Refresh:** User bisa klik tombol "Refresh" kapan saja

---

## 🔒 Privacy & Terms

**Open-Meteo:**
- ✅ Gratis untuk non-commercial use
- ✅ Tidak ada API key required
- ✅ CORS supported
- ✅ Tidak ada tracking/cookies
- ✅ Tidak perlu registrasi
- ⚠️ Fair usage: max 10,000 requests/hari untuk free tier

**Attributions:**
Data cuaca dari Open-Meteo harus di-credit:
```html
<a href="https://open-meteo.com/">Weather data by Open-Meteo.com</a>
```

---

## 📱 Responsive Design

- Mobile: 1 kolom
- Tablet: 2 kolom
- Desktop: 4 kolom untuk current weather

---

## 🚀 Future Enhancements

- [ ] Save lokasi favorit (localStorage)
- [ ] Alert untuk kondisi cuaca ekstrem
- [ ] Historical weather data
- [ ] Weather recommendations untuk pertanian
- [ ] Integration dengan Growth Tracker (cuaca vs pertumbuhan)
- [ ] Push notifications untuk cuaca buruk
- [ ] Radar cuaca/satellite imagery

---

## 🐛 Troubleshooting

**Error: "Tidak dapat mengakses lokasi Anda"**
- User belum memberikan permission geolocation
- Saran: Gunakan localhost atau HTTPS untuk geolocation

**Error: "Failed to fetch weather data"**
- Network issue
- API endpoint down (rare)
- Solusi: Tombol Refresh akan retry

**Data tidak update**
- Cache masih active (TTL 10 menit)
- Solusi: Klik tombol Refresh atau tunggu 10 menit

---

## 📚 Resources

- API Docs: https://open-meteo.com/en/docs
- GitHub: https://github.com/open-meteo/open-meteo
- Live Demo: https://open-meteo.com/
- WMO Codes: https://open-meteo.com/en/docs

---

## ✅ Testing Checklist

- [ ] Load halaman → data tampil (default Bogor)
- [ ] Klik "Lokasi Saya" → browser ask permission → data update
- [ ] Klik "Refresh" → manual update data
- [ ] Wait 10 min → auto-refresh tanpa user action
- [ ] Network offline → error message tampil
- [ ] Prakiraan 7 hari tampil dengan benar
- [ ] Semua 9 indikator cuaca visible
- [ ] Responsive di mobile/tablet/desktop
- [ ] Loading state tampil saat fetch
- [ ] Weather emoji sesuai kondisi

