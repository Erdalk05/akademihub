'use client';

// ============================================================================
// SCORING RULES SETTINGS
// Sınav puanlama kuralları ayarları (placeholder)
// ============================================================================

import React from 'react';
import { Calculator, Info } from 'lucide-react';

export default function ScoringRulesSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-6 h-6 text-emerald-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Puanlama Kuralları</h2>
          <p className="text-sm text-gray-500">Sınav puanlama ve değerlendirme ayarları</p>
        </div>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Not:</strong> Bu özellik yakında eklenecektir. Şu anda varsayılan puanlama kuralları kullanılmaktadır.
        </div>
      </div>

      <div className="grid gap-6">
        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-4">Varsayılan Kurallar</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Doğru Cevap Puanı:</span>
              <strong className="text-gray-900">+1</strong>
            </div>
            <div className="flex justify-between">
              <span>Yanlış Cevap Cezası:</span>
              <strong className="text-gray-900">-0.25</strong>
            </div>
            <div className="flex justify-between">
              <span>Boş Cevap:</span>
              <strong className="text-gray-900">0</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
