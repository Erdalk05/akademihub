'use client';

// ============================================================================
// BULK PASTE INPUT
// Tek seferde tüm cevapları yapıştırma komponenti
// ============================================================================

import React, { useState, useCallback } from 'react';
import { Clipboard, Check, Trash2, Download, AlertCircle } from 'lucide-react';
import type { AnswerKeyItem, AnswerOption } from '@/lib/spectra/types';
import { cn } from '@/lib/utils';

interface BulkPasteInputProps {
  totalQuestions: number;
  answerKey: AnswerKeyItem[];
  onApply: (answers: (AnswerOption | null)[]) => void;
}

const VALID_ANSWERS = ['A', 'B', 'C', 'D', 'E'];

export function BulkPasteInput({ totalQuestions, answerKey, onApply }: BulkPasteInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isApplied, setIsApplied] = useState(false);

  // Parse ve temizle
  const parseInput = useCallback((value: string): string[] => {
    // Desteklenen formatlar:
    // 1. ABCDABCD... (bitişik)
    // 2. A B C D A B C D (boşluklu)
    // 3. A,B,C,D,A,B,C,D (virgüllü)
    // 4. 1A 2B 3C 4D (numaralı)
    // 5. Satır satır

    const normalized = value
      .toUpperCase()
      .replace(/[0-9]+/g, '') // Numaraları kaldır
      .replace(/[^ABCDE\s,\n]/g, '') // Geçersiz karakterleri kaldır
      .replace(/[\s,\n]+/g, '') // Boşluk, virgül, yeni satır kaldır
      .split('');

    return normalized.filter(char => VALID_ANSWERS.includes(char));
  }, []);

  // Karakter sayısı
  const parsedAnswers = parseInput(inputValue);
  const filledCount = parsedAnswers.length;
  const isComplete = filledCount >= totalQuestions;
  const isTooMany = filledCount > totalQuestions;

  // Uygula
  const handleApply = () => {
    if (filledCount === 0) return;

    const answers: (AnswerOption | null)[] = [];
    for (let i = 0; i < totalQuestions; i++) {
      answers.push(parsedAnswers[i] as AnswerOption || null);
    }

    onApply(answers);
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2000);
  };

  // Temizle
  const handleClear = () => {
    setInputValue('');
    setIsApplied(false);
  };

  // Panodan yapıştır
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputValue(text);
    } catch (err) {
      console.error('Clipboard read failed:', err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Tek Seferde Yapıştır</h3>
          <span className="text-sm text-emerald-600">
            {totalQuestions} sorunun tamamını tek alana yapıştırın.
          </span>
        </div>
      </div>

      {/* Format bilgisi */}
      <div className="text-xs text-gray-500">
        Desteklenen: <code className="bg-gray-100 px-1 rounded">ABCDABCD...</code> | 
        <code className="bg-gray-100 px-1 rounded ml-1">A B C D...</code> | 
        <code className="bg-gray-100 px-1 rounded ml-1">1 2 3 4...</code> | 
        <code className="bg-gray-100 px-1 rounded ml-1">Satır satır</code>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Örnek: ABCDABCDABCD... (toplam ${totalQuestions} cevap)`}
          rows={3}
          className={cn(
            'w-full px-4 py-3 border rounded-xl font-mono text-sm tracking-wider resize-none transition-all',
            isTooMany
              ? 'border-amber-400 bg-amber-50 focus:ring-amber-500'
              : isComplete
                ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-500'
                : 'border-gray-300 focus:ring-emerald-500'
          )}
        />
        
        {/* Counter */}
        <div className={cn(
          'absolute bottom-3 right-3 text-sm font-medium',
          isTooMany ? 'text-amber-600' : isComplete ? 'text-emerald-600' : 'text-gray-400'
        )}>
          {filledCount} / {totalQuestions}
        </div>
      </div>

      {/* Uyarı */}
      {isTooMany && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>Fazla cevap girildi! Sadece ilk {totalQuestions} cevap uygulanacak.</span>
        </div>
      )}

      {/* Butonlar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            disabled={!inputValue}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5',
              inputValue
                ? 'text-gray-600 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            )}
          >
            <Trash2 className="w-4 h-4" />
            Temizle
          </button>
          
          <button
            onClick={handlePasteFromClipboard}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Clipboard className="w-4 h-4" />
            Yapıştır
          </button>
        </div>

        <button
          onClick={handleApply}
          disabled={filledCount === 0}
          className={cn(
            'px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2',
            filledCount > 0
              ? isApplied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {isApplied ? (
            <>
              <Check className="w-4 h-4" />
              Uygulandı!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Cevapları Uygula
            </>
          )}
        </button>
      </div>
    </div>
  );
}
