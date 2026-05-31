"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HeaderWithModal from "@/components/HeaderWithModal";
import { motion, Variants } from "framer-motion";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useUser } from "@/hooks/useUser";

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
  "/foto%20dashboard.png";

export default function Home() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && isSignedIn && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [isLoading, isSignedIn, router, user]);

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push(user?.role === "admin" ? "/admin" : "/growth-tracker");
    } else {
      openSignIn();
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#081018] text-white">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(100deg, rgba(5, 12, 20, 0.72) 12%, rgba(5, 12, 20, 0.28) 56%, rgba(5, 12, 20, 0.42) 100%), url(${heroBackground})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />

      <HeaderWithModal
        onSignUpClick={() => {}}
        onSignInClick={() => {}}
      />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col px-5 pb-10 sm:px-10 lg:px-14 lg:pt-8">

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

