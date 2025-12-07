'use client';

import { useEffect, useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { FinanceSummary } from '@/lib/types/finance';

type Props = {
  open: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess?: () => void;
  summary?: FinanceSummary | null;
};

export default function CreateInstallmentsModal({
  open,
  onClose,
  studentId,
  onSuccess,
  summary,
}: Props) {
  const [count, setCount] = useState<string>('3');
  const [amount, setAmount] = useState<string>('');
  const [firstDate, setFirstDate] = useState<string>('');
  const [interval, setInterval] = useState<'monthly' | 'weekly'>('monthly');
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (open) {
      setError(null);
      if (!firstDate) {
        setFirstDate(new Date().toISOString().slice(0, 10));
      }
    }
  }, [open, firstDate]);

  const handleSubmit = () => {
    const c = Number(count);
    const a = Number(amount);
    if (!studentId) {
      setError('Öğrenci bilgisi bulunamadı.');
      return;
    }
    if (!c || c <= 0) {
      setError('Geçerli bir taksit sayısı girin.');
      return;
    }
    if (!a || a <= 0) {
      setError('Geçerli bir taksit tutarı girin.');
      return;
    }
    if (!firstDate) {
      setError('İlk vade tarihini seçin.');
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/installments/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
            count: c,
            amount: a,
            first_due_date: firstDate,
            interval,
          }),
        });

        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success) {
          setError(js?.error || 'Taksitler oluşturulamadı.');
          return;
        }

        showToast('success', 'Taksit planı yeniden düzenlendi.');
        onSuccess?.();
        onClose();
      } catch (e: any) {
        setError(e?.message || 'Taksitler oluşturulamadı.');
      }
    });
  };

  const total = summary?.total || 0;
  const paid = summary?.paid || 0;
  const remaining = summary?.balance || 0;
  const remainingInstallmentCount =
    summary?.installments?.filter((it) => !it.is_paid).length ?? 0;

  return (
  <Modal isOpen={open} onClose={onClose} title="Taksit Planını Yeniden Düzenle" size="md">
      <ToastContainer />
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold">
            i
          </div>
          <p>
            Bu işlem mevcut taksit planını (varsa) iptal eder ve yerine yeni bir plan oluşturur.
            Ödenmiş taksitler korunur, yalnızca ödenmemiş taksitler yeniden planlanır.
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 px-4 py-3 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Mevcut Plan Özeti</h3>
          {summary ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                <dt className="text-gray-600">Toplam Borç</dt>
                <dd className="font-semibold text-gray-900">
                  ₺{total.toLocaleString('tr-TR')}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                <dt className="text-gray-600">Ödenen</dt>
                <dd className="font-semibold text-emerald-700">
                  ₺{paid.toLocaleString('tr-TR')}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                <dt className="text-gray-600">Kalan</dt>
                <dd className="font-semibold text-red-600">
                  ₺{remaining.toLocaleString('tr-TR')}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                <dt className="text-gray-600">Kalan Taksit</dt>
                <dd className="font-semibold text-gray-900">
                  {remainingInstallmentCount}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-gray-600">
              Bu öğrenci için henüz kayıtlı bir taksit planı bulunmuyor. Aşağıdan yeni planı
              oluşturabilirsiniz.
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-white px-4 py-3 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Yeni Plan</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Yeni Taksit Sayısı
              </label>
              <input
                type="number"
                min={1}
                value={count}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setCount(nextValue);
                  const nextCount = Number(nextValue);
                  if (remaining > 0 && nextCount > 0) {
                    const per = remaining / nextCount;
                    setAmount(per.toFixed(2));
                  }
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Yeni Taksit Tutarı (₺)
              </label>
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
              <label className="mb-1 block text-xs font-medium text-gray-700">
                İlk Vade Tarihi
              </label>
              <input
                type="date"
                value={firstDate}
                onChange={(e) => setFirstDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Periyot</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as 'monthly' | 'weekly')}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="monthly">Aylık</option>
                <option value="weekly">Haftalık</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="text-xs text-red-600">{error}</div>}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-start gap-2 text-xs text-red-600">
            <span className="mt-0.5 text-sm">⚠️</span>
            <p>
              Bu işlem geri alınamaz. Mevcut ödenmemiş taksitler silinerek yeni plana göre
              oluşturulacaktır.
            </p>
          </div>
          <div className="flex gap-2">
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
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor...' : 'Yeniden Düzenle'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}



