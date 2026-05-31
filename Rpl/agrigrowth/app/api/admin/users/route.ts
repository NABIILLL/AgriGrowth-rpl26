import { NextResponse } from "next/server";
import { getSupabaseService, requireAdmin } from "../_utils";

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("perPage") || "50", 10);

  try {
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
  } catch {
    // Fallback if SUPABASE_SERVICE_ROLE_KEY is missing
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
    
    // We cannot fetch from auth.admin without service key, so we'll just fetch profiles and roles.
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: profiles } = await authClient
      .from("profiles")
      .select("id, name, phone, location, role, bio, created_at, updated_at");
      
    const userIds = profiles?.map(p => p.id) || [];
    
    const { data: roles } = await authClient
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    // Mock users from profiles since we don't have auth data
    const mockUsers = (profiles || []).map(p => ({
      id: p.id,
      email: p.name ? `${p.name.replace(/\s+/g, '').toLowerCase()}@user.local` : `user_${p.id.slice(0,4)}@user.local`,
      created_at: p.created_at,
      user_metadata: { name: p.name }
    }));

    return NextResponse.json({ users: mockUsers, roles: roles || [], profiles: profiles || [] });
  }
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
    user_metadata: {
      name,
      ...(role ? { role } : {}),
    },
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
    role: role || profileRole,
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
    user_metadata: name || role ? {
      ...(name ? { name } : {}),
      ...(role ? { role } : {}),
    } : undefined,
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
    role: role || profileRole,
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
