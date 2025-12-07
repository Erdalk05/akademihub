'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minimum_stock: number;
  description?: string | null;
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/products?query=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });
      const js = await res.json().catch(() => null);
      if (js?.success && Array.isArray(js.data)) {
        setItems(js.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateQuick = async () => {
    const name = window.prompt('Ürün adı:');
    if (!name) return;
    const priceStr = window.prompt('Birim fiyat (₺):', '0');
    const price = Number(priceStr || 0);
    if (!Number.isFinite(price) || price <= 0) {
      alert('Geçerli bir fiyat giriniz');
      return;
    }
    const category = window.prompt('Kategori (ör: book, uniform, stationery):', 'other') || 'other';

    const res = await fetch('/api/finance/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, category, stock: 0, minimum_stock: 0 }),
    });
    const js = await res.json().catch(() => null);
    if (!res.ok || !js?.success) {
      alert(js?.error || 'Ürün kaydedilemedi');
      return;
    }
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold text-gray-900">Ürünler</h1>
          <p className="text-xs text-gray-500">
            Satış modülünde kullanılacak kitap, üniforma, kırtasiye vb. ürünlerinizi yönetin.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateQuick}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          Yeni Ürün
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün adı ile ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchProducts();
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={fetchProducts}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          Ara
        </button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-4 text-xs text-gray-500">Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-xs text-gray-500">Kayıtlı ürün bulunamadı.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2 text-right">Fiyat</th>
                <th className="px-4 py-2 text-right">Stok</th>
                <th className="px-4 py-2 text-right">Min. Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">
                    <div className="font-medium">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-gray-500">{p.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs uppercase tracking-wide text-gray-500">
                    {p.category}
                  </td>
                  <td className="px-4 py-2 text-right">
                    ₺{Number(p.price || 0).toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-800">{p.stock}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{p.minimum_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
}



