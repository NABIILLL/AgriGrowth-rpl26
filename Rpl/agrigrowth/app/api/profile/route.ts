import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getSupabaseService, requireUser } from "../admin/_utils";

const withTimeout = async <T,>(promise: PromiseLike<T>, message: string, timeoutMs = 6000) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
};

const normalizeIndonesianPhone = (rawValue?: unknown) => {
  const raw = typeof rawValue === "string" ? rawValue.trim() : "";
  if (!raw) return { value: null, error: "" };

  const compact = raw.replace(/[\s().-]/g, "");
  let normalized = compact;

  if (normalized.startsWith("08")) {
    normalized = `+62${normalized.slice(1)}`;
  } else if (normalized.startsWith("628")) {
    normalized = `+${normalized}`;
  } else if (normalized.startsWith("8")) {
    normalized = `+62${normalized}`;
  } else if (normalized.startsWith("+6208")) {
    normalized = `+62${normalized.slice(4)}`;
  }

  if (!/^\+628\d{8,11}$/.test(normalized)) {
    return {
      value: normalized,
      error: "Format telepon harus nomor HP Indonesia, contoh 081234567890 atau +6281234567890.",
    };
  }

  return { value: normalized, error: "" };
};

const splitName = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || name,
    lastName: parts.slice(1).join(" ") || undefined,
  };
};

const syncClerkProfile = async (profile: {
  id: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
}) => {
  const authState = await auth();
  if (!authState.userId) return;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(authState.userId);
  const publicMetadata = clerkUser.publicMetadata || {};
  const metadataRole = typeof publicMetadata.role === "string" ? publicMetadata.role : "user";
  const { firstName, lastName } = splitName(profile.name);

  await client.users.updateUser(authState.userId, {
    firstName,
    lastName,
    publicMetadata: {
      ...publicMetadata,
      supabase_uuid: profile.id,
      role: profile.role || metadataRole,
      phone: profile.phone || undefined,
      location: profile.location || undefined,
      bio: profile.bio || undefined,
    },
  });
};

export async function GET(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  try {
    const supabase = getSupabaseService();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data) {
      await syncClerkProfile({
        id: data.id,
        name: data.name,
        role: data.role,
        phone: data.phone,
        location: data.location,
        bio: data.bio,
      });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  const payload = await request.json();
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const phone = normalizeIndonesianPhone(payload?.phone);
  const location = typeof payload?.location === "string" ? payload.location.trim() : "";
  const role = typeof payload?.role === "string" ? payload.role.trim() : "";
  const bio = typeof payload?.bio === "string" ? payload.bio.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (phone.error) {
    return NextResponse.json({ error: phone.error }, { status: 400 });
  }

  if (bio && bio.length < 10) {
    return NextResponse.json({ error: "Bio minimal 10 karakter atau kosongkan saja." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseService();
    const { data, error } = await withTimeout(
      supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name,
            phone: phone.value,
            location: location || null,
            role: role || null,
            bio: bio || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select()
        .single(),
      "Supabase profiles tidak merespons. Cek SUPABASE_SERVICE_ROLE_KEY, network, dan policy/GRANT table profiles.",
      10000
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await syncClerkProfile({
      id: data.id,
      name: data.name,
      role: data.role,
      phone: data.phone,
      location: data.location,
      bio: data.bio,
    });

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
