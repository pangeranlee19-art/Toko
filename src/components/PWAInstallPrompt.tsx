import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Pasang Aplikasi di HP / Tablet"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Pasang APK / Aplikasi</span>
        <span className="sm:hidden">Install</span>
      </button>

      {installSuccess && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>Aplikasi WarungPro berhasil dipasang di layar utama!</span>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pasang WarungPro ke HP</h3>
                  <p className="text-xs text-slate-500">Jalankan layaknya aplikasi native Android / iOS</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              {isIOS ? (
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-800">Petunjuk untuk iPhone / iPad (Safari):</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                    <li className="flex items-center gap-1.5">
                      1. Tekan tombol <Share2 className="w-3.5 h-3.5 text-blue-600 inline" /> <strong>Share</strong> di bilah bawah Safari.
                    </li>
                    <li className="flex items-center gap-1.5">
                      2. Gulir ke bawah lalu pilih <PlusSquare className="w-3.5 h-3.5 text-slate-700 inline" /> <strong>Add to Home Screen</strong>.
                    </li>
                    <li>3. Beri nama & tekan <strong>Add</strong>. Ikon WarungPro akan muncul di menu HP Anda.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-800">Petunjuk untuk Android (Chrome / Browser Lain):</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                    <li>1. Tekan titik tiga (menu opsi) di pojok kanan atas browser.</li>
                    <li>2. Pilih <strong>Tambahkan ke Layar Utama</strong> atau <strong>Instal Aplikasi</strong>.</li>
                    <li>3. Selesai! Aplikasi dapat dibuka cepat tanpa mengetik URL lagi dan bekerja saat offline.</li>
                  </ol>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-500 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                💡 <strong>Keuntungan:</strong> Buka instan tanpa internet, layar penuh tanpa address bar browser, kasir lebih cepat dan efisien.
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-2.5 px-4 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
