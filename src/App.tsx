import React, { useState, useEffect, useMemo } from 'react';
import { Product, Transaction, DebtRecord, StoreProfile, CartItem, AppSettings, AppUser, UserActivityLog, Supplier, PurchaseOrder, StockLog } from './types';
import { storage } from './utils/storage';
import { sound } from './utils/sound';
import { formatRupiah } from './utils/format';
import { Navbar, ActiveTab } from './components/Navbar';
import { POSView } from './components/POSView';
import { InventoryView } from './components/InventoryView';
import { TransactionsView } from './components/TransactionsView';
import { KasbonView } from './components/KasbonView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { VisualItemScannerModal } from './components/VisualItemScannerModal';
import { LoginView } from './components/LoginView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FirebaseSyncModal } from './components/FirebaseSyncModal';
import { firebaseSync } from './utils/firebaseSync';
import { indexedDBBackup, BackupSnapshot } from './utils/indexedDBBackup';
import { CheckCircle2, ShieldAlert, RotateCcw } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<AppUser[]>(() => storage.getUsers());
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => storage.getAuthSession());
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions());
  const [debts, setDebts] = useState<DebtRecord[]>(() => storage.getDebts());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => storage.getSuppliers());
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => storage.getPurchases());
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => storage.getStoreProfile());
  const [appSettings, setAppSettings] = useState<AppSettings>(() => storage.getSettings());
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>(() => storage.getActivityLogs());

  // Disaster recovery banner state if browser cache was deleted
  const [recoverableSnapshot, setRecoverableSnapshot] = useState<BackupSnapshot | null>(null);

  // Lifted Cart State so barcode scanner & POS share same live state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Barcode quick registration state
  const [newProductInitialBarcode, setNewProductInitialBarcode] = useState<string | null>(null);
  const [newProductInitialData, setNewProductInitialData] = useState<{
    name?: string;
    barcode?: string;
    category?: any;
    image?: string;
  } | null>(null);

  // Visual scanner mode (pos vs inventory)
  const [visualScannerMode, setVisualScannerMode] = useState<'pos' | 'inventory'>('pos');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal controls
  const [recentTransaction, setRecentTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isVisualScannerOpen, setIsVisualScannerOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isFirebaseSyncModalOpen, setIsFirebaseSyncModalOpen] = useState(false);

  // Real-time synchronization across multiple devices via Firebase Cloud
  useEffect(() => {
    const unsub = firebaseSync.startRealtimeListeners({
      onProductsUpdate: (cloudProducts) => {
        if (cloudProducts.length > 0) {
          setProducts(cloudProducts);
        }
      },
      onTransactionsUpdate: (cloudTx) => {
        if (cloudTx.length > 0) {
          setTransactions(cloudTx);
        }
      },
      onDebtsUpdate: (cloudDebts) => {
        if (cloudDebts.length > 0) {
          setDebts(cloudDebts);
        }
      },
      onSuppliersUpdate: (cloudSuppliers) => {
        if (cloudSuppliers.length > 0) {
          setSuppliers(cloudSuppliers);
        }
      },
      onPurchasesUpdate: (cloudPurchases) => {
        if (cloudPurchases.length > 0) {
          setPurchases(cloudPurchases);
        }
      },
      onStoreProfileUpdate: (cloudProfile) => {
        if (cloudProfile && cloudProfile.storeName) {
          setStoreProfile(cloudProfile);
        }
      },
    });

    return () => unsub();
  }, []);

  // Initial persistent storage request and disaster recovery check
  useEffect(() => {
    // Request permanent browser storage permission (so browser won't delete data on cache clear)
    indexedDBBackup.requestPersistentStorage();

    // Check if recovery is available in IndexedDB after browser cache wipe
    const checkRecovery = async () => {
      try {
        const latest = await indexedDBBackup.getLatestSnapshot();
        if (latest && latest.data) {
          const currentTxCount = transactions.length;
          const backupTxCount = latest.data.transactions?.length || 0;
          if (backupTxCount > currentTxCount && backupTxCount > 1) {
            setRecoverableSnapshot(latest);
          }
        }
      } catch (err) {
        console.warn('Disaster recovery check error:', err);
      }
    };
    checkRecovery();

    // Periodic auto-backup every 10 minutes
    const timer = setInterval(() => {
      indexedDBBackup.createSnapshot('auto_timer', 'Cadangan Berkala Otomatis').catch(() => {});
    }, 10 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync to storage on state change
  useEffect(() => {
    storage.saveProducts(products);
  }, [products]);

  useEffect(() => {
    storage.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storage.saveDebts(debts);
  }, [debts]);

  useEffect(() => {
    storage.saveSuppliers(suppliers);
  }, [suppliers]);

  useEffect(() => {
    storage.savePurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    storage.saveStoreProfile(storeProfile);
  }, [storeProfile]);

  useEffect(() => {
    storage.saveUsers(users);
  }, [users]);

  // Auth Handlers
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    storage.setAuthSession(user);
    storage.logActivity('Login Berhasil', user.name, user.role, `Berhasil masuk ke sesi kasir`);
    setToastMessage(`Selamat bertugas, ${user.name}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = () => {
    if (currentUser) {
      storage.logActivity('Logout', currentUser.name, currentUser.role, 'Keluar dari aplikasi');
    }
    setCurrentUser(null);
    storage.setAuthSession(null);
    setActiveTab('pos');
    setCart([]);
  };

  // Safe Tab Change with Permission Enforcement
  const handleTabChange = (tab: ActiveTab) => {
    if (!currentUser) return;

    if (tab === 'settings' && !currentUser.permissions.canSettings && currentUser.role !== 'pemilik') {
      sound.playWarning();
      alert(`Akses Ditolak: Menu Pengaturan hanya dapat diakses oleh Pemilik Toko. Akun Anda (${currentUser.name}) adalah ${currentUser.role}.`);
      return;
    }

    if (tab === 'reports' && !currentUser.permissions.canReports && currentUser.role === 'kasir') {
      sound.playWarning();
      alert(`Akses Ditolak: Menu Laporan Keuangan hanya dapat dibuka oleh Pemilik atau Admin.`);
      return;
    }

    if (tab === 'inventory' && !currentUser.permissions.canInventory && currentUser.role === 'kasir') {
      sound.playWarning();
      alert(`Akses Ditolak: Pengelolaan stok barang hanya dapat dibuka oleh Pemilik atau Admin.`);
      return;
    }

    setActiveTab(tab);
  };

  // Stock status calculations
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  }, [products]);

  const unpaidDebtCount = useMemo(() => {
    return debts.filter((d) => d.status === 'belum_lunas').length;
  }, [debts]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      sound.playWarning();
      alert(`Stok ${product.name} telah habis! Silakan lakukan kulakan stok.`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          sound.playWarning();
          alert(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit})`);
          return prevCart;
        }
        sound.playBeep();
        return prevCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        );
      } else {
        sound.playBeep();
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            price: product.sellPrice,
            subtotal: product.sellPrice,
          },
        ];
      }
    });

    setToastMessage(`+1 ${product.name} (${formatRupiah(product.sellPrice)})`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              sound.playWarning();
              alert(`Maksimal stok tersedia adalah ${item.product.stock} ${item.product.unit}`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Complete a sale transaction
  const handleCompleteSale = (newTx: Transaction, updatedProducts: Product[]) => {
    const txWithCashier: Transaction = {
      ...newTx,
      cashierName: currentUser?.name || 'Kasir',
    };

    setProducts(updatedProducts);
    setTransactions((prev) => [txWithCashier, ...prev]);

    let newDebtRecord: DebtRecord | undefined = undefined;

    // If transaction is kasbon, automatically log to debts ledger
    if (newTx.paymentMethod === 'kasbon') {
      const itemsText = newTx.items
        .map((i) => `${i.product.name} (${i.quantity} ${i.product.unit})`)
        .join(', ');

      const newDebt: DebtRecord = {
        id: `debt-${Date.now()}`,
        transactionId: newTx.id,
        customerName: newTx.customerName || 'Pelanggan Kasbon',
        customerPhone: newTx.customerPhone,
        totalDebt: newTx.totalAmount,
        remainingDebt: newTx.totalAmount,
        createdAt: newTx.date,
        updatedAt: newTx.date,
        status: 'belum_lunas',
        itemsSummary: itemsText,
        payments: [],
        notes: newTx.notes,
      };

      newDebtRecord = newDebt;
      setDebts((prev) => [newDebt, ...prev]);
    }

    // Real-time Cloud Sync to Firebase (All other HPs will instantly see this transaction & stock change)
    firebaseSync.syncTransaction(txWithCashier, updatedProducts).catch((err) => {
      console.warn('Real-time sync sale error:', err);
    });
    if (newDebtRecord) {
      firebaseSync.syncDebt(newDebtRecord).catch((err) => {
        console.warn('Real-time sync debt error:', err);
      });
    }

    // Log activity
    if (currentUser) {
      storage.logActivity(
        'Transaksi Kasir',
        currentUser.name,
        currentUser.role,
        `${newTx.invoiceNumber} - Total ${formatRupiah(newTx.totalAmount)} (${newTx.paymentMethod.toUpperCase()})`
      );
    }

    // Open receipt modal and reset cart to empty
    setRecentTransaction(txWithCashier);
    setCart([]);
    setIsReceiptOpen(true);
  };

  // Inventory handlers
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    firebaseSync.syncProduct(newProd).catch((e) => console.warn('Sync add product:', e));
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    firebaseSync.syncProduct(updatedProd).catch((e) => console.warn('Sync update product:', e));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    firebaseSync.deleteProduct(productId).catch((e) => console.warn('Sync delete product:', e));
  };

  const handleStockIn = (productId: string, quantity: number, note: string) => {
    let updatedProduct: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          updatedProduct = {
            ...p,
            stock: p.stock + quantity,
            updatedAt: new Date().toISOString(),
          };
          return updatedProduct;
        }
        return p;
      })
    );

    if (updatedProduct) {
      firebaseSync.syncProduct(updatedProduct).catch((e) => console.warn('Sync stock in:', e));
    }

    // Record stock log
    const target = products.find((p) => p.id === productId);
    if (target) {
      const log = {
        id: `log-${Date.now()}`,
        productId,
        productName: target.name,
        type: 'in' as const,
        quantity,
        previousStock: target.stock,
        currentStock: target.stock + quantity,
        costPerUnit: target.buyPrice,
        note,
        date: new Date().toISOString(),
      };
      const existingLogs = storage.getStockLogs();
      storage.saveStockLogs([log, ...existingLogs]);
    }
  };

  // Stock In directly linked to Supplier (Pembelian / Kulakan Supplier)
  const handleStockInFromSupplier = (params: {
    productId: string;
    quantity: number;
    supplierName: string;
    costPrice?: number;
    paymentType?: 'tunai' | 'kredit';
    dueDate?: string;
    note?: string;
    receivedDate?: string;
    expiryDate?: string;
  }) => {
    // 1. Update product stock and optionally buyPrice/dates
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === params.productId) {
          return {
            ...p,
            stock: p.stock + params.quantity,
            buyPrice: params.costPrice !== undefined && params.costPrice > 0 ? params.costPrice : p.buyPrice,
            receivedDate: params.receivedDate || p.receivedDate,
            expiryDate: params.expiryDate || p.expiryDate,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    const target = products.find((p) => p.id === params.productId);
    const productName = target ? target.name : 'Barang';
    const unitCost = params.costPrice !== undefined && params.costPrice > 0 ? params.costPrice : (target ? target.buyPrice : 0);
    const totalCost = unitCost * params.quantity;
    const finalSupplierName = params.supplierName.trim() || 'Supplier Umum';

    // 2. Create and save Purchase Order (PO)
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      invoiceNo: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString(),
      supplierName: finalSupplierName,
      totalAmount: totalCost,
      paymentType: params.paymentType || 'tunai',
      paymentStatus: params.paymentType === 'kredit' ? 'hutang' : 'lunas',
      dueDate: params.dueDate,
      items: [
        {
          productName,
          quantity: params.quantity,
          costPrice: unitCost,
          subtotal: totalCost,
        },
      ],
    };

    setPurchases((prev) => [newPO, ...prev]);

    let updatedSupplierTarget: Supplier | undefined;

    // 3. Update or Add Supplier with debt if kredit
    setSuppliers((prev) => {
      const existingIndex = prev.findIndex(
        (s) => s.name.toLowerCase() === finalSupplierName.toLowerCase()
      );
      const debtAmount = params.paymentType === 'kredit' ? totalCost : 0;

      if (existingIndex >= 0) {
        return prev.map((s, idx) => {
          if (idx === existingIndex) {
            updatedSupplierTarget = {
              ...s,
              debt: s.debt + debtAmount,
              dueDate: params.dueDate || s.dueDate,
            };
            return updatedSupplierTarget;
          }
          return s;
        });
      } else {
        const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          name: finalSupplierName,
          phone: '-',
          debt: debtAmount,
          dueDate: params.dueDate,
        };
        updatedSupplierTarget = newSup;
        return [newSup, ...prev];
      }
    });

    // Sync PO, product, and supplier to Cloud Real-Time
    const currentProductTarget = products.find((p) => p.id === params.productId);
    const updatedProductTarget = currentProductTarget
      ? {
          ...currentProductTarget,
          stock: currentProductTarget.stock + params.quantity,
          buyPrice: params.costPrice !== undefined && params.costPrice > 0 ? params.costPrice : currentProductTarget.buyPrice,
          updatedAt: new Date().toISOString(),
        }
      : undefined;

    firebaseSync.syncPurchase(newPO, updatedProductTarget, updatedSupplierTarget).catch((e) => {
      console.warn('Sync purchase error:', e);
    });

    // 4. Record stock log
    if (target) {
      const log: StockLog = {
        id: `log-${Date.now()}`,
        productId: params.productId,
        productName,
        type: 'in',
        quantity: params.quantity,
        previousStock: target.stock,
        currentStock: target.stock + params.quantity,
        costPerUnit: unitCost,
        note: `Supplier: ${finalSupplierName} | ${params.note || 'Stok Masuk'} (${params.paymentType === 'kredit' ? 'Hutang' : 'Lunas'})`,
        date: new Date().toISOString(),
      };
      const existingLogs = storage.getStockLogs();
      storage.saveStockLogs([log, ...existingLogs]);
    }

    // 5. Activity log
    if (currentUser) {
      storage.logActivity(
        'Barang Masuk Supplier',
        currentUser.name,
        currentUser.role,
        `+${params.quantity} ${productName} dari ${finalSupplierName} (Total Rp ${formatRupiah(totalCost)})`
      );
    }

    sound.playCashChime();
    setToastMessage(`✓ Stok ${productName} bertambah +${params.quantity} dari ${finalSupplierName}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePaySupplierDebt = (supplierId: string, amount: number) => {
    let updatedSup: Supplier | undefined;
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          const newDebt = Math.max(0, s.debt - amount);
          updatedSup = {
            ...s,
            debt: newDebt,
          };
          return updatedSup;
        }
        return s;
      })
    );
    if (updatedSup) {
      firebaseSync.syncSupplier(updatedSup).catch((e) => console.warn('Sync pay supplier debt:', e));
    }
    sound.playCashChime();
    setToastMessage(`✓ Pembayaran hutang supplier sebesar ${formatRupiah(amount)} berhasil dicatat.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Kasbon handlers
  const handleAddDebt = (newDebt: DebtRecord) => {
    setDebts((prev) => [newDebt, ...prev]);
    firebaseSync.syncDebt(newDebt).catch((e) => console.warn('Sync add debt:', e));
  };

  const handlePayDebt = (debtId: string, amount: number, note: string) => {
    let updatedDebt: DebtRecord | undefined;
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === debtId) {
          const newRemaining = Math.max(0, d.remainingDebt - amount);
          const payment = {
            id: `pay-${Date.now()}`,
            date: new Date().toISOString(),
            amount,
            note,
          };
          updatedDebt = {
            ...d,
            remainingDebt: newRemaining,
            status: newRemaining === 0 ? 'lunas' : 'belum_lunas',
            updatedAt: new Date().toISOString(),
            payments: [payment, ...d.payments],
          };
          return updatedDebt;
        }
        return d;
      })
    );
    if (updatedDebt) {
      firebaseSync.syncDebt(updatedDebt).catch((e) => console.warn('Sync pay debt:', e));
    }
  };

  // Data reset/restore handler
  const handleDataResetOrRestored = () => {
    setProducts(storage.getProducts());
    setTransactions(storage.getTransactions());
    setDebts(storage.getDebts());
    setStoreProfile(storage.getStoreProfile());
    setAppSettings(storage.getSettings());
    setUsers(storage.getUsers());
    setActivityLogs(storage.getActivityLogs());
    setCart([]);
  };

  // Disaster recovery: restore data after browser cache wipe
  const handleApplyDisasterRecovery = async () => {
    if (!recoverableSnapshot) return;
    const ok = await indexedDBBackup.restoreSnapshot(recoverableSnapshot.id);
    if (ok) {
      handleDataResetOrRestored();
      setRecoverableSnapshot(null);
      sound.playCashChime();
      setToastMessage('✓ Seluruh data transaksi & stok berhasil dipulihkan dari cadangan aman!');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Barcode scanned from camera modal
  const handleBarcodeScanned = (product: Product) => {
    handleAddToCart(product);
  };

  // Add new product from unregistered barcode
  const handleAddNewProductWithBarcode = (barcode: string) => {
    setNewProductInitialBarcode(barcode);
    setActiveTab('inventory');
  };

  // Handle scanned visual item from AI Camera
  const handleVisualItemScanned = (result: {
    matchedProduct?: Product;
    detectedName: string;
    detectedCategory: any;
    confidence: number;
    estimatedPrice: number;
    imageSnapshot?: string;
  }) => {
    if (result.matchedProduct) {
      handleAddToCart(result.matchedProduct);
      sound.playBeep();
      setToastMessage(`+1 ${result.matchedProduct.name} dari Hasil Kamera AI`);
    } else {
      sound.playBeep();
      setNewProductInitialData({
        name: result.detectedName,
        category: result.detectedCategory,
        image: result.imageSnapshot,
      });
      setActiveTab('inventory');
      setToastMessage(`Barang baru "${result.detectedName}" siap didaftarkan.`);
    }
  };

  // =========================================================================
  // GATE: TIDAK BISA MASUK JIKA BELUM LOGIN
  // =========================================================================
  if (!currentUser) {
    return (
      <LoginView
        users={users}
        storeProfile={storeProfile}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-16 md:pb-0">
      {/* Offline Status PWA Indicator with Sync details */}
      <OfflineIndicator onOpenFirebaseSync={() => setIsFirebaseSyncModalOpen(true)} />

      {/* Auto-Recovery Banner if browser cache was deleted */}
      {recoverableSnapshot && (
        <div className="bg-amber-500 text-white px-3 sm:px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-lg z-50 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-100" />
            <div>
              <span>
                Cadangan Data Ditemukan di Browser ({recoverableSnapshot.meta.transactionCount} Transaksi, {recoverableSnapshot.meta.productCount} Produk).
              </span>
              <span className="block text-[11px] font-normal text-amber-100">
                Data Anda aman di IndexedDB setelah pembersihan cache browser.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyDisasterRecovery}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Pulihkan Data Sekarang</span>
            </button>
            <button
              onClick={() => setRecoverableSnapshot(null)}
              className="px-2 py-1 text-amber-100 hover:text-white cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Instant Scan Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar with Active User and Logout */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartCount={totalCartCount}
        lowStockCount={lowStockCount}
        unpaidDebtCount={unpaidDebtCount}
        storeProfile={storeProfile}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSettings={() => handleTabChange('settings')}
        onOpenFirebaseSync={() => setIsFirebaseSyncModalOpen(true)}
        onOpenCart={() => {
          setActiveTab('pos');
          setIsCartDrawerOpen(true);
        }}
      />

      {/* Main View Port */}
      <main className="flex-1">
        {activeTab === 'pos' && (
          <POSView
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onCompleteSale={handleCompleteSale}
            onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
            onOpenVisualScanner={() => {
              setVisualScannerMode('pos');
              setIsVisualScannerOpen(true);
            }}
            onNavigateToInventory={() => handleTabChange('inventory')}
            isCartDrawerOpen={isCartDrawerOpen}
            onCloseCartDrawer={() => setIsCartDrawerOpen(false)}
            onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            suppliers={suppliers}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onStockIn={handleStockIn}
            onStockInFromSupplier={handleStockInFromSupplier}
            newProductInitialBarcode={newProductInitialBarcode}
            newProductInitialData={newProductInitialData}
            onClearInitialBarcode={() => {
              setNewProductInitialBarcode(null);
              setNewProductInitialData(null);
            }}
            onOpenVisualScanner={() => {
              setVisualScannerMode('inventory');
              setIsVisualScannerOpen(true);
            }}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            onSelectReceipt={(tx) => {
              setRecentTransaction(tx);
              setIsReceiptOpen(true);
            }}
          />
        )}

        {activeTab === 'debts' && (
          <KasbonView
            debts={debts}
            storeProfile={storeProfile}
            onAddDebt={handleAddDebt}
            onPayDebt={handlePayDebt}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            products={products}
            storeProfile={storeProfile}
            debts={debts}
            users={users}
            suppliers={suppliers}
            purchases={purchases}
            onStockInFromSupplier={handleStockInFromSupplier}
            onPaySupplierDebt={handlePaySupplierDebt}
          />
        )}

        {activeTab === 'settings' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
            <SettingsView
              settings={appSettings}
              users={users}
              activityLogs={activityLogs}
              onSaveSettings={(newSettings) => {
                setAppSettings(newSettings);
                setStoreProfile(newSettings.storeProfile);
                firebaseSync.syncStoreProfile(newSettings.storeProfile).catch(console.warn);
              }}
              onSaveUsers={(newUsers) => {
                setUsers(newUsers);
              }}
              onDataResetOrRestored={handleDataResetOrRestored}
              onOpenFirebaseSync={() => setIsFirebaseSyncModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Firebase Cloud Multi-HP Real-time Sync Modal */}
      <FirebaseSyncModal
        isOpen={isFirebaseSyncModalOpen}
        onClose={() => setIsFirebaseSyncModalOpen(false)}
        products={products}
        transactions={transactions}
        debts={debts}
        suppliers={suppliers}
        purchases={purchases}
        storeProfile={storeProfile}
        onToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      {/* Thermal & Digital Struk Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setCart([]);
        }}
        onFinishNewTransaction={() => {
          setIsReceiptOpen(false);
          setCart([]);
          setToastMessage('✓ Transaksi Berhasil! Keranjang telah kosong dan siap transaksi baru.');
          setTimeout(() => setToastMessage(null), 3500);
          sound.playCashChime();
        }}
        transaction={recentTransaction}
        storeProfile={storeProfile}
      />

      {/* Advanced ZXing + Native Barcode Camera & Simulator Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        products={products}
        onScan={handleBarcodeScanned}
        onAddNewProductWithBarcode={handleAddNewProductWithBarcode}
        onSwitchToVisualScanner={() => {
          setIsBarcodeScannerOpen(false);
          setVisualScannerMode('pos');
          setIsVisualScannerOpen(true);
        }}
      />

      {/* AI Visual Camera Scanner (Tanpa Barcode) Modal */}
      <VisualItemScannerModal
        isOpen={isVisualScannerOpen}
        onClose={() => setIsVisualScannerOpen(false)}
        products={products}
        initialMode={visualScannerMode}
        onAddToCart={(p, qty) => {
          for (let i = 0; i < (qty || 1); i++) {
            handleAddToCart(p);
          }
        }}
        onRegisterNewProduct={(prefill) => {
          setNewProductInitialData({
            name: prefill.name,
            category: prefill.category,
            image: prefill.image,
          });
          setActiveTab('inventory');
        }}
      />
    </div>
  );
}
