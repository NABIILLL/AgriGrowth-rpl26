"use client";

// Import library React, hook useParams Next.js, dan komponen dashboard pemantauan pertumbuhan
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import GrowthMonitoringDashboard from "@/components/GrowthMonitoringDashboard";

// Interface untuk data baris pengukuran pertumbuhan tanaman
interface MeasurementData {
  day: number;
  height: string;
  leaves: number;
  branches: number;
}

// Komponen utama halaman tabel pengamatan tanaman berdasarkan ID tracker
export default function ObservationTablePage() {
  const params = useParams();
  
  // State untuk menyimpan daftar pengukuran tanaman (data dummy default)
  const [measurements, setMeasurements] = useState<MeasurementData[]>([
    { day: 1, height: "1 cm", leaves: 2, branches: 1 },
    { day: 2, height: "1 cm", leaves: 2, branches: 1 },
    { day: 3, height: "2 cm", leaves: 2, branches: 2 },
    { day: 4, height: "2 cm", leaves: 3, branches: 2 },
    { day: 5, height: "2 cm", leaves: 4, branches: 2 },
  ]);

  // State untuk menyimpan nama lahan dan status loading
  const [fieldName, setFieldName] = useState<string>("'Sawah belakang kampus'");
  const [isLoading, setIsLoading] = useState(true);

  // Mengambil data pengukuran dan nama lahan dari Supabase secara berkala setelah komponen dimuat
  useEffect(() => {
    // TODO: Fetch measurements data from Supabase based on params.id
    // Example:
    // const fetchData = async () => {
    //   const { data, error } = await supabase
    //     .from('observations')
    //     .select('measurements, field_name')
    //     .eq('id', params.id)
    //     .single();
    //   if (data) {
    //     setMeasurements(data.measurements);
    //     setFieldName(data.field_name);
    //   }
    //   setIsLoading(false);
    // };
    // fetchData();

    setIsLoading(false);
  }, [params.id]);

  // Render UI Loading State jika data sedang dimuat
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#365a1a] mx-auto mb-4"></div>
          <p className="text-[#365a1a] text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Render komponen dashboard utama pemantauan pertumbuhan tanaman
  return <GrowthMonitoringDashboard fieldName={fieldName} measurements={measurements} />;
}
