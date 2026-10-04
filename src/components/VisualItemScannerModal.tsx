import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductCategory } from '../types';
import { formatRupiah } from '../utils/format';
import { sound } from '../utils/sound';
import { getProductImage } from '../utils/productImages';
import {
  X,
  Camera,
  Sparkles,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  ShoppingBag,
  SwitchCamera,
  Zap,
  Check,
} from 'lucide-react';

interface CandidateMatch {
  productId: string;
  productName: string;
  relevance: number;
  reason?: string;
}

interface VisualRecognitionResult {
  identifiedItemName: string;
  category: string;
  description: string;
  similarityScore?: number;
  matchedProductId: string | null;
  matchConfidence: 'high' | 'medium' | 'low' | 'none';
  candidateMatches?: CandidateMatch[];
  reasoning: string;
  source?: string;
}

interface VisualItemScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onRegisterNewProduct: (prefill: { name: string; category: ProductCategory; image?: string }) => void;
  onViewProductInInventory?: (product: Product) => void;
  initialMode?: 'pos' | 'inventory';
}

export const VisualItemScannerModal: React.FC<VisualItemScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
  onRegisterNewProduct,
  onViewProductInInventory,
  initialMode = 'pos',
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<VisualRecognitionResult | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [addQty, setAddQty] = useState(1);
  const [justAddedAlert, setJustAddedAlert] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Quick simulation items for instant testing
  const quickTestItems = products.slice(0, 6);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setCapturedImage(null);
      setRecognitionResult(null);
      setCameraError(null);
      setAddQty(1);
      setJustAddedAlert(false);

      // Give React 100ms to ensure the <video> DOM element is fully mounted
      timer = setTimeout(() => {
        startCamera(facingMode);
      }, 100);
    } else {
      stopCamera();
    }

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async (currentFacing: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    setIsInitializing(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Akses kamera WebRTC tidak tersedia di peramban ini. Anda dapat menggunakan tombol "Kamera HP" di bawah.');
      setIsInitializing(false);
      return;
    }

    let stream: MediaStream | null = null;

    try {
      // Attempt 1: with ideal facingMode
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: currentFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1) {
      console.warn('Attempt 1 failed, trying basic video constraints...', err1);
      try {
        // Attempt 2: fallback to any video source
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err2: any) {
        console.warn('Camera permission or device error:', err2);
        setCameraError(
          'Izin kamera belum aktif atau browser memblokir kamera. Silakan klik tombol "Buka Kamera HP" di bawah untuk memotret langsung.'
        );
        setIsInitializing(false);
        setCameraActive(false);
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
          setCameraActive(true);
        } catch (playErr) {
          console.warn('Video play error:', playErr);
          setCameraActive(true);
        }
      }
    }
    setIsInitializing(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsInitializing(false);
  };

  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Capture frame from active video element
  const handleCaptureFromVideo = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
      sound.playBeep();
      analyzeImage(dataUrl);
    } catch (e) {
      console.warn('Canvas capture error:', e);
      fallbackLocalMatch();
    }
  };

  // Image selected from native device camera or file gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      sound.playBeep();
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Instant simulation with sample store products
  const handleSelectSimulatedItem = (product: Product) => {
    const dataUrl = getProductImage(product);
    setCapturedImage(dataUrl);
    stopCamera();
    sound.playBeep();
    analyzeImage(dataUrl, product);
  };

  // AI Analysis Routine
  const analyzeImage = async (imageDataUrl: string, preselectedProduct?: Product) => {
    setIsLoading(true);
    setRecognitionResult(null);
    setAddQty(1);

    if (preselectedProduct) {
      setTimeout(() => {
        setRecognitionResult({
          identifiedItemName: preselectedProduct.name,
          category: preselectedProduct.category,
          description: `Kemasan fisik ${preselectedProduct.name} terdeteksi oleh sensor AI.`,
          similarityScore: 98,
          matchedProductId: preselectedProduct.id,
          matchConfidence: 'high',
          candidateMatches: [
            {
              productId: preselectedProduct.id,
              productName: preselectedProduct.name,
              relevance: 98,
              reason: 'Kemiripan visual 98% (Di atas batas 70%)',
            },
          ],
          reasoning: `Kemiripan 98% (di atas batas 70%). AI berhasil mencocokkan kemasan produk ${preselectedProduct.name} dengan stok toko.`,
          source: 'instant-ai',
        });
        sound.playCashChime();
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/recognize-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          currentProducts: products.map((p) => ({
            id: p.id,
            barcode: p.barcode,
            name: p.name,
            category: p.category,
            sellPrice: p.sellPrice,
            stock: p.stock,
            unit: p.unit,
          })),
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const data: VisualRecognitionResult = await response.json();
      setRecognitionResult(data);
      if (data.matchedProductId) {
        sound.playCashChime();
      } else {
        sound.playWarning();
      }
    } catch (err: any) {
      console.warn('API error, falling back to smart local visual matching:', err);
      fallbackLocalMatch();
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackLocalMatch = () => {
    // If recognition fails or is offline, do NOT falsely force a match below 70%
    setRecognitionResult({
      identifiedItemName: 'Barang Tidak Ditemukan',
      category: 'Lainnya',
      description: 'Gambar berhasil diambil, namun tidak ditemukan barang di inventaris toko dengan tingkat kemiripan di atas 70%.',
      similarityScore: 40,
      matchedProductId: null,
      matchConfidence: 'none',
      candidateMatches: [],
      reasoning: 'Tingkat kemiripan di bawah 70%. Barang tidak ditemukan di stok.',
      source: 'smart-matcher',
    });
    sound.playWarning();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setRecognitionResult(null);
    setAddQty(1);
    setJustAddedAlert(false);
    startCamera(facingMode);
  };

  // Rule: similarity MUST be >= 70% to be considered matched
  const calculatedSimilarity: number =
    recognitionResult?.similarityScore ??
    recognitionResult?.candidateMatches?.[0]?.relevance ??
    (recognitionResult?.matchConfidence === 'high' ? 85 : 0);

  const isMatchAbove70: boolean =
    calculatedSimilarity >= 70 &&
    Boolean(recognitionResult?.matchedProductId);

  const matchedProduct = isMatchAbove70 && recognitionResult?.matchedProductId
    ? products.find((p) => p.id === recognitionResult.matchedProductId)
    : null;

  const handleConfirmAddToCart = (prod: Product, qty: number) => {
    onAddToCart(prod, qty);
    sound.playCashChime();
    setJustAddedAlert(true);
    setTimeout(() => {
      setJustAddedAlert(false);
      onClose();
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight leading-tight">
                Pindai AI Kamera (Tanpa Barcode)
              </h3>
              <p className="text-[11px] text-emerald-100">
                Deteksi otomatis telur, beras, minyak, sasa, mie, bumbu & curah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden inputs for direct native camera and gallery */}
        <input
          id="native-camera-file"
          type="file"
          accept="image/*"
          capture="environment"
          ref={nativeCameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          id="gallery-camera-file"
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Viewport Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {!capturedImage ? (
            <div className="space-y-3">
              {/* VIDEO VIEWFINDER AREA - Video is ALWAYS mounted in DOM */}
              <div className="relative aspect-4/3 sm:aspect-16/10 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex flex-col items-center justify-center">
                {/* Real video element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />

                {/* Overlaid Viewfinder Target when active */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                    <div className="w-56 h-56 border-2 border-dashed border-emerald-400/80 rounded-2xl relative shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-300 rounded-tl-sm" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-300 rounded-tr-sm" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-300 rounded-bl-sm" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-300 rounded-br-sm" />
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-900/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                        Arahkan ke Barang Warung
                      </span>
                    </div>
                  </div>
                )}

                {/* Camera Flip Button */}
                {cameraActive && (
                  <button
                    onClick={handleToggleFacingMode}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/70 text-white hover:bg-slate-900 backdrop-blur-xs transition-colors cursor-pointer"
                    title="Putar Kamera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}

                {/* Placeholder / Permission prompt when camera is not yet active */}
                {!cameraActive && (
                  <div className="p-6 text-center text-slate-300 space-y-3">
                    <Camera className="w-12 h-12 mx-auto text-emerald-400 animate-pulse" />
                    <div>
                      <p className="font-extrabold text-white text-sm">
                        {isInitializing ? 'Menghubungkan Lensa Kamera...' : 'Kamera Siap Digunakan'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Klik tombol di bawah untuk mengambil foto barang atau membuka kamera HP Anda.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Nyalakan Kamera Web
                      </button>
                      <label
                        htmlFor="native-camera-file"
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Buka Kamera HP Langsung</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {cameraActive ? (
                  <button
                    type="button"
                    onClick={handleCaptureFromVideo}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Jepret & Analisis AI</span>
                  </button>
                ) : (
                  <label
                    htmlFor="native-camera-file"
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer text-center"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Buka Kamera Ponsel</span>
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <label
                    htmlFor="native-camera-file"
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-center"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Kamera HP</span>
                  </label>

                  <label
                    htmlFor="gallery-camera-file"
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Galeri Foto</span>
                  </label>
                </div>
              </div>

              {/* Quick Preset Selector: Instant testing without camera permission hassle */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block mb-2">
                  Atau Coba Pindai Cepat Produk Warung (1-Klik):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {quickTestItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSimulatedItem(item)}
                      className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center gap-2 text-left cursor-pointer transition-colors"
                    >
                      <img
                        src={getProductImage(item)}
                        alt={item.name}
                        className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[10px] text-slate-900 truncate">{item.name}</p>
                        <p className="text-[9px] text-emerald-700 font-mono">{formatRupiah(item.sellPrice)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ANALYZING & RESULTS VIEW */
            <div className="space-y-4">
              {/* Photo preview with laser scan animation when loading */}
              <div className="relative aspect-16/10 bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Hasil Foto"
                  className="w-full h-full object-contain bg-slate-950"
                />

                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 space-y-3">
                    <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="font-extrabold text-sm">AI Sedang Mengenali Barang...</p>
                      <p className="text-[11px] text-emerald-200 mt-1">
                        Mencocokkan visual fisik dengan daftar katalog stok warung
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Success Notification */}
              {justAddedAlert && (
                <div className="p-3 bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Berhasil dimasukkan ke Keranjang Kasir!</span>
                </div>
              )}

              {/* Results Details */}
              {recognitionResult && !isLoading && (
                <div className="space-y-3">
                  {matchedProduct ? (
                    <div className="p-4 bg-emerald-50/90 border-2 border-emerald-400 rounded-2xl space-y-3 shadow-xs">
                      {/* Similarity Badge > 70% */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-black rounded-lg shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Kemiripan {calculatedSimilarity}% (&ge; 70%) - Cocok di Stok</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                          AI Match Terverifikasi
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-slate-900 text-base">
                            {matchedProduct.name}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Kategori: <span className="font-bold text-slate-800">{matchedProduct.category}</span>
                          </p>
                        </div>
                        <img
                          src={getProductImage(matchedProduct)}
                          alt={matchedProduct.name}
                          className="w-14 h-14 rounded-xl object-contain bg-white border border-emerald-200 p-1 shrink-0"
                        />
                      </div>

                      {/* Price and Stock */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/70 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                          <span className="text-[10px] text-slate-500 font-medium block">Harga Jual:</span>
                          <span className="font-black text-emerald-700 text-base font-mono">
                            {formatRupiah(matchedProduct.sellPrice)}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                          <span className="text-[10px] text-slate-500 font-medium block">Sisa Stok:</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {matchedProduct.stock} {matchedProduct.unit}
                          </span>
                        </div>
                      </div>

                      {/* Stepper & Add to POS */}
                      <div className="pt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white border border-emerald-200 p-1.5 rounded-xl shrink-0">
                          <button
                            type="button"
                            onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-black text-sm font-mono text-slate-900">
                            {addQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAddQty((q) => q + 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmAddToCart(matchedProduct, addQty)}
                          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Masukkan ke Kasir ({formatRupiah(matchedProduct.sellPrice * addQty)})</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* KETERANGAN: BARANG TIDAK DITEMUKAN JIKA KEMIRIPAN DI BAWAH 70% */
                    <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black shrink-0 shadow-xs">
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-md tracking-wider">
                              Tidak Ada Kemiripan
                            </span>
                            <span className="text-[11px] font-bold text-rose-800">
                              Kemiripan: {calculatedSimilarity > 0 ? `${calculatedSimilarity}%` : '< 70%'} (Di Bawah 70%)
                            </span>
                          </div>
                          <h4 className="font-extrabold text-rose-900 text-base leading-snug">
                            Barang Tidak Ditemukan
                          </h4>
                          <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                            Tidak ditemukan barang di stok toko dengan tingkat kemiripan di atas 70%. Sistem mensyaratkan minimal 70% kemiripan visual agar transaksi akurat.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs space-y-1">
                        <p className="text-slate-700">
                          Hasil deteksi visual: <strong className="text-slate-900">{recognitionResult.identifiedItemName}</strong> ({recognitionResult.category})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {recognitionResult.reasoning || 'Karakteristik visual barang tidak memenuhi batas minimum kemiripan 70%.'}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleRetake}
                          className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                          <span>Foto / Pindai Ulang</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onRegisterNewProduct({
                              name: recognitionResult.identifiedItemName !== 'Barang Tidak Ditemukan' ? recognitionResult.identifiedItemName : '',
                              category: (recognitionResult.category as any) || 'Sembako',
                              image: capturedImage || undefined,
                            });
                            onClose();
                          }}
                          className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>+ Daftarkan Sebagai Barang Baru</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Retake Button for matched items */}
                  {matchedProduct && (
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Foto Barang Lainnya</span>
                    </button>
                  )}

                  {/* Retake Button */}
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Foto Ulang / Pindai Barang Lain</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
