"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import { motion, Variants } from "framer-motion";
import { toast } from "react-hot-toast";
import { useUser } from "@/hooks/useUser";
import { useSession } from "@clerk/nextjs";

type JenisTanaman = "Padi" | "Jagung" | "Bawang Merah";

type TrackerOption = {
  id: string;
  title: string;
  plant_type: string;
  created_at?: string | null;
};

type HasilAnalisis = {
  status: string;
  detectedAs?: string; // ✅ apa yang terdeteksi kalau foto tidak valid
  diagnosis: string;
  tingkatKeparahan: string;
  gejala: string[];
  penyebab: string;
  solusi: string[];
  pencegahan: string[];
  urgensi: string;
  rawText?: string;
};

const TANAMAN_OPTIONS: { value: JenisTanaman; slug: string; desc: string; image: string }[] = [
  {
    value: "Padi",
    slug: "padi",
    desc: "Oryza sativa",
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800&auto=format&fit=crop",
  },
  {
    value: "Jagung",
    slug: "jagung",
    desc: "Zea mays",
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=800&auto=format&fit=crop",
  },
  {
    value: "Bawang Merah",
    slug: "bawang",
    desc: "Allium cepa",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=800&auto=format&fit=crop",
  },
];

const STATUS_COLOR: Record<string, string> = {
  Sehat: "text-green-700 bg-green-50 border-green-300",
  "Terdeteksi Penyakit": "text-red-700 bg-red-50 border-red-300",
  "Perlu Perhatian": "text-yellow-700 bg-yellow-50 border-yellow-300",
  "Foto Tidak Valid": "text-gray-700 bg-gray-50 border-gray-300",
};

const URGENSI_COLOR: Record<string, string> = {
  Segera: "bg-red-500 text-white",
  "Dalam 1-2 Minggu": "bg-yellow-500 text-white",
  "Pantau Saja": "bg-blue-500 text-white",
  "Tidak Perlu Tindakan": "bg-[#365a1a] text-white",
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } as const },
};

const getPlantSlug = (value: JenisTanaman | null) => {
  const option = TANAMAN_OPTIONS.find((item) => item.value === value);
  return option?.slug || "";
};

const imgLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";

async function createAuthHeaders(session: ReturnType<typeof useSession>["session"]) {
  const token = await session?.getToken().catch(() => null);
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export default function AnalisisPenyakitPage() {
  const { user, isLoading } = useUser();
  const { session } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTanaman, setSelectedTanaman] = useState<JenisTanaman | null>(null);
  const [trackers, setTrackers] = useState<TrackerOption[]>([]);
  const [trackersLoading, setTrackersLoading] = useState(false);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalisisLoading, setIsAnalisisLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilAnalisis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ State untuk rate limit countdown
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const [rateLimitTotal, setRateLimitTotal] = useState<number>(60);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTracker = trackers.find((tracker) => tracker.id === selectedTrackerId) || null;

  const handleSelectTanaman = (value: JenisTanaman) => {
    setSelectedTanaman(value);
    setTrackers([]);
    setSelectedTrackerId(null);
    setImageFile(null);
    setImagePreview(null);
    setHasil(null);
    setError(null);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectTracker = (trackerId: string) => {
    setSelectedTrackerId(trackerId);
    setStep(2);
    setHasil(null);
    setError(null);
  };

  // ✅ Countdown timer — berkurang setiap detik, reset ke null saat habis
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) {
      if (rateLimitCountdown === 0) setRateLimitCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setRateLimitCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 5MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setStep(2);
  };

  const buildOptimizedImagePayload = async (file: File) => {
    const MAX_DIMENSION = 1400;
    const JPEG_QUALITY = 0.78;

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Gagal membaca gambar"));
      reader.readAsDataURL(file);
    });

    if (!imageUrl) {
      throw new Error("Gagal memproses gambar");
    }

    const compressed = await new Promise<{ base64: string; mimeType: string }>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const { naturalWidth: width, naturalHeight: height } = image;
        const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas tidak tersedia"));
          return;
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal mengompres gambar"));
              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = String(reader.result || "");
              resolve({
                base64: dataUrl.split(",")[1] || "",
                mimeType: blob.type || "image/jpeg",
              });
            };
            reader.onerror = () => reject(new Error("Gagal membaca hasil kompresi"));
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          JPEG_QUALITY,
        );
      };
      image.onerror = () => reject(new Error("Gagal memuat gambar"));
      image.src = imageUrl;
    });

    return compressed;
  };

  const handleAnalisis = async () => {
    if (!imageFile || !selectedTanaman || !selectedTrackerId) return;
    setIsAnalisisLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await buildOptimizedImagePayload(imageFile);

      const response = await fetch("/api/analisis-penyakit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await createAuthHeaders(session) || {}),
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          jenisTanaman: selectedTanaman,
          trackerId: selectedTrackerId,
        }),
      });

      const data = await response.json();

      // ✅ Handle 429 — tampilkan countdown dari retryAfter yang dikirim server
      if (response.status === 429) {
        const waitTime = data.retryAfter ?? 60;
        setRateLimitTotal(waitTime);
        setRateLimitCountdown(waitTime);
        setIsAnalisisLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "Terjadi kesalahan pada AI. Coba lagi.");
        setIsAnalisisLoading(false);
        return;
      }

      const hasilData: HasilAnalisis = data.hasil;
      if (hasilData.rawText) {
        setHasil({
          status: "Perlu Perhatian",
          diagnosis: "Lihat hasil lengkap di bawah",
          tingkatKeparahan: "-",
          gejala: [],
          penyebab: "",
          solusi: [],
          pencegahan: [],
          urgensi: "Pantau Saja",
          rawText: hasilData.rawText,
        });
      } else {
        setHasil(hasilData);
      }
      setStep(3);
      if (data?.savedAnalysis) {
        toast.success("Hasil analisis tersimpan ke monitoring lahan", { id: "Hasil analisis tersimpan ke monitoring lahan" });
      }
      setIsAnalisisLoading(false);
    } catch {
      setError("Gagal mengirim gambar analisis. Coba pakai foto yang lebih kecil atau lebih jelas.");
      setIsAnalisisLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedTanaman(null);
    setSelectedTrackerId(null);
    setTrackers([]);
    setImageFile(null);
    setImagePreview(null);
    setHasil(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Progress persen untuk progress bar countdown
  const countdownProgress =
    rateLimitCountdown !== null
      ? Math.round((rateLimitCountdown / rateLimitTotal) * 100)
      : 0;

  useEffect(() => {
    let mounted = true;

    const loadTrackers = async () => {
      if (!selectedTanaman || !user) {
        setTrackers([]);
        setTrackersLoading(false);
        return;
      }

      setTrackersLoading(true);
      try {
        const response = await fetch(
          `/api/observation/history?plantType=${encodeURIComponent(getPlantSlug(selectedTanaman))}`,
          {
            headers: await createAuthHeaders(session),
            credentials: "include",
          }
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || "Gagal memuat lahan");
        }

        if (!mounted) return;

        const fetchedTrackers = (data.trackers || []) as TrackerOption[];
        setTrackers(fetchedTrackers);
        setSelectedTrackerId((prev) => {
          if (prev && fetchedTrackers.some((tracker) => tracker.id === prev)) return prev;
          return null;
        });
      } catch (fetchError) {
        console.error("Error loading disease trackers:", fetchError);
        if (!mounted) return;
        setTrackers([]);
        setSelectedTrackerId(null);
      } finally {
        if (mounted) setTrackersLoading(false);
      }
    };

    loadTrackers();

    return () => {
      mounted = false;
    };
  }, [selectedTanaman, user, session]);

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">

      {/* Header */}
      <GlobalHeader variant="light" />

      {/* Konten */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="py-8 px-4"
      >
        <div className="max-w-2xl mx-auto">

          <motion.div variants={fadeUpVariant} className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800">🔬 Analisis Penyakit Tanaman</h1>
            <p className="text-gray-500 mt-1 text-sm">Upload foto tanamanmu dan AI akan mendeteksi penyakit secara otomatis.</p>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="flex items-center justify-center w-full mx-auto gap-2 sm:gap-4 mb-8">
            {[{ num: 1, label: "Pilih Tanaman" }, { num: 2, label: "Upload Foto" }, { num: 3, label: "Hasil Analisis" }].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex shrink-0 items-center justify-center text-xs font-bold transition-all ${step >= s.num ? "bg-[#365a1a] text-white" : "bg-gray-200 text-gray-400"}`}>
                    {s.num}
                  </div>
                  <span className={`text-xs hidden sm:block whitespace-nowrap ${step >= s.num ? "text-[#365a1a] font-medium" : "text-gray-400"}`}>{s.label}</span>
                </div>
                {i < 2 && <div className={`w-6 sm:w-16 h-0.5 ${step > s.num ? "bg-[#365a1a]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </motion.div>

          {/* STEP 1 — Pilih Tanaman */}
          <motion.div variants={fadeUpVariant} className="bg-white rounded-2xl shadow-sm border border-[#d9d9d9] p-6 mb-4">
            <h2 className="font-semibold text-gray-700 mb-4">1. Pilih Jenis Tanaman</h2>
            <div className="grid grid-cols-3 gap-3">
              {TANAMAN_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleSelectTanaman(t.value)}
                  className={`group relative h-[130px] overflow-hidden rounded-[16px] transition-all ${
                    selectedTanaman === t.value
                      ? "ring-[3px] ring-[#365a1a] shadow-[-4px_4px_12px_rgba(0,0,0,0.3)]"
                      : "shadow-md hover:shadow-[-4px_4px_16px_rgba(0,0,0,0.2)]"
                  }`}
                >
                  <img alt={t.value} src={t.image} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className={`absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#365a1a] to-transparent transition duration-300 ${selectedTanaman === t.value ? "opacity-100" : "opacity-70 group-hover:opacity-90"}`} />
                  {selectedTanaman === t.value && (
                    <div className="absolute top-2 right-2 bg-white rounded-full w-5 h-5 flex items-center justify-center shadow">
                      <span className="text-[#365a1a] text-xs font-bold">✓</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p className="font-extrabold text-white text-[13px] leading-tight">{t.value}</p>
                    <p className="text-white/70 text-[10px] italic">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedTanaman && (
              <div className="mt-5 rounded-2xl border border-[#d9d9d9] bg-[#fafcf7] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Daftar Lahan Akun</h3>
                    <p className="text-xs text-gray-500 mt-1">Pilih lahan untuk menyimpan hasil analisis ke monitoring lahan tersebut.</p>
                  </div>
                  {selectedTracker && (
                    <span className="rounded-full bg-[#365a1a] px-3 py-1 text-xs font-semibold text-white">
                      Terpilih: {selectedTracker.title}
                    </span>
                  )}
                </div>

                {trackersLoading ? (
                  <div className="rounded-xl border border-dashed border-[#cfd8c6] bg-white px-4 py-6 text-center text-sm text-gray-500">
                    Memuat lahan...
                  </div>
                ) : trackers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#cfd8c6] bg-white px-4 py-6 text-center">
                    <p className="font-semibold text-gray-700">Belum ada lahan untuk tanaman ini</p>
                    <p className="mt-1 text-sm text-gray-500">Buat tracker lahan terlebih dahulu di dashboard.</p>
                    <Link href="/dashboard" className="mt-4 inline-flex rounded-full bg-[#365a1a] px-4 py-2 text-sm font-bold text-white hover:bg-[#2d4915] transition">
                      Buka Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {trackers.map((tracker) => {
                      const active = tracker.id === selectedTrackerId;
                      return (
                        <button
                          key={tracker.id}
                          type="button"
                          onClick={() => handleSelectTracker(tracker.id)}
                          className={`rounded-xl border p-4 text-left transition ${active ? "border-[#365a1a] bg-white shadow-md" : "border-[#d9e4cf] bg-white hover:border-[#9fb08d]"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[#365a1a]">{tracker.title}</p>
                              <p className="mt-1 text-xs text-[#365a1a]/70 capitalize">{tracker.plant_type}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${active ? "bg-[#365a1a] text-white" : "bg-[#f0f4eb] text-[#365a1a]"}`}>
                              {active ? "Dipilih" : "Pilih"}
                            </span>
                          </div>
                          <p className="mt-3 text-xs text-gray-500">
                            Dibuat: {tracker.created_at ? new Date(tracker.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* STEP 2 — Upload Foto */}
          <motion.div variants={fadeUpVariant} className={`bg-white rounded-2xl shadow-sm border border-[#d9d9d9] p-6 mb-4 transition-opacity ${!selectedTrackerId ? "opacity-50 pointer-events-none" : ""}`}>
            <h2 className="font-semibold text-gray-700 mb-4">2. Upload Foto Tanaman</h2>
            {!selectedTrackerId && (
              <div className="mb-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                Pilih lahan terlebih dahulu agar hasil analisis bisa langsung disimpan ke monitoring lahan.
              </div>
            )}
            {selectedTracker && (
              <div className="mb-4 rounded-xl bg-[#f0f4eb] px-4 py-3 text-sm text-[#365a1a]">
                Lahan aktif: <span className="font-semibold">{selectedTracker.title}</span>
              </div>
            )}
            {imagePreview ? (
              <div className="relative">
                <Image src={imagePreview} alt="Preview tanaman" width={600} height={300} className="w-full h-56 object-cover rounded-xl" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setStep(1);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-gray-600 hover:text-red-500 text-sm"
                >✕</button>
                <div className="mt-2 text-xs text-gray-400 text-center">
                  {imageFile?.name} ({((imageFile?.size || 0) / 1024).toFixed(0)} KB)
                </div>
              </div>
            ) : (
              <div
                onClick={() => selectedTrackerId && fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#365a1a] hover:bg-[#f0f5ea] transition-all"
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-600 font-medium">Klik untuk upload foto</p>
                <p className="text-gray-400 text-xs mt-1">JPG, PNG, WebP — maks. 5MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="hidden" />
          </motion.div>

          {/* ✅ Rate Limit Banner dengan countdown + progress bar */}
          {rateLimitCountdown !== null && (
            <motion.div variants={fadeUpVariant} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">⏱️</span>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 text-sm">AI sedang istirahat sejenak</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Batas permintaan gratis tercapai. Tombol akan aktif kembali dalam{" "}
                    <span className="font-bold">{rateLimitCountdown} detik</span>.
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                      style={{ width: `${countdownProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error biasa */}
          {error && (
            <motion.div variants={fadeUpVariant} className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-4 text-sm">
              ⚠️ {error}
            </motion.div>
          )}

          {/* Tombol Analisis */}
          {step === 2 && imageFile && selectedTanaman && selectedTrackerId && (
            <motion.div variants={fadeUpVariant}>
              <button
              onClick={handleAnalisis}
              disabled={isAnalisisLoading || rateLimitCountdown !== null}
              className="w-full bg-[#365a1a] hover:bg-[#2d4915] text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalisisLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Menganalisis dengan AI...
                </>
              ) : rateLimitCountdown !== null ? (
                // ✅ Tampilkan countdown di dalam tombol
                `⏳ Coba lagi dalam ${rateLimitCountdown}s`
              ) : (
                "Mulai Analisis"
              )}
              </button>
            </motion.div>
          )}

          {/* STEP 3 — Hasil Analisis */}
          {step === 3 && hasil && (
            <motion.div variants={fadeUpVariant} className="space-y-4">

              {/* ✅ Banner foto tidak valid — tampilkan detectedAs */}
              {hasil.status === "Foto Tidak Valid" && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                  <div className="flex gap-3 items-start">
                    <span className="text-2xl">📷</span>
                    <div>
                      <p className="font-semibold text-orange-800">Foto tidak dapat dianalisis</p>
                      {hasil.detectedAs && (
                        <p className="text-sm text-orange-700 mt-1">
                          <span className="font-medium">Terdeteksi sebagai:</span> {hasil.detectedAs}
                        </p>
                      )}
                      <p className="text-sm text-orange-600 mt-1">
                        Silakan upload foto <span className="font-semibold">{selectedTanaman}</span> yang sesuai.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status card — sembunyikan kalau foto tidak valid (sudah ada banner di atas) */}
              {hasil.status !== "Foto Tidak Valid" && (
                <div className={`rounded-2xl border-2 p-5 ${STATUS_COLOR[hasil.status] || "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide opacity-70">Status Tanaman</div>
                      <div className="text-xl font-bold mt-0.5">{hasil.status}</div>
                      <div className="text-lg font-semibold mt-1">{hasil.diagnosis}</div>
                      {hasil.tingkatKeparahan && hasil.tingkatKeparahan !== "Tidak Ada" && hasil.tingkatKeparahan !== "-" && (
                        <div className="text-sm mt-1 opacity-80">Keparahan: {hasil.tingkatKeparahan}</div>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${URGENSI_COLOR[hasil.urgensi] || "bg-gray-400 text-white"}`}>
                      {hasil.urgensi}
                    </span>
                  </div>
                </div>
              )}

              {/* Gejala */}
              {hasil.gejala && hasil.gejala.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#d9d9d9] shadow-sm p-5">
                  <h3 className="font-semibold text-gray-700 mb-3">Gejala yang Terdeteksi</h3>
                  <ul className="space-y-2">
                    {hasil.gejala.map((g, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 mt-0.5">•</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Penyebab — sembunyikan kalau foto tidak valid */}
              {hasil.penyebab && hasil.status !== "Foto Tidak Valid" && (
                <div className="bg-white rounded-2xl border border-[#d9d9d9] shadow-sm p-5">
                  <h3 className="font-semibold text-gray-700 mb-2">Penyebab</h3>
                  <p className="text-sm text-gray-600">{hasil.penyebab}</p>
                </div>
              )}

              {/* Solusi / Tips upload */}
              {hasil.solusi && hasil.solusi.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#d9d9d9] shadow-sm p-5">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    {hasil.status === "Foto Tidak Valid" ? "Tips Upload Foto yang Benar" : "Langkah Penanganan"}
                  </h3>
                  <ol className="space-y-2">
                    {hasil.solusi.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-600">
                        <span className="bg-[#365a1a] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Pencegahan */}
              {hasil.pencegahan && hasil.pencegahan.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#d9d9d9] shadow-sm p-5">
                  <h3 className="font-semibold text-gray-700 mb-3">Saran ke Depan</h3>
                  <ul className="space-y-2">
                    {hasil.pencegahan.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 mt-0.5">✓</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasil.rawText && (
                <div className="bg-white rounded-2xl border border-[#d9d9d9] shadow-sm p-5">
                  <h3 className="font-semibold text-gray-700 mb-2">Hasil Analisis</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{hasil.rawText}</p>
                </div>
              )}

              {hasil.status !== "Foto Tidak Valid" && (
                <p className="text-xs text-gray-400 text-center px-4">
                  ⚠️ Hasil ini merupakan estimasi AI dan bukan pengganti konsultasi dengan ahli pertanian.
                </p>
              )}

              {selectedTrackerId && selectedTanaman && (
                <Link
                  href={`/observation/${getPlantSlug(selectedTanaman)}/history?trackerId=${encodeURIComponent(selectedTrackerId)}`}
                  className="block w-full rounded-xl border-2 border-[#365a1a] bg-white py-3.5 text-center font-semibold text-[#365a1a] hover:bg-[#f0f5ea] transition-all"
                >
                  Lihat hasil di Monitoring Lahan
                </Link>
              )}

              <button
                onClick={handleReset}
                className="w-full border-2 border-[#365a1a] text-[#365a1a] font-semibold py-3.5 rounded-xl hover:bg-[#f0f5ea] transition-all"
              >
                {hasil.status === "Foto Tidak Valid" ? "🔄 Upload Foto Ulang" : "🔄 Analisis Tanaman Lain"}
              </button>

            </motion.div>
          )}

        </div>
      </motion.section>
    </div>
  );
}
