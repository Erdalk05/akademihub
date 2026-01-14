'use client';

// ============================================================================
// SCORING RULES SETTINGS (Placeholder)
// Bu bileşen şu anda pasif - özellik henüz tamamlanmadı
// ============================================================================

import React from 'react';
import { AlertTriangle, Calculator } from 'lucide-react';

export default function ScoringRulesSettings() {
  return (
    <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Calculator className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-amber-800 mb-1">
            Puanlama Kuralları
          </h3>
          <p className="text-amber-700 text-sm">
            Bu özellik henüz geliştirilme aşamasındadır. 
            Puanlama kuralları yakında burada yapılandırılabilir olacaktır.
          </p>
        </div>
      </div>
    </div>
  );
}
