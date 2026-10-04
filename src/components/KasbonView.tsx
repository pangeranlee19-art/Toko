import React, { useState, useMemo } from 'react';
import { DebtRecord, DebtPayment, StoreProfile } from '../types';
import { formatRupiah, formatDate, formatShortDate } from '../utils/format';
import {
  BookOpen,
  Plus,
  Search,
  MessageSquareShare,
  CheckCircle2,
  Clock,
  Check,
  X,
  User,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface KasbonViewProps {
  debts: DebtRecord[];
  storeProfile: StoreProfile;
  onAddDebt: (debt: DebtRecord) => void;
  onPayDebt: (debtId: string, amount: number, note: string) => void;
}

export const KasbonView: React.FC<KasbonViewProps> = ({
  debts,
  storeProfile,
  onAddDebt,
  onPayDebt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');

  // Modals
  const [isNewDebtModalOpen, setIsNewDebtModalOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('Bayar tunai di warung');

  // New debt form
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newItemsSummary, setNewItemsSummary] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Statistics
  const stats = useMemo(() => {
    let totalUnpaid = 0;
    let unpaidCount = 0;
    let totalPaid = 0;
    let paidCount = 0;

    debts.forEach((d) => {
      if (d.status === 'belum_lunas') {
        totalUnpaid += d.remainingDebt;
        unpaidCount++;
      } else {
        totalPaid += d.totalDebt;
        paidCount++;
      }
    });

    return { totalUnpaid, unpaidCount, totalPaid, paidCount };
  }, [debts]);

  // Filtered debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      let matchStatus = true;
      if (statusFilter === 'unpaid') matchStatus = d.status === 'belum_lunas';
      if (statusFilter === 'paid') matchStatus = d.status === 'lunas';

      const matchSearch =
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.customerPhone && d.customerPhone.includes(searchQuery)) ||
        d.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [debts, statusFilter, searchQuery]);

  // Open Pay Modal
  const handleOpenPay = (debt: DebtRecord) => {
    setPayingDebt(debt);
    setPayAmount(debt.remainingDebt.toString());
    setPayNote('Bayar tunai di warung');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Masukkan nominal pembayaran yang valid.');
      return;
    }
    onPayDebt(payingDebt.id, amount, payNote);
    setPayingDebt(null);
  };

  // Submit new debt directly
  const handleSaveNewDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Masukkan nominal hutang yang valid.');
      return;
    }

    const newRecord: DebtRecord = {
      id: `debt-${Date.now()}`,
      customerName: newCustomerName.trim(),
      customerPhone: newCustomerPhone.trim() || undefined,
      totalDebt: amount,
      remainingDebt: amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: newDueDate || undefined,
      status: 'belum_lunas',
      itemsSummary: newItemsSummary.trim() || 'Belanja kelontong harian',
      payments: [],
      notes: newNotes.trim() || undefined,
    };

    onAddDebt(newRecord);
    setIsNewDebtModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewAmount('');
    setNewDueDate('');
    setNewItemsSummary('');
    setNewNotes('');
  };

  // Generate courtesy WhatsApp reminder message
  const handleSendWhatsAppReminder = (debt: DebtRecord) => {
    const dueDateStr = debt.dueDate ? formatShortDate(debt.dueDate) : 'secepatnya';
    const message = [
      `Halo Bpk/Ibu *${debt.customerName}*, semoga sehat selalu.`,
      `Mengingatkan dengan sopan catatan kasbon belanja di *${storeProfile.storeName}*:`,
      `• Sisa Bon: *${formatRupiah(debt.remainingDebt)}*`,
      `• Tanggal Belanja: ${formatShortDate(debt.createdAt)}`,
      `• Rincian: ${debt.itemsSummary}`,
      debt.dueDate ? `• Perjanjian Jatuh Tempo: ${dueDateStr}` : '',
      `Terima kasih banyak ya Bpk/Ibu 🙏`,
    ]
      .filter(Boolean)
      .join('\n');

    const cleanPhone = debt.customerPhone
      ? debt.customerPhone.replace(/[^0-9]/g, '')
      : '';
    const formattedPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-8 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>Total Piutang Belum Lunas</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tabular-nums">
            {formatRupiah(stats.totalUnpaid)}
          </p>
          <p className="text-[11px] text-slate-500">
            Dari {stats.unpaidCount} pelanggan yang masih memiliki catatan bon aktif
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Total Kasbon yang Sudah Lunas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tabular-nums">
            {formatRupiah(stats.totalPaid)}
          </p>
          <p className="text-[11px] text-slate-500">
            {stats.paidCount} catatan kasbon telah diselesaikan pelunasannya
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pelanggan atau nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'unpaid' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Belum Lunas ({stats.unpaidCount})
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Sudah Lunas ({stats.paidCount})
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Semua
              </button>
            </div>

            <button
              onClick={() => setIsNewDebtModalOpen(true)}
              className="flex items-center gap-1.5 py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Kasbon</span>
            </button>
          </div>
        </div>
      </div>

      {/* Debt Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDebts.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <BookOpen className="w-12 h-12 mx-auto text-slate-200" />
            <p className="font-semibold text-slate-700">Tidak ada catatan kasbon</p>
            <p className="text-xs text-slate-400">
              {statusFilter === 'unpaid'
                ? 'Alhamdulillah, tidak ada kasbon yang belum lunas!'
                : 'Belum ada data kasbon pada kategori ini.'}
            </p>
          </div>
        ) : (
          filteredDebts.map((debt) => {
            const isPaid = debt.status === 'lunas';

            return (
              <div
                key={debt.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between space-y-3 ${
                  isPaid ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200'
                }`}
              >
                <div>
                  {/* Card Header: Customer & Status */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <h4 className="font-bold text-slate-900 text-sm">{debt.customerName}</h4>
                      </div>
                      {debt.customerPhone && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono pl-6">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{debt.customerPhone}</span>
                        </p>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isPaid ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </div>

                  {/* Financial amount */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Sisa Hutang:</span>
                      <span className="text-xl font-black text-rose-600 font-mono tabular-nums">
                        {formatRupiah(debt.remainingDebt)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Total Awal:</span>
                      <span className="text-xs font-semibold text-slate-600 font-mono tabular-nums">
                        {formatRupiah(debt.totalDebt)}
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="mt-2.5 bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600">
                    <p className="font-medium text-slate-800 mb-0.5">Barang yang dibon:</p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{debt.itemsSummary}</p>
                  </div>

                  {/* Dates & notes */}
                  <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Tanggal: {formatShortDate(debt.createdAt)}</span>
                      {debt.dueDate && (
                        <span className="font-semibold text-amber-700">
                          Jatuh tempo: {formatShortDate(debt.dueDate)}
                        </span>
                      )}
                    </div>
                    {debt.notes && (
                      <p className="text-slate-500 italic">Catatan: "{debt.notes}"</p>
                    )}
                  </div>

                  {/* Payment history */}
                  {debt.payments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <span className="font-semibold text-slate-700 block">Riwayat Cicilan:</span>
                      {debt.payments.map((p) => (
                        <div key={p.id} className="flex justify-between font-mono">
                          <span>{formatShortDate(p.date)} - {p.note}</span>
                          <span className="font-semibold text-emerald-600">+{formatRupiah(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSendWhatsAppReminder(debt)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <MessageSquareShare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ingatkan WA</span>
                  </button>

                  {!isPaid && (
                    <button
                      onClick={() => handleOpenPay(debt)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Bayar / Cicil</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pay Debt Modal */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Pelunasan / Cicilan Kasbon</h3>
                <p className="text-[11px] text-slate-600 font-semibold">{payingDebt.customerName}</p>
              </div>
              <button
                onClick={() => setPayingDebt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Sisa Hutang Saat Ini:</span>
                <span className="font-black text-rose-600 text-base font-mono tabular-nums">
                  {formatRupiah(payingDebt.remainingDebt)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal yang Dibayarkan (Rp):
                </label>
                <input
                  type="number"
                  min={1}
                  max={payingDebt.remainingDebt}
                  required
                  autoFocus
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick payoff button */}
              <button
                type="button"
                onClick={() => setPayAmount(payingDebt.remainingDebt.toString())}
                className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                Bayar Lunas Langsung ({formatRupiah(payingDebt.remainingDebt)})
              </button>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pembayaran:</label>
                <input
                  type="text"
                  placeholder="Contoh: Titip lewat tetangga / tunai"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pembayaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Debt Direct Entry Modal */}
      {isNewDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Catat Kasbon Baru Manual</h3>
                  <p className="text-[11px] text-slate-500">Pencatatan langsung hutang pelanggan</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewDebtModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDebt} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Pelanggan <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pak Joko Bengkel"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. WhatsApp / HP (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="0812xxxx"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal Hutang (Rp) <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="Contoh: 45000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Janji Jatuh Tempo (Opsional):
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rincian Barang yang Diambil:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Beras 5kg (1), Minyak Bimoli 1L (1), Telur 1kg"
                  value={newItemsSummary}
                  onChange={(e) => setNewItemsSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan:</label>
                <input
                  type="text"
                  placeholder="Contoh: Janji bayar pas gajian awal bulan"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDebtModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Catatan Kasbon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
