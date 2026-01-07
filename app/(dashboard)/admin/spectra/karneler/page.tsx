'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Printer, Mail } from 'lucide-react';

// ============================================================================
// SPECTRA - KARNELER SAYFASI
// Öğrenci karneleri oluşturma ve indirme
// ============================================================================

export default function SpectraKarnelerPage() {
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
              <FileText className="w-7 h-7 text-emerald-500" />
              Öğrenci Karneleri
            </h1>
            <p className="text-gray-500 mt-1">Performans karneleri oluşturun ve paylaşın</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <Download className="w-10 h-10 text-emerald-500 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Toplu Karne İndir</h3>
            <p className="text-sm text-gray-500">Tüm öğrencilerin karnelerini PDF olarak indirin</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <Printer className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Yazdır</h3>
            <p className="text-sm text-gray-500">Karneleri doğrudan yazdırın</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <Mail className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Velilere Gönder</h3>
            <p className="text-sm text-gray-500">WhatsApp veya e-posta ile paylaşın</p>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-gray-900">Karne Önizleme</h2>
          </div>
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Karne modülü yakında</p>
            <p className="text-sm mt-2">Bu sayfa geliştirme aşamasındadır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

