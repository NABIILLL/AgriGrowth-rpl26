import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, jenisTanaman } = await req.json();

    if (!imageBase64 || !jenisTanaman) {
      return NextResponse.json(
        { error: "Foto dan jenis tanaman wajib diisi." },
        { status: 400 }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API Key Gemini belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const prompt = `Kamu adalah ahli pertanian dan penyakit tanaman berpengalaman. 
Analisis foto tanaman ${jenisTanaman} berikut dengan seksama.

Berikan analisis dalam format JSON dengan struktur PERSIS seperti ini (jangan tambah field lain):
{
  "status": "Sehat" atau "Terdeteksi Penyakit" atau "Perlu Perhatian",
  "diagnosis": "Nama penyakit atau kondisi yang terdeteksi (tulis 'Tanaman Sehat' jika tidak ada penyakit)",
  "tingkatKeparahan": "Ringan" atau "Sedang" atau "Parah" atau "Tidak Ada",
  "gejala": ["gejala 1", "gejala 2", "gejala 3"],
  "penyebab": "Penjelasan penyebab penyakit atau kondisi ini",
  "solusi": ["langkah solusi 1", "langkah solusi 2", "langkah solusi 3"],
  "pencegahan": ["saran pencegahan 1", "saran pencegahan 2", "saran pencegahan 3"],
  "urgensi": "Segera" atau "Dalam 1-2 Minggu" atau "Pantau Saja" atau "Tidak Perlu Tindakan"
}

Jawab HANYA dengan JSON saja, tanpa teks tambahan apapun sebelum atau sesudah JSON.
Gunakan Bahasa Indonesia yang jelas dan mudah dipahami petani.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API error:", errData);
      return NextResponse.json(
        { error: "Gagal menghubungi AI. Coba lagi." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let hasil;
    try {
      hasil = JSON.parse(cleaned);
    } catch {
      hasil = { rawText: cleaned };
    }

    return NextResponse.json({ hasil });
  } catch (err) {
    console.error("Error analisis penyakit:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}