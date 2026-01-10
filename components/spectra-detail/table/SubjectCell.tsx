// ============================================================================
// SUBJECT CELL - Ders Hücresi (Özdebir/K12Net Formatı)
// Net + Doğru/Yanlış gösterimi
// ============================================================================

'use client';

import React from 'react';
import type { SubjectResult } from '@/types/spectra-detail';
import { cn } from '@/lib/utils';

interface SubjectCellProps {
  subject: SubjectResult;
  format?: 'ozdebir' | 'k12net' | 'standart';
  compact?: boolean;
  showPercentage?: boolean;
  highlightTop?: boolean;  // En yüksek netler vurgulansın mı
  highlightLow?: boolean;  // En düşük netler vurgulansın mı
}

export function SubjectCell({
  subject,
  format = 'ozdebir',
  compact = false,
  showPercentage = false,
  highlightTop = false,
  highlightLow = false,
}: SubjectCellProps) {
  const { net, dogru, yanlis, soruSayisi, basariYuzdesi } = subject;

  // Renklendirme mantığı
  const isFullScore = net === soruSayisi;
  const isZero = net === 0;
  const isHighSuccess = basariYuzdesi >= 80;
  const isLowSuccess = basariYuzdesi < 40;

  const cellClass = cn(
    'flex flex-col items-center justify-center px-2 py-1.5 text-center border-r border-gray-200',
    compact ? 'py-1' : 'py-1.5',
    {
      'bg-emerald-50 text-emerald-700 font-bold': isFullScore,
      'bg-red-50 text-red-600': isZero && highlightLow,
      'bg-green-50': !isFullScore && isHighSuccess && highlightTop,
      'bg-amber-50': !isFullScore && isLowSuccess && highlightLow,
      'hover:bg-gray-50 transition-colors': !isFullScore && !isZero,
    }
  );

  if (format === 'ozdebir') {
    // Özdebir Format: Net üstte (büyük), Doğru.Yanlış altta (küçük)
    return (
      <div className={cellClass}>
        <div className={cn(
          'font-bold',
          compact ? 'text-sm' : 'text-base',
          isFullScore ? 'text-emerald-700' : 'text-gray-900'
        )}>
          {net.toFixed(1)}
        </div>
        <div className={cn(
          'text-gray-500 font-mono',
          compact ? 'text-[10px]' : 'text-xs'
        )}>
          {dogru}.{yanlis}
        </div>
        {showPercentage && (
          <div className="text-[9px] text-gray-400 mt-0.5">
            {basariYuzdesi.toFixed(0)}%
          </div>
        )}
      </div>
    );
  }

  if (format === 'k12net') {
    // K12Net Format: Net ve Doğru/Yanlış yan yana
    return (
      <div className={cellClass}>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'font-bold',
            compact ? 'text-sm' : 'text-base',
            isFullScore ? 'text-emerald-700' : 'text-gray-900'
          )}>
            {net.toFixed(1)}
          </span>
          <span className="text-gray-400">/</span>
          <span className={cn(
            'text-gray-600 font-mono',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {dogru}-{yanlis}
          </span>
        </div>
        {showPercentage && (
          <div className="text-[9px] text-gray-400 mt-0.5">
            {basariYuzdesi.toFixed(0)}%
          </div>
        )}
      </div>
    );
  }

  // Standart Format: Sadece net
  return (
    <div className={cellClass}>
      <div className={cn(
        'font-bold',
        compact ? 'text-sm' : 'text-lg',
        isFullScore ? 'text-emerald-700' : 'text-gray-900'
      )}>
        {net.toFixed(2)}
      </div>
      {showPercentage && (
        <div className="text-xs text-gray-500 mt-1">
          {basariYuzdesi.toFixed(0)}%
        </div>
      )}
    </div>
  );
}

/**
 * Puan Türü Hücresi (LGS, Sözel, Sayısal vb.)
 */
interface PuanCellProps {
  label: string;
  value: number;
  subValue?: number;  // Alt satır değeri (örn: Sözel Net)
  compact?: boolean;
  highlight?: boolean;
}

export function PuanCell({ label, value, subValue, compact = false, highlight = false }: PuanCellProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center px-2 py-1.5 border-r border-gray-200',
      compact ? 'py-1' : 'py-1.5',
      highlight ? 'bg-blue-50' : 'bg-gray-50'
    )}>
      <div className="text-[10px] text-gray-500 font-medium uppercase mb-0.5">
        {label}
      </div>
      <div className={cn(
        'font-bold text-gray-900',
        compact ? 'text-sm' : 'text-base'
      )}>
        {value.toFixed(2)}
      </div>
      {subValue !== undefined && (
        <div className="text-xs text-gray-600 mt-0.5">
          {subValue.toFixed(1)}
        </div>
      )}
    </div>
  );
}

/**
 * Boş Hücre (Sınava girmedi/Eksik veri)
 */
export function EmptyCell({ reason = 'Veri yok' }: { reason?: string }) {
  return (
    <div className="flex items-center justify-center px-2 py-1.5 border-r border-gray-200 bg-gray-50">
      <span className="text-xs text-gray-400">-</span>
    </div>
  );
}
