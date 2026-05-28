"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Calendar, ThermometerSun, Leaf, Ruler, Scale } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, Variants } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import { toast } from "react-hot-toast";
import { UserButton } from "@clerk/nextjs";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } as const }
};

const imgLogo = "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop";
const imgProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

interface FormData {
  trackerSelect: string;
  dayNumber: string;
  plantHeight: string;
  leafCount: string;
  branchCount: string;
  soilPh: string;
  lightCondition: string;
  plantCondition: string;
  fertilizerType: string;
  landArea: string;
}

interface TrackerData {
  id: string;
  title: string;
  plant_type: string;
  user_id: string;
  created_at: string;
}

interface TrackerSampleData {
  id: string;
  tracker_id: string;
  sample_no: number;
  name: string | null;
  created_at?: string;
}

export default function ObservationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useUser();
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();
  const trackerIdFromQuery = searchParams.get("trackerId") || "";
  const sampleIdFromQuery = searchParams.get("sampleId") || "";
  
  const [formData, setFormData] = useState<FormData>({
    trackerSelect: "",
    dayNumber: "",
    plantHeight: "",
    leafCount: "",
    branchCount: "",
    soilPh: "7",
    lightCondition: "Cukup",
    plantCondition: "Sehat",
    fertilizerType: "NPK",
    landArea: "1",
  });

  const [trackers, setTrackers] = useState<TrackerData[]>([]);
  const [trackerSamples, setTrackerSamples] = useState<TrackerSampleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const userId = user?.id;

  // Fetch user's trackers
  useEffect(() => {
    if (userLoading) return;

    if (!userId) {
      console.log("No user found, redirecting...");
      setLoading(false);
      return;
    }

    const fetchTrackers = async () => {
      try {
        console.log("Fetching trackers for user:", userId);
        const response = await fetch("/api/observation/history", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Failed to fetch trackers");
        }

        const data = result.trackers || [];
        console.log("Trackers fetched:", data);
        setTrackers(data);

        // Preselect tracker from query when available, otherwise set first tracker as default
        if (trackerIdFromQuery && data && data.some((tracker: TrackerData) => tracker.id === trackerIdFromQuery)) {
          setFormData((prev) => ({
            ...prev,
            trackerSelect: trackerIdFromQuery,
          }));
        } else if (data && data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            trackerSelect: data[0].id,
          }));
        }
      } catch (error) {
        console.error("Error fetching trackers:", error);
        toast.error("Gagal memuat daftar tracker", { id: "Gagal memuat daftar tracker" });
      } finally {
        setLoading(false);
      }
    };

    fetchTrackers();
  }, [userId, userLoading, trackerIdFromQuery]);

  useEffect(() => {
    if (!formData.trackerSelect) {
      setTrackerSamples([]);
      return;
    }

    const fetchTrackerSamples = async () => {
      try {
        const { data, error } = await supabase
          .from("tracker_samples")
          .select("id, tracker_id, sample_no, name, created_at")
          .eq("tracker_id", formData.trackerSelect)
          .order("sample_no", { ascending: true });

        if (error) throw error;

        setTrackerSamples((data || []) as TrackerSampleData[]);
      } catch (error) {
        console.error("Error fetching tracker samples:", error);
      }
    };

    fetchTrackerSamples();
  }, [formData.trackerSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.trackerSelect) {
      toast.error("Pilih tracker terlebih dahulu", { id: "Pilih tracker terlebih dahulu" });
      return;
    }
    if (!formData.dayNumber || parseInt(formData.dayNumber) < 1) {
      toast.error("Masukkan hari pengamatan yang valid", { id: "Masukkan hari pengamatan yang valid" });
      return;
    }
    if (!formData.plantHeight || parseFloat(formData.plantHeight) <= 0) {
      toast.error("Masukkan tinggi tanaman yang valid", { id: "Masukkan tinggi tanaman yang valid" });
      return;
    }
    if (!formData.leafCount || parseInt(formData.leafCount) < 0) {
      toast.error("Masukkan jumlah daun yang valid", { id: "Masukkan jumlah daun yang valid" });
      return;
    }
    if (!formData.soilPh || parseFloat(formData.soilPh) < 0 || parseFloat(formData.soilPh) > 14) {
      toast.error("Masukkan nilai pH tanah yang valid (0-14)", { id: "Masukkan nilai pH tanah yang valid (0-14)" });
      return;
    }
    if (!formData.lightCondition.trim()) {
      toast.error("Kondisi cahaya wajib diisi", { id: "Kondisi cahaya wajib diisi" });
      return;
    }
    if (!formData.plantCondition.trim()) {
      toast.error("Kondisi tanaman wajib diisi", { id: "Kondisi tanaman wajib diisi" });
      return;
    }
    if (!formData.fertilizerType.trim()) {
      toast.error("Jenis pupuk wajib diisi", { id: "Jenis pupuk wajib diisi" });
      return;
    }
    if (!formData.landArea || parseFloat(formData.landArea) <= 0) {
      toast.error("Luas lahan wajib diisi dan harus lebih dari 0", { id: "Luas lahan wajib diisi dan harus lebih dari 0" });
      return;
    }

    setSubmitting(true);

    try {
      const selectedTracker = trackers.find((t) => t.id === formData.trackerSelect);
      if (!selectedTracker) {
        toast.error("Tracker tidak ditemukan", { id: "Tracker tidak ditemukan" });
        setSubmitting(false);
        return;
      }

      const dayNumber = parseInt(formData.dayNumber);
      const plantHeight = parseFloat(formData.plantHeight);
      const leafCount = parseInt(formData.leafCount);
      const branchCount = formData.branchCount ? parseInt(formData.branchCount) : 0;
      const soilPh = parseFloat(formData.soilPh);
      const landArea = parseFloat(formData.landArea);
      const selectedSample = trackerSamples.find((sample) => sample.id === sampleIdFromQuery) || trackerSamples[0] || null;

      if (!selectedSample) {
        toast.error("Pilih sampel terlebih dahulu dari history", { id: "Pilih sampel terlebih dahulu dari history" });
        setSubmitting(false);
        return;
      }

      console.log("Saving data for tracker:", selectedTracker.id, "sample:", selectedSample.id);
      console.log("Data:", {
        tracker_id: formData.trackerSelect,
        sample_id: selectedSample.id,
        day_number: dayNumber,
        plant_height: plantHeight,
        leaf_count: leafCount,
        branch_count: branchCount,
        soil_ph: soilPh,
        light_condition: formData.lightCondition.trim(),
        plant_condition: formData.plantCondition.trim(),
        fertilizer_type: formData.fertilizerType.trim(),
        land_area: landArea,
      });

      const { error: sampleInsertError } = await supabase.from("growth_sample_logs").insert({
        tracker_id: formData.trackerSelect,
        sample_id: selectedSample.id,
        day_number: dayNumber,
        plant_height: plantHeight,
        leaf_count: leafCount,
        branch_count: branchCount,
        soil_ph: soilPh,
        light_condition: formData.lightCondition.trim(),
        plant_condition: formData.plantCondition.trim(),
        fertilizer_type: formData.fertilizerType.trim(),
        land_area: landArea,
      });

      if (sampleInsertError) {
        console.error("Supabase sample insert error:", sampleInsertError, JSON.stringify(sampleInsertError));
        throw sampleInsertError;
      }

      const { data: sampleRows, error: sampleRowsError } = await supabase
        .from("growth_sample_logs")
        .select("plant_height, leaf_count, branch_count, soil_ph, light_condition, plant_condition, fertilizer_type, land_area")
        .eq("tracker_id", formData.trackerSelect)
        .eq("day_number", dayNumber);

      if (sampleRowsError) {
        console.error("Supabase sample read error:", sampleRowsError, JSON.stringify(sampleRowsError));
        throw sampleRowsError;
      }

      const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
      const sampleLogs = (sampleRows || []) as Array<{ plant_height: number; leaf_count: number; branch_count: number; soil_ph: number; light_condition: string; plant_condition: string; fertilizer_type: string; land_area: number }>;
      const aggregated = {
        tracker_id: formData.trackerSelect,
        day_number: dayNumber,
        plant_height: Number(avg(sampleLogs.map((item) => Number(item.plant_height))).toFixed(2)),
        leaf_count: Math.round(avg(sampleLogs.map((item) => Number(item.leaf_count)))),
        branch_count: Math.round(avg(sampleLogs.map((item) => Number(item.branch_count || 0)))),
        soil_ph: Number(avg(sampleLogs.map((item) => Number(item.soil_ph))).toFixed(2)),
        light_condition: formData.lightCondition.trim(),
        plant_condition: formData.plantCondition.trim(),
        fertilizer_type: formData.fertilizerType.trim(),
        land_area: Number(avg(sampleLogs.map((item) => Number(item.land_area))).toFixed(2)),
      };

      const { data: existingGrowth, error: existingGrowthError } = await supabase
        .from("growth_logs")
        .select("id")
        .eq("tracker_id", formData.trackerSelect)
        .eq("day_number", dayNumber)
        .maybeSingle();

      if (existingGrowthError) {
        console.error("Supabase existing growth read error:", existingGrowthError, JSON.stringify(existingGrowthError));
        throw existingGrowthError;
      }

      if (existingGrowth?.id) {
        const { error: updateError } = await supabase.from("growth_logs").update(aggregated).eq("id", existingGrowth.id);
        if (updateError) {
          console.error("Supabase growth update error:", updateError, JSON.stringify(updateError));
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase.from("growth_logs").insert(aggregated);
        if (insertError) {
          console.error("Supabase growth insert error:", insertError, JSON.stringify(insertError));
          throw insertError;
        }
      }

      toast.success("Data pengamatan berhasil disimpan!", { id: "Data pengamatan berhasil disimpan!" });
      console.log("Redirecting to:", `/observation/${selectedTracker.plant_type}/history?trackerId=${selectedTracker.id}`);
      
      // Redirect to history page (use replace so browser back doesn't return to the form)
      router.replace(`/observation/${selectedTracker.plant_type}/history?trackerId=${selectedTracker.id}`);
    } catch (error: any) {
      console.error("Error saving data:", error, JSON.stringify(error));
      toast.error(`Gagal menyimpan data pengamatan: ${error?.message ?? "Unknown error"}`, { id: `Gagal menyimpan data pengamatan: ${error?.message ?? "Unknown error"}` });
      setSubmitting(false);
    }
  };

  if (userLoading || loading) {
    return (
      <main className="min-h-screen bg-[#f4f4f4]">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#365a1a] mx-auto mb-4"></div>
            <p className="text-[#365a1a] text-lg font-semibold">Memuat data...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f4f4f4]">
        <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
            <img alt="Agrigrowth logo" loading="lazy" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
            <b className="text-[20px] leading-none sm:text-[21px] text-[#365a1a]">Agrigrowth Monitor</b>
          </Link>
        </header>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-center">
            <p className="text-[#365a1a] text-lg font-semibold mb-4">Silakan login terlebih dahulu</p>
            <Link href="/" className="inline-block rounded-lg bg-[#365a1a] px-6 py-3 text-white font-bold hover:bg-[#2d4915]">
              Kembali ke Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4]">
      {/* Header */}
      <header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
          <img alt="Agrigrowth logo" loading="lazy" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
          <b className="text-[20px] leading-none sm:text-[21px] text-[#365a1a]">Agrigrowth Monitor</b>
        </Link>

        <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-10 text-[21px] font-bold lg:flex text-[#365a1a]">
          <Link href="/" className="hover:opacity-80 transition">
            Home
          </Link>
          <Link href="/about" className="hover:opacity-80 transition">
            About
          </Link>
          <Link href="/growth-tracker" className="hover:opacity-80 transition">
            Growth Tracker
          </Link>
          <Link href="/weather" className="hover:opacity-80 transition">
            Weather
          </Link>
          <Link href="/history" className="hover:opacity-80 transition">
            History
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <UserButton showName={true} appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 shadow-md" } }} />
        </div>
      </header>

      {/* Content */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-[800px] px-4 sm:px-6 pb-12 pt-6 sm:pt-10"
      >
        <motion.div variants={fadeUpVariant} className="mb-6 sm:mb-8 text-center">
          <h1 className="text-xl sm:text-2xl md:text-[32px] font-extrabold text-[#365a1a] mb-2">Input Data Pengamatan</h1>
          <p className="text-xs sm:text-sm md:text-base text-[#365a1a]/70 mb-6 sm:mb-8">Masukkan data pertumbuhan tanaman Anda</p>
        </motion.div>

        <motion.div variants={fadeUpVariant} className="rounded-[24px] sm:rounded-[30px] border-2 border-[#365a1a] bg-white p-5 sm:p-8 md:p-10 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.1),-6px_6px_15px_0px_rgba(0,0,0,0.1)]">
          {trackers.length === 0 ? (
            <div className="rounded-lg bg-yellow-50 border-2 border-yellow-200 p-6 text-center">
              <p className="text-yellow-800 font-semibold mb-2">Belum ada tracker</p>
              <p className="text-yellow-700 text-sm mb-4">
                Buat tracker terlebih dahulu di dashboard sebelum input data pengamatan
              </p>
              <Link 
                href="/dashboard" 
                className="inline-block rounded-lg bg-[#365a1a] px-6 py-3 text-white font-bold hover:bg-[#2d4915]"
              >
                Buat Tracker
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {trackerSamples.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-[#365a1a] mb-2">
                    Pilih Sampel *
                  </label>
                  <select
                    value={sampleIdFromQuery || trackerSamples[0]?.id || ""}
                    onChange={(e) => router.replace(`/observation/form?trackerId=${encodeURIComponent(formData.trackerSelect)}&sampleId=${encodeURIComponent(e.target.value)}`)}
                    className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                  >
                    {trackerSamples.map((sample) => (
                      <option key={sample.id} value={sample.id}>
                        {sample.name || `Sampel ${sample.sample_no}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tracker Select */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  Pilih Tracker *
                </label>
                <select
                  name="trackerSelect"
                  value={formData.trackerSelect}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                >
                  <option value="">-- Pilih Tracker --</option>
                  {trackers.map((tracker) => (
                    <option key={tracker.id} value={tracker.id}>
                      {tracker.title} ({tracker.plant_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Day Number */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  Hari ke- *
                </label>
                <input
                  type="number"
                  name="dayNumber"
                  value={formData.dayNumber}
                  onChange={handleChange}
                  placeholder="Contoh: 1, 2, 3..."
                  min="1"
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                />
              </div>

              {/* Plant Height */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  Tinggi Tanaman (cm) *
                </label>
                <input
                  type="number"
                  name="plantHeight"
                  value={formData.plantHeight}
                  onChange={handleChange}
                  placeholder="Contoh: 10.5"
                  step="0.1"
                  min="0"
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                />
              </div>

              {/* Leaf Count */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  Jumlah Daun *
                </label>
                <input
                  type="number"
                  name="leafCount"
                  value={formData.leafCount}
                  onChange={handleChange}
                  placeholder="Contoh: 5"
                  min="0"
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                />
              </div>

              {/* Branch Count */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  Jumlah Cabang
                </label>
                <input
                  type="number"
                  name="branchCount"
                  value={formData.branchCount}
                  onChange={handleChange}
                  placeholder="Contoh: 2"
                  min="0"
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                />
              </div>

              {/* Soil PH */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  pH Tanah *
                </label>
                <input
                  type="number"
                  name="soilPh"
                  value={formData.soilPh}
                  onChange={handleChange}
                  placeholder="Contoh: 6.5"
                  step="0.1"
                  min="0"
                  max="14"
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                />
              </div>

              {/* Light Condition */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  Kondisi Cahaya *
                </label>
                <input
                  type="text"
                  name="lightCondition"
                  value={formData.lightCondition}
                  onChange={handleChange}
                  placeholder="Contoh: Cukup"
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                />
              </div>

              {/* Plant Condition */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  Kondisi Tanaman *
                </label>
                <input
                  type="text"
                  name="plantCondition"
                  value={formData.plantCondition}
                  onChange={handleChange}
                  placeholder="Contoh: Sehat"
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                />
              </div>

              {/* Fertilizer Type */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  Jenis Pupuk *
                </label>
                <input
                  type="text"
                  name="fertilizerType"
                  value={formData.fertilizerType}
                  onChange={handleChange}
                  placeholder="Contoh: NPK"
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                />
              </div>

              {/* Land Area */}
              <div>
                <label className="block text-sm font-bold text-[#365a1a] mb-2">
                  Luas Lahan *
                </label>
                <input
                  type="number"
                  name="landArea"
                  value={formData.landArea}
                  onChange={handleChange}
                  placeholder="Contoh: 1"
                  step="0.1"
                  min="0.1"
                  className="w-full rounded-lg border-2 border-[#365a1a] px-4 py-3 text-[#365a1a] placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#365a1a] focus:ring-offset-2"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 rounded-lg border-2 border-[#365a1a] bg-white px-6 py-3 text-[#365a1a] font-bold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-[#365a1a] px-6 py-3 text-white font-bold hover:bg-[#2d4915] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.section>
    </main>
  );
}
