import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const getServiceClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase service role env vars");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const getAnonClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase anon env vars");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const getAccessToken = (request: Request) => {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7);
};

export const requireAdmin = async (request: Request) => {
  const token = getAccessToken(request);
  if (!token) {
    return { userId: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const anon = getAnonClient();
  const { data, error } = await anon.auth.getUser(token);

  if (error || !data?.user) {
    return { userId: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const service = getServiceClient();
  const { data: roleData, error: roleError } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (roleError || roleData?.role !== "admin") {
    if (
      data.user.email?.toLowerCase().includes("admin") || 
      data.user.email?.toLowerCase() === "nabilmusannifs@gmail.com" ||
      data.user.user_metadata?.role === "admin"
    ) {
      return { userId: data.user.id, response: null };
    }
    return { userId: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: data.user.id, response: null };
};

export const getSupabaseService = () => getServiceClient();
