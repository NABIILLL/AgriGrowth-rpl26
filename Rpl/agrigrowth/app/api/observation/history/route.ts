import { NextResponse } from "next/server";
import { getSupabaseService, requireUser } from "../../admin/_utils";

const isMissingTableError = (error: any) => {
  const message = String(error?.message || error || "");
  return message.includes("Could not find the table") || error?.code === "42P01";
};

type SamplePayload = {
  plant_height: number;
  leaf_count: number;
  branch_count: number;
  soil_ph: number;
  light_condition: string;
  plant_condition: string;
  fertilizer_type: string;
  land_area: number;
};

const clampSampleCount = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) return 1;
  return Math.min(20, Math.max(1, parsed));
};

const toNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

export async function POST(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  try {
    const payload = await request.json();
    const action = typeof payload?.action === "string" ? payload.action.trim() : "create-tracker";

    if (action === "add-sample") {
      const trackerId = typeof payload?.trackerId === "string" ? payload.trackerId.trim() : "";
      if (!trackerId) {
        return NextResponse.json({ error: "trackerId is required" }, { status: 400 });
      }

      const supabase = getSupabaseService();
      const { data: trackerRow, error: trackerError } = await supabase
        .from("trackers")
        .select("id, user_id")
        .eq("id", trackerId)
        .maybeSingle();

      if (trackerError) {
        return NextResponse.json({ error: trackerError.message }, { status: 500 });
      }

      if (!trackerRow) {
        return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
      }

      if (trackerRow.user_id !== user.id) {
        return NextResponse.json({ error: "Not authorized to modify this tracker" }, { status: 403 });
      }

      const { data: lastSample, error: lastSampleError } = await supabase
        .from("tracker_samples")
        .select("sample_no")
        .eq("tracker_id", trackerId)
        .order("sample_no", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSampleError) {
        return NextResponse.json({ error: lastSampleError.message }, { status: 500 });
      }

      const nextSampleNo = (lastSample?.sample_no || 0) + 1;
      const sampleName = typeof payload?.name === "string" && payload.name.trim() ? payload.name.trim() : `Sampel ${nextSampleNo}`;

      const { data: sampleRow, error: sampleError } = await supabase
        .from("tracker_samples")
        .insert({
          id: crypto.randomUUID(),
          tracker_id: trackerId,
          sample_no: nextSampleNo,
          name: sampleName,
        })
        .select("id, tracker_id, sample_no, name, created_at")
        .single();

      if (sampleError || !sampleRow) {
        return NextResponse.json({ error: sampleError?.message || "Failed to add sample" }, { status: 500 });
      }

      return NextResponse.json({ sample: sampleRow });
    }

    const title = typeof payload?.title === "string" ? payload.title.trim() : "";
    const plantType = typeof payload?.plant_type === "string" ? payload.plant_type.trim() : "";
    const rawSamples = Array.isArray(payload?.samples) ? payload.samples : [];
    const sampleCount = clampSampleCount(payload?.sampleCount ?? rawSamples.length);

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    if (!plantType) {
      return NextResponse.json({ error: "plant_type is required" }, { status: 400 });
    }

    if (rawSamples.length < 1) {
      return NextResponse.json({ error: "At least one sample is required" }, { status: 400 });
    }

    const samples: SamplePayload[] = rawSamples.slice(0, sampleCount).map((sample: any, idx: number) => {
      const plantHeight = toNumber(sample?.plant_height);
      const leafCount = Number.parseInt(String(sample?.leaf_count), 10);
      const branchCount = Number.parseInt(String(sample?.branch_count ?? "0"), 10);
      const soilPh = toNumber(sample?.soil_ph);
      const landArea = toNumber(sample?.land_area);
      const lightCondition = typeof sample?.light_condition === "string" ? sample.light_condition.trim() : "";
      const plantCondition = typeof sample?.plant_condition === "string" ? sample.plant_condition.trim() : "";
      const fertilizerType = typeof sample?.fertilizer_type === "string" ? sample.fertilizer_type.trim() : "";

      if (
        plantHeight === null ||
        plantHeight <= 0 ||
        Number.isNaN(leafCount) ||
        leafCount < 0 ||
        Number.isNaN(branchCount) ||
        branchCount < 0 ||
        soilPh === null ||
        soilPh < 0 ||
        soilPh > 14 ||
        landArea === null ||
        landArea <= 0 ||
        !lightCondition ||
        !plantCondition ||
        !fertilizerType
      ) {
        throw new Error(`Sample ${idx + 1} is invalid`);
      }

      return {
        day_number: 1,
        plant_height: plantHeight,
        leaf_count: leafCount,
        branch_count: branchCount,
        soil_ph: soilPh,
        light_condition: lightCondition,
        plant_condition: plantCondition,
        fertilizer_type: fertilizerType,
        land_area: landArea,
      };
    });

    const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const aggregatedLog = {
      day_number: 1,
      plant_height: Number(avg(samples.map((item) => item.plant_height)).toFixed(2)),
      leaf_count: Math.round(avg(samples.map((item) => item.leaf_count))),
      branch_count: Math.round(avg(samples.map((item) => item.branch_count))),
      soil_ph: Number(avg(samples.map((item) => item.soil_ph)).toFixed(2)),
      light_condition: samples[0].light_condition,
      plant_condition: samples[0].plant_condition,
      fertilizer_type: samples[0].fertilizer_type,
      land_area: Number(avg(samples.map((item) => item.land_area)).toFixed(2)),
    };

    const supabase = getSupabaseService();

    const trackerRes = await supabase
      .from("trackers")
      .insert({ user_id: user.id, title, plant_type: plantType })
      .select("id, title, plant_type, user_id, created_at")
      .single();

    if (trackerRes.error || !trackerRes.data) {
      return NextResponse.json(
        { error: trackerRes.error?.message || "Failed to create tracker" },
        { status: 500 }
      );
    }

    const tracker = trackerRes.data;

    const trackerSamples = samples.map((_: SamplePayload, idx: number) => ({
      id: crypto.randomUUID(),
      tracker_id: tracker.id,
      sample_no: idx + 1,
      name: `Sampel ${idx + 1}`,
    }));

    const trackerSamplesRes = await supabase.from("tracker_samples").insert(trackerSamples).select();
    if (trackerSamplesRes.error) {
      console.error("tracker_samples insert failed", trackerSamplesRes.error);
      await supabase.from("trackers").delete().eq("id", tracker.id);
      return NextResponse.json(
        { error: `tracker_samples insert failed: ${trackerSamplesRes.error.message || "unknown"}` },
        { status: 500 }
      );
    }

    const sampleLogRows = samples.map((sample: SamplePayload, idx: number) => ({
      id: crypto.randomUUID(),
      tracker_id: tracker.id,
      sample_id: trackerSamples[idx].id,
      ...sample,
    }));

    const sampleLogsRes = await supabase.from("growth_sample_logs").insert(sampleLogRows).select();
    if (sampleLogsRes.error) {
      console.error("growth_sample_logs insert failed", sampleLogsRes.error);
      await supabase.from("tracker_samples").delete().eq("tracker_id", tracker.id);
      await supabase.from("trackers").delete().eq("id", tracker.id);
      return NextResponse.json(
        { error: `growth_sample_logs insert failed: ${sampleLogsRes.error.message || "unknown"}` },
        { status: 500 }
      );
    }

    const growthLogRes = await supabase
      .from("growth_logs")
      .insert({ tracker_id: tracker.id, ...aggregatedLog })
      .select()
      .single();

    if (growthLogRes.error || !growthLogRes.data) {
      console.error("growth_logs insert failed", growthLogRes.error);
      await supabase.from("growth_sample_logs").delete().eq("tracker_id", tracker.id);
      await supabase.from("tracker_samples").delete().eq("tracker_id", tracker.id);
      await supabase.from("trackers").delete().eq("id", tracker.id);
      return NextResponse.json(
        { error: `growth_logs insert failed: ${growthLogRes.error?.message || "unknown"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tracker,
      tracker_samples: trackerSamplesRes.data || trackerSamples,
      growth_sample_logs: sampleLogsRes.data || sampleLogRows,
      growth_log: growthLogRes.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tracker with samples";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const plantType = searchParams.get("plantType")?.trim() || "";
    const trackerId = searchParams.get("trackerId")?.trim() || "";

    const supabase = getSupabaseService();

    const trackerQuery = supabase
      .from("trackers")
      .select("id, title, plant_type, user_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (plantType) {
      trackerQuery.eq("plant_type", plantType);
    }

    const { data: trackers, error: trackersError } = await trackerQuery;
    if (trackersError) {
      return NextResponse.json({ error: trackersError.message }, { status: 500 });
    }

    let logs: any[] = [];
    let trackerSamples: any[] = [];
    let sampleLogs: any[] = [];
    let diseaseAnalysisLogs: any[] = [];

    if (trackerId) {
      const [{ data: logsData, error: logsError }, { data: samplesData, error: samplesError }, { data: sampleLogsData, error: sampleLogsError }] = await Promise.all([
        supabase.from("growth_logs").select("*").eq("tracker_id", trackerId).order("day_number", { ascending: true }),
        supabase.from("tracker_samples").select("id, tracker_id, sample_no, name, created_at").eq("tracker_id", trackerId).order("sample_no", { ascending: true }),
        supabase.from("growth_sample_logs").select("*").eq("tracker_id", trackerId).order("day_number", { ascending: true }),
      ]);

      let diseaseLogsData: any[] = [];
      let diseaseLogsError: any = null;

      try {
        const diseaseResult = await supabase
          .from("disease_analysis_logs")
          .select("id, tracker_id, plant_type, status, diagnosis, severity, urgency, detected_as, gejala, penyebab, solusi, pencegahan, raw_text, created_at")
          .eq("tracker_id", trackerId)
          .order("created_at", { ascending: false });

        diseaseLogsData = diseaseResult.data || [];
        diseaseLogsError = diseaseResult.error;
      } catch (error) {
        diseaseLogsError = error;
      }

      if (logsError) return NextResponse.json({ error: logsError.message }, { status: 500 });
      if (samplesError) return NextResponse.json({ error: samplesError.message }, { status: 500 });
      if (sampleLogsError) return NextResponse.json({ error: sampleLogsError.message }, { status: 500 });
      if (diseaseLogsError && !isMissingTableError(diseaseLogsError)) return NextResponse.json({ error: diseaseLogsError.message }, { status: 500 });

      logs = logsData || [];
      trackerSamples = samplesData || [];
      sampleLogs = sampleLogsData || [];
      diseaseAnalysisLogs = diseaseLogsData || [];
    }

    return NextResponse.json({ trackers: trackers || [], logs, tracker_samples: trackerSamples, growth_sample_logs: sampleLogs, disease_analysis_logs: diseaseAnalysisLogs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const trackerId = searchParams.get("trackerId")?.trim();

    if (!trackerId) {
      return NextResponse.json({ error: "trackerId is required" }, { status: 400 });
    }

    const supabase = getSupabaseService();

    // Verify ownership
    const { data: trackerRow, error: trackerError } = await supabase.from("trackers").select("id, user_id").eq("id", trackerId).maybeSingle();
    if (trackerError) return NextResponse.json({ error: trackerError.message }, { status: 500 });
    if (!trackerRow) return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
    if (trackerRow.user_id !== user.id) return NextResponse.json({ error: "Not authorized to delete this tracker" }, { status: 403 });

    // Delete dependent rows in order (sample logs, growth logs, tracker_samples, then tracker)
    const deleteSampleLogs = await supabase.from("growth_sample_logs").delete().eq("tracker_id", trackerId);
    if (deleteSampleLogs.error) console.error("Failed to delete growth_sample_logs:", deleteSampleLogs.error);

    const deleteGrowthLogs = await supabase.from("growth_logs").delete().eq("tracker_id", trackerId);
    if (deleteGrowthLogs.error) console.error("Failed to delete growth_logs:", deleteGrowthLogs.error);

    const deleteTrackerSamples = await supabase.from("tracker_samples").delete().eq("tracker_id", trackerId);
    if (deleteTrackerSamples.error) console.error("Failed to delete tracker_samples:", deleteTrackerSamples.error);

    const deleteTracker = await supabase.from("trackers").delete().eq("id", trackerId);
    if (deleteTracker.error) {
      console.error("Failed to delete tracker:", deleteTracker.error);
      return NextResponse.json({ error: deleteTracker.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete tracker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
