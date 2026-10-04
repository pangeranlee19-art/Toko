import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { sound } from '../utils/sound';
import { formatRupiah } from '../utils/format';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import {
  X,
  Camera,
  Barcode,
  Check,
  Search,
  AlertCircle,
  RefreshCw,
  Upload,
  SwitchCamera,
  Plus,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScan: (product: Product) => void;
  onAddNewProductWithBarcode?: (barcode: string) => void;
  onSwitchToVisualScanner?: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onScan,
  onAddNewProductWithBarcode,
  onSwitchToVisualScanner,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    product?: Product;
    unknownBarcode?: string;
  } | null>(null);
  const [continuousMode, setContinuousMode] = useState(true);
  const [scannedSessionCount, setScannedSessionCount] = useState(0);

  // Facing mode: 'environment' (belakang) or 'user' (depan)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const isSwitchingRef = useRef<boolean>(false);

  // Sample quick products for instant barcode simulation
  const barcodePresets = products.filter((p) => p.barcode && p.barcode.length > 5).slice(0, 4);

  // Initialize camera and enumerate devices
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setStatusMessage(null);
      setScannedSessionCount(0);
      return;
    }

    codeReaderRef.current = new BrowserMultiFormatReader();

    // Query available video devices
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        setVideoDevices(devices);
      })
      .catch((e) => {
        console.warn('Failed listing video input devices:', e);
      });

    // Start scanner after a slight microtask to guarantee videoRef is in DOM
    const timer = setTimeout(() => {
      startScanner(facingMode);
    }, 150);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = () => {
    if (scannerControlsRef.current) {
      try {
        scannerControlsRef.current.stop();
      } catch (e) {
        console.warn('Error stopping scanner controls:', e);
      }
      scannerControlsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Error stopping stream tracks:', e);
      }
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const startScanner = async (currentFacing: 'environment' | 'user') => {
    stopScanner();
    setCameraError(null);
    setCameraActive(false);

    if (!videoRef.current) return;

    // Always instantiate a clean reader to avoid stale callbacks
    codeReaderRef.current = new BrowserMultiFormatReader();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Fitur akses kamera tidak didukung pada browser ini.');
      return;
    }

    // Identify device ID if list is ready
    let matchedDeviceId: string | undefined = undefined;
    if (videoDevices.length > 0) {
      if (currentFacing === 'user') {
        const frontDevice = videoDevices.find((d) => {
          const l = d.label.toLowerCase();
          return l.includes('front') || l.includes('depan') || l.includes('user') || l.includes('selfie') || l.includes('facetime');
        });
        if (frontDevice) matchedDeviceId = frontDevice.deviceId;
      } else {
        const backDevice = videoDevices.find((d) => {
          const l = d.label.toLowerCase();
          return l.includes('back') || l.includes('belakang') || l.includes('rear') || l.includes('environment');
        });
        if (backDevice) matchedDeviceId = backDevice.deviceId;
      }
    }

    try {
      let controls: IScannerControls | null = null;

      // Method 1: Decode using exact device ID if found
      if (matchedDeviceId) {
        controls = await codeReaderRef.current.decodeFromVideoDevice(
          matchedDeviceId,
          videoRef.current,
          handleDecodeCallback
        );
      } else {
        // Method 2: Decode from Constraints
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: currentFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        try {
          controls = await codeReaderRef.current.decodeFromConstraints(
            constraints,
            videoRef.current,
            handleDecodeCallback
          );
        } catch (constraintErr) {
          console.warn('decodeFromConstraints attempt 1 failed, trying fallback...', constraintErr);
          controls = await codeReaderRef.current.decodeFromConstraints(
            { audio: false, video: { facingMode: currentFacing } },
            videoRef.current,
            handleDecodeCallback
          );
        }
      }

      scannerControlsRef.current = controls;
      setCameraActive(true);

      // Refresh device list
      BrowserMultiFormatReader.listVideoInputDevices()
        .then((devices) => setVideoDevices(devices))
        .catch(() => {});
    } catch (err: any) {
      console.warn('Camera start error for facingMode:', currentFacing, err);
      try {
        const fallbackControls = await codeReaderRef.current.decodeFromConstraints(
          { audio: false, video: true },
          videoRef.current,
          handleDecodeCallback
        );
        scannerControlsRef.current = fallbackControls;
        setCameraActive(true);
      } catch (fallbackErr: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Izin kamera tidak diberikan. Silakan izinkan akses kamera di browser Anda.');
        } else {
          setCameraError(`Kamera ${currentFacing === 'user' ? 'depan' : 'belakang'} tidak dapat diakses.`);
        }
        setCameraActive(false);
      }
    }
  };

  const handleDecodeCallback = (result: any) => {
    // If switching cameras, do not process any frames to prevent accidental triggers
    if (isSwitchingRef.current) return;

    if (result) {
      const rawBarcode = result.getText();
      const now = Date.now();
      // Throttle duplicate scans within 1.8s
      if (
        rawBarcode &&
        (rawBarcode !== lastScannedCodeRef.current || now - lastScannedTimeRef.current > 1800)
      ) {
        lastScannedCodeRef.current = rawBarcode;
        lastScannedTimeRef.current = now;
        handleBarcodeDetected(rawBarcode);
      }
    }
  };

  // Safe camera switch with hardware release delay
  const handleToggleFacingMode = async (targetMode?: 'environment' | 'user') => {
    if (isSwitchingRef.current) return;
    isSwitchingRef.current = true;
    setIsSwitching(true);

    const nextMode = targetMode || (facingMode === 'environment' ? 'user' : 'environment');
    setFacingMode(nextMode);

    try {
      // 1. Fully stop existing tracks
      stopScanner();

      // 2. Delay 200ms for mobile OS camera hardware to cleanly release sensor
      await new Promise((r) => setTimeout(r, 200));

      // 3. Start camera with the new facingMode
      await startScanner(nextMode);
    } catch (e) {
      console.warn('Safe camera switch error:', e);
    } finally {
      isSwitchingRef.current = false;
      setIsSwitching(false);
    }
  };

  // Decode from an uploaded image file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imgUrl = URL.createObjectURL(file);
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(imgUrl);
      if (result && result.getText()) {
        handleBarcodeDetected(result.getText());
      } else {
        sound.playWarning();
        setStatusMessage({
          type: 'error',
          text: 'Tidak ada barcode yang terbaca pada gambar.',
        });
      }
      URL.revokeObjectURL(imgUrl);
    } catch (e) {
      sound.playWarning();
      setStatusMessage({
        type: 'error',
        text: 'Gagal mendeteksi barcode dari foto. Pastikan garis barcode tajam dan terang.',
      });
    }
  };

  // Main barcode handler
  const handleBarcodeDetected = (rawBarcode: string) => {
    const cleaned = rawBarcode.trim();
    if (!cleaned) return;

    // Search in product catalog
    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === cleaned.toLowerCase() ||
        p.id.toLowerCase() === cleaned.toLowerCase()
    );

    if (matched) {
      sound.playBeep();
      setScannedSessionCount((prev) => prev + 1);
      setStatusMessage({
        type: 'success',
        text: `Berhasil ditambahkan ke kasir: ${matched.name} (${formatRupiah(matched.sellPrice)})`,
        product: matched,
      });

      onScan(matched);

      if (!continuousMode) {
        setTimeout(() => {
          onClose();
        }, 900);
      }
    } else {
      sound.playWarning();
      setStatusMessage({
        type: 'error',
        text: `Barcode "${cleaned}" belum terdaftar di toko.`,
        unknownBarcode: cleaned,
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeDetected(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Pemindai Barcode Kasir</h3>
              <p className="text-[11px] text-slate-500">
                {scannedSessionCount > 0
                  ? `${scannedSessionCount} item berhasil di-scan`
                  : 'Arahkan garis barcode produk ke kamera'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* CAMERA SELECTOR TABS: Belakang vs Depan */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              disabled={isSwitching}
              onClick={() => handleToggleFacingMode('environment')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                facingMode === 'environment'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera Belakang</span>
            </button>

            <button
              type="button"
              disabled={isSwitching}
              onClick={() => handleToggleFacingMode('user')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                facingMode === 'user'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SwitchCamera className="w-3.5 h-3.5" />
              <span>Kamera Depan</span>
            </button>
          </div>

          {/* AI Banner Shortcut */}
          {onSwitchToVisualScanner && (
            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[11px] text-emerald-900 leading-tight">
                  <strong className="font-bold">Barang tanpa barcode?</strong> (Telur, beras curah, garam sasa)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToVisualScanner();
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Pindai AI</span>
              </button>
            </div>
          )}

          {/* Camera Viewport */}
          <div className="relative w-full aspect-video sm:aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                cameraActive ? 'opacity-100' : 'opacity-0'
              } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              playsInline
              muted
            />

            {/* Error or connecting fallback container */}
            {(!cameraActive || isSwitching) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2 bg-slate-900">
                <Camera className="w-10 h-10 text-emerald-500 animate-pulse" />
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                  {isSwitching
                    ? 'Beralih kamera...'
                    : cameraError || `Menghubungkan sensor kamera ${facingMode === 'user' ? 'depan' : 'belakang'}...`}
                </p>
                {!isSwitching && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startScanner(facingMode)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Coba Lagi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFacingMode(facingMode === 'user' ? 'environment' : 'user')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-semibold cursor-pointer"
                    >
                      <SwitchCamera className="w-3 h-3" />
                      <span>Ganti ke Kamera {facingMode === 'user' ? 'Belakang' : 'Depan'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Targeting Laser Overlay & Frame */}
            {cameraActive && !isSwitching && (
              <div className="absolute inset-x-8 inset-y-10 border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse" />
                <span className="absolute bottom-2 text-[10px] bg-black/70 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  {facingMode === 'user' ? 'Kamera Depan Aktif' : 'Kamera Belakang Aktif'}
                </span>
              </div>
            )}

            {/* Quick Switch Button (always visible in corner) */}
            {cameraActive && !isSwitching && (
              <button
                type="button"
                onClick={() => handleToggleFacingMode()}
                title="Ganti Kamera Depan / Belakang"
                className="absolute top-2.5 right-2.5 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-xs text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mode Switch & Upload Button */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-semibold text-[11px]">Mode Scan Beruntun</span>
            </label>

            <label className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Unggah Barcode</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Status / Alert Feedback Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs space-y-1.5 transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">{statusMessage.text}</p>
                </div>
              </div>

              {/* Action for unrecognised barcode */}
              {statusMessage.unknownBarcode && onAddNewProductWithBarcode && (
                <div className="pt-1.5 border-t border-rose-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700 font-mono truncate">
                    {statusMessage.unknownBarcode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAddNewProductWithBarcode(statusMessage.unknownBarcode!);
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Daftarkan Barang Baru</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Simulation Barcodes */}
          {barcodePresets.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Simulasi Barcode Barang Toko:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {barcodePresets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleBarcodeDetected(p.barcode)}
                    className="p-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <span className="text-[10px] font-bold text-slate-800 truncate mr-1">
                      {p.name}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700 shrink-0">
                      {formatRupiah(p.sellPrice)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Barcode Input Form */}
          <form onSubmit={handleManualSubmit} className="pt-1">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Ketik Kode Barcode Manual:
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Contoh: 8992388123010"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Cari</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
