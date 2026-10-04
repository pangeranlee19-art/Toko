import React, { useState, useRef, useEffect } from 'react';
import { StoreProfile, AppUser } from '../types';
import {
  ShoppingCart,
  Bell,
  User,
  Home,
  LayoutGrid,
  BarChart3,
  FileText,
  Menu,
  BookOpen,
  Settings,
  Package,
  X,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Cloud,
  Crown,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { LicenseInfo } from '../types';

export type ActiveTab = 'pos' | 'inventory' | 'transactions' | 'debts' | 'reports' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  cartCount: number;
  lowStockCount: number;
  unpaidDebtCount: number;
  storeProfile: StoreProfile;
  currentUser?: AppUser | null;
  currentLicense?: LicenseInfo;
  onLogout?: () => void;
  onOpenSettings: () => void;
  onOpenCart?: () => void;
  onOpenFirebaseSync?: () => void;
  onOpenUpgradePro?: () => void;
  onOpenOwnerPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  cartCount,
  lowStockCount,
  unpaidDebtCount,
  storeProfile,
  currentUser,
  currentLicense,
  onLogout,
  onOpenSettings,
  onOpenCart,
  onOpenFirebaseSync,
  onOpenUpgradePro,
  onOpenOwnerPortal,
}) => {
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // Reset image error if user avatar changes
  useEffect(() => {
    setImageError(false);
  }, [currentUser?.avatar]);

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    setIsMenuDrawerOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const handleOpenLogoutConfirm = () => {
    setIsProfileDropdownOpen(false);
    setIsMenuDrawerOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleExecuteLogout = () => {
    setIsLogoutModalOpen(false);
    setIsProfileDropdownOpen(false);
    setIsMenuDrawerOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
      {/* Top Header - Royal Blue */}
      <header className="sticky top-0 z-40 bg-[#005AE0] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* Brand: Shopping Cart with star + Warungku + Sembako & Kebutuhan Harian */}
          <button
            onClick={() => handleSelectTab('pos')}
            className="flex items-center gap-2.5 sm:gap-3 text-left cursor-pointer group min-w-0"
          >
            <div className="relative shrink-0">
              {storeProfile.logoUrl ? (
                <img
                  src={storeProfile.logoUrl}
                  alt={storeProfile.storeName}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/30 shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="absolute -top-1 -right-1 text-amber-300 text-xs font-black drop-shadow">
                ★
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-tight truncate">
                {storeProfile.storeName || 'Warungku'}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-blue-100 block leading-tight truncate">
                {storeProfile.description || 'Sembako & Kebutuhan Harian'}
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 font-bold text-xs text-blue-100">
            <button
              onClick={() => handleSelectTab('pos')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'pos' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              Kasir POS
            </button>
            <button
              onClick={() => handleSelectTab('inventory')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'inventory' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              Kategori & Stok
            </button>
            <button
              onClick={() => handleSelectTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'reports' ? 'bg-white/25 text-white' : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Laporan</span>
            </button>
            <button
              onClick={() => handleSelectTab('transactions')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'transactions' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              Riwayat
            </button>
            <button
              onClick={() => handleSelectTab('debts')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'debts' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              Kasbon
            </button>
            <button
              onClick={() => handleSelectTab('settings')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              Pengaturan
            </button>
          </nav>

          {/* Right Header Actions: Upgrade/PRO Badge, Multi-HP Sync, Bell Badge (Left), User Profile Photo Badge (Right) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* PRO / Upgrade Badge */}
            {onOpenUpgradePro && (
              currentLicense?.tier === 'pro' ? (
                <button
                  type="button"
                  onClick={onOpenUpgradePro}
                  title="Akun Warungku PRO Full Akses Aktif"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-xs border border-amber-300"
                >
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                  <span className="text-[11px] font-black">PRO</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenUpgradePro}
                  title="Tingkatkan ke PRO Full Akses"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span className="text-[11px] font-bold hidden xs:inline">Upgrade</span>
                  <span className="text-[11px] font-black text-amber-300">PRO</span>
                </button>
              )
            )}

            {/* Multi-HP Cloud Sync Button */}
            {onOpenFirebaseSync && (
              <button
                type="button"
                onClick={onOpenFirebaseSync}
                title="Sinkronisasi Multi-HP Real-time (Firebase Cloud)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer border border-white/20 shadow-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <Smartphone className="w-3.5 h-3.5 hidden sm:block" />
                <span className="text-[11px] font-bold">Multi-HP</span>
              </button>
            )}

            {/* Notification Bell Badge */}
            <button
              onClick={() => handleSelectTab('debts')}
              title="Notifikasi Kasbon & Jatuh Tempo"
              className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#005AE0]">
                {unpaidDebtCount > 0 ? unpaidDebtCount : 3}
              </span>
            </button>

            {/* Logged in User Badge with PHOTO */}
            {currentUser && (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  title={`Profil Pengguna: ${currentUser.name}`}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/25 text-xs cursor-pointer transition-all"
                >
                  {/* USER PHOTO / AVATAR */}
                  {currentUser.avatar && !imageError ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      onError={() => setImageError(true)}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white/70 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-black text-xs text-white ring-2 ring-white/50 shrink-0">
                      {currentUser.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  {/* Name and Role info */}
                  <div className="hidden sm:block text-left leading-tight">
                    <span className="font-bold text-[11px] block truncate max-w-[110px] text-white">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-blue-200 uppercase font-black tracking-wider block">
                      {currentUser.role}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-blue-200 hidden sm:block transition-transform duration-200 ${
                      isProfileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* USER PROFILE DROPDOWN MENU */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 text-slate-800 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95">
                    {/* Header with Photo & Details */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      {currentUser.avatar && !imageError ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#005AE0] to-blue-400 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                          {currentUser.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate leading-snug">
                          {currentUser.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          @{currentUser.username}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            currentUser.role === 'pemilik'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : currentUser.role === 'admin'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {currentUser.role}
                        </span>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Status Akun:</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Aktif (Sedang Login)</span>
                        </span>
                      </div>
                      {currentUser.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">No. HP:</span>
                          <span className="font-mono text-slate-700">{currentUser.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Menu Actions */}
                    <div className="space-y-1 pt-1">
                      {/* Multi-HP Cloud Sync */}
                      {onOpenFirebaseSync && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            onOpenFirebaseSync();
                          }}
                          className="w-full py-2 px-3 hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Smartphone className="w-4 h-4 text-blue-600" />
                          <span>Sinkronisasi Multi-HP (Cloud)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSelectTab('settings')}
                        className="w-full py-2 px-3 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Pengaturan Toko & Pengguna</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTab('transactions')}
                        className="w-full py-2 px-3 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>Riwayat Penjualan Kasir</span>
                      </button>

                      {/* Prominent Logout Option */}
                      <button
                        type="button"
                        onClick={handleOpenLogoutConfirm}
                        className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 active:scale-[0.99] text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 mt-2 border border-rose-200"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Keluar dari Akun Kasir</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* IN-APP LOGOUT CONFIRMATION MODAL (100% RELIABLE, ZERO BROWSER PROMPTS) */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            {/* User Photo as the Center Icon of Logout Confirmation */}
            <div className="relative w-20 h-20 mx-auto">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-3xl object-cover ring-4 ring-rose-100 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#005AE0] to-blue-500 text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-rose-100">
                  {currentUser?.name ? currentUser.name.slice(0, 1).toUpperCase() : <User className="w-10 h-10" />}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md ring-2 ring-white"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Keluar dari Akun Kasir?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sesi kasir untuk{' '}
                <strong className="text-slate-800">{currentUser?.name || 'Kasir'}</strong> (
                {currentUser?.role || 'kasir'}) akan diakhiri. Anda perlu memasukkan username & password untuk masuk kembali.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteLogout}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-2 sm:px-6 py-1 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {/* 1. Beranda */}
        <button
          onClick={() => handleSelectTab('pos')}
          className={`flex flex-col items-center py-1 px-2 text-[11px] transition-colors cursor-pointer ${
            activeTab === 'pos' ? 'text-[#005AE0] font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
          <span>Beranda</span>
        </button>

        {/* 2. Kategori */}
        <button
          onClick={() => handleSelectTab('inventory')}
          className={`flex flex-col items-center py-1 px-2 text-[11px] transition-colors cursor-pointer ${
            activeTab === 'inventory' ? 'text-[#005AE0] font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
          <span>Kategori</span>
        </button>

        {/* 3. Center Elevated Floating Cart Button */}
        <button
          onClick={onOpenCart}
          title="Buka Keranjang Belanja"
          className="relative -top-5 w-14 h-14 bg-[#005AE0] hover:bg-[#0048b3] active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-all cursor-pointer"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              {cartCount}
            </span>
          )}
        </button>

        {/* 4. Laporan */}
        <button
          onClick={() => handleSelectTab('reports')}
          className={`flex flex-col items-center py-1 px-2 text-[11px] transition-colors cursor-pointer ${
            activeTab === 'reports' ? 'text-[#005AE0] font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
          <span>Laporan</span>
        </button>

        {/* 5. Menu / Profil Drawer Trigger */}
        <button
          onClick={() => setIsMenuDrawerOpen(true)}
          className={`flex flex-col items-center py-1 px-2 text-[11px] transition-colors cursor-pointer ${
            isMenuDrawerOpen ? 'text-[#005AE0] font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {currentUser?.avatar && !imageError ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover mb-0.5 ring-1 ring-slate-300"
            />
          ) : (
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
          )}
          <span>Menu</span>
        </button>
      </div>

      {/* Full Sliding Menu Drawer from Bottom/Side on Mobile */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header with user photo */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {currentUser?.avatar && !imageError ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#005AE0] to-blue-400 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser?.name ? currentUser.name.slice(0, 1).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {currentUser?.name || storeProfile.storeName}
                  </h3>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {currentUser ? `${currentUser.role} • @${currentUser.username}` : 'Menu Lengkap Aplikasi'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="space-y-2">
              {/* Kasir POS */}
              <button
                onClick={() => handleSelectTab('pos')}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'pos'
                    ? 'border-[#005AE0] bg-blue-50/60 text-[#005AE0]'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#005AE0] flex items-center justify-center font-bold">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs block">Kasir POS Belanja</span>
                    <span className="text-[10px] text-slate-500">Scan barcode & proses transaksi tunai/QRIS</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Inventaris & Stok */}
              <button
                onClick={() => handleSelectTab('inventory')}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'border-[#005AE0] bg-blue-50/60 text-[#005AE0]'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs block">Katalog Barang & Manajemen Stok</span>
                    <span className="text-[10px] text-slate-500">Kelola harga kulakan, jual, dan peringatan stok</span>
                  </div>
                </div>
                {lowStockCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                    {lowStockCount} habis
                  </span>
                )}
              </button>

              {/* Laporan Keuangan */}
              <button
                onClick={() => handleSelectTab('reports')}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'border-[#005AE0] bg-blue-50/60 text-[#005AE0]'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs block">Laporan Laba Rugi & Omset</span>
                    <span className="text-[10px] text-slate-500">Analisis penjualan, margin keuntungan toko</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Riwayat Transaksi */}
              <button
                onClick={() => handleSelectTab('transactions')}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'border-[#005AE0] bg-blue-50/60 text-[#005AE0]'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs block">Riwayat Transaksi Penjualan</span>
                    <span className="text-[10px] text-slate-500">Cetak ulang struk & audit pesanan</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Buku Kasbon */}
              <button
                onClick={() => handleSelectTab('debts')}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'debts'
                    ? 'border-[#005AE0] bg-blue-50/60 text-[#005AE0]'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs block">Buku Kasbon & Hutang Warga</span>
                    <span className="text-[10px] text-slate-500">Catat piutang, cicilan, dan tagihan WA</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Multi-HP Cloud Sync Option in Drawer */}
              {onOpenFirebaseSync && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuDrawerOpen(false);
                    onOpenFirebaseSync();
                  }}
                  className="w-full p-3 rounded-2xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#005AE0] text-white flex items-center justify-center font-bold">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs block">Sinkronisasi Multi-HP Cloud</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-600 text-white font-bold">Real-time</span>
                      </div>
                      <span className="text-[10px] text-slate-600">Buka kasir di beberapa HP bersamaan, auto update</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                </button>
              )}

              {/* Pengaturan Toko */}
              <button
                onClick={() => handleSelectTab('settings')}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-[#005AE0] bg-blue-50/60 text-[#005AE0]'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs block">Pengaturan Toko, Pengguna & Printer</span>
                    <span className="text-[10px] text-slate-500">Profil warung, tambah kasir, struk thermal</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Direct Logout Option in Drawer */}
              {onLogout && (
                <button
                  type="button"
                  onClick={handleOpenLogoutConfirm}
                  className="w-full p-3 rounded-2xl border border-rose-200 hover:bg-rose-50 text-rose-700 flex items-center justify-between transition-all cursor-pointer mt-1"
                >
                  <div className="flex items-center gap-3">
                    {currentUser?.avatar ? (
                      <div className="relative">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-rose-200 shrink-0"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center">
                          <LogOut className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                        <LogOut className="w-5 h-5" />
                      </div>
                    )}
                    <div className="text-left">
                      <span className="font-bold text-xs block">Keluar dari Akun Kasir</span>
                      <span className="text-[10px] text-rose-500">
                        {currentUser ? `Keluar dari ${currentUser.name}` : 'Kembali ke halaman login'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
