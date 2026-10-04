import React, { useState, useMemo } from 'react';
import { Product, CartItem, PaymentMethod, Transaction } from '../types';
import { formatRupiah, generateInvoiceNumber, formatShortDate } from '../utils/format';
import { sound } from '../utils/sound';
import { getProductImage } from '../utils/productImages';
import {
  Search,
  Barcode,
  Cpu,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Wallet,
  QrCode,
  ArrowRightLeft,
  BookOpen,
  ShoppingBag,
  X,
  Check,
  CheckCircle2,
  Store,
  Layers,
  Sparkles,
} from 'lucide-react';

interface POSViewProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCompleteSale: (transaction: Transaction, updatedProducts: Product[]) => void;
  onOpenBarcodeScanner: () => void;
  onOpenVisualScanner: () => void;
  onNavigateToInventory: () => void;
  isCartDrawerOpen?: boolean;
  onCloseCartDrawer?: () => void;
  onOpenCartDrawer?: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCompleteSale,
  onOpenBarcodeScanner,
  onOpenVisualScanner,
  onNavigateToInventory,
  isCartDrawerOpen = false,
  onCloseCartDrawer,
  onOpenCartDrawer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Category pills with icons matching screenshot
  const categories = [
    { name: 'Semua', icon: '⊞' },
    { name: 'Sembako', icon: '🛍️' },
    { name: 'Minuman', icon: '☕' },
    { name: 'Makanan Ringan', icon: '🏷️' },
    { name: 'Bumbu & Dapur', icon: '🌿' },
    { name: 'Kebutuhan Rumah', icon: '🧼' },
    { name: 'Rokok', icon: '🚬' },
  ];

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart totals
  const totalCartAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const totalCartItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const cashNum = parseFloat(cashGiven) || 0;
  const changeAmount = Math.max(0, cashNum - totalCartAmount);

  // Submit sale transaction
  const handleProcessSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'tunai' && cashNum < totalCartAmount) {
      sound.playWarning();
      alert('Uang yang dibayarkan kurang dari total belanja.');
      return;
    }

    if (paymentMethod === 'kasbon' && !customerName.trim()) {
      sound.playWarning();
      alert('Nama pelanggan wajib diisi untuk transaksi Kasbon (Hutang).');
      return;
    }

    const totalCost = cart.reduce((acc, item) => acc + item.product.buyPrice * item.quantity, 0);

    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      date: new Date().toISOString(),
      items: [...cart],
      totalAmount: totalCartAmount,
      totalCost,
      profit: totalCartAmount - totalCost,
      paymentMethod,
      cashPaid: paymentMethod === 'tunai' ? cashNum : totalCartAmount,
      change: paymentMethod === 'tunai' ? changeAmount : 0,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((ci) => ci.product.id === p.id);
      if (cartItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - cartItem.quantity),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    onCompleteSale(newTransaction, updatedProducts);
    onClearCart();
    setIsCheckoutModalOpen(false);
    onCloseCartDrawer?.();
    setCashGiven('');
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-24">
      {/* Top Rounded Sheet Container */}
      <div className="space-y-3">
        {/* Search Bar - Exactly matching screenshot */}
        <div className="relative">
          <div className="flex items-center bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-[#005AE0] transition-all">
            <Search className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Cari nama barang atau ketik barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenBarcodeScanner}
                title="Pindai Barcode"
                className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
              >
                <Barcode className="w-6 h-6 text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Scan Barcode & Pindai AI (Tanpa Barcode) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onOpenBarcodeScanner}
            className="py-2.5 px-3 bg-white border border-slate-200/90 hover:bg-slate-50 active:scale-98 rounded-xl font-bold text-xs text-slate-800 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Barcode className="w-4 h-4 text-slate-700" />
            <span>Scan Barcode</span>
          </button>

          <button
            type="button"
            onClick={onOpenVisualScanner}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Cpu className="w-4 h-4 text-emerald-100 shrink-0" />
              <span className="truncate">Pindai AI (Tanpa Barcode)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-200 shrink-0 ml-1" />
          </button>
        </div>

        {/* Category Pills (Horizontal Scrolling) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#005AE0] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Products Grid (2-columns matching screenshot) */}
      <div className="mt-2">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 mt-4">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <p className="font-bold text-slate-800 text-sm">Barang tidak ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">
                Tidak ada barang yang cocok dengan kata kunci "{searchQuery}".
              </p>
            </div>
            <button
              onClick={onNavigateToInventory}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              + Tambah Barang Baru di Inventaris
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-3 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow relative"
                >
                  <div>
                    {/* Centered Realistic Product Packaging Image */}
                    <div className="h-32 w-full flex items-center justify-center p-1 mb-2 bg-slate-50/20 rounded-xl">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    {/* Category Pill */}
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold text-blue-700 bg-blue-50/80 mb-1">
                      {product.category}
                    </span>

                    {/* Stock Pill & Expiration (ED) Badge */}
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-600 bg-emerald-50">
                        Stok {product.stock} {product.unit}
                      </span>
                      {product.expiryDate && (
                        <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-mono text-slate-500 bg-slate-100">
                          ED: {formatShortDate(product.expiryDate)}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-slate-800 text-xs line-clamp-2 leading-snug min-h-[32px]">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Green Plus Button */}
                  <div className="mt-2 pt-2 flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm font-mono">
                      {formatRupiah(product.sellPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      disabled={isOutOfStock}
                      title="Tambah ke keranjang"
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-base shadow-xs transition-transform cursor-pointer ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-up Cart Drawer Modal (Invoked by clicking Floating Center Cart) */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-6">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#005AE0] text-white flex items-center justify-center font-bold text-xs">
                  {totalCartItemsCount}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Keranjang Belanja</h3>
                  <p className="text-[11px] text-slate-500">{cart.length} macam produk terpilih</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={onClearCart}
                    className="text-xs text-rose-600 hover:underline font-bold px-2 py-1"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  onClick={onCloseCartDrawer}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Keranjang masih kosong</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Pilih barang dari katalog atau gunakan tombol Scan Barcode / Kamera AI untuk menambahkan barang.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                    <img
                      src={getProductImage(item.product)}
                      alt={item.product.name}
                      className="w-11 h-11 rounded-xl object-contain bg-slate-50 border border-slate-100 p-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatRupiah(item.price)} / {item.product.unit}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 shadow-xs cursor-pointer font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs font-mono text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 shadow-xs cursor-pointer font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right shrink-0 min-w-[70px]">
                      <p className="font-extrabold text-slate-900 text-xs font-mono">
                        {formatRupiah(item.subtotal)}
                      </p>
                    </div>

                    <button
                      onClick={() => onRemoveFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">TOTAL TAGIHAN:</span>
                  <span className="font-black text-[#005AE0] text-xl font-mono">
                    {formatRupiah(totalCartAmount)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCashGiven(totalCartAmount.toString());
                    setIsCheckoutModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-sm font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Bayar Sekarang ({formatRupiah(totalCartAmount)})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Payment Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Penyelesaian Pembayaran</h3>
                <p className="text-[11px] text-slate-500">Pilih metode pembayaran dan masukkan uang tunai</p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessSale} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Grand Total */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block">
                  Total Belanja
                </span>
                <span className="text-2xl font-black text-[#005AE0] font-mono">
                  {formatRupiah(totalCartAmount)}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Metode Pembayaran:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tunai')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                      paymentMethod === 'tunai'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span>Tunai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                      paymentMethod === 'qris'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                      paymentMethod === 'transfer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                    <span>Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('kasbon')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                      paymentMethod === 'kasbon'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-rose-600" />
                    <span>Kasbon</span>
                  </button>
                </div>
              </div>

              {/* Cash Input Controls */}
              {paymentMethod === 'tunai' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nominal Uang Tunai Diterima:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        required
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[totalCartAmount, 10000, 20000, 50000, 100000].map((amt) => {
                      if (amt < totalCartAmount && amt !== totalCartAmount) return null;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashGiven(amt.toString())}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-mono font-bold text-[11px] cursor-pointer"
                        >
                          {amt === totalCartAmount ? 'Uang Pas' : formatRupiah(amt)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Change Preview */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Uang Kembalian:</span>
                    <span className="font-black text-emerald-700 text-sm font-mono">
                      {formatRupiah(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Kasbon / Debt Input */}
              {paymentMethod === 'kasbon' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Pelanggan (Wajib):</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Bu RT Endang"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp Pelanggan:</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0812..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/25 cursor-pointer flex flex-col items-center justify-center transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Selesaikan Transaksi & Simpan</span>
                  </div>
                  <span className="text-[10px] text-emerald-100 font-normal">
                    Otomatis potong stok & simpan riwayat (Cetak / WA opsi pilihan)
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
