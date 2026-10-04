import React, { useState, useMemo } from 'react';
import {
  Transaction,
  Product,
  StoreProfile,
  DebtRecord,
  AppUser,
  Expense,
  Supplier,
  PurchaseOrder,
  CashierShift,
  StockAdjustment,
} from '../types';
import { formatRupiah, formatNumber, formatDate, formatShortDate } from '../utils/format';
import {
  initialExpenses,
  initialSuppliers,
  initialPurchases,
  initialCashierShifts,
  initialStockAdjustments,
} from '../utils/initialData';
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Package,
  Download,
  Printer,
  Calendar,
  ShoppingBag,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  QrCode,
  ArrowRightLeft,
  CheckCircle2,
  PieChart,
  Layers,
  Search,
  MessageCircle,
  Truck,
  Users,
  UserCheck,
  Clock,
  Plus,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  X,
  FileText,
  Copy,
  ShieldCheck,
  CheckCheck,
  Phone,
  MapPin,
  User,
  CalendarDays,
  Filter,
  ArrowUpDown,
  Maximize2,
  Eye,
  CalendarRange,
} from 'lucide-react';

export type ReportCategory =
  | 'dashboard'
  | 'sales'
  | 'financial'
  | 'stock'
  | 'purchases'
  | 'customers'
  | 'suppliers'
  | 'cashiers';

interface ReportsViewProps {
  transactions: Transaction[];
  products: Product[];
  storeProfile: StoreProfile;
  debts?: DebtRecord[];
  users?: AppUser[];
  suppliers?: Supplier[];
  purchases?: PurchaseOrder[];
  onStockInFromSupplier?: (params: {
    productId: string;
    quantity: number;
    supplierName: string;
    costPrice?: number;
    paymentType?: 'tunai' | 'kredit';
    dueDate?: string;
    note?: string;
    receivedDate?: string;
    expiryDate?: string;
  }) => void;
  onPaySupplierDebt?: (supplierId: string, amount: number) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  products,
  storeProfile,
  debts = [],
  users = [],
  suppliers = initialSuppliers,
  purchases = initialPurchases,
  onStockInFromSupplier,
  onPaySupplierDebt,
}) => {
  // Active Category Tab
  const [activeTab, setActiveTab] = useState<ReportCategory>('dashboard');

  // Filter Period
  const [filterPeriod, setFilterPeriod] = useState<
    'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'all' | 'custom'
  >('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Expenses State (Operasional Toko)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'Operasional',
    amount: '',
    note: '',
  });

  // Purchase Order & Incoming Goods Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseProductId, setPurchaseProductId] = useState(products[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState('10');
  const [purchaseCost, setPurchaseCost] = useState(products[0]?.buyPrice?.toString() || '15000');
  const [purchaseSupplier, setPurchaseSupplier] = useState(suppliers[0]?.name || 'Agen Sembako Makmur Jaya');
  const [isCustomSupplierPO, setIsCustomSupplierPO] = useState(false);
  const [customSupplierPOInput, setCustomSupplierPOInput] = useState('');
  const [purchasePaymentType, setPurchasePaymentType] = useState<'tunai' | 'kredit'>('tunai');
  const [purchaseDueDate, setPurchaseDueDate] = useState('');
  const [purchaseReceivedDate, setPurchaseReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [purchaseNote, setPurchaseNote] = useState('');

  // Interactive purchases list with side detail panel & monthly/yearly reports
  const [purchaseViewMode, setPurchaseViewMode] = useState<'invoices' | 'recap'>('invoices');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [viewingDetailPurchase, setViewingDetailPurchase] = useState<PurchaseOrder | null>(null);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<'all' | 'lunas' | 'hutang'>('all');
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState<string>('all');
  const [purchaseYearFilter, setPurchaseYearFilter] = useState<string>('all');
  const [purchaseMonthFilter, setPurchaseMonthFilter] = useState<string>('all');
  const [purchaseSort, setPurchaseSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [recapYear, setRecapYear] = useState<string>(new Date().getFullYear().toString());
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [isPurchaseReceiptModalOpen, setIsPurchaseReceiptModalOpen] = useState(false);

  // Supplier Debt Pay Modal State
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // Shifts & Adjustments State
  const [cashierShifts] = useState<CashierShift[]>(initialCashierShifts);
  const [stockAdjustments] = useState<StockAdjustment[]>(initialStockAdjustments);

  // Time boundaries for today & this month
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime();

    return transactions.filter((tx) => {
      const txTime = new Date(tx.date).getTime();
      if (filterPeriod === 'today') return txTime >= startOfToday;
      if (filterPeriod === 'yesterday') return txTime >= startOfYesterday && txTime < startOfToday;
      if (filterPeriod === 'week') return txTime >= sevenDaysAgo;
      if (filterPeriod === 'month') return txTime >= thirtyDaysAgo;
      if (filterPeriod === 'last_month') return txTime >= startOfLastMonth && txTime <= endOfLastMonth;
      if (filterPeriod === 'custom' && customStartDate) {
        const start = new Date(customStartDate).getTime();
        const end = customEndDate
          ? new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000
          : Infinity;
        return txTime >= start && txTime <= end;
      }
      return true;
    });
  }, [transactions, filterPeriod, customStartDate, customEndDate, startOfToday, now]);

  // Overall Financial Calculations
  const metrics = useMemo(() => {
    // 1. Today vs This Month
    let todayOmzet = 0;
    let todayLaba = 0;
    let todayTxCount = 0;

    let monthOmzet = 0;
    let monthLaba = 0;
    let monthTxCount = 0;

    transactions.forEach((tx) => {
      const t = new Date(tx.date).getTime();
      const profit = tx.profit || tx.totalAmount - tx.totalCost;
      if (t >= startOfToday) {
        todayOmzet += tx.totalAmount;
        todayLaba += profit;
        todayTxCount++;
      }
      if (t >= startOfThisMonth) {
        monthOmzet += tx.totalAmount;
        monthLaba += profit;
        monthTxCount++;
      }
    });

    // 2. Filtered Period Aggregates
    let totalRevenue = 0;
    let totalCost = 0;
    let totalItemsSold = 0;
    let totalCashSales = 0;
    let totalKasbonSales = 0;
    let totalQrisSales = 0;
    let totalTransferSales = 0;
    let totalDiscounts = 0;
    let totalReturns = 0;

    const productMap: Record<
      string,
      {
        id: string;
        name: string;
        category: string;
        quantity: number;
        revenue: number;
        profit: number;
      }
    > = {};

    const categoryMap: Record<string, { quantity: number; revenue: number; profit: number }> = {};
    const customerMap: Record<string, { name: string; count: number; total: number; profit: number }> = {};
    const cashierMap: Record<string, { name: string; count: number; total: number }> = {};
    const dailyMap: Record<string, { date: string; revenue: number; profit: number }> = {};

    filteredTransactions.forEach((tx, idx) => {
      totalRevenue += tx.totalAmount;
      totalCost += tx.totalCost;

      // Simulated cashier attribution if not explicitly tagged
      const cashierName =
        (tx as any).cashierName ||
        (users.length > 0 ? users[idx % users.length].name : 'Pak Haji Rohman');
      if (!cashierMap[cashierName]) {
        cashierMap[cashierName] = { name: cashierName, count: 0, total: 0 };
      }
      cashierMap[cashierName].count++;
      cashierMap[cashierName].total += tx.totalAmount;

      // Payment Breakdown
      if (tx.paymentMethod === 'tunai') totalCashSales += tx.totalAmount;
      else if (tx.paymentMethod === 'kasbon') totalKasbonSales += tx.totalAmount;
      else if (tx.paymentMethod === 'qris') totalQrisSales += tx.totalAmount;
      else if (tx.paymentMethod === 'transfer') totalTransferSales += tx.totalAmount;

      // Customer Breakdown
      const cust = tx.customerName || 'Pelanggan Umum';
      if (!customerMap[cust]) {
        customerMap[cust] = { name: cust, count: 0, total: 0, profit: 0 };
      }
      customerMap[cust].count++;
      customerMap[cust].total += tx.totalAmount;
      customerMap[cust].profit += tx.profit || tx.totalAmount - tx.totalCost;

      // Daily Trend
      const dKey = tx.date.slice(0, 10);
      if (!dailyMap[dKey]) {
        dailyMap[dKey] = { date: dKey, revenue: 0, profit: 0 };
      }
      dailyMap[dKey].revenue += tx.totalAmount;
      dailyMap[dKey].profit += tx.profit || tx.totalAmount - tx.totalCost;

      // Products & Categories
      tx.items.forEach((item) => {
        totalItemsSold += item.quantity;
        const pId = item.product.id;
        const buyPrice = item.product.buyPrice || 0;
        const itemProfit = (item.price - buyPrice) * item.quantity;

        if (!productMap[pId]) {
          productMap[pId] = {
            id: pId,
            name: item.product.name,
            category: item.product.category,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productMap[pId].quantity += item.quantity;
        productMap[pId].revenue += item.subtotal;
        productMap[pId].profit += itemProfit;

        const cat = item.product.category || 'Lainnya';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { quantity: 0, revenue: 0, profit: 0 };
        }
        categoryMap[cat].quantity += item.quantity;
        categoryMap[cat].revenue += item.subtotal;
        categoryMap[cat].profit += itemProfit;
      });
    });

    const grossProfit = totalRevenue - totalCost;

    // Filter expenses in period
    const periodExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = grossProfit - periodExpenses;
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';
    const averageBasket =
      filteredTransactions.length > 0 ? Math.round(totalRevenue / filteredTransactions.length) : 0;

    // Fast-moving & Slow-moving Products
    const topProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
    const deadProducts = products
      .filter((p) => !productMap[p.id])
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        stock: p.stock,
        unit: p.unit,
        assetValue: p.buyPrice * p.stock,
      }));

    // Stock calculations
    const totalPhysicalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const totalAssetStockValue = products.reduce((acc, p) => acc + p.buyPrice * p.stock, 0);
    const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const outOfStockProducts = products.filter((p) => p.stock <= 0);

    // Debts & Piutang Pelanggan
    const totalPiutang = debts
      .filter((d) => d.status === 'belum_lunas')
      .reduce((acc, d) => acc + d.remainingDebt, 0);
    const overdueDebts = debts.filter((d) => {
      if (d.status !== 'belum_lunas' || !d.dueDate) return false;
      return new Date(d.dueDate).getTime() < startOfToday;
    });

    // Supplier Purchases & Hutang Supplier
    const totalPurchasesAmount = purchases.reduce((acc, po) => acc + po.totalAmount, 0);
    const totalSupplierDebt = suppliers.reduce((acc, s) => acc + s.debt, 0);

    // Daily Trend Array for Charts
    const dailyChart = Object.values(dailyMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

    return {
      todayOmzet,
      todayLaba,
      todayTxCount,
      monthOmzet,
      monthLaba,
      monthTxCount,
      totalRevenue,
      totalCost,
      grossProfit,
      netProfit,
      profitMargin,
      totalItemsSold,
      averageBasket,
      totalCashSales,
      totalKasbonSales,
      totalQrisSales,
      totalTransferSales,
      totalDiscounts,
      totalReturns,
      periodExpenses,
      topProducts,
      deadProducts,
      categoryList: Object.entries(categoryMap).map(([name, val]) => ({ name, ...val })),
      customerList: Object.values(customerMap).sort((a, b) => b.total - a.total),
      cashierList: Object.values(cashierMap).sort((a, b) => b.total - a.total),
      totalPhysicalStock,
      totalAssetStockValue,
      lowStockProducts,
      outOfStockProducts,
      totalPiutang,
      overdueDebts,
      totalPurchasesAmount,
      totalSupplierDebt,
      dailyChart,
    };
  }, [
    transactions,
    filteredTransactions,
    products,
    expenses,
    debts,
    purchases,
    suppliers,
    users,
    startOfToday,
    startOfThisMonth,
  ]);

  // Handle adding custom operating expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newExpense.amount);
    if (isNaN(amt) || amt <= 0 || !newExpense.note.trim()) {
      alert('Harap isi nominal pengeluaran dan catatan dengan benar.');
      return;
    }
    const expItem: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      category: newExpense.category,
      amount: amt,
      note: newExpense.note.trim(),
    };
    setExpenses((prev) => [expItem, ...prev]);
    setNewExpense({ category: 'Operasional', amount: '', note: '' });
    setIsExpenseModalOpen(false);
  };

  // Dynamic available years list across purchases and sales
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const curYear = new Date().getFullYear().toString();
    yearsSet.add(curYear);
    yearsSet.add((parseInt(curYear, 10) - 1).toString());
    purchases.forEach((p) => {
      if (p.date && p.date.length >= 4) {
        yearsSet.add(p.date.slice(0, 4));
      }
    });
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 4) {
        yearsSet.add(t.date.slice(0, 4));
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [purchases, transactions]);

  // Filtered Purchases for Kulakan per Nota with search, month, year, supplier, and status
  const filteredPurchases = useMemo(() => {
    const result = purchases.filter((po) => {
      const q = purchaseSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        po.invoiceNo.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.items.some((i) => i.productName.toLowerCase().includes(q));

      const matchStatus =
        purchaseStatusFilter === 'all' ||
        (purchaseStatusFilter === 'lunas' && po.paymentStatus === 'lunas') ||
        (purchaseStatusFilter === 'hutang' && po.paymentStatus === 'hutang');

      const matchSupplier =
        purchaseSupplierFilter === 'all' ||
        po.supplierName.toLowerCase() === purchaseSupplierFilter.toLowerCase();

      const matchYear =
        purchaseYearFilter === 'all' || po.date.startsWith(purchaseYearFilter);

      const matchMonth =
        purchaseMonthFilter === 'all' || po.date.slice(5, 7) === purchaseMonthFilter;

      return matchSearch && matchStatus && matchSupplier && matchYear && matchMonth;
    });

    result.sort((a, b) => {
      if (purchaseSort === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (purchaseSort === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (purchaseSort === 'highest') return b.totalAmount - a.totalAmount;
      if (purchaseSort === 'lowest') return a.totalAmount - b.totalAmount;
      return 0;
    });

    return result;
  }, [
    purchases,
    purchaseSearch,
    purchaseStatusFilter,
    purchaseSupplierFilter,
    purchaseYearFilter,
    purchaseMonthFilter,
    purchaseSort,
  ]);

  // Monthly purchases breakdown table for chosen recap year
  const monthlyPurchaseBreakdown = useMemo(() => {
    const months = [
      { num: '01', name: 'Januari' },
      { num: '02', name: 'Februari' },
      { num: '03', name: 'Maret' },
      { num: '04', name: 'April' },
      { num: '05', name: 'Mei' },
      { num: '06', name: 'Juni' },
      { num: '07', name: 'Juli' },
      { num: '08', name: 'Agustus' },
      { num: '09', name: 'September' },
      { num: '10', name: 'Oktober' },
      { num: '11', name: 'November' },
      { num: '12', name: 'Desember' },
    ];

    const yearPurchases = purchases.filter((po) => po.date.startsWith(recapYear));
    const yearTotal = yearPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

    return months.map((m) => {
      const list = yearPurchases.filter((po) => po.date.slice(5, 7) === m.num);
      const total = list.reduce((acc, p) => acc + p.totalAmount, 0);
      const cashTotal = list
        .filter((p) => p.paymentType === 'tunai')
        .reduce((acc, p) => acc + p.totalAmount, 0);
      const debtTotal = list
        .filter((p) => p.paymentType === 'kredit')
        .reduce((acc, p) => acc + p.totalAmount, 0);
      const itemsCount = list.reduce(
        (acc, p) => acc + p.items.reduce((s, it) => s + it.quantity, 0),
        0
      );
      const percent = yearTotal > 0 ? (total / yearTotal) * 100 : 0;

      return {
        monthNum: m.num,
        monthName: m.name,
        count: list.length,
        total,
        cashTotal,
        debtTotal,
        itemsCount,
        percent,
        purchases: list,
      };
    });
  }, [purchases, recapYear]);

  // Active Selected Purchase for the Side Detail Panel
  const activePurchase = useMemo(() => {
    if (selectedPurchaseId) {
      const found = purchases.find((p) => p.id === selectedPurchaseId);
      if (found) return found;
    }
    return filteredPurchases[0] || purchases[0] || null;
  }, [purchases, selectedPurchaseId, filteredPurchases]);

  const activeSupplier = useMemo(() => {
    if (!activePurchase) return null;
    return (
      suppliers.find(
        (s) => s.name.toLowerCase() === activePurchase.supplierName.toLowerCase()
      ) || null
    );
  }, [suppliers, activePurchase]);

  const handleCopyPurchaseSummary = (po: PurchaseOrder) => {
    const text =
      `*BUKTI NOTA KULAKAN / PEMBELIAN*\n` +
      `No. Nota: ${po.invoiceNo}\n` +
      `Tanggal Masuk: ${new Date(po.date).toLocaleDateString('id-ID')} ${new Date(po.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n` +
      `Mitra Supplier: ${po.supplierName}\n` +
      `Status Bayar: ${po.paymentStatus.toUpperCase()} (${po.paymentType})\n` +
      (po.dueDate ? `Jatuh Tempo: ${po.dueDate}\n` : '') +
      `--------------------------------\n` +
      po.items
        .map(
          (i) =>
            `- ${i.productName}: ${i.quantity} unit x Rp ${i.costPrice.toLocaleString('id-ID')} = Rp ${i.subtotal.toLocaleString('id-ID')}`
        )
        .join('\n') +
      `\n--------------------------------\n` +
      `*TOTAL PEMBELIAN: Rp ${po.totalAmount.toLocaleString('id-ID')}*\n` +
      `Toko: ${storeProfile.storeName || 'Warungku'}\n` +
      `Status: Terverifikasi & Stok Toko Telah Bertambah`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedInvoiceId(po.id);
        setTimeout(() => setCopiedInvoiceId(null), 2500);
      });
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = [
      'No Invoice',
      'Tanggal',
      'Pelanggan',
      'Metode Bayar',
      'Total Omset (Rp)',
      'Modal HPP (Rp)',
      'Laba Bersih (Rp)',
      'Rincian Barang',
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.invoiceNumber,
      `"${formatDate(tx.date)}"`,
      `"${tx.customerName || 'Umum'}"`,
      tx.paymentMethod.toUpperCase(),
      tx.totalAmount,
      tx.totalCost,
      tx.profit || tx.totalAmount - tx.totalCost,
      `"${tx.items.map((i) => `${i.product.name} (${i.quantity})`).join(', ')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Komplit_${activeTab}_${filterPeriod}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp summary
  const handleShareWhatsApp = () => {
    const text =
      `📊 *REKAP LAPORAN KEUANGAN ${storeProfile.storeName.toUpperCase()}*\n` +
      `Tanggal: ${formatShortDate(new Date().toISOString())}\n\n` +
      `💰 *Omset Hari Ini:* ${formatRupiah(metrics.todayOmzet)}\n` +
      `📈 *Laba Hari Ini:* ${formatRupiah(metrics.todayLaba)}\n` +
      `🛒 *Transaksi Hari Ini:* ${metrics.todayTxCount} struk\n\n` +
      `🗓️ *Omset Bulan Ini:* ${formatRupiah(metrics.monthOmzet)}\n` +
      `📈 *Laba Bulan Ini:* ${formatRupiah(metrics.monthLaba)}\n\n` +
      `📦 *Aset Stok Toko:* ${formatRupiah(metrics.totalAssetStockValue)}\n` +
      `📋 *Total Piutang Kasbon:* ${formatRupiah(metrics.totalPiutang)}\n` +
      `🚚 *Hutang ke Supplier:* ${formatRupiah(metrics.totalSupplierDebt)}\n\n` +
      `_Dihasilkan otomatis oleh Aplikasi Warungku POS._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 pb-28 space-y-5">
      {/* Top Banner & Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#005AE0] text-white flex items-center justify-center font-bold shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Pusat Laporan & Analitik Bisnis Warung
              </h2>
              <p className="text-xs text-slate-500">
                Data real-time keuangan, stok, hutang piutang, supplier & kasir di {storeProfile.storeName}
              </p>
            </div>
          </div>
        </div>

        {/* Global Report Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 py-2 px-3 bg-[#25D366] hover:bg-[#1ebd5b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim WA</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* 8 MASTER REPORT MODULE TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
        {[
          { key: 'dashboard', label: 'Dashboard & Analitik', icon: TrendingUp },
          { key: 'sales', label: 'Laporan Penjualan', icon: ShoppingBag },
          { key: 'financial', label: 'Laporan Keuangan & Kas', icon: Wallet },
          { key: 'stock', label: 'Laporan Stok & Opname', icon: Package },
          { key: 'purchases', label: 'Laporan Pembelian', icon: Truck },
          { key: 'customers', label: 'Laporan Pelanggan & Piutang', icon: Users },
          { key: 'suppliers', label: 'Laporan Supplier', icon: BookOpen },
          { key: 'cashiers', label: 'Laporan Kasir & Shift', icon: UserCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as ReportCategory)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-[#005AE0] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Period Filter Selector */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Filter Waktu:</span>
          </span>
          {[
            { key: 'today', label: 'Hari Ini' },
            { key: 'yesterday', label: 'Kemarin' },
            { key: 'week', label: '7 Hari' },
            { key: 'month', label: 'Bulan Ini' },
            { key: 'last_month', label: 'Bulan Lalu' },
            { key: 'all', label: 'Semua' },
            { key: 'custom', label: 'Kustom' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterPeriod(item.key as any)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === item.key
                  ? 'bg-[#005AE0] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filterPeriod === 'custom' && (
          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="py-1 px-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="py-1 px-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. TAB: DASHBOARD & ANALITIK                             */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {/* Main Analytics Cards: Today vs This Month */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Omzet Hari Ini */}
            <div className="bg-white p-4 rounded-3xl border border-blue-100 shadow-xs space-y-1 relative overflow-hidden">
              <span className="text-blue-700 text-xs font-bold block">Omzet Hari Ini</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
                {formatRupiah(metrics.todayOmzet)}
              </p>
              <p className="text-[11px] text-slate-500">
                {metrics.todayTxCount} transaksi hari ini
              </p>
            </div>

            {/* Laba Hari Ini */}
            <div className="bg-emerald-50/70 p-4 rounded-3xl border border-emerald-200 shadow-xs space-y-1">
              <span className="text-emerald-800 text-xs font-extrabold block">Laba Bersih Hari Ini</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tabular-nums">
                {formatRupiah(metrics.todayLaba)}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">Keuntungan murni hari berjalan</p>
            </div>

            {/* Omzet Bulan Ini */}
            <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-xs space-y-1">
              <span className="text-purple-700 text-xs font-bold block">Omzet Bulan Ini</span>
              <p className="text-xl sm:text-2xl font-black text-purple-900 font-mono tabular-nums">
                {formatRupiah(metrics.monthOmzet)}
              </p>
              <p className="text-[11px] text-slate-500">
                {metrics.monthTxCount} transaksi total bulan ini
              </p>
            </div>

            {/* Laba Bulan Ini */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-700 text-xs font-bold block">Laba Bersih Bulan Ini</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
                {formatRupiah(metrics.monthLaba)}
              </p>
              <p className="text-[11px] text-slate-500">Akumulasi keuntungan bulan ini</p>
            </div>
          </div>

          {/* Secondary KPIs: Rata-rata transaksi, Produk & Kategori Terlaris */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">Rata-rata Nilai Transaksi</span>
              <span className="font-black text-slate-900 text-base font-mono">
                {formatRupiah(metrics.averageBasket)}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">Total Barang Terjual</span>
              <span className="font-black text-slate-900 text-base">
                {metrics.totalItemsSold} <span className="text-xs text-slate-500 font-normal">Pcs</span>
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">Produk Terlaris</span>
              <span className="font-black text-slate-900 text-xs sm:text-sm truncate block">
                {metrics.topProducts[0]?.name || 'Belum ada'}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">Kategori Terlaris</span>
              <span className="font-black text-slate-900 text-sm">
                {metrics.categoryList[0]?.name || 'Sembako'}
              </span>
            </div>
          </div>

          {/* Visual Charts: Grafik Penjualan & Grafik Keuntungan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Grafik Penjualan Harian */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Grafik Penjualan Harian (Omzet)</h3>
                  <p className="text-xs text-slate-500">Tren pendapatan harian pada periode ini</p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700">
                  {formatRupiah(metrics.totalRevenue)}
                </span>
              </div>

              {metrics.dailyChart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">Belum ada data grafik</div>
              ) : (
                <div className="space-y-3 pt-2">
                  {metrics.dailyChart.map((d) => {
                    const maxRev = Math.max(...metrics.dailyChart.map((x) => x.revenue), 1);
                    const pct = Math.round((d.revenue / maxRev) * 100);
                    return (
                      <div key={d.date} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-600">{formatShortDate(d.date)}</span>
                          <span className="font-bold text-slate-900">{formatRupiah(d.revenue)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-[#005AE0] h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Grafik Keuntungan Harian */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Grafik Keuntungan Harian (Laba)</h3>
                  <p className="text-xs text-slate-500">Margin laba bersih per hari</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  +{formatRupiah(metrics.grossProfit)}
                </span>
              </div>

              {metrics.dailyChart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">Belum ada data grafik</div>
              ) : (
                <div className="space-y-3 pt-2">
                  {metrics.dailyChart.map((d) => {
                    const maxProf = Math.max(...metrics.dailyChart.map((x) => x.profit), 1);
                    const pct = Math.round((d.profit / maxProf) * 100);
                    return (
                      <div key={d.date} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-600">{formatShortDate(d.date)}</span>
                          <span className="font-bold text-emerald-700">+{formatRupiah(d.profit)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAB: LAPORAN PENJUALAN                                */}
      {/* ========================================================= */}
      {activeTab === 'sales' && (
        <div className="space-y-5">
          {/* Sales KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Total Omzet Penjualan</span>
              <span className="text-xl font-black text-slate-900 font-mono block">
                {formatRupiah(metrics.totalRevenue)}
              </span>
              <span className="text-[11px] text-slate-400">{filteredTransactions.length} transaksi</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Penjualan Tunai</span>
              <span className="text-xl font-black text-emerald-700 font-mono block">
                {formatRupiah(metrics.totalCashSales)}
              </span>
              <span className="text-[11px] text-slate-400">Langsung masuk laci kas</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Penjualan Kredit (Kasbon)</span>
              <span className="text-xl font-black text-rose-600 font-mono block">
                {formatRupiah(metrics.totalKasbonSales)}
              </span>
              <span className="text-[11px] text-slate-400">Masuk buku piutang warga</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">QRIS & Transfer</span>
              <span className="text-xl font-black text-blue-700 font-mono block">
                {formatRupiah(metrics.totalQrisSales + metrics.totalTransferSales)}
              </span>
              <span className="text-[11px] text-slate-400">Penerimaan non-tunai</span>
            </div>
          </div>

          {/* Penjualan per Produk & Penjualan per Kategori */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Penjualan per Produk */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#005AE0]" />
                <span>Penjualan per Produk</span>
              </h3>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-3 text-center">Terjual</th>
                      <th className="py-2 px-3 text-right">Omzet</th>
                      <th className="py-2 px-3 text-right">Laba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.topProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400">{p.category}</span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold">{p.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(p.revenue)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">
                          +{formatRupiah(p.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Penjualan per Kategori & per Kasir */}
            <div className="space-y-4">
              {/* Penjualan per Kategori */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <span>Penjualan per Kategori</span>
                </h3>
                <div className="space-y-2">
                  {metrics.categoryList.map((cat) => (
                    <div key={cat.name} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{cat.name}</span>
                        <span className="text-[10px] text-slate-500">{cat.quantity} unit laku</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-900 block">{formatRupiah(cat.revenue)}</span>
                        <span className="text-[10px] text-emerald-700">Laba +{formatRupiah(cat.profit)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Penjualan per Kasir */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Penjualan per Kasir</span>
                </h3>
                <div className="space-y-2">
                  {metrics.cashierList.map((c) => (
                    <div key={c.name} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[10px] text-slate-500">{c.count} transaksi ditangani</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB: LAPORAN KEUANGAN & ARUS KAS                       */}
      {/* ========================================================= */}
      {activeTab === 'financial' && (
        <div className="space-y-5">
          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Laba Kotor (Gross Profit)</span>
              <span className="text-xl font-black text-slate-900 font-mono block">
                {formatRupiah(metrics.grossProfit)}
              </span>
              <span className="text-[11px] text-slate-400">Margin {metrics.profitMargin}%</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
              <span className="text-xs text-rose-600 font-semibold block">Pengeluaran Operasional</span>
              <span className="text-xl font-black text-rose-700 font-mono block">
                {formatRupiah(metrics.periodExpenses)}
              </span>
              <span className="text-[11px] text-slate-400">Listrik, kresek, bensin kulakan</span>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-3xl border border-emerald-200 shadow-xs">
              <span className="text-xs text-emerald-800 font-extrabold block">Laba Bersih Toko (Net Profit)</span>
              <span className="text-xl font-black text-emerald-700 font-mono block">
                {formatRupiah(metrics.netProfit)}
              </span>
              <span className="text-[11px] text-emerald-700">Laba kotor dikurangi biaya</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-blue-100 shadow-xs">
              <span className="text-xs text-blue-700 font-bold block">Saldo Kas Operasional</span>
              <span className="text-xl font-black text-blue-900 font-mono block">
                {formatRupiah(metrics.totalCashSales - metrics.periodExpenses)}
              </span>
              <span className="text-[11px] text-slate-400">Uang tunai bersih di toko</span>
            </div>
          </div>

          {/* Arus Kas & Pengeluaran Toko */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Arus Kas Masuk vs Keluar (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#005AE0]" />
                <span>Ringkasan Arus Kas (Cash Flow)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-900 block">Arus Kas Masuk (Cash In)</span>
                    <span className="text-[10px] text-emerald-700">Penjualan tunai kasir</span>
                  </div>
                  <span className="font-black font-mono text-emerald-700 text-sm">
                    +{formatRupiah(metrics.totalCashSales)}
                  </span>
                </div>

                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-rose-900 block">Arus Kas Keluar (Cash Out)</span>
                    <span className="text-[10px] text-rose-700">Beban operasional & kulakan</span>
                  </div>
                  <span className="font-black font-mono text-rose-700 text-sm">
                    -{formatRupiah(metrics.periodExpenses)}
                  </span>
                </div>

                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-blue-900 block">Net Saldo Kas Bersih</span>
                    <span className="text-[10px] text-blue-700">Kas masuk dikurangi kas keluar</span>
                  </div>
                  <span className="font-black font-mono text-blue-900 text-sm">
                    {formatRupiah(metrics.totalCashSales - metrics.periodExpenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* Buku Pengeluaran Operasional Toko (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Buku Pengeluaran Operasional</h3>
                  <p className="text-xs text-slate-500">Mencatat biaya listrik, kresek, bensin, dll</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Pengeluaran</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-3">Keterangan</th>
                      <th className="py-2 px-3 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                          {formatShortDate(exp.date)}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">{exp.note}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                          -{formatRupiah(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB: LAPORAN STOK & OPNAME                             */}
      {/* ========================================================= */}
      {activeTab === 'stock' && (
        <div className="space-y-5">
          {/* Stock KPI Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Total Unit Fisik Stok</span>
              <span className="text-xl font-black text-slate-900 font-mono block">
                {metrics.totalPhysicalStock} <span className="text-xs text-slate-400 font-normal">Pcs</span>
              </span>
              <span className="text-[11px] text-slate-400">{products.length} ragam varian barang</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Nilai Aset Modal Stok</span>
              <span className="text-xl font-black text-slate-900 font-mono block">
                {formatRupiah(metrics.totalAssetStockValue)}
              </span>
              <span className="text-[11px] text-slate-400">Modal tertanam di rak toko</span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-3xl border border-amber-200 shadow-xs">
              <span className="text-xs text-amber-800 font-bold block">Produk Hampir Habis</span>
              <span className="text-xl font-black text-amber-700 font-mono block">
                {metrics.lowStockProducts.length} <span className="text-xs font-normal">item</span>
              </span>
              <span className="text-[11px] text-amber-700 font-medium">Di bawah batas minimum</span>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-3xl border border-rose-200 shadow-xs">
              <span className="text-xs text-rose-800 font-bold block">Produk Habis (Stok 0)</span>
              <span className="text-xl font-black text-rose-700 font-mono block">
                {metrics.outOfStockProducts.length} <span className="text-xs font-normal">item</span>
              </span>
              <span className="text-[11px] text-rose-700 font-medium">Perlu segera restock kulakan</span>
            </div>
          </div>

          {/* Fast Moving vs Dead Stock & Penyesuaian Opname */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Produk Tidak Laku / Kurang Laku (Dead Stock) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Produk Tidak Laku / Kurang Laku (Dead Stock)</span>
                </h3>
                <p className="text-xs text-slate-500">Barang yang belum terjual sama sekali pada periode ini</p>
              </div>

              {metrics.deadProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Semua barang aktif terjual!</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {metrics.deadProducts.map((p) => (
                    <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">{p.name}</span>
                        <span className="text-[10px] text-slate-500">Sisa stok: {p.stock} {p.unit}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-slate-700 block font-semibold">{formatRupiah(p.assetValue)}</span>
                        <span className="text-[9px] text-rose-600 font-bold">Modal tertahan</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Riwayat Penyesuaian Stok (Stock Opname) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#005AE0]" />
                  <span>Selisih Stok Fisik vs Sistem (Opname)</span>
                </h3>
                <p className="text-xs text-slate-500">Pencatatan selisih barang rusak, hilang atau bonus</p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {stockAdjustments.map((adj) => (
                  <div key={adj.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{adj.productName}</span>
                      <span
                        className={`font-mono font-black px-2 py-0.5 rounded text-[11px] ${
                          adj.difference < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {adj.difference > 0 ? `+${adj.difference}` : adj.difference} unit
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Sistem: {adj.systemStock} → Fisik: {adj.physicalStock}</span>
                      <span>{formatShortDate(adj.date)}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 italic">Alasan: {adj.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB: LAPORAN PEMBELIAN & KULAKAN                      */}
      {/* ========================================================= */}
      {activeTab === 'purchases' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Total Nilai Pembelian Kulakan</span>
              <span className="text-xl font-black text-slate-900 font-mono block">
                {formatRupiah(metrics.totalPurchasesAmount)}
              </span>
              <span className="text-[11px] text-slate-400">{purchases.length} nota pembelian</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Pembelian Tunai</span>
              <span className="text-xl font-black text-emerald-700 font-mono block">
                {formatRupiah(purchases.filter((p) => p.paymentType === 'tunai').reduce((a, b) => a + b.totalAmount, 0))}
              </span>
              <span className="text-[11px] text-slate-400">Lunas dibayar</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
              <span className="text-xs text-rose-700 font-bold block">Hutang ke Supplier (Kredit)</span>
              <span className="text-xl font-black text-rose-700 font-mono block">
                {formatRupiah(metrics.totalSupplierDebt)}
              </span>
              <span className="text-[11px] text-rose-600">Jatuh tempo berjalan</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Total Mitra Supplier</span>
              <span className="text-xl font-black text-slate-900 font-mono block">
                {suppliers.length} <span className="text-xs font-normal">agen/distributor</span>
              </span>
              <span className="text-[11px] text-slate-400">Pemasok resmi warung</span>
            </div>
          </div>

          {/* Safe Storage Protection Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Catatan Jual-Beli Terproteksi & Tersimpan Aman</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h4>
                <p className="text-[11px] text-slate-600">
                  Semua nota kulakan supplier dan transaksi kasir tersimpan permanen di perangkat & ter-backup otomatis ke IndexedDB anti-hilang.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="px-3 py-1 bg-white/90 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 shadow-2xs font-mono">
                {purchases.length} Nota Pembelian
              </span>
              <span className="px-3 py-1 bg-white/90 border border-blue-200 rounded-xl text-[11px] font-bold text-blue-800 shadow-2xs font-mono">
                {transactions.length} Struk Penjualan
              </span>
            </div>
          </div>

          {/* View Mode Switcher: Riwayat per Nota vs Rekap Bulanan & Tahunan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setPurchaseViewMode('invoices')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  purchaseViewMode === 'invoices'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Riwayat per Nota & Detail Samping</span>
              </button>
              <button
                type="button"
                onClick={() => setPurchaseViewMode('recap')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  purchaseViewMode === 'recap'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-4 h-4 text-blue-600" />
                <span>Rekap Bulanan & Tahunan</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPurchaseProductId(products[0]?.id || '');
                setPurchaseQty('10');
                setPurchaseCost(products[0]?.buyPrice?.toString() || '15000');
                setPurchaseSupplier(suppliers[0]?.name || 'Agen Sembako Makmur Jaya');
                setIsCustomSupplierPO(false);
                setCustomSupplierPOInput('');
                setPurchasePaymentType('tunai');
                const d = new Date();
                d.setDate(d.getDate() + 14);
                setPurchaseDueDate(d.toISOString().slice(0, 10));
                setPurchaseReceivedDate(new Date().toISOString().slice(0, 10));
                setPurchaseNote('');
                setIsPurchaseModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all self-stretch sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Barang Masuk dari Supplier</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* VIEW MODE 1: RIWAYAT PER NOTA DENGAN DETAIL DI SAMPING   */}
          {/* ========================================================= */}
          {purchaseViewMode === 'invoices' && (
            <div className="space-y-4">
              {/* Header & Advanced Filter Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-600" />
                      <span>Daftar Nota Pembelian & Kulakan</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Klik salah satu nota untuk melihat semua transaksi & rincian catatan lengkapnya di panel samping
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Menampilkan <strong className="text-slate-900">{filteredPurchases.length}</strong> dari {purchases.length} nota
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari No. Faktur (PO), Nama Supplier, atau Nama Barang Masuk..."
                    value={purchaseSearch}
                    onChange={(e) => setPurchaseSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                  />
                  {purchaseSearch && (
                    <button
                      type="button"
                      onClick={() => setPurchaseSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Multi-Filters: Tahun, Bulan, Supplier, Status, Urutan */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
                  {/* Filter Tahun */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Tahun:</label>
                    <select
                      value={purchaseYearFilter}
                      onChange={(e) => setPurchaseYearFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Tahun</option>
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          Tahun {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Bulan */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Bulan:</label>
                    <select
                      value={purchaseMonthFilter}
                      onChange={(e) => setPurchaseMonthFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Bulan</option>
                      <option value="01">01 - Januari</option>
                      <option value="02">02 - Februari</option>
                      <option value="03">03 - Maret</option>
                      <option value="04">04 - April</option>
                      <option value="05">05 - Mei</option>
                      <option value="06">06 - Juni</option>
                      <option value="07">07 - Juli</option>
                      <option value="08">08 - Agustus</option>
                      <option value="09">09 - September</option>
                      <option value="10">10 - Oktober</option>
                      <option value="11">11 - November</option>
                      <option value="12">12 - Desember</option>
                    </select>
                  </div>

                  {/* Filter Supplier */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Mitra Supplier:</label>
                    <select
                      value={purchaseSupplierFilter}
                      onChange={(e) => setPurchaseSupplierFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 truncate"
                    >
                      <option value="all">Semua Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Status Bayar */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Status Bayar:</label>
                    <select
                      value={purchaseStatusFilter}
                      onChange={(e) => setPurchaseStatusFilter(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Status</option>
                      <option value="lunas">✓ Lunas (Tunai)</option>
                      <option value="hutang">⏳ Hutang Tempo</option>
                    </select>
                  </div>

                  {/* Urutan Sort */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Urutan:</label>
                    <select
                      value={purchaseSort}
                      onChange={(e) => setPurchaseSort(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="newest">Terbaru</option>
                      <option value="oldest">Terlama</option>
                      <option value="highest">Nominal Tertinggi</option>
                      <option value="lowest">Nominal Terendah</option>
                    </select>
                  </div>
                </div>

                {/* Reset filter shortcut if active */}
                {(purchaseSearch ||
                  purchaseYearFilter !== 'all' ||
                  purchaseMonthFilter !== 'all' ||
                  purchaseSupplierFilter !== 'all' ||
                  purchaseStatusFilter !== 'all') && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 text-[11px]">Filter pencarian aktif</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseSearch('');
                        setPurchaseYearFilter('all');
                        setPurchaseMonthFilter('all');
                        setPurchaseSupplierFilter('all');
                        setPurchaseStatusFilter('all');
                      }}
                      className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Semua Filter</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Split View: List on Left (7 cols), Side Detail on Right (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Daftar Nota Kulakan */}
                <div className="lg:col-span-7 space-y-3">
                  {filteredPurchases.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-700 text-sm">Tidak ada nota kulakan yang cocok</p>
                      <p className="text-xs text-slate-400">
                        Coba sesuaikan kata kunci pencarian atau ganti filter bulan/tahun.
                      </p>
                    </div>
                  ) : (
                    filteredPurchases.map((po) => {
                      const isSelected = activePurchase?.id === po.id;
                      const totalQty = po.items.reduce((acc, i) => acc + i.quantity, 0);

                      return (
                        <div
                          key={po.id}
                          onClick={() => setSelectedPurchaseId(po.id)}
                          className={`p-4 rounded-3xl border transition-all cursor-pointer text-xs space-y-2.5 ${
                            isSelected
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60 shadow-xs'
                          }`}
                        >
                          {/* Top row: Invoice No, Status, and Date */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                                {po.invoiceNo}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  po.paymentStatus === 'lunas'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {po.paymentStatus === 'lunas' ? 'LUNAS (TUNAI)' : 'HUTANG TEMPO'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                              {formatShortDate(po.date)}
                            </span>
                          </div>

                          {/* Supplier Info & Items count */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[260px]">{po.supplierName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              <span>{po.items.length} macam barang ({totalQty} unit)</span>
                            </div>
                          </div>

                          {/* Items preview snippet */}
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic bg-white/70 p-2 rounded-xl border border-slate-100">
                            {po.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                          </p>

                          {/* Bottom Row: Total Amount & Action Buttons */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[11px] text-slate-500">Total Kulakan:</span>
                              <span className="font-mono font-black text-slate-900 text-sm sm:text-base text-emerald-800">
                                {formatRupiah(po.totalAmount)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-bold">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingDetailPurchase(po);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Lihat Catatan Detail</span>
                              </button>

                              {isSelected ? (
                                <span className="text-emerald-700 flex items-center gap-1 font-extrabold">
                                  <Check className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Di Samping</span>
                                </span>
                              ) : (
                                <span className="text-blue-600 hover:underline flex items-center gap-0.5">
                                  <span>Pilih</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right Column: Panel Detail di Sampingnya ketika di-klik */}
                <div className="lg:col-span-5 sticky top-20">
                  {activePurchase ? (
                    <div className="bg-white rounded-3xl border-2 border-emerald-500/30 shadow-lg p-5 space-y-4 text-xs animate-in fade-in duration-200">
                      {/* Header Detail Nota */}
                      <div className="pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                            Detail Nota di Samping
                          </span>
                          <h4 className="font-black text-slate-900 text-base font-mono">
                            {activePurchase.invoiceNo}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Tanggal Masuk: {formatDate(activePurchase.date)}
                          </p>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                              activePurchase.paymentStatus === 'lunas'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {activePurchase.paymentStatus === 'lunas' ? 'LUNAS (TUNAI)' : 'HUTANG TEMPO'}
                          </span>
                          {activePurchase.dueDate && (
                            <span className="block text-[10px] text-rose-600 font-bold mt-1">
                              Jatuh Tempo: {formatShortDate(activePurchase.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Supplier */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Informasi Mitra Supplier</span>
                          <Truck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 text-sm">{activePurchase.supplierName}</p>
                          {activeSupplier && (
                            <div className="space-y-0.5 text-[11px] text-slate-600">
                              {activeSupplier.contactPerson && (
                                <p className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Kontak / Sales: {activeSupplier.contactPerson}</span>
                                </p>
                              )}
                              {activeSupplier.phone && activeSupplier.phone !== '-' && (
                                <p className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-mono">{activeSupplier.phone}</span>
                                </p>
                              )}
                              {activeSupplier.address && activeSupplier.address !== '-' && (
                                <p className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{activeSupplier.address}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rincian Barang yang Diterima */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-xs">Rincian Barang per Nota:</span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {activePurchase.items.length} item
                          </span>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                              <tr>
                                <th className="py-2 px-2.5">Barang</th>
                                <th className="py-2 px-2 text-center">Qty</th>
                                <th className="py-2 px-2 text-right">Modal</th>
                                <th className="py-2 px-2.5 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activePurchase.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60">
                                  <td className="py-2 px-2.5 font-bold text-slate-900">{item.productName}</td>
                                  <td className="py-2 px-2 text-center font-mono font-bold text-blue-700 bg-blue-50/50">
                                    {item.quantity}
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono text-slate-600">
                                    {formatRupiah(item.costPrice)}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono font-black text-slate-900">
                                    {formatRupiah(item.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Status Sinkronisasi Stok */}
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-900">
                        <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Stok Terverifikasi:</strong> Jumlah barang pada nota ini telah otomatis ditambahkan ke stok inventaris toko.
                        </span>
                      </div>

                      {/* Total Pembelian Summary Box */}
                      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-slate-300 text-xs">
                          <span>Total Jumlah Fisik Barang:</span>
                          <span className="font-mono font-bold text-white">
                            {activePurchase.items.reduce((acc, i) => acc + i.quantity, 0)} unit
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span>Tipe Pembayaran:</span>
                          <span className="font-bold uppercase tracking-wider text-emerald-400">
                            {activePurchase.paymentStatus} ({activePurchase.paymentType})
                          </span>
                        </div>
                        <div className="border-t border-slate-700 pt-2 flex justify-between items-baseline">
                          <span className="font-bold text-xs">TOTAL NILAI KULAKAN:</span>
                          <span className="font-mono font-black text-base sm:text-lg text-emerald-400">
                            {formatRupiah(activePurchase.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons for this specific Purchase Order */}
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingDetailPurchase(activePurchase)}
                            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Maximize2 className="w-4 h-4" />
                            <span>Buka Layar Penuh</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsPurchaseReceiptModalOpen(true)}
                            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-slate-600" />
                            <span>Cetak Struk</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyPurchaseSummary(activePurchase)}
                          className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            copiedInvoiceId === activePurchase.id
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {copiedInvoiceId === activePurchase.id ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-700" />
                              <span>Ringkasan Tersalin ke Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-slate-500" />
                              <span>Salin Ringkasan Nota</span>
                            </>
                          )}
                        </button>

                        {/* Quick Pay Supplier Debt button if debt is pending */}
                        {activePurchase.paymentStatus === 'hutang' && activeSupplier && activeSupplier.debt > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayingSupplier(activeSupplier);
                              setPayAmount(activeSupplier.debt.toString());
                            }}
                            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <span>Bayar Hutang ke {activeSupplier.name} ({formatRupiah(activeSupplier.debt)})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">Pilih Nota Kulakan</p>
                      <p className="text-xs">Klik salah satu nota di daftar sebelah kiri untuk menampilkan rincian barang dan supplier.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW MODE 2: REKAP LAPORAN BULANAN & TAHUNAN              */}
          {/* ========================================================= */}
          {purchaseViewMode === 'recap' && (
            <div className="space-y-4">
              {/* Year Selector Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    <span>Laporan Rekapitulasi Pembelian Bulanan & Tahunan</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Analisis total pengeluaran kulakan per bulan dan per tahun agar semua catatan mudah dipantau
                  </p>
                </div>

                {/* Year Buttons */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold self-start sm:self-auto">
                  <span className="text-slate-500 text-[11px] px-2 font-medium">Tahun:</span>
                  {availableYears.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setRecapYear(yr)}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        recapYear === yr
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Yearly Summary Metric Cards for Selected Year */}
              {(() => {
                const yearList = purchases.filter((po) => po.date.startsWith(recapYear));
                const yearTotal = yearList.reduce((acc, p) => acc + p.totalAmount, 0);
                const yearCash = yearList
                  .filter((p) => p.paymentType === 'tunai')
                  .reduce((acc, p) => acc + p.totalAmount, 0);
                const yearDebt = yearList
                  .filter((p) => p.paymentType === 'kredit')
                  .reduce((acc, p) => acc + p.totalAmount, 0);
                const yearUnits = yearList.reduce(
                  (acc, p) => acc + p.items.reduce((s, it) => s + it.quantity, 0),
                  0
                );

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 block">Total Kulakan Tahun {recapYear}</span>
                      <span className="text-xl font-black text-slate-900 font-mono block">
                        {formatRupiah(yearTotal)}
                      </span>
                      <span className="text-[11px] text-slate-400">{yearList.length} nota kulakan masuk</span>
                    </div>

                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 block">Pembelian Tunai (Lunas)</span>
                      <span className="text-xl font-black text-emerald-700 font-mono block">
                        {formatRupiah(yearCash)}
                      </span>
                      <span className="text-[11px] text-slate-400">Pembayaran langsung</span>
                    </div>

                    <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs space-y-1">
                      <span className="text-xs text-rose-700 font-bold block">Pembelian Tempo (Hutang)</span>
                      <span className="text-xl font-black text-rose-700 font-mono block">
                        {formatRupiah(yearDebt)}
                      </span>
                      <span className="text-[11px] text-rose-600">Tagihan kredit supplier</span>
                    </div>

                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                      <span className="text-xs text-slate-500 block">Total Unit Barang Diterima</span>
                      <span className="text-xl font-black text-blue-700 font-mono block">
                        {yearUnits} <span className="text-xs font-normal">pcs/unit</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Masuk ke inventaris toko</span>
                    </div>
                  </div>
                );
              })()}

              {/* 12-Month Table Breakdown for Selected Year */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Rincian Kulakan per Bulan (Januari - Desember {recapYear})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Klik "Lihat Nota Bulan Ini" untuk membuka daftar nota dan catatan detailnya
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    Tahun Terpilih: {recapYear}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Bulan</th>
                        <th className="py-2.5 px-3 text-center">Jumlah Nota</th>
                        <th className="py-2.5 px-3 text-center">Unit Barang</th>
                        <th className="py-2.5 px-3 text-right">Tunai (Rp)</th>
                        <th className="py-2.5 px-3 text-right">Hutang (Rp)</th>
                        <th className="py-2.5 px-3 text-right">Total Kulakan (Rp)</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Porsi Tahunan</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyPurchaseBreakdown.map((row) => (
                        <tr key={row.monthNum} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {row.monthName} {recapYear}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {row.count > 0 ? (
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md">{row.count} nota</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {row.itemsCount > 0 ? `${row.itemsCount} unit` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                            {row.cashTotal > 0 ? formatRupiah(row.cashTotal) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                            {row.debtTotal > 0 ? formatRupiah(row.debtTotal) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            {row.total > 0 ? formatRupiah(row.total) : 'Rp 0'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, Math.round(row.percent))}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 w-8 text-right">
                                {Math.round(row.percent)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row.count > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPurchaseViewMode('invoices');
                                  setPurchaseYearFilter(recapYear);
                                  setPurchaseMonthFilter(row.monthNum);
                                  if (row.purchases.length > 0) {
                                    setSelectedPurchaseId(row.purchases[0].id);
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] cursor-pointer transition-colors border border-emerald-200"
                              >
                                Lihat Nota ↗
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">Kosong</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TAB: LAPORAN PELANGGAN & PIUTANG                      */}
      {/* ========================================================= */}
      {activeTab === 'customers' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Total Piutang Belum Lunas</span>
              <span className="text-xl font-black text-rose-600 font-mono block">
                {formatRupiah(metrics.totalPiutang)}
              </span>
              <span className="text-[11px] text-slate-400">Kasbon warga belum bayar</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Piutang Lewat Jatuh Tempo</span>
              <span className="text-xl font-black text-rose-700 font-mono block">
                {metrics.overdueDebts.length} <span className="text-xs font-normal">warga</span>
              </span>
              <span className="text-[11px] text-rose-600">Perlu ditagih via WA</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Pelanggan Paling Aktif</span>
              <span className="text-xl font-black text-slate-900 truncate block">
                {metrics.customerList[0]?.name || 'Umum'}
              </span>
              <span className="text-[11px] text-slate-400">Total belanja tertinggi</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">Jumlah Pelanggan Tercatat</span>
              <span className="text-xl font-black text-slate-900 font-mono block">
                {metrics.customerList.length} <span className="text-xs font-normal">orang</span>
              </span>
              <span className="text-[11px] text-slate-400">Data transaksi toko</span>
            </div>
          </div>

          {/* Tabel Pelanggan & Status Piutang */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm">Daftar Pelanggan, Total Belanja & Buku Piutang</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Nama Pelanggan</th>
                    <th className="py-2.5 px-3 text-center">Frekuensi Belanja</th>
                    <th className="py-2.5 px-3 text-right">Total Belanja</th>
                    <th className="py-2.5 px-3 text-right">Laba Dihasilkan</th>
                    <th className="py-2.5 px-3 text-right">Sisa Kasbon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.customerList.map((cust) => {
                    const matchDebt = debts.find(
                      (d) => d.customerName.toLowerCase() === cust.name.toLowerCase()
                    );
                    const sisaKasbon = matchDebt && matchDebt.status === 'belum_lunas' ? matchDebt.remainingDebt : 0;
                    return (
                      <tr key={cust.name}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{cust.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold">{cust.count} kali</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(cust.total)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">+{formatRupiah(cust.profit)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600">
                          {sisaKasbon > 0 ? formatRupiah(sisaKasbon) : 'Lunas (Rp 0)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. TAB: LAPORAN SUPPLIER                                  */}
      {/* ========================================================= */}
      {activeTab === 'suppliers' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm">Daftar Pemasok, Kontak & Hutang Usaha Warung</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Nama Supplier / Agen</th>
                    <th className="py-2.5 px-3">Kontak & Sales</th>
                    <th className="py-2.5 px-3">Alamat</th>
                    <th className="py-2.5 px-3">Jatuh Tempo</th>
                    <th className="py-2.5 px-3 text-right">Sisa Hutang Kita</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {s.contactPerson} ({s.phone})
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{s.address || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {s.dueDate ? formatShortDate(s.dueDate) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black">
                        {s.debt > 0 ? (
                          <span className="text-rose-600">{formatRupiah(s.debt)}</span>
                        ) : (
                          <span className="text-emerald-700">Lunas (Rp 0)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {s.debt > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPayingSupplier(s);
                              setPayAmount(s.debt.toString());
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] cursor-pointer shadow-xs transition-colors"
                          >
                            Bayar Hutang
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Tidak ada hutang</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. TAB: LAPORAN KASIR & SHIFT                             */}
      {/* ========================================================= */}
      {activeTab === 'cashiers' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Rekap Tutup Shift & Audit Uang Kasir</h3>
                <p className="text-xs text-slate-500">Mencocokkan kas awal, kas masuk, kas keluar, dan selisih fisik</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Kasir & Shift</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3 text-right">Kas Awal</th>
                    <th className="py-2.5 px-3 text-right">Kas Masuk</th>
                    <th className="py-2.5 px-3 text-right">Kas Keluar</th>
                    <th className="py-2.5 px-3 text-right">Kas Seharusnya</th>
                    <th className="py-2.5 px-3 text-right">Kas Aktual Fisik</th>
                    <th className="py-2.5 px-3 text-right">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashierShifts.map((sh) => (
                    <tr key={sh.id}>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{sh.cashierName}</span>
                        <span className="text-[10px] text-slate-400">{sh.shiftName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{formatShortDate(sh.date)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(sh.initialCash)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">+{formatRupiah(sh.cashIn)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600">-{formatRupiah(sh.cashOut)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(sh.expectedCash)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">{formatRupiah(sh.actualCash)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black">
                        {sh.difference === 0 ? (
                          <span className="text-emerald-600">Pas (Rp 0)</span>
                        ) : sh.difference > 0 ? (
                          <span className="text-emerald-700">Lebih +{formatRupiah(sh.difference)}</span>
                        ) : (
                          <span className="text-rose-600">Kurang {formatRupiah(sh.difference)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catat Pengeluaran Operasional Baru */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Catat Pengeluaran Operasional Toko</h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Pengeluaran:</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Operasional">Operasional (Plastik/Kresek/Lakban)</option>
                  <option value="Utilitas">Utilitas (Listrik PLN/PDAM/Internet)</option>
                  <option value="Transportasi">Transportasi (Bensin Kulakan/Ongkir)</option>
                  <option value="Konsumsi">Konsumsi (Es Batu/Air Galon Warung)</option>
                  <option value="Lainnya">Pengeluaran Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Biaya (Rp):</label>
                <input
                  type="number"
                  min={100}
                  required
                  placeholder="Contoh: 50000"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Biaya:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli kresek hitam 2 ikat"
                  value={newExpense.note}
                  onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Catat Barang Masuk dari Supplier */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Catat Barang Masuk dari Supplier</h3>
                  <p className="text-[11px] text-slate-500">Stok barang di inventaris toko akan otomatis bertambah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const qtyNum = parseInt(purchaseQty, 10);
                const costNum = parseFloat(purchaseCost) || 0;
                if (!purchaseProductId || isNaN(qtyNum) || qtyNum <= 0) {
                  alert('Harap pilih barang dan masukkan jumlah stok yang valid.');
                  return;
                }

                const finalSup = isCustomSupplierPO
                  ? customSupplierPOInput.trim() || 'Supplier Umum'
                  : purchaseSupplier.trim() || 'Supplier Umum';

                if (onStockInFromSupplier) {
                  onStockInFromSupplier({
                    productId: purchaseProductId,
                    quantity: qtyNum,
                    supplierName: finalSup,
                    costPrice: costNum,
                    paymentType: purchasePaymentType,
                    dueDate: purchasePaymentType === 'kredit' ? purchaseDueDate : undefined,
                    receivedDate: purchaseReceivedDate,
                    note: purchaseNote.trim(),
                  });
                }
                setIsPurchaseModalOpen(false);
              }}
              className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto"
            >
              {/* Pilih Barang Toko */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Produk Toko:</label>
                <select
                  value={purchaseProductId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setPurchaseProductId(selId);
                    const selProd = products.find((p) => p.id === selId);
                    if (selProd) {
                      setPurchaseCost(selProd.buyPrice.toString());
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stock} {p.unit} | Modal: {formatRupiah(p.buyPrice)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mitra Supplier */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Nama Supplier / Agen Pemasok:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSupplierPO(!isCustomSupplierPO);
                      if (!isCustomSupplierPO) setCustomSupplierPOInput('');
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    {isCustomSupplierPO ? 'Pilih dari Daftar' : '+ Ketik Nama Baru'}
                  </button>
                </label>

                {isCustomSupplierPO ? (
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Grosir Berkah Pangan"
                    value={customSupplierPOInput}
                    onChange={(e) => setCustomSupplierPOInput(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                ) : (
                  <select
                    value={purchaseSupplier}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomSupplierPO(true);
                        setCustomSupplierPOInput('');
                      } else {
                        setPurchaseSupplier(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    {suppliers.length === 0 && (
                      <option value="Agen Sembako Makmur Jaya">Agen Sembako Makmur Jaya</option>
                    )}
                    <option value="__custom__">+ Tambah Supplier Baru...</option>
                  </select>
                )}
              </div>

              {/* Jumlah Qty & Harga Beli Modal Satuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Masuk (Unit):</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-base font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Modal Satuan (Rp):</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-base font-bold"
                  />
                </div>
              </div>

              {/* Status Pembayaran */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Metode Bayar:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPurchasePaymentType('tunai')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      purchasePaymentType === 'tunai'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>✓ Tunai (Lunas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchasePaymentType('kredit')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      purchasePaymentType === 'kredit'
                        ? 'bg-rose-50 border-rose-600 text-rose-800 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>⏳ Kredit (Hutang)</span>
                  </button>
                </div>
              </div>

              {purchasePaymentType === 'kredit' && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <label className="block font-bold text-rose-900 mb-1">Jatuh Tempo Pembayaran Supplier:</label>
                  <input
                    type="date"
                    required
                    value={purchaseDueDate}
                    onChange={(e) => setPurchaseDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-rose-300 rounded-lg font-mono text-xs bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Masuk:</label>
                  <input
                    type="date"
                    value={purchaseReceivedDate}
                    onChange={(e) => setPurchaseReceivedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Faktur / Catatan:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Faktur #8812"
                    value={purchaseNote}
                    onChange={(e) => setPurchaseNote(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-emerald-900 font-bold block">Total Tagihan Pembelian:</span>
                  <span className="text-[10px] text-emerald-700">Otomatis menambah stok produk & riwayat PO</span>
                </div>
                <span className="text-base font-black font-mono text-emerald-800">
                  {formatRupiah((parseInt(purchaseQty, 10) || 0) * (parseFloat(purchaseCost) || 0))}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Update Stok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bayar Hutang Supplier */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Bayar Hutang Supplier</h3>
              <button
                type="button"
                onClick={() => setPayingSupplier(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 space-y-1">
              <span className="text-[11px] text-slate-600 font-semibold block">{payingSupplier.name}</span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Sisa Hutang Berjalan:</span>
                <span className="font-black font-mono text-rose-700 text-sm">
                  {formatRupiah(payingSupplier.debt)}
                </span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = parseFloat(payAmount) || 0;
                if (amt <= 0) {
                  alert('Masukkan nominal pembayaran yang valid.');
                  return;
                }
                if (onPaySupplierDebt) {
                  onPaySupplierDebt(payingSupplier.id, amt);
                }
                setPayingSupplier(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Pembayaran (Rp):</label>
                <input
                  type="number"
                  min={100}
                  max={payingSupplier.debt}
                  required
                  autoFocus
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900"
                />
              </div>

              <div className="flex gap-1.5">
                {[payingSupplier.debt, payingSupplier.debt / 2].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPayAmount(Math.round(v).toString())}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-mono font-bold text-[10px] text-slate-700 cursor-pointer"
                  >
                    {v === payingSupplier.debt ? 'Bayar Lunas' : 'Bayar 50%'}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cetak Nota Kulakan & Bukti Pembelian Supplier */}
      {isPurchaseReceiptModalOpen && activePurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Cetak Nota Pembelian Kulakan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchaseReceiptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal / Paper Receipt Preview Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 font-mono text-xs text-slate-800 space-y-3 shadow-inner">
              {/* Receipt Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <p className="font-black text-sm text-slate-900 tracking-wide uppercase">
                  {storeProfile.storeName || 'WARUNG MADURA'}
                </p>
                <p className="text-[10px] text-slate-500">{storeProfile.address || 'Alamat Toko Warung'}</p>
                <p className="text-[10px] text-slate-500">{storeProfile.phone || '0812-3456-7890'}</p>
                <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest pt-1">
                  NOTA KULAKAN / BARANG MASUK
                </p>
              </div>

              {/* Invoice Meta */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Faktur:</span>
                  <span className="font-bold text-slate-900">{activePurchase.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span>{new Date(activePurchase.date).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mitra Supplier:</span>
                  <span className="font-bold text-slate-900">{activePurchase.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Bayar:</span>
                  <span
                    className={`font-black uppercase ${
                      activePurchase.paymentStatus === 'lunas' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {activePurchase.paymentStatus} ({activePurchase.paymentType})
                  </span>
                </div>
                {activePurchase.dueDate && (
                  <div className="flex justify-between text-rose-600">
                    <span>Jatuh Tempo:</span>
                    <span className="font-bold">{formatShortDate(activePurchase.dueDate)}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Item Barang</span>
                  <span>Subtotal</span>
                </div>
                {activePurchase.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">{it.productName}</p>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>
                        {it.quantity} x {formatRupiah(it.costPrice)}
                      </span>
                      <span className="font-bold text-slate-900">{formatRupiah(it.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Total Unit Barang:</span>
                  <span className="font-bold">
                    {activePurchase.items.reduce((acc, i) => acc + i.quantity, 0)} pcs
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-1.5">
                  <span>TOTAL PEMBELIAN:</span>
                  <span className="text-emerald-700">{formatRupiah(activePurchase.totalAmount)}</span>
                </div>
              </div>

              {/* Verification Stamp Footer */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-0.5">
                <p className="font-bold text-emerald-800">✓ BARANG DITERIMA & STOK TELAH MASUK</p>
                <p>Dokumen resmi catatan pembukuan warung</p>
                <p>Tersimpan aman di database toko</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyPurchaseSummary(activePurchase)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Teks</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL MODAL: Rincian Lengkap Semua Transaksi & Catatan Nota Kulakan */}
      {viewingDetailPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base font-mono">
                      {viewingDetailPurchase.invoiceNo}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        viewingDetailPurchase.paymentStatus === 'lunas'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {viewingDetailPurchase.paymentStatus === 'lunas' ? 'LUNAS (TUNAI)' : 'HUTANG TEMPO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Catatan detail transaksi & kedatangan barang dari supplier
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingDetailPurchase(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto">
              {/* Meta Informasi Nota */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Waktu Penerimaan</span>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm font-mono block mt-0.5">
                    {formatDate(viewingDetailPurchase.date)}
                  </span>
                  <span className="text-[10px] text-slate-400">Dicatat di sistem kasir</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Status Pembayaran</span>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm block mt-0.5">
                    {viewingDetailPurchase.paymentStatus === 'lunas' ? 'Lunas (Dibayar Penuh)' : 'Hutang / Kredit'}
                  </span>
                  {viewingDetailPurchase.dueDate ? (
                    <span className="text-[10px] text-rose-600 font-bold">
                      Jatuh Tempo: {formatShortDate(viewingDetailPurchase.dueDate)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-medium">Tidak ada tanggungan</span>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Nilai Tagihan</span>
                  <span className="font-black text-emerald-800 text-sm sm:text-base font-mono block mt-0.5">
                    {formatRupiah(viewingDetailPurchase.totalAmount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {viewingDetailPurchase.items.reduce((s, it) => s + it.quantity, 0)} total unit barang
                  </span>
                </div>
              </div>

              {/* Data Supplier / Agen */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                    Profil Mitra Pemasok
                  </span>
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{viewingDetailPurchase.supplierName}</h4>
                    {(() => {
                      const sup = suppliers.find(
                        (s) => s.name.toLowerCase() === viewingDetailPurchase.supplierName.toLowerCase()
                      );
                      if (!sup) return <p className="text-[11px] text-slate-500">Mitra agen / supplier warung</p>;
                      return (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-1">
                          {sup.contactPerson && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>Sales: {sup.contactPerson}</span>
                            </span>
                          )}
                          {sup.phone && sup.phone !== '-' && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{sup.phone}</span>
                            </span>
                          )}
                          {sup.address && sup.address !== '-' && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{sup.address}</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {(() => {
                    const sup = suppliers.find(
                      (s) => s.name.toLowerCase() === viewingDetailPurchase.supplierName.toLowerCase()
                    );
                    if (sup && sup.debt > 0) {
                      return (
                        <div className="text-right bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                          <span className="text-[10px] text-rose-600 font-bold block">Sisa Hutang Toko:</span>
                          <span className="font-black font-mono text-rose-700 text-xs">
                            {formatRupiah(sup.debt)}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Tabel Semua Rincian Barang */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs">
                    Rincian Barang yang Diterima ({viewingDetailPurchase.items.length} Macam Barang):
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Total {viewingDetailPurchase.items.reduce((s, it) => s + it.quantity, 0)} Pcs/Unit
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Nama Produk</th>
                        <th className="py-2.5 px-3 text-center">Jumlah Unit</th>
                        <th className="py-2.5 px-3 text-right">Harga Modal Satuan</th>
                        <th className="py-2.5 px-3 text-right">Subtotal Modal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingDetailPurchase.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{it.productName}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700 bg-blue-50/40">
                            {it.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {formatRupiah(it.costPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            {formatRupiah(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right">
                          Total Keseluruhan:
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-blue-800 font-black">
                          {viewingDetailPurchase.items.reduce((s, it) => s + it.quantity, 0)} unit
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800 text-sm">
                          {formatRupiah(viewingDetailPurchase.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status Stok Otomatis */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-emerald-900">
                <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-extrabold">Verifikasi Catatan Inventaris Otomatis</p>
                  <p className="text-[11px] text-emerald-700">
                    Jumlah unit barang yang tercatat pada nota ini telah otomatis ditambahkan ke stok toko di menu Inventaris dan POS kasir.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPurchaseReceiptModalOpen(true);
                      setViewingDetailPurchase(null);
                    }}
                    className="flex-1 sm:flex-none py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Struk Nota</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyPurchaseSummary(viewingDetailPurchase)}
                    className="flex-1 sm:flex-none py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Salin Ringkasan</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingDetailPurchase(null)}
                  className="py-2.5 px-5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer w-full sm:w-auto"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
