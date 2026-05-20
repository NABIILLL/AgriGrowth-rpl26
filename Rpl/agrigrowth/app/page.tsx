"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeaderWithModal from "@/components/HeaderWithModal";
import AuthModal from "@/components/AuthModal";
import { useUser } from "@/hooks/useUser";
import { motion, Variants } from "framer-motion";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 70, damping: 15 } as const
  }
};

const heroBackground =
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=2400&auto=format&fit=crop";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Auto-open modal jika user belum login
  useEffect(() => {
    if (!isLoading && !user) {
      // Kita tambahkan jeda sedikit agar onAuthStateChange punya waktu untuk memproses link email
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Hanya memunculkan alert jika hash di URL menandakan konfirmasi atau akses token
          if (window.location.hash.includes('access_token') || window.location.href.includes('code=')) {
            alert("Konfirmasi Berhasil! Anda telah berhasil login.");
            router.push("/dashboard");
          }
        }
      });
      return () => subscription.unsubscribe();
    });
  }, [router]);

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      setAuthMode("signup");
      setIsModalOpen(true);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#081018] text-white">
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={authMode}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(100deg, rgba(5, 12, 20, 0.72) 12%, rgba(5, 12, 20, 0.28) 56%, rgba(5, 12, 20, 0.42) 100%), url(${heroBackground})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col px-5 pb-10 pt-6 sm:px-10 lg:px-12 lg:pt-8">
        <HeaderWithModal
          onSignUpClick={() => {
            setAuthMode("signup");
            setIsModalOpen(true);
          }}
          onSignInClick={() => {
            setAuthMode("login");
            setIsModalOpen(true);
          }}
        />

        <motion.section 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mt-20 w-full max-w-[860px] sm:mt-32 lg:mt-56"
        >
          <motion.h1 variants={fadeUpVariant} className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Simplifying Agricultural
            <br />
            Analysis Through Digital
            <br />
            Technology.
          </motion.h1>

          <motion.p variants={fadeUpVariant} className="mt-6 max-w-[840px] text-lg leading-relaxed text-white/90 sm:text-xl lg:text-2xl">
            A digital platform that helps researcher and students record, monitor, and analyze crop data in one place. From growth tracking and cost management to harvest predictions and insights, everything is designed to support smarter and more efficient agricultural decisions.
          </motion.p>

          <motion.button
            variants={fadeUpVariant}
            onClick={handleGetStarted}
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-white/75 px-6 py-3 text-base font-semibold text-black shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] transition duration-200 hover:bg-white/90 sm:gap-4 sm:px-8 sm:py-4 sm:text-lg"
            type="button"
          >
            <span>Get Started</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3b300] font-bold text-[#1a1a1a] sm:h-11 sm:w-11">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </motion.button>
        </motion.section>
      </div>
    </main>
  );
}

