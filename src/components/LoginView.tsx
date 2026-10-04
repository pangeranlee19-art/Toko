import React, { useState } from 'react';
import { AppUser, StoreProfile } from '../types';
import { sound } from '../utils/sound';
import { signInWithGoogle } from '../utils/firebase';
import { firebaseSync } from '../utils/firebaseSync';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShoppingCart,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Smartphone,
  Cloud,
} from 'lucide-react';

interface LoginViewProps {
  users: AppUser[];
  storeProfile: StoreProfile;
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  storeProfile,
  onLoginSuccess,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage('Harap masukkan username dan password.');
      sound.playWarning();
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user by username, email, or name
      const matchedUser = users.find((u) => {
        const matchUser =
          (u.username && u.username.toLowerCase() === cleanUsername) ||
          (u.email && u.email.toLowerCase() === cleanUsername) ||
          u.name.toLowerCase() === cleanUsername;

        const matchPass =
          (u.password && u.password === cleanPassword) ||
          (u.pin && u.pin === cleanPassword);

        return matchUser && matchPass;
      });

      if (matchedUser) {
        sound.playCashChime();
        onLoginSuccess(matchedUser);
      } else {
        sound.playWarning();
        setErrorMessage('Username atau password salah. Silakan periksa kembali akun Anda.');
      }
      setIsLoading(false);
    }, 250);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const gUser = await signInWithGoogle();
      if (gUser && gUser.email) {
        firebaseSync.setStoreEmail(gUser.email);
        sound.playCashChime();
        // Find existing owner user or fallback to first user
        const matched =
          users.find((u) => u.email?.toLowerCase() === gUser.email?.toLowerCase()) ||
          users.find((u) => u.role === 'pemilik') ||
          users[0];
        onLoginSuccess({
          ...matched,
          email: gUser.email,
          name: gUser.displayName || matched.name,
          avatar: gUser.photoURL || matched.avatar,
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Gagal masuk dengan Google. Silakan gunakan username & password kasir.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#005AE0] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-5 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center relative">
            {storeProfile.logoUrl ? (
              <img
                src={storeProfile.logoUrl}
                alt={storeProfile.storeName}
                className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-blue-900/40 border-2 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#005AE0] flex items-center justify-center text-white shadow-xl shadow-blue-900/40 border-2 border-white/20">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
            )}
            <span className="absolute -top-1.5 -right-1.5 text-amber-300 text-lg font-black drop-shadow">
              ★
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {storeProfile.storeName || 'Warungku'}
            </h1>
            <p className="text-xs text-blue-200 font-medium">
              {storeProfile.description || 'Sembako & Kebutuhan Harian'} • Sistem Kasir POS
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Masuk ke Sistem Kasir</h2>
            <p className="text-xs text-slate-500">
              Silakan masukkan username dan password akun Anda untuk memulai
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username / Email */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Username atau Email:</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masukkan username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005AE0] transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Password / PIN */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">Password / PIN:</label>
                <span className="text-[11px] text-slate-400">PIN 4 angka atau kata sandi</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password atau PIN"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005AE0] transition-all font-mono text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#005AE0] hover:bg-[#0048b3] active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-2 text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                atau
              </span>
            </div>

            {/* Google Sign-in Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-3 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Masuk dengan Google (Sinkronisasi Multi-HP)</span>
            </button>
          </form>
        </div>

        {/* Multi-HP Cloud Connection Indicator */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-slate-300 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Database Toko Cloud:{' '}
              <strong className="text-white font-mono">{firebaseSync.getStoreEmail()}</strong>
            </span>
          </div>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-time
          </span>
        </div>

        {/* Footer Security Badge */}
        <div className="text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Sistem kasir multi-device Firebase terenkripsi & data otomatis sinkron saat online.</span>
        </div>
      </div>
    </div>
  );
};
