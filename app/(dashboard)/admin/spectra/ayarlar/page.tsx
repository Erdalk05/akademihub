'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Bell, Palette, Database } from 'lucide-react';

// ============================================================================
// SPECTRA - AYARLAR SAYFASI
// ============================================================================

export default function SpectraAyarlarPage() {
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
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Settings className="w-7 h-7 text-gray-500" />
              Spectra Ayarları
            </h1>
            <p className="text-gray-500 mt-1">Modül yapılandırması</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-blue-500" />
              <h3 className="font-bold text-gray-900">Bildirimler</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Sınav sonucu bildirimleri ayarları</p>
            <button className="text-sm text-emerald-600 font-medium hover:underline">
              Ayarları Düzenle →
            </button>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-6 h-6 text-purple-500" />
              <h3 className="font-bold text-gray-900">Görünüm</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Rapor şablonları ve renk temaları</p>
            <button className="text-sm text-emerald-600 font-medium hover:underline">
              Ayarları Düzenle →
            </button>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-amber-500" />
              <h3 className="font-bold text-gray-900">Veri Yönetimi</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Sınav verileri ve arşiv ayarları</p>
            <button className="text-sm text-emerald-600 font-medium hover:underline">
              Ayarları Düzenle →
            </button>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-gray-500" />
              <h3 className="font-bold text-gray-900">Genel</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Net hesaplama ve puan formülleri</p>
            <button className="text-sm text-emerald-600 font-medium hover:underline">
              Ayarları Düzenle →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

