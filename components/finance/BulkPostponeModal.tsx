'use client';

import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedInstallmentIds: string[];
  onSuccess: () => void;
}

export default function BulkPostponeModal({ isOpen, onClose, selectedInstallmentIds, onSuccess }: Props) {
  const [days, setDays] = useState<number>(7);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePostpone = async () => {
    if (days < 1 || days > 365) {
      toast.error('Gün sayısı 1-365 arasında olmalıdır');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/installments/bulk-postpone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installment_ids: selectedInstallmentIds,
          days,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || `${data.data.postponed_count} taksit ötelendi`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Öteleme başarısız');
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
            <div className="p-2 bg-amber-100 rounded-xl">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Toplu Taksit Öteleme</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Seçili taksit sayısı */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={18} />
              <span className="font-medium">
                {selectedInstallmentIds.length} taksit seçildi
              </span>
            </div>
            <p className="text-sm text-amber-600 mt-1">
              Ödenmiş veya iptal edilmiş taksitler otomatik olarak atlanacaktır.
            </p>
          </div>

          {/* Gün sayısı */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kaç Gün Ötelensin?
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                min={1}
                max={365}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
              <span className="text-gray-500 font-medium">gün</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                    days === d
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d} gün
                </button>
              ))}
            </div>
          </div>

          {/* Neden */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Öteleme Nedeni (Opsiyonel)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Veli talebi, ekonomik durum vb."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
          >
            İptal
          </button>
          <button
            onClick={handlePostpone}
            disabled={loading || selectedInstallmentIds.length === 0}
            className="px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Öteleniyor...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Taksitleri Ötele
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

