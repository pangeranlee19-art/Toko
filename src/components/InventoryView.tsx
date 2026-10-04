import React, { useState, useMemo, useRef } from 'react';
import { Product, ProductCategory, ProductUnit, StockLog, Supplier } from '../types';
import { formatRupiah, formatNumber, formatShortDate, getExpiryStatus } from '../utils/format';
import { getProductImage, WARUNG_PHOTO_PRESETS } from '../utils/productImages';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowDownToLine,
  Edit2,
  Trash2,
  X,
  Check,
  TrendingUp,
  Layers,
  Camera,
  Image as ImageIcon,
  Sparkles,
  SwitchCamera,
  Upload,
  Calendar,
  Clock,
  AlertCircle,
  Truck,
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  suppliers?: Supplier[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onStockIn: (productId: string, quantity: number, note: string) => void;
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
  newProductInitialBarcode?: string | null;
  newProductInitialData?: {
    name?: string;
    barcode?: string;
    category?: ProductCategory;
    image?: string;
  } | null;
  onClearInitialBarcode?: () => void;
  onOpenVisualScanner?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  suppliers = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onStockIn,
  onStockInFromSupplier,
  newProductInitialBarcode,
  newProductInitialData,
  onClearInitialBarcode,
  onOpenVisualScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'expiring'>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('10');
  const [restockCostPrice, setRestockCostPrice] = useState('');
  const [restockSupplierName, setRestockSupplierName] = useState('');
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [customSupplierInput, setCustomSupplierInput] = useState('');
  const [restockPaymentType, setRestockPaymentType] = useState<'tunai' | 'kredit'>('tunai');
  const [restockDueDate, setRestockDueDate] = useState('');
  const [restockNote, setRestockNote] = useState('Kulakan Masuk');
  const [restockReceivedDate, setRestockReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [restockExpiryDate, setRestockExpiryDate] = useState('');

  // Photo helpers in Add/Edit modal
  const [isFormCameraOpen, setIsFormCameraOpen] = useState(false);
  const [formCameraError, setFormCameraError] = useState<string | null>(null);
  const [isPresetPickerOpen, setIsPresetPickerOpen] = useState(false);
  const formVideoRef = useRef<HTMLVideoElement | null>(null);
  const formStreamRef = useRef<MediaStream | null>(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Sembako' as ProductCategory,
    buyPrice: '',
    sellPrice: '',
    stock: '',
    minStock: '5',
    unit: 'Pcs' as ProductUnit,
    image: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    productionDate: '',
    expiryDate: '',
  });

  // Automatically trigger modal if newProductInitialData or newProductInitialBarcode is provided
  React.useEffect(() => {
    if (newProductInitialData) {
      setFormData({
        name: newProductInitialData.name || '',
        barcode: newProductInitialData.barcode || `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        category: newProductInitialData.category || 'Sembako',
        buyPrice: '',
        sellPrice: '',
        stock: '10',
        minStock: '5',
        unit: 'Pcs',
        image: newProductInitialData.image || '',
        receivedDate: new Date().toISOString().slice(0, 10),
        productionDate: '',
        expiryDate: '',
      });
      setIsAddModalOpen(true);
      if (onClearInitialBarcode) {
        onClearInitialBarcode();
      }
    } else if (newProductInitialBarcode) {
      setFormData({
        name: '',
        barcode: newProductInitialBarcode,
        category: 'Sembako',
        buyPrice: '',
        sellPrice: '',
        stock: '10',
        minStock: '5',
        unit: 'Pcs',
        image: '',
        receivedDate: new Date().toISOString().slice(0, 10),
        productionDate: '',
        expiryDate: '',
      });
      setIsAddModalOpen(true);
      if (onClearInitialBarcode) {
        onClearInitialBarcode();
      }
    }
  }, [newProductInitialBarcode, newProductInitialData]);

  // Form camera controls
  const startFormCamera = async () => {
    setIsFormCameraOpen(true);
    setFormCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setFormCameraError('Kamera tidak didukung pada browser ini.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      formStreamRef.current = stream;
      if (formVideoRef.current) {
        formVideoRef.current.srcObject = stream;
        await formVideoRef.current.play();
      }
    } catch (e: any) {
      setFormCameraError('Tidak dapat membuka kamera. Periksa izin kamera peramban.');
    }
  };

  const stopFormCamera = () => {
    if (formStreamRef.current) {
      formStreamRef.current.getTracks().forEach((t) => t.stop());
      formStreamRef.current = null;
    }
    setIsFormCameraOpen(false);
    setFormCameraError(null);
  };

  const captureFormPhoto = () => {
    if (!formVideoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = formVideoRef.current.videoWidth || 640;
    canvas.height = formVideoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(formVideoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setFormData((prev) => ({ ...prev, image: dataUrl }));
    stopFormCamera();
  };

  const categories: string[] = [
    'Semua',
    'Sembako',
    'Minuman',
    'Makanan Ringan',
    'Bumbu & Dapur',
    'Kebutuhan Rumah',
    'Rokok',
    'Lainnya',
  ];

  const units: ProductUnit[] = [
    'Pcs',
    'Bungkus',
    'Botol',
    'Kg',
    'Liter',
    'Renceng',
    'Dus',
    'Pack',
  ];

  // Calculated statistics
  const stats = useMemo(() => {
    let totalStockCount = 0;
    let totalAssetValue = 0;
    let potentialSalesValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;

    products.forEach((p) => {
      totalStockCount += p.stock;
      totalAssetValue += p.buyPrice * p.stock;
      potentialSalesValue += p.sellPrice * p.stock;
      if (p.stock <= 0) {
        outOfStockCount++;
      } else if (p.stock <= p.minStock) {
        lowStockCount++;
      }

      const expStatus = getExpiryStatus(p.expiryDate);
      if (expStatus.status === 'expired' || expStatus.status === 'expiring_soon') {
        expiringCount++;
      }
    });

    return {
      totalProducts: products.length,
      totalStockCount,
      totalAssetValue,
      potentialSalesValue,
      potentialProfit: potentialSalesValue - totalAssetValue,
      lowStockCount,
      outOfStockCount,
      expiringCount,
    };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);

      let matchStock = true;
      if (stockStatusFilter === 'low') {
        matchStock = p.stock > 0 && p.stock <= p.minStock;
      } else if (stockStatusFilter === 'out') {
        matchStock = p.stock <= 0;
      } else if (stockStatusFilter === 'expiring') {
        const expStatus = getExpiryStatus(p.expiryDate);
        matchStock = expStatus.status === 'expired' || expStatus.status === 'expiring_soon';
      }

      return matchCat && matchSearch && matchStock;
    });
  }, [products, selectedCategory, searchQuery, stockStatusFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      barcode: `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: 'Sembako',
      buyPrice: '',
      sellPrice: '',
      stock: '',
      minStock: '5',
      unit: 'Pcs',
      image: '',
      receivedDate: new Date().toISOString().slice(0, 10),
      productionDate: '',
      expiryDate: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      barcode: p.barcode,
      category: p.category,
      buyPrice: p.buyPrice.toString(),
      sellPrice: p.sellPrice.toString(),
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
      unit: p.unit,
      image: p.image || '',
      receivedDate: p.receivedDate || '',
      productionDate: p.productionDate || '',
      expiryDate: p.expiryDate || '',
    });
  };

  // Open Restock (Kulakan) Modal
  const handleOpenRestock = (p: Product) => {
    setRestockProduct(p);
    setRestockQty('10');
    setRestockCostPrice(p.buyPrice.toString());
    const defaultSup = suppliers.length > 0 ? suppliers[0].name : 'Agen Sembako Makmur Jaya';
    setRestockSupplierName(defaultSup);
    setIsCustomSupplier(false);
    setCustomSupplierInput('');
    setRestockPaymentType('tunai');
    setRestockNote('Kulakan Stok Masuk');
    setRestockReceivedDate(new Date().toISOString().slice(0, 10));
    setRestockExpiryDate(p.expiryDate || '');
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setRestockDueDate(d.toISOString().slice(0, 10));
  };

  // Submit Restock
  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Masukkan jumlah stok masuk yang valid.');
      return;
    }

    const finalSupplier = isCustomSupplier
      ? customSupplierInput.trim() || 'Supplier Umum'
      : restockSupplierName.trim() || 'Supplier Umum';

    const costNum = parseFloat(restockCostPrice) || restockProduct.buyPrice;

    if (onStockInFromSupplier) {
      onStockInFromSupplier({
        productId: restockProduct.id,
        quantity: qty,
        supplierName: finalSupplier,
        costPrice: costNum,
        paymentType: restockPaymentType,
        dueDate: restockPaymentType === 'kredit' ? restockDueDate : undefined,
        note: restockNote.trim(),
        receivedDate: restockReceivedDate,
        expiryDate: restockExpiryDate,
      });
    } else {
      onStockIn(restockProduct.id, qty, `Pemasok: ${finalSupplier} - ${restockNote}`);
      if (restockReceivedDate || restockExpiryDate || (costNum !== restockProduct.buyPrice)) {
        onUpdateProduct({
          ...restockProduct,
          stock: restockProduct.stock + qty,
          buyPrice: costNum,
          receivedDate: restockReceivedDate || restockProduct.receivedDate,
          expiryDate: restockExpiryDate || restockProduct.expiryDate,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    setRestockProduct(null);
  };

  // Submit Add or Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const buyPrice = parseFloat(formData.buyPrice);
    const sellPrice = parseFloat(formData.sellPrice);
    const stock = parseInt(formData.stock, 10);
    const minStock = parseInt(formData.minStock, 10);

    if (isNaN(buyPrice) || isNaN(sellPrice) || isNaN(stock)) {
      alert('Harap isi harga modal, harga jual, dan stok dengan angka yang benar.');
      return;
    }

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: formData.name.trim(),
        barcode: formData.barcode.trim(),
        category: formData.category,
        buyPrice,
        sellPrice,
        stock,
        minStock: isNaN(minStock) ? 5 : minStock,
        unit: formData.unit,
        image: formData.image || undefined,
        receivedDate: formData.receivedDate || undefined,
        productionDate: formData.productionDate || undefined,
        expiryDate: formData.expiryDate || undefined,
        updatedAt: new Date().toISOString(),
      };
      onUpdateProduct(updated);
      setEditingProduct(null);
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formData.name.trim(),
        barcode: formData.barcode.trim(),
        category: formData.category,
        buyPrice,
        sellPrice,
        stock,
        minStock: isNaN(minStock) ? 5 : minStock,
        unit: formData.unit,
        image: formData.image || undefined,
        receivedDate: formData.receivedDate || undefined,
        productionDate: formData.productionDate || undefined,
        expiryDate: formData.expiryDate || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddProduct(newProduct);
      setIsAddModalOpen(false);
    }
  };

  const handleDelete = (p: Product) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${p.name}" dari stok warung?`)) {
      onDeleteProduct(p.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-28 space-y-6">
      {/* Top Banner & High-Level Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Ragam Barang</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            {stats.totalProducts} <span className="text-xs text-slate-400 font-sans font-normal">item</span>
          </p>
          <p className="text-[11px] text-slate-400">Total {stats.totalStockCount} unit fisik stok</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Nilai Aset Modal Kulakan</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatRupiah(stats.totalAssetValue)}
          </p>
          <p className="text-[11px] text-slate-400">Uang modal tertanam di rak toko</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Potensi Omset Penjualan</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-700 font-mono tabular-nums">
            {formatRupiah(stats.potentialSalesValue)}
          </p>
          <p className="text-[11px] text-purple-600 font-medium">
            Potensi laba kotor: {formatRupiah(stats.potentialProfit)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Peringatan Stok & ED</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-2xl font-black text-amber-600 font-mono tabular-nums">
              {stats.lowStockCount}
            </p>
            <span className="text-xs text-slate-500">menipis</span>
            {stats.expiringCount > 0 && (
              <span className="text-xs font-bold text-rose-600 font-mono tabular-nums">
                · {stats.expiringCount} cek ED
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.outOfStockCount > 0 ? `${stats.outOfStockCount} barang habis` : 'Pantau masa kedaluwarsa produk'}
          </p>
        </div>
      </div>

      {/* Control Bar: Search, Category, Status Filter, Add Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama barang atau barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick stock status filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setStockStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  stockStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Semua ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('low')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  stockStatusFilter === 'low' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Menipis ({stats.lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('out')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  stockStatusFilter === 'out' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Habis ({stats.outOfStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('expiring')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  stockStatusFilter === 'expiring' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
                title="Produk yang hampir atau sudah lewat tanggal kedaluwarsa"
              >
                <Clock className="w-3 h-3 text-rose-500" />
                <span>Cek ED ({stats.expiringCount})</span>
              </button>
            </div>

            {onOpenVisualScanner && (
              <button
                type="button"
                onClick={onOpenVisualScanner}
                className="flex items-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                title="Pindai barang di rak warung menggunakan kamera AI untuk mengecek stok"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Pindai Kamera AI</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Barang</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table with Date Fields & ED Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Produk & Barcode</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Harga Modal</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4">Tanggal (Datang, Prod, ED)</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada produk ditemukan</p>
                    <p className="text-[11px] text-slate-400">Sesuaikan filter atau tambah barang baru.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profitPerItem = p.sellPrice - p.buyPrice;
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= p.minStock;
                  const expStatus = getExpiryStatus(p.expiryDate);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(p)}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{p.barcode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {p.category}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {formatRupiah(p.buyPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatRupiah(p.sellPrice)}
                      </td>

                      {/* Tanggal Datang, Produksi & ED */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5 text-[11px]">
                          {/* Tanggal Datang */}
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="text-[10px] text-slate-400">Datang:</span>
                            <span className="font-mono">{p.receivedDate ? formatShortDate(p.receivedDate) : '-'}</span>
                          </div>

                          {/* Tanggal Produksi */}
                          {p.productionDate && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <span className="text-[10px] text-slate-400">Prod:</span>
                              <span className="font-mono">{formatShortDate(p.productionDate)}</span>
                            </div>
                          )}

                          {/* Tanggal Kedaluwarsa (ED) Status Badge */}
                          <div className="pt-0.5">
                            {expStatus.status === 'expired' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                🔴 ED: {formatShortDate(p.expiryDate!)} (Lewat!)
                              </span>
                            )}
                            {expStatus.status === 'expiring_soon' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                🟡 ED: {formatShortDate(p.expiryDate!)} ({expStatus.daysRemaining} hari lagi)
                              </span>
                            )}
                            {expStatus.status === 'safe' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🟢 ED: {formatShortDate(p.expiryDate!)}
                              </span>
                            )}
                            {expStatus.status === 'none' && (
                              <span className="text-[10px] text-slate-400 font-mono">ED: -</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-md text-xs ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {p.stock} {p.unit}
                          {isOutOfStock && <span className="text-[10px] uppercase font-sans">(Habis)</span>}
                          {isLowStock && <span className="text-[10px] uppercase font-sans">(Menipis)</span>}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenRestock(p)}
                            title="Kulakan / Tambah Stok Masuk"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Barang"
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            title="Hapus Barang"
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal with Date Fields */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProduct ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Product Photo Upload / Camera Snapshot / Preset Picker */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <label className="block font-bold text-slate-800 text-xs">
                  Foto Barang:
                </label>

                {isFormCameraOpen ? (
                  <div className="space-y-2">
                    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                      <video
                        ref={formVideoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      {formCameraError && (
                        <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center p-3 text-center text-xs text-rose-300">
                          {formCameraError}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={stopFormCamera}
                        className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={captureFormPhoto}
                        className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ambil Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={startFormCamera}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Foto Kamera Langsung</span>
                        </button>

                        <label className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih dari Galeri</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setFormData((prev) => ({ ...prev, image: event.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setIsPresetPickerOpen(!isPresetPickerOpen)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>Pilih Foto Preset Warung</span>
                        </button>

                        {formData.image && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer underline"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preset Warung Photo Grid Drawer */}
                {isPresetPickerOpen && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        Pilih Gambar Cepat Khas Warung Kelontong:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPresetPickerOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
                      {WARUNG_PHOTO_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              image: preset.image,
                              name: prev.name || preset.name,
                              category: (prev.category === 'Sembako' ? preset.category : prev.category) as ProductCategory,
                            }));
                            setIsPresetPickerOpen(false);
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 bg-white transition-colors flex flex-col items-center text-center cursor-pointer group"
                        >
                          <img
                            src={preset.image}
                            alt={preset.name}
                            className="w-10 h-10 object-contain rounded-lg mb-1 group-hover:scale-105 transition-transform"
                          />
                          <span className="text-[9px] text-slate-700 font-semibold truncate w-full">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Barang Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beras Ramos Super 5kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode / Kode SKU:</label>
                  <input
                    type="text"
                    required
                    placeholder="899..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {categories.filter((c) => c !== 'Semua').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Modal / Beli (Rp):</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    placeholder="Contoh: 15000"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Jual ke Pembeli (Rp):</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    placeholder="Contoh: 18000"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Saat Ini:</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batas Minimum Stok:</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan:</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TANGGAL DATANG BARANG, TANGGAL PRODUKSI & TANGGAL KEDALUWARSA (ED) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-slate-800">
                    Tanggal Datang Barang, Produksi & Kedaluwarsa (ED)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Tanggal Datang Barang */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Tanggal Datang:</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, receivedDate: new Date().toISOString().slice(0, 10) })}
                        className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer"
                      >
                        Hari Ini
                      </button>
                    </div>
                    <input
                      type="date"
                      value={formData.receivedDate}
                      onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Waktu kulakan masuk</span>
                  </div>

                  {/* Tanggal Produksi */}
                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block">Tanggal Produksi:</label>
                    <input
                      type="date"
                      value={formData.productionDate}
                      onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">MFG Date pada kemasan</span>
                  </div>

                  {/* Tanggal Kedaluwarsa (ED) */}
                  <div>
                    <label className="font-semibold text-slate-700 mb-1 block text-rose-700">
                      Tanggal Kedaluwarsa (ED):
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Expired Date produk</span>
                  </div>
                </div>

                {/* Quick ED Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Preset Cepat ED:</span>
                  {[
                    { label: '+30 Hari (Telur/Roti)', days: 30 },
                    { label: '+6 Bulan (Mie/Snack)', days: 180 },
                    { label: '+1 Tahun (Minyak/Kopi)', days: 365 },
                    { label: '+2 Tahun (Garam/Gula)', days: 730 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + preset.days);
                        setFormData({ ...formData, expiryDate: d.toISOString().slice(0, 10) });
                      }}
                      className="px-2 py-0.5 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-md text-[10px] text-slate-600 font-medium cursor-pointer transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  {formData.expiryDate && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, expiryDate: '' })}
                      className="text-[10px] text-rose-600 hover:underline font-bold ml-auto cursor-pointer"
                    >
                      Hapus ED
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock (Kulakan / Stok Masuk) Modal with Date Updates */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Kulakan / Tambah Stok Masuk</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                    {restockProduct.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRestock} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-600 font-medium block">Stok Saat Ini:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {restockProduct.stock} {restockProduct.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px] block">Harga Modal Tercatat:</span>
                  <span className="font-bold font-mono text-emerald-700 text-sm">
                    {formatRupiah(restockProduct.buyPrice)}
                  </span>
                </div>
              </div>

              {/* Pilihan Supplier / Pemasok */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mitra Supplier / Pemasok:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSupplier(!isCustomSupplier);
                      if (!isCustomSupplier) setCustomSupplierInput('');
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    {isCustomSupplier ? 'Pilih dari Daftar' : '+ Ketik Nama Baru'}
                  </button>
                </label>

                {isCustomSupplier ? (
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama supplier baru..."
                    value={customSupplierInput}
                    onChange={(e) => setCustomSupplierInput(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                ) : (
                  <select
                    value={restockSupplierName}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomSupplier(true);
                        setCustomSupplierInput('');
                      } else {
                        setRestockSupplierName(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} {s.debt > 0 ? `(Hutang: ${formatRupiah(s.debt)})` : ''}
                      </option>
                    ))}
                    {suppliers.length === 0 && (
                      <option value="Agen Sembako Makmur Jaya">Agen Sembako Makmur Jaya</option>
                    )}
                    <option value="__custom__">+ Tambah Supplier Lainnya...</option>
                  </select>
                )}
              </div>

              {/* Jumlah Stok Masuk & Harga Modal Kulakan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Stok Masuk ({restockProduct.unit}):
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    autoFocus
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Modal / Beli Satuan (Rp):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    value={restockCostPrice}
                    onChange={(e) => setRestockCostPrice(e.target.value)}
                    placeholder="Harga beli satuan"
                    className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Status Pembayaran Kulakan (Tunai vs Kredit/Hutang) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Metode Pembayaran ke Supplier:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestockPaymentType('tunai')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      restockPaymentType === 'tunai'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>✓ Tunai (Lunas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestockPaymentType('kredit')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      restockPaymentType === 'kredit'
                        ? 'bg-rose-50 border-rose-600 text-rose-800 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>⏳ Kredit (Hutang Supplier)</span>
                  </button>
                </div>
              </div>

              {/* Tanggal Jatuh Tempo jika Kredit */}
              {restockPaymentType === 'kredit' && (
                <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
                  <label className="block font-bold text-rose-900 mb-1">
                    Jatuh Tempo Pembayaran Supplier:
                  </label>
                  <input
                    type="date"
                    required
                    value={restockDueDate}
                    onChange={(e) => setRestockDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-rose-300 rounded-lg font-mono text-xs bg-white"
                  />
                  <span className="text-[10px] text-rose-700 block mt-1">
                    Hutang ke supplier akan otomatis dicatat di Laporan Pembelian & Buku Supplier.
                  </span>
                </div>
              )}

              {/* Tanggal Datang Kulakan & Tanggal Kedaluwarsa Batch Baru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Datang:
                  </label>
                  <input
                    type="date"
                    value={restockReceivedDate}
                    onChange={(e) => setRestockReceivedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-rose-700">
                    Tanggal ED Batch Baru:
                  </label>
                  <input
                    type="date"
                    value={restockExpiryDate}
                    onChange={(e) => setRestockExpiryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / No. Faktur PO Supplier (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: No. Faktur DO-9921 / Nota Kulakan"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Live Summary Total & Stock Update */}
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-900 font-medium">Total Nilai Tagihan Kulakan:</span>
                  <span className="font-black font-mono text-emerald-800 text-sm">
                    {formatRupiah((parseInt(restockQty, 10) || 0) * (parseFloat(restockCostPrice) || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-emerald-200/60 pt-1.5">
                  <span className="text-emerald-900 font-bold">Stok Toko Setelah Masuk:</span>
                  <span className="font-extrabold font-mono text-emerald-700 text-base">
                    {restockProduct.stock + (parseInt(restockQty, 10) || 0)} {restockProduct.unit}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Catat Barang Masuk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
