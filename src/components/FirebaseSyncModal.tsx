import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Share2,
  Wifi,
  WifiOff,
  Database,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  QrCode,
  X,
  ExternalLink,
} from 'lucide-react';
import { firebaseSync } from '../utils/firebaseSync';
import { auth, signInWithGoogle, signOutFirebase } from '../utils/firebase';
import { Product, Transaction, DebtRecord, Supplier, PurchaseOrder, StoreProfile } from '../types';
import { useOnlineStatus } from '../hooks/usePWAInstall';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  transactions: Transaction[];
  debts: DebtRecord[];
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  storeProfile: StoreProfile;
  onToast: (msg: string) => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
  products,
  transactions,
  debts,
  suppliers,
  purchases,
  storeProfile,
  onToast,
}) => {
  const isOnline = useOnlineStatus();
  const [storeEmailInput, setStoreEmailInput] = useState(firebaseSync.getStoreEmail());
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user?.email && !firebaseSync.getStoreEmail()) {
        firebaseSync.setStoreEmail(user.email);
        setStoreEmailInput(user.email);
      }
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentStoreId = firebaseSync.getStoreId();
  const currentStoreEmail = firebaseSync.getStoreEmail();
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeEmailInput.trim()) return;
    firebaseSync.setStoreEmail(storeEmailInput.trim());
    onToast(`Database toko diubah ke email: ${storeEmailInput.trim()}`);
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        firebaseSync.setStoreEmail(user.email);
        setStoreEmailInput(user.email);
        onToast(`Terhubung dengan Google: ${user.email}`);
      }
    } catch (err: any) {
      console.error(err);
      onToast('Gagal login Google. Silakan periksa koneksi internet.');
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOutFirebase();
      onToast('Berhasil keluar dari akun Google');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyShareLink = () => {
    const shareText = `*Akses Kasir Toko ${storeProfile.storeName || 'WarungPro'} (Multi-HP)*\nBuka link kasir:\n${appUrl}\n\nEmail Toko Cloud: ${currentStoreEmail}\n(Semua HP yang membuka dengan email ini otomatis tersinkron real-time!)`;
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    onToast('Teks & link kasir disalin! Siap dikirim ke HP kasir/pegawai via WhatsApp.');
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await firebaseSync.seedAllToCloud({
        products,
        transactions,
        debts,
        suppliers,
        purchases,
        storeProfile,
      });
      onToast(result.message);
    } catch (err: any) {
      onToast('Gagal sinkronisasi data: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
              <Smartphone className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Sinkronisasi Multi-HP Real-time</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-blue-950 uppercase tracking-wider">
                  Firebase Cloud
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                Satu database toko bisa dibuka di banyak HP sekaligus secara bersamaan
              </p>
            </div>
          </div>

          {/* Real-time Status Badge Banner */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="font-semibold">
                {isOnline ? 'Real-time Online Aktif' : 'Mode Offline — Data tersimpan lokal & siap sync saat online'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl text-[11px] font-mono">
              <Database className="w-3.5 h-3.5 text-blue-200" />
              <span>ID: {currentStoreId}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800 text-xs">
          {/* Key Multi-Device Rules Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-blue-900 font-black text-xs">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Multi HP Serentak</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                HP Kasir 1, Kasir 2, dan HP Pemilik semuanya terhubung ke data toko yang sama.
              </p>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <span>Update Otomatis</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Saat kasir menjual barang, stok di semua HP lain otomatis berkurang detik itu juga.
              </p>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span>Offline Safe & Sync</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Bila internet mati, tetap bisa transaksi. Begitu internet nyala, otomatis terupdate.
              </p>
            </div>
          </div>

          {/* Store Database Account Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  Email Database Toko (Kunci Sinkronisasi)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Semua HP yang menggunakan email ini akan mengakses data toko yang persis sama.
                </p>
              </div>

              {currentUser ? (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-700 text-[11px]">
                    Google: {currentUser.email}
                  </span>
                  <button
                    onClick={handleGoogleLogout}
                    className="text-rose-600 hover:text-rose-700 text-[10px] font-bold underline ml-1 cursor-pointer"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl font-bold flex items-center gap-2 shadow-xs transition cursor-pointer text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Masuk dengan Google</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveEmail} className="flex gap-2">
              <input
                type="email"
                required
                value={storeEmailInput}
                onChange={(e) => setStoreEmailInput(e.target.value)}
                placeholder="misal: pangeranlee19@gmail.com"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
              >
                Gunakan Email Ini
              </button>
            </form>
          </div>

          {/* How to Connect other Phones */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-600" />
              Langkah Menghubungkan HP Kasir Lainnya:
            </h3>

            <div className="space-y-2.5 text-[11px] text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <p>
                  Buka browser Chrome di HP Kasir 1 / Kasir 2 / HP Pegawai, lalu buka alamat web aplikasi ini.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <p>
                  Buka menu <strong>Sinkronisasi Multi-HP</strong> di HP tersebut, lalu masukkan email toko yang sama:{' '}
                  <strong className="text-blue-900 font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                    {currentStoreEmail}
                  </strong>
                  .
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <p>
                  Selesai! Semua HP otomatis terhubung ke database yang sama secara real-time. Transaksi di HP manapun
                  langsung sinkron.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link & Kode Tersalin!' : 'Salin Pesan Akses untuk Pegawai (WhatsApp)'}</span>
              </button>
            </div>
          </div>

          {/* Seed Local Data to Cloud */}
          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Kirim Data Lokal ke Firebase Cloud</h4>
              <p className="text-[11px] text-slate-500">
                Unggah {products.length} barang, {transactions.length} transaksi, dan {debts.length} kasbon ke cloud
                agar langsung tampil di HP lain.
              </p>
            </div>
            <button
              type="button"
              disabled={isSeeding}
              onClick={handleSeedData}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-xs whitespace-nowrap"
            >
              <Cloud className={`w-4 h-4 ${isSeeding ? 'animate-bounce' : ''}`} />
              <span>{isSeeding ? 'Mengunggah...' : 'Unggah & Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Koneksi aman Firebase Firestore Enterprise & enkripsi real-time</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
