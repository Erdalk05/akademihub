'use client';

// ============================================================================
// STEP 3: CEVAP ANAHTARI
// Ders bazlı doğru cevapları belirleme
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Key, FileSpreadsheet, Type, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import type { WizardStep3Data, WizardStep2Data, AnswerKeyItem, AnswerOption, LessonConfig } from '@/lib/spectra/types';
import { cn } from '@/lib/utils';

interface Step3AnswerKeyProps {
  data: WizardStep3Data;
  lessonsData: WizardStep2Data;
  onChange: (data: WizardStep3Data) => void;
}

const ANSWER_OPTIONS: AnswerOption[] = ['A', 'B', 'C', 'D', 'E'];

export default function Step3AnswerKey({ data, lessonsData, onChange }: Step3AnswerKeyProps) {
  const [inputMode, setInputMode] = useState<'grid' | 'text'>('grid');
  const [textInput, setTextInput] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

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

  // İlk ders seçili olsun
  useEffect(() => {
    if (!selectedLesson && lessonsData.lessons.length > 0) {
      setSelectedLesson(lessonsData.lessons[0].code);
    }
  }, [lessonsData.lessons, selectedLesson]);

  // Tek cevap güncelle
  const updateAnswer = (questionNumber: number, answer: AnswerOption) => {
    const newAnswerKey = data.answerKey.map((item) =>
      item.question_number === questionNumber
        ? { ...item, correct_answer: answer }
        : item
    );
    onChange({ ...data, answerKey: newAnswerKey });
  };

  // Soru iptal et
  const toggleCancelled = (questionNumber: number) => {
    const newAnswerKey = data.answerKey.map((item) =>
      item.question_number === questionNumber
        ? { ...item, is_cancelled: !item.is_cancelled }
        : item
    );
    onChange({ ...data, answerKey: newAnswerKey });
  };

  // Metin girişinden cevapları parse et
  const parseTextInput = () => {
    if (!selectedLesson || !textInput.trim()) return;

    const answers = textInput
      .toUpperCase()
      .replace(/[^ABCDE]/g, '')
      .split('');

    const lessonItems = data.answerKey.filter((item) => item.lesson_code === selectedLesson);
    const newAnswerKey = [...data.answerKey];

    answers.forEach((answer, index) => {
      if (index < lessonItems.length) {
        const itemIndex = newAnswerKey.findIndex(
          (item) => item.question_number === lessonItems[index].question_number
        );
        if (itemIndex !== -1) {
          newAnswerKey[itemIndex].correct_answer = answer as AnswerOption;
        }
      }
    });

    onChange({ ...data, answerKey: newAnswerKey, source: 'manual' });
    setTextInput('');
  };

  // Seçili dersin cevaplarını al
  const getSelectedLessonAnswers = () => {
    if (!selectedLesson) return [];
    return data.answerKey.filter((item) => item.lesson_code === selectedLesson);
  };

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

  const stats = getStats();
  const selectedLessonAnswers = getSelectedLessonAnswers();
  const selectedLessonInfo = lessonsData.lessons.find((l) => l.code === selectedLesson);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Key className="w-5 h-5 text-emerald-600" />
          Cevap Anahtarı
        </h2>
        <p className="text-sm text-gray-500">
          Her soru için doğru cevabı belirleyin
        </p>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-emerald-700">Tamamlanan</span>
          <span className="text-sm font-bold text-emerald-900">{stats.filled} / {stats.total}</span>
        </div>
        <div className="w-full bg-emerald-200 rounded-full h-2.5">
          <div
            className="bg-emerald-600 h-2.5 rounded-full transition-all"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        {stats.cancelled > 0 && (
          <p className="text-xs text-amber-600 mt-2">{stats.cancelled} soru iptal edildi</p>
        )}
      </div>

      {/* Lesson Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {lessonsData.lessons.map((lesson) => {
            const lessonAnswers = data.answerKey.filter((a) => a.lesson_code === lesson.code);
            const lessonFilled = lessonAnswers.filter((a) => a.correct_answer !== null).length;
            const isComplete = lessonFilled === lesson.question_count;

            return (
              <button
                key={lesson.code}
                onClick={() => setSelectedLesson(lesson.code)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all flex items-center gap-2',
                  selectedLesson === lesson.code
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {lesson.name}
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="text-xs text-gray-400">
                    {lessonFilled}/{lesson.question_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setInputMode('grid')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5',
            inputMode === 'grid'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Grid
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5',
            inputMode === 'text'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Type className="w-4 h-4" />
          Metin
        </button>
      </div>

      {/* Text Input Mode */}
      {inputMode === 'text' && selectedLessonInfo && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedLessonInfo.name} için cevapları yapıştırın
              <span className="text-gray-400 font-normal ml-2">
                ({selectedLessonInfo.question_count} soru)
              </span>
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Örn: AABCDEBCDA..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-lg tracking-wider"
            />
            <p className="text-xs text-gray-500 mt-1">
              Sadece A, B, C, D, E harflerini girin. Diğer karakterler otomatik silinir.
            </p>
          </div>
          <button
            onClick={parseTextInput}
            disabled={!textInput.trim()}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              textInput.trim()
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Uygula
          </button>
        </div>
      )}

      {/* Grid Input Mode */}
      {inputMode === 'grid' && (
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {selectedLessonAnswers.map((item) => (
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
              <div className="text-xs text-gray-400 text-center mb-1">
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
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>İpucu:</strong> İptal edilen sorular herkes için doğru sayılır. 
          Metin modunda cevapları yapıştırarak hızlıca girebilirsiniz.
        </div>
      </div>
    </div>
  );
}
