import { NextResponse } from "next/server";
import { getSupabaseService, requireUser } from "../../admin/_utils";

async function verifyTrackerOwnership(supabase: any, trackerId: string, userId: string) {
  const { data, error } = await supabase.from("trackers").select("id, user_id").eq("id", trackerId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.user_id !== userId) return false;
  return true;
}

export async function GET(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const trackerId = searchParams.get("trackerId");

  if (!trackerId) return NextResponse.json({ error: "trackerId required" }, { status: 400 });

  try {
    const supabase = getSupabaseService();
    const isOwner = await verifyTrackerOwnership(supabase, trackerId, user.id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { data, error } = await supabase
      .from("production_costs")
      .select("*")
      .eq("tracker_id", trackerId)
      .order("date", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ costs: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  try {
    const payload = await request.json();
    const supabase = getSupabaseService();
    
    const isOwner = await verifyTrackerOwnership(supabase, payload.tracker_id, user.id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { data, error } = await supabase
      .from("production_costs")
      .insert(payload)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cost: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  try {
    const payload = await request.json();
    const { id, tracker_id, ...updates } = payload;
    
    const supabase = getSupabaseService();
    const isOwner = await verifyTrackerOwnership(supabase, tracker_id, user.id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { data, error } = await supabase
      .from("production_costs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cost: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const trackerId = searchParams.get("trackerId");

    if (!id || !trackerId) return NextResponse.json({ error: "id and trackerId required" }, { status: 400 });

    const supabase = getSupabaseService();
    const isOwner = await verifyTrackerOwnership(supabase, trackerId, user.id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { error } = await supabase
      .from("production_costs")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
