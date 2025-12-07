'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ExpenseStatusEnum } from '@/types/finance.types';

type ExpenseDetail = {
  id: string;
  title: string;
  category: string;
  amount: number;
  status: ExpenseStatusEnum | string;
  date: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const expenseId = params?.id;

  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [similar, setSimilar] = useState<ExpenseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expenseId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/finance/expenses?id=${expenseId}`, {
          cache: 'no-store',
        });
        const js = await res.json().catch(() => null);

        if (!res.ok || !js?.success || !Array.isArray(js.data) || js.data.length === 0) {
          setError(js?.error || 'Gider bulunamadı.');
          return;
        }

        const row = js.data[0] as ExpenseDetail;
        setExpense(row);

        if (row.category) {
          const similarRes = await fetch(
            `/api/finance/expenses?category=${encodeURIComponent(
              row.category,
            )}&status=paid`,
            { cache: 'no-store' },
          );
          const similarJs = await similarRes.json().catch(() => null);
          if (similarRes.ok && similarJs?.success && Array.isArray(similarJs.data)) {
            setSimilar(
              similarJs.data
                .filter((e: any) => e.id !== row.id)
                .slice(0, 5) as ExpenseDetail[],
            );
          }
        }
      } catch {
        setError('Gider bilgileri alınırken bağlantı hatası oluştu.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [expenseId]);

  const copyId = async () => {
    if (!expense?.id || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(expense.id);
    } catch {
      // sessiz geç
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/finance/expenses')}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Listeye dön
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {loading && (
            <p className="text-sm text-gray-600">Gider bilgileri yükleniyor...</p>
          )}
          {!loading && error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}
          {!loading && !error && expense && (
            <>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                    {expense.title}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Kategori:{' '}
                    <span className="font-medium text-gray-800">
                      {expense.category}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ₺{Number(expense.amount || 0).toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tarih:{' '}
                    {expense.date
                      ? new Date(expense.date).toLocaleDateString('tr-TR')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Durum</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {expense.status}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Oluşturulma
                  </p>
                  <p className="text-sm text-gray-900">
                    {expense.created_at
                      ? new Date(expense.created_at).toLocaleString('tr-TR')
                      : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Son Güncelleme
                  </p>
                  <p className="text-sm text-gray-900">
                    {expense.updated_at
                      ? new Date(expense.updated_at).toLocaleString('tr-TR')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Açıklama
                </p>
                <p className="text-sm text-gray-800">
                  {expense.description || 'Açıklama girilmemiş.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium">ID:</span>
                  <button
                    type="button"
                    onClick={copyId}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    <span className="font-mono">
                      {expense.id.slice(0, 8)}...
                    </span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Benzer Harcamalar
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Aynı kategoride, en son eklenen benzer giderler.
          </p>
          {similar.length === 0 && (
            <p className="text-sm text-gray-500">
              Bu kategori için başka kayıt bulunamadı.
            </p>
          )}
          <div className="space-y-3">
            {similar.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => router.push(`/finance/expenses/${e.id}`)}
                className="w-full text-left bg-gray-50 hover:bg-gray-100 transition rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.title}</p>
                  <p className="text-xs text-gray-500">
                    {e.date
                      ? new Date(e.date).toLocaleDateString('tr-TR')
                      : '-'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  ₺{Number(e.amount || 0).toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


