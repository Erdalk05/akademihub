'use client';

import React, { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (customer: { id: string; full_name: string; phone?: string | null }) => void;
};

export default function NewSalesCustomerDialog({ open, onClose, onCreated }: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Ad soyad zorunludur');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/finance/sales-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          note: note.trim() || null,
        }),
      });

      const js = await res.json().catch(() => null);
      if (!res.ok || !js?.success) {
        throw new Error(js?.error || 'Müşteri kaydedilemedi');
      }

      if (onCreated) {
        onCreated(js.data);
      }

      setFullName('');
      setPhone('');
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Müşteri kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Yeni Harici Müşteri</h2>
        <p className="mb-4 text-xs text-gray-500">
          Bu form sadece satış modülü için kullanılır ve öğrenciler tablosuna herhangi bir kayıt eklemez.
        </p>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Ad Soyad</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Örn: Mehmet Kaya"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Telefon (opsiyonel)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+90 ..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Not (opsiyonel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Örn: Velidir, sadece kırtasiye alışverişi yapıyor..."
            />
          </div>

          <div className="mt-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              disabled={loading}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



