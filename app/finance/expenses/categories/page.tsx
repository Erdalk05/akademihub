'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

type CategoryRow = {
  category: string;
  totalAmount: number;
  count: number;
};

export default function ExpenseCategoriesPage() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/finance/expenses', { cache: 'no-store' });
        const js = await res.json().catch(() => null);

        if (!res.ok || !js?.success || !Array.isArray(js.data)) {
          setError(js?.error || 'Kategoriler alınamadı.');
          return;
        }

        const map: Record<string, CategoryRow> = {};
        (js.data as any[]).forEach((e) => {
          const key = String(e.category || 'other');
          if (!map[key]) {
            map[key] = {
              category: key,
              totalAmount: 0,
              count: 0,
            };
          }
          map[key].totalAmount += Number(e.amount || 0);
          map[key].count += 1;
        });

        setRows(Object.values(map));
      } catch {
        setError('Kategoriler alınırken bağlantı hatası oluştu.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows
      .filter((r) => !q || r.category.toLowerCase().includes(q))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [rows, search]);

  const overallTotal = rows.reduce(
    (sum, r) => sum + Number(r.totalAmount || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Gider Kategorileri
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Toplam {rows.length} kategori • Toplam Tutar:{' '}
            <span className="font-semibold">
              ₺{overallTotal.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
              })}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:max-w-xs">
            <Search
              className="absolute left-3 top-3 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kategori ara..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <p className="text-xs text-gray-500">
            Not: Şu an kategoriler, mevcut gider kayıtlarından otomatik
            türetilmektedir.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        {loading && (
          <p className="text-sm text-gray-600">Kategoriler yükleniyor...</p>
        )}
        {!loading && error && (
          <p className="text-sm text-rose-600">{error}</p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-gray-500">
            Henüz gider veya kategori bulunamadı.
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left py-2">Kategori</th>
                  <th className="text-right py-2">Toplam Tutar</th>
                  <th className="text-right py-2">Kayıt Sayısı</th>
                  <th className="text-right py-2">Toplam İçindeki Payı</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const ratio =
                    overallTotal > 0
                      ? (row.totalAmount / overallTotal) * 100
                      : 0;
                  return (
                    <tr
                      key={row.category}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 font-medium text-gray-900">
                        {row.category}
                      </td>
                      <td className="py-3 text-right text-gray-900">
                        ₺{row.totalAmount.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        {row.count}
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        %{ratio.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


