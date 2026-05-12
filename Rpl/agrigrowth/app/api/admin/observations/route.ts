import { NextResponse } from "next/server";
import { getSupabaseService, requireAdmin } from "../_utils";

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("growth_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ observations: data || [] });
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
