import React, { useState, useEffect } from 'react';
import { Transaction, StoreProfile } from '../types';
import { formatRupiah, formatDate } from '../utils/format';
import { sound } from '../utils/sound';
import {
  Printer,
  Check,
  X,
  Copy,
  MessageSquareShare,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  storeProfile: StoreProfile;
  isOpen: boolean;
  onClose: () => void;
  onFinishNewTransaction?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  storeProfile,
  isOpen,
  onClose,
  onFinishNewTransaction,
}) => {
  const [copied, setCopied] = useState(false);
  const [autoOpenReceipt, setAutoOpenReceipt] = useState(() => {
    try {
      const saved = localStorage.getItem('warungku_auto_open_receipt');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleFinishAndNewSale = () => {
    sound.playCashChime();
    if (onFinishNewTransaction) {
      onFinishNewTransaction();
    } else {
      onClose();
    }
  };

  // Handle keyboard shortcut (Enter / Escape) to quickly close and start new sale
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleFinishAndNewSale();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onFinishNewTransaction]);

  const handleToggleAutoReceipt = (checked: boolean) => {
    setAutoOpenReceipt(checked);
    try {
      localStorage.setItem('warungku_auto_open_receipt', JSON.stringify(checked));
    } catch {}
  };

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    const lines = [
      `*🧾 STRUK BELANJA - ${storeProfile.storeName}*`,
      `${storeProfile.address}`,
      `Telp: ${storeProfile.phone}`,
      `--------------------------------`,
      `No. Struk : ${transaction.invoiceNumber}`,
      `Waktu     : ${formatDate(transaction.date)}`,
      `Kasir/Plg : ${transaction.customerName || 'Pelanggan Umum'}`,
      `--------------------------------`,
      ...transaction.items.map(
        (item) =>
          `${item.product.name}\n  ${item.quantity} x ${formatRupiah(item.price)} = *${formatRupiah(item.subtotal)}*`
      ),
      `--------------------------------`,
      `*TOTAL BELANJA : ${formatRupiah(transaction.totalAmount)}*`,
      `Metode Bayar  : ${transaction.paymentMethod.toUpperCase()}`,
    ];

    if (transaction.paymentMethod === 'tunai' && transaction.cashPaid) {
      lines.push(`Uang Diterima : ${formatRupiah(transaction.cashPaid)}`);
      lines.push(`Kembalian     : ${formatRupiah(transaction.change || 0)}`);
    } else if (transaction.paymentMethod === 'kasbon') {
      lines.push(`Status        : Dicatat Kasbon (Hutang)`);
    }

    lines.push(`--------------------------------`);
    lines.push(`${storeProfile.receiptFooter}`);

    return lines.join('\n');
  };

  const handleCopyText = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    const phone = transaction.customerPhone ? transaction.customerPhone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.startsWith('0') ? `62${phone.slice(1)}` : phone;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Celebration / Status Header: Transaction is Already Completed! */}
        <div className="p-4 sm:p-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/30 shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  Sudah Selesai & Tersimpan
                </span>
                <span className="text-[10px] font-bold text-emerald-700">
                  Keranjang Dikosongkan
                </span>
              </div>
              <h3 className="font-black text-slate-900 text-base leading-tight mt-0.5">
                Transaksi Berhasil!
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Stok otomatis terpotong & keranjang belanja telah dikosongkan untuk transaksi baru.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
            title="Tutup Struk (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Transaction Info Pill */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-600 truncate max-w-[200px]">
            No: <strong className="text-slate-900">{transaction.invoiceNumber}</strong>
          </div>
          <div className="text-emerald-700 font-bold">
            Total: {formatRupiah(transaction.totalAmount)}
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100/60 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-xs bg-white p-5 rounded-2xl border border-slate-200 shadow-xs font-mono text-xs text-slate-800 space-y-3"
          >
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              {storeProfile.logoUrl && (
                <div className="flex justify-center mb-1.5">
                  <img
                    src={storeProfile.logoUrl}
                    alt={storeProfile.storeName}
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                </div>
              )}
              <h4 className="font-extrabold text-sm uppercase tracking-wide text-slate-900">
                {storeProfile.storeName}
              </h4>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{storeProfile.address}</p>
              <p className="text-[10px] text-slate-600">Telp: {storeProfile.phone}</p>
            </div>

            {/* Meta info */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Struk:</span>
                <span className="font-bold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span>{formatDate(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span>{transaction.customerName || 'Pelanggan Umum'}</span>
              </div>
              {transaction.cashierName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Kasir:</span>
                  <span>{transaction.cashierName}</span>
                </div>
              )}
            </div>

            {/* Itemized list */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-semibold text-slate-900">{item.product.name}</div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {item.quantity} {item.product.unit} x {formatRupiah(item.price)}
                    </span>
                    <span className="font-medium text-slate-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2.5">
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-0.5">
                <span>TOTAL:</span>
                <span>{formatRupiah(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Metode:</span>
                <span className="uppercase font-semibold text-emerald-700">
                  {transaction.paymentMethod === 'kasbon' ? 'KASBON (HUTANG)' : transaction.paymentMethod}
                </span>
              </div>
              {transaction.paymentMethod === 'tunai' && transaction.cashPaid !== undefined && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Tunai:</span>
                    <span>{formatRupiah(transaction.cashPaid)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(transaction.change || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Receipt Footer Note */}
            <div className="text-center pt-1 text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">
              {storeProfile.receiptFooter}
            </div>
          </div>
        </div>

        {/* Modal Action Area: Primary Action (Selesai/Transaksi Baru) + Optional Actions */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          {/* PRIMARY ACTION: Selesai / Siap Transaksi Baru */}
          <button
            type="button"
            onClick={handleFinishAndNewSale}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Selesai & Siap Transaksi Baru (Keranjang Kosong)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* SECONDARY OPTIONAL ACTIONS: Cetak & WhatsApp */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-0.5">
              <span>Opsi Pilihan (Jika Diperlukan):</span>
              <span className="text-[10px] font-normal text-slate-400">Hanya opsi tambahan</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Thermal</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquareShare className="w-3.5 h-3.5" />
                <span>Kirim WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Salin Teks Struk"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
