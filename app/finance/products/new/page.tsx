'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [price, setPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(0);
  const [minimumStock, setMinimumStock] = useState<number | ''>(0);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Ürün adı zorunludur.');
      return;
    }
    const priceNum = Number(price || 0);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      alert('Geçerli bir fiyat giriniz.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/finance/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: category || 'other',
          price: priceNum,
          stock: Number(stock || 0),
          minimum_stock: Number(minimumStock || 0),
          description: description.trim() || null,
        }),
      });
      const js = await res.json().catch(() => null);
      if (!res.ok || !js?.success) {
        alert(js?.error || 'Ürün kaydedilemedi.');
        return;
      }
      router.push('/finance/products');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Geri
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Yeni Ürün</h1>
          <p className="mt-1 text-sm text-gray-500">
            Satış modülünde kullanılacak yeni bir ürün tanımlayın.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Ürün Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Örn: LGS Soru Bankası Seti"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="book">Kitap / Set</option>
                <option value="uniform">Forma / Kıyafet</option>
                <option value="stationery">Kırtasiye</option>
                <option value="food">Yemek / Kantin</option>
                <option value="service">Hizmet</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Birim Fiyat (₺) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Stok</label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Minimum Stok</label>
              <input
                type="number"
                min={0}
                value={minimumStock}
                onChange={(e) =>
                  setMinimumStock(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ürün hakkında kısa açıklama girin (opsiyonel)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push('/finance/products')}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              disabled={saving}
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


