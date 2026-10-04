import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  onOpenFirebaseSync?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onOpenFirebaseSync }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <button
      type="button"
      onClick={onOpenFirebaseSync}
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600/95 hover:bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-sm transition-transform active:scale-95 cursor-pointer border border-amber-400/40 text-left"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
      <div>
        <span className="font-bold block text-[11px]">Mode Offline</span>
        <span className="text-[10px] text-amber-100 block">
          Input kasir aman & akan otomatis sinkron saat online. Klik untuk info sync.
        </span>
      </div>
    </button>
  );
};
