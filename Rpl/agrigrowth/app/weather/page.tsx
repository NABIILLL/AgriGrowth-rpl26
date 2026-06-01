"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Droplets,
  Eye,
  Gauge,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Search,
  Sprout,
  SunMedium,
  Wind,
} from "lucide-react";

import { useWeather } from "@/hooks/useWeather";
import { getWeatherDescription } from "@/lib/weather";
import GlobalHeader from "@/components/GlobalHeader";
import { motion, Variants } from "framer-motion";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 70, damping: 15 } as const
  }
};

const imgRainHero = "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2000&auto=format&fit=crop";
const imgBrandLogo = "/logo%202.png";
const imgProfileAvatar = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";
const imgCloudyIcon = "https://api.iconify.design/lucide:cloud.svg?color=%23365a1a";
const imgRainIcon = "https://api.iconify.design/lucide:cloud-rain.svg?color=%23365a1a";

const DEFAULT_LAT = -6.5951;
const DEFAULT_LON = 106.8063;
const DEFAULT_LOCATION = "Bogor, Jawa Barat";

const navLinkClass = "hover:opacity-80 transition";

function getWeatherIconSrc(code: number) {
  if (code === 0) return imgCloudyIcon;
  if (code === 1 || code === 2 || code === 3 || code === 45 || code === 48) return imgCloudyIcon;
  if (code >= 51 && code <= 99) return imgRainIcon;
  return imgCloudyIcon;
}

function WeatherGlyph({ code, className }: { code: number; className?: string }) {
  return <img alt="" src={getWeatherIconSrc(code)} className={className} />;
}

function formatHourLabel(timeValue: string) {
  const hourPart = Number(timeValue.slice(11, 13));
  const suffix = hourPart >= 12 ? "PM" : "AM";
  const normalizedHour = hourPart % 12 || 12;
  return `${normalizedHour} ${suffix}`;
}

function getCurrentHourKey(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";

  return `${year}-${month}-${day}T${hour}:00`;
}

function getWeatherAccent(code: number) {
  if (code === 0) return "from-amber-100 to-yellow-50";
  if (code === 1 || code === 2) return "from-lime-50 to-emerald-50";
  if (code === 3) return "from-slate-100 to-slate-50";
  if (code === 45 || code === 48) return "from-slate-200 to-slate-100";
  if (code >= 51 && code <= 67) return "from-cyan-50 to-sky-50";
  if (code >= 71 && code <= 86) return "from-blue-50 to-indigo-50";
  if (code >= 95 && code <= 99) return "from-violet-50 to-indigo-50";
  return "from-emerald-50 to-lime-50";
}

export default function WeatherInfo() {
  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LON);
  const [locationName, setLocationName] = useState(DEFAULT_LOCATION);
  const [searchQuery, setSearchQuery] = useState(DEFAULT_LOCATION);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  const { current, forecast, hourly, loading, error, refetch } = useWeather({
    latitude,
    longitude,
    locationName,
  });

  useEffect(() => {
    setSearchQuery(locationName);
  }, [locationName]);

  const hourlyItems = useMemo(() => {
    if (!hourly?.time?.length) return [];

    const currentHourKey = getCurrentHourKey("Asia/Jakarta");
    const startIndex = hourly.time.findIndex((timeValue) => timeValue >= currentHourKey);
    const safeStartIndex = startIndex >= 0 ? startIndex : 0;

    return hourly.time.slice(safeStartIndex, safeStartIndex + 7).map((timeValue, index) => ({
      label: formatHourLabel(timeValue),
      code: hourly.weather_code[safeStartIndex + index] ?? 0,
      temperature: Math.round(hourly.temperature_2m[safeStartIndex + index] ?? 0),
      precipitation: hourly.precipitation[safeStartIndex + index] ?? 0,
      windSpeed: Math.round(hourly.wind_speed_10m[safeStartIndex + index] ?? 0),
    }));
  }, [hourly]);

  const currentCode = current?.weatherCode ?? hourlyItems[0]?.code ?? 0;
  const weatherSummary = hourlyItems[0]
    ? `${getWeatherDescription(hourlyItems[0].code)}. ${hourlyItems[0].temperature}°C`
    : forecast[0]
    ? `${forecast[0].condition}. Low ${forecast[0].low}°C`
    : current
    ? `${current.condition}. ${current.temperature}°C`
    : "Memuat cuaca...";

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setLatitude(lat);
        setLongitude(lon);

        (async () => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
            );
            if (!response.ok) throw new Error("Reverse geocode failed");

            const result = await response.json();
            const address = result.address || {};
            const city = address.city || address.town || address.village || address.hamlet;
            const state = address.state || address.county;
            const country = address.country;

            if (city) {
              setLocationName(`${city}${state ? `, ${state}` : ""}${country ? `, ${country}` : ""}`);
            } else if (state) {
              setLocationName(`${state}${country ? `, ${country}` : ""}`);
            } else {
              setLocationName("Lokasi Anda");
            }
          } catch (locationError) {
            console.error("Reverse geocode error:", locationError);
            setLocationName("Lokasi Anda");
          }
        })();
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        alert("Tidak dapat mengakses lokasi Anda");
      }
    );
  };

  const handleSearchLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();

    if (!query) {
      setSearchError("Masukkan nama kota atau daerah yang ingin dicari.");
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Pencarian lokasi gagal");
      }

      const results = await response.json();
      const place = results?.[0];

      if (!place) {
        setSearchError(`Lokasi "${query}" tidak ditemukan.`);
        return;
      }

      setLatitude(Number(place.lat));
      setLongitude(Number(place.lon));
      setLocationName(place.display_name.split(",").slice(0, 4).join(", "));
    } catch (searchLocationError) {
      console.error("Location search error:", searchLocationError);
      setSearchError("Gagal mencari lokasi. Coba nama kota yang lebih spesifik.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      <GlobalHeader variant="light" />

      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-12 pt-6 sm:px-10 lg:px-14 lg:pt-8"
      >
        <motion.article variants={fadeUpVariant} className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-[383px_1fr] lg:items-stretch">
          <div className="rounded-[50px] border-[3px] border-[rgba(54,90,26,0.75)] bg-white px-6 py-7 shadow-[0_20px_55px_rgba(54,90,26,0.12)] sm:px-8 sm:py-8">
            <div className="flex h-full flex-col items-center justify-center text-center">
              <WeatherGlyph code={currentCode} className="h-14 w-14 text-[#365a1a] sm:h-16 sm:w-16" />
              <div className="mt-5 flex items-start justify-center text-[#365a1a]">
                <span className="text-[94px] font-semibold leading-none tracking-[-0.08em] sm:text-[128px]">{current?.temperature ?? "--"}</span>
                <span className="mt-4 text-[38px] font-semibold sm:text-[48px]">°C</span>
              </div>
              <p className="mt-2 text-[26px] font-bold leading-tight sm:text-[30px]">{current?.condition ?? "Memuat cuaca"}</p>
              <p className="mt-4 max-w-[260px] text-[14px] leading-relaxed text-[#365a1a]/70 sm:text-[15px]">
                Kondisi cuaca terbarui otomatis setiap 10 menit dan disesuaikan dengan lokasi yang Anda pilih.
              </p>
            </div>
          </div>

          <div className={`relative min-h-[327px] overflow-hidden rounded-[50px] border-[3px] border-[rgba(54,90,26,0.75)] bg-gradient-to-br ${getWeatherAccent(currentCode)} shadow-[0_20px_55px_rgba(54,90,26,0.12)]`}>
            {heroImageFailed ? (
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.85),transparent_30%),radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.55),transparent_24%),linear-gradient(135deg,rgba(54,90,26,0.12),rgba(54,90,26,0.02))]" />
                <div className="absolute left-6 top-6 h-20 w-20 rounded-full bg-white/50 blur-2xl" />
                <div className="absolute right-14 top-12 h-28 w-28 rounded-full bg-white/45 blur-3xl" />
                <div className="absolute bottom-10 left-12 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[#365a1a] shadow-lg">
                  <div className="flex items-center gap-2">
                    <WeatherGlyph code={currentCode} className="h-4 w-4" />
                    {current?.condition ?? "Cuaca aktif"}
                  </div>
                </div>
                <div className="absolute right-12 bottom-8 animate-pulse opacity-40">
                  <img alt="" src={imgCloudyIcon} className="h-16 w-16 object-contain" />
                </div>
                <div className="absolute left-1/3 top-1/4 animate-pulse opacity-45">
                  <img alt="" src={imgRainIcon} className="h-14 w-14 object-contain" />
                </div>
              </div>
            ) : (
              <>
                <img
                  alt="Cuaca terkini"
                  src={imgRainHero}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setHeroImageFailed(true)}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.02)_35%,rgba(54,90,26,0.10)_100%)]" />
                <div className="absolute left-6 top-6 h-20 w-20 rounded-full bg-white/25 blur-3xl" />
                <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute bottom-8 left-10 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-[#365a1a] shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <WeatherGlyph code={currentCode} className="h-4 w-4" />
                    {weatherSummary}
                  </div>
                </div>
                <div className="absolute right-12 top-14 motion-safe:animate-pulse opacity-50">
                  <img alt="" src={imgCloudyIcon} className="h-14 w-14 object-contain" />
                </div>
                <div className="absolute right-28 bottom-12 motion-safe:animate-pulse opacity-55" style={{ animationDelay: "0.8s" }}>
                  <img alt="" src={imgRainIcon} className="h-12 w-12 object-contain" />
                </div>
              </>
            )}
          </div>
        </motion.article>

        <motion.form variants={fadeUpVariant} onSubmit={handleSearchLocation} className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-3 rounded-full border-2 border-[rgba(54,90,26,0.25)] bg-white px-5 py-3 shadow-sm">
            <Search className="h-5 w-5 shrink-0 text-[#365a1a]/70" strokeWidth={2} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari cuaca di kota atau daerah lain"
              className="w-full bg-transparent text-[15px] text-[#365a1a] outline-none placeholder:text-[#365a1a]/45 sm:text-[16px]"
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#365a1a] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#2d4915] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="h-4 w-4" strokeWidth={2.2} />
            {searching ? "Mencari..." : "Cari Cuaca"}
          </button>

          <button
            type="button"
            onClick={handleGetLocation}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#365a1a] bg-white px-5 py-3 text-[14px] font-semibold text-[#365a1a] transition hover:bg-[#f1f5ea]"
          >
            <LocateFixed className="h-4 w-4" strokeWidth={2.2} />
            Lokasi Saya
          </button>
        </motion.form>

        {searchError ? (
          <motion.div variants={fadeUpVariant} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {searchError}
          </motion.div>
        ) : null}

        <motion.div variants={fadeUpVariant} className="rounded-[50px] bg-[#365a1a] px-6 py-5 text-center text-[16px] font-semibold text-[#d7e4cd] shadow-[0_16px_40px_rgba(54,90,26,0.16)] sm:text-[18px]">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="h-5 w-5 shrink-0" strokeWidth={2.1} />
            <span className="max-w-full truncate">{locationName}</span>
          </div>
        </motion.div>

        <motion.section variants={fadeUpVariant} className="rounded-[50px] border-[3px] border-[rgba(54,90,26,0.75)] bg-white p-5 shadow-[0_20px_55px_rgba(54,90,26,0.12)] sm:p-7">
          <div className="flex flex-col gap-3 border-b border-[#dfe8d2] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[16px] font-bold text-[#365a1a]/80">{weatherSummary}</p>
              <h2 className="text-[28px] font-bold sm:text-[32px]">Prediksi per Jam</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-[13px] font-semibold text-[#365a1a]/70 sm:text-[14px]">
              <span className="rounded-full bg-[#f3f7ee] px-3 py-1">Cuaca otomatis</span>
              <span className="rounded-full bg-[#f3f7ee] px-3 py-1">Update 10 menit</span>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[140px] items-center justify-center text-[16px] font-semibold text-[#365a1a]/70">
              Memuat prediksi per jam...
            </div>
          ) : error ? (
            <div className="flex min-h-[140px] items-center justify-center rounded-[24px] bg-red-50 px-4 py-6 text-center text-[16px] font-semibold text-red-700">
              Error: {error}
            </div>
          ) : hourlyItems.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {hourlyItems.map((hour) => (
                <div
                  key={hour.label}
                  className="rounded-[24px] border border-[#dfe8d2] bg-[#fbfcf8] px-2 py-3 sm:px-3 sm:py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="text-xs sm:text-[18px] font-bold text-[#365a1a]">{hour.label}</div>
                  <div className="mt-2 sm:mt-3 flex justify-center text-[#365a1a]">
                    <WeatherGlyph code={hour.code} className="h-6 w-6 sm:h-9 sm:w-9 object-contain" />
                  </div>
                  <div className="mt-1 sm:mt-2 text-lg sm:text-[26px] font-semibold leading-none text-[#365a1a]">{hour.temperature}°</div>
                  <div className="mt-2 sm:mt-3 space-y-0.5 sm:space-y-1 text-[10px] sm:text-[12px] text-[#365a1a]/70">
                    <p className="inline-flex items-center justify-center gap-0.5 sm:gap-1">
                      <Droplets className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">{hour.precipitation.toFixed(1)} mm</span>
                      <span className="sm:hidden">{hour.precipitation.toFixed(0)} mm</span>
                    </p>
                    <p className="inline-flex items-center justify-center gap-0.5 sm:gap-1">
                      <Wind className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                      {hour.windSpeed} km/h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[140px] items-center justify-center text-[16px] font-semibold text-[#365a1a]/70">
              Data per jam belum tersedia untuk lokasi ini.
            </div>
          )}
        </motion.section>

        <motion.section variants={fadeUpVariant} className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-[28px] border-2 border-[#365a1a] bg-white p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2 sm:gap-3 text-[#365a1a]/70">
              <Droplets className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-semibold">Kelembaban</span>
            </div>
            <div className="mt-2 sm:mt-3 text-2xl sm:text-[38px] font-bold leading-none text-[#365a1a]">{current ? `${current.humidity}%` : "--"}</div>
          </div>

          <div className="rounded-[28px] border-2 border-[#365a1a] bg-white p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2 sm:gap-3 text-[#365a1a]/70">
              <Wind className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-semibold">Angin</span>
            </div>
            <div className="mt-2 sm:mt-3 text-2xl sm:text-[38px] font-bold leading-none text-[#365a1a]">{current ? current.windSpeed : "--"}</div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-[#365a1a]/70">km/h</p>
          </div>

          <div className="rounded-[28px] border-2 border-[#365a1a] bg-white p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2 sm:gap-3 text-[#365a1a]/70">
              <Gauge className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-semibold">Tekanan</span>
            </div>
            <div className="mt-2 sm:mt-3 text-2xl sm:text-[38px] font-bold leading-none text-[#365a1a]">{current ? Math.round(current.pressure) : "--"}</div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-[#365a1a]/70">mb</p>
          </div>

          <div className="rounded-[28px] border-2 border-[#365a1a] bg-white p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3 text-[#365a1a]/70">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-semibold">Visibilitas</span>
            </div>
            <div className="mt-2 sm:mt-3 text-2xl sm:text-[38px] font-bold leading-none text-[#365a1a]">{current ? current.visibility : "--"}</div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-[#365a1a]/70">km</p>
          </div>
        </motion.section>

        {!loading && forecast.length > 0 ? (
          <motion.section variants={fadeUpVariant} className="rounded-[40px] bg-white p-5 shadow-[0_20px_55px_rgba(54,90,26,0.12)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[28px] font-bold sm:text-[32px]">Prakiraan 7 Hari</h2>
              <button
                onClick={refetch}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#365a1a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2d4915] disabled:opacity-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {forecast.map((day) => (
                <div key={day.day} className="rounded-[20px] p-4 sm:p-4 text-center shadow-sm">
                  <div className="text-xs sm:text-[16px] font-bold text-[#365a1a] truncate">{day.day}</div>
                  <div className="mt-2 sm:mt-3 flex justify-center text-[#365a1a]">
                    <WeatherGlyph code={day.weatherCode} className="h-6 w-6 sm:h-9 sm:w-9 object-contain" />
                  </div>
                  <p className="mt-2 sm:mt-3 text-[11px] sm:text-[13px] font-semibold text-[#365a1a] line-clamp-2">{day.condition}</p>
                  <p className="mt-1 text-[11px] sm:text-[13px] text-[#365a1a]/70">
                    <span className="font-bold">{day.high}°C</span> / {day.low}°C
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        ) : null}
      </motion.section>

      <style jsx global>{`
        @keyframes weather-float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </main>
  );
}
