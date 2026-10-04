import React, { useState, useMemo } from 'react';
import { Transaction, PaymentMethod } from '../types';
import { formatRupiah, formatDate } from '../utils/format';
import {
  ReceiptText,
  Search,
  Calendar,
  Printer,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  onSelectReceipt: (transaction: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onSelectReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all' | 'custom_month'>('today');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Available years from transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const curYear = new Date().getFullYear().toString();
    yearsSet.add(curYear);
    yearsSet.add((parseInt(curYear, 10) - 1).toString());
    transactions.forEach((t) => {
      if (t.date && t.date.length >= 4) {
        yearsSet.add(t.date.slice(0, 4));
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [transactions]);

  // Period filtering & sorting
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

    const result = transactions.filter((tx) => {
      const txTime = new Date(tx.date).getTime();
      let matchPeriod = true;
      if (filterPeriod === 'today') {
        matchPeriod = txTime >= startOfToday;
      } else if (filterPeriod === 'week') {
        matchPeriod = txTime >= sevenDaysAgo;
      } else if (filterPeriod === 'month') {
        matchPeriod = txTime >= thirtyDaysAgo;
      }

      let matchPayment = true;
      if (filterPayment !== 'all') {
        matchPayment = tx.paymentMethod === filterPayment;
      }

      let matchYear = true;
      if (filterYear !== 'all') {
        matchYear = tx.date.startsWith(filterYear);
      }

      let matchMonth = true;
      if (filterMonth !== 'all') {
        matchMonth = tx.date.slice(5, 7) === filterMonth;
      }

      const matchSearch =
        !searchQuery ||
        tx.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.items.some((item) => item.product.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchPeriod && matchPayment && matchYear && matchMonth && matchSearch;
    });

    result.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOrder === 'highest') return b.totalAmount - a.totalAmount;
      if (sortOrder === 'lowest') return a.totalAmount - b.totalAmount;
      return 0;
    });

    return result;
  }, [transactions, filterPeriod, filterPayment, filterYear, filterMonth, searchQuery, sortOrder]);

  // Statistics for current filtered range
  const summary = useMemo(() => {
    let totalSales = 0;
    let totalProfit = 0;
    filteredTransactions.forEach((tx) => {
      totalSales += tx.totalAmount;
      totalProfit += tx.profit;
    });
    return {
      count: filteredTransactions.length,
      totalSales,
      totalProfit,
    };
  }, [filteredTransactions]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-8 space-y-6">
      {/* Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Transaksi Selesai</span>
            <ReceiptText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            {summary.count} <span className="text-xs font-normal text-slate-500">struk</span>
          </p>
          <p className="text-[11px] text-slate-400">Periode terpilih</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Pendapatan (Omset)</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatRupiah(summary.totalSales)}
          </p>
          <p className="text-[11px] text-slate-400">Penjualan kotor</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Estimasi Laba Bersih</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tabular-nums">
            {formatRupiah(summary.totalProfit)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Margin riil dari harga kulakan</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No. Struk, Nama Pelanggan, atau Nama Barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterPeriod === 'today' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterPeriod === 'week' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterPeriod === 'month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterPeriod === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* Payment method selector & Multi-filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua Metode' },
              { id: 'tunai', label: 'Tunai' },
              { id: 'qris', label: 'QRIS' },
              { id: 'transfer', label: 'Transfer' },
              { id: 'kasbon', label: 'Kasbon' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterPayment(m.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filterPayment === m.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Year, Month, & Sort Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 font-bold">Tahun:</span>
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  if (e.target.value !== 'all') setFilterPeriod('all');
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 font-bold">Bulan:</span>
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  if (e.target.value !== 'all') setFilterPeriod('all');
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Bulan</option>
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 font-bold">Urutkan:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="highest">Nominal Tertinggi</option>
                <option value="lowest">Nominal Terendah</option>
              </select>
            </div>

            {(filterYear !== 'all' || filterMonth !== 'all' || searchQuery || filterPayment !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterYear('all');
                  setFilterMonth('all');
                  setFilterPayment('all');
                  setFilterPeriod('today');
                  setSortOrder('newest');
                }}
                className="text-[11px] text-rose-600 hover:underline font-bold px-1.5 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <ReceiptText className="w-12 h-12 mx-auto text-slate-200" />
            <p className="font-semibold text-slate-700">Belum ada transaksi di periode ini</p>
            <p className="text-xs text-slate-400">Transaksi yang tercatat di kasir akan muncul di sini secara otomatis.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono text-sm">{tx.invoiceNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
                        tx.paymentMethod === 'kasbon'
                          ? 'bg-rose-100 text-rose-800'
                          : tx.paymentMethod === 'qris'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {tx.paymentMethod}
                    </span>
                  </div>

                  <div className="text-slate-500 text-[11px] flex items-center gap-2">
                    <span>{formatDate(tx.date)}</span>
                    <span>·</span>
                    <span>Pelanggan: <strong className="text-slate-700">{tx.customerName || 'Umum'}</strong></span>
                  </div>

                  <div className="text-slate-600 text-[11px] line-clamp-1">
                    {tx.items.map((i) => `${i.product.name} (${i.quantity})`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900 font-mono tabular-nums">
                      {formatRupiah(tx.totalAmount)}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold font-mono tabular-nums">
                      Laba: +{formatRupiah(tx.profit)}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectReceipt(tx)}
                    className="flex items-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Struk</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
