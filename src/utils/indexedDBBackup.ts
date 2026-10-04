// IndexedDB Resilient Auto-Backup System
// Protects store data (transactions, inventory stock, debts, settings)
// even if browser cache or localStorage is cleared.

import { Product, Transaction, DebtRecord, StockLog, StoreProfile, AppSettings, AppUser, UserActivityLog, Supplier, PurchaseOrder } from '../types';

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  source: 'auto_transaction' | 'auto_timer' | 'manual' | 'emergency';
  label: string;
  meta: {
    productCount: number;
    transactionCount: number;
    debtCount: number;
    totalStockUnits: number;
    totalRevenue: number;
    purchaseCount?: number;
  };
  data: {
    products: Product[];
    transactions: Transaction[];
    debts: DebtRecord[];
    stockLogs: StockLog[];
    storeProfile: StoreProfile;
    settings?: AppSettings;
    users?: AppUser[];
    activityLogs?: UserActivityLog[];
    suppliers?: Supplier[];
    purchases?: PurchaseOrder[];
  };
}

const DB_NAME = 'WarungkuResilientDB_v1';
const DB_VERSION = 1;
const STORE_NAME = 'backup_snapshots';

class IndexedDBBackupManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  // Request browser storage persistence to prevent cache eviction
  async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        console.log(`[Warungku Backup] Persistent storage granted: ${isPersisted}`);
        return isPersisted;
      } catch (e) {
        console.warn('[Warungku Backup] Persistent storage request failed:', e);
      }
    }
    return false;
  }

  async isStoragePersisted(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  }

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in this browser.'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (event) => {
        console.error('[Warungku Backup] IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  // Create and save an automatic backup snapshot
  async createSnapshot(
    source: 'auto_transaction' | 'auto_timer' | 'manual' | 'emergency',
    label?: string,
    providedData?: BackupSnapshot['data']
  ): Promise<BackupSnapshot | null> {
    try {
      const db = await this.getDB();

      // Collect data from localStorage or providedData
      let data: BackupSnapshot['data'];
      if (providedData) {
        data = providedData;
      } else {
        const getLS = (key: string, def: any) => {
          try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : def;
          } catch {
            return def;
          }
        };

        data = {
          products: getLS('warungpro_products_v1', []),
          transactions: getLS('warungpro_transactions_v1', []),
          debts: getLS('warungpro_debts_v1', []),
          stockLogs: getLS('warungpro_stock_logs_v1', []),
          storeProfile: getLS('warungpro_store_profile_v1', {}),
          settings: getLS('warungpro_app_settings_v1', {}),
          users: getLS('warungpro_users_v1', []),
          activityLogs: getLS('warungpro_activity_logs_v1', []),
          suppliers: getLS('warungpro_suppliers_v1', []),
          purchases: getLS('warungpro_purchases_v1', []),
        };
      }

      const productCount = data.products?.length || 0;
      const transactionCount = data.transactions?.length || 0;
      const debtCount = data.debts?.length || 0;
      const purchaseCount = data.purchases?.length || 0;
      const totalStockUnits = data.products?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0;
      const totalRevenue = data.transactions?.reduce((acc, tx) => acc + (tx.totalAmount || 0), 0) || 0;

      const now = new Date();
      const snapshotId = `snapshot-${now.getTime()}`;
      const defaultLabel =
        label ||
        `Cadangan Otomatis ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })}`;

      const snapshot: BackupSnapshot = {
        id: snapshotId,
        timestamp: now.toISOString(),
        source,
        label: defaultLabel,
        meta: {
          productCount,
          transactionCount,
          debtCount,
          purchaseCount,
          totalStockUnits,
          totalRevenue,
        },
        data,
      };

      // Store in IndexedDB
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        store.put(snapshot);

        // Also update latest master emergency snapshot
        const emergencyCopy: BackupSnapshot = {
          ...snapshot,
          id: 'snapshot_latest_master',
          label: 'Master Snapshot Terakhir',
        };
        store.put(emergencyCopy);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // Cleanup older snapshots if > 25
      this.pruneOldSnapshots(25).catch(() => {});

      return snapshot;
    } catch (e) {
      console.warn('[Warungku Backup] Failed to create snapshot:', e);
      return null;
    }
  }

  // Get all saved snapshots sorted by newest first
  async getAllSnapshots(): Promise<BackupSnapshot[]> {
    try {
      const db = await this.getDB();
      return new Promise<BackupSnapshot[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const list: BackupSnapshot[] = request.result || [];
          // Filter out internal master copy from user list
          const userSnapshots = list.filter((s) => s.id !== 'snapshot_latest_master');
          userSnapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(userSnapshots);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('[Warungku Backup] Failed to get snapshots:', e);
      return [];
    }
  }

  // Get the latest master snapshot (for emergency disaster recovery)
  async getLatestSnapshot(): Promise<BackupSnapshot | null> {
    try {
      const db = await this.getDB();
      return new Promise<BackupSnapshot | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('snapshot_latest_master');

        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            // Fallback: pick the newest one
            const allReq = store.getAll();
            allReq.onsuccess = () => {
              const items = allReq.result || [];
              if (items.length === 0) return resolve(null);
              items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              resolve(items[0]);
            };
            allReq.onerror = () => resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  // Restore snapshot data back into localStorage
  async restoreSnapshot(snapshotId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      const snapshot = await new Promise<BackupSnapshot | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(snapshotId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      if (!snapshot || !snapshot.data) return false;

      const { data } = snapshot;
      if (data.products && Array.isArray(data.products)) {
        localStorage.setItem('warungpro_products_v1', JSON.stringify(data.products));
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        localStorage.setItem('warungpro_transactions_v1', JSON.stringify(data.transactions));
      }
      if (data.debts && Array.isArray(data.debts)) {
        localStorage.setItem('warungpro_debts_v1', JSON.stringify(data.debts));
      }
      if (data.stockLogs && Array.isArray(data.stockLogs)) {
        localStorage.setItem('warungpro_stock_logs_v1', JSON.stringify(data.stockLogs));
      }
      if (data.storeProfile) {
        localStorage.setItem('warungpro_store_profile_v1', JSON.stringify(data.storeProfile));
      }
      if (data.settings) {
        localStorage.setItem('warungpro_app_settings_v1', JSON.stringify(data.settings));
      }
      if (data.users && Array.isArray(data.users)) {
        localStorage.setItem('warungpro_users_v1', JSON.stringify(data.users));
      }
      if (data.activityLogs && Array.isArray(data.activityLogs)) {
        localStorage.setItem('warungpro_activity_logs_v1', JSON.stringify(data.activityLogs));
      }
      if (data.suppliers && Array.isArray(data.suppliers)) {
        localStorage.setItem('warungpro_suppliers_v1', JSON.stringify(data.suppliers));
      }
      if (data.purchases && Array.isArray(data.purchases)) {
        localStorage.setItem('warungpro_purchases_v1', JSON.stringify(data.purchases));
      }

      return true;
    } catch (e) {
      console.error('[Warungku Backup] Restore snapshot error:', e);
      return false;
    }
  }

  // Delete a snapshot
  async deleteSnapshot(snapshotId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise<boolean>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(snapshotId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(false);
      });
    } catch {
      return false;
    }
  }

  // Prune older snapshots
  private async pruneOldSnapshots(maxKeep = 25): Promise<void> {
    try {
      const list = await this.getAllSnapshots();
      if (list.length > maxKeep) {
        const db = await this.getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const toDelete = list.slice(maxKeep);
        toDelete.forEach((s) => store.delete(s.id));
      }
    } catch {
      // safe ignore
    }
  }

  // Trigger download of a snapshot as local JSON file
  downloadBackupFile(snapshot?: BackupSnapshot) {
    let payload = snapshot;
    if (!payload) {
      const getLS = (key: string, def: any) => {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : def;
        } catch {
          return def;
        }
      };

      const now = new Date();
      payload = {
        id: `file-export-${now.getTime()}`,
        timestamp: now.toISOString(),
        source: 'manual',
        label: `Backup Manual Warungku ${now.toLocaleDateString('id-ID')}`,
        meta: {
          productCount: getLS('warungpro_products_v1', []).length,
          transactionCount: getLS('warungpro_transactions_v1', []).length,
          debtCount: getLS('warungpro_debts_v1', []).length,
          totalStockUnits: 0,
          totalRevenue: 0,
        },
        data: {
          products: getLS('warungpro_products_v1', []),
          transactions: getLS('warungpro_transactions_v1', []),
          debts: getLS('warungpro_debts_v1', []),
          stockLogs: getLS('warungpro_stock_logs_v1', []),
          storeProfile: getLS('warungpro_store_profile_v1', {}),
          settings: getLS('warungpro_app_settings_v1', {}),
          users: getLS('warungpro_users_v1', []),
          activityLogs: getLS('warungpro_activity_logs_v1', []),
        },
      };
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
    const filename = `Warungku_AutoBackup_${dateStr}_${timeStr}.json`;

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}

export const indexedDBBackup = new IndexedDBBackupManager();
