'use client';

// ============================================================================
// STEP 1: SINAV BİLGİLERİ
// Temel sınav bilgilerini toplayan form
// ============================================================================

import React from 'react';
import { FileText, Calendar, GraduationCap, AlignLeft } from 'lucide-react';
import type { WizardStep1Data, ExamType, GradeLevel } from '@/lib/spectra/types';

interface Step1ExamInfoProps {
  data: WizardStep1Data;
  onChange: (field: keyof WizardStep1Data, value: string | ExamType | GradeLevel | null) => void;
}

const EXAM_TYPES: { value: ExamType; label: string; description: string }[] = [
  { value: 'LGS', label: 'LGS', description: '8. Sınıf - Liselere Geçiş Sınavı' },
  { value: 'TYT', label: 'TYT', description: 'Temel Yeterlilik Testi' },
  { value: 'AYT', label: 'AYT', description: 'Alan Yeterlilik Testi' },
  { value: 'DENEME', label: 'Kurum Denemesi', description: 'Özel kurum denemesi' },
];

const GRADE_LEVELS: { value: GradeLevel; label: string }[] = [
  { value: 4, label: '4. Sınıf' },
  { value: 5, label: '5. Sınıf' },
  { value: 6, label: '6. Sınıf' },
  { value: 7, label: '7. Sınıf' },
  { value: 8, label: '8. Sınıf' },
  { value: 9, label: '9. Sınıf' },
  { value: 10, label: '10. Sınıf' },
  { value: 11, label: '11. Sınıf' },
  { value: 12, label: '12. Sınıf' },
  { value: 'mezun', label: 'Mezun' },
];

export default function Step1ExamInfo({ data, onChange }: Step1ExamInfoProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Sınav Bilgileri
        </h2>
        <p className="text-sm text-gray-500">
          Sınavın temel bilgilerini girin. Bu bilgiler daha sonra değiştirilebilir.
        </p>
      </div>

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
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg"
          autoFocus
        />
        <p className="text-xs text-gray-500">
          Sınavı kolayca tanımlayacak açıklayıcı bir ad girin
        </p>
      </div>

      {/* Sınav Tarihi & Türü */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Sınıf Seviyesi */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-gray-400" />
            Sınıf Seviyesi
          </label>
          <select
            value={data.gradeLevel ?? ''}
            onChange={(e) => onChange('gradeLevel', e.target.value === '' ? null : (isNaN(Number(e.target.value)) ? e.target.value as GradeLevel : Number(e.target.value) as GradeLevel))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
          >
            <option value="">Seçiniz</option>
            {GRADE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sınav Türü - Cards */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Sınav Türü <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EXAM_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange('examType', type.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                data.examType === type.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-gray-900">{type.label}</div>
              <div className="text-xs text-gray-500 mt-1">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Açıklama */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-gray-400" />
          Açıklama (Opsiyonel)
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Sınav hakkında notlar, kapsam bilgisi vb..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
        />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-800">
          <strong>İpucu:</strong> Sınav türüne göre ders dağılımı ve puanlama kuralları 
          otomatik olarak önerilecektir. İsterseniz bunları bir sonraki adımda özelleştirebilirsiniz.
        </p>
      </div>
    </div>
  );
}
