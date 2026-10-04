import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, getStoreIdFromEmail, signInAsStoreDevice } from './firebase';
import { Product, Transaction, DebtRecord, Supplier, PurchaseOrder, StoreProfile } from '../types';

export interface FirebaseSyncState {
  storeEmail: string;
  storeId: string;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  cloudProductCount: number;
  cloudTransactionCount: number;
  authEmail: string | null;
  isOnline: boolean;
}

const STORAGE_KEYS = {
  STORE_EMAIL: 'warungpro_firebase_store_email_v1',
  STORE_ID: 'warungpro_firebase_store_id_v1',
  AUTO_SYNC: 'warungpro_firebase_auto_sync_v1',
};

// Default store email configured for user
const DEFAULT_EMAIL = 'pangeranlee19@gmail.com';

class FirebaseSyncManager {
  private activeStoreEmail: string = '';
  private activeStoreId: string = '';
  private unsubs: Unsubscribe[] = [];
  private listenersRegistered = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem(STORAGE_KEYS.STORE_EMAIL);
      this.activeStoreEmail = savedEmail || DEFAULT_EMAIL;
      this.activeStoreId = getStoreIdFromEmail(this.activeStoreEmail);
    }
  }

  getStoreEmail(): string {
    return this.activeStoreEmail || DEFAULT_EMAIL;
  }

  getStoreId(): string {
    return this.activeStoreId || getStoreIdFromEmail(this.getStoreEmail());
  }

  setStoreEmail(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    this.activeStoreEmail = cleanEmail;
    this.activeStoreId = getStoreIdFromEmail(cleanEmail);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.STORE_EMAIL, cleanEmail);
      localStorage.setItem(STORAGE_KEYS.STORE_ID, this.activeStoreId);
    }
    // Restart listeners for new store
    this.stopListening();
  }

  isAutoSyncEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
    return val !== 'false';
  }

  setAutoSyncEnabled(enabled: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, enabled ? 'true' : 'false');
  }

  // Ensure Firebase Auth session exists before performing Firestore operations
  async ensureAuth() {
    if (!auth.currentUser) {
      await signInAsStoreDevice();
    }
  }

  // Initialize and listen to real-time updates for all store collections
  startRealtimeListeners(callbacks: {
    onProductsUpdate: (products: Product[]) => void;
    onTransactionsUpdate: (transactions: Transaction[]) => void;
    onDebtsUpdate: (debts: DebtRecord[]) => void;
    onSuppliersUpdate: (suppliers: Supplier[]) => void;
    onPurchasesUpdate: (purchases: PurchaseOrder[]) => void;
    onStoreProfileUpdate?: (profile: StoreProfile) => void;
    onStatusChange?: (status: { isConnected: boolean; isSyncing: boolean }) => void;
  }): () => void {
    this.stopListening();

    const storeId = this.getStoreId();
    this.ensureAuth().catch((e) => console.warn('Auth init check:', e));

    if (callbacks.onStatusChange) {
      callbacks.onStatusChange({ isConnected: true, isSyncing: true });
    }

    // 1. Products listener
    const productsPath = `stores/${storeId}/products`;
    const unsubProducts = onSnapshot(
      collection(db, 'stores', storeId, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudProducts: Product[] = [];
          snapshot.forEach((d) => {
            cloudProducts.push(d.data() as Product);
          });
          // Sort by name or createdAt
          cloudProducts.sort((a, b) => a.name.localeCompare(b.name));
          callbacks.onProductsUpdate(cloudProducts);
        }
        if (callbacks.onStatusChange) {
          callbacks.onStatusChange({ isConnected: true, isSyncing: false });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, productsPath);
      }
    );
    this.unsubs.push(unsubProducts);

    // 2. Transactions listener
    const transactionsPath = `stores/${storeId}/transactions`;
    const unsubTransactions = onSnapshot(
      collection(db, 'stores', storeId, 'transactions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudTx: Transaction[] = [];
          snapshot.forEach((d) => {
            cloudTx.push(d.data() as Transaction);
          });
          // Sort descending by date (newest first)
          cloudTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          callbacks.onTransactionsUpdate(cloudTx);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, transactionsPath);
      }
    );
    this.unsubs.push(unsubTransactions);

    // 3. Debts listener
    const debtsPath = `stores/${storeId}/debts`;
    const unsubDebts = onSnapshot(
      collection(db, 'stores', storeId, 'debts'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudDebts: DebtRecord[] = [];
          snapshot.forEach((d) => {
            cloudDebts.push(d.data() as DebtRecord);
          });
          cloudDebts.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
          callbacks.onDebtsUpdate(cloudDebts);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, debtsPath);
      }
    );
    this.unsubs.push(unsubDebts);

    // 4. Suppliers listener
    const suppliersPath = `stores/${storeId}/suppliers`;
    const unsubSuppliers = onSnapshot(
      collection(db, 'stores', storeId, 'suppliers'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudSuppliers: Supplier[] = [];
          snapshot.forEach((d) => {
            cloudSuppliers.push(d.data() as Supplier);
          });
          cloudSuppliers.sort((a, b) => a.name.localeCompare(b.name));
          callbacks.onSuppliersUpdate(cloudSuppliers);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, suppliersPath);
      }
    );
    this.unsubs.push(unsubSuppliers);

    // 5. Purchases listener
    const purchasesPath = `stores/${storeId}/purchases`;
    const unsubPurchases = onSnapshot(
      collection(db, 'stores', storeId, 'purchases'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudPurchases: PurchaseOrder[] = [];
          snapshot.forEach((d) => {
            cloudPurchases.push(d.data() as PurchaseOrder);
          });
          cloudPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          callbacks.onPurchasesUpdate(cloudPurchases);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, purchasesPath);
      }
    );
    this.unsubs.push(unsubPurchases);

    // 6. Store document listener (for store profile & metadata)
    const storeDocPath = `stores/${storeId}`;
    const unsubStoreDoc = onSnapshot(
      doc(db, 'stores', storeId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.profile && callbacks.onStoreProfileUpdate) {
            callbacks.onStoreProfileUpdate(data.profile as StoreProfile);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, storeDocPath);
      }
    );
    this.unsubs.push(unsubStoreDoc);

    this.listenersRegistered = true;
    return () => this.stopListening();
  }

  stopListening() {
    this.unsubs.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
    this.unsubs = [];
    this.listenersRegistered = false;
  }

  // --- Real-time Mutation Methods (Sync to Firestore instantly) ---

  async syncProduct(product: Product): Promise<void> {
    const storeId = this.getStoreId();
    const path = `stores/${storeId}/products/${product.id}`;
    try {
      await this.ensureAuth();
      await setDoc(doc(db, 'stores', storeId, 'products', product.id), product);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    const storeId = this.getStoreId();
    const path = `stores/${storeId}/products/${productId}`;
    try {
      await this.ensureAuth();
      await deleteDoc(doc(db, 'stores', storeId, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async syncTransaction(transaction: Transaction, updatedProducts?: Product[]): Promise<void> {
    const storeId = this.getStoreId();
    const path = `stores/${storeId}/transactions/${transaction.id}`;
    try {
      await this.ensureAuth();
      const batch = writeBatch(db);

      // 1. Add transaction doc
      batch.set(doc(db, 'stores', storeId, 'transactions', transaction.id), transaction);

      // 2. Atomically update product stock levels
      if (updatedProducts && updatedProducts.length > 0) {
        for (const p of updatedProducts) {
          batch.set(doc(db, 'stores', storeId, 'products', p.id), p, { merge: true });
        }
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async syncDebt(debt: DebtRecord): Promise<void> {
    const storeId = this.getStoreId();
    const path = `stores/${storeId}/debts/${debt.id}`;
    try {
      await this.ensureAuth();
      await setDoc(doc(db, 'stores', storeId, 'debts', debt.id), debt);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async syncSupplier(supplier: Supplier): Promise<void> {
    const storeId = this.getStoreId();
    const path = `stores/${storeId}/suppliers/${supplier.id}`;
    try {
      await this.ensureAuth();
      await setDoc(doc(db, 'stores', storeId, 'suppliers', supplier.id), supplier);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async syncPurchase(purchase: PurchaseOrder, updatedProduct?: Product, updatedSupplier?: Supplier): Promise<void> {
    const storeId = this.getStoreId();
    const path = `stores/${storeId}/purchases/${purchase.id}`;
    try {
      await this.ensureAuth();
      const batch = writeBatch(db);

      batch.set(doc(db, 'stores', storeId, 'purchases', purchase.id), purchase);

      if (updatedProduct) {
        batch.set(doc(db, 'stores', storeId, 'products', updatedProduct.id), updatedProduct, { merge: true });
      }

      if (updatedSupplier) {
        batch.set(doc(db, 'stores', storeId, 'suppliers', updatedSupplier.id), updatedSupplier, { merge: true });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async syncStoreProfile(profile: StoreProfile): Promise<void> {
    const storeId = this.getStoreId();
    const path = `stores/${storeId}`;
    try {
      await this.ensureAuth();
      await setDoc(
        doc(db, 'stores', storeId),
        {
          id: storeId,
          ownerEmail: this.getStoreEmail(),
          storeName: profile.storeName,
          address: profile.address,
          phone: profile.phone,
          profile,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Initial push: Seed all existing local data into Firestore so other HPs immediately get all records
  async seedAllToCloud(data: {
    products: Product[];
    transactions: Transaction[];
    debts: DebtRecord[];
    suppliers: Supplier[];
    purchases: PurchaseOrder[];
    storeProfile: StoreProfile;
  }): Promise<{ success: boolean; message: string }> {
    const storeId = this.getStoreId();
    try {
      await this.ensureAuth();

      // Check if cloud already has products
      const existingProductsSnap = await getDocs(collection(db, 'stores', storeId, 'products'));
      if (existingProductsSnap.size > 0) {
        return {
          success: true,
          message: `Database online sudah berisi ${existingProductsSnap.size} produk. Sinkronisasi real-time aktif!`,
        };
      }

      // Sync store root
      await this.syncStoreProfile(data.storeProfile);

      // Batch upload products
      const batch1 = writeBatch(db);
      for (const p of data.products.slice(0, 450)) {
        batch1.set(doc(db, 'stores', storeId, 'products', p.id), p);
      }
      await batch1.commit();

      // Batch upload transactions
      if (data.transactions.length > 0) {
        const batch2 = writeBatch(db);
        for (const t of data.transactions.slice(0, 450)) {
          batch2.set(doc(db, 'stores', storeId, 'transactions', t.id), t);
        }
        await batch2.commit();
      }

      // Batch upload debts
      if (data.debts.length > 0) {
        const batch3 = writeBatch(db);
        for (const d of data.debts.slice(0, 450)) {
          batch3.set(doc(db, 'stores', storeId, 'debts', d.id), d);
        }
        await batch3.commit();
      }

      // Batch upload suppliers
      if (data.suppliers.length > 0) {
        const batch4 = writeBatch(db);
        for (const s of data.suppliers.slice(0, 450)) {
          batch4.set(doc(db, 'stores', storeId, 'suppliers', s.id), s);
        }
        await batch4.commit();
      }

      // Batch upload purchases
      if (data.purchases.length > 0) {
        const batch5 = writeBatch(db);
        for (const po of data.purchases.slice(0, 450)) {
          batch5.set(doc(db, 'stores', storeId, 'purchases', po.id), po);
        }
        await batch5.commit();
      }

      return {
        success: true,
        message: 'Berhasil mengunggah semua data toko ke Firebase Cloud untuk multi-HP!',
      };
    } catch (error) {
      console.error('Error seeding data to cloud:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal sinkronisasi awal ke Firebase',
      };
    }
  }
}

export const firebaseSync = new FirebaseSyncManager();
