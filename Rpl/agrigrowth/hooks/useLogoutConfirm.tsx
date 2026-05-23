"use client";

import { useState } from "react";
import { clearUser } from "@/lib/auth";
import { toast } from "react-hot-toast";
import { useClerk } from "@clerk/nextjs";

const clearSupabaseBrowserSession = () => {
  Object.keys(window.localStorage).forEach((key) => {
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      window.localStorage.removeItem(key);
    }
  });
  Object.keys(window.sessionStorage).forEach((key) => {
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      window.sessionStorage.removeItem(key);
    }
  });
};

export function useLogoutConfirm() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useClerk();

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      clearUser();
      clearSupabaseBrowserSession();
      await signOut({ redirectUrl: "/" });
    } catch (error) {
      console.error("Failed to logout:", error);
      setIsLoggingOut(false);
    }
  };

  const logout = () => {
    if (isLoggingOut) return;

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-gray-800 text-sm">Yakin ingin logout dari AgriGrowth Monitor?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Batal
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                performLogout();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      ),
      {
        id: "logout-toast",
        duration: Infinity,
      }
    );
  };

  return { logout, isLoggingOut };
}
