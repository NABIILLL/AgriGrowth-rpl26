import { NextResponse } from "next/server";
import { getSupabaseService, requireAdmin } from "../_utils";

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const supabase = getSupabaseService();
    const [growthLogsResult, trackerSamplesResult, sampleLogsResult] = await Promise.all([
      supabase.from("growth_logs").select("*").order("created_at", { ascending: false }),
      supabase.from("tracker_samples").select("id, tracker_id, sample_no, name, created_at").order("created_at", { ascending: false }),
      supabase.from("growth_sample_logs").select("*").order("created_at", { ascending: false }),
    ]);

    if (growthLogsResult.error) {
      return NextResponse.json({ error: growthLogsResult.error.message }, { status: 500 });
    }

    if (trackerSamplesResult.error) {
      return NextResponse.json({ error: trackerSamplesResult.error.message }, { status: 500 });
    }

    if (sampleLogsResult.error) {
      return NextResponse.json({ error: sampleLogsResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      observations: growthLogsResult.data || [],
      growth_logs: growthLogsResult.data || [],
      tracker_samples: trackerSamplesResult.data || [],
      growth_sample_logs: sampleLogsResult.data || [],
    });
  } catch (err) {
    // Fallback if SUPABASE_SERVICE_ROLE_KEY is missing
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    
    const [growthLogsResult, trackerSamplesResult, sampleLogsResult] = await Promise.all([
      authClient.from("growth_logs").select("*").order("created_at", { ascending: false }),
      authClient.from("tracker_samples").select("id, tracker_id, sample_no, name, created_at").order("created_at", { ascending: false }),
      authClient.from("growth_sample_logs").select("*").order("created_at", { ascending: false }),
    ]);

    if (growthLogsResult.error) {
      return NextResponse.json({ error: growthLogsResult.error.message }, { status: 500 });
    }

    if (trackerSamplesResult.error) {
      return NextResponse.json({ error: trackerSamplesResult.error.message }, { status: 500 });
    }

    if (sampleLogsResult.error) {
      return NextResponse.json({ error: sampleLogsResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      observations: growthLogsResult.data || [],
      growth_logs: growthLogsResult.data || [],
      tracker_samples: trackerSamplesResult.data || [],
      growth_sample_logs: sampleLogsResult.data || [],
    });
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const payload = await request.json();
  const { tracker_id, day_number, plant_height, leaf_count } = payload || {};

  if (!tracker_id || !day_number) {
    return NextResponse.json({ error: "tracker_id and day_number are required" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("growth_logs")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ observation: data });
}

export async function PATCH(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const payload = await request.json();
  const { id, ...updates } = payload || {};

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("growth_logs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ observation: data });
}

export async function DELETE(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const payload = await request.json();
  const { id } = payload || {};

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { error } = await supabase
    .from("growth_logs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
