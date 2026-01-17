'use client';

// ============================================================================
// STEP 1: SINAV BİLGİLERİ + DERS DAĞILIMI
// Temel sınav bilgilerini ve ders dağılımını toplayan form
// ============================================================================

import React, { useEffect } from 'react';
import { FileText, Calendar, GraduationCap, AlignLeft, BookOpen, Plus, Trash2, RotateCcw } from 'lucide-react';
import type { WizardStep1Data, WizardStep2Data, ExamType, GradeLevel, LessonConfig } from '@/lib/spectra/types';
import { cn } from '@/lib/utils';

interface Step1ExamInfoProps {
  data: WizardStep1Data;
  lessonsData: WizardStep2Data;
  onChange: (field: keyof WizardStep1Data, value: string | ExamType | GradeLevel | null) => void;
  onLessonsChange: (data: WizardStep2Data) => void;
}

const EXAM_TYPES: { value: ExamType; label: string; description: string; icon: string }[] = [
  { value: 'LGS', label: 'LGS', description: '90 soru', icon: '🎓' },
  { value: 'TYT', label: 'TYT', description: '120 soru', icon: '📚' },
  { value: 'AYT', label: 'AYT', description: '80 soru', icon: '🔬' },
  { value: 'DENEME', label: 'Kurum Denemesi', description: 'Özel', icon: '📝' },
  { value: 'KONU_TEST', label: 'Konu Testi', description: 'Özel', icon: '📋' },
  { value: 'YAZILI', label: 'Yazılı', description: 'Özel', icon: '✍️' },
];

const GRADE_LEVELS: { value: GradeLevel; label: string }[] = [
  { value: 4, label: '4.' },
  { value: 5, label: '5.' },
  { value: 6, label: '6.' },
  { value: 7, label: '7.' },
  { value: 8, label: '8.' },
  { value: 9, label: '9.' },
  { value: 10, label: '10.' },
  { value: 11, label: '11.' },
  { value: 12, label: '12.' },
  { value: 'mezun', label: 'Mez.' },
];

// Varsayılan ders dağılımları
const DEFAULT_LESSONS: Record<ExamType, LessonConfig[]> = {
  LGS: [
    { code: 'TUR', name: 'Türkçe', question_count: 20, start_index: 0, end_index: 20 },
    { code: 'INK', name: 'T.C. İnkılap Tarihi ve Atat...', question_count: 10, start_index: 20, end_index: 30 },
    { code: 'DIN', name: 'Din Kültürü ve Ahlak Bilgisi', question_count: 10, start_index: 30, end_index: 40 },
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

export default function Step1ExamInfo({ data, lessonsData, onChange, onLessonsChange }: Step1ExamInfoProps) {
  // Sınav türü değişince varsayılan dersleri yükle
  useEffect(() => {
    if (lessonsData.lessons.length === 0 || 
        (lessonsData.lessons.length > 0 && shouldResetLessons(data.examType, lessonsData.lessons))) {
      const defaults = DEFAULT_LESSONS[data.examType] || DEFAULT_LESSONS.DENEME;
      const total = defaults.reduce((sum, l) => sum + l.question_count, 0);
      onLessonsChange({ lessons: [...defaults], totalQuestions: total });
    }
  }, [data.examType]);

  // Ders dağılımını sıfırla (sınav türü değişince)
  const shouldResetLessons = (examType: ExamType, currentLessons: LessonConfig[]): boolean => {
    const defaults = DEFAULT_LESSONS[examType];
    if (!defaults) return false;
    // İlk ders kodu farklıysa sıfırla
    return currentLessons[0]?.code !== defaults[0]?.code;
  };

  // Ders güncelle
  const updateLesson = (index: number, field: keyof LessonConfig, value: string | number) => {
    const newLessons = [...lessonsData.lessons];
    newLessons[index] = { ...newLessons[index], [field]: value };
    
    // Index'leri yeniden hesapla
    let currentIndex = 0;
    newLessons.forEach((lesson, i) => {
      newLessons[i].start_index = currentIndex;
      newLessons[i].end_index = currentIndex + lesson.question_count;
      currentIndex = newLessons[i].end_index;
    });

    const total = newLessons.reduce((sum, l) => sum + l.question_count, 0);
    onLessonsChange({ lessons: newLessons, totalQuestions: total });
  };

  // Ders ekle
  const addLesson = () => {
    const lastEndIndex = lessonsData.lessons.length > 0 
      ? lessonsData.lessons[lessonsData.lessons.length - 1].end_index 
      : 0;
    
    const newLesson: LessonConfig = {
      code: `DERS_${lessonsData.lessons.length + 1}`,
      name: `Yeni Ders ${lessonsData.lessons.length + 1}`,
      question_count: 10,
      start_index: lastEndIndex,
      end_index: lastEndIndex + 10,
    };

    const newLessons = [...lessonsData.lessons, newLesson];
    const total = newLessons.reduce((sum, l) => sum + l.question_count, 0);
    onLessonsChange({ lessons: newLessons, totalQuestions: total });
  };

  // Ders sil
  const removeLesson = (index: number) => {
    if (lessonsData.lessons.length <= 1) return;
    
    const newLessons = lessonsData.lessons.filter((_, i) => i !== index);
    
    // Index'leri yeniden hesapla
    let currentIndex = 0;
    newLessons.forEach((lesson, i) => {
      newLessons[i].start_index = currentIndex;
      newLessons[i].end_index = currentIndex + lesson.question_count;
      currentIndex = newLessons[i].end_index;
    });

    const total = newLessons.reduce((sum, l) => sum + l.question_count, 0);
    onLessonsChange({ lessons: newLessons, totalQuestions: total });
  };

  // Varsayılana sıfırla
  const resetToDefault = () => {
    const defaults = DEFAULT_LESSONS[data.examType] || DEFAULT_LESSONS.DENEME;
    const total = defaults.reduce((sum, l) => sum + l.question_count, 0);
    onLessonsChange({ lessons: [...defaults], totalQuestions: total });
  };

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────────────────────
          BÖLÜM 1: SINAV BİLGİLERİ
      ───────────────────────────────────────────────────────────────────── */}
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Sınav Bilgileri
        </h2>
        <p className="text-sm text-gray-500">
          Sınavın temel bilgilerini girin
        </p>
      </div>

      {/* Sınav Adı & Tarih */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sınav Adı */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Sınav Adı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.examName}
            onChange={(e) => onChange('examName', e.target.value)}
            placeholder="Örn: LGS Deneme #5 - Ocak 2026"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            autoFocus
          />
        </div>

        {/* Tarih */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Sınav Tarihi
          </label>
          <input
            type="date"
            value={data.examDate}
            onChange={(e) => onChange('examDate', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Sınıf Seviyesi - Horizontal Pills */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-gray-400" />
          Sınıf Seviyesi
        </label>
        <div className="flex flex-wrap gap-2">
          {GRADE_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange('gradeLevel', level.value)}
              className={cn(
                'px-4 py-2 rounded-full border-2 font-medium transition-all',
                data.gradeLevel === level.value
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sınav Türü - Cards */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Sınav Türü <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {EXAM_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange('examType', type.value)}
              className={cn(
                'p-4 rounded-xl border-2 text-center transition-all',
                data.examType === type.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="font-bold text-gray-900 text-sm">{type.label}</div>
              <div className="text-xs text-gray-500">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          BÖLÜM 2: DERS DAĞILIMI
      ───────────────────────────────────────────────────────────────────── */}
      
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Ders Dağılımı
            </h2>
            <p className="text-sm text-gray-500">
              Sınavdaki ders ve soru sayıları
            </p>
          </div>
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Varsayılana Sıfırla
          </button>
        </div>

        {/* Ders Kartları - Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {lessonsData.lessons.map((lesson, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-shadow relative group"
            >
              {/* Sil butonu */}
              {lessonsData.lessons.length > 1 && (
                <button
                  onClick={() => removeLesson(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              
              {/* İkon */}
              <div className="text-xl mb-1">
                {LESSON_ICONS[lesson.code] || '📚'}
              </div>
              
              {/* Ders Adı (düzenlenebilir) */}
              <input
                type="text"
                value={lesson.name}
                onChange={(e) => updateLesson(index, 'name', e.target.value)}
                className="w-full text-sm font-medium text-emerald-700 bg-transparent border-none p-0 focus:ring-0 truncate"
                title={lesson.name}
              />
              
              {/* Soru Sayısı (düzenlenebilir) */}
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={lesson.question_count}
                  onChange={(e) => updateLesson(index, 'question_count', Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={200}
                  className="w-12 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 text-center"
                />
                <span className="text-xs text-gray-500">Soru</span>
              </div>
            </div>
          ))}
          
          {/* Ders Ekle Butonu */}
          <button
            onClick={addLesson}
            className="border-2 border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Ders Ekle</span>
          </button>
        </div>

        {/* Özet Satırı */}
        <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-2">
          <span className="text-gray-600">
            Toplam: <strong className="text-gray-900">{lessonsData.totalQuestions} soru</strong>
          </span>
          <span className="text-gray-600">
            Süre: <strong className="text-gray-900">120 dk</strong>
          </span>
          <span className="text-gray-600">
            Yanlış: <strong className="text-gray-900">1/3</strong>
          </span>
          <span className="text-gray-600">
            Puan: <strong className="text-gray-900">100-500</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
