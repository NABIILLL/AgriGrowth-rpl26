import { getClerkSessionToken } from "@/lib/clerkSupabaseToken";

type AdminFetchOptions = RequestInit & { json?: unknown };

export const adminFetch = async (path: string, options: AdminFetchOptions = {}) => {
  const token = await getClerkSessionToken().catch(() => "");

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  const res = await fetch(path, {
    ...options,
    headers,
    body,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
};
