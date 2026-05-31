"use client";

import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import { motion, Variants } from "framer-motion";
import { useUser } from "@/hooks/useUser";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 70, damping: 15 } as const,
  },
};

const imgLogo = "https://api.iconify.design/lucide:leaf.svg?color=%23365a1a";

const cropCards = [
  {
    id: "padi",
    title: "Padi",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "jagung",
    title: "Jagung",
    image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "bawang",
    title: "Bawang Merah",
    image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop",
  },
];

export default function GrowthTrackerPage() {
  const { user, isLoading } = useUser();

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
      <GlobalHeader variant="light" />

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="bg-[#365a1a] py-14 text-white"
      >
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 sm:px-10 lg:grid-cols-[290px_1fr] lg:items-center lg:gap-9 lg:px-14">
          <motion.div variants={fadeUpVariant}>
            <h1 className="text-5xl font-extrabold leading-[0.95] sm:text-[75px]">Growth Tracker</h1>
            <p className="mt-1.5 text-[25px] font-semibold">Pilih komoditas tanaman</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">
            {cropCards.map((card) => (
              <motion.div key={card.id} variants={fadeUpVariant}>
                <Link
                  href={`/observation/${card.id}/history`}
                  replace
                  className="group relative block h-[360px] overflow-hidden rounded-[16px] shadow-[-6px_6px_12px_rgba(0,0,0,0.3)] transition hover:shadow-[-6px_6px_20px_rgba(0,0,0,0.5)] sm:h-[396px]"
                >
                  <img alt={card.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" src={card.image} />
                  <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#365a1a] to-transparent opacity-80 transition duration-300 group-hover:opacity-100 group-hover:h-[50%]" />
                  <p className="absolute inset-x-0 bottom-4 text-center text-[20px] font-extrabold text-white transition-transform duration-300 group-hover:-translate-y-2">
                    {card.title}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
