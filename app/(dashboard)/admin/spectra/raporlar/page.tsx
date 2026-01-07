'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, FileSpreadsheet, Download } from 'lucide-react';

// ============================================================================
// SPECTRA - RAPORLAR SAYFASI
// ============================================================================

export default function SpectraRaporlarPage() {
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
              <FileText className="w-7 h-7 text-emerald-500" />
              Raporlar
            </h1>
            <p className="text-gray-500 mt-1">PDF ve Excel raporları</p>
          </div>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <FileText className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Kurum Raporu</h3>
            <p className="text-sm text-gray-500">Tüm kurumun genel performans raporu</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Sınıf Raporu</h3>
            <p className="text-sm text-gray-500">Sınıf bazlı detaylı analiz</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <Download className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Öğrenci Raporu</h3>
            <p className="text-sm text-gray-500">Bireysel öğrenci karnesi</p>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-gray-900">Son Oluşturulan Raporlar</h2>
          </div>
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Rapor geçmişi yakında</p>
            <p className="text-sm mt-2">Oluşturulan raporların listesi burada olacak.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

