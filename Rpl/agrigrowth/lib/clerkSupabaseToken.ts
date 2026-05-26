const getClerkSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const clerk = (window as Window & {
    Clerk?: {
      session?: {
        getToken: (options?: { template?: string }) => Promise<string | null>;
      };
    };
  }).Clerk;

  return clerk?.session || null;
};

export async function getClerkSessionToken() {
  const session = getClerkSession();
  if (!session?.getToken) return "";

  return session.getToken().then((token) => token || "");
}

export async function getClerkSupabaseToken() {
  const session = getClerkSession();
  if (!session?.getToken) return "";

  return session.getToken({ template: "supabase" }).then((token) => token || "");
}
