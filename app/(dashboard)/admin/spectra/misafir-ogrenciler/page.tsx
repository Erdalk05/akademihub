'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, UserX, Search, UserPlus } from 'lucide-react';

// ============================================================================
// SPECTRA - MİSAFİR ÖĞRENCİLER SAYFASI
// ============================================================================

export default function SpectraMisafirOgrencilerPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/spectra"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <UserX className="w-7 h-7 text-orange-500" />
              Misafir Öğrenciler
            </h1>
            <p className="text-gray-500 mt-1">Kuruma kayıtlı olmayan sınav katılımcıları</p>
          </div>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-600 transition-colors">
            <UserPlus className="w-4 h-4" />
            Kayıt Al
          </button>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Misafir Listesi</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ara..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="p-8 text-center text-gray-500">
            <UserX className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Misafir öğrenci listesi yakında</p>
            <p className="text-sm mt-2">Bu sayfa geliştirme aşamasındadır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

