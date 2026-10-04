import { LicenseInfo, GeneratedLicenseRecord, LicenseDuration, SubscriptionTier } from '../types';

const STORAGE_KEYS = {
  LICENSE_INFO: 'warungpro_license_info_v1',
  ISSUED_LICENSES: 'warungpro_issued_licenses_v1',
  OWNER_CONTACT: 'warungpro_owner_contact_v1',
};

const SECRET_SALT = 'WARUNGKU_PRO_PLAYSTORE_MASTER_SECRET_2026';

export interface OwnerContact {
  phone: string;
  name: string;
  email: string;
}

const DEFAULT_OWNER_CONTACT: OwnerContact = {
  phone: '6281234567890',
  name: 'Developer / Owner Warungku',
  email: 'pangeranlee19@gmail.com',
};

// Helper simple hash for key checksum verification
function generateChecksum(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return hex.slice(-4);
}

// Format duration label
export function getDurationLabel(duration: LicenseDuration): string {
  switch (duration) {
    case 'lifetime':
      return 'Selamanya (Lifetime)';
    case '1year':
      return '1 Tahun';
    case '6months':
      return '6 Bulan';
    case '1month':
      return '1 Bulan';
    default:
      return duration;
  }
}

export const licenseManager = {
  // Get active license info
  getLicenseInfo(): LicenseInfo {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LICENSE_INFO);
      if (!data) {
        return { tier: 'free' };
      }
      const parsed: LicenseInfo = JSON.parse(data);

      // Check if expired
      if (parsed.tier === 'pro' && parsed.expiresAt) {
        const expiry = new Date(parsed.expiresAt).getTime();
        const now = Date.now();
        if (now > expiry) {
          // License expired, downgrade to free
          const expiredInfo: LicenseInfo = {
            tier: 'free',
            licenseKey: parsed.licenseKey,
            expiresAt: parsed.expiresAt,
            duration: parsed.duration,
          };
          this.saveLicenseInfo(expiredInfo);
          return expiredInfo;
        }
      }

      return parsed;
    } catch {
      return { tier: 'free' };
    }
  },

  // Save license info
  saveLicenseInfo(info: LicenseInfo) {
    try {
      localStorage.setItem(STORAGE_KEYS.LICENSE_INFO, JSON.stringify(info));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('warungpro_license_updated', { detail: info }));
      }
    } catch (e) {
      console.error('Failed to save license info:', e);
    }
  },

  // Check if currently PRO
  isPro(): boolean {
    const info = this.getLicenseInfo();
    if (info.tier !== 'pro') return false;
    if (info.expiresAt) {
      return new Date(info.expiresAt).getTime() > Date.now();
    }
    return true; // Lifetime
  },

  // Get Owner Contact
  getOwnerContact(): OwnerContact {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OWNER_CONTACT);
      return data ? { ...DEFAULT_OWNER_CONTACT, ...JSON.parse(data) } : DEFAULT_OWNER_CONTACT;
    } catch {
      return DEFAULT_OWNER_CONTACT;
    }
  },

  // Save Owner Contact
  saveOwnerContact(contact: OwnerContact) {
    try {
      localStorage.setItem(STORAGE_KEYS.OWNER_CONTACT, JSON.stringify(contact));
    } catch (e) {
      console.error('Failed to save owner contact:', e);
    }
  },

  // Get list of generated licenses (for owner)
  getIssuedLicenses(): GeneratedLicenseRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ISSUED_LICENSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Save list of issued licenses
  saveIssuedLicenses(licenses: GeneratedLicenseRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ISSUED_LICENSES, JSON.stringify(licenses));
    } catch (e) {
      console.error('Failed to save issued licenses:', e);
    }
  },

  // Generate a valid, cryptographically checked license key
  generateLicense(
    duration: LicenseDuration,
    buyerName: string,
    buyerPhone: string,
    storeName?: string,
    notes?: string
  ): GeneratedLicenseRecord {
    const durCode = duration === 'lifetime' ? 'LIFE' : duration === '1year' ? 'YEAR' : duration === '6months' ? '6MOS' : '1MOS';
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase().padStart(4, 'X');
    const saltString = `${durCode}-${randPart}-${SECRET_SALT}`;
    const checksum = generateChecksum(saltString);

    const fullKey = `PRO-${durCode}-${randPart}-${checksum}`;

    const now = new Date();
    let expiresAt: string | null = null;
    if (duration === '1year') {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() + 1);
      expiresAt = d.toISOString();
    } else if (duration === '6months') {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 6);
      expiresAt = d.toISOString();
    } else if (duration === '1month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 1);
      expiresAt = d.toISOString();
    }

    const newRecord: GeneratedLicenseRecord = {
      id: 'lic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      key: fullKey,
      duration,
      buyerName: buyerName.trim() || 'Pembeli PRO',
      buyerPhone: buyerPhone.trim(),
      storeName: storeName?.trim() || '',
      createdAt: now.toISOString(),
      expiresAt,
      status: 'active',
      notes,
    };

    const currentList = this.getIssuedLicenses();
    this.saveIssuedLicenses([newRecord, ...currentList]);

    return newRecord;
  },

  // Validate a license key
  validateKey(rawKey: string): { valid: boolean; duration?: LicenseDuration; error?: string } {
    const cleanKey = rawKey.trim().toUpperCase().replace(/\s+/g, '');

    // Format expected: PRO-[DUR]-[RAND]-[CHECKSUM]
    const parts = cleanKey.split('-');
    if (parts.length !== 4) {
      return { valid: false, error: 'Format lisensi harus berupa PRO-XXXX-XXXX-XXXX' };
    }

    const [prefix, durCode, randPart, checksum] = parts;
    if (prefix !== 'PRO') {
      return { valid: false, error: 'Awalan lisensi harus diawali PRO-' };
    }

    let duration: LicenseDuration;
    if (durCode === 'LIFE') duration = 'lifetime';
    else if (durCode === 'YEAR') duration = '1year';
    else if (durCode === '6MOS') duration = '6months';
    else if (durCode === '1MOS') duration = '1month';
    else {
      return { valid: false, error: 'Durasi lisensi tidak dikenali' };
    }

    const expectedChecksum = generateChecksum(`${durCode}-${randPart}-${SECRET_SALT}`);
    if (checksum !== expectedChecksum) {
      // Also allow special master emergency override key if needed
      if (cleanKey !== 'PRO-MASTER-VIP888-2026') {
        return { valid: false, error: 'Kode Lisensi tidak valid atau rusak' };
      }
      duration = 'lifetime';
    }

    return { valid: true, duration };
  },

  // Activate license by key (called by buyer)
  activateKey(
    rawKey: string,
    buyerName?: string,
    storeName?: string
  ): { success: boolean; message: string; license?: LicenseInfo } {
    const validation = this.validateKey(rawKey);
    if (!validation.valid || !validation.duration) {
      return {
        success: false,
        message: validation.error || 'Kode Lisensi tidak valid',
      };
    }

    const duration = validation.duration;
    const now = new Date();
    let expiresAt: string | null = null;
    if (duration === '1year') {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() + 1);
      expiresAt = d.toISOString();
    } else if (duration === '6months') {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 6);
      expiresAt = d.toISOString();
    } else if (duration === '1month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 1);
      expiresAt = d.toISOString();
    }

    const cleanKey = rawKey.trim().toUpperCase().replace(/\s+/g, '');
    const updatedLicense: LicenseInfo = {
      tier: 'pro',
      licenseKey: cleanKey,
      duration,
      activatedAt: now.toISOString(),
      expiresAt,
      buyerName: buyerName || 'Pengguna Berbayar',
      storeName: storeName || '',
      isLifetime: duration === 'lifetime',
    };

    this.saveLicenseInfo(updatedLicense);

    // Update in issued records if exists
    const issued = this.getIssuedLicenses();
    const updatedIssued = issued.map((lic) => {
      if (lic.key === cleanKey) {
        return {
          ...lic,
          status: 'used' as const,
          usedAt: now.toISOString(),
          buyerName: buyerName || lic.buyerName,
          storeName: storeName || lic.storeName,
        };
      }
      return lic;
    });
    this.saveIssuedLicenses(updatedIssued);

    return {
      success: true,
      message: `Aktivasi Lisensi PRO (${getDurationLabel(duration)}) Berhasil! Semua fitur kini Full Akses tanpa batas.`,
      license: updatedLicense,
    };
  },

  // Direct unlock by Owner (e.g. bypass or owner activating device directly)
  directUnlockPro(duration: LicenseDuration = 'lifetime', buyerName = 'Pembeli Langsung', storeName = ''): LicenseInfo {
    const record = this.generateLicense(duration, buyerName, '', storeName, 'Aktivasi Langsung');
    const result = this.activateKey(record.key, buyerName, storeName);
    return result.license || { tier: 'pro', isLifetime: duration === 'lifetime' };
  },

  // Downgrade to Free (for testing or reset)
  resetToFree() {
    const freeInfo: LicenseInfo = { tier: 'free' };
    this.saveLicenseInfo(freeInfo);
  },

  // Create WhatsApp message URL for user buying PRO
  createWhatsAppBuyUrl(storeId?: string, storeName?: string, ownerPhoneOverride?: string): string {
    const contact = this.getOwnerContact();
    let phone = (ownerPhoneOverride || contact.phone).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    const text = encodeURIComponent(
      `Halo Developer Warungku, saya pengguna aplikasi dari Google Play Store.\n` +
      `Saya tertarik membeli Lisensi FULL AKSES PRO (Tanpa Batas Produk & Multi-HP).\n\n` +
      `Detail Toko Saya:\n` +
      `- Nama Toko: ${storeName || 'Toko Saya'}\n` +
      `- ID Perangkat: ${storeId || 'Belum terdata'}\n\n` +
      `Mohon info no rekening / QRIS pembayaran dan cara pengiriman Kode Lisensi PRO. Terima kasih!`
    );

    return `https://wa.me/${phone}?text=${text}`;
  },

  // Create WhatsApp message URL for Owner to send license to buyer
  createWhatsAppSendLicenseUrl(
    buyerPhone: string,
    buyerName: string,
    licenseKey: string,
    duration: LicenseDuration
  ): string {
    let phone = buyerPhone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    const durLabel = getDurationLabel(duration);
    const text = encodeURIComponent(
      `🎉 *SELAMAT! LISENSI PRO WARUNGKU ANDA TELAH TERBIT* 🎉\n\n` +
      `Halo Kak *${buyerName}*,\n` +
      `Terima kasih telah membeli *Aplikasi Warungku POS PRO (Full Akses)*!\n\n` +
      `Berikut adalah rincian lisensi Anda:\n` +
      `🔑 *Kode Lisensi:* \`${licenseKey}\`\n` +
      `⏱️ *Masa Aktif:* *${durLabel}*\n` +
      `🚀 *Status:* Siap Diaktifkan\n\n` +
      `*Cara Aktivasi di Aplikasi:*\n` +
      `1. Buka aplikasi Warungku POS di HP Anda.\n` +
      `2. Klik menu tombol *'⭐ GRATIS (Upgrade PRO)'* di bagian atas, atau buka *Pengaturan -> Aktivasi Lisensi PRO*.\n` +
      `3. Tempel/Masukkan Kode Lisensi di atas.\n` +
      `4. Klik *'Aktivasi Sekarang'*. Selesai! Semua fitur langsung terbuka tanpa batas.\n\n` +
      `Jika butuh panduan, silakan balas pesan ini. Sukses selalu untuk usaha Anda! 🙏`
    );

    return `https://wa.me/${phone}?text=${text}`;
  },
};
