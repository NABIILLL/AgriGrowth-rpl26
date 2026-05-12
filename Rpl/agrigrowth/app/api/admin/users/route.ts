import { NextResponse } from "next/server";
import { getSupabaseService, requireAdmin } from "../_utils";

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("perPage") || "50", 10);

  const supabase = getSupabaseService();
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = data?.users?.map((user) => user.id) || [];
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", userIds);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, phone, location, role, bio, created_at, updated_at")
    .in("id", userIds);

  return NextResponse.json({ users: data?.users || [], roles: roles || [], profiles: profiles || [] });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const payload = await request.json();
  const { email, password, name, role, profileRole, phone, location, bio } = payload || {};

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error || !data?.user) {
    return NextResponse.json({ error: error?.message || "Failed to create user" }, { status: 500 });
  }

  if (role) {
    await supabase.from("user_roles").upsert({ user_id: data.user.id, role });
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    name,
    role: profileRole,
    phone,
    location,
    bio,
  });

  return NextResponse.json({ user: data.user });
}

export async function PATCH(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const payload = await request.json();
  const { id, email, password, name, role, profileRole, phone, location, bio } = payload || {};

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { data, error } = await supabase.auth.admin.updateUserById(id, {
    email,
    password,
    user_metadata: name ? { name } : undefined,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (role) {
    await supabase.from("user_roles").upsert({ user_id: id, role });
  }

  await supabase.from("profiles").upsert({
    id,
    name,
    role: profileRole,
    phone,
    location,
    bio,
  });

  return NextResponse.json({ user: data?.user });
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
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
