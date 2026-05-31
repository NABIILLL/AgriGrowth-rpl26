"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { motion, Variants } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import GlobalHeader from "@/components/GlobalHeader";

// Animation variants
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

// Logo and profile images
const imgLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";
const imgProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

// Growth tracker cards images
const imgSawahBelakangKampus = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop";
const imgJagungRezon = "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=800&auto=format&fit=crop";
const imgPadiPraktikum = "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop";

// Result page images
const imgRice2 = "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?q=80&w=800&auto=format&fit=crop";
const imgResultField = "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?q=80&w=800&auto=format&fit=crop";
const imgPlantSheaf = "https://api.iconify.design/lucide:wheat.svg?color=%23365a1a";
const imgResultLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";
const imgResultProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

const cropCards = [
  {
    id: "padi",
    title: "Padi",
    image: imgSawahBelakangKampus,
  },
  {
    id: "jagung",
    title: "Jagung",
    image: imgJagungRezon,
  },
  {
    id: "bawang",
    title: "Bawang Merah",
    image: imgPadiPraktikum,
  },
];

export default function Dashboard() {
  const [trackerTitle, setTrackerTitle] = useState("");
  const [isPlantMenuOpen, setIsPlantMenuOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [latestLog, setLatestLog] = useState<any>(null);
  const [activeTrackerTitle, setActiveTrackerTitle] = useState("");
  const [activeTrackerId, setActiveTrackerId] = useState<string | null>(null);
  const [activePlantLabel, setActivePlantLabel] = useState("Padi");
  const [isCreatingTracker, setIsCreatingTracker] = useState(false);
  const { user, isLoading } = useUser();
  const router = useRouter();
  const displayName = !isLoading && user ? user.name : "Guest";
  const userId = user?.id;
  const userRole = user?.role;

  // Block direct access when there is no active Supabase session.
  useEffect(() => {
    if (!isLoading && !userId) {
      router.replace("/");
    }
  }, [isLoading, userId, router]);

  // Redirect admins to the admin dashboard
  useEffect(() => {
    if (!isLoading && userRole === "admin") {
      router.replace("/admin");
    }
  }, [userRole, isLoading, router]);
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();

  const handleCreateTracker = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackerTitle.trim()) {
      setIsPlantMenuOpen(true);
    }
  };

  const handleContinue = async () => {
    if (!selectedPlant) return;

    if (!user || !user.id) {
      toast.error("Anda harus login untuk membuat tracker.", { id: "Anda harus login untuk membuat tracker." });
      return;
    }

    setIsCreatingTracker(true);
    try {
      const { data, error } = await supabase
        .from("trackers")
        .insert({
          user_id: user.id,
          title: trackerTitle,
          plant_type: selectedPlant,
        })
        .select()
        .single();

      if (error) throw error;

      setActiveTrackerId(data.id);
      setActiveTrackerTitle(trackerTitle);
      setActivePlantLabel(
        selectedPlant === "jagung" ? "Jagung" : selectedPlant === "bawang" ? "Bawang Merah" : "Padi",
      );
      setShowAnalysisForm(true);
      setSelectedPlant(null);
      setIsPlantMenuOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal membuat tracker: " + err.message, { id: "Gagal membuat tracker: " + err.message });
    } finally {
      setIsCreatingTracker(false);
    }
  };

  const handleSaveAnalysis = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeTrackerId) {
      toast.error("Tracker ID tidak ditemukan.", { id: "Tracker ID tidak ditemukan." });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const dayNumber = parseInt(formData.get("day_number") as string) || 1;
    const plantHeight = parseFloat(formData.get("plant_height") as string) || null;
    const leafCount = parseInt(formData.get("leaf_count") as string) || null;
    const branchCount = parseInt(formData.get("branch_count") as string) || null;
    const soilPh = parseFloat(formData.get("soil_ph") as string) || null;
    const landArea = parseFloat(formData.get("land_area") as string) || null;

    if (dayNumber < 1) {
      toast.error("Hari pengamatan tidak valid.", { id: "Hari pengamatan tidak valid." });
      return;
    }
    if (plantHeight !== null && plantHeight < 0) {
      toast.error("Tinggi tanaman tidak boleh negatif.", { id: "Tinggi tanaman tidak boleh negatif." });
      return;
    }
    if (leafCount !== null && leafCount < 0) {
      toast.error("Jumlah daun tidak boleh negatif.", { id: "Jumlah daun tidak boleh negatif." });
      return;
    }
    if (branchCount !== null && branchCount < 0) {
      toast.error("Jumlah cabang tidak boleh negatif.", { id: "Jumlah cabang tidak boleh negatif." });
      return;
    }
    if (soilPh !== null && (soilPh < 0 || soilPh > 14)) {
      toast.error("Input pH tanah tidak sesuai (harus antara 0 - 14).", { id: "Input pH tanah tidak sesuai (harus antara 0 - 14)." });
      return;
    }
    if (landArea !== null && landArea < 0) {
      toast.error("Luas lahan tidak boleh negatif.", { id: "Luas lahan tidak boleh negatif." });
      return;
    }

    const lightCondition = formData.get("light_condition") as string || null;
    const plantCondition = formData.get("plant_condition") as string || null;

    // Check if conditions contain only numbers
    const isOnlyNumeric = (str: string | null) => str !== null && /^[0-9.]+$/.test(str);

    if (isOnlyNumeric(lightCondition)) {
      toast.error("Kondisi cahaya tidak boleh hanya berisi angka.", { id: "Kondisi cahaya tidak boleh hanya berisi angka." });
      return;
    }

    if (isOnlyNumeric(plantCondition)) {
      toast.error("Kondisi tanaman tidak boleh hanya berisi angka.", { id: "Kondisi tanaman tidak boleh hanya berisi angka." });
      return;
    }

    const logData = {
      tracker_id: activeTrackerId,
      day_number: dayNumber,
      plant_height: plantHeight,
      leaf_count: leafCount,
      branch_count: branchCount,
      soil_ph: soilPh,
      light_condition: lightCondition,
      plant_condition: plantCondition,
      fertilizer_type: formData.get("fertilizer_type") as string || null,
      land_area: landArea,
    };

    try {
      const { error } = await supabase.from("growth_logs").insert(logData);
      if (error) throw error;

      toast.success("Data pengamatan berhasil disimpan!", { id: "Data pengamatan berhasil disimpan!" });
      setLatestLog(logData);
    } catch (err: any) {
      console.error(err);
      // Ganti pesan error Supabase dengan pesan yang lebih ramah pengguna
      if (err.message?.includes("check_light_not_numeric")) {
        toast.error("Kondisi cahaya tidak boleh hanya berisi angka.", { id: "Kondisi cahaya tidak boleh hanya berisi angka." });
      } else if (err.message?.includes("check_condition_not_numeric")) {
        toast.error("Kondisi tanaman tidak boleh hanya berisi angka.", { id: "Kondisi tanaman tidak boleh hanya berisi angka." });
      } else {
        toast.error("Gagal menyimpan data pengamatan: " + err.message, { id: "Gagal menyimpan data pengamatan: " + err.message });
      }
    }
  };

  if (latestLog) {
    return (
      <main className="min-h-screen bg-[#b8b8b8] text-[#365a1a]">
        <div className="mx-auto min-h-screen w-full max-w-[1440px] bg-white px-5 pb-10 pt-6 sm:px-10 lg:px-14">
          <GlobalHeader variant="light" />

          <h1 className="mt-6 text-center text-[32px] font-extrabold leading-tight sm:text-[40px] lg:text-[56px]">
            Result of ‘{activeTrackerTitle || "Sawah belakang kampus"}’
          </h1>

          <section className="mt-6 grid gap-4 lg:grid-cols-[383px_1fr] lg:items-start lg:gap-5">
            <div className="rounded-[28px] border-[3px] border-[rgba(54,90,26,0.75)] p-4 sm:rounded-[35px] sm:p-5">
              <div className="text-center text-[22px] font-bold sm:text-[26px]">Jenis tanaman</div>
              <div className="mt-2 flex justify-center">
                <img alt="Plant icon" loading="lazy" className="h-[128px] w-[128px] object-contain sm:h-[140px] sm:w-[140px]" src={imgPlantSheaf} />
              </div>
              <div className="text-center text-[22px] font-bold sm:text-[26px]">{activePlantLabel}</div>
            </div>

            <div className="overflow-hidden rounded-[28px] sm:rounded-[35px]">
              <img alt="Rice field" loading="lazy" className="h-[170px] w-full object-cover sm:h-[190px] lg:h-[212px]" src={imgResultField} />
            </div>
          </section>

          <section className="mt-5 rounded-[30px] border-[3px] border-[rgba(54,90,26,0.75)] px-5 py-5 sm:mt-6 sm:px-7 sm:py-6 lg:px-10 lg:py-8">
            <div className="text-[20px] font-bold sm:text-[24px]">Hari ke : {latestLog.day_number}</div>

            <div className="mt-4 space-y-5 text-[16px] font-bold leading-tight sm:text-[18px] lg:text-[22px]">
              <div>
                <p className="text-[#365a1a]">1. Pertumbuhan</p>
                <div className="ml-4 space-y-1 font-medium text-[15px] sm:text-[17px] text-[#365a1a]/90">
                  <p>Tinggi : {latestLog.plant_height} cm</p>
                  <p>Jumlah daun : {latestLog.leaf_count} helai</p>
                  <p>Jumlah cabang : {latestLog.branch_count}</p>
                  <p>Hasil analisa dan rekomendasi : Pertumbuhan optimal dan sesuai harapan.</p>
                </div>
              </div>

              <div>
                <p className="text-[#365a1a]">2. Kondisi lingkungan</p>
                <div className="ml-4 space-y-1 font-medium text-[15px] sm:text-[17px] text-[#365a1a]/90">
                  <p>pH tanah : {latestLog.soil_ph}</p>
                  <p>Cahaya : {latestLog.light_condition}</p>
                  <p>Kondisi tanaman : {latestLog.plant_condition}</p>
                </div>
              </div>

              <div>
                <p className="text-[#365a1a]">3. Kebutuhan pupuk</p>
                <div className="ml-4 space-y-1 font-medium text-[15px] sm:text-[17px] text-[#365a1a]/90">
                  <p>Jenis pupuk : {latestLog.fertilizer_type}</p>
                  <p>Luas lahan : {latestLog.land_area} m²</p>
                  <p>Hasil analisa dan rekomendasi : Pemberian pupuk cukup untuk luas lahan tersebut.</p>
                </div>
              </div>

              <div>
                <p>Review :</p>
                <p className="max-w-[1170px] font-medium leading-[1.25]">
                  Pada hari pertama, tanaman anda membutuhkan Lorem ipsum dolor sit amet,
                  consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.
                  Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus
                  mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla
                  consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec,
                  vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae,
                  justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras
                  dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus.
                  Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam
                  lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla
                  ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi
                  vel augue. Curabitur ullamcorper ultricies
                </p>
              </div>
            </div>
          </section>

          <Link
            href={`/observation/${activePlantLabel === "Bawang Merah" ? "bawang" : activePlantLabel.toLowerCase()}/history`}
            className="mt-6 flex h-[36px] w-full items-center justify-center rounded-full bg-[#365a1a] text-[14px] font-semibold text-white transition hover:bg-[#2d4915] sm:h-[38px] sm:text-[16px] lg:h-[44px] lg:text-[18px]"
          >
            Lihat histori pengamatan ini
          </Link>
        </div>
      </main>
    );
  }

  if (showAnalysisForm) {
    return (
      <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
        <GlobalHeader variant="light" />

        <section className="mx-auto w-full max-w-[1440px] px-5 pb-12 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-[1280px]">
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.08] text-[#365a1a] sm:mt-4 sm:text-[42px] lg:text-[58px]">
              Start your ‘{activeTrackerTitle || "Sawah belakang kampus"}’ analysis
            </h1>

            <form onSubmit={handleSaveAnalysis} className="mt-6 space-y-5">
              <div className="group overflow-hidden border border-[#365a1a]">
                <div className="bg-[#365a1a] px-4 py-2 text-center text-[14px] font-semibold text-white">
                  Input data hari pengamatan
                </div>
                <p className="max-h-0 overflow-hidden bg-white px-4 text-[12px] text-[#365a1a]/80 opacity-0 transition-all duration-200 group-focus-within:max-h-16 group-focus-within:py-2 group-focus-within:opacity-100">
                  Isi nomor hari pengamatan. Tipe data: bilangan bulat (contoh: 1, 2, 3).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px] gap-px bg-[#365a1a]">
                  <input
                    type="text"
                    placeholder="Keterangan (contoh: Hari ke-)"
                    className="h-[38px] bg-white px-4 text-[14px] text-[#365a1a] outline-none placeholder:text-[#9fb08d]"
                  />
                  <div className="relative bg-white">
                    <input
                      name="day_number"
                      type="number"
                      defaultValue="1"
                      min="1"
                      placeholder="Contoh: 1"
                      className="h-[38px] w-full bg-white px-4 pr-10 text-[14px] text-[#365a1a] outline-none"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a7b99b]">⌄</span>
                  </div>
                </div>
              </div>

              <div className="group overflow-hidden border border-[#365a1a]">
                <div className="bg-[#365a1a] px-4 py-2 text-center text-[14px] font-semibold text-white">
                  Input data pertumbuhan tanaman
                </div>
                <p className="max-h-0 overflow-hidden bg-white px-4 text-[12px] text-[#365a1a]/80 opacity-0 transition-all duration-200 group-focus-within:max-h-16 group-focus-within:py-2 group-focus-within:opacity-100">
                  Tinggi tanaman: angka desimal (cm). Jumlah daun dan cabang: bilangan bulat.
                </p>
                <div className="grid grid-cols-1 gap-px bg-[#365a1a] sm:grid-cols-3">
                  <input name="plant_height" type="number" step="0.1" min="0" required placeholder="Tinggi tanaman (cm) - desimal, contoh: 12.5" className="h-[38px] bg-white px-3 text-[13px] text-[#365a1a] outline-none placeholder:text-[#9fb08d]" />
                  <input name="leaf_count" type="number" min="0" required placeholder="Jumlah daun - bilangan bulat, contoh: 8" className="h-[38px] bg-white px-3 text-[13px] text-[#365a1a] outline-none placeholder:text-[#9fb08d]" />
                  <input name="branch_count" type="number" min="0" required placeholder="Jumlah cabang - bilangan bulat, contoh: 2" className="h-[38px] bg-white px-3 text-[13px] text-[#365a1a] outline-none placeholder:text-[#9fb08d]" />
                </div>
              </div>

              <div className="group overflow-hidden border border-[#365a1a]">
                <div className="bg-[#365a1a] px-4 py-2 text-center text-[14px] font-semibold text-white">
                  Input kondisi lingkungan
                </div>
                <p className="max-h-0 overflow-hidden bg-white px-4 text-[12px] text-[#365a1a]/80 opacity-0 transition-all duration-200 group-focus-within:max-h-16 group-focus-within:py-2 group-focus-within:opacity-100">
                  pH tanah: angka desimal 0-14. Kondisi cahaya dan kondisi tanaman: teks singkat.
                </p>
                <div className="grid grid-cols-1 gap-px bg-[#365a1a] sm:grid-cols-3">
                  <input name="soil_ph" type="number" step="0.1" min="0" max="14" required placeholder="pH tanah (0-14) - desimal, contoh: 6.5" className="h-[38px] bg-white px-3 text-[13px] text-[#365a1a] outline-none placeholder:text-[#9fb08d]" />
                  <input name="light_condition" type="text" required placeholder="Kondisi cahaya - teks, contoh: Terik / Teduh" className="h-[38px] bg-white px-3 text-[13px] text-[#365a1a] outline-none placeholder:text-[#9fb08d]" />
                  <input name="plant_condition" type="text" required placeholder="Kondisi tanaman - teks, contoh: Sehat" className="h-[38px] bg-white px-3 text-[13px] text-[#365a1a] outline-none placeholder:text-[#9fb08d]" />
                </div>
              </div>

              <div className="group overflow-hidden border border-[#365a1a]">
                <div className="bg-[#365a1a] px-4 py-2 text-center text-[14px] font-semibold text-white">
                  Kebutuhan pupuk dengan konversi luas lahan
                </div>
                <p className="max-h-0 overflow-hidden bg-white px-4 text-[12px] text-[#365a1a]/80 opacity-0 transition-all duration-200 group-focus-within:max-h-16 group-focus-within:py-2 group-focus-within:opacity-100">
                  Jenis pupuk: teks. Luas lahan: angka desimal (misal m2 atau ha sesuai standar Anda).
                </p>
                <div className="grid grid-cols-1 gap-px bg-[#365a1a] sm:grid-cols-2">
                  <input name="fertilizer_type" type="text" required placeholder="Jenis pupuk - teks, contoh: NPK" className="h-[38px] bg-white px-3 text-[13px] text-[#365a1a] outline-none placeholder:text-[#9fb08d]" />
                  <input name="land_area" type="number" step="0.01" min="0" required placeholder="Luas lahan - desimal, contoh: 120.5" className="h-[38px] bg-white px-3 text-[13px] text-[#365a1a] outline-none placeholder:text-[#9fb08d]" />
                </div>
              </div>

              <button
                type="submit"
                className="h-[36px] w-full rounded-full bg-[#365a1a] text-[14px] font-semibold text-white transition hover:bg-[#2d4915]"
              >
                Simpan
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      <GlobalHeader variant="light" />

      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="bg-[#365a1a] py-14 text-white"
      >
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 sm:px-10 lg:grid-cols-[290px_1fr] lg:items-center lg:gap-9 lg:px-14">
          <motion.div variants={fadeUpVariant}>
            <h1 className="text-5xl font-extrabold leading-[0.95] sm:text-[75px]">Growth Tracker</h1>
            <p className="mt-1.5 text-[25px] font-semibold">Your history</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">
            {cropCards.map((card) => (
              <motion.div key={card.id} variants={fadeUpVariant}>
                <Link
                  href={`/observation/${card.id}/history`}
                  className="group relative block h-[360px] overflow-hidden rounded-[16px] shadow-[-6px_6px_12px_rgba(0,0,0,0.3)] transition hover:shadow-[-6px_6px_20px_rgba(0,0,0,0.5)] sm:h-[396px]"
                >
                  <img alt={card.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" src={card.image} />
                  <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#365a1a] to-transparent opacity-80 transition duration-300 group-hover:opacity-100 group-hover:h-[50%]" />
                  <p className="absolute inset-x-0 bottom-4 text-center text-[20px] font-extrabold text-white transition-transform duration-300 group-hover:-translate-y-2">
                    {card.title}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Create new growth tracker form removed per user request */}

      {isPlantMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[3px]">
          <div className="relative w-full max-w-[300px] rounded-[26px] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)] sm:max-w-[320px]">
            <button
              type="button"
              onClick={() => setIsPlantMenuOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#365a1a] text-sm font-bold text-white"
              aria-label="Close plant menu"
            >
              ×
            </button>

            <div className="pt-3 text-center">
              <h3 className="text-[18px] font-semibold leading-tight text-[#365a1a] sm:text-[20px]">
                Pilih jenis tanaman
              </h3>
              <p className="mt-1 text-[12px] font-light text-[#365a1a]">
                untuk ‘{trackerTitle}’
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { key: "padi", label: "Padi", icon: "🌾" },
                { key: "jagung", label: "Jagung", icon: "🌽" },
                { key: "bawang", label: "Bawang\nMerah", icon: "🧅" },
              ].map((item) => {
                const active = selectedPlant === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedPlant(item.key)}
                    className={
                      "flex h-[62px] flex-col items-center justify-center rounded-[18px] border px-1 text-center transition " +
                      (active ? "border-[#61ae25] bg-[#f7fbf3]" : "border-[#cbd9bf] bg-white")
                    }
                  >
                    <span className="text-[18px] leading-none">{item.icon}</span>
                    <span className="mt-1 whitespace-pre-line text-[10px] leading-tight text-[#365a1a]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedPlant || isCreatingTracker}
              className="mt-5 h-[30px] w-full rounded-full bg-[#365a1a] text-[14px] font-semibold text-white transition hover:bg-[#2d4915] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingTracker ? "Memproses..." : "Lanjut →"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
