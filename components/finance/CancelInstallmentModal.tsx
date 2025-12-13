'use client';

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2, CheckCircle, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedInstallmentIds: string[];
  onSuccess: () => void;
}

export default function CancelInstallmentModal({ isOpen, onClose, selectedInstallmentIds, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (!reason.trim() || reason.trim().length < 3) {
      toast.error('İptal nedeni zorunludur (en az 3 karakter)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/installments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installment_ids: selectedInstallmentIds,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const msg = data.data.total_refund > 0
          ? `${data.data.cancelled_count} taksit iptal edildi. Toplam iade: ₺${data.data.total_refund.toLocaleString('tr-TR')}`
          : `${data.data.cancelled_count} taksit iptal edildi`;
        toast.success(msg);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'İptal başarısız');
      }
    } catch (error: any) {
      toast.error('Bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Taksit İptali</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Uyarı */}
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={18} />
              <span className="font-medium">
                {selectedInstallmentIds.length} taksit iptal edilecek
              </span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Bu işlem geri alınamaz. Ödenmiş taksitler için geri iade kaydı oluşturulacaktır.
            </p>
          </div>

          {/* İade Bilgisi */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <Undo2 size={18} />
              <span className="font-medium">Geri İade</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Ödenmiş taksitler için geri iade tutarı hesaplanacak ve finans kayıtlarına eklenecektir.
            </p>
          </div>

          {/* Neden */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              İptal Nedeni <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Kayıt iptali, öğrenci ayrılması, hatalı kayıt vb."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">En az 3 karakter giriniz</p>
          </div>

          {/* Hızlı sebepler */}
          <div className="flex flex-wrap gap-2">
            {['Kayıt iptali', 'Öğrenci ayrıldı', 'Hatalı kayıt', 'Veli talebi', 'Plan değişikliği'].map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                  reason === r
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
          >
            Vazgeç
          </button>
          <button
            onClick={handleCancel}
            disabled={loading || selectedInstallmentIds.length === 0 || reason.trim().length < 3}
            className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                İptal Ediliyor...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Taksitleri İptal Et
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

