import React, { useState, useEffect } from 'react';
import {
  Crown,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  Smartphone,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  Printer,
  ShoppingBag,
  Clock,
  ArrowRight,
  MessageCircle,
  KeyRound,
  Check,
  HelpCircle,
  Copy,
  Lock,
} from 'lucide-react';
import { LicenseInfo, LicenseDuration, StoreProfile } from '../types';
import { licenseManager, getDurationLabel } from '../utils/licenseManager';
import { sound } from '../utils/sound';

interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLicense: LicenseInfo;
  storeProfile: StoreProfile;
  onLicenseActivated: (newLicense: LicenseInfo) => void;
  initialTab?: 'plans' | 'activate';
}

export const UpgradeProModal: React.FC<UpgradeProModalProps> = ({
  isOpen,
  onClose,
  currentLicense,
  storeProfile,
  onLicenseActivated,
  initialTab = 'plans',
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'activate'>(initialTab);
  const [licenseInput, setLicenseInput] = useState('');
  const [buyerNameInput, setBuyerNameInput] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setActivationError(null);
      setActivationSuccess(null);
      setLicenseInput('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isPro = licenseManager.isPro();
  const ownerContact = licenseManager.getOwnerContact();

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) {
      setActivationError('Mohon masukkan Kode Lisensi PRO Anda.');
      return;
    }

    setActivationError(null);
    setIsActivating(true);

    setTimeout(() => {
      const result = licenseManager.activateKey(licenseInput, buyerNameInput, storeProfile.storeName);
      setIsActivating(false);

      if (result.success && result.license) {
        sound.success();
        setActivationSuccess(result.message);
        onLicenseActivated(result.license);
      } else {
        sound.error();
        setActivationError(result.message);
      }
    }, 600);
  };

  const handleOpenWhatsApp = () => {
    sound.click();
    const url = licenseManager.createWhatsAppBuyUrl(undefined, storeProfile.storeName);
    window.open(url, '_blank');
  };

  const handleCopyCurrentKey = () => {
    if (currentLicense.licenseKey) {
      navigator.clipboard.writeText(currentLicense.licenseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Crown className="w-7 h-7 text-amber-200 fill-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Warungku POS PRO</h2>
                {isPro && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-xs font-black uppercase tracking-wider shadow-xs">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-amber-100 text-xs sm:text-sm mt-0.5">
                {isPro
                  ? `Lisensi Aktif: ${getDurationLabel(currentLicense.duration || 'lifetime')}`
                  : 'Upgrade ke Full Akses Tanpa Batas untuk Menumbuhkan Usaha Anda'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-5 bg-black/15 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                sound.click();
                setActiveTab('plans');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'plans'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              ⭐ Fitur & Pilihan Paket
            </button>
            <button
              type="button"
              onClick={() => {
                sound.click();
                setActiveTab('activate');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'activate'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              🔑 Aktivasi Kode Lisensi
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PLANS & COMPARISON */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              {/* Active License Status Banner if already PRO */}
              {isPro && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 space-y-1">
                    <p className="font-bold text-sm text-emerald-800">
                      Selamat! Anda telah memiliki Akun PRO Full Akses.
                    </p>
                    <p>
                      Masa aktif: <strong>{getDurationLabel(currentLicense.duration || 'lifetime')}</strong>
                      {currentLicense.expiresAt && ` (Kedaluwarsa: ${new Date(currentLicense.expiresAt).toLocaleDateString('id-ID')})`}
                    </p>
                    {currentLicense.licenseKey && (
                      <div className="flex items-center gap-2 pt-1 font-mono">
                        <span className="text-slate-600">Kode:</span>
                        <code className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold">
                          {currentLicense.licenseKey}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyCurrentKey}
                          className="p-1 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer"
                          title="Salin Kode Lisensi"
                        >
                          {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Side-by-Side Comparison Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PAKET GRATIS */}
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-black uppercase">
                        Paket Gratis
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Bawaan Play Store</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-black text-slate-800">Rp 0</span>
                      <span className="text-xs text-slate-500 ml-1">/ Selamanya</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Cocok untuk coba-coba & warung mikro pemula.</p>

                    <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Maksimal <strong>30 Produk</strong> di Katalog</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Maksimal <strong>50 Transaksi</strong> / bulan</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>1 Akun Kasir (Single Device)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Buku Utang Kasbon maks. 5 orang</span>
                      </li>
                      <li className="flex items-center gap-2 text-slate-400">
                        <X className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="line-through">Cloud Realtime Sync Multi-HP</span>
                      </li>
                      <li className="flex items-center gap-2 text-slate-400">
                        <X className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="line-through">Export Laporan Excel & Analisis Laba</span>
                      </li>
                      <li className="flex items-center gap-2 text-slate-400">
                        <X className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="line-through">Kustom Logo Toko pada Struk Thermal</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-200">
                    <div className="text-center text-xs text-slate-500 font-semibold">
                      {isPro ? 'Paket Dasar' : '✓ Paket Anda Saat Ini'}
                    </div>
                  </div>
                </div>

                {/* PAKET PRO FULL AKSES */}
                <div className="rounded-2xl border-2 border-amber-400 p-4 bg-gradient-to-b from-amber-50/50 to-white flex flex-col justify-between relative shadow-md">
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Paling Populer
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-black uppercase flex items-center gap-1 shadow-xs">
                        <Crown className="w-3.5 h-3.5 fill-white" /> PRO Full Akses
                      </span>
                      <span className="text-xs text-amber-700 font-bold">Sekali Bayar / Langganan</span>
                    </div>

                    <div className="mt-3">
                      <span className="text-2xl font-black text-slate-900">Mulai Rp 49.000</span>
                      <span className="text-xs text-slate-500 ml-1">atau Lifetime</span>
                    </div>
                    <p className="text-xs text-amber-800 font-medium mt-1">
                      Akses penuh semua fitur bisnis tanpa batasan selamanya.
                    </p>

                    <ul className="mt-4 space-y-2.5 text-xs text-slate-800 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Unlimited Produk</strong> (Simpan ribuan barang)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Unlimited Transaksi Kasir</strong> tanpa kuota</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Cloud Sync Multi-HP Realtime</strong> (Multi-Kasir & Pemilik)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Multi-User Kasir</strong> dengan PIN & Hak Akses</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Export Excel & PDF</strong> Analisis Laba Bersih</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Cetak Logo Toko</strong> di Struk Printer Bluetooth</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Suplier & Utang Unlimited</strong> + Auto Cloud Backup</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-3 border-t border-amber-200">
                    <button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Beli Akses PRO via WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* How it works simple guide */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#005AE0]" /> Cara Membeli & Mengaktifkan Lisensi:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#005AE0] font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <span>Klik tombol WhatsApp untuk chat pemilik/developer aplikasi.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#005AE0] font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <span>Lakukan pembayaran via Transfer Bank / QRIS.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#005AE0] font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <span>Pemilik akan mengirimkan Kode Lisensi resmi untuk diaktifkan di tab sebelah.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVATE LICENSE KEY */}
          {activeTab === 'activate' && (
            <div className="space-y-6">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold text-sm text-amber-950 mb-1">Sudah Membeli Lisensi dari Penjual?</p>
                  <p>
                    Masukkan Kode Lisensi resmi yang Anda terima dari WhatsApp Developer untuk membuka semua fitur
                    tanpa batas secara instan.
                  </p>
                </div>
              </div>

              {/* Activation Form */}
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kode Lisensi PRO <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={licenseInput}
                      onChange={(e) => setLicenseInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: PRO-LIFE-XXXX-XXXX"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm font-mono tracking-wider font-bold text-slate-800 placeholder-slate-400 outline-hidden transition-all uppercase"
                      required
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format kode lisensi terdiri dari 4 bagian dipisahkan tanda strip (contoh: <code>PRO-LIFE-XXXX-XXXX</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Pemilik / Toko Anda (Opsional)
                  </label>
                  <input
                    type="text"
                    value={buyerNameInput}
                    onChange={(e) => setBuyerNameInput(e.target.value)}
                    placeholder={storeProfile.storeName || 'Nama Toko Anda'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-hidden transition-all"
                  />
                </div>

                {activationError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{activationError}</span>
                  </div>
                )}

                {activationSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{activationSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isActivating}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  {isActivating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi Lisensi...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 fill-white" />
                      <span>Aktivasi Lisensi Sekarang</span>
                    </>
                  )}
                </button>
              </form>

              {/* Bottom WhatsApp Help */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-600">Belum memiliki kode lisensi resmi?</span>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Hubungi Penjual via WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Lisensi Resmi Warungku POS Play Store Edition</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
