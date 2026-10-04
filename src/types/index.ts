export type ProductCategory =
  | 'Sembako'
  | 'Minuman'
  | 'Makanan Ringan'
  | 'Bumbu & Dapur'
  | 'Kebutuhan Rumah'
  | 'Rokok'
  | 'Lainnya';

export type ProductUnit =
  | 'Pcs'
  | 'Bungkus'
  | 'Botol'
  | 'Kg'
  | 'Liter'
  | 'Renceng'
  | 'Dus'
  | 'Pack';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  buyPrice: number;    // Harga Modal / Kulakan
  sellPrice: number;   // Harga Jual ke Pembeli
  stock: number;
  minStock: number;    // Batas minimum peringatan stok menipis
  unit: ProductUnit;
  image?: string;      // URL or base64 photo of product
  receivedDate?: string;   // Tanggal Datang Barang (YYYY-MM-DD)
  productionDate?: string; // Tanggal Produksi Produk (YYYY-MM-DD)
  expiryDate?: string;     // Tanggal Kedaluwarsa / Expired Date (ED) (YYYY-MM-DD)
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;       // Custom or standard sellPrice
  subtotal: number;
}

export type PaymentMethod = 'tunai' | 'qris' | 'transfer' | 'kasbon';

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;        // ISO string
  items: CartItem[];
  totalAmount: number;
  totalCost: number;   // Total Modal
  profit: number;      // totalAmount - totalCost
  paymentMethod: PaymentMethod;
  cashPaid?: number;   // Uang yang dibayarkan pelanggan
  change?: number;     // Kembalian
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  notes?: string;
}

export interface DebtPayment {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface DebtRecord {
  id: string;
  transactionId?: string;
  customerName: string;
  customerPhone?: string;
  totalDebt: number;
  remainingDebt: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  status: 'belum_lunas' | 'lunas';
  itemsSummary: string;
  payments: DebtPayment[];
  notes?: string;
}

export type StockLogType = 'in' | 'out' | 'adjustment';

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  type: StockLogType;
  quantity: number;
  previousStock: number;
  currentStock: number;
  costPerUnit?: number;
  note: string;
  date: string;
}

export type UserRole = 'pemilik' | 'admin' | 'kasir';

export interface UserPermissions {
  canPOS: boolean;
  canInventory: boolean;
  canReports: boolean;
  canDebts: boolean;
  canSettings: boolean;
  canVoid: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  pin: string;
  avatar?: string;
  email?: string;
  phone?: string;
  permissions: UserPermissions;
  createdAt: string;
  lastLogin?: string;
}

export interface UserActivityLog {
  id: string;
  userName: string;
  userRole: UserRole;
  action: string;
  timestamp: string;
  details?: string;
}

export interface NotificationSettings {
  lowStockAlert: boolean;
  expiredItemAlert: boolean;
  debtDueReminder: boolean;
  backupReminder: boolean;
  promoAlert: boolean;
  dailySummaryAlert: boolean;
  lowStockThreshold: number;
}

export interface AppearanceSettings {
  themeMode: 'light' | 'dark' | 'system';
  themeColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
  fontSize: 'small' | 'medium' | 'large';
  posLayout: 'grid' | 'compact';
  language: 'id' | 'jv' | 'en';
}

export interface SecuritySettings {
  appPinEnabled: boolean;
  appPin: string;
  biometricEnabled: boolean;
  autoLockMinutes: number; // 0 for disabled
  requireTxConfirm: boolean;
  requirePinForVoid: boolean;
}

export interface IntegrationSettings {
  whatsappGateway: string;
  whatsappBillTemplate: string;
  whatsappReceiptTemplate: string;
  qrisMerchantName: string;
  qrisNmid: string;
  qrisImage?: string;
  printerType: 'bluetooth_58' | 'bluetooth_80' | 'browser';
  autoPrintReceipt: boolean;
  barcodeCameraFacing: 'environment' | 'user';
  soundFeedback: boolean;
}

export interface TaxSettings {
  taxEnabled: boolean;
  taxPercentage: number;
  taxInclusive: boolean;
  npwpStore?: string;
}

export interface StoreProfile {
  storeName: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email?: string;
  ownerName: string;
  openHours?: string;
  description?: string;
  receiptFooter: string;
}

export interface AppSettings {
  storeProfile: StoreProfile;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
  tax: TaxSettings;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  contactPerson?: string;
  debt: number;
  dueDate?: string;
}

export interface PurchaseOrder {
  id: string;
  invoiceNo: string;
  date: string;
  supplierName: string;
  totalAmount: number;
  paymentType: 'tunai' | 'kredit';
  paymentStatus: 'lunas' | 'hutang';
  dueDate?: string;
  items: {
    productName: string;
    quantity: number;
    costPrice: number;
    subtotal: number;
  }[];
  isReturn?: boolean;
}

export interface CashierShift {
  id: string;
  cashierName: string;
  shiftName: string;
  date: string;
  initialCash: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  status: 'buka' | 'tutup';
}

export interface StockAdjustment {
  id: string;
  date: string;
  productName: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  reason: string;
}

// ==========================================
// COMMERCIAL TIERS & LICENSE MANAGEMENT
// ==========================================
export type SubscriptionTier = 'free' | 'pro';
export type LicenseDuration = 'lifetime' | '1year' | '6months' | '1month';

export interface LicenseInfo {
  tier: SubscriptionTier;
  licenseKey?: string;
  activatedAt?: string;
  expiresAt?: string | null; // null means Lifetime
  duration?: LicenseDuration;
  buyerName?: string;
  buyerPhone?: string;
  storeName?: string;
  isLifetime?: boolean;
}

export interface GeneratedLicenseRecord {
  id: string;
  key: string;
  duration: LicenseDuration;
  buyerName: string;
  buyerPhone: string;
  storeName?: string;
  createdAt: string;
  expiresAt: string | null;
  status: 'active' | 'used' | 'revoked';
  usedAt?: string;
  notes?: string;
}

export const FREE_TIER_LIMITS = {
  maxProducts: 30,
  maxMonthlyTransactions: 50,
  maxDebts: 5,
  allowMultiUser: false,
  allowMultiDeviceCloud: false,
  allowExcelExport: false,
  allowCustomLogoOnReceipt: false,
};

