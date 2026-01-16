'use client';

// ============================================================================
// STEP 2: DERS VE SORU DAĞILIMI
// Ders bazlı soru sayılarını belirleme
// ============================================================================

import React, { useEffect } from 'react';
import { BookOpen, Plus, Trash2, GripVertical, Info } from 'lucide-react';
import type { WizardStep2Data, LessonConfig, ExamType } from '@/lib/spectra/types';
import { cn } from '@/lib/utils';

interface Step2LessonsProps {
  data: WizardStep2Data;
  examType: ExamType;
  onChange: (data: WizardStep2Data) => void;
}

// Varsayılan ders dağılımları
const DEFAULT_LESSONS: Record<ExamType, LessonConfig[]> = {
  LGS: [
    { code: 'TUR', name: 'Türkçe', question_count: 20, start_index: 0, end_index: 20 },
    { code: 'INK', name: 'T.C. İnkılap Tarihi', question_count: 10, start_index: 20, end_index: 30 },
    { code: 'DIN', name: 'Din Kültürü', question_count: 10, start_index: 30, end_index: 40 },
    { code: 'ING', name: 'İngilizce', question_count: 10, start_index: 40, end_index: 50 },
    { code: 'MAT', name: 'Matematik', question_count: 20, start_index: 50, end_index: 70 },
    { code: 'FEN', name: 'Fen Bilimleri', question_count: 20, start_index: 70, end_index: 90 },
  ],
  TYT: [
    { code: 'TYT_TUR', name: 'Türkçe', question_count: 40, start_index: 0, end_index: 40 },
    { code: 'TYT_SOS', name: 'Sosyal Bilimler', question_count: 20, start_index: 40, end_index: 60 },
    { code: 'TYT_MAT', name: 'Temel Matematik', question_count: 40, start_index: 60, end_index: 100 },
    { code: 'TYT_FEN', name: 'Fen Bilimleri', question_count: 20, start_index: 100, end_index: 120 },
  ],
  AYT: [
    { code: 'AYT_MAT', name: 'Matematik', question_count: 40, start_index: 0, end_index: 40 },
    { code: 'AYT_FIZ', name: 'Fizik', question_count: 14, start_index: 40, end_index: 54 },
    { code: 'AYT_KIM', name: 'Kimya', question_count: 13, start_index: 54, end_index: 67 },
    { code: 'AYT_BIY', name: 'Biyoloji', question_count: 13, start_index: 67, end_index: 80 },
  ],
  DENEME: [
    { code: 'TUR', name: 'Türkçe', question_count: 15, start_index: 0, end_index: 15 },
    { code: 'MAT', name: 'Matematik', question_count: 15, start_index: 15, end_index: 30 },
    { code: 'FEN', name: 'Fen Bilimleri', question_count: 10, start_index: 30, end_index: 40 },
  ],
  KONU_TEST: [
    { code: 'GENEL', name: 'Genel', question_count: 20, start_index: 0, end_index: 20 },
  ],
  YAZILI: [
    { code: 'GENEL', name: 'Genel', question_count: 25, start_index: 0, end_index: 25 },
  ],
};

export default function Step2Lessons({ data, examType, onChange }: Step2LessonsProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Step2Lessons.tsx:mount',message:'Step2Lessons component mounted',data:{examType,lessonsCount:data.lessons.length,totalQuestions:data.totalQuestions,hasOnChange:!!onChange},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H4'})}).catch(()=>{});
  // #endregion
  
  // İlk yüklemede varsayılan dersleri yükle
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Step2Lessons.tsx:useEffect:entry',message:'useEffect triggered',data:{lessonsLength:data.lessons.length,examType,hasDefaults:!!DEFAULT_LESSONS[examType]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    if (data.lessons.length === 0) {
      const defaults = DEFAULT_LESSONS[examType] || DEFAULT_LESSONS.DENEME;
      const total = defaults.reduce((sum, l) => sum + l.question_count, 0);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Step2Lessons.tsx:useEffect:settingDefaults',message:'Setting default lessons',data:{defaultsCount:defaults.length,total},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      onChange({ lessons: defaults, totalQuestions: total });
    }
  }, [examType, data.lessons.length, onChange]);

  // Ders güncelle
  const updateLesson = (index: number, field: keyof LessonConfig, value: string | number) => {
    const newLessons = [...data.lessons];
    newLessons[index] = { ...newLessons[index], [field]: value };
    
    // Index'leri yeniden hesapla
    let currentIndex = 0;
    newLessons.forEach((lesson, i) => {
      newLessons[i].start_index = currentIndex;
      newLessons[i].end_index = currentIndex + lesson.question_count;
      currentIndex = newLessons[i].end_index;
    });

    const total = newLessons.reduce((sum, l) => sum + l.question_count, 0);
    onChange({ lessons: newLessons, totalQuestions: total });
  };

  // Ders ekle
  const addLesson = () => {
    const lastEndIndex = data.lessons.length > 0 
      ? data.lessons[data.lessons.length - 1].end_index 
      : 0;
    
    const newLesson: LessonConfig = {
      code: `DERS_${data.lessons.length + 1}`,
      name: `Yeni Ders ${data.lessons.length + 1}`,
      question_count: 10,
      start_index: lastEndIndex,
      end_index: lastEndIndex + 10,
    };

    const newLessons = [...data.lessons, newLesson];
    const total = newLessons.reduce((sum, l) => sum + l.question_count, 0);
    onChange({ lessons: newLessons, totalQuestions: total });
  };

  // Ders sil
  const removeLesson = (index: number) => {
    if (data.lessons.length <= 1) return;
    
    const newLessons = data.lessons.filter((_, i) => i !== index);
    
    // Index'leri yeniden hesapla
    let currentIndex = 0;
    newLessons.forEach((lesson, i) => {
      newLessons[i].start_index = currentIndex;
      newLessons[i].end_index = currentIndex + lesson.question_count;
      currentIndex = newLessons[i].end_index;
    });

    const total = newLessons.reduce((sum, l) => sum + l.question_count, 0);
    onChange({ lessons: newLessons, totalQuestions: total });
  };

  // Varsayılana sıfırla
  const resetToDefault = () => {
    const defaults = DEFAULT_LESSONS[examType] || DEFAULT_LESSONS.DENEME;
    const total = defaults.reduce((sum, l) => sum + l.question_count, 0);
    onChange({ lessons: [...defaults], totalQuestions: total });
  };

  // RENDER: Full step implementation (not a placeholder)
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Step2Lessons.tsx:return',message:'About to return JSX',data:{lessonsCount:data.lessons.length,totalQuestions:data.totalQuestions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Ders Dağılımı
          </h2>
          <p className="text-sm text-gray-500">
            Sınavdaki ders ve soru sayılarını belirleyin
          </p>
        </div>
        <button
          onClick={resetToDefault}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Varsayılana Sıfırla
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-emerald-700">Toplam Soru Sayısı</span>
            <p className="text-3xl font-bold text-emerald-900">{data.totalQuestions}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-emerald-700">Ders Sayısı</span>
            <p className="text-3xl font-bold text-emerald-900">{data.lessons.length}</p>
          </div>
        </div>
      </div>

      {/* Lesson List */}
      <div className="space-y-3">
        {data.lessons.map((lesson, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-4">
              {/* Drag Handle (visual only for now) */}
              <div className="text-gray-300 cursor-grab">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Lesson Code */}
              <div className="w-24">
                <input
                  type="text"
                  value={lesson.code}
                  onChange={(e) => updateLesson(index, 'code', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  placeholder="KOD"
                />
              </div>

              {/* Lesson Name */}
              <div className="flex-1">
                <input
                  type="text"
                  value={lesson.name}
                  onChange={(e) => updateLesson(index, 'name', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ders Adı"
                />
              </div>

              {/* Question Count */}
              <div className="w-28 flex items-center gap-2">
                <input
                  type="number"
                  value={lesson.question_count}
                  onChange={(e) => updateLesson(index, 'question_count', Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={200}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-center"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">soru</span>
              </div>

              {/* Range Display */}
              <div className="w-24 text-center">
                <span className="text-xs text-gray-400 font-mono">
                  {lesson.start_index + 1} - {lesson.end_index}
                </span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => removeLesson(index)}
                disabled={data.lessons.length <= 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  data.lessons.length > 1
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-300 cursor-not-allowed'
                )}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Lesson Button */}
      <button
        onClick={addLesson}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Yeni Ders Ekle
      </button>

      {/* Info Box */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Not:</strong> Soru numaraları otomatik olarak hesaplanır. 
          İlk ders 1. sorudan başlar ve her ders bir öncekinin kaldığı yerden devam eder.
        </div>
      </div>
    </div>
  );
}
