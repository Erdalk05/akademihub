'use client';

// ============================================================================
// STEP 2: CEVAP ANAHTARI (v2.0)
// Geliştirilmiş UI: BulkPaste + QuickTable + Grid Editor
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Key, FileSpreadsheet, Type, CheckCircle2, AlertCircle, Info, ChevronDown, ChevronRight, Edit3 } from 'lucide-react';
import type { WizardStep3Data, WizardStep2Data, AnswerKeyItem, AnswerOption, LessonConfig } from '@/lib/spectra/types';
import { cn } from '@/lib/utils';
import { BulkPasteInput } from '../_components/BulkPasteInput';
import { LessonQuickTable } from '../_components/LessonQuickTable';

interface Step3AnswerKeyProps {
  data: WizardStep3Data;
  lessonsData: WizardStep2Data;
  onChange: (data: WizardStep3Data) => void;
}

const ANSWER_OPTIONS: AnswerOption[] = ['A', 'B', 'C', 'D', 'E'];

// Ders ikonları
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

export default function Step3AnswerKey({ data, lessonsData, onChange }: Step3AnswerKeyProps) {
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cevap anahtarını oluştur (ilk yüklemede)
  useEffect(() => {
    if (data.answerKey.length === 0 && lessonsData.totalQuestions > 0) {
      const newAnswerKey: AnswerKeyItem[] = [];
      
      lessonsData.lessons.forEach((lesson) => {
        for (let i = lesson.start_index; i < lesson.end_index; i++) {
          newAnswerKey.push({
            question_number: i + 1,
            correct_answer: null,
            lesson_code: lesson.code,
            is_cancelled: false,
          });
        }
      });

      onChange({ ...data, answerKey: newAnswerKey, source: 'manual' });
    }
  }, [lessonsData.totalQuestions, lessonsData.lessons, data.answerKey.length, data, onChange]);

  // Tek cevap güncelle
  const updateAnswer = useCallback((questionNumber: number, answer: AnswerOption) => {
    const newAnswerKey = data.answerKey.map((item) =>
      item.question_number === questionNumber
        ? { ...item, correct_answer: answer }
        : item
    );
    onChange({ ...data, answerKey: newAnswerKey });
  }, [data, onChange]);

  // Soru iptal et
  const toggleCancelled = useCallback((questionNumber: number) => {
    const newAnswerKey = data.answerKey.map((item) =>
      item.question_number === questionNumber
        ? { ...item, is_cancelled: !item.is_cancelled }
        : item
    );
    onChange({ ...data, answerKey: newAnswerKey });
  }, [data, onChange]);

  // BULK PASTE: Tüm cevapları tek seferde uygula
  const handleBulkApply = useCallback((answers: (AnswerOption | null)[]) => {
    const newAnswerKey = data.answerKey.map((item, index) => ({
      ...item,
      correct_answer: answers[index] || item.correct_answer,
    }));
    onChange({ ...data, answerKey: newAnswerKey, source: 'bulk' });
  }, [data, onChange]);

  // LESSON QUICK TABLE: Derse cevap uygula
  const handleLessonUpdate = useCallback((lessonCode: string, answers: (AnswerOption | null)[]) => {
    const lessonItems = data.answerKey.filter(item => item.lesson_code === lessonCode);
    const newAnswerKey = data.answerKey.map((item) => {
      if (item.lesson_code !== lessonCode) return item;
      const lessonIndex = lessonItems.findIndex(li => li.question_number === item.question_number);
      if (lessonIndex === -1) return item;
      return {
        ...item,
        correct_answer: answers[lessonIndex] || item.correct_answer,
      };
    });
    onChange({ ...data, answerKey: newAnswerKey, source: 'lesson' });
  }, [data, onChange]);

  // Ders accordion aç
  const handleExpandLesson = useCallback((lessonCode: string) => {
    setExpandedLesson(prev => prev === lessonCode ? null : lessonCode);
  }, []);

  // İstatistikler
  const getStats = () => {
    const filled = data.answerKey.filter((item) => item.correct_answer !== null).length;
    const cancelled = data.answerKey.filter((item) => item.is_cancelled).length;
    return {
      total: data.answerKey.length,
      filled,
      empty: data.answerKey.length - filled,
      cancelled,
      progress: Math.round((filled / data.answerKey.length) * 100) || 0,
    };
  };

  // Ders bazlı istatistik
  const getLessonStats = (lessonCode: string) => {
    const items = data.answerKey.filter(item => item.lesson_code === lessonCode);
    const filled = items.filter(item => item.correct_answer !== null).length;
    return { total: items.length, filled };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            Cevap Anahtarı
          </h2>
          <p className="text-sm text-gray-500">
            Her soru için doğru cevabı belirleyin
          </p>
        </div>
        
        {/* Progress Badge */}
        <div className={cn(
          'px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2',
          stats.progress === 100
            ? 'bg-emerald-100 text-emerald-700'
            : stats.progress > 0
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600'
        )}>
          {stats.progress === 100 ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {stats.filled} / {stats.total} ({stats.progress}%)
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          BULK PASTE INPUT
      ───────────────────────────────────────────────────────────────────── */}
      <BulkPasteInput
        totalQuestions={lessonsData.totalQuestions}
        answerKey={data.answerKey}
        onApply={handleBulkApply}
      />

      {/* ─────────────────────────────────────────────────────────────────────
          LESSON QUICK TABLE
      ───────────────────────────────────────────────────────────────────── */}
      <LessonQuickTable
        lessons={lessonsData.lessons}
        answerKey={data.answerKey}
        onUpdateLesson={handleLessonUpdate}
        onExpandLesson={handleExpandLesson}
      />

      {/* ─────────────────────────────────────────────────────────────────────
          CEVAP ANAHTARI EDİTÖRÜ (Accordion)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Cevap Anahtarı Editörü</h3>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ara..."
              className="w-32 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Accordion Lessons */}
        <div className="divide-y divide-gray-100">
          {lessonsData.lessons.map((lesson) => {
            const lessonStats = getLessonStats(lesson.code);
            const isExpanded = expandedLesson === lesson.code;
            const lessonItems = data.answerKey.filter(item => item.lesson_code === lesson.code);
            const isComplete = lessonStats.filled === lessonStats.total;

            return (
              <div key={lesson.code}>
                {/* Lesson Header */}
                <button
                  onClick={() => handleExpandLesson(lesson.code)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-lg">{LESSON_ICONS[lesson.code] || '📚'}</span>
                    <span className="font-medium text-emerald-700">{lesson.name}</span>
                    <span className="text-xs text-gray-400">
                      Soru {lesson.start_index + 1} - {lesson.end_index}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Progress Bar */}
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          isComplete ? 'bg-emerald-500' : 'bg-amber-400'
                        )}
                        style={{ width: `${(lessonStats.filled / lessonStats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {lessonStats.filled}/{lessonStats.total}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                {/* Expanded Grid */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50">
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {lessonItems.map((item) => (
                        <div
                          key={item.question_number}
                          className={cn(
                            'border rounded-lg p-2 transition-all',
                            item.is_cancelled
                              ? 'bg-gray-100 border-gray-300'
                              : item.correct_answer
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-white border-gray-200'
                          )}
                        >
                          <div className="text-xs text-gray-400 text-center mb-1 font-medium">
                            {item.question_number}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {ANSWER_OPTIONS.slice(0, 4).map((option) => (
                              <button
                                key={option}
                                onClick={() => updateAnswer(item.question_number, option)}
                                disabled={item.is_cancelled}
                                className={cn(
                                  'w-full py-0.5 text-xs font-medium rounded transition-all',
                                  item.correct_answer === option
                                    ? 'bg-emerald-500 text-white'
                                    : item.is_cancelled
                                      ? 'bg-gray-200 text-gray-400'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => toggleCancelled(item.question_number)}
                            className={cn(
                              'w-full mt-1 py-0.5 text-xs rounded transition-all',
                              item.is_cancelled
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
                            )}
                          >
                            {item.is_cancelled ? 'İptal' : '×'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          INFO BOX
      ───────────────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>İpucu:</strong> "Tek Seferde Yapıştır" ile tüm cevapları hızlıca girebilir,
          "Hızlı Ders Bazlı Giriş" ile her dersi ayrı ayrı doldurabilirsiniz.
          İptal edilen sorular herkes için doğru sayılır.
        </div>
      </div>
    </div>
  );
}
