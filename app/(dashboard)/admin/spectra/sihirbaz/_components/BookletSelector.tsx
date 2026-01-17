'use client';

// ============================================================================
// BOOKLET SELECTOR
// Kitapçık Seçimi (A / B / C / D)
// ============================================================================

import React from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BookletType = 'A' | 'B' | 'C' | 'D';

interface BookletSelectorProps {
  activeBooklet: BookletType;
  onBookletChange: (booklet: BookletType) => void;
  filledCount: number;
  totalQuestions: number;
}

const BOOKLETS: BookletType[] = ['A', 'B', 'C', 'D'];

const BOOKLET_COLORS: Record<BookletType, { bg: string; text: string; active: string; border: string }> = {
  A: { bg: 'bg-blue-50', text: 'text-blue-700', active: 'bg-blue-600', border: 'border-blue-200' },
  B: { bg: 'bg-green-50', text: 'text-green-700', active: 'bg-green-600', border: 'border-green-200' },
  C: { bg: 'bg-orange-50', text: 'text-orange-700', active: 'bg-orange-600', border: 'border-orange-200' },
  D: { bg: 'bg-purple-50', text: 'text-purple-700', active: 'bg-purple-600', border: 'border-purple-200' },
};

export function BookletSelector({
  activeBooklet,
  onBookletChange,
  filledCount,
  totalQuestions,
}: BookletSelectorProps) {
  const colors = BOOKLET_COLORS[activeBooklet];

  return (
    <div className={cn(
      'border rounded-xl p-4 space-y-3 transition-all',
      colors.border,
      colors.bg
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className={cn('w-5 h-5', colors.text)} />
          <h3 className="font-semibold text-gray-900">Kitapçık Seçimi</h3>
        </div>
        
        {/* Active Info */}
        <div className={cn(
          'px-3 py-1 rounded-full text-sm font-medium',
          colors.active,
          'text-white'
        )}>
          Aktif: Kitapçık {activeBooklet} ({filledCount}/{totalQuestions})
        </div>
      </div>

      {/* Booklet Buttons */}
      <div className="flex gap-2">
        {BOOKLETS.map((booklet) => {
          const isActive = activeBooklet === booklet;
          const bookletColors = BOOKLET_COLORS[booklet];

          return (
            <button
              key={booklet}
              onClick={() => onBookletChange(booklet)}
              className={cn(
                'flex-1 py-3 rounded-lg font-bold text-lg transition-all',
                isActive
                  ? cn(bookletColors.active, 'text-white shadow-lg scale-105')
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              )}
            >
              {booklet}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500">
        Farklı kitapçıklar için ayrı cevap anahtarları tanımlanabilir.
        <span className="text-amber-600 font-medium ml-1">(Yakında)</span>
      </p>
    </div>
  );
}
