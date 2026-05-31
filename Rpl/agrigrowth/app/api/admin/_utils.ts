import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const explicitAdminEmails = new Set(["nabilmusannifs@gmail.com"]);
const explicitAdminIds = new Set([
  "c4e28343-c0ce-4217-8b8c-26fbee6a651a",
  "d5e103f3-c0b3-475c-b282-96b203469b66",
]);

type Metadata = Record<string, unknown>;

export type ResolvedUser = {
  id: string;
  email?: string | null;
  role?: string | null;
  source: "supabase" | "clerk";
};

type ClerkApiUser = Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>;

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

const getStringMetadata = (metadata: Metadata | null | undefined, key: string) => {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const isAdminRole = (role?: string | null) => role?.toLowerCase() === "admin";

const isExplicitAdminEmail = (email?: string | null) =>
  !!email && explicitAdminEmails.has(email.toLowerCase());

const isExplicitAdminUser = (user: Pick<ResolvedUser, "id" | "email">) =>
  explicitAdminIds.has(user.id) || isExplicitAdminEmail(user.email);

const getSupabaseUserByEmail = async (email?: string | null) => {
  if (!email) return null;

  const service = getServiceClient();
  const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return null;

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
};

const ensureProfile = async (userId: string, name: string, role?: string | null) => {
  const service = getServiceClient();
  const { data: existingProfile } = await service
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile) return;

  await service.from("profiles").insert({
    id: userId,
    name,
    role: role || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
};

const createSupabaseUserForClerk = async (
  clerkUserId: string,
  email: string,
  name: string,
  role?: string | null,
) => {
  const service = getServiceClient();
  const { data, error } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      name,
      ...(role ? { role } : {}),
    },
  });

  if (error || !data.user) {
    const existingUser = await getSupabaseUserByEmail(email);
    if (existingUser) return existingUser;
    throw new Error(error?.message || `Failed to create Supabase user for Clerk user ${clerkUserId}`);
  }

  return data.user;
};

const getRoleFromTables = async (userId: string) => {
  const service = getServiceClient();

  const { data: roleData } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleData?.role) return roleData.role as string;

  const { data: profileData } = await service
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return (profileData?.role as string | null | undefined) || null;
};

const resolveClerkUser = async (clerkUserId: string, user: ClerkApiUser): Promise<ResolvedUser> => {
  const email = user.primaryEmailAddress?.emailAddress || null;
  const name =
    user.fullName ||
    user.firstName ||
    email?.split("@")[0] ||
    "User";
  const publicMetadata = user.publicMetadata as Metadata;
  const supabaseUuid = getStringMetadata(publicMetadata, "supabase_uuid");
  const role = getStringMetadata(publicMetadata, "role");

  if (supabaseUuid) {
    await ensureProfile(supabaseUuid, name, role);
    return { id: supabaseUuid, email, role, source: "clerk" };
  }

  const client = await clerkClient();
  const supabaseUser = email
    ? (await getSupabaseUserByEmail(email)) ||
      (await createSupabaseUserForClerk(clerkUserId, email, name, role))
    : null;

  if (supabaseUser) {
    await ensureProfile(supabaseUser.id, name, role);
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        ...publicMetadata,
        supabase_uuid: supabaseUser.id,
      },
    });
  }

  return {
    id: supabaseUser?.id || clerkUserId,
    email,
    role: role || (supabaseUser?.user_metadata?.role as string | undefined) || null,
    source: "clerk",
  };
};

const getRequesterFromClerkToken = async (token: string) => {
  if (!process.env.CLERK_SECRET_KEY) return null;

  try {
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const clerkUserId = typeof verified.sub === "string" ? verified.sub : null;
    if (!clerkUserId) return null;

    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    return resolveClerkUser(clerkUserId, user);
  } catch {
    return null;
  }
};

export const getRequester = async (request: Request): Promise<ResolvedUser | null> => {
  const token = getAccessToken(request);

  if (token) {
    const anon = getAnonClient();
    const { data, error } = await anon.auth.getUser(token);

    if (!error && data?.user) {
      return {
        id: data.user.id,
        email: data.user.email,
        role: (data.user.user_metadata?.role as string | undefined) || null,
        source: "supabase",
      };
    }

    const clerkUser = await getRequesterFromClerkToken(token);
    if (clerkUser) return clerkUser;
  }

  const authState = await auth();
  if (!authState.userId) return null;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(authState.userId);
    return resolveClerkUser(authState.userId, user);
  } catch {
    return null;
  }
};

export const getRequesterRole = async (request: Request) => {
  const user = await getRequester(request);
  if (!user) return { user: null, role: null };

  let role = user.role || null;

  try {
    role = (await getRoleFromTables(user.id)) || role;
  } catch {
    // Keep metadata/email fallbacks available if table grants are not ready yet.
  }

  if (isExplicitAdminUser(user)) role = "admin";

  return { user, role };
};

export const requireUser = async (request: Request) => {
  const user = await getRequester(request);
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, response: null };
};

export const requireAdmin = async (request: Request) => {
  const { user, role } = await getRequesterRole(request);
  if (!user) {
    return { userId: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!isAdminRole(role) && !isExplicitAdminUser(user)) {
    return { userId: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: user.id, response: null };
};

export const getSupabaseService = () => getServiceClient();
