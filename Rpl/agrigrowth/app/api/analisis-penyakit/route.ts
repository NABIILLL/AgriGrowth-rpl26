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

    const latinName =
      jenisTanaman === "Padi"
        ? "Oryza sativa"
        : jenisTanaman === "Jagung"
        ? "Zea mays"
        : "Allium cepa";

    const prompt = `Kamu adalah sistem pakar penyakit tanaman dengan spesialisasi ${jenisTanaman} (${latinName}).

=== LANGKAH 1: VALIDASI FOTO ===

Lihat foto ini secara keseluruhan. Jawab dua pertanyaan ini dalam hati:
A. Apakah ini foto tanaman (bukan foto orang, hewan, benda, layar komputer, dokumen)?
B. Apakah tanaman yang tampak di foto adalah ${jenisTanaman}, bukan jenis lain?

Ciri pengenal ${jenisTanaman}:
${
  jenisTanaman === "Padi"
    ? `- Daun panjang ramping berwarna hijau, tumbuh dari batang berbuku-buku
- Malai (tangkai biji) di ujung, butir-butir padi oval kecil
- Tumbuh di lahan basah/sawah atau tanah berlumpur`
    : jenisTanaman === "Jagung"
    ? `- Daun lebar panjang dengan tulang daun tengah putih jelas
- Batang tebal, tinggi, berbuku-buku
- Tongkol jagung (jika terlihat), rambut jagung (silk), atau bunga jantan di pucuk`
    : `- Daun berbentuk silinder berongga (seperti sedotan hijau), tegak
- Warna daun hijau cerah hingga kebiruan
- Umbi merah keunguan di pangkal (jika terlihat)`
}

TOLAK jika foto adalah:
- Foto orang, hewan, kendaraan, bangunan, benda mati
- Screenshot layar, dokumen, teks, poster
- Tanaman LAIN (cabai, tomat, singkong, pohon, rumput, dll.)
- Foto terlalu blur/gelap sehingga tidak bisa diidentifikasi

Jika TIDAK VALID, kembalikan JSON ini PERSIS (tanpa teks lain):
{
  "status": "Foto Tidak Valid",
  "detectedAs": "Satu kalimat singkat tentang apa yang terdeteksi (contoh: 'Foto kumpulan wajah orang dalam video call', 'Foto tanaman cabai merah', 'Screenshot layar komputer')",
  "diagnosis": "Foto bukan tanaman ${jenisTanaman}",
  "tingkatKeparahan": "Tidak Ada",
  "gejala": [],
  "penyebab": "Foto yang diupload bukan merupakan foto tanaman ${jenisTanaman} yang valid.",
  "solusi": ["Upload ulang foto tanaman ${jenisTanaman} yang jelas", "Pastikan tanaman ${jenisTanaman} terlihat dominan dalam frame", "Foto dari jarak dekat bagian yang ingin dianalisis (daun, batang, atau buah)"],
  "pencegahan": [],
  "urgensi": "Tidak Perlu Tindakan"
}

=== LANGKAH 2: ANALISIS VISUAL MENDALAM ===

Jika foto valid, lakukan inspeksi SANGAT TELITI. Periksa setiap bagian yang terlihat:

▸ DAUN
  - Warna: hijau normal / kuning merata / kuning sebagian / coklat / oranye / ungu / putih / hitam?
  - Ada bercak? → Bentuknya: bulat / elips / tidak beraturan? Warnanya? Ada halo/tepi berwarna berbeda?
  - Tepian daun: rata / terbakar (nekrotik) / menggulung ke atas / menggulung ke bawah?
  - Permukaan: ada tepung putih / lapisan berminyak / lubang-lubang kecil / kotoran?

▸ BATANG & PANGKAL
  - Warna normal atau ada bercak coklat/hitam/putih?
  - Ada busuk / lesi basah / luka?

▸ KESELURUHAN TANAMAN
  - Layu padahal tanah cukup basah? Kerdil? Pertumbuhan tidak normal?
  - Ada serangga / telur / kotoran hama yang terlihat?

JANGAN langsung bilang "Sehat" jika ada salah satu tanda ini:
- Bercak apapun di daun (coklat, kuning, putih, abu) → cek penyakit jamur/bakteri
- Daun menguning sebagian (bukan seluruhnya) → cek hawar atau virus
- Tepung/serbuk putih di permukaan → embun tepung
- Bercak dengan halo kuning → bakteri
- Daun menggulung/berkerut → virus atau hama
- Lubang kecil/bekas gigitan → hama penggerek atau ulat
- Batang berubah warna / busuk → penyakit batang

=== LANGKAH 3: DIAGNOSIS ===

Tentukan status berdasarkan inspeksi:
- "Sehat" → HANYA jika benar-benar tidak ada tanda abnormal apapun
- "Perlu Perhatian" → ada tanda awal mencurigakan, belum parah
- "Terdeteksi Penyakit" → ada penyakit/hama yang jelas terlihat

Referensi penyakit ${jenisTanaman}:
${
  jenisTanaman === "Padi"
    ? `- Blast padi (Pyricularia oryzae): bercak coklat berbentuk berlian/elips, tepi abu-abu
- Hawar daun bakteri/BLB (Xanthomonas oryzae): daun menguning dari tepi, basah, lalu coklat
- Bercak coklat (Bipolaris oryzae): bercak oval coklat dengan halo kuning
- Tungro (virus): daun menguning-oranye, tanaman kerdil, disebarkan wereng hijau
- Busuk batang (Helminthosporium): batang coklat, busuk di pangkal
- Wereng coklat: daun menguning cepat, tanaman "terbakar" (hopperburn)
- Penggerek batang: lubang kecil di batang, anakan mati (deadheart/whiteear)`
    : jenisTanaman === "Jagung"
    ? `- Hawar daun utara/NCLB (Exserohilum turcicum): lesi panjang abu-abu kecoklatan
- Hawar daun selatan/SCLB: lesi kecil oranye-coklat berbentuk berlian, tersebar merata
- Karat jagung (Puccinia sorghi): pustula oranye/coklat tersebar di permukaan daun
- Busuk tongkol (Fusarium): biji berubah warna, ada miselium jamur merah muda
- Bulai (Peronosclerospora maydis): daun bergaris putih-hijau pucat, serbuk putih di bawah daun
- Penggerek batang (Ostrinia furnacalis): lubang di batang/pelepah, serbuk gerek berwarna coklat
- Hawar pelepah (Rhizoctonia): lesi coklat tidak beraturan di pelepah daun`
    : `- Fusarium/Layu (Fusarium oxysporum): daun menguning dari luar ke dalam, busuk pangkal umbi, bau asam
- Embun bulu/Downy mildew (Peronospora destructor): spora abu-ungu di permukaan daun, daun pucat
- Purple blotch (Alternaria porri): bercak putih kecil dengan tepi ungu/coklat, membesar dengan halo kuning
- Antraknosa (Colletotrichum): bercak coklat gelap, tepi tidak beraturan, bisa meluas cepat
- Thrips (Thrips tabaci): daun berkerut, perak-putih karena sel rusak, sering tergulung
- Ulat bawang (Spodoptera exigua): lubang memanjang di daun, kotoran ulat hijau-hitam
- Busuk umbi (Botrytis/bakteri): umbi lunak, berbau busuk, miselium abu (Botrytis)`
}

=== OUTPUT ===

Kembalikan HANYA JSON ini, tanpa teks tambahan apapun:
{
  "status": "Sehat" atau "Terdeteksi Penyakit" atau "Perlu Perhatian",
  "diagnosis": "Nama spesifik penyakit/hama (mis: 'Blast Padi', 'Karat Jagung', 'Purple Blotch') — bukan hanya 'Penyakit Jamur'. Tulis 'Tanaman Sehat' jika tidak ada penyakit.",
  "tingkatKeparahan": "Ringan" atau "Sedang" atau "Parah" atau "Tidak Ada",
  "gejala": ["deskripsi gejala visual SPESIFIK yang terlihat di foto ini, bukan gejala umum — minimal 2 item"],
  "penyebab": "Nama patogen/hama spesifik beserta mekanisme singkat infeksinya",
  "solusi": ["langkah penanganan konkret, sebutkan nama produk/bahan aktif jika relevan — minimal 3 langkah"],
  "pencegahan": ["saran pencegahan spesifik untuk ${jenisTanaman} — minimal 2 saran"],
  "urgensi": "Segera" atau "Dalam 1-2 Minggu" atau "Pantau Saja" atau "Tidak Perlu Tindakan"
}

Gunakan Bahasa Indonesia yang jelas untuk petani. Diagnosis harus SPESIFIK berdasarkan apa yang benar-benar terlihat di foto.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
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
            temperature: 0.1,
            maxOutputTokens: 2048,
            thinkingConfig: {
              thinkingLevel: "MEDIUM",
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API error:", errData);

      // ✅ Handle 429 — parse retry-after dari pesan error Gemini
      if (errData?.error?.code === 429) {
        const msg = errData.error.message || "";
        const match = msg.match(/retry in ([\d.]+)s/i);
        const retryAfter = match ? Math.ceil(parseFloat(match[1])) : 60;

        return NextResponse.json(
          {
            error: "RATE_LIMIT",
            retryAfter,
            message: "Batas permintaan AI tercapai. Harap tunggu sebentar.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Gagal menghubungi AI. Coba lagi." },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Ambil teks dari parts (skip thinking parts yang tidak ada teks)
    const rawText =
      data.candidates?.[0]?.content?.parts?.find(
        (p: { text?: string }) => p.text
      )?.text || "";

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
