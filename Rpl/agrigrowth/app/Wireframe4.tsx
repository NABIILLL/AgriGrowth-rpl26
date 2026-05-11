"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import AuthModal from "@/components/AuthModal";

const imgComplementary3 = "https://www.figma.com/api/mcp/asset/84e7de7d-b48c-4c40-b61c-1968ea49e884";
const imgWallpaperDelDia1 = "https://www.figma.com/api/mcp/asset/4213c44b-ff10-496c-bc18-99da660c77f8";
const imgRiceField01ByGarkiOnDeviantArt1 = "https://www.figma.com/api/mcp/asset/4883cfb8-9252-42df-9223-ab5a7e993930";
const imgLogo = "https://www.figma.com/api/mcp/asset/1ec87735-8093-48cd-bfb5-5836d3ed91fd";
const imgProfile = "https://www.figma.com/api/mcp/asset/31743631-af9c-4f0e-b6cb-164cffff6bf1";

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
	const [isModalOpen, setIsModalOpen] = useState(false);
	const router = useRouter();

	const handleLogout = async () => {
		try {
			await supabase.auth.signOut();
			clearUser();
			router.push("/");
		} catch (error) {
			console.error("Failed to logout:", error);
		}
	};

	return (
		<main className="min-h-screen bg-[#f4f4f4] text-[#365a1a]">
			<AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
			<header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
				<div className="flex items-center gap-2.5">
					<img alt="Agrigrowth logo" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
					<b className="text-[20px] leading-none sm:text-[21px]">Agrigrowth Monitor</b>
				</div>

				<nav className="hidden items-center gap-10 text-[21px] font-bold lg:flex">
					<Link href={user ? "/dashboard" : "/"} className="hover:opacity-80 transition">Home</Link>
					<Link href="/about" className="hover:opacity-80 transition">About</Link>
					<Link href="/wireframe4" className="border-b-2 border-[#365a1a]">Features</Link>
				</nav>

				{!isLoading && (
					user ? (
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2 rounded-full bg-[rgba(54,90,26,0.75)] px-3 py-2 text-[16px] font-medium text-[#d7e4cd] shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] sm:text-[18px]">
								<span>{user.name}</span>
								<img alt="Profile" className="h-8 w-8 object-contain" src={imgProfile} />
							</div>
							<button 
								onClick={handleLogout}
								className="text-sm font-bold text-[#365a1a] hover:opacity-80 transition"
							>
								Logout
							</button>
						</div>
					) : (
						<button 
							onClick={() => setIsModalOpen(true)} 
							className="rounded-full bg-[#365a1a] px-5 py-2 text-[16px] font-medium text-white shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] sm:text-[18px] hover:bg-[#2d4915] transition"
						>
							Login / Sign Up
						</button>
					)
				)}
			</header>

			<section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 pb-12 pt-6 sm:px-10 lg:px-14 lg:pt-8">
				{featureCards.map((feature, index) => {
					const links = ["/features/growth-tracker", "/features/weather", "/features/overviews"];
					return (
						<article
							key={feature.title}
							className="rounded-[30px] bg-white p-5 shadow-[6px_-6px_15px_0px_rgba(0,0,0,0.2),-6px_6px_15px_0px_rgba(0,0,0,0.2)] sm:p-6 group cursor-pointer hover:shadow-[6px_-6px_25px_0px_rgba(0,0,0,0.3),-6px_6px_25px_0px_rgba(0,0,0,0.3)] transition"
							onClick={(e) => {
								if (!user) {
									e.preventDefault();
									setIsModalOpen(true);
								}
							}}
						>
							<Link href={user ? links[index] : "#"} className="block" onClick={(e) => {
								if (!user) {
									e.preventDefault();
									setIsModalOpen(true);
								}
							}}>
								<div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
									<div className="h-[190px] w-full overflow-hidden rounded-[20px] md:h-[273px] md:max-w-[605px] group-hover:opacity-80 transition">
										<img alt={feature.title} className="h-full w-full object-cover" src={feature.image} />
									</div>

									<div className="w-full md:max-w-[578px]">
										<h2 className="text-[42px] font-extrabold leading-[1.05] text-[#365a1a] lg:text-[60px] group-hover:opacity-80 transition">
											{feature.title}
										</h2>
										<p className="mt-3 text-[15px] font-medium leading-[1.35] text-[#365a1a] lg:text-[18px]">
											{feature.description}
										</p>
										<button className="mt-6 inline-block rounded-full bg-[#365a1a] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#2d4915] group-hover:translate-x-1">
											Pelajari Lebih Lanjut →
										</button>
									</div>
								</div>
							</Link>
						</article>
					);
				})}
			</section>
		</main>
	);
}
