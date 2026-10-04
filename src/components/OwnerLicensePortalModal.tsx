import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  X,
  Plus,
  Trash2,
  Smartphone,
  Crown,
  Search,
  MessageCircle,
  Settings,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { LicenseInfo, GeneratedLicenseRecord, LicenseDuration } from '../types';
import { licenseManager, getDurationLabel, OwnerContact } from '../utils/licenseManager';
import { sound } from '../utils/sound';

interface OwnerLicensePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseChanged: (license: LicenseInfo) => void;
  currentLicense: LicenseInfo;
}

export const OwnerLicensePortalModal: React.FC<OwnerLicensePortalModalProps> = ({
  isOpen,
  onClose,
  onLicenseChanged,
  currentLicense,
}) => {
  // Master PIN protection
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Active section inside portal
  const [activeTab, setActiveTab] = useState<'generate' | 'list' | 'settings' | 'test'>('generate');

  // License Generator State
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerStoreName, setBuyerStoreName] = useState('');
  const [duration, setDuration] = useState<LicenseDuration>('lifetime');
  const [notes, setNotes] = useState('');
  const [newlyGenerated, setNewlyGenerated] = useState<GeneratedLicenseRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Issued Licenses List
  const [issuedLicenses, setIssuedLicenses] = useState<GeneratedLicenseRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Seller Contact Settings
  const [ownerContact, setOwnerContact] = useState<OwnerContact>({ phone: '', name: '', email: '' });
  const [saveContactSuccess, setSaveContactSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reload current issued licenses & owner contact
      setIssuedLicenses(licenseManager.getIssuedLicenses());
      setOwnerContact(licenseManager.getOwnerContact());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Verify PIN (default master PIN is 998877 or 123456)
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '998877' || pinInput === '123456') {
      sound.success();
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      sound.error();
      setPinError(true);
    }
  };

  const handleGenerateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      sound.error();
      return;
    }

    sound.success();
    const record = licenseManager.generateLicense(duration, buyerName, buyerPhone, buyerStoreName, notes);
    setNewlyGenerated(record);
    setIssuedLicenses(licenseManager.getIssuedLicenses());
  };

  const handleCopy = (text: string) => {
    sound.click();
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSendToWhatsApp = (record: GeneratedLicenseRecord) => {
    sound.click();
    const url = licenseManager.createWhatsAppSendLicenseUrl(
      record.buyerPhone,
      record.buyerName,
      record.key,
      record.duration
    );
    window.open(url, '_blank');
  };

  const handleDeleteLicense = (id: string) => {
    if (confirm('Hapus riwayat lisensi ini?')) {
      sound.click();
      const updated = issuedLicenses.filter((lic) => lic.id !== id);
      licenseManager.saveIssuedLicenses(updated);
      setIssuedLicenses(updated);
    }
  };

  const handleDirectUnlock = () => {
    sound.success();
    const newLic = licenseManager.directUnlockPro('lifetime', 'Owner Test Device', 'Warungku Headquarter');
    onLicenseChanged(newLic);
    alert('Aplikasi pada perangkat ini sekarang berstatus PRO Lifetime (Full Akses)!');
  };

  const handleResetToFree = () => {
    sound.click();
    licenseManager.resetToFree();
    onLicenseChanged({ tier: 'free' });
    alert('Aplikasi sekarang disetel ke Mode Gratis (untuk pengujian batas fitur).');
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    sound.success();
    licenseManager.saveOwnerContact(ownerContact);
    setSaveContactSuccess(true);
    setTimeout(() => setSaveContactSuccess(false), 2500);
  };

  const filteredLicenses = issuedLicenses.filter((lic) => {
    const q = searchQuery.toLowerCase();
    return (
      lic.key.toLowerCase().includes(q) ||
      lic.buyerName.toLowerCase().includes(q) ||
      lic.buyerPhone.includes(q) ||
      (lic.storeName && lic.storeName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Portal Lisensi Pemilik & Admin Penjual
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/40">
                  Super Admin
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Kelola, terbitkan, dan kirimkan akses PRO langsung ke pembeli aplikasi Anda
              </p>
            </div>
          </div>

          {/* Navigation Bar when authenticated */}
          {isAuthenticated && (
            <div className="flex flex-wrap gap-2 mt-5 bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  setActiveTab('generate');
                }}
                className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'generate'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                ✨ Buat Lisensi Pembeli
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  setActiveTab('list');
                }}
                className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                📋 Riwayat Lisensi ({issuedLicenses.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  setActiveTab('settings');
                }}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                ⚙️ Nomor WhatsApp CS
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  setActiveTab('test');
                }}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'test'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                🧪 Mode Simulasi
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* PIN PROTECTION SCREEN */}
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-800">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-800">Masukkan PIN Rahasia Pemilik</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Portal ini khusus untuk pemilik aplikasi yang menjual lisensi ke pembeli Play Store.
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-[11px] font-semibold">
                  Default PIN Master: <strong>998877</strong>
                </div>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4 max-w-xs mx-auto">
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Masukkan 6 Digit PIN"
                    maxLength={10}
                    className="w-full text-center tracking-[0.3em] font-mono font-bold text-xl px-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white rounded-2xl outline-hidden"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {pinError && (
                  <p className="text-xs text-rose-600 font-bold">
                    PIN salah. Gunakan default master: <strong>998877</strong>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md cursor-pointer transition-colors"
                >
                  Buka Portal Lisensi
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* TAB 1: GENERATE NEW LICENSE */}
              {activeTab === 'generate' && (
                <div className="space-y-6">
                  {/* Newly Generated License Success Card */}
                  {newlyGenerated && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 shadow-sm space-y-4 animate-scaleUp">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          <div>
                            <h4 className="font-black text-slate-900 text-base">
                              Lisensi PRO Berhasil Diterbitkan!
                            </h4>
                            <p className="text-xs text-emerald-800">
                              Untuk Pembeli: <strong>{newlyGenerated.buyerName}</strong> ({getDurationLabel(newlyGenerated.duration)})
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewlyGenerated(null)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* License Key Box */}
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 shadow-xs">
                        <code className="text-base sm:text-lg font-black font-mono tracking-wider text-slate-900 select-all">
                          {newlyGenerated.key}
                        </code>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(newlyGenerated.key)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Action to send to WhatsApp */}
                      <div className="flex flex-wrap gap-2">
                        {newlyGenerated.buyerPhone ? (
                          <button
                            type="button"
                            onClick={() => handleSendToWhatsApp(newlyGenerated)}
                            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                          >
                            <MessageCircle className="w-4 h-4 fill-white" />
                            <span>Kirim ke WhatsApp Pembeli ({newlyGenerated.buyerPhone})</span>
                          </button>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            (Nomor WhatsApp pembeli tidak diisi, silakan salin kode lisensi di atas untuk dikirimkan secara manual)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Form to Generate */}
                  <form onSubmit={handleGenerateLicense} className="space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-amber-500" />
                        Formulir Penerbitan Lisensi Baru
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Isi data pembeli yang sudah melakukan transfer/pembayaran untuk membuatkan kode lisensi.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Nama Pembeli <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="Contoh: Pak Joko / Toko Barokah"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm text-slate-800 outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          No. WhatsApp Pembeli
                        </label>
                        <input
                          type="text"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          placeholder="Contoh: 08123456789"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm text-slate-800 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Nama Toko / Usaha
                        </label>
                        <input
                          type="text"
                          value={buyerStoreName}
                          onChange={(e) => setBuyerStoreName(e.target.value)}
                          placeholder="Contoh: Warung Barokah Jaya"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm text-slate-800 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Pilihan Durasi Lisensi
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(e.target.value as LicenseDuration)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm font-semibold text-slate-800 outline-hidden cursor-pointer"
                        >
                          <option value="lifetime">👑 PRO Lifetime (Selamanya / Sekali Bayar)</option>
                          <option value="1year">📅 PRO 1 Tahun (Tahunan)</option>
                          <option value="6months">📅 PRO 6 Bulan</option>
                          <option value="1month">📅 PRO 1 Bulan</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Catatan Transaksi / Pembayaran
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Transfer BCA Rp 100.000 tgl 4 Okt 2026"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm text-slate-800 outline-hidden"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-slate-950 font-black text-sm rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all"
                      >
                        <Crown className="w-4 h-4 fill-slate-950" />
                        <span>✨ Generate Kode Lisensi Resmi untuk Pembeli</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: ISSUED LICENSES LIST */}
              {activeTab === 'list' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-800 text-base">Riwayat Lisensi Terbit</h3>
                      <p className="text-xs text-slate-500">
                        Total {issuedLicenses.length} lisensi telah dibuat untuk pembeli
                      </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama, no HP, kode..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl text-xs text-slate-800 outline-hidden"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {filteredLicenses.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <p className="text-sm font-semibold text-slate-600">Belum ada lisensi yang cocok</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Buat lisensi pertama Anda melalui tab "Buat Lisensi Pembeli".
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredLicenses.map((lic) => (
                        <div
                          key={lic.id}
                          className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 shadow-xs transition-all space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  lic.duration === 'lifetime'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                                }`}
                              >
                                {getDurationLabel(lic.duration)}
                              </span>
                              <span className="font-bold text-sm text-slate-900">{lic.buyerName}</span>
                              {lic.storeName && (
                                <span className="text-xs text-slate-500">({lic.storeName})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {lic.status === 'used' ? (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Sudah Aktif
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Siap Diaktivasi
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteLicense(lic.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                                title="Hapus dari riwayat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Key & Action Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <code className="text-xs sm:text-sm font-mono font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                              {lic.key}
                            </code>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(lic.key)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" /> Salin
                              </button>

                              {lic.buyerPhone && (
                                <button
                                  type="button"
                                  onClick={() => handleSendToWhatsApp(lic)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-white" /> WhatsApp
                                </button>
                              )}
                            </div>
                          </div>

                          {lic.notes && (
                            <p className="text-[11px] text-slate-500 italic">Catatan: {lic.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CONTACT SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-600" />
                      Pengaturan Kontak Penjual / Developer
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nomor WhatsApp ini akan dibuka ketika calon pembeli di Play Store mengklik tombol
                      "Beli Akses PRO via WhatsApp".
                    </p>
                  </div>

                  <form onSubmit={handleSaveContact} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nomor WhatsApp Penjual (Owner) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ownerContact.phone}
                        onChange={(e) => setOwnerContact({ ...ownerContact, phone: e.target.value })}
                        placeholder="Contoh: 081234567890 atau 6281234567890"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm font-bold text-slate-800 outline-hidden"
                        required
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Format nomor HP Indonesia dimulai dengan 08... atau 628...
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nama Penjual / Tim Support
                      </label>
                      <input
                        type="text"
                        value={ownerContact.name}
                        onChange={(e) => setOwnerContact({ ...ownerContact, name: e.target.value })}
                        placeholder="Developer Warungku"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl text-sm text-slate-800 outline-hidden"
                      />
                    </div>

                    {saveContactSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Kontak penjual berhasil diperbarui!</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
                    >
                      Simpan Kontak Penjual
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: TEST & SIMULATION MODE */}
              {activeTab === 'test' && (
                <div className="space-y-5">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="font-black text-slate-800 text-base">
                      Mode Pengujian (Test Switcher)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gunakan fitur ini untuk memeriksa bagaimana tampilan aplikasi ketika digunakan oleh pengguna
                      gratis maupun pengguna berbayar sebelum mengupload APK ke Google Play Store.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Test as Free */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-slate-400" />
                          <h4 className="font-bold text-slate-800 text-sm">Uji Sebagai Pengguna Gratis</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Beralih ke mode Paket Gratis untuk memeriksa batasan 30 produk, 50 transaksi, dan
                          tombol ajakan upgrade.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetToFree}
                        className="mt-4 w-full py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                      >
                        Beralih ke Paket Gratis
                      </button>
                    </div>

                    {/* Test as PRO / Direct Unlock */}
                    <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
                          <h4 className="font-bold text-slate-900 text-sm">Aktifkan PRO Langsung (Bypass)</h4>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                          Buka langsung Full Akses Lifetime di perangkat ini tanpa perlu mengetik kode lisensi secara manual.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleDirectUnlock}
                        className="mt-4 w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                      >
                        👑 Buka Full Akses PRO Sekarang
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                    <p className="font-bold text-blue-950">💡 Tips untuk Upload ke Google Play Store:</p>
                    <p>
                      Aplikasi siap dimasukkan ke Play Store sebagai aplikasi gratis. Calon pembeli yang ingin
                      menambah produk lebih dari 30 atau sinkron multi-HP akan menghubungi Anda via WhatsApp untuk
                      membeli kode lisensi, dan Anda dapat menerbitkan kodenya langsung dari portal ini!
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>Warungku License Generator System v2.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup Portal
          </button>
        </div>
      </div>
    </div>
  );
};
