import { NextResponse } from "next/server";
import { getSupabaseService, requireAdmin } from "../_utils";

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data || [] });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const payload = await request.json();
  const { id, name } = payload || {};

  if (!id || !name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("profiles")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
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
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
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
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
