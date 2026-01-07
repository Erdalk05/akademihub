'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Target } from 'lucide-react';

// ============================================================================
// SPECTRA - HEDEF TAKİBİ SAYFASI
// ============================================================================

export default function SpectraHedefTakibiPage() {
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
              <Target className="w-7 h-7 text-purple-500" />
              Hedef Takibi
            </h1>
            <p className="text-gray-500 mt-1">LGS/YKS hedef puan takibi</p>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 text-center text-gray-500">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Hedef takibi modülü yakında</p>
            <p className="text-sm mt-2">Öğrenci hedefleri ve ilerleme çubukları burada olacak.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

