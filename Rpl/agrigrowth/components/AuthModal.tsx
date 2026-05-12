"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const imgGroup2 =
  "https://www.figma.com/api/mcp/asset/eb8b6bb8-e06c-41c9-9ec8-8aca0e559999";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signup" | "login";
  initialStep?: Step;
}

type Step =
  | "choice"
  | "signup-method"
  | "login-method"
  | "signup-email"
  | "signup-phone"
  | "signup-phone-verify"
  | "signup-phone-data"
  | "login-email"
  | "login-phone"
  | "login-phone-verify";

export default function AuthModal({ isOpen, onClose, initialMode, initialStep }: AuthModalProps) {
  const [step, setStep] = useState<Step>("choice");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "farmer">("student");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");

  React.useEffect(() => {
    if (!isOpen) return;

    if (initialMode) {
      setAuthMode(initialMode);
    }

    if (initialStep) {
      setStep(initialStep);
      return;
    }

    if (initialMode === "login") {
      setStep("login-email");
      return;
    }

    if (initialMode === "signup") {
      setStep("signup-email");
      return;
    }

    setStep("choice");
  }, [isOpen, initialMode, initialStep]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            prompt: "select_account",
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSignUpChoice = (method: "email" | "phone" | "google") => {
    if (method === "email") {
      setStep("signup-email");
    } else if (method === "phone") {
      setStep("signup-phone");
    } else if (method === "google") {
      handleGoogleLogin();
    }
  };

  const handleLoginChoice = (method: "email" | "phone" | "google") => {
    if (method === "email") {
      setStep("login-email");
    } else if (method === "phone") {
      setStep("login-phone");
    } else if (method === "google") {
      handleGoogleLogin();
    }
  };

  const handleSignUpEmailNext = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          }
        }
      });
      if (error) throw error;

      // Jika konfirmasi email diaktifkan di Supabase, session akan bernilai null
      if (data.user && data.session === null) {
        alert("Pendaftaran berhasil! Silakan cek kotak masuk email Anda untuk mengkonfirmasi akun sebelum masuk.");
        setStep("choice");
        return;
      }

      saveUser({ id: data.user?.id, name, email, role });
      handleAuthSuccess();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSignUpEmailVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Verify email code
    console.log("Verify email code:", emailVerificationCode);
    saveUser({ name, email, role });
    handleAuthSuccess();
  };

  const handleSignUpPhoneNext = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send verification SMS
    console.log("Send verification SMS to:", phone);
    setStep("signup-phone-verify");
  };

  const handleSignUpPhoneVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Verify phone code
    console.log("Verify phone code:", verificationCode);
    setStep("signup-phone-data");
  };

  const handleSignUpPhoneData = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save phone signup data
    saveUser({ name, email, role });
    handleAuthSuccess();
  };

  const handleLoginEmailNext = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;

      const roleFromDb = await resolveUserRole(data.user?.id, data.session?.access_token, data.user?.user_metadata?.role);

      saveUser({
        id: data.user?.id,
        email,
        name: data.user?.user_metadata?.name || email.split("@")[0],
        role: roleFromDb
      });
      handleAuthSuccess(roleFromDb);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLoginPhoneNext = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send verification SMS
    setStep("login-phone-verify");
  };

  const handleLoginPhoneVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Verify phone code
    saveUser({ name: phone, email: "" });
    handleAuthSuccess();
  };

  const handleAuthSuccess = (nextRole?: string | null) => {
    const target = nextRole === "admin" ? "/admin" : "/dashboard";
    router.replace(target);
    onClose();
  };

  const resolveUserRole = async (userId?: string, token?: string, fallbackRole?: string | null) => {
    if (!userId || !token) return fallbackRole || "";
    try {
      const res = await fetch('/api/auth/role', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) return fallbackRole || "";
      const data = await res.json();
      return data?.role || fallbackRole || "";
    } catch (err) {
      console.warn("Failed to fetch user role:", err);
      return fallbackRole || "";
    }
  };

  const handleBack = () => {
    if (step === "choice") {
      onClose();
    } else if (step.includes("signup")) {
      setStep("choice");
    } else if (step.includes("login")) {
      setStep("choice");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Close button - centered at top */}
      <button
        onClick={onClose}
        className="absolute left-1/2 top-8 z-50 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-white text-black text-lg font-bold transition hover:bg-gray-50"
        aria-label="Close modal"
      >
        ✕
      </button>

      {/* Modal card */}
      <div className="relative w-full max-w-[525px] rounded-[25px] bg-white px-[42px] py-[60px] pb-[38px]">
        {/* Logo */}
        <div className="mb-[50px] flex justify-center">
          <img alt="Logo" className="h-[51px] w-[59px]" src={imgGroup2} />
        </div>

        {/* Step: Choice */}
        {step === "choice" && (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[24px] font-bold text-black">
                Selamat Datang
              </h2>
              <p className="mt-2 text-[14px] font-medium text-black/60">
                Pilih untuk masuk atau membuat akun baru
              </p>
            </div>

            <button
              onClick={() => {
                setAuthMode("signup");
                setStep("signup-email");
              }}
              className="w-full rounded-[15px] border-2 border-black bg-transparent py-[18px] font-['Plus_Jakarta_Sans:Bold'] text-[16px] font-bold text-black transition hover:bg-black/5"
            >
              Daftar (Sign Up)
            </button>

            <button
              onClick={() => {
                setAuthMode("login");
                setStep("login-email");
              }}
              className="w-full rounded-[15px] bg-black py-[18px] font-['Plus_Jakarta_Sans:Bold'] text-[16px] font-bold text-white transition hover:bg-black/80"
            >
              Masuk (Login)
            </button>
          </div>
        )}

        {/* Step: Sign Up Method Selection */}
        {step === "signup-method" && (
          <div className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[24px] font-bold text-black">
                Daftar Akun Baru
              </h2>
              <p className="mt-2 text-[14px] font-medium text-black/60">
                Pilih metode pendaftaran
              </p>
            </div>

            <button
              onClick={() => handleSignUpChoice("email")}
              className="w-full rounded-[15px] border border-black/20 bg-white py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black transition hover:bg-black/5"
            >
              📧 Daftar dengan Email
            </button>

            <button
              onClick={() => handleSignUpChoice("phone")}
              className="w-full rounded-[15px] border border-black/20 bg-white py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black transition hover:bg-black/5"
            >
              📱 Daftar dengan Nomor Telp
            </button>

            <button
              onClick={() => handleSignUpChoice("google")}
              className="w-full rounded-[15px] border border-green-600 bg-white py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-green-700 transition hover:bg-green-50 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Daftar dengan Google
            </button>

            <button
              onClick={handleBack}
              className="mt-6 w-full rounded-[15px] bg-gray-200 py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black transition hover:bg-gray-300"
            >
              Kembali
            </button>
          </div>
        )}

        {/* Step: Login Method Selection */}
        {step === "login-method" && (
          <div className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[24px] font-bold text-black">
                Masuk Akun
              </h2>
              <p className="mt-2 text-[14px] font-medium text-black/60">
                Pilih metode login
              </p>
            </div>

            <button
              onClick={() => handleLoginChoice("email")}
              className="w-full rounded-[15px] border border-black/20 bg-white py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black transition hover:bg-black/5"
            >
              📧 Masuk dengan Email
            </button>

            <button
              onClick={() => handleLoginChoice("phone")}
              className="w-full rounded-[15px] border border-black/20 bg-white py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black transition hover:bg-black/5"
            >
              📱 Masuk dengan Nomor Telp
            </button>

            <button
              onClick={() => handleLoginChoice("google")}
              className="w-full rounded-[15px] border border-green-600 bg-white py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-green-700 transition hover:bg-green-50 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </button>

            <button
              onClick={handleBack}
              className="mt-6 w-full rounded-[15px] bg-gray-200 py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black transition hover:bg-gray-300"
            >
              Kembali
            </button>
          </div>
        )}

        {/* Step: Sign Up with Email */}
        {step === "signup-email" && (
          <form onSubmit={handleSignUpEmailNext} className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[20px] font-bold text-black">
                Daftar dengan Email
              </h2>
              <p className="mt-2 text-[12px] font-medium text-black/60">
                Masukkan data pribadi Anda
              </p>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Lengkap"
              required
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <div className="pt-2">
              <label className="block text-[14px] font-medium text-black mb-2">
                Saya adalah:
              </label>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="student"
                    checked={role === "student"}
                    onChange={(e) =>
                      setRole(e.target.value as "student" | "farmer")
                    }
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-[14px] font-medium text-black">
                    Mahasiswa
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="farmer"
                    checked={role === "farmer"}
                    onChange={(e) =>
                      setRole(e.target.value as "student" | "farmer")
                    }
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-[14px] font-medium text-black">
                    Petani
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-[42px] bg-black py-[18px] font-['Plus_Jakarta_Sans:Bold'] text-[16px] font-bold text-white transition hover:bg-black/80"
            >
              Lanjutkan
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-[15px] bg-gray-200 py-[14px] font-['Plus_Jakarta_Sans:Medium'] text-[14px] font-medium text-black transition hover:bg-gray-300"
            >
              Kembali
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-[12px] font-medium text-gray-500">ATAU</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full rounded-[15px] border border-green-600 bg-white py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-green-700 transition hover:bg-green-50 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Daftar dengan Google
            </button>
          </form>
        )}

        {/* Step: Sign Up with Phone */}
        {step === "signup-phone" && (
          <form onSubmit={handleSignUpPhoneNext} className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[20px] font-bold text-black">
                Daftar dengan Nomor Telp
              </h2>
              <p className="mt-2 text-[12px] font-medium text-black/60">
                Masukkan nomor telepon Anda
              </p>
            </div>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nomor Telepon (cth: +62812xxxxxxxx)"
              required
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <button
              type="submit"
              className="w-full rounded-[42px] bg-black py-[18px] font-['Plus_Jakarta_Sans:Bold'] text-[16px] font-bold text-white transition hover:bg-black/80"
            >
              Lanjutkan
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-[15px] bg-gray-200 py-[14px] font-['Plus_Jakarta_Sans:Medium'] text-[14px] font-medium text-black transition hover:bg-gray-300"
            >
              Kembali
            </button>
          </form>
        )}

        {/* Step: Sign Up Phone Verification */}
        {step === "signup-phone-verify" && (
          <form onSubmit={handleSignUpPhoneVerify} className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[20px] font-bold text-black">
                Verifikasi Nomor Telp
              </h2>
              <p className="mt-2 text-[12px] font-medium text-black/60">
                Kode verifikasi telah dikirim ke {phone}
              </p>
            </div>

            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Masukkan kode 6 digit"
              required
              maxLength={6}
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <button
              type="submit"
              className="w-full rounded-[42px] bg-black py-[18px] font-['Plus_Jakarta_Sans:Bold'] text-[16px] font-bold text-white transition hover:bg-black/80"
            >
              Verifikasi
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-[15px] bg-gray-200 py-[14px] font-['Plus_Jakarta_Sans:Medium'] text-[14px] font-medium text-black transition hover:bg-gray-300"
            >
              Kembali
            </button>
          </form>
        )}

        {/* Step: Sign Up Phone - Data Input */}
        {step === "signup-phone-data" && (
          <form onSubmit={handleSignUpPhoneData} className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[20px] font-bold text-black">
                Lengkapi Data Anda
              </h2>
              <p className="mt-2 text-[12px] font-medium text-black/60">
                Silakan isi informasi berikut
              </p>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Lengkap"
              required
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (Opsional)"
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <div className="pt-2">
              <label className="block text-[14px] font-medium text-black mb-2">
                Saya adalah:
              </label>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="student"
                    checked={role === "student"}
                    onChange={(e) =>
                      setRole(e.target.value as "student" | "farmer")
                    }
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-[14px] font-medium text-black">
                    Mahasiswa
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="farmer"
                    checked={role === "farmer"}
                    onChange={(e) =>
                      setRole(e.target.value as "student" | "farmer")
                    }
                    className="mr-3 w-4 h-4"
                  />
                  <span className="text-[14px] font-medium text-black">
                    Petani
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-[42px] bg-black py-[18px] font-['Plus_Jakarta_Sans:Bold'] text-[16px] font-bold text-white transition hover:bg-black/80"
            >
              Selesai
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-[15px] bg-gray-200 py-[14px] font-['Plus_Jakarta_Sans:Medium'] text-[14px] font-medium text-black transition hover:bg-gray-300"
            >
              Kembali
            </button>
          </form>
        )}

        {/* Step: Login with Email */}
        {step === "login-email" && (
          <form onSubmit={handleLoginEmailNext} className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[20px] font-bold text-black">
                Masuk dengan Email
              </h2>
              <p className="mt-2 text-[12px] font-medium text-black/60">
                Masukkan email dan password Anda
              </p>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <button
              type="submit"
              className="w-full rounded-[42px] bg-black py-[18px] font-['Plus_Jakarta_Sans:Bold'] text-[16px] font-bold text-white transition hover:bg-black/80"
            >
              Masuk
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-[15px] bg-gray-200 py-[14px] font-['Plus_Jakarta_Sans:Medium'] text-[14px] font-medium text-black transition hover:bg-gray-300"
            >
              Kembali
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-[12px] font-medium text-gray-500">ATAU</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full rounded-[15px] border border-green-600 bg-white py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-green-700 transition hover:bg-green-50 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </button>
          </form>
        )}

        {/* Step: Login with Phone */}
        {step === "login-phone" && (
          <form onSubmit={handleLoginPhoneNext} className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[20px] font-bold text-black">
                Masuk dengan Nomor Telp
              </h2>
              <p className="mt-2 text-[12px] font-medium text-black/60">
                Masukkan nomor telepon Anda
              </p>
            </div>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nomor Telepon"
              required
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <button
              type="submit"
              className="w-full rounded-[42px] bg-black py-[18px] font-['Plus_Jakarta_Sans:Bold'] text-[16px] font-bold text-white transition hover:bg-black/80"
            >
              Lanjutkan
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-[15px] bg-gray-200 py-[14px] font-['Plus_Jakarta_Sans:Medium'] text-[14px] font-medium text-black transition hover:bg-gray-300"
            >
              Kembali
            </button>
          </form>
        )}

        {/* Step: Login Phone Verification */}
        {step === "login-phone-verify" && (
          <form onSubmit={handleLoginPhoneVerify} className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="font-['Plus_Jakarta_Sans:Bold'] text-[20px] font-bold text-black">
                Verifikasi Nomor Telp
              </h2>
              <p className="mt-2 text-[12px] font-medium text-black/60">
                Kode verifikasi telah dikirim ke {phone}
              </p>
            </div>

            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Masukkan kode 6 digit"
              required
              maxLength={6}
              className="w-full rounded-[15px] border border-black/20 bg-white px-[17px] py-[16px] font-['Plus_Jakarta_Sans:Medium'] text-[16px] font-medium text-black placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
            />

            <button
              type="submit"
              className="w-full rounded-[42px] bg-black py-[18px] font-['Plus_Jakarta_Sans:Bold'] text-[16px] font-bold text-white transition hover:bg-black/80"
            >
              Verifikasi
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-[15px] bg-gray-200 py-[14px] font-['Plus_Jakarta_Sans:Medium'] text-[14px] font-medium text-black transition hover:bg-gray-300"
            >
              Kembali
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="font-['Plus_Jakarta_Sans:Bold'] text-[21px] font-bold text-black">
            Agrigrowth Monitor
          </p>
        </div>
      </div>
    </div>
  );
}
