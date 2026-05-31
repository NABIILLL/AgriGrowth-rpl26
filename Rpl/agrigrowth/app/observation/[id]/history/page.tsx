"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import GlobalHeader from "@/components/GlobalHeader";
import { UserButton, useSession } from "@clerk/nextjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import * as htmlToImage from "html-to-image";
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

const imgLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";
const imgProfile = "https://api.iconify.design/lucide:user-circle.svg?color=%23365a1a";

interface TrackerData {
  id: string;
  title: string;
  plant_type: string;
  user_id: string;
}
interface SampleInput {
  plant_height: string;
  leaf_count: string;
  branch_count?: string;
  soil_ph: string;
  light_condition: string;
  plant_condition: string;
  fertilizer_type: string;
  land_area: string;
}

interface SampleObservationInput {
  sampleId: string;
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

async function readJsonResponse(response: Response) {
  const body = await response.text();
  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

async function createAuthHeaders(session: ReturnType<typeof useSession>["session"]) {
  const token = await session?.getToken().catch(() => null);
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export default function ObservationHistoryPage() {
  const [costs, setCosts] = useState<any[]>([]);
  const [editingCost, setEditingCost] = useState<any | null>(null);
  const [showCostForm, setShowCostForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trackers, setTrackers] = useState<any[]>([]);
  const [trackerTitle, setTrackerTitle] = useState<string>("");
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [logsRaw, setLogsRaw] = useState<any[]>([]);
  const [trackerSamples, setTrackerSamples] = useState<any[]>([]);
  const [sampleLogsRaw, setSampleLogsRaw] = useState<any[]>([]);
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pengamatan");
  const [showCreateTrackerModal, setShowCreateTrackerModal] = useState(false);
  const [showInputSampleModal, setShowInputSampleModal] = useState(false);
  const [inputSubmitting, setInputSubmitting] = useState(false);
  const [creatingTracker, setCreatingTracker] = useState(false);
  const [addingSample, setAddingSample] = useState(false);
  const [newTrackerName, setNewTrackerName] = useState("");
  const [sampleCount, setSampleCount] = useState<number>(3);
  const defaultSampleInput = {
    plant_height: "",
    leaf_count: "",
    branch_count: "",
    soil_ph: "",
    light_condition: "Sangat Baik",
    plant_condition: "Sehat",
    fertilizer_type: "NPK",
    land_area: "",
  };
  const [sampleInputs, setSampleInputs] = useState<Array<any>>(Array.from({ length: 3 }, () => ({ ...defaultSampleInput })));
  const [expandedSample, setExpandedSample] = useState<number | null>(0);
  const [sampleObservationInput, setSampleObservationInput] = useState<SampleObservationInput>({
    sampleId: "",
    dayNumber: "",
    plantHeight: "",
    leafCount: "",
    branchCount: "",
    soilPh: "7",
    lightCondition: "Sangat Baik",
    plantCondition: "Sehat",
    fertilizerType: "NPK",
    landArea: "1",
  });
  
  // Analysis stats
  const [stats, setStats] = useState({
    startHeight: 0,
    endHeight: 0,
    startLeaf: 0,
    endLeaf: 0,
    daysSpan: 0,
    avgHeightGrowth: 0,
    avgLeafGrowth: 0
  });
  const { user, isLoading } = useUser();
  const userId = user?.id;
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const params = useParams();
  const id = (params as any)?.id as string | undefined;
  const { session } = useSession();
  const searchParams = useSearchParams();
  const trackerIdFromQuery = searchParams ? searchParams.get("trackerId") ?? undefined : undefined;

  const handleSampleCountChange = (nextCount: number) => {
    const clampedCount = Math.min(20, Math.max(1, nextCount));
    setSampleCount(clampedCount);
    setSampleInputs((prev) => Array.from({ length: clampedCount }, (_, idx) => prev[idx] || { ...defaultSampleInput }));
    setExpandedSample((prev) => {
      if (clampedCount <= 0) return null;
      if (prev === null || prev >= clampedCount) return 0;
      return prev;
    });
  };

  const updateSampleInput = (index: number, field: keyof SampleInput, value: string) => {
    setSampleInputs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const getMissingSampleFields = (sample: SampleInput) => {
    const missing: string[] = [];

    if (sample.plant_height.trim() === "") missing.push("tinggi tanaman");
    if (sample.leaf_count.trim() === "") missing.push("jumlah daun");
    if (sample.soil_ph.trim() === "") missing.push("pH tanah");
    if (sample.light_condition.trim() === "") missing.push("kondisi cahaya");
    if (sample.plant_condition.trim() === "") missing.push("kondisi tanaman");
    if (sample.fertilizer_type.trim() === "") missing.push("jenis pupuk");
    if (sample.land_area.trim() === "") missing.push("luas lahan");

    return missing;
  };

  const isSampleFilled = (sample: SampleInput) => getMissingSampleFields(sample).length === 0;

  async function handleAddSamplePlant() {
    if (!userId) {
      toast.error("Anda harus login untuk menambah sampel", { id: "Anda harus login untuk menambah sampel" });
      return;
    }

    if (!selectedTrackerId) {
      toast.error("Pilih tracker terlebih dahulu", { id: "Pilih tracker terlebih dahulu" });
      return;
    }

    setAddingSample(true);
    try {
      const response = await fetch("/api/observation/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await createAuthHeaders(session) || {}),
        },
        credentials: "include",
        body: JSON.stringify({
          action: "add-sample",
          trackerId: selectedTrackerId,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result?.error || "Gagal menambah sampel tanaman");
      }

      const createdSample = result?.sample;
      if (!createdSample) {
        throw new Error("Sampel baru tidak ditemukan");
      }

      setTrackerSamples((prev) => [...prev, createdSample]);
      setSelectedSampleId(createdSample.id);
      setSampleObservationInput((prev) => ({
        ...prev,
        sampleId: createdSample.id,
      }));
      setShowInputSampleModal(true);
      toast.success("Sampel tanaman berhasil ditambahkan", { id: "Sampel tanaman berhasil ditambahkan" });
    } catch (error: any) {
      console.error("Error adding tracker sample:", error);
      toast.error(error?.message || "Gagal menambah sampel tanaman", { id: error?.message || "Gagal menambah sampel tanaman" });
    } finally {
      setAddingSample(false);
    }
  }

  async function handleCreateTrackerWithSamples() {
    if (!userId) {
      toast.error("Anda harus login untuk membuat tracker", { id: "Anda harus login untuk membuat tracker" });
      return;
    }

    if (!newTrackerName.trim()) {
      toast.error("Nama lahan wajib diisi", { id: "Nama lahan wajib diisi" });
      return;
    }

    const missingSampleIndex = sampleInputs.findIndex((sample) => !isSampleFilled(sample));
    if (missingSampleIndex !== -1) {
      const missingFields = getMissingSampleFields(sampleInputs[missingSampleIndex]);
      toast.error(
        `Data Sampel ${missingSampleIndex + 1} belum lengkap: ${missingFields.join(", ")}`,
        { id: `Data Sampel ${missingSampleIndex + 1} belum lengkap` }
      );
      setExpandedSample(missingSampleIndex);
      return;
    }

    let invalidMessage: string | null = null;
    const parsedSamples = sampleInputs.map((sample, idx) => {
      const parsed = {
        plant_height: parseFloat(sample.plant_height),
        leaf_count: parseInt(sample.leaf_count, 10),
        branch_count: parseInt(sample.branch_count || "0", 10),
        soil_ph: parseFloat(sample.soil_ph),
        light_condition: sample.light_condition.trim(),
        plant_condition: sample.plant_condition.trim(),
        fertilizer_type: sample.fertilizer_type.trim(),
        land_area: parseFloat(sample.land_area),
      };

      if (
        Number.isNaN(parsed.plant_height) ||
        parsed.plant_height <= 0 ||
        Number.isNaN(parsed.leaf_count) ||
        parsed.leaf_count < 0 ||
        Number.isNaN(parsed.branch_count) ||
        parsed.branch_count < 0 ||
        Number.isNaN(parsed.soil_ph) ||
        parsed.soil_ph < 0 ||
        parsed.soil_ph > 14 ||
        Number.isNaN(parsed.land_area) ||
        parsed.land_area <= 0
      ) {
        invalidMessage = `Nilai pada Sampel ${idx + 1} tidak valid`;
      }

      return parsed;
    });

    if (invalidMessage) {
      toast.error(invalidMessage, { id: invalidMessage });
      return;
    }

    const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const normalizedSampleCount = Math.min(20, Math.max(1, sampleInputs.length));

    const initialLog = {
      day_number: 1,
      plant_height: Number(avg(parsedSamples.map((item) => item.plant_height)).toFixed(2)),
      leaf_count: Math.round(avg(parsedSamples.map((item) => item.leaf_count))),
      branch_count: Math.round(avg(parsedSamples.map((item) => item.branch_count))),
      soil_ph: Number(avg(parsedSamples.map((item) => item.soil_ph)).toFixed(2)),
      light_condition: parsedSamples[0].light_condition,
      plant_condition: parsedSamples[0].plant_condition,
      fertilizer_type: parsedSamples[0].fertilizer_type,
      land_area: Number(avg(parsedSamples.map((item) => item.land_area)).toFixed(2)),
    };

    setCreatingTracker(true);
    try {
      const response = await fetch("/api/observation/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTrackerName.trim(),
          plant_type: id,
          sampleCount: normalizedSampleCount,
          samples: parsedSamples,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to create tracker");
      }

      const trackerData = result.tracker;
      const trackerSampleRows = result.tracker_samples || [];
      const sampleLogRows = result.growth_sample_logs || [];
      const growthLogRow = result.growth_log;

      setLogsRaw(growthLogRow ? [growthLogRow] : []);
      setTrackerSamples(trackerSampleRows);
      setSampleLogsRaw(sampleLogRows);
      setChartData(growthLogRow ? [{
        day: `Hari ${growthLogRow.day_number}`,
        dayNumber: growthLogRow.day_number,
        height: growthLogRow.plant_height,
        leaf: growthLogRow.leaf_count,
      }] : []);
      setStats(growthLogRow ? {
        startHeight: growthLogRow.plant_height,
        endHeight: growthLogRow.plant_height,
        startLeaf: growthLogRow.leaf_count,
        endLeaf: growthLogRow.leaf_count,
        daysSpan: 1,
        avgHeightGrowth: 0,
        avgLeafGrowth: 0,
      } : { startHeight: 0, endHeight: 0, startLeaf: 0, endLeaf: 0, daysSpan: 0, avgHeightGrowth: 0, avgLeafGrowth: 0 });

      setTrackers((prev) => [trackerData, ...prev]);
      setSelectedTrackerId(trackerData.id);
      setShowCreateTrackerModal(false);
      setNewTrackerName("");
      setSampleCount(3);
      setSampleInputs(Array.from({ length: 3 }, () => ({ ...defaultSampleInput })));
      setExpandedSample(0);
      toast.success("Tracker dan data awal sampel berhasil dibuat", { id: "Tracker dan data awal sampel berhasil dibuat" });
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Error creating tracker with initial samples (detailed):", { err, message });
      toast.error(message || "Gagal membuat tracker", { id: message || "Gagal membuat tracker" });
    } finally {
      setCreatingTracker(false);
    }
  }

  // Fetch list of trackers first
  useEffect(() => {
    async function fetchTrackers() {
      if (!id || isLoading || !userId) {
        if (!loading) setLoading(false);
        return;
      }
      
      try {
        const typeLabel = id === "jagung" ? "Jagung" : id === "bawang" ? "Bawang Merah" : "Padi";
        setTrackerTitle(typeLabel);

        const response = await fetch(`/api/observation/history?plantType=${encodeURIComponent(id)}`, {
          headers: await createAuthHeaders(session),
          credentials: "include",
        });
        const result = await readJsonResponse(response);

        if (!response.ok) throw new Error(result?.error || "Failed to load trackers");

        const fetchedTrackers = result.trackers || [];
        setTrackers(fetchedTrackers);

        if (trackerIdFromQuery) {
          const isTrackerOwned = fetchedTrackers.some((tracker: TrackerData) => tracker.id === trackerIdFromQuery);
          if (isTrackerOwned) {
            setSelectedTrackerId(trackerIdFromQuery);
          }
        }
      } catch (error) {
        console.error("Error fetching trackers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrackers();
  }, [id, userId, isLoading, trackerIdFromQuery]);

  // If after loading there are no trackers, prompt to create one automatically
  useEffect(() => {
    if (!loading && !isLoading && trackers.length === 0) {
      setShowCreateTrackerModal(true);
    }
  }, [loading, isLoading, trackers]);

  // Fetch chart/logs data when tracker is selected
  useEffect(() => {
    async function fetchLogs() {
      if (!selectedTrackerId || !userId) return;

      try {
        const response = await fetch(`/api/observation/history?trackerId=${encodeURIComponent(selectedTrackerId)}&plantType=${encodeURIComponent(id || "")}`, {
          headers: await createAuthHeaders(session),
          credentials: "include",
        });
        const result = await readJsonResponse(response);

        if (!response.ok) throw new Error(result?.error || "Failed to load history");

        const logs = result.logs || [];
        setLogsRaw(logs);

        if (logs.length > 0) {
          const data = logs.map((log: any) => ({
            day: `Hari ${log.day_number}`,
            dayNumber: log.day_number,
            height: log.plant_height || 0,
            leaf: log.leaf_count || 0,
          }));

          setChartData(data);

          const first = data[0];
          const last = data[data.length - 1];
          const daysSpan = last.dayNumber - first.dayNumber || 1;

          const newStats = {
            startHeight: first.height,
            endHeight: last.height,
            startLeaf: first.leaf,
            endLeaf: last.leaf,
            daysSpan,
            avgHeightGrowth: (last.height - first.height) / daysSpan,
            avgLeafGrowth: (last.leaf - first.leaf) / daysSpan
          };
          setStats(newStats);
        } else {
          setChartData([]);
          setStats({ startHeight: 0, endHeight: 0, startLeaf: 0, endLeaf: 0, daysSpan: 0, avgHeightGrowth: 0, avgLeafGrowth: 0 });
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    }
    fetchLogs();
  }, [selectedTrackerId, userId]);

  useEffect(() => {
    async function fetchSamples() {
      if (!selectedTrackerId || !userId) return;

      try {
        const response = await fetch(`/api/observation/history?trackerId=${encodeURIComponent(selectedTrackerId)}&plantType=${encodeURIComponent(id || "")}`, {
          headers: await createAuthHeaders(session),
          credentials: "include",
        });
        const result = await readJsonResponse(response);

        if (!response.ok) throw new Error(result?.error || "Failed to load sample history");

        setTrackerSamples(result.tracker_samples || []);
        setSampleLogsRaw(result.growth_sample_logs || []);
        if (!selectedSampleId && result.tracker_samples?.length) {
          setSelectedSampleId(result.tracker_samples[0].id);
        }
      } catch (error) {
        console.error("Error fetching sample tracker data:", error);
      }
    }

    fetchSamples();
  }, [selectedTrackerId, userId]);

  useEffect(() => {
    if (!selectedSampleId && trackerSamples.length > 0) {
      setSelectedSampleId(trackerSamples[0].id);
    }
  }, [trackerSamples, selectedSampleId]);

  useEffect(() => {
    if (showInputSampleModal && trackerSamples.length > 0) {
      setSampleObservationInput((prev) => ({
        ...prev,
        sampleId: prev.sampleId || selectedSampleId || trackerSamples[0].id,
      }));
    }
  }, [showInputSampleModal, selectedSampleId, trackerSamples]);

  const selectedSample = trackerSamples.find((sample) => String(sample.id) === String(selectedSampleId)) || trackerSamples[0] || null;
  const selectedSampleChartData = sampleLogsRaw
    .filter((log) => !selectedSampleId || String(log.sample_id) === String(selectedSampleId))
    .map((log) => ({
      day: `Hari ${log.day_number}`,
      dayNumber: log.day_number,
      height: log.plant_height || 0,
      leaf: log.leaf_count || 0,
    }));

  const updateSampleObservationInput = (field: keyof SampleObservationInput, value: string) => {
    setSampleObservationInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetSampleObservationInput = (nextSampleId?: string) => {
    setSampleObservationInput({
      sampleId: nextSampleId || selectedSampleId || trackerSamples[0]?.id || "",
      dayNumber: "",
      plantHeight: "",
      leafCount: "",
      branchCount: "",
      soilPh: "7",
      lightCondition: "Sangat Baik",
      plantCondition: "Sehat",
      fertilizerType: "NPK",
      landArea: "1",
    });
  };

  async function refreshSelectedTrackerData(trackerId: string, preferredSampleId?: string) {
    const response = await fetch(`/api/observation/history?trackerId=${encodeURIComponent(trackerId)}&plantType=${encodeURIComponent(id || "")}`, {
      headers: await createAuthHeaders(session),
      credentials: "include",
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(result?.error || "Failed to refresh history");
    }

    const logs = result.logs || [];
    setLogsRaw(logs);

    if (logs.length > 0) {
      const data = logs.map((log: any) => ({
        day: `Hari ${log.day_number}`,
        dayNumber: log.day_number,
        height: log.plant_height || 0,
        leaf: log.leaf_count || 0,
      }));

      setChartData(data);

      const first = data[0];
      const last = data[data.length - 1];
      const daysSpan = last.dayNumber - first.dayNumber || 1;

      setStats({
        startHeight: first.height,
        endHeight: last.height,
        startLeaf: first.leaf,
        endLeaf: last.leaf,
        daysSpan,
        avgHeightGrowth: (last.height - first.height) / daysSpan,
        avgLeafGrowth: (last.leaf - first.leaf) / daysSpan,
      });
    } else {
      setChartData([]);
      setStats({ startHeight: 0, endHeight: 0, startLeaf: 0, endLeaf: 0, daysSpan: 0, avgHeightGrowth: 0, avgLeafGrowth: 0 });
    }

    const nextSamples = result.tracker_samples || [];
    setTrackerSamples(nextSamples);
    setSampleLogsRaw(result.growth_sample_logs || []);

    const preferredSampleExists = preferredSampleId && nextSamples.some((sample: any) => String(sample.id) === String(preferredSampleId));
    if (preferredSampleExists) {
      setSelectedSampleId(preferredSampleId || null);
    } else if (!selectedSampleId && nextSamples.length > 0) {
      setSelectedSampleId(nextSamples[0].id);
    }
  }

  async function handleSubmitSampleObservation(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedTrackerId) {
      toast.error("Pilih tracker terlebih dahulu", { id: "Pilih tracker terlebih dahulu" });
      return;
    }

    const sampleId = sampleObservationInput.sampleId || selectedSampleId || trackerSamples[0]?.id || "";
    if (!sampleId) {
      toast.error("Pilih sampel terlebih dahulu", { id: "Pilih sampel terlebih dahulu" });
      return;
    }

    const dayNumber = parseInt(sampleObservationInput.dayNumber, 10);
    const plantHeight = parseFloat(sampleObservationInput.plantHeight);
    const leafCount = parseInt(sampleObservationInput.leafCount, 10);
    const branchCount = sampleObservationInput.branchCount ? parseInt(sampleObservationInput.branchCount, 10) : 0;
    const soilPh = parseFloat(sampleObservationInput.soilPh);
    const landArea = parseFloat(sampleObservationInput.landArea);

    if (!dayNumber || dayNumber < 1) {
      toast.error("Masukkan hari pengamatan yang valid", { id: "Masukkan hari pengamatan yang valid" });
      return;
    }
    if (Number.isNaN(plantHeight) || plantHeight <= 0) {
      toast.error("Masukkan tinggi tanaman yang valid", { id: "Masukkan tinggi tanaman yang valid" });
      return;
    }
    if (Number.isNaN(leafCount) || leafCount < 0) {
      toast.error("Masukkan jumlah daun yang valid", { id: "Masukkan jumlah daun yang valid" });
      return;
    }
    if (Number.isNaN(branchCount) || branchCount < 0) {
      toast.error("Masukkan jumlah cabang yang valid", { id: "Masukkan jumlah cabang yang valid" });
      return;
    }
    if (Number.isNaN(soilPh) || soilPh < 0 || soilPh > 14) {
      toast.error("Masukkan nilai pH tanah yang valid (0-14)", { id: "Masukkan nilai pH tanah yang valid (0-14)" });
      return;
    }
    if (!sampleObservationInput.lightCondition.trim()) {
      toast.error("Kondisi cahaya wajib diisi", { id: "Kondisi cahaya wajib diisi" });
      return;
    }
    if (!sampleObservationInput.plantCondition.trim()) {
      toast.error("Kondisi tanaman wajib diisi", { id: "Kondisi tanaman wajib diisi" });
      return;
    }
    if (!sampleObservationInput.fertilizerType.trim()) {
      toast.error("Jenis pupuk wajib diisi", { id: "Jenis pupuk wajib diisi" });
      return;
    }
    if (Number.isNaN(landArea) || landArea <= 0) {
      toast.error("Luas lahan wajib diisi dan harus lebih dari 0", { id: "Luas lahan wajib diisi dan harus lebih dari 0" });
      return;
    }

    const selectedTracker = trackers.find((tracker) => tracker.id === selectedTrackerId);
    if (!selectedTracker) {
      toast.error("Tracker tidak ditemukan", { id: "Tracker tidak ditemukan" });
      return;
    }

    const selectedSample = trackerSamples.find((sample) => String(sample.id) === String(sampleId));
    if (!selectedSample) {
      toast.error("Sampel tidak ditemukan", { id: "Sampel tidak ditemukan" });
      return;
    }

    setInputSubmitting(true);
    try {
      const { error: sampleInsertError } = await supabase.from("growth_sample_logs").insert({
        tracker_id: selectedTracker.id,
        sample_id: selectedSample.id,
        day_number: dayNumber,
        plant_height: plantHeight,
        leaf_count: leafCount,
        branch_count: branchCount,
        soil_ph: soilPh,
        light_condition: sampleObservationInput.lightCondition.trim(),
        plant_condition: sampleObservationInput.plantCondition.trim(),
        fertilizer_type: sampleObservationInput.fertilizerType.trim(),
        land_area: landArea,
      });

      if (sampleInsertError) {
        throw sampleInsertError;
      }

      const { data: sampleRows, error: sampleRowsError } = await supabase
        .from("growth_sample_logs")
        .select("plant_height, leaf_count, branch_count, soil_ph, light_condition, plant_condition, fertilizer_type, land_area")
        .eq("tracker_id", selectedTracker.id)
        .eq("day_number", dayNumber);

      if (sampleRowsError) {
        throw sampleRowsError;
      }

      const sampleLogs = (sampleRows || []) as Array<{ plant_height: number; leaf_count: number; branch_count: number; soil_ph: number; light_condition: string; plant_condition: string; fertilizer_type: string; land_area: number }>;
      const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
      const aggregated = {
        tracker_id: selectedTracker.id,
        day_number: dayNumber,
        plant_height: Number(avg(sampleLogs.map((item) => Number(item.plant_height))).toFixed(2)),
        leaf_count: Math.round(avg(sampleLogs.map((item) => Number(item.leaf_count)))),
        branch_count: Math.round(avg(sampleLogs.map((item) => Number(item.branch_count || 0)))),
        soil_ph: Number(avg(sampleLogs.map((item) => Number(item.soil_ph))).toFixed(2)),
        light_condition: sampleObservationInput.lightCondition.trim(),
        plant_condition: sampleObservationInput.plantCondition.trim(),
        fertilizer_type: sampleObservationInput.fertilizerType.trim(),
        land_area: Number(avg(sampleLogs.map((item) => Number(item.land_area))).toFixed(2)),
      };

      const { data: existingGrowth, error: existingGrowthError } = await supabase
        .from("growth_logs")
        .select("id")
        .eq("tracker_id", selectedTracker.id)
        .eq("day_number", dayNumber)
        .maybeSingle();

      if (existingGrowthError) {
        throw existingGrowthError;
      }

      if (existingGrowth?.id) {
        const { error: updateError } = await supabase.from("growth_logs").update(aggregated).eq("id", existingGrowth.id);
        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase.from("growth_logs").insert(aggregated);
        if (insertError) {
          throw insertError;
        }
      }

      await refreshSelectedTrackerData(selectedTracker.id, selectedSample.id);
      setSelectedSampleId(selectedSample.id);
      setShowInputSampleModal(false);
      resetSampleObservationInput(selectedSample.id);
      toast.success("Data pengamatan berhasil disimpan!", { id: "Data pengamatan berhasil disimpan!" });
    } catch (error: any) {
      console.error("Error saving sample observation:", error, JSON.stringify(error));
      toast.error(`Gagal menyimpan data pengamatan: ${error?.message ?? "Unknown error"}`, { id: `Gagal menyimpan data pengamatan: ${error?.message ?? "Unknown error"}` });
    } finally {
      setInputSubmitting(false);
    }
  }

  // Helper to reload logs (used after edit/delete)
  async function reloadLogs() {
    if (!selectedTrackerId || !userId) return;
    try {
      const { data: logsData, error } = await supabase
        .from("growth_logs")
        .select("*")
        .eq("tracker_id", selectedTrackerId)
        .order("day_number", { ascending: true });

      if (error) throw error;

      const logs = logsData || [];
      setLogsRaw(logs);

      if (logs.length > 0) {
        const data = logs.map((log: any) => ({
          day: `Hari ${log.day_number}`,
          dayNumber: log.day_number,
          height: log.plant_height || 0,
          leaf: log.leaf_count || 0,
        }));

        setChartData(data);

        const first = data[0];
        const last = data[data.length - 1];
        const daysSpan = last.dayNumber - first.dayNumber || 1;

        const newStats = {
          startHeight: first.height,
          endHeight: last.height,
          startLeaf: first.leaf,
          endLeaf: last.leaf,
          daysSpan,
          avgHeightGrowth: (last.height - first.height) / daysSpan,
          avgLeafGrowth: (last.leaf - first.leaf) / daysSpan
        };
        setStats(newStats);
      } else {
        setChartData([]);
        setStats({ startHeight: 0, endHeight: 0, startLeaf: 0, endLeaf: 0, daysSpan: 0, avgHeightGrowth: 0, avgLeafGrowth: 0 });
      }
    } catch (err) {
      console.error("Error reloading logs:", err);
      toast.error("Gagal memuat ulang data", { id: "Gagal memuat ulang data" });
    }
  }

  // Delete a log entry
  async function handleDeleteLog(logId: string) {
    if (!confirm("Hapus data pengamatan ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      // Optimistic UI update: remove locally immediately
      setLogsRaw((prev) => prev.filter((l) => String(l.id) !== String(logId)));

      // Send delete request. Include tracker_id to match RLS policies if present.
      const query = supabase.from("growth_logs").delete().eq("id", logId);
      if (selectedTrackerId) query.eq("tracker_id", selectedTrackerId);

      const { data, error } = await query.select();
      console.log('delete result', { data, error });

      if (error) {
        // revert optimistic removal on failure
        await reloadLogs();
        console.error("Error deleting log:", error);
        toast.error(`Gagal menghapus data: ${error.message || "unknown"}`, { id: `Gagal menghapus data: ${error.message || "unknown"}` });
        return;
      }

      // Success
      toast.success("Data pengamatan berhasil dihapus", { id: "Data pengamatan berhasil dihapus" });
      // ensure UI consistent
      await reloadLogs();
    } catch (err: any) {
      console.error("Error deleting log (unexpected):", err);
      toast.error(`Gagal menghapus data: ${err?.message ?? "unknown"}`, { id: `Gagal menghapus data: ${err?.message ?? "unknown"}` });
      await reloadLogs();
    }
  }

  // Update a log entry
  async function handleUpdateLog(updated: any) {
    try {
      const payload: any = {
        day_number: parseInt(String(updated.day_number)),
        plant_height: parseFloat(String(updated.plant_height)),
        leaf_count: parseInt(String(updated.leaf_count)),
        branch_count: updated.branch_count ? parseInt(String(updated.branch_count)) : 0,
        soil_ph: parseFloat(String(updated.soil_ph || 7)),
        light_condition: updated.light_condition || "",
        plant_condition: updated.plant_condition || "",
        fertilizer_type: updated.fertilizer_type || "",
        land_area: updated.land_area ? parseFloat(String(updated.land_area)) : 1,
      };

      const { error } = await supabase.from("growth_logs").update(payload).eq("id", updated.id);
      if (error) throw error;

      toast.success("Data pengamatan berhasil diperbarui", { id: "Data pengamatan berhasil diperbarui" });
      setEditingLog(null);
      await reloadLogs();
    } catch (err: any) {
      console.error("Error updating log:", err);
      toast.error(`Gagal memperbarui data: ${err?.message ?? "unknown"}`, { id: `Gagal memperbarui data: ${err?.message ?? "unknown"}` });
    }
  }

  // Reload Costs
  async function reloadCosts() {
    if (!selectedTrackerId || !userId) return;
    try {
      const { data, error } = await supabase
        .from("production_costs")
        .select("*")
        .eq("tracker_id", selectedTrackerId)
        .order("date", { ascending: false });
      
      if (error) {
        // If table doesn't exist yet, just ignore or log
        console.error("Error loading costs (maybe table not created?):", error);
        return;
      }
      setCosts(data || []);
    } catch (err) {
      console.error("Failed to load costs", err);
    }
  }

  // Effect to load costs when tracker selected
  useEffect(() => {
    reloadCosts();
  }, [selectedTrackerId, userId]);

  // Handle Save Cost
  async function handleSaveCost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTrackerId) return;
    
    const formData = new FormData(e.currentTarget);
    const costData = {
      tracker_id: selectedTrackerId,
      date: formData.get("date") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
    };

    try {
      if (editingCost) {
        const { error } = await supabase.from("production_costs").update(costData).eq("id", editingCost.id);
        if (error) throw error;
        toast.success("Biaya berhasil diperbarui", { id: "Biaya berhasil diperbarui" });
      } else {
        const { error } = await supabase.from("production_costs").insert(costData);
        if (error) throw error;
        toast.success("Biaya berhasil ditambahkan", { id: "Biaya berhasil ditambahkan" });
      }
      setShowCostForm(false);
      setEditingCost(null);
      reloadCosts();
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menyimpan biaya: " + err.message, { id: "Gagal menyimpan biaya: " + err.message });
    }
  }

  // Delete Cost
  async function handleDeleteCost(id: string) {
    if (!confirm("Hapus data biaya ini?")) return;
    try {
      const { error } = await supabase.from("production_costs").delete().eq("id", id);
      if (error) throw error;
      toast.success("Biaya dihapus", { id: "Biaya dihapus" });
      reloadCosts();
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menghapus biaya", { id: "Gagal menghapus biaya" });
    }
  }

  // Cost categories
  const costCategories = [
    "Bibit", "Pupuk", "Obat-obatan/Pestisida", "Tenaga Kerja", "Sewa Alat", "Transportasi", "Lain-lain"
  ];

  // Calculate Total Costs
  const totalCost = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
  const costByCategory = costs.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + Number(cost.amount);
    return acc;
  }, {} as Record<string, number>);

  // Predictions component (simple heuristic)
  function PredictionsSection({ plantType, avgHeightGrowth, currentHeight, latestLog }: any) {
    const defaults: any = {
      padi: { maturityHeight: 100, ratesPerHa: { N: 150, P: 50, K: 50 } },
      jagung: { maturityHeight: 250, ratesPerHa: { N: 200, P: 60, K: 80 } },
      bawang: { maturityHeight: 50, ratesPerHa: { N: 120, P: 40, K: 60 } },
    };

    const key = plantType === "jagung" ? "jagung" : plantType === "bawang" ? "bawang" : "padi";
    const cfg = defaults[key] || defaults.padi;

    let daysToMaturity: number | null = null;
    let predictedDate: string | null = null;
    if (avgHeightGrowth > 0) {
      daysToMaturity = Math.ceil((cfg.maturityHeight - (currentHeight || 0)) / avgHeightGrowth);
      if (daysToMaturity < 0) daysToMaturity = 0;
      const d = new Date();
      d.setDate(d.getDate() + daysToMaturity);
      predictedDate = d.toLocaleDateString('id-ID');
    }

    // land area from latestLog if available (stored in hectares in the form)
    const landArea = latestLog?.land_area || 1;
    const fertilizer = Object.fromEntries(Object.entries(cfg.ratesPerHa).map(([k, v]) => [k, ((v as number) * landArea).toFixed(1)]));

    return (
      <div>
        <p className="text-sm text-[#365a1a]/80 mb-2">Estimasi sederhana berdasarkan rata-rata pertumbuhan tinggi tanaman.</p>
        {daysToMaturity === null || !predictedDate ? (
          <p className="text-sm text-red-600">Belum cukup data untuk memprediksi panen. Tambah minimal dua titik pengamatan dengan nilai tinggi.</p>
        ) : (
          <div className="space-y-2">
            <p className="font-semibold">Perkiraan hari hingga panen: {daysToMaturity} hari</p>
            <p className="text-sm text-gray-700">Perkiraan tanggal panen: {predictedDate} (estimasi)</p>
            <div className="mt-3">
              <h4 className="font-semibold">Rekomendasi pupuk untuk luas lahan {landArea} ha</h4>
              <ul className="text-sm text-[#365a1a]/80">
                {Object.entries(fertilizer).map(([nutrient, qty]) => (
                  <li key={nutrient}>• {nutrient}: {qty} kg</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-gray-500">Catatan: Angka di atas adalah estimasi dasar. Sesuaikan dengan kondisi lapang dan rekomendasi teknis setempat.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  async function handleExportPDF() {
    if (!userId) {
      toast.error("Anda harus login untuk export PDF", { id: "Anda harus login untuk export PDF" });
      return;
    }
    if (logsRaw.length === 0 && costs.length === 0) {
      toast.error("Tidak ada data untuk di-export", { id: "Tidak ada data untuk di-export" });
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Menyiapkan Transkrip PDF...");

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(54, 90, 26);
      doc.text("Laporan Monitor Pertanian - AgriGrowth", 14, 20);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Lahan: ${trackerTitle}`, 14, 28);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 34);

      let finalY = 40;

      // Ringkasan Pertumbuhan (if exists)
      if (logsRaw.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Ringkasan Pertumbuhan", 14, finalY);
        finalY += 8;

        doc.setFontSize(10);
        doc.text(`Tinggi Awal: ${stats.startHeight} cm | Akhir: ${stats.endHeight} cm | Rata-rata: ${stats.avgHeightGrowth.toFixed(2)} cm/hari`, 14, finalY);
        finalY += 6;
        doc.text(`Daun Awal: ${stats.startLeaf} helai | Akhir: ${stats.endLeaf} helai | Rata-rata: ${stats.avgLeafGrowth.toFixed(2)} helai/hari`, 14, finalY);
        finalY += 10;

        const tableColumn = ["Hari Ke", "Tinggi (cm)", "Jml Daun", "Cabang", "pH Tanah", "Pupuk", "Luas Lahan"];
        const tableRows = logsRaw.map(log => [
          log.day_number.toString(),
          log.plant_height?.toString() || "-",
          log.leaf_count?.toString() || "-",
          log.branch_count?.toString() || "-",
          log.soil_ph?.toString() || "-",
          log.fertilizer_type || "-",
          log.land_area?.toString() || "-"
        ]);

        autoTable(doc, {
          startY: finalY,
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [54, 90, 26] },
          margin: { left: 14, right: 14 }
        });
        
        finalY = ((doc as any).lastAutoTable?.finalY ?? ((doc as any).autoTable?.previous?.finalY) ?? (finalY + 20)) + 15;

        // Rincian Per Sampel
        if (sampleLogsRaw && sampleLogsRaw.length > 0) {
          if (finalY > 250) {
            doc.addPage();
            finalY = 20;
          }
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text("Rincian Data Per Sampel", 14, finalY);
          finalY += 8;

          const sampleColumn = ["Sampel", "Hari", "Tinggi", "Daun", "Cabang", "pH", "Pupuk"];
          const sampleRowsPDF = sampleLogsRaw.map(log => {
            const sample = trackerSamples.find(s => String(s.id) === String(log.sample_id));
            const sampleName = sample ? (sample.name || `Sampel ${sample.sample_no}`) : "Sampel";
            return [
              sampleName,
              log.day_number.toString(),
              log.plant_height?.toString() || "-",
              log.leaf_count?.toString() || "-",
              log.branch_count?.toString() || "-",
              log.soil_ph?.toString() || "-",
              log.fertilizer_type || "-"
            ];
          });

          autoTable(doc, {
            startY: finalY,
            head: [sampleColumn],
            body: sampleRowsPDF,
            theme: 'striped',
            headStyles: { fillColor: [97, 174, 37] },
            margin: { left: 14, right: 14 }
          });
          
          finalY = ((doc as any).lastAutoTable?.finalY ?? ((doc as any).autoTable?.previous?.finalY) ?? (finalY + 20)) + 15;
        }
      }

      // Tabel Biaya
      if (costs.length > 0) {
        if (finalY > 250) {
          doc.addPage();
          finalY = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Laporan Pengelolaan Biaya", 14, finalY);
        finalY += 8;

        const costColumn = ["Tanggal", "Kategori", "Keterangan", "Nominal (Rp)"];
        const costRows = costs.map(cost => [
          new Date(cost.date).toLocaleDateString('id-ID'),
          cost.category,
          cost.description || "-",
          cost.amount.toLocaleString('id-ID')
        ]);

        autoTable(doc, {
          startY: finalY,
          head: [costColumn],
          body: costRows,
          theme: 'grid',
          headStyles: { fillColor: [54, 90, 26] },
          margin: { left: 14, right: 14 }
        });
        
        finalY = ((doc as any).lastAutoTable?.finalY ?? ((doc as any).autoTable?.previous?.finalY) ?? (finalY + 20)) + 10;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Pengeluaran: Rp ${totalCost.toLocaleString('id-ID')}`, 14, finalY);
      }

      // Save PDF
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const dateStr = `${dd}${mm}${yy}`;
      const baseFileName = `Laporan_${trackerTitle}_${dateStr}.pdf`;
      
      doc.save(baseFileName);

      try {
        const pdfBlob = doc.output("blob");
        const fileName = `${userId}/${baseFileName}`;
        await supabase.storage.from("agrigrowthpdf").upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });
      } catch (err) {
        console.warn("Gagal upload ke supabase storage, tapi file sudah terunduh lokal:", err);
      }

      toast.success("Transkrip PDF berhasil diunduh!", { id: toastId });
    } catch (err: any) {
      console.error("Export PDF Error:", err);
      toast.error(`Gagal membuat PDF: ${err.message}`, { id: toastId });
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  }

  function handleExportExcel() {
    if (logsRaw.length === 0 && costs.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      if (logsRaw.length > 0) {
        const growthData = logsRaw.map(log => ({
          "Hari Ke": log.day_number,
          "Tinggi Tanaman (cm)": log.plant_height,
          "Jumlah Daun": log.leaf_count,
          "Jumlah Cabang": log.branch_count,
          "pH Tanah": log.soil_ph,
          "Kondisi Cahaya": log.light_condition,
          "Kondisi Tanaman": log.plant_condition,
          "Jenis Pupuk": log.fertilizer_type,
          "Luas Lahan (Ha)": log.land_area
        }));
        const wsGrowth = XLSX.utils.json_to_sheet(growthData);
        XLSX.utils.book_append_sheet(wb, wsGrowth, "Pertumbuhan");

        if (sampleLogsRaw && sampleLogsRaw.length > 0) {
          const sampleData = sampleLogsRaw.map(log => {
            const sample = trackerSamples.find(s => String(s.id) === String(log.sample_id));
            const sampleName = sample ? (sample.name || `Sampel ${sample.sample_no}`) : "Sampel";
            return {
              "Sampel": sampleName,
              "Hari Ke": log.day_number,
              "Tinggi Tanaman (cm)": log.plant_height,
              "Jumlah Daun": log.leaf_count,
              "Jumlah Cabang": log.branch_count,
              "pH Tanah": log.soil_ph,
              "Kondisi Cahaya": log.light_condition,
              "Kondisi Tanaman": log.plant_condition,
              "Jenis Pupuk": log.fertilizer_type,
              "Luas Lahan (Ha)": log.land_area
            };
          });
          const wsSample = XLSX.utils.json_to_sheet(sampleData);
          XLSX.utils.book_append_sheet(wb, wsSample, "Detail Sampel");
        }
      }

      if (costs.length > 0) {
        const costsData = costs.map(cost => ({
          "Tanggal": new Date(cost.date).toLocaleDateString('id-ID'),
          "Kategori": cost.category,
          "Keterangan": cost.description,
          "Nominal (Rp)": cost.amount
        }));
        const wsCost = XLSX.utils.json_to_sheet(costsData);
        XLSX.utils.book_append_sheet(wb, wsCost, "Biaya");
      }

      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const dateStr = `${dd}${mm}${yy}`;
      
      XLSX.writeFile(wb, `Data_${trackerTitle}_${dateStr}.xlsx`);
      toast.success("Excel berhasil diunduh!");
    } catch (err: any) {
      console.error("Export Excel Error:", err);
      toast.error("Gagal membuat Excel");
    } finally {
      setShowExportMenu(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      {/* Header */}
      <GlobalHeader variant="light" />

      {/* Content */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-[1440px] px-3 sm:px-5 pb-10 sm:pb-12 md:px-10 lg:px-14"
      >
        <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mt-2 sm:mt-4">
          <h1 className="text-lg sm:text-2xl md:text-4xl lg:text-[58px] font-extrabold leading-[1.08] text-[#365a1a]">
            Monitoring Grafik {trackerTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowInputSampleModal(true)}
              disabled={!selectedTrackerId || trackerSamples.length === 0}
              className="rounded-full bg-[#365a1a] px-3 sm:px-6 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-bold text-white shadow-md hover:bg-[#2d4915] hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              ➕ Input
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting || !selectedTrackerId || (logsRaw.length === 0 && costs.length === 0)}
                className="rounded-full bg-white px-3 sm:px-6 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-bold shadow-md border border-[#365a1a]/20 hover:bg-gray-50 hover:shadow-lg transition disabled:opacity-50"
              >
                {isExporting ? "Memproses..." : "📥 Export"}
              </button>
              
              {showExportMenu && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 shadow-xl rounded-xl w-48 py-2 z-50 overflow-hidden">
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-[#365a1a]">
                    📄 Export Laporan PDF
                  </button>
                  <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-[#365a1a]">
                    📊 Export Data Excel
                  </button>
                </div>
              )}
            </div>
            <button className="rounded-full bg-white px-3 sm:px-6 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-bold shadow-md border border-[#365a1a]/20 hover:bg-gray-50 hover:shadow-lg transition">
              📤
            </button>
            <button
              type="button"
              onClick={() => setShowCreateTrackerModal(true)}
              className="rounded-full bg-white px-3 sm:px-6 py-1.5 sm:py-2.5 text-[11px] sm:text-sm font-bold shadow-md border border-[#365a1a]/20 hover:bg-gray-50 hover:shadow-lg transition"
            >
              ➕ Tambah Lahan
            </button>
          </div>
        </motion.div>

        <div id="pdf-content" className="mt-6 sm:mt-10 p-2 sm:p-4 bg-[#f4f4f4]">
          {loading ? (
            <motion.div variants={fadeUpVariant} className="flex flex-col items-center justify-center rounded-[20px] bg-white py-12 sm:py-16 px-4 sm:px-6 text-center shadow-sm border border-gray-100">
              <div className="h-8 sm:h-10 w-8 sm:w-10 animate-spin rounded-full border-4 border-[#365a1a] border-t-transparent"></div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#365a1a] font-medium">Memuat data lahan...</p>
            </motion.div>
          ) : trackers.length === 0 ? (
            <motion.div variants={fadeUpVariant} className="flex flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-[#9fb08d] bg-white py-16 sm:py-24 px-4 sm:px-6 text-center">
              <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-[#f0f4eb] mb-4 sm:mb-6">
                <span className="text-3xl sm:text-5xl">🚜</span>
              </div>
              <h3 className="text-[20px] sm:text-[24px] font-bold text-[#365a1a]">Belum Ada Data Lahan</h3>
              <p className="mt-2 sm:mt-3 text-[14px] sm:text-[16px] text-[#365a1a]/70 max-w-md">
                Anda belum membuat tracker lahan untuk {trackerTitle}. Buat tracker dan mulai input data pengamatan.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateTrackerModal(true)}
                className="mt-4 sm:mt-6 inline-block rounded-full bg-[#365a1a] px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#2d4915] transition"
              >
                Buat Tracker Lahan
              </button>
            </motion.div>
          ) : !selectedTrackerId ? (
            <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-4 sm:p-8 shadow-sm">
              <h2 className="mb-4 sm:mb-6 text-[20px] font-bold sm:text-[28px]">🌾 Pilih Lahan yang Ingin Dimonitor</h2>
              <p className="text-[13px] sm:text-base text-[#365a1a]/70 mb-4 sm:mb-6">Anda memiliki {trackers.length} lahan yang telah dicatat untuk {trackerTitle}:</p>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {trackers.map((tracker) => (
                  <div key={tracker.id} className="relative">
                    <button
                      onClick={() => setSelectedTrackerId(tracker.id)}
                      className="w-full text-left p-3 sm:p-4 rounded-[16px] border-2 border-[#365a1a] bg-gradient-to-br from-[#f0f4eb] to-white hover:bg-[#e8ede0] hover:shadow-md transition"
                    >
                      <h3 className="font-bold text-[16px] sm:text-[18px] text-[#365a1a] mb-1 sm:mb-2">{tracker.title}</h3>
                      <p className="text-xs sm:text-sm text-[#365a1a]/60">
                        Dibuat: {new Date(tracker.created_at).toLocaleDateString('id-ID', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Hapus lahan \"${tracker.title}\"? Tindakan ini akan menghapus semua data terkait.`)) return;
                        try {
                          const resp = await fetch(`/api/observation/history?trackerId=${encodeURIComponent(tracker.id)}`, { method: 'DELETE', credentials: 'include' });
                          const res = await resp.json();
                          if (!resp.ok) throw new Error(res?.error || 'Gagal menghapus lahan');
                          setTrackers((prev) => prev.filter((t) => t.id !== tracker.id));
                          // If deleting selected, clear selection
                          if (String(selectedTrackerId) === String(tracker.id)) setSelectedTrackerId(null);
                          toast.success('Lahan berhasil dihapus');
                        } catch (err: any) {
                          console.error('Error deleting tracker:', err);
                          toast.error(err?.message || 'Gagal menghapus lahan');
                        }
                      }}
                      title="Hapus lahan"
                      className="absolute top-2 right-2 rounded-full bg-white border border-red-200 text-red-600 px-2 py-1 text-xs font-semibold hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : chartData.length > 0 ? (
            <div className="space-y-6 sm:space-y-8">
              <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between rounded-[16px] bg-[#f0f4eb] p-3 sm:p-4 border-l-4 border-[#365a1a] gap-3 sm:gap-4">
                <div>
                  <p className="text-[11px] sm:text-sm text-[#365a1a]/70">Lahan yang dipilih:</p>
                  <p className="text-[16px] sm:text-[20px] font-bold text-[#365a1a]">{trackers.find(t => t.id === selectedTrackerId)?.title}</p>
                </div>
                <button
                  onClick={() => setSelectedTrackerId(null)}
                  className="rounded-full bg-[#365a1a] text-white px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold hover:bg-[#2d4915] transition"
                >
                  ← Kembali ke Daftar
                </button>
              </motion.div>

              {/* Tabs */}
              <motion.div variants={fadeUpVariant} className="flex gap-3 sm:gap-4 border-b-2 border-gray-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("pengamatan")}
                  className={`pb-2 text-[14px] sm:text-[18px] font-bold transition-all whitespace-nowrap ${
                    activeTab === "pengamatan" 
                      ? "border-b-4 border-[#365a1a] text-[#365a1a]" 
                      : "text-gray-400 hover:text-[#365a1a]"
                  }`}
                >
                  📈 Pengamatan & Analisis
                </button>
                <button
                  onClick={() => setActiveTab("biaya")}
                  className={`pb-2 text-[14px] sm:text-[18px] font-bold transition-all whitespace-nowrap ${
                    activeTab === "biaya" 
                      ? "border-b-4 border-[#365a1a] text-[#365a1a]" 
                      : "text-gray-400 hover:text-[#365a1a]"
                  }`}
                >
                  💰 Pengelolaan Biaya
                </button>
              </motion.div>
              
              {activeTab === "pengamatan" && (
                <>
              <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-3 sm:p-4 md:p-6 shadow-sm">
                <h2 className="mb-3 sm:mb-4 text-[18px] sm:text-[20px] font-bold md:text-[24px] uppercase">Analisis Pertumbuhan</h2>
                <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Tinggi Tanaman:</h3>
                    <ul className="space-y-1 text-[12px] sm:text-sm text-[#365a1a]/80">
                      <li>• Awal: {stats.startHeight} cm</li>
                      <li>• Akhir: {stats.endHeight} cm</li>
                      <li>• Total pertumbuhan: {(stats.endHeight - stats.startHeight).toFixed(2)} cm</li>
                      <li>• Rata-rata: {stats.avgHeightGrowth.toFixed(2)} cm/hari</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Jumlah Daun:</h3>
                    <ul className="space-y-1 text-[12px] sm:text-sm text-[#365a1a]/80">
                      <li>• Awal: {stats.startLeaf} helai</li>
                      <li>• Akhir: {stats.endLeaf} helai</li>
                      <li>• Total pertambahan: {stats.endLeaf - stats.startLeaf} helai</li>
                      <li>• Rata-rata: {stats.avgLeafGrowth.toFixed(2)} daun/hari</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 border-t border-gray-100 pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Kesimpulan:</h3>
                    <div className="text-[12px] sm:text-sm space-y-1">
                      <p className="flex items-center gap-2"><span>✓</span> Pertumbuhan tercatat selama {stats.daysSpan} hari dengan baik.</p>
                      <p className="flex items-center gap-2"><span>✓</span> Tidak ada penurunan ekstrim yang tercatat.</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#f0f4eb] px-4 py-3 text-sm text-[#365a1a]">
                    <div className="font-semibold">Grafik per sampel</div>
                    <div>{selectedSample ? selectedSample.name || `Sampel ${selectedSample.sample_no}` : "Pilih sampel"}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[18px] sm:text-[22px] font-bold text-[#365a1a]">🌱 Sampel Tanaman</h2>
                    <p className="text-xs sm:text-sm text-[#365a1a]/70">{trackerSamples.length} sampel aktif untuk lahan ini</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSamplePlant}
                    disabled={!selectedTrackerId || addingSample}
                    className="rounded-full bg-[#365a1a] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#2d4915] transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addingSample ? "Menambahkan..." : "➕ Tambah Sampel"}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {trackerSamples.map((sample) => {
                    const initialSampleLog = sampleLogsRaw.find((log) => String(log.sample_id) === String(sample.id) && Number(log.day_number) === 1);
                    const active = String(selectedSampleId) === String(sample.id);
                    return (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => setSelectedSampleId(sample.id)}
                        className={`rounded-xl border p-4 text-left transition ${active ? "border-[#365a1a] bg-[#f0f4eb] shadow-sm" : "border-[#365a1a]/20 bg-[#f8fbf4] hover:bg-[#eef5e7]"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#365a1a]">{sample.name || `Sampel ${sample.sample_no}`}</p>
                            <p className="mt-1 text-xs text-[#365a1a]/70">Sampel nomor {sample.sample_no}</p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-[#365a1a]">{active ? "Aktif" : "Lihat grafik"}</span>
                        </div>
                        <div className="mt-3 text-sm text-[#365a1a]/80 space-y-1">
                          <p>Tinggi awal: {initialSampleLog?.plant_height ?? "-"} cm</p>
                          <p>Daun awal: {initialSampleLog?.leaf_count ?? "-"}</p>
                          <p>Cabang awal: {initialSampleLog?.branch_count ?? "-"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Grafik Tinggi Tanaman */}
              <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-3 sm:p-4 md:p-6 shadow-sm overflow-hidden">
                <h2 className="mb-3 sm:mb-4 md:mb-6 text-[18px] sm:text-[20px] font-bold md:text-[24px]">📊 GRAFIK TINGGI TANAMAN</h2>
                <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedSampleChartData.length > 0 ? selectedSampleChartData : chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#365a1a', fontSize: 11 }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#365a1a', fontSize: 11 }} dx={-10} unit=" cm" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#365a1a' }}
                      />
                      <Line type="monotone" dataKey="height" name="Tinggi Tanaman" stroke="#365a1a" strokeWidth={3} dot={{ r: 4, fill: '#365a1a', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 sm:mt-4 md:mt-6 border-t border-gray-100 pt-3 sm:pt-4">
                  <p className="text-[13px] sm:text-[16px] font-semibold text-[#365a1a]">Tren: {stats.avgHeightGrowth >= 0 ? '↑ Meningkat' : '↓ Menurun'} ({stats.avgHeightGrowth.toFixed(2)} cm/hari)</p>
                  <p className="text-[12px] sm:text-[14px] text-gray-600">Total tinggi terakhir: {stats.endHeight} cm</p>
                </div>
              </motion.div>

              {/* Grafik Jumlah Daun */}
              <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-3 sm:p-4 md:p-6 shadow-sm overflow-hidden">
                <h2 className="mb-3 sm:mb-4 md:mb-6 text-[18px] sm:text-[20px] font-bold md:text-[24px]">📊 GRAFIK JUMLAH DAUN</h2>
                <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedSampleChartData.length > 0 ? selectedSampleChartData : chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#365a1a', fontSize: 11 }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#365a1a', fontSize: 11 }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#365a1a' }}
                      />
                      <Line type="monotone" dataKey="leaf" name="Jumlah Daun" stroke="#61ae25" strokeWidth={3} dot={{ r: 4, fill: '#61ae25', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 sm:mt-4 md:mt-6 border-t border-gray-100 pt-3 sm:pt-4">
                  <p className="text-[13px] sm:text-[16px] font-semibold text-[#365a1a]">Tren: {stats.avgLeafGrowth >= 0 ? '↑ Bertambah' : '↓ Berkurang'} ({stats.avgLeafGrowth.toFixed(2)} daun/hari)</p>
                  <p className="text-[12px] sm:text-[14px] text-gray-600">Total daun terakhir: {stats.endLeaf} helai</p>
                </div>
              </motion.div>

              {/* Prediksi Panen & Rekomendasi Pupuk */}
              <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-[20px] font-bold sm:text-[24px]">🔮 Prediksi Panen & Rekomendasi Pupuk</h2>
                  <PredictionsSection
                    plantType={id}
                    avgHeightGrowth={stats.avgHeightGrowth}
                    currentHeight={stats.endHeight}
                    latestLog={logsRaw.length ? logsRaw[logsRaw.length - 1] : null}
                  />
                </motion.div>

                {/* Logs list with edit/delete */}
                <motion.div variants={fadeUpVariant} className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-[20px] font-bold sm:text-[24px]">📝 Daftar Pengamatan (Edit / Hapus)</h2>
                  <div className="space-y-3">
                    {logsRaw.map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <div className="font-semibold text-[#365a1a]">Hari {log.day_number} — {log.plant_height} cm • {log.leaf_count} daun</div>
                          <div className="text-sm text-gray-600">pH: {log.soil_ph} • Pupuk: {log.fertilizer_type} • Luas: {log.land_area} ha</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingLog(log)} className="rounded bg-[#365a1a] text-white px-3 py-1 text-sm">Edit</button>
                          <button onClick={() => handleDeleteLog(log.id)} className="rounded bg-white border border-red-400 text-red-600 px-3 py-1 text-sm">Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                </>
              )}

              {activeTab === "biaya" && (
                <div className="space-y-8">
                  {/* Cost Summary Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-[20px] border-2 border-[#365a1a] bg-gradient-to-br from-[#f0f4eb] to-white p-5 shadow-sm">
                      <p className="text-sm font-semibold text-[#365a1a]/70 mb-1">Total Biaya Produksi</p>
                      <h3 className="text-2xl font-extrabold text-[#365a1a]">Rp {totalCost.toLocaleString('id-ID')}</h3>
                    </div>
                    {costCategories.slice(0, 3).map(cat => (
                       <div key={cat} className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm">
                         <p className="text-sm font-semibold text-gray-500 mb-1">{cat}</p>
                         <h3 className="text-xl font-bold text-gray-800">Rp {(costByCategory[cat] || 0).toLocaleString('id-ID')}</h3>
                       </div>
                    ))}
                  </div>

                  {/* Add Cost Button & List */}
                  <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[20px] font-bold sm:text-[24px]">Daftar Biaya</h2>
                      <button 
                        onClick={() => { setEditingCost(null); setShowCostForm(true); }}
                        className="rounded-full bg-[#365a1a] px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-[#2d4915] transition"
                      >
                        + Tambah Biaya
                      </button>
                    </div>

                    {costs.length === 0 ? (
                      <div className="py-12 text-center text-gray-500">
                        Belum ada catatan biaya. Klik "Tambah Biaya" untuk memulai.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b-2 border-gray-100">
                              <th className="py-3 px-2 text-[#365a1a] font-semibold">Tanggal</th>
                              <th className="py-3 px-2 text-[#365a1a] font-semibold">Kategori</th>
                              <th className="py-3 px-2 text-[#365a1a] font-semibold">Keterangan</th>
                              <th className="py-3 px-2 text-[#365a1a] font-semibold">Jumlah (Rp)</th>
                              <th className="py-3 px-2 text-right text-[#365a1a] font-semibold">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {costs.map(cost => (
                              <tr key={cost.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-2 text-sm">{new Date(cost.date).toLocaleDateString('id-ID')}</td>
                                <td className="py-3 px-2 text-sm">
                                  <span className="bg-[#f0f4eb] text-[#365a1a] px-2 py-1 rounded-md font-medium text-xs">
                                    {cost.category}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-sm text-gray-600">{cost.description || "-"}</td>
                                <td className="py-3 px-2 text-sm font-semibold">{Number(cost.amount).toLocaleString('id-ID')}</td>
                                <td className="py-3 px-2 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => { setEditingCost(cost); setShowCostForm(true); }} className="text-[#365a1a] hover:underline text-xs">Edit</button>
                                    <button onClick={() => handleDeleteCost(cost.id)} className="text-red-500 hover:underline text-xs">Hapus</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  
                  {/* Recap Chart / Detailed List */}
                  {costs.length > 0 && (
                    <div className="rounded-[20px] border-2 border-[#365a1a] bg-white p-6 shadow-sm">
                      <h2 className="mb-4 text-[20px] font-bold sm:text-[24px]">📊 Rekap Biaya per Kategori</h2>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(costByCategory).sort((a,b) => (b[1] as number) - (a[1] as number)).map(([cat, amt]) => (
                          <div key={cat} className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="font-medium text-gray-700">{cat}</span>
                            <span className="font-bold text-[#365a1a]">Rp {(amt as number).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-[#9fb08d] bg-white py-24 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f4eb] mb-6">
                <span className="text-5xl">📊</span>
              </div>
              <h3 className="text-[24px] font-bold text-[#365a1a]">Belum Ada Data Pengamatan</h3>
              <p className="mt-3 text-[16px] text-[#365a1a]/70 max-w-md">
                Lahan "{trackers.find(t => t.id === selectedTrackerId)?.title}" belum memiliki data pengamatan. Mulai dengan input data pengamatan sekarang.
              </p>
              <button
                onClick={() => setSelectedTrackerId(null)}
                className="mt-6 inline-block rounded-full bg-[#9fb08d] px-8 py-3 text-sm font-bold text-white hover:bg-[#8a9d7a] transition"
              >
                ← Kembali ke Daftar Lahan
              </button>
            </div>
          )}
        </div>

        {/* Edit modal */}
        {editingLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-xl rounded-lg bg-white p-6">
              <h3 className="text-lg font-bold text-[#365a1a] mb-4">Edit Pengamatan - Hari {editingLog.day_number}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Hari ke-</label>
                  <input type="number" name="day_number" value={editingLog.day_number} onChange={(e) => setEditingLog({...editingLog, day_number: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Tinggi (cm)</label>
                  <input type="number" step="0.1" name="plant_height" value={editingLog.plant_height} onChange={(e) => setEditingLog({...editingLog, plant_height: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Jumlah Daun</label>
                  <input type="number" name="leaf_count" value={editingLog.leaf_count} onChange={(e) => setEditingLog({...editingLog, leaf_count: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Jumlah Cabang</label>
                  <input type="number" name="branch_count" value={editingLog.branch_count} onChange={(e) => setEditingLog({...editingLog, branch_count: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">pH Tanah</label>
                  <input type="number" step="0.1" name="soil_ph" value={editingLog.soil_ph} onChange={(e) => setEditingLog({...editingLog, soil_ph: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Jenis Pupuk</label>
                  <input type="text" name="fertilizer_type" value={editingLog.fertilizer_type} onChange={(e) => setEditingLog({...editingLog, fertilizer_type: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Luas Lahan (ha)</label>
                  <input type="number" step="0.1" name="land_area" value={editingLog.land_area} onChange={(e) => setEditingLog({...editingLog, land_area: e.target.value})} className="w-full rounded border px-3 py-2" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setEditingLog(null)} className="rounded border px-4 py-2">Batal</button>
                <button onClick={() => handleUpdateLog(editingLog)} className="rounded bg-[#365a1a] px-4 py-2 text-white">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {showCreateTrackerModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-3xl rounded-[24px] bg-white p-5 sm:p-7 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#365a1a]">Buat Tracker Lahan</h3>
                  <p className="text-sm text-[#365a1a]/70 mt-1">
                    Isi nama lahan, pilih jumlah sampel, lalu masukkan data awal setiap sampel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateTrackerModal(false)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-[#365a1a] mb-1">Nama Lahan</label>
                  <input
                    type="text"
                    value={newTrackerName}
                    onChange={(e) => setNewTrackerName(e.target.value)}
                    placeholder="Contoh: Sawah Blok A"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#365a1a] mb-1">Jumlah Sampel Percobaan</label>
                  <select
                    value={sampleCount}
                    onChange={(e) => handleSampleCountChange(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] bg-white"
                  >
                    {Array.from({ length: 20 }, (_, idx) => idx + 1).map((count) => (
                      <option key={count} value={count}>
                        {count} Sampel
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {sampleInputs.map((sample, index) => {
                  const expanded = expandedSample === index;
                  const filled = isSampleFilled(sample);
                  return (
                    <div key={`sample-${index}`} className="rounded-xl border border-[#365a1a]/25 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSample(expanded ? null : index)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#f4f8ef] hover:bg-[#edf4e4] transition"
                      >
                        <div className="text-left">
                          <p className="font-semibold text-[#365a1a]">Sampel {index + 1}</p>
                          <p className="text-xs text-[#365a1a]/70">
                            {filled ? `Tinggi ${sample.plant_height} cm • ${sample.leaf_count} daun` : "Belum diisi"}
                          </p>
                        </div>
                        <span className="text-[#365a1a] text-sm">{expanded ? "▲" : "▼"}</span>
                      </button>

                      {expanded && (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Tinggi Tanaman (cm)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={sample.plant_height}
                              onChange={(e) => updateSampleInput(index, "plant_height", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Daun</label>
                            <input
                              type="number"
                              min="0"
                              value={sample.leaf_count}
                              onChange={(e) => updateSampleInput(index, "leaf_count", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Cabang</label>
                            <input
                              type="number"
                              min="0"
                              value={sample.branch_count}
                              onChange={(e) => updateSampleInput(index, "branch_count", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">pH Tanah</label>
                            <input
                              type="number"
                              min="0"
                              max="14"
                              step="0.1"
                              value={sample.soil_ph}
                              onChange={(e) => updateSampleInput(index, "soil_ph", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Kondisi Cahaya</label>
                            <select
                              value={sample.light_condition}
                              onChange={(e) => updateSampleInput(index, "light_condition", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                            >
                              <option value="Sangat Kurang">Sangat Kurang</option>
                              <option value="Kurang">Kurang</option>
                              <option value="Cukup">Cukup</option>
                              <option value="Baik">Baik</option>
                              <option value="Sangat Baik">Sangat Baik</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Kondisi Tanaman</label>
                            <select
                              value={sample.plant_condition}
                              onChange={(e) => updateSampleInput(index, "plant_condition", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                            >
                              <option value="Sehat">Sehat</option>
                              <option value="Cukup Sehat">Cukup Sehat</option>
                              <option value="Kurang Sehat">Kurang Sehat</option>
                              <option value="Layu">Layu</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Jenis Pupuk</label>
                            <select
                              value={sample.fertilizer_type}
                              onChange={(e) => updateSampleInput(index, "fertilizer_type", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                            >
                              <option value="NPK">NPK</option>
                              <option value="Urea">Urea</option>
                              <option value="Kompos">Kompos</option>
                              <option value="Kandang">Kandang</option>
                              <option value="Organik Cair">Organik Cair</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Luas Lahan (ha)</label>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={sample.land_area}
                              onChange={(e) => updateSampleInput(index, "land_area", e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTrackerModal(false)}
                  className="rounded-full border border-gray-300 px-5 py-2 font-medium hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={creatingTracker}
                  onClick={handleCreateTrackerWithSamples}
                  className="rounded-full bg-[#365a1a] px-5 py-2 font-medium text-white hover:bg-[#2d4915] transition disabled:opacity-60"
                >
                  {creatingTracker ? "Menyimpan..." : "Simpan Tracker & Data Awal"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showInputSampleModal && selectedTrackerId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-3xl rounded-[24px] bg-white p-5 sm:p-7 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#365a1a]">Input Data Pengamatan</h3>
                  <p className="text-sm text-[#365a1a]/70 mt-1">
                    Isi data untuk sampel yang dipilih tanpa pindah halaman.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInputSampleModal(false)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>

              {trackerSamples.length === 0 ? (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                  Belum ada sampel untuk tracker ini.
                </div>
              ) : (
                <form onSubmit={handleSubmitSampleObservation} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">Sampel *</label>
                      <select
                        value={sampleObservationInput.sampleId}
                        onChange={(e) => {
                          setSelectedSampleId(e.target.value);
                          updateSampleObservationInput("sampleId", e.target.value);
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] bg-white"
                      >
                        {trackerSamples.map((sample) => (
                          <option key={sample.id} value={sample.id}>
                            {sample.name || `Sampel ${sample.sample_no}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">Hari Pengamatan *</label>
                      <input
                        type="number"
                        min="1"
                        value={sampleObservationInput.dayNumber}
                        onChange={(e) => updateSampleObservationInput("dayNumber", e.target.value)}
                        placeholder="Contoh: 7"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">Tinggi Tanaman (cm) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={sampleObservationInput.plantHeight}
                        onChange={(e) => updateSampleObservationInput("plantHeight", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">Jumlah Daun *</label>
                      <input
                        type="number"
                        min="0"
                        value={sampleObservationInput.leafCount}
                        onChange={(e) => updateSampleObservationInput("leafCount", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">Jumlah Cabang</label>
                      <input
                        type="number"
                        min="0"
                        value={sampleObservationInput.branchCount}
                        onChange={(e) => updateSampleObservationInput("branchCount", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">pH Tanah *</label>
                      <input
                        type="number"
                        min="0"
                        max="14"
                        step="0.1"
                        value={sampleObservationInput.soilPh}
                        onChange={(e) => updateSampleObservationInput("soilPh", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">Kondisi Cahaya *</label>
                      <select
                        value={sampleObservationInput.lightCondition}
                        onChange={(e) => updateSampleObservationInput("lightCondition", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] bg-white"
                      >
                        <option value="Sangat Kurang">Sangat Kurang</option>
                        <option value="Kurang">Kurang</option>
                        <option value="Cukup">Cukup</option>
                        <option value="Baik">Baik</option>
                        <option value="Sangat Baik">Sangat Baik</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">Kondisi Tanaman *</label>
                      <select
                        value={sampleObservationInput.plantCondition}
                        onChange={(e) => updateSampleObservationInput("plantCondition", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] bg-white"
                      >
                        <option value="Sehat">Sehat</option>
                        <option value="Cukup Sehat">Cukup Sehat</option>
                        <option value="Kurang Sehat">Kurang Sehat</option>
                        <option value="Layu">Layu</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">Jenis Pupuk *</label>
                      <select
                        value={sampleObservationInput.fertilizerType}
                        onChange={(e) => updateSampleObservationInput("fertilizerType", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] bg-white"
                      >
                        <option value="NPK">NPK</option>
                        <option value="Urea">Urea</option>
                        <option value="Kompos">Kompos</option>
                        <option value="Kandang">Kandang</option>
                        <option value="Organik Cair">Organik Cair</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#365a1a] mb-1">Luas Lahan (ha) *</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={sampleObservationInput.landArea}
                        onChange={(e) => updateSampleObservationInput("landArea", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInputSampleModal(false)}
                      className="rounded-full border border-gray-300 px-5 py-2 font-medium hover:bg-gray-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={inputSubmitting}
                      className="rounded-full bg-[#365a1a] px-5 py-2 font-medium text-white hover:bg-[#2d4915] transition disabled:opacity-60"
                    >
                      {inputSubmitting ? "Menyimpan..." : "Simpan Data"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Cost Form Modal */}
        {showCostForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
              <h3 className="text-xl font-bold text-[#365a1a] mb-5">
                {editingCost ? "Edit Biaya" : "Tambah Biaya"}
              </h3>
              <form onSubmit={handleSaveCost} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Tanggal</label>
                  <input 
                    type="date" 
                    name="date" 
                    required 
                    defaultValue={editingCost ? editingCost.date : new Date().toISOString().split('T')[0]} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Kategori</label>
                  <select 
                    name="category" 
                    required 
                    defaultValue={editingCost ? editingCost.category : costCategories[0]} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] outline-none bg-white"
                  >
                    {costCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Keterangan</label>
                  <input 
                    type="text" 
                    name="description" 
                    placeholder="Contoh: Beli bibit unggul 5kg"
                    defaultValue={editingCost?.description || ""} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Jumlah Biaya (Rp)</label>
                  <input 
                    type="number" 
                    name="amount" 
                    required 
                    min="0"
                    placeholder="Contoh: 150000"
                    defaultValue={editingCost?.amount || ""} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#365a1a] focus:ring-1 focus:ring-[#365a1a] outline-none" 
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setShowCostForm(false); setEditingCost(null); }} 
                    className="rounded-full border border-gray-300 px-5 py-2 font-medium hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="rounded-full bg-[#365a1a] px-5 py-2 font-medium text-white hover:bg-[#2d4915] transition shadow-md"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Back Button */}
        <Link
          href="/dashboard"
          className="mt-10 inline-block rounded-full bg-[#365a1a] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#2d4915]"
        >
          ← Kembali ke Dashboard
        </Link>
      </motion.section>
    </main>
  );
}
