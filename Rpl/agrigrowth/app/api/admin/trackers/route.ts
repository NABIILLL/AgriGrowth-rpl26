import { NextResponse } from "next/server";
import { getSupabaseService, requireAdmin } from "../_utils";

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("trackers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trackers: data || [] });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const payload = await request.json();
  const { user_id, title, plant_type } = payload || {};

  if (!user_id || !title) {
    return NextResponse.json({ error: "user_id and title are required" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("trackers")
    .insert({ user_id, title, plant_type })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tracker: data });
}

export async function PATCH(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const payload = await request.json();
  const { id, title, plant_type } = payload || {};

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("trackers")
    .update({ title, plant_type })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tracker: data });
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
    .from("trackers")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
