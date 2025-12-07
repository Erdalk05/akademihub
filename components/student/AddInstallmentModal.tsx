'use client';

import { useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

type Props = {
  open: boolean;
  onClose: () => void;
  studentId: string;
  nextInstallmentNo: number;
  defaultDueDate?: string;
  onSuccess?: () => void;
};

export default function AddInstallmentModal({
  open,
  onClose,
  studentId,
  nextInstallmentNo,
  defaultDueDate,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(defaultDueDate || '');
  const [description, setDescription] = useState<string>('');
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const handleSubmit = () => {
    const a = Number(amount);
    if (!studentId) {
      setError('Öğrenci bilgisi bulunamadı.');
      return;
    }
    if (!a || a <= 0) {
      setError('Geçerli bir taksit tutarı girin.');
      return;
    }
    if (!dueDate) {
      setError('Vade tarihini seçin.');
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/installments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
            installment_no: nextInstallmentNo,
            amount: a,
            due_date: dueDate,
            description: description || null,
          }),
        });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success) {
          setError(js?.error || 'Taksit eklenemedi.');
          return;
        }
        showToast('success', 'Yeni taksit eklendi.');
        onSuccess?.();
        onClose();
        setAmount('');
        setDescription('');
      } catch (e: any) {
        setError(e?.message || 'Taksit eklenemedi.');
      }
    });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Yeni Taksit Ekle" size="md">
      <ToastContainer />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-700">Taksit No</p>
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
              {nextInstallmentNo}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Taksit Tutarı (₺)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Vade Tarihi</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Açıklama (opsiyonel)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Örn: Ek taksit"
            />
          </div>
        </div>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-800"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submitting ? 'Kaydediliyor...' : 'Taksit Ekle'}
          </button>
        </div>
      </div>
    </Modal>
  );
}


