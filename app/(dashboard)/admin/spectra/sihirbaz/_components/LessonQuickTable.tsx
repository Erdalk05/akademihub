'use client';

// ============================================================================
// LESSON QUICK TABLE
// Ders bazlı hızlı cevap girişi tablosu
// ============================================================================

import React, { useState } from 'react';
import { Zap, ChevronRight, Check, X, Clipboard } from 'lucide-react';
import type { AnswerKeyItem, AnswerOption, LessonConfig } from '@/lib/spectra/types';
import { cn } from '@/lib/utils';

interface LessonQuickTableProps {
  lessons: LessonConfig[];
  answerKey: AnswerKeyItem[];
  onUpdateLesson: (lessonCode: string, answers: (AnswerOption | null)[]) => void;
  onExpandLesson: (lessonCode: string) => void;
}

const LESSON_ICONS: Record<string, string> = {
  TUR: '📖',
  INK: '🏛️',
  DIN: '📿',
  ING: '🌍',
  MAT: '📐',
  FEN: '🔬',
  TYT_TUR: '📖',
  TYT_SOS: '🌎',
  TYT_MAT: '📐',
  TYT_FEN: '🔬',
  AYT_MAT: '📐',
  AYT_FIZ: '⚛️',
  AYT_KIM: '🧪',
  AYT_BIY: '🧬',
  GENEL: '📋',
};

const VALID_ANSWERS = ['A', 'B', 'C', 'D', 'E'];

export function LessonQuickTable({ lessons, answerKey, onUpdateLesson, onExpandLesson }: LessonQuickTableProps) {
  const [pasteInputs, setPasteInputs] = useState<Record<string, string>>({});

  // Ders için cevapları al
  const getLessonAnswers = (lessonCode: string) => {
    return answerKey.filter(item => item.lesson_code === lessonCode);
  };

  // Ders doluluk durumu
  const getLessonStats = (lessonCode: string) => {
    const items = getLessonAnswers(lessonCode);
    const filled = items.filter(item => item.correct_answer !== null).length;
    return {
      total: items.length,
      filled,
      percentage: Math.round((filled / items.length) * 100) || 0,
    };
  };

  // Yapıştır input değişimi
  const handleInputChange = (lessonCode: string, value: string) => {
    setPasteInputs(prev => ({ ...prev, [lessonCode]: value }));
  };

  // Derse cevap uygula
  const applyToLesson = (lessonCode: string, lesson: LessonConfig) => {
    const input = pasteInputs[lessonCode] || '';
    const parsed = input
      .toUpperCase()
      .replace(/[^ABCDE]/g, '')
      .split('')
      .filter(char => VALID_ANSWERS.includes(char));

    const answers: (AnswerOption | null)[] = [];
    for (let i = 0; i < lesson.question_count; i++) {
      answers.push(parsed[i] as AnswerOption || null);
    }

    onUpdateLesson(lessonCode, answers);
    setPasteInputs(prev => ({ ...prev, [lessonCode]: '' }));
  };

  // Mevcut cevapları göster
  const getAnswerPreview = (lessonCode: string): string => {
    const items = getLessonAnswers(lessonCode);
    return items
      .map(item => item.correct_answer || '○')
      .join('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Hızlı Ders Bazlı Cevap Girişi</h3>
          </div>
          <span className="text-xs text-amber-600">Her derse direkt yapıştır!</span>
        </div>
      </div>

      {/* Table */}
      <div className="divide-y divide-gray-100">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
          <div className="col-span-3">Ders</div>
          <div className="col-span-1 text-center">Soru</div>
          <div className="col-span-4">Yapıştır</div>
          <div className="col-span-3">Girilen Cevaplar</div>
          <div className="col-span-1 text-center">Durum</div>
        </div>

        {/* Table Rows */}
        {lessons.map((lesson) => {
          const stats = getLessonStats(lesson.code);
          const inputValue = pasteInputs[lesson.code] || '';
          const preview = getAnswerPreview(lesson.code);
          const isComplete = stats.filled === stats.total;

          return (
            <div
              key={lesson.code}
              className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
            >
              {/* Ders Adı */}
              <div className="col-span-3 flex items-center gap-2">
                <span className="text-lg">{LESSON_ICONS[lesson.code] || '📚'}</span>
                <span className="font-medium text-emerald-700 truncate" title={lesson.name}>
                  {lesson.name}
                </span>
              </div>

              {/* Soru Sayısı */}
              <div className="col-span-1 text-center">
                <span className="font-bold text-emerald-600">{lesson.question_count}</span>
              </div>

              {/* Yapıştır Input */}
              <div className="col-span-4 flex items-center gap-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInputChange(lesson.code, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      applyToLesson(lesson.code, lesson);
                    }
                  }}
                  placeholder={`${lesson.question_count} cevap...`}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
                {inputValue.trim() && (
                  <button
                    onClick={() => applyToLesson(lesson.code, lesson)}
                    className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                    title="Uygula"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Girilen Cevaplar Preview */}
              <div className="col-span-3">
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {stats.filled}/{stats.total}
                  </span>
                </div>
              </div>

              {/* Durum */}
              <div className="col-span-1 flex justify-center">
                {isComplete ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" />
                    Tam
                  </span>
                ) : stats.filled > 0 ? (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    Eksik
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <X className="w-3 h-3" />
                    Boş
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Clipboard className="w-3 h-3" />
          Her ders için cevap sayısına ulaştığında otomatik uygulanır.
        </p>
      </div>
    </div>
  );
}
