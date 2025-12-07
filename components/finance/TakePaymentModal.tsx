'use client';

import { useEffect, useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

type Props = {
  open: boolean;
  onClose: () => void;
  installment?: {
    id: string;
    installment_no: number;
    amount: number;
  } | null;
  onSuccess?: () => void;
  studentId?: string;
};

export default function TakePaymentModal({ open, onClose, installment, onSuccess, studentId }: Props) {
  const [method, setMethod] = useState<string>('cash'); // 'cash' | 'card' | 'bank'
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (installment) {
      setAmountPaid(String(installment.amount ?? 0));
      setPaymentDate(new Date().toISOString().slice(0, 10));
    } else {
      setAmountPaid('');
      setPaymentDate('');
    }
  }, [installment, open]);

  const handleSubmit = () => {
    if (!installment?.id) {
      setError('Geçersiz taksit');
      return;
    }
    if (!studentId) {
      setError('Öğrenci bilgisi eksik');
      return;
    }
    if (!amountPaid || Number(amountPaid) <= 0) {
      setError('Geçerli bir ödeme tutarı girin');
      return;
    }
    if (!paymentDate) {
      setError('Ödeme tarihi seçilmelidir');
      return;
    }
    setError(null);
    setOk(null);
    startTransition(async () => {
      // Yeni API: /api/installments/pay
      try {
        const res = await fetch('/api/installments/pay', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            installment_id: installment.id,
            payment_method: method,
            amount_paid: Number(amountPaid),
            payment_date: paymentDate,
            note: notes,
            student_id: studentId,
          }),
        });
        const js = await res.json();
        if (!res.ok || !js?.success) {
          setError(js?.error || 'Ödeme alınamadı');
          return;
        }
        setOk('Ödeme başarıyla alındı ve kaydedildi.');
        showToast('success', '✅ Ödeme alındı ve kaydedildi.');
        onSuccess?.();
        onClose();
      } catch (e: any) {
        setError(e?.message || 'Ödeme alınamadı');
      }
    });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Ödeme Al" size="md">
      <ToastContainer />
      {!installment ? (
        <div className="text-sm text-gray-600">Taksit seçilmedi.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Taksit No</p>
              <p className="font-semibold">{installment.installment_no}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Taksit Tutarı</p>
              <p className="font-semibold">₺{Number(installment.amount || 0).toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tarihi</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e)=>setPaymentDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tutarı</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amountPaid}
                onChange={(e)=>setAmountPaid(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
            <select value={method} onChange={(e)=>setMethod(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="cash">Nakit</option>
              <option value="card">Kart</option>
              <option value="bank">Banka</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Not (opsiyonel)</label>
            <textarea
              value={notes}
              onChange={(e)=>setNotes(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Açıklama"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {ok && <div className="text-sm text-green-600">{ok}</div>}
          <div className="pt-2 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">Vazgeç</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}


