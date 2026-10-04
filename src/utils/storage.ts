import { Product, Transaction, DebtRecord, StockLog, StoreProfile, AppSettings, AppUser, UserActivityLog, UserRole, Supplier, PurchaseOrder } from '../types';
import { initialProducts, initialTransactions, initialDebts, initialStoreProfile, initialAppSettings, initialUsers, initialActivityLogs, initialSuppliers, initialPurchases } from './initialData';
import { indexedDBBackup } from './indexedDBBackup';

const STORAGE_KEYS = {
  PRODUCTS: 'warungpro_products_v1',
  TRANSACTIONS: 'warungpro_transactions_v1',
  DEBTS: 'warungpro_debts_v1',
  STOCK_LOGS: 'warungpro_stock_logs_v1',
  STORE_PROFILE: 'warungpro_store_profile_v1',
  APP_SETTINGS: 'warungpro_app_settings_v1',
  USERS: 'warungpro_users_v1',
  ACTIVITY_LOGS: 'warungpro_activity_logs_v1',
  ACTIVE_USER_ID: 'warungpro_active_user_id_v1',
  SUPPLIERS: 'warungpro_suppliers_v1',
  PURCHASES: 'warungpro_purchases_v1',
};

// Auto-backup debounce timer to save to IndexedDB asynchronously
let autoBackupTimer: any = null;
const scheduleAutoBackup = (source: 'auto_transaction' | 'auto_timer' = 'auto_transaction') => {
  if (typeof window === 'undefined') return;
  if (autoBackupTimer) clearTimeout(autoBackupTimer);
  autoBackupTimer = setTimeout(() => {
    indexedDBBackup.createSnapshot(source).catch((err) => {
      console.warn('[Warungku Auto-Backup] snapshot error:', err);
    });
  }, 800);
};

export const storage = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) return initialProducts;
      const stored: Product[] = JSON.parse(data);
      const storedMap = new Map(stored.map((p) => [p.id, p]));
      const ordered = initialProducts.map((p) => storedMap.get(p.id) || p);
      const remainingStored = stored.filter((p) => !initialProducts.some((ip) => ip.id === p.id));
      return [...ordered, ...remainingStored];
    } catch {
      return initialProducts;
    }
  },

  saveProducts(products: Product[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      scheduleAutoBackup('auto_transaction');
    } catch (e) {
      console.error('Failed to save products:', e);
    }
  },

  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : initialTransactions;
    } catch {
      return initialTransactions;
    }
  },

  saveTransactions(transactions: Transaction[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      scheduleAutoBackup('auto_transaction');
    } catch (e) {
      console.error('Failed to save transactions:', e);
    }
  },

  getDebts(): DebtRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEBTS);
      return data ? JSON.parse(data) : initialDebts;
    } catch {
      return initialDebts;
    }
  },

  saveDebts(debts: DebtRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
      scheduleAutoBackup('auto_transaction');
    } catch (e) {
      console.error('Failed to save debts:', e);
    }
  },

  getStockLogs(): StockLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveStockLogs(logs: StockLog[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save stock logs:', e);
    }
  },

  getSuppliers(): Supplier[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return data ? JSON.parse(data) : initialSuppliers;
    } catch {
      return initialSuppliers;
    }
  },

  saveSuppliers(suppliers: Supplier[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
      scheduleAutoBackup('auto_transaction');
    } catch (e) {
      console.error('Failed to save suppliers:', e);
    }
  },

  getPurchases(): PurchaseOrder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      return data ? JSON.parse(data) : initialPurchases;
    } catch {
      return initialPurchases;
    }
  },

  savePurchases(purchases: PurchaseOrder[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
      scheduleAutoBackup('auto_transaction');
    } catch (e) {
      console.error('Failed to save purchases:', e);
    }
  },

  getStoreProfile(): StoreProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORE_PROFILE);
      return data ? JSON.parse(data) : initialStoreProfile;
    } catch {
      return initialStoreProfile;
    }
  },

  saveStoreProfile(profile: StoreProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.STORE_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save store profile:', e);
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (!data) return initialAppSettings;
      const parsed = JSON.parse(data);
      return {
        ...initialAppSettings,
        ...parsed,
        storeProfile: { ...initialAppSettings.storeProfile, ...(parsed.storeProfile || {}) },
        notifications: { ...initialAppSettings.notifications, ...(parsed.notifications || {}) },
        appearance: { ...initialAppSettings.appearance, ...(parsed.appearance || {}) },
        security: { ...initialAppSettings.security, ...(parsed.security || {}) },
        integrations: { ...initialAppSettings.integrations, ...(parsed.integrations || {}) },
        tax: { ...initialAppSettings.tax, ...(parsed.tax || {}) },
      };
    } catch {
      return initialAppSettings;
    }
  },

  saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
      // Keep store profile synced
      if (settings.storeProfile) {
        this.saveStoreProfile(settings.storeProfile);
      }
      scheduleAutoBackup('auto_transaction');
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  getUsers(): AppUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) return initialUsers;
      const stored: AppUser[] = JSON.parse(data);
      return stored.map((u) => {
        const init = initialUsers.find((iu) => iu.id === u.id);
        return {
          ...u,
          avatar: u.avatar || init?.avatar || undefined,
          username: u.username || init?.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          password: u.password || init?.password || u.pin || '1234',
        };
      });
    } catch {
      return initialUsers;
    }
  },

  saveUsers(users: AppUser[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      scheduleAutoBackup('auto_transaction');
    } catch (e) {
      console.error('Failed to save users:', e);
    }
  },

  async triggerImmediateBackup(label?: string) {
    return await indexedDBBackup.createSnapshot('manual', label);
  },

  getAuthSession(): AppUser | null {
    try {
      const data = localStorage.getItem('warungpro_auth_user_v1');
      if (!data) return null;
      const parsed: AppUser = JSON.parse(data);
      const init = initialUsers.find((iu) => iu.id === parsed.id);
      return {
        ...parsed,
        avatar: parsed.avatar || init?.avatar || undefined,
      };
    } catch {
      return null;
    }
  },

  setAuthSession(user: AppUser | null) {
    if (user) {
      localStorage.setItem('warungpro_auth_user_v1', JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, user.id);
    } else {
      localStorage.removeItem('warungpro_auth_user_v1');
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
    }
  },

  getActiveUserId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || 'user-1';
  },

  setActiveUserId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
  },

  getActivityLogs(): UserActivityLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      return data ? JSON.parse(data) : initialActivityLogs;
    } catch {
      return initialActivityLogs;
    }
  },

  saveActivityLogs(logs: UserActivityLog[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error('Failed to save activity logs:', e);
    }
  },

  logActivity(action: string, userName = 'Pengguna', userRole: UserRole = 'pemilik', details?: string) {
    const logs = this.getActivityLogs();
    const newLog: UserActivityLog = {
      id: `log-${Date.now()}`,
      userName,
      userRole,
      action,
      timestamp: new Date().toISOString(),
      details,
    };
    this.saveActivityLogs([newLog, ...logs]);
  },

  // Export full store backup as downloadable JSON
  exportBackup() {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      storeProfile: this.getStoreProfile(),
      settings: this.getSettings(),
      users: this.getUsers(),
      products: this.getProducts(),
      transactions: this.getTransactions(),
      debts: this.getDebts(),
      stockLogs: this.getStockLogs(),
      activityLogs: this.getActivityLogs(),
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `WarungPro_Backup_Lengkap_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Restore from imported JSON
  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) {
        this.saveProducts(data.products);
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        this.saveTransactions(data.transactions);
      }
      if (data.debts && Array.isArray(data.debts)) {
        this.saveDebts(data.debts);
      }
      if (data.stockLogs && Array.isArray(data.stockLogs)) {
        this.saveStockLogs(data.stockLogs);
      }
      if (data.storeProfile) {
        this.saveStoreProfile(data.storeProfile);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      if (data.users && Array.isArray(data.users)) {
        this.saveUsers(data.users);
      }
      if (data.activityLogs && Array.isArray(data.activityLogs)) {
        this.saveActivityLogs(data.activityLogs);
      }
      return true;
    } catch (e) {
      console.error('Invalid backup file', e);
      return false;
    }
  },

  // Export products to CSV (Excel compatible)
  exportProductsCSV() {
    const products = this.getProducts();
    const headers = ['ID', 'Barcode', 'Nama Barang', 'Kategori', 'Harga Modal (Rp)', 'Harga Jual (Rp)', 'Stok', 'Satuan'];
    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.buyPrice,
      p.sellPrice,
      p.stock,
      `"${p.unit}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `WarungPro_Katalog_Barang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Reset to factory sample data
  resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.DEBTS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_LOGS);
    localStorage.removeItem(STORAGE_KEYS.STORE_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.APP_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
  },
};
