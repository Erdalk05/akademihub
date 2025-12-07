'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, FileText, Loader2 } from 'lucide-react';
import { ExpenseStatusEnum, ExpenseTypeEnum } from '@/types/finance.types';

export default function NewExpensePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseTypeEnum>(ExpenseTypeEnum.PAYROLL);
  const [status, setStatus] = useState<ExpenseStatusEnum>(ExpenseStatusEnum.PAID);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!title.trim()) {
      // eslint-disable-next-line no-alert
      alert('Başlık (gider adı) zorunludur.');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      // eslint-disable-next-line no-alert
      alert('Geçerli bir tutar giriniz.');
      return;
    }
    if (!date) {
      // eslint-disable-next-line no-alert
      alert('Tarih seçiniz.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/finance/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            category,
            amount: amt,
            status,
            date,
            description: description.trim() || null,
          }),
        });
        const js = await res.json().catch(() => null);
        if (!res.ok || !js?.success) {
          // eslint-disable-next-line no-alert
          alert(js?.error || 'Gider kaydedilemedi');
          return;
        }

        // eslint-disable-next-line no-alert
        alert('Gider kaydedildi.');
        router.push('/finance/expenses');
      } catch (e: any) {
        // eslint-disable-next-line no-alert
        alert(e?.message || 'Bağlantı hatası');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-hidden">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/finance/expenses')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft size={14} />
            Gider listesine dön
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Yeni Gider Kaydı</h1>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Sol: temel bilgiler */}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Gider Başlığı
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Eylül 1. Hafta Bordrosu"
                    className="w-full rounded-lg border border-gray-300 px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseTypeEnum)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={ExpenseTypeEnum.PAYROLL}>Bordro</option>
                  <option value={ExpenseTypeEnum.UTILITIES}>Elektrik / Su / Gaz</option>
                  <option value={ExpenseTypeEnum.MATERIALS}>Malzeme</option>
                  <option value={ExpenseTypeEnum.MAINTENANCE}>Bakım</option>
                  <option value={ExpenseTypeEnum.RENT}>Kira</option>
                  <option value={ExpenseTypeEnum.OTHER}>Diğer</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Durum
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExpenseStatusEnum)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={ExpenseStatusEnum.PAID}>Ödendi</option>
                  <option value={ExpenseStatusEnum.APPROVED}>Onaylandı</option>
                  <option value={ExpenseStatusEnum.PENDING}>Beklemede</option>
                </select>
              </div>
            </div>

            {/* Sağ: tutar / tarih / açıklama */}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Tutar
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-gray-500">
                    ₺
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Tarih
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Açıklama / Not
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Örn: Eylül maaş bordrosu, 5 personel..."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/finance/expenses')}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-70"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



