"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const imgLogo = "https://www.figma.com/api/mcp/asset/1ec87735-8093-48cd-bfb5-5836d3ed91fd";
const imgProfile = "https://www.figma.com/api/mcp/asset/31743631-af9c-4f0e-b6cb-164cffff6bf1";

interface MeasurementData {
  day: number;
  height: string;
  leaves: number;
  branches: number;
}

interface GrowthMonitoringDashboardProps {
  fieldName: string;
  measurements: MeasurementData[];
}

export default function GrowthMonitoringDashboard({
  fieldName = "'Sawah belakang kampus'",
  measurements = [
    { day: 1, height: "1 cm", leaves: 2, branches: 1 },
    { day: 2, height: "1 cm", leaves: 2, branches: 1 },
    { day: 3, height: "2 cm", leaves: 2, branches: 2 },
    { day: 4, height: "2 cm", leaves: 3, branches: 2 },
    { day: 5, height: "2 cm", leaves: 4, branches: 2 },
  ],
}: GrowthMonitoringDashboardProps) {
  const { user, isLoading } = useUser();

  // Convert height strings to numeric values for charting
  const heightValue = (heightStr: string) => {
    const match = heightStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Prepare chart data
  const chartData = measurements.map((m) => ({
    day: m.day,
    height: heightValue(m.height),
    leaves: m.leaves,
    branches: m.branches,
  }));

  return (
    <main className="min-h-screen bg-white" data-node-id="360:167">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10 lg:px-14">
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition">
          <img alt="Agrigrowth logo" className="h-[51px] w-[59px] object-contain" src={imgLogo} />
          <b className="text-[21px] leading-none font-bold text-[#365a1a]">Agrigrowth Monitor</b>
        </Link>

        <nav className="hidden items-center gap-[60px] text-[21px] font-bold lg:flex text-[#365a1a]">
          <Link href="/dashboard" className="hover:opacity-80 transition">
            Home
          </Link>
          <Link href="/about" className="hover:opacity-80 transition">
            About
          </Link>
          <Link href="/wireframe4" className="hover:opacity-80 transition">
            Features
          </Link>
        </nav>

        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-full bg-[rgba(54,90,26,0.75)] px-3 py-2 text-[16px] font-medium text-[#d7e4cd] shadow-[-2px_2px_4px_rgba(0,0,0,0.25)] transition hover:opacity-90 sm:text-[18px]"
        >
          <span>{!isLoading && user ? user.name : "Guest"}</span>
          <img alt="Profile" className="h-8 w-8 object-contain" src={imgProfile} />
        </Link>
      </header>

      {/* Main Content */}
      <section className="mx-auto w-full max-w-[1440px] flex-col gap-8 px-5 pb-12 sm:px-10 lg:px-14">
        {/* Field Title */}
        <h1 className="text-center text-[56px] font-extrabold leading-normal text-[#365a1a] mt-8 mb-8">
          {fieldName}
        </h1>

        {/* Data Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-[#365a1a] border-4 border-[#365a1a] px-8 py-5 text-center text-[25px] font-bold text-white whitespace-nowrap w-[317px]">
                  Hari ke-
                </th>
                <th className="bg-[#365a1a] border-4 border-[#365a1a] px-8 py-5 text-center text-[25px] font-bold text-white whitespace-nowrap w-[317px]">
                  Tinggi
                </th>
                <th className="bg-[#365a1a] border-4 border-[#365a1a] px-8 py-5 text-center text-[25px] font-bold text-white whitespace-nowrap w-[317px]">
                  Jumlah Daun
                </th>
                <th className="bg-[#365a1a] border-4 border-[#365a1a] px-8 py-5 text-center text-[25px] font-bold text-white whitespace-nowrap w-[317px]">
                  Jumlah Cabang
                </th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement, index) => (
                <tr key={index}>
                  <td className="border-4 border-[#365a1a] px-8 py-5 text-center text-[25px] font-medium text-[#365a1a]">
                    {measurement.day}
                  </td>
                  <td className="border-4 border-[#365a1a] px-8 py-5 text-center text-[25px] font-medium text-[#365a1a]">
                    {measurement.height}
                  </td>
                  <td className="border-4 border-[#365a1a] px-8 py-5 text-center text-[25px] font-medium text-[#365a1a]">
                    {measurement.leaves}
                  </td>
                  <td className="border-4 border-[#365a1a] px-8 py-5 text-center text-[25px] font-medium text-[#365a1a]">
                    {measurement.branches}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Height Chart */}
          <div className="bg-white border-5 border-[#365a1a] rounded-[30px] p-6 flex flex-col items-center">
            <h3 className="text-[25px] font-bold text-[#365a1a] mb-4 text-center">Tinggi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="0" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="day" 
                  stroke="#365a1a"
                  label={{ value: "H", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis 
                  stroke="#365a1a"
                  label={{ value: "T", angle: -90, position: "insideLeft", offset: 10 }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="height" 
                  stroke="#365a1a" 
                  strokeWidth={2}
                  dot={{ fill: "#365a1a", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Leaves Chart */}
          <div className="bg-white border-5 border-[#365a1a] rounded-[30px] p-6 flex flex-col items-center">
            <h3 className="text-[25px] font-bold text-[#365a1a] mb-4 text-center">Jumlah Daun</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="0" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="day" 
                  stroke="#365a1a"
                  label={{ value: "H", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis 
                  stroke="#365a1a"
                  label={{ value: "D", angle: -90, position: "insideLeft", offset: 10 }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="leaves" 
                  stroke="#365a1a" 
                  strokeWidth={2}
                  dot={{ fill: "#365a1a", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Branches Chart */}
          <div className="bg-white border-5 border-[#365a1a] rounded-[30px] p-6 flex flex-col items-center">
            <h3 className="text-[25px] font-bold text-[#365a1a] mb-4 text-center">Jumlah Cabang</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="0" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="day" 
                  stroke="#365a1a"
                  label={{ value: "H", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis 
                  stroke="#365a1a"
                  label={{ value: "C", angle: -90, position: "insideLeft", offset: 10 }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="branches" 
                  stroke="#365a1a" 
                  strokeWidth={2}
                  dot={{ fill: "#365a1a", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </main>
  );
}
