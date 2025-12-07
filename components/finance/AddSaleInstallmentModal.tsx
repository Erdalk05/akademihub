'use client';

import { useState, useTransition } from 'react';
import { X, PlusCircle, Calendar, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  saleId: string;
  studentId: string;
  nextInstallmentNo: number;
  defaultDueDate: string;
  onSuccess: () => void;
}

export default function AddSaleInstallmentModal({
  open,
  onClose,
  saleId,
  studentId,
  nextInstallmentNo,
  defaultDueDate,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [isSubmitting, startTransition] = useTransition();
  const { showToast, ToastContainer } = useToast();

  if (!open) return null;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      showToast('error', 'Geçerli bir tutar giriniz.');
      return;
    }
    if (!dueDate) {
      showToast('error', 'Vade tarihi seçiniz.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/finance/sales/installments/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saleId,
            studentId,
            installmentNo: nextInstallmentNo,
            amount: Number(amount),
            dueDate,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          showToast('error', data?.error || 'Taksit eklenemedi.');
          return;
        }

        showToast('success', 'Satışa yeni taksit eklendi.');
        setTimeout(() => {
          onSuccess();
          onClose();
          setAmount('');
        }, 800);
      } catch {
        showToast('error', 'Bağlantı hatası oluştu.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <ToastContainer />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-200 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
              <PlusCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Satışa Ek Taksit Ekle</h2>
              <p className="text-xs text-purple-100">
                Bu satışın ödeme planına manuel taksit ekleyin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-100 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Installment No */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-900">
            <span className="text-sm font-medium">Eklenecek Taksit No</span>
            <span className="text-lg font-bold">#{nextInstallmentNo}</span>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Taksit Tutarı</label>
            <div className="relative">
              <Wallet
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-semibold text-gray-900"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vade Tarihi</label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {isSubmitting ? 'Ekleniyor...' : 'Taksiti Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}


