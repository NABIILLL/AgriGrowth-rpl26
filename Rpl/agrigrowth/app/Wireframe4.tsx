"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLogoutConfirm } from "@/hooks/useLogoutConfirm";
import { useUser } from "@/hooks/useUser";
import { useClerk } from "@clerk/nextjs";
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

const imgComplementary3 = "https://images.unsplash.com/photo-1592982537447-6f2a6a0c5c8e?q=80&w=800&auto=format&fit=crop";
const imgWallpaperDelDia1 = "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2000&auto=format&fit=crop";
const imgRiceField01ByGarkiOnDeviantArt1 = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop";
const imgLogo = "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop";
const imgProfile = "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop";

const featureCards = [
	{
		title: "Growth Tracker",
		description:
			"Berfungsi sebagai buku catatan digital untuk memasukkan data fisik tanaman secara berkala, meliputi parameter tinggi tanaman, jumlah daun, jumlah cabang, hingga kondisi visual tanaman di lapangan. Melakukan pemrosesan data secara otomatis untuk menghasilkan nilai statistik tanpa pengolahan manual, mencakup perhitungan rata-rata pertumbuhan, daya tumbuh, produktivitas tanaman, kebutuhan dosis pupuk, hingga konversi luas lahan.",
		image: imgComplementary3,
	},
	{
		title: "Weather Info",
		description:
			"Menyediakan informasi kondisi cuaca terkini untuk membantu pengguna memahami situasi lingkungan yang memengaruhi pertumbuhan tanaman. Dengan data ini, pengguna dapat menentukan tindakan yang sebaiknya dilakukan maupun dihindari, sehingga proses budidaya menjadi lebih tepat dan terencana. Selain itu, informasi cuaca juga membantu meningkatkan akurasi dalam melakukan pengamatan dan analisis kondisi tanaman.",
		image: imgWallpaperDelDia1,
	},
	{
		title: "Overviews",
		description:
			"Menyediakan gambaran menyeluruh untuk setiap aktivitas pengamatan pada sawah, ladang, maupun tanaman yang sedang dibudidayakan, sehingga pengguna dapat memantau kondisi secara lebih terstruktur dan terorganisir.",
		image: imgRiceField01ByGarkiOnDeviantArt1,
	},
];

export default function Wireframe4() {
	const { user, isLoading } = useUser();
	const { openSignIn } = useClerk();
	const [mobileOpen, setMobileOpen] = useState(false);
  const { logout: handleLogout, isLoggingOut } = useLogoutConfirm();

	return (
		<main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
			<header className="relative z-50 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
				<div className="flex items-center gap-2.5">
					<img alt="Agrigrowth logo" loading="lazy" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
					<b className="text-[20px] leading-none sm:text-[21px]">Agrigrowth Monitor</b>
				</div>

				<nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-8 text-base font-semibold lg:flex">
					<Link href={user ? "/dashboard" : "/"} className="hover:opacity-80 transition">Home</Link>
					<Link href="/about" className="hover:opacity-80 transition">About</Link>
					<Link href="/wireframe4" className="border-b-2 border-[#365a1a]">Features</Link>
				</nav>

				<div className="flex items-center gap-4 min-h-[48px]">
					{!isLoading && (
						user ? (
							<div className="hidden sm:flex items-center gap-4">
								<Link
									href="/profile"
									className="flex items-center gap-2 rounded-full bg-[rgba(54,90,26,0.75)] px-3 py-2 text-[16px] font-medium text-[#d7e4cd] shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] transition hover:opacity-90 sm:text-[18px]"
								>
									<span>{user.name}</span>
									<img alt="Profile" loading="lazy" className="h-8 w-8 object-contain" src={imgProfile} />
								</Link>
								<button 
									onClick={handleLogout}
									className="text-sm font-bold text-[#365a1a] hover:opacity-80 transition"
								>
	                {isLoggingOut ? "Keluar..." : "Logout"}
	              </button>
							</div>
						) : (
							<button 
								onClick={() => openSignIn()} 
								className="hidden sm:block rounded-full bg-[#365a1a] px-5 py-2 text-[16px] font-medium text-white shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] sm:text-[18px] hover:bg-[#2d4915] transition"
							>
								Login / Sign Up
							</button>
						)
					)}

					{/* Mobile menu toggle */}
					<button
						aria-label="Toggle menu"
						onClick={() => setMobileOpen((s) => !s)}
						className="inline-flex items-center justify-center rounded-md p-2 text-[#365a1a] sm:hidden"
					>
						{mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
					</button>
				</div>

				{/* Mobile menu panel */}
				{mobileOpen && (
					<div className="sm:hidden absolute right-4 top-20 z-20 w-64 rounded-md bg-white border border-[#e0e0e0] p-4 shadow-lg">
						<nav className="flex flex-col gap-3">
							<Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-[#365a1a] hover:opacity-80" href={user ? "/dashboard" : "/"}>Home</Link>
							<Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-[#365a1a] hover:opacity-80" href="/about">About</Link>
							<Link onClick={() => setMobileOpen(false)} className="text-base font-semibold text-[#365a1a] hover:opacity-80" href="/wireframe4">Features</Link>
						</nav>

						<div className="mt-3 border-t border-[#e0e0e0] pt-3">
							{!isLoading ? (
								user ? (
									<div className="flex flex-col gap-2">
										<Link onClick={() => setMobileOpen(false)} href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 bg-[rgba(54,90,26,0.9)] text-white">
											<img alt="Profile" loading="lazy" className="h-5 w-5 object-contain" src={imgProfile} />
											<span className="font-medium">{user.name}</span>
										</Link>
										<button onClick={() => { setMobileOpen(false); handleLogout(); }} className="text-left text-sm font-semibold text-[#365a1a]">{isLoggingOut ? 'Keluar...' : 'Logout'}</button>
									</div>
								) : (
									<button
										onClick={() => {
											setMobileOpen(false);
											openSignIn();
										}}
										className="w-full rounded-full bg-[#365a1a] px-3 py-2 text-sm font-medium text-white hover:bg-[#2d4915] transition"
									>
										Login / Sign Up
									</button>
								)
							) : null}
						</div>
					</div>
				)}
			</header>

			<motion.section 
				variants={staggerContainer}
				initial="hidden"
				animate="show"
				className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 pb-12 pt-6 sm:px-10 lg:px-14 lg:pt-8"
			>
				{featureCards.map((feature, index) => {
					const links = ["/features/growth-tracker", "/features/weather", "/features/overviews"];
					return (
						<motion.article
							variants={fadeUpVariant}
							key={feature.title}
							className="rounded-[30px] bg-white p-5 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)] sm:p-6 group cursor-pointer hover:shadow-[6px_-6px_25px_0px_rgba(0,0,0,0.3),-6px_6px_25px_0px_rgba(0,0,0,0.3)] transition"
							onClick={(e: React.MouseEvent) => {
								if (!user) {
									e.preventDefault();
									openSignIn();
								}
							}}
						>
							<Link href={user ? links[index] : "#"} className="block" onClick={(e) => {
								if (!user) {
									e.preventDefault();
									openSignIn();
								}
							}}>
								<div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
									<div className="h-32 sm:h-40 md:h-[273px] w-full overflow-hidden rounded-[20px] md:max-w-[605px] group-hover:opacity-80 transition">
										<img alt={feature.title} loading="lazy" className="h-full w-full object-cover" src={feature.image} />
									</div>

									<div className="w-full md:max-w-[578px]">
											<h2 className="text-xl sm:text-3xl md:text-4xl lg:text-[60px] font-extrabold leading-[1.05] text-[#365a1a] group-hover:opacity-80 transition">
											{feature.title}
										</h2>
											<p className="mt-3 text-xs sm:text-sm md:text-base lg:text-[18px] font-medium leading-[1.35] text-[#365a1a]">
											{feature.description}
										</p>
											<button className="mt-4 sm:mt-6 inline-block rounded-full bg-[#365a1a] px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold text-white transition hover:bg-[#2d4915] group-hover:translate-x-1">
											Pelajari Lebih Lanjut →
										</button>
									</div>
								</div>
							</Link>
						</motion.article>
					);
				})}
			</motion.section>
		</main>
	);
}
