import { supabase } from "@/lib/supabase";

type AdminFetchOptions = RequestInit & { json?: unknown };

const getAccessToken = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message || "Failed to get session");
  }
  return data.session?.access_token || "";
};

export const adminFetch = async (path: string, options: AdminFetchOptions = {}) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("No access token. Please login again.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  let body = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  const res = await fetch(path, {
    ...options,
    headers,
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
};
