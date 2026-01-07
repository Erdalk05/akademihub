'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Search, Filter, Download, UserCheck, UserX } from 'lucide-react';

// ============================================================================
// SPECTRA - ÖĞRENCİLER SAYFASI
// Asil öğrenci performansları
// ============================================================================

export default function SpectraOgrencilerPage() {
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
              <Users className="w-7 h-7 text-emerald-500" />
              Öğrenci Performansları
            </h1>
            <p className="text-gray-500 mt-1">Asil öğrencilerin tüm sınav performansları</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Öğrenci ara..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option>Tüm Sınıflar</option>
            <option>8/A</option>
            <option>8/B</option>
            <option>7/A</option>
          </select>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-600 transition-colors">
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500">Toplam Öğrenci</span>
            </div>
            <p className="text-2xl font-black text-gray-900">113</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-medium text-gray-500">Sınav Katılımı</span>
            </div>
            <p className="text-2xl font-black text-gray-900">98</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-medium text-gray-500">Ort. Net</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">67.3</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-5 h-5 text-red-500" />
              <span className="text-xs font-medium text-gray-500">Risk Altında</span>
            </div>
            <p className="text-2xl font-black text-red-500">12</p>
          </div>
        </div>

        {/* Placeholder Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-gray-900">Öğrenci Listesi</h2>
          </div>
          <div className="p-8 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Öğrenci tablosu yakında</p>
            <p className="text-sm mt-2">Bu sayfa geliştirme aşamasındadır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

