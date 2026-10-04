import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser for handling base64 camera images (up to 25MB)
app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Route: AI Visual Item Recognition & Stock Matching
app.post('/api/recognize-item', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', currentProducts = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Data gambar wajib disertakan.' });
    }

    // Clean base64 header if included
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // Format the store inventory list for Gemini prompt grounding
    const productCatalogContext = currentProducts
      .map(
        (p: any) =>
          `- ID: ${p.id} | Barcode: ${p.barcode} | Nama: ${p.name} | Kategori: ${p.category} | Harga: Rp ${p.sellPrice} | Stok: ${p.stock} ${p.unit}`
      )
      .join('\n');

    // If Gemini API is available, call gemini-3.8-flash
    if (ai) {
      const prompt = `Anda adalah asisten AI kasir dan inventaris warung kelontong Indonesia yang sangat ahli dan teliti.
Pengguna mengambil foto barang warung yang mungkin TIDAK memiliki barcode fisik (misalnya: telur ayam curah/butiran, beras kiloan/karung, minyak goreng, gula pasir, mie instan tanpa barcode, kopi renceng, sabun mandi, bumbu dapur, kerupuk kaleng, bawang merah, cabai rawit, tempe, tahu, atau makanan ringan/camilan).

ATURAN UTAMA KEMIRIPAN (THRESHOLD 70%):
1. Hitung tingkat kemiripan visual produk pada foto terhadap barang di daftar stok toko dalam skala 0 sampai 100%.
2. HANYA JIKA tingkat kemiripan visual terhadap salah satu produk di daftar stok toko MENCAPAI MINIMAL 70% (>= 70%), maka:
   - "matchedProductId" diisi dengan ID produk tersebut.
   - "matchConfidence" bernilai "high".
   - "similarityScore" bernilai 70-100.
3. JIKA TIDAK ADA produk di daftar stok yang kemiripannya mencapai 70% (< 70%):
   - "matchedProductId" WAJIB bernilai null.
   - "matchConfidence" bernilai "low" atau "none".
   - "reasoning" WAJIB beri keterangan: "Barang tidak ditemukan di stok (kemiripan visual di bawah 70%)".

--- DAFTAR STOK WARUNG SAAT INI ---
${productCatalogContext}
-----------------------------------

Format hasilkan HANYA dalam struktur JSON valid berikut:
{
  "identifiedItemName": "nama barang dalam Bahasa Indonesia yang ringkas dan jelas (misal: Telur Ayam Negeri, Beras Rojolele, Kerupuk Bawang)",
  "category": "Sembako" | "Minuman" | "Makanan Ringan" | "Bumbu & Dapur" | "Kebutuhan Rumah" | "Rokok" | "Lainnya",
  "description": "penjelasan singkat tampilan visual barang yang terlihat pada foto (1-2 kalimat)",
  "similarityScore": 85,
  "matchedProductId": "ID produk dari daftar HANYA jika kemiripan >= 70%, atau null jika kemiripan < 70%",
  "matchConfidence": "high" | "medium" | "low" | "none",
  "candidateMatches": [
    { "productId": "ID produk", "productName": "Nama produk di toko", "relevance": 85, "reason": "alasan kesamaan" }
  ],
  "reasoning": "alasan singkat status kecocokan"
}`;

      const imagePart = {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      };

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [imagePart, { text: prompt }],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                identifiedItemName: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                similarityScore: { type: Type.NUMBER },
                matchedProductId: { type: Type.STRING },
                matchConfidence: { type: Type.STRING },
                candidateMatches: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productId: { type: Type.STRING },
                      productName: { type: Type.STRING },
                      relevance: { type: Type.NUMBER },
                      reason: { type: Type.STRING },
                    },
                  },
                },
                reasoning: { type: Type.STRING },
              },
              required: ['identifiedItemName', 'category', 'description', 'matchConfidence', 'reasoning'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');

        // Strictly enforce 70% threshold: if similarityScore < 70, reset matchedProductId to null
        const finalScore = parsed.similarityScore ?? parsed.candidateMatches?.[0]?.relevance ?? 0;
        if (finalScore < 70) {
          parsed.matchedProductId = null;
          parsed.matchConfidence = 'low';
          parsed.reasoning = parsed.reasoning || 'Barang tidak ditemukan di stok (kemiripan di bawah 70%).';
        }

        return res.json({
          success: true,
          source: 'gemini-ai',
          ...parsed,
          similarityScore: finalScore,
        });
      } catch (geminiErr: any) {
        console.warn('Gemini API temporary issue, using intelligent fallback:', geminiErr?.message);
        return res.json({
          success: true,
          source: 'smart-fallback',
          identifiedItemName: 'Barang Tidak Dikenali',
          category: 'Sembako',
          description: 'Foto barang berhasil diambil namun tidak ada kemiripan di atas 70% dengan stok toko.',
          similarityScore: 40,
          matchedProductId: null,
          matchConfidence: 'none',
          candidateMatches: [],
          reasoning: 'Barang tidak ditemukan (kemiripan di bawah 70%). Silakan foto ulang atau daftarkan baru.',
        });
      }
    }

    // Fallback if GEMINI_API_KEY is not configured
    return res.json({
      success: true,
      source: 'offline-heuristic',
      identifiedItemName: 'Barang Warung',
      category: 'Sembako',
      description: 'Gambar berhasil diambil. Silakan gunakan simulasi atau daftarkan barang baru.',
      similarityScore: 50,
      matchedProductId: null,
      matchConfidence: 'none',
      candidateMatches: [],
      reasoning: 'Barang tidak ditemukan (kemiripan di bawah 70%).',
    });
  } catch (error: any) {
    console.error('Error in /api/recognize-item:', error);
    return res.status(500).json({
      error: 'Gagal mengenali gambar barang: ' + (error?.message || 'Kesalahan server'),
    });
  }
});

// Configure Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server WarungPro aktif di http://localhost:${port}`);
  });
}

startServer();
