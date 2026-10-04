import React, { useState, useEffect } from 'react';
import {
  AppSettings,
  StoreProfile,
  AppUser,
  UserActivityLog,
  UserRole,
  NotificationSettings,
  AppearanceSettings,
  SecuritySettings,
  IntegrationSettings,
  TaxSettings,
} from '../types';
import { storage } from '../utils/storage';
import { indexedDBBackup, BackupSnapshot } from '../utils/indexedDBBackup';
import { formatRupiah, formatDate } from '../utils/format';
import {
  Store,
  Users,
  Bell,
  Database,
  Palette,
  ShieldCheck,
  Cpu,
  Receipt,
  Info,
  Save,
  Check,
  X,
  Upload,
  Download,
  RotateCcw,
  Smartphone,
  Printer,
  QrCode,
  MessageSquare,
  Lock,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileText,
  Clock,
  Eye,
  EyeOff,
  AlertTriangle,
  Fingerprint,
  RefreshCw,
  ExternalLink,
  LifeBuoy,
  FileCheck2,
  Sliders,
  HardDrive,
  Shield,
  History,
  CheckCircle2,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  users: AppUser[];
  activityLogs: UserActivityLog[];
  onSaveSettings: (settings: AppSettings) => void;
  onSaveUsers: (users: AppUser[]) => void;
  onDataResetOrRestored: () => void;
  onClose?: () => void;
  onOpenFirebaseSync?: () => void;
}

type SettingsSection =
  | 'toko'
  | 'pengguna'
  | 'notifikasi'
  | 'backup'
  | 'tampilan'
  | 'keamanan'
  | 'integrasi'
  | 'pajak'
  | 'sistem'
  | 'tentang';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  users,
  activityLogs,
  onSaveSettings,
  onSaveUsers,
  onDataResetOrRestored,
  onClose,
  onOpenFirebaseSync,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('toko');
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(settings);
  const [currentUsers, setCurrentUsers] = useState<AppUser[]>(users);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // User management modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'kasir' as UserRole,
    pin: '',
    avatar: '',
    email: '',
    phone: '',
    canPOS: true,
    canInventory: false,
    canReports: false,
    canDebts: true,
    canSettings: false,
    canVoid: false,
  });

  // Keep currentUsers synced with users prop
  useEffect(() => {
    setCurrentUsers(users);
  }, [users]);

  // Security test pin visibility
  const [showPin, setShowPin] = useState(false);

  // Backup & Import states
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [snapshotToRestore, setSnapshotToRestore] = useState<BackupSnapshot | null>(null);
  const [isPersisted, setIsPersisted] = useState(false);

  // Load IndexedDB snapshots when activeSection is 'backup'
  useEffect(() => {
    if (activeSection === 'backup') {
      loadSnapshots();
    }
  }, [activeSection]);

  const loadSnapshots = async () => {
    setLoadingSnapshots(true);
    try {
      const list = await indexedDBBackup.getAllSnapshots();
      setSnapshots(list);
      const persisted = await indexedDBBackup.isStoragePersisted();
      setIsPersisted(persisted);
    } catch (e) {
      console.warn('Failed loading snapshots:', e);
    }
    setLoadingSnapshots(false);
  };

  const handleCreateSnapshot = async () => {
    const s = await indexedDBBackup.createSnapshot('manual', 'Cadangan Manual Pemilik');
    if (s) {
      triggerSavedToast('Snapshot cadangan baru berhasil disimpan di IndexedDB!');
      loadSnapshots();
    }
  };

  const handleRestoreSnapshot = async (s: BackupSnapshot) => {
    const ok = await indexedDBBackup.restoreSnapshot(s.id);
    if (ok) {
      onDataResetOrRestored();
      setSnapshotToRestore(null);
      triggerSavedToast(`Data berhasil dipulihkan dari cadangan ${s.label}!`);
      loadSnapshots();
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    await indexedDBBackup.deleteSnapshot(id);
    triggerSavedToast('Snapshot cadangan dihapus.');
    loadSnapshots();
  };

  const handleRequestStoragePersist = async () => {
    const res = await indexedDBBackup.requestPersistentStorage();
    setIsPersisted(res);
    triggerSavedToast(res ? 'Storage persisten berhasil diaktifkan!' : 'Penyimpanan telah diperiksa oleh browser.');
  };

  // Show save feedback
  const triggerSavedToast = (msg = 'Pengaturan berhasil disimpan!') => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(null), 2500);
  };

  // Save full settings
  const handleSaveAll = () => {
    onSaveSettings(currentSettings);
    storage.saveSettings(currentSettings);
    storage.logActivity('Ubah Pengaturan Toko', currentSettings.storeProfile.ownerName, 'pemilik');
    triggerSavedToast();
  };

  // Section list metadata
  const sections: { id: SettingsSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'toko', label: 'Toko', icon: <Store className="w-4 h-4" /> },
    { id: 'pengguna', label: 'Pengguna & Kasir', icon: <Users className="w-4 h-4" />, badge: `${currentUsers.length}` },
    { id: 'notifikasi', label: 'Notifikasi', icon: <Bell className="w-4 h-4" /> },
    { id: 'backup', label: 'Backup & Data', icon: <Database className="w-4 h-4" /> },
    { id: 'tampilan', label: 'Tampilan', icon: <Palette className="w-4 h-4" /> },
    { id: 'keamanan', label: 'Keamanan', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'integrasi', label: 'Integrasi', icon: <Cpu className="w-4 h-4" /> },
    { id: 'pajak', label: 'Pajak & Biaya', icon: <Receipt className="w-4 h-4" /> },
    { id: 'sistem', label: 'Sistem', icon: <Sliders className="w-4 h-4" /> },
    { id: 'tentang', label: 'Tentang', icon: <Info className="w-4 h-4" /> },
  ];

  // User form handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      username: '',
      password: '',
      role: 'kasir',
      pin: '',
      avatar: '',
      email: '',
      phone: '',
      canPOS: true,
      canInventory: false,
      canReports: false,
      canDebts: true,
      canSettings: false,
      canVoid: false,
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      username: user.username || user.name.toLowerCase().replace(/\s+/g, ''),
      password: user.password || user.pin || '',
      role: user.role,
      pin: user.pin,
      avatar: user.avatar || '',
      email: user.email || '',
      phone: user.phone || '',
      canPOS: user.permissions.canPOS,
      canInventory: user.permissions.canInventory,
      canReports: user.permissions.canReports,
      canDebts: user.permissions.canDebts,
      canSettings: user.permissions.canSettings,
      canVoid: user.permissions.canVoid,
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.pin.trim()) {
      alert('Nama dan PIN wajib diisi.');
      return;
    }

    const finalUsername =
      userFormData.username.trim() ||
      userFormData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const finalPassword = userFormData.password.trim() || userFormData.pin.trim();

    let updatedList: AppUser[];
    if (editingUser) {
      updatedList = currentUsers.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: userFormData.name.trim(),
              username: finalUsername,
              password: finalPassword,
              role: userFormData.role,
              pin: userFormData.pin.trim(),
              avatar: userFormData.avatar.trim() || undefined,
              email: userFormData.email.trim() || undefined,
              phone: userFormData.phone.trim() || undefined,
              permissions: {
                canPOS: userFormData.canPOS,
                canInventory: userFormData.canInventory,
                canReports: userFormData.canReports,
                canDebts: userFormData.canDebts,
                canSettings: userFormData.canSettings,
                canVoid: userFormData.canVoid,
              },
            }
          : u
      );
    } else {
      const newUser: AppUser = {
        id: `user-${Date.now()}`,
        name: userFormData.name.trim(),
        username: finalUsername,
        password: finalPassword,
        role: userFormData.role,
        pin: userFormData.pin.trim(),
        avatar: userFormData.avatar.trim() || undefined,
        email: userFormData.email.trim() || undefined,
        phone: userFormData.phone.trim() || undefined,
        permissions: {
          canPOS: userFormData.canPOS,
          canInventory: userFormData.canInventory,
          canReports: userFormData.canReports,
          canDebts: userFormData.canDebts,
          canSettings: userFormData.canSettings,
          canVoid: userFormData.canVoid,
        },
        createdAt: new Date().toISOString(),
      };
      updatedList = [...currentUsers, newUser];
    }

    setCurrentUsers(updatedList);
    onSaveUsers(updatedList);
    storage.saveUsers(updatedList);
    setIsUserModalOpen(false);
    triggerSavedToast('Data pengguna & kasir berhasil disimpan!');
  };

  const executeDeleteUser = (userId: string) => {
    if (currentUsers.length <= 1) {
      triggerSavedToast('Minimal harus ada 1 pengguna aktif pada sistem.');
      setDeletingUser(null);
      return;
    }
    const userObj = currentUsers.find((u) => u.id === userId);
    const filtered = currentUsers.filter((u) => u.id !== userId);
    setCurrentUsers(filtered);
    onSaveUsers(filtered);
    storage.saveUsers(filtered);
    storage.logActivity('Hapus Pengguna', userObj?.name || 'Kasir', userObj?.role || 'kasir', `Akun ID ${userId} dihapus`);
    setDeletingUser(null);
    setIsUserModalOpen(false);
    triggerSavedToast(`Akun ${userObj?.name || 'pengguna'} berhasil dihapus!`);
  };

  // Restore handler
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
        setTimeout(() => setImportStatus(null), 3500);
      } else {
        setImportStatus('Gagal memulihkan: Format file tidak sesuai.');
        setTimeout(() => setImportStatus(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  const handleResetFactory = () => {
    const text = prompt('Ketik "RESET" dengan huruf besar untuk mengonfirmasi reset data ke pengaturan awal:');
    if (text === 'RESET') {
      storage.resetToDefault();
      onDataResetOrRestored();
      alert('Aplikasi telah diatur ulang ke data standar bawaan.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {savedBanner && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[640px]">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Pengaturan</h2>
              <p className="text-[11px] text-slate-500">Konfigurasi lengkap toko & sistem</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-2 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1 no-scrollbar">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeSection === sec.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {sec.icon}
                  <span>{sec.label}</span>
                </div>
                {sec.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                      activeSection === sec.id
                        ? 'bg-emerald-700 text-emerald-100'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {sec.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Save All Button in Sidebar */}
          <div className="p-3 mt-auto border-t border-slate-200 hidden md:block">
            <button
              onClick={handleSaveAll}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Semua Pengaturan</span>
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Top Bar inside content */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-lg capitalize">
                {sections.find((s) => s.id === activeSection)?.label}
              </h3>
              <p className="text-xs text-slate-500">
                Kelola konfigurasi dan parameter {activeSection} WarungPro
              </p>
            </div>
            <button
              onClick={handleSaveAll}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>

          {/* 1. TOKO */}
          {activeSection === 'toko' && (
            <div className="space-y-6 max-w-2xl text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Profil & Identitas Warung</span>
                </h4>

                {/* Logo Toko */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-semibold text-slate-800 text-xs">
                    Logo Toko / Brand Warung:
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {currentSettings.storeProfile.logoUrl ? (
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-emerald-500/40 shadow-sm shrink-0 bg-slate-50 flex items-center justify-center">
                        <img
                          src={currentSettings.storeProfile.logoUrl}
                          alt="Logo Toko"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-300 text-emerald-700 flex flex-col items-center justify-center font-bold text-[10px] shrink-0">
                        <Store className="w-6 h-6 mb-0.5 text-emerald-600" />
                        <span>Tanpa Logo</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors text-xs flex items-center gap-1.5 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih Gambar Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const base64 = ev.target?.result as string;
                                  setCurrentSettings({
                                    ...currentSettings,
                                    storeProfile: {
                                      ...currentSettings.storeProfile,
                                      logoUrl: base64,
                                    },
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {currentSettings.storeProfile.logoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentSettings({
                                ...currentSettings,
                                storeProfile: {
                                  ...currentSettings.storeProfile,
                                  logoUrl: '',
                                },
                              })
                            }
                            className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold cursor-pointer transition-colors text-xs"
                          >
                            Hapus Logo
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Logo ini akan ditampilkan di navbar atas, layar login kasir, dan bagian kepala struk belanja belanja. Format: PNG, JPG, atau WebP.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Toko / Warung:</label>
                    <input
                      type="text"
                      value={currentSettings.storeProfile.storeName}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          storeProfile: { ...currentSettings.storeProfile, storeName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Pemilik Warung:</label>
                    <input
                      type="text"
                      value={currentSettings.storeProfile.ownerName}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          storeProfile: { ...currentSettings.storeProfile, ownerName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor HP / WhatsApp Toko:</label>
                    <input
                      type="text"
                      value={currentSettings.storeProfile.phone}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          storeProfile: { ...currentSettings.storeProfile, phone: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Toko:</label>
                    <input
                      type="email"
                      value={currentSettings.storeProfile.email || ''}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          storeProfile: { ...currentSettings.storeProfile, email: e.target.value },
                        })
                      }
                      placeholder="contoh: warung@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Buka & Tutup Toko:</label>
                  <input
                    type="text"
                    value={currentSettings.storeProfile.openHours || '06:00 - 22:00 WIB'}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        storeProfile: { ...currentSettings.storeProfile, openHours: e.target.value },
                      })
                    }
                    placeholder="06:00 - 22:00 WIB"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Toko Lengkap:</label>
                  <textarea
                    rows={2}
                    value={currentSettings.storeProfile.address}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        storeProfile: { ...currentSettings.storeProfile, address: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat Toko:</label>
                  <input
                    type="text"
                    value={currentSettings.storeProfile.description || ''}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        storeProfile: { ...currentSettings.storeProfile, description: e.target.value },
                      })
                    }
                    placeholder="Melayani grosir & eceran sembako murah"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Kaki Struk Belanja (Footer):</label>
                  <textarea
                    rows={2}
                    value={currentSettings.storeProfile.receiptFooter}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        storeProfile: { ...currentSettings.storeProfile, receiptFooter: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Teks ini akan tercetak otomatis di bagian paling bawah struk kasir & pesan WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PENGGUNA & KASIR */}
          {activeSection === 'pengguna' && (
            <div className="space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Daftar Pengguna, Kasir, & Hak Akses</h4>
                  <p className="text-slate-500">Kelola akun kasir, admin gudang, dan PIN login</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Pengguna / Kasir</span>
                </button>
              </div>

              {/* Users Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-500 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-sm shrink-0">
                              {u.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 text-sm leading-tight truncate">{u.name}</h5>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mt-1 ${
                                u.role === 'pemilik'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-500 font-mono block">
                            User: <strong>{u.username}</strong>
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">PIN: ••••</span>
                        </div>
                      </div>

                      {/* Permissions overview */}
                      <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Check className={`w-3.5 h-3.5 ${u.permissions.canPOS ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Kasir POS Belanja</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className={`w-3.5 h-3.5 ${u.permissions.canInventory ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Kelola Inventaris & Stok</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className={`w-3.5 h-3.5 ${u.permissions.canReports ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Lihat Laporan Keuangan</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(u)}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer text-xs"
                      >
                        Edit Akun & Akses
                      </button>
                      {currentUsers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDeletingUser(u)}
                          className="flex items-center gap-1 py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title={`Hapus akun ${u.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Logs Table */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Riwayat Aktivitas Pengguna (Audit Log)</h4>
                  <span className="text-[11px] text-slate-400">Terakhir dicatat</span>
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-[11px] text-slate-700">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-2.5">Waktu</th>
                        <th className="p-2.5">Pengguna</th>
                        <th className="p-2.5">Aktivitas</th>
                        <th className="p-2.5">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activityLogs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="hover:bg-white/80">
                          <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {log.userName} <span className="font-normal text-slate-400">({log.userRole})</span>
                          </td>
                          <td className="p-2.5 font-semibold text-emerald-800">{log.action}</td>
                          <td className="p-2.5 text-slate-600">{log.details || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. NOTIFIKASI */}
          {activeSection === 'notifikasi' && (
            <div className="space-y-4 max-w-2xl text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>Pengingat & Peringatan Otomatis</span>
                </h4>

                <div className="divide-y divide-slate-200 space-y-3">
                  {/* Stok menipis */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Peringatan Stok Menipis</p>
                      <p className="text-[11px] text-slate-500">Tampilkan tanda peringatan jika stok barang di bawah batas</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.notifications.lowStockAlert}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          notifications: { ...currentSettings.notifications, lowStockAlert: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Threshold */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Batas Standar Stok Menipis</p>
                      <p className="text-[11px] text-slate-500">Jumlah sisa barang minimum untuk memicu peringatan</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={currentSettings.notifications.lowStockThreshold}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          notifications: {
                            ...currentSettings.notifications,
                            lowStockThreshold: parseInt(e.target.value, 10) || 5,
                          },
                        })
                      }
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold"
                    />
                  </div>

                  {/* Barang kedaluwarsa */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Peringatan Barang Kedaluwarsa</p>
                      <p className="text-[11px] text-slate-500">Ingatkan produk makanan/minuman yang mendekati batas waktu</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.notifications.expiredItemAlert}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          notifications: { ...currentSettings.notifications, expiredItemAlert: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Hutang jatuh tempo */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Pengingat Hutang (Kasbon) Jatuh Tempo</p>
                      <p className="text-[11px] text-slate-500">Tampilkan daftar bon pelanggan yang sudah melewati tanggal jatuh tempo</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.notifications.debtDueReminder}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          notifications: { ...currentSettings.notifications, debtDueReminder: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Backup reminder */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Pengingat Cadangkan Data (Backup)</p>
                      <p className="text-[11px] text-slate-500">Ingatkan setiap minggu agar data warung selalu di-backup aman</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.notifications.backupReminder}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          notifications: { ...currentSettings.notifications, backupReminder: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Laporan harian */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Ringkasan Laporan Penjualan Harian</p>
                      <p className="text-[11px] text-slate-500">Munculkan rekapan omzet saat tutup kasir di akhir hari</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.notifications.dailySummaryAlert}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          notifications: { ...currentSettings.notifications, dailySummaryAlert: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. BACKUP & DATA (RESILIENT AUTO-BACKUP ENGINE) */}
          {activeSection === 'backup' && (
            <div className="space-y-6 max-w-2xl text-xs">
              {importStatus && (
                <div
                  className={`p-3 rounded-xl font-bold flex items-center gap-2 ${
                    importStatus.includes('berhasil')
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              {/* MULTI-HP FIREBASE CLOUD REAL-TIME CARD */}
              <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-4 sm:p-5 rounded-2xl border border-blue-800 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-lg shadow-inner border border-white/25">
                      <Smartphone className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">Sinkronisasi Multi-HP Real-time</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-blue-950 font-black text-[9px] uppercase">
                          Firebase Cloud
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-100 mt-0.5">
                        Hubungkan beberapa HP kasir sekaligus ke data toko yang sama. Stok & penjualan otomatis terupdate serentak.
                      </p>
                    </div>
                  </div>

                  {onOpenFirebaseSync && (
                    <button
                      type="button"
                      onClick={onOpenFirebaseSync}
                      className="py-2 px-4 bg-white hover:bg-blue-50 text-blue-900 rounded-xl font-bold text-xs cursor-pointer transition shadow-xs whitespace-nowrap self-start sm:self-auto"
                    >
                      Buka Pengaturan Multi-HP
                    </button>
                  )}
                </div>
              </div>

              {/* A. RESILIENT INDEXEDDB BROWSER AUTO-BACKUP CARD */}
              <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">Backup Otomatis Browser</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black text-[9px] uppercase">
                          Aktif (Anti Hapus Cache)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Tersimpan di IndexedDB terproteksi agar transaksi & stok tidak hilang saat cache dibersihkan.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleCreateSnapshot}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Snapshot Baru</span>
                    </button>
                  </div>
                </div>

                {/* Storage Persistence Status */}
                <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-700">
                    <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Proteksi Penyimpanan Permanen:{' '}
                      <strong className={isPersisted ? 'text-emerald-700' : 'text-amber-700'}>
                        {isPersisted ? 'Aktif (Diberikan Izin Browser)' : 'Standar Browser (Siap Diaktifkan)'}
                      </strong>
                    </span>
                  </div>
                  {!isPersisted && (
                    <button
                      type="button"
                      onClick={handleRequestStoragePersist}
                      className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                    >
                      Kunci Proteksi Permanen
                    </button>
                  )}
                </div>

                {/* Snapshots List in IndexedDB */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Riwayat Snapshot Otomatis di Browser ({snapshots.length}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={loadSnapshots}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Perbarui</span>
                    </button>
                  </div>

                  {loadingSnapshots ? (
                    <div className="py-6 text-center text-slate-400">Memuat snapshot cadangan...</div>
                  ) : snapshots.length === 0 ? (
                    <div className="p-4 bg-white/80 rounded-xl border border-slate-200 text-center text-slate-500">
                      Belum ada snapshot cadangan. Sistem akan otomatis membuatnya saat transaksi pertama dicatat.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {snapshots.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-emerald-400 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate">{s.label}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  s.source === 'auto_transaction'
                                    ? 'bg-blue-100 text-blue-800'
                                    : s.source === 'auto_timer'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {s.source === 'auto_transaction'
                                  ? 'Auto Transaksi'
                                  : s.source === 'auto_timer'
                                  ? 'Auto Berkala'
                                  : 'Manual'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {s.meta.transactionCount} Transaksi • {s.meta.productCount} Produk ({s.meta.totalStockUnits} Unit) • {s.meta.debtCount} Kasbon
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setSnapshotToRestore(s)}
                              className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                              title="Pulihkan data dari snapshot ini"
                            >
                              Pulihkan
                            </button>
                            <button
                              type="button"
                              onClick={() => indexedDBBackup.downloadBackupFile(s)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                              title="Unduh snapshot ini ke file .JSON"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSnapshot(s.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                              title="Hapus snapshot ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* B. FILE LOKAL CADANGAN (.JSON & EXCEL) */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Cadangkan ke File Lokal Komputer / HP (.JSON)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Backup JSON */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900">Unduh File Cadangan Toko</p>
                    <p className="text-[11px] text-slate-500">
                      Simpan file .JSON ke folder Download laptop atau HP Anda untuk disimpan di Flashdisk atau Google Drive.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        indexedDBBackup.downloadBackupFile();
                        triggerSavedToast('File backup telah berhasil diunduh ke perangkat Anda.');
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh File Cadangan (.JSON)</span>
                    </button>
                  </div>

                  {/* Restore JSON */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900">Pulihkan dari File (.JSON)</p>
                    <p className="text-[11px] text-slate-500">
                      Unggah file cadangan .JSON untuk mengembalikan data saat ganti HP, laptop baru, atau reset sistem.
                    </p>
                    <label className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih File Cadangan</span>
                      <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Export CSV / Excel */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900">Export Katalog ke Excel (CSV)</p>
                    <p className="text-[11px] text-slate-500">
                      Buka daftar stok, barcode, dan harga barang di Microsoft Excel atau Google Sheets.
                    </p>
                    <button
                      type="button"
                      onClick={() => storage.exportProductsCSV()}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Export File Excel (.CSV)</span>
                    </button>
                  </div>

                  {/* Google Drive Status */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900">Cadangan Cloud / Google Drive</p>
                    <p className="text-[11px] text-slate-500">
                      File cadangan dapat diunggah ke Google Drive Anda agar dapat diakses kapan saja dari mana saja.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        indexedDBBackup.downloadBackupFile();
                        alert('File backup berhasil diunduh ke folder Download. Anda dapat langsung mengunggah file ini ke Google Drive Anda.');
                      }}
                      className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>Unduh & Salin ke Drive</span>
                    </button>
                  </div>
                </div>

                {/* Reset / Factory Data */}
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Zona Bahaya: Hapus Data / Reset Pabrik</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Tindakan ini akan menghapus riwayat transaksi, buku kasbon, dan mengembalikan katalog barang ke data bawaan awal. Pastikan Anda telah mengunduh file cadangan sebelum melakukan reset.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFactory}
                    className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Reset Data ke Bawaan Awal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. TAMPILAN */}
          {activeSection === 'tampilan' && (
            <div className="space-y-6 max-w-2xl text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>Kustomisasi Tampilan & Antarmuka</span>
                </h4>

                {/* Mode Terang / Gelap */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Mode Tampilan:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', label: '☀️ Mode Terang' },
                      { id: 'dark', label: '🌙 Mode Gelap' },
                      { id: 'system', label: '⚙️ Sesuai Sistem' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setCurrentSettings({
                            ...currentSettings,
                            appearance: { ...currentSettings.appearance, themeMode: t.id as any },
                          })
                        }
                        className={`py-2 px-3 rounded-xl font-bold border text-center cursor-pointer transition-colors ${
                          currentSettings.appearance.themeMode === t.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warna Aplikasi */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Warna Aksen Aplikasi:</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'emerald', label: 'Zamrud', color: 'bg-emerald-600' },
                      { id: 'blue', label: 'Bahari', color: 'bg-blue-600' },
                      { id: 'purple', label: 'Ungu', color: 'bg-purple-600' },
                      { id: 'amber', label: 'Jingga', color: 'bg-amber-600' },
                      { id: 'rose', label: 'Mawar', color: 'bg-rose-600' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setCurrentSettings({
                            ...currentSettings,
                            appearance: { ...currentSettings.appearance, themeColor: c.id as any },
                          })
                        }
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-center cursor-pointer transition-colors ${
                          currentSettings.appearance.themeColor === c.id
                            ? 'border-slate-900 bg-white shadow-xs font-bold'
                            : 'border-slate-200 bg-white hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${c.color}`} />
                        <span className="text-[10px] text-slate-700">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ukuran Tulisan */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Ukuran Tulisan (Font Size):</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'small', label: 'Kecil (Kompak)' },
                      { id: 'medium', label: 'Standar (Rekomendasi)' },
                      { id: 'large', label: 'Besar (Mudah Dibaca)' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() =>
                          setCurrentSettings({
                            ...currentSettings,
                            appearance: { ...currentSettings.appearance, fontSize: f.id as any },
                          })
                        }
                        className={`py-2 px-3 rounded-xl font-bold border text-center cursor-pointer transition-colors ${
                          currentSettings.appearance.fontSize === f.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tampilan Kasir POS */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Tampilan Katalog Kasir:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'grid', label: '🖼️ Kartu Grid Visual (Dengan Foto)' },
                      { id: 'compact', label: '📋 Daftar Ringkas (Tabel Cepat)' },
                    ].map((lay) => (
                      <button
                        key={lay.id}
                        type="button"
                        onClick={() =>
                          setCurrentSettings({
                            ...currentSettings,
                            appearance: { ...currentSettings.appearance, posLayout: lay.id as any },
                          })
                        }
                        className={`py-2 px-3 rounded-xl font-bold border text-center cursor-pointer transition-colors ${
                          currentSettings.appearance.posLayout === lay.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lay.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bahasa */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Bahasa Aplikasi:</label>
                  <select
                    value={currentSettings.appearance.language}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        appearance: { ...currentSettings.appearance, language: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900"
                  >
                    <option value="id">Bahasa Indonesia (Utama)</option>
                    <option value="jv">Basa Jawa (Lokal)</option>
                    <option value="en">English (POS International)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 6. KEAMANAN */}
          {activeSection === 'keamanan' && (
            <div className="space-y-4 max-w-2xl text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Kunci Aplikasi, PIN & Keamanan Kasir</span>
                </h4>

                <div className="divide-y divide-slate-200 space-y-3">
                  {/* PIN Aplikasi */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Kunci Aplikasi dengan PIN</p>
                      <p className="text-[11px] text-slate-500">Minta PIN saat pertama kali membuka aplikasi di HP</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.security.appPinEnabled}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          security: { ...currentSettings.security, appPinEnabled: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {currentSettings.security.appPinEnabled && (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Kode PIN Master Toko:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type={showPin ? 'text' : 'password'}
                          maxLength={6}
                          value={currentSettings.security.appPin}
                          onChange={(e) =>
                            setCurrentSettings({
                              ...currentSettings,
                              security: { ...currentSettings.security, appPin: e.target.value },
                            })
                          }
                          className="w-24 px-3 py-1 bg-white border border-slate-200 rounded-lg text-center font-mono font-black tracking-widest text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sidik Jari */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Buka dengan Sidik Jari / Biometrik</p>
                      <p className="text-[11px] text-slate-500">Mendukung sensor sidik jari perangkat Android / FaceID</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.security.biometricEnabled}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          security: { ...currentSettings.security, biometricEnabled: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Auto Lock */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Kunci Otomatis (Auto-Lock)</p>
                      <p className="text-[11px] text-slate-500">Otomatis kunci layar jika tidak ada transaksi</p>
                    </div>
                    <select
                      value={currentSettings.security.autoLockMinutes}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          security: {
                            ...currentSettings.security,
                            autoLockMinutes: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value={0}>Tidak Pernah</option>
                      <option value={5}>Setelah 5 Menit</option>
                      <option value={15}>Setelah 15 Menit</option>
                      <option value={30}>Setelah 30 Menit</option>
                    </select>
                  </div>

                  {/* Konfirmasi Transaksi */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Konfirmasi Sebelum Selesai Transaksi</p>
                      <p className="text-[11px] text-slate-500">Mencegah salah klik nominal uang yang diterima pelanggan</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.security.requireTxConfirm}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          security: { ...currentSettings.security, requireTxConfirm: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Minta PIN untuk Void/Hapus */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Wajib PIN Pemilik untuk Void/Hapus</p>
                      <p className="text-[11px] text-slate-500">Kasir harus memanggil pemilik jika ingin membatalkan transaksi yang sudah dicatat</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.security.requirePinForVoid}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          security: { ...currentSettings.security, requirePinForVoid: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. INTEGRASI */}
          {activeSection === 'integrasi' && (
            <div className="space-y-4 max-w-2xl text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span>Integrasi Perangkat & Layanan Luar</span>
                </h4>

                {/* WhatsApp */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Integrasi Pesan WhatsApp (Struk & Tagihan Bon)</span>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Nomor WhatsApp Pengirim:</label>
                    <input
                      type="text"
                      value={currentSettings.integrations.whatsappGateway}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          integrations: { ...currentSettings.integrations, whatsappGateway: e.target.value },
                        })
                      }
                      placeholder="62812..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Template Tagihan Kasbon:</label>
                    <textarea
                      rows={2}
                      value={currentSettings.integrations.whatsappBillTemplate}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          integrations: { ...currentSettings.integrations, whatsappBillTemplate: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-[11px]"
                    />
                    <span className="text-[10px] text-slate-400">Gunakan tag: &#123;nama&#125;, &#123;toko&#125;, &#123;jumlah&#125;</span>
                  </div>
                </div>

                {/* QRIS */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <QrCode className="w-4 h-4 text-slate-700" />
                    <span>Pengaturan QRIS Merchant</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Nama Merchant QRIS:</label>
                      <input
                        type="text"
                        value={currentSettings.integrations.qrisMerchantName}
                        onChange={(e) =>
                          setCurrentSettings({
                            ...currentSettings,
                            integrations: { ...currentSettings.integrations, qrisMerchantName: e.target.value },
                          })
                        }
                        placeholder="WARUNG BERKAH JAYA"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">NMID / ID Merchant QRIS:</label>
                      <input
                        type="text"
                        value={currentSettings.integrations.qrisNmid}
                        onChange={(e) =>
                          setCurrentSettings({
                            ...currentSettings,
                            integrations: { ...currentSettings.integrations, qrisNmid: e.target.value },
                          })
                        }
                        placeholder="ID102003..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Printer Thermal Bluetooth */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Printer className="w-4 h-4 text-slate-700" />
                    <span>Printer Kasir (Thermal Bluetooth)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Lebar Kertas Thermal:</label>
                      <select
                        value={currentSettings.integrations.printerType}
                        onChange={(e) =>
                          setCurrentSettings({
                            ...currentSettings,
                            integrations: { ...currentSettings.integrations, printerType: e.target.value as any },
                          })
                        }
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="bluetooth_58">Thermal 58mm (Standar Portabel)</option>
                        <option value="bluetooth_80">Thermal 80mm (Lebar Desktop)</option>
                        <option value="browser">Jendela Cetak Browser (PDF/System)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <p className="font-bold text-slate-900">Cetak Otomatis</p>
                        <p className="text-[10px] text-slate-400">Setelah pembayaran tunai berhasil</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={currentSettings.integrations.autoPrintReceipt}
                        onChange={(e) =>
                          setCurrentSettings({
                            ...currentSettings,
                            integrations: { ...currentSettings.integrations, autoPrintReceipt: e.target.checked },
                          })
                        }
                        className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. PAJAK */}
          {activeSection === 'pajak' && (
            <div className="space-y-4 max-w-2xl text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Pajak Pertambahan Nilai (PPN)</span>
                </h4>

                <div className="divide-y divide-slate-200 space-y-3">
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="font-bold text-slate-900">Aktifkan Perhitungan Pajak Toko</p>
                      <p className="text-[11px] text-slate-500">Sertakan komponen pajak pada transaksi dan struk belanja</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.tax.taxEnabled}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          tax: { ...currentSettings.tax, taxEnabled: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {currentSettings.tax.taxEnabled && (
                    <>
                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <p className="font-bold text-slate-900">Persentase Pajak (%):</p>
                          <p className="text-[11px] text-slate-500">Standar PPN di Indonesia adalah 11%</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={currentSettings.tax.taxPercentage}
                            onChange={(e) =>
                              setCurrentSettings({
                                ...currentSettings,
                                tax: {
                                  ...currentSettings.tax,
                                  taxPercentage: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold"
                          />
                          <span className="font-bold text-slate-700">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <div>
                          <p className="font-bold text-slate-900">Harga Jual Sudah Termasuk Pajak</p>
                          <p className="text-[11px] text-slate-500">
                            Pajak dihitung secara inklusif di dalam harga barang (tidak menambah total di kasir)
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={currentSettings.tax.taxInclusive}
                          onChange={(e) =>
                            setCurrentSettings({
                              ...currentSettings,
                              tax: { ...currentSettings.tax, taxInclusive: e.target.checked },
                            })
                          }
                          className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                        />
                      </div>

                      <div className="pt-3">
                        <label className="block font-semibold text-slate-700 mb-1">Nomor NPWP Toko (Opsional):</label>
                        <input
                          type="text"
                          value={currentSettings.tax.npwpStore || ''}
                          onChange={(e) =>
                            setCurrentSettings({
                              ...currentSettings,
                              tax: { ...currentSettings.tax, npwpStore: e.target.value },
                            })
                          }
                          placeholder="01.234.567.8-901.000"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 9. SISTEM */}
          {activeSection === 'sistem' && (
            <div className="space-y-4 max-w-2xl text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>Status Sistem, Memori & Perangkat</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Status Sinkronisasi</span>
                    <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Tersinkronisasi Lokal (Real-Time)</span>
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Versi Engine POS</span>
                    <p className="font-bold text-slate-900 font-mono">WarungPro v2.4.0 (PWA)</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Status Offline Mode</span>
                    <p className="font-bold text-emerald-700">Aktif & Siap Bekerja Tanpa Internet</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Penyimpanan Terpakai</span>
                    <p className="font-bold text-slate-900 font-mono">Local Storage (~1.8 MB)</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Kembalikan Pengaturan ke Standar</p>
                    <p className="text-[11px] text-slate-500">Reset hanya pengaturan (data barang & transaksi tetap aman)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Kembalikan semua pengaturan ke bawaan awal? Data produk dan penjualan Anda tidak akan hilang.')) {
                        storage.saveSettings({
                          ...currentSettings,
                          notifications: {
                            lowStockAlert: true,
                            expiredItemAlert: true,
                            debtDueReminder: true,
                            backupReminder: true,
                            promoAlert: false,
                            dailySummaryAlert: true,
                            lowStockThreshold: 5,
                          },
                          appearance: {
                            themeMode: 'light',
                            themeColor: 'emerald',
                            fontSize: 'medium',
                            posLayout: 'grid',
                            language: 'id',
                          },
                          tax: {
                            taxEnabled: false,
                            taxPercentage: 11,
                            taxInclusive: true,
                          },
                        });
                        alert('Pengaturan telah dikembalikan ke standar.');
                      }
                    }}
                    className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold cursor-pointer"
                  >
                    Reset Pengaturan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 10. TENTANG */}
          {activeSection === 'tentang' && (
            <div className="space-y-6 max-w-2xl text-xs">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                    <Store className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">WarungPro Digital</h4>
                    <p className="text-slate-500 text-xs">
                      Aplikasi Kasir (POS) & Manajemen Stok Warung Kelontong Indonesia
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Versi 2.4.0 (PWA Ready)
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed text-xs">
                  WarungPro dirancang khusus untuk mempermudah operasional pedagang warung kelontong sembako di Indonesia. Dilengkapi fitur kasir cepat, pencatatan kasbon pelanggan, pemindai barcode, deteksi kamera AI tanpa barcode, cetak struk thermal, laporan laba rugi, dan dukungan offline penuh.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <LifeBuoy className="w-4 h-4 text-emerald-600" />
                      <span>Bantuan & Panduan</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Tersedia buku panduan penggunaan aplikasi untuk kasir dan pemilik toko.
                    </p>
                    <a
                      href="https://wa.me/6281234567890?text=Halo%20Admin%20WarungPro,%20saya%20butuh%20bantuan%20aplikasi%20kasir."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-emerald-700 font-bold hover:underline pt-1"
                    >
                      Hubungi WhatsApp Support &rarr;
                    </a>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      <span>Kebijakan Privasi</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      100% data keuangan, stok, dan kasbon Anda tersimpan lokal di perangkat Anda.
                    </p>
                    <span className="inline-block text-slate-400 text-[10px]">Privasi terjamin aman</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    &copy; 2026 WarungPro • Solusi Kasir Digital Warung Kelontong
                  </span>
                  <button
                    type="button"
                    onClick={() => alert('Aplikasi Anda sudah menggunakan versi terbaru (v2.4.0).')}
                    className="py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Cek Pembaruan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-slate-900 text-sm">
                {editingUser ? 'Edit Pengguna & Hak Akses' : 'Tambah Pengguna / Kasir Baru'}
              </h4>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              {/* Foto Pengguna / Avatar */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Foto Profil / Avatar Pengguna:</label>
                <div className="flex items-center gap-3">
                  {userFormData.avatar ? (
                    <img
                      src={userFormData.avatar}
                      alt="Avatar"
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                      Foto
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer transition-colors text-xs">
                      <span>Pilih Foto Profil</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setUserFormData({ ...userFormData, avatar: ev.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {userFormData.avatar && (
                      <button
                        type="button"
                        onClick={() => setUserFormData({ ...userFormData, avatar: '' })}
                        className="ml-2 text-rose-600 hover:underline font-bold text-[11px]"
                      >
                        Hapus Foto
                      </button>
                    )}
                    <span className="block text-[10px] text-slate-400">Format foto JPG/PNG (persegi lebih bagus)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Kasir"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: siti / rohman"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password Login:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1234"
                    value={userFormData.password}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        password: e.target.value,
                        pin: e.target.value.length <= 6 && !isNaN(Number(e.target.value)) ? e.target.value : userFormData.pin,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran (Role):</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setUserFormData({
                        ...userFormData,
                        role: r,
                        canInventory: r === 'pemilik' || r === 'admin',
                        canReports: r === 'pemilik' || r === 'admin',
                        canSettings: r === 'pemilik',
                        canVoid: r === 'pemilik' || r === 'admin',
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin Toko</option>
                    <option value="pemilik">Pemilik</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode PIN Login (4-6 Digit):</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="1234"
                    value={userFormData.pin}
                    onChange={(e) => setUserFormData({ ...userFormData, pin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-center tracking-widest font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor HP:</label>
                  <input
                    type="text"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    placeholder="0812..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email:</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="kasir@gmail.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Hak Akses Checkboxes */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="font-bold text-slate-800 block">Hak Akses Modul:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userFormData.canPOS}
                      onChange={(e) => setUserFormData({ ...userFormData, canPOS: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Kasir POS Belanja</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userFormData.canInventory}
                      onChange={(e) => setUserFormData({ ...userFormData, canInventory: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Kelola Stok Barang</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userFormData.canDebts}
                      onChange={(e) => setUserFormData({ ...userFormData, canDebts: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Buku Kasbon</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userFormData.canReports}
                      onChange={(e) => setUserFormData({ ...userFormData, canReports: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Laporan Laba Rugi</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userFormData.canVoid}
                      onChange={(e) => setUserFormData({ ...userFormData, canVoid: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Batal / Void Transaksi</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userFormData.canSettings}
                      onChange={(e) => setUserFormData({ ...userFormData, canSettings: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Buka Pengaturan</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {editingUser && currentUsers.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserModalOpen(false);
                      setDeletingUser(editingUser);
                    }}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition-colors text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Akun</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                  >
                    Simpan Pengguna
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for User Deletion */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Hapus Pengguna / Kasir?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus akun <strong>{deletingUser.name}</strong> ({deletingUser.role})? Akun ini tidak akan dapat login lagi ke sistem kasir.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeDeleteUser(deletingUser.id)}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for Snapshot Restoration */}
      {snapshotToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Pulihkan Data dari Cadangan?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Snapshot: <strong>{snapshotToRestore.label}</strong>
              </p>
              <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-0.5 text-left border border-slate-200 mt-2">
                <div>📦 Produk: <strong>{snapshotToRestore.meta.productCount} item ({snapshotToRestore.meta.totalStockUnits} unit)</strong></div>
                <div>🧾 Transaksi: <strong>{snapshotToRestore.meta.transactionCount} nota</strong></div>
                <div>📋 Kasbon: <strong>{snapshotToRestore.meta.debtCount} data warga</strong></div>
              </div>
              <p className="text-[10px] text-amber-700 mt-2">
                ⚠️ Data yang ada saat ini akan digantikan dengan data yang ada pada cadangan ini.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSnapshotToRestore(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleRestoreSnapshot(snapshotToRestore)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Ya, Pulihkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
