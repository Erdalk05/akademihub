'use client';

import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

// ============================================================================
// MATCH WARNING BANNER COMPONENT
// Eşleşme bekleyen öğrenci uyarısı
// ============================================================================

interface MatchWarningBannerProps {
  pendingCount: number;
  onOpenModal?: () => void;
}

export function MatchWarningBanner({
  pendingCount,
  onOpenModal,
}: MatchWarningBannerProps) {
  // Eğer bekleyen yoksa gösterme
  if (pendingCount === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-amber-800">
            Eşleşme Bekleyen Öğrenci
          </p>
          <p className="text-sm text-amber-600">
            {pendingCount} öğrenci henüz asil öğrenci ile eşleştirilmedi.
          </p>
        </div>
      </div>
      {onOpenModal && (
        <button
          onClick={onOpenModal}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
        >
          Eşleştirmeyi Tamamla
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default MatchWarningBanner;

