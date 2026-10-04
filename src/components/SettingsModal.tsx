import React, { useState } from 'react';
import { StoreProfile } from '../types';
import { storage } from '../utils/storage';
import { X, Store, Download, Upload, RotateCcw, Check, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeProfile: StoreProfile;
  onUpdateProfile: (profile: StoreProfile) => void;
  onDataResetOrRestored: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  storeProfile,
  onUpdateProfile,
  onDataResetOrRestored,
}) => {
  const [form, setForm] = useState<StoreProfile>({ ...storeProfile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleExport = () => {
    storage.exportBackup();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = storage.importBackup(content);
      if (ok) {
        setImportStatus('Data berhasil dipulihkan!');
        onDataResetOrRestored();
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Gagal memulihkan: Format file tidak sesuai.');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengatur ulang data ke bawaan awal? Semua transaksi & stok saat ini akan dikembalikan ke data awal.'
    );
    if (confirmed) {
      storage.resetToDefault();
      onDataResetOrRestored();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Pengaturan Toko & Data</h3>
              <p className="text-[11px] text-slate-500">Sesuaikan profil warung dan cadangan data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Profil toko berhasil diperbarui!</span>
            </div>
          )}

          {/* Warung Profile Fields */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1.5">
              Identitas Warung
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Warung Kelontong:</label>
              <input
                type="text"
                required
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pemilik:</label>
                <input
                  type="text"
                  required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP:</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Warung:</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan Kaki Struk (Footer):</label>
              <textarea
                rows={2}
                value={form.receiptFooter}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Cadangan & Pemulihan Data</h4>
            <p className="text-slate-500 leading-relaxed">
              Semua data inventaris stok, kasir, dan catatan kasbon tersimpan secara aman di peramban perangkat Anda.
              Unduh cadangan berkala agar data Anda dapat dipindahkan ke HP lain sewaktu-waktu.
            </p>

            {importStatus && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg font-medium">
                {importStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh Cadangan (JSON)</span>
              </button>

              <label className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Pulihkan dari File</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </label>
            </div>
          </div>

          {/* Factory Reset */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke Contoh Data Awal (Reset)</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Simpan Profil Toko
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
