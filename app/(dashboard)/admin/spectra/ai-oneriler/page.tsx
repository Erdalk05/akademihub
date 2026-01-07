'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';

// ============================================================================
// SPECTRA - AI ÖNERİLER SAYFASI
// ============================================================================

export default function SpectraAIOnerilerPage() {
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
              <Bot className="w-7 h-7 text-violet-500" />
              AI Öneriler
            </h1>
            <p className="text-gray-500 mt-1">Yapay zeka destekli akıllı analizler</p>
          </div>
        </div>

        {/* AI Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-6 text-white">
            <Sparkles className="w-10 h-10 mb-4" />
            <h3 className="font-bold text-lg mb-2">Konu Önerileri</h3>
            <p className="text-white/80 text-sm">Her öğrenci için kişiselleştirilmiş çalışma planı</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
            <Bot className="w-10 h-10 mb-4" />
            <h3 className="font-bold text-lg mb-2">Performans Tahmini</h3>
            <p className="text-white/80 text-sm">LGS/YKS puan tahminleri ve trend analizi</p>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 text-center text-gray-500">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">AI modülü yakında</p>
            <p className="text-sm mt-2">OpenAI/Claude entegrasyonu ile akıllı öneriler.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

