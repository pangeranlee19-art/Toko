export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatShortDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `WRG-${year}${month}${day}-${random}`;
}

export function getExpiryStatus(expiryDate?: string): {
  status: 'expired' | 'expiring_soon' | 'safe' | 'none';
  label: string;
  daysRemaining?: number;
} {
  if (!expiryDate) {
    return { status: 'none', label: 'Tidak diatur' };
  }
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        label: `Kedaluwarsa (${Math.abs(diffDays)} hari lalu)`,
        daysRemaining: diffDays,
      };
    } else if (diffDays === 0) {
      return {
        status: 'expired',
        label: 'Kedaluwarsa Hari Ini!',
        daysRemaining: 0,
      };
    } else if (diffDays <= 30) {
      return {
        status: 'expiring_soon',
        label: `Kedaluwarsa ${diffDays} hari lagi`,
        daysRemaining: diffDays,
      };
    } else {
      return {
        status: 'safe',
        label: `Aman (${diffDays} hari)`,
        daysRemaining: diffDays,
      };
    }
  } catch {
    return { status: 'none', label: 'Tidak valid' };
  }
}
