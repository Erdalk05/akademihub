'use client';

// ============================================================================
// STEP 4: ONAY & KAYDET
// Sınav özeti ve son onay
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  FileText,
  BookOpen,
  Key,
  Calendar,
  GraduationCap,
  Building2,
  AlertTriangle,
  Info,
  X,
  Shield,
  Loader2,
} from 'lucide-react';
import type {
  WizardStep1Data,
  WizardStep2Data,
  WizardStep3Data,
  WizardStep4Data,
} from '@/lib/spectra/types';
import { cn } from '@/lib/utils';

interface Step4ReviewProps {
  step1Data: WizardStep1Data;
  step2Data: WizardStep2Data;
  step3Data: WizardStep3Data;
  step4Data: WizardStep4Data;
  organizationName?: string;
  examId: string | null;
  onChange: (data: WizardStep4Data) => void;
}

export default function Step4Review({
  step1Data,
  step2Data,
  step3Data,
  step4Data,
  organizationName,
  examId,
  onChange,
}: Step4ReviewProps) {
  // İstatistikler
  const answerKeyStats = useMemo(() => ({
    total: step3Data.answerKey.length,
    filled: step3Data.answerKey.filter((a) => a.correct_answer !== null).length,
    cancelled: step3Data.answerKey.filter((a) => a.is_cancelled).length,
  }), [step3Data.answerKey]);

  const isAnswerKeyComplete = answerKeyStats.filled === answerKeyStats.total;
  const isEmpty = answerKeyStats.filled === 0;

  // Boş ders kontrolü
  const emptyLessons = step2Data.lessons.filter(l => l.question_count <= 0);

  // Eksik cevap anahtarı detayı
  const missingAnswerCount = answerKeyStats.total - answerKeyStats.filled;

  // Sistem Doğrulamaları (Backend Guard ile uyumlu)
  const validations = useMemo(() => [
    {
      id: 'examId',
      label: 'Sınav Kaydı',
      value: examId ? 'Oluşturuldu' : 'Eksik',
      isValid: !!examId,
      detail: !examId ? 'Sınav taslağı oluşturulmadı' : undefined,
    },
    {
      id: 'organization',
      label: 'Kurum Bağlantısı',
      value: organizationName || 'Bağlı değil',
      isValid: !!organizationName,
      detail: !organizationName ? 'Kurum seçilmedi' : undefined,
    },
    {
      id: 'examName',
      label: 'Sınav Adı',
      value: step1Data.examName || 'Girilmedi',
      isValid: step1Data.examName.trim().length > 0,
    },
    {
      id: 'examDate',
      label: 'Sınav Tarihi',
      value: step1Data.examDate || 'Belirlenmedi',
      isValid: !!step1Data.examDate,
    },
    {
      id: 'lessons',
      label: 'Ders Dağılımı',
      value: `${step2Data.lessons.length} ders`,
      isValid: step2Data.lessons.length > 0,
      detail: step2Data.lessons.length === 0 ? 'En az 1 ders gerekli' : undefined,
    },
    {
      id: 'totalQuestions',
      label: 'Toplam Soru',
      value: `${step2Data.totalQuestions} soru`,
      isValid: step2Data.totalQuestions > 0,
      detail: step2Data.totalQuestions === 0 ? 'En az 1 soru gerekli' : undefined,
    },
    {
      id: 'emptyLessons',
      label: 'Boş Ders Kontrolü',
      value: emptyLessons.length === 0 ? 'Tamamlandı' : `${emptyLessons.length} ders boş`,
      isValid: emptyLessons.length === 0,
      detail: emptyLessons.length > 0 ? `Boş dersler: ${emptyLessons.map(l => l.name).join(', ')}` : undefined,
    },
    {
      id: 'answerKey',
      label: 'Cevap Anahtarı',
      value: `${answerKeyStats.filled}/${answerKeyStats.total}`,
      isValid: answerKeyStats.filled === answerKeyStats.total && answerKeyStats.total > 0,
      warning: !isAnswerKeyComplete && !isEmpty,
      detail: missingAnswerCount > 0 ? `${missingAnswerCount} cevap eksik` : undefined,
    },
  ], [examId, organizationName, step1Data, step2Data, answerKeyStats, emptyLessons, missingAnswerCount, isAnswerKeyComplete, isEmpty]);

  const allValid = validations.every((v) => v.isValid);
  const criticalErrors = validations.filter(v => !v.isValid);

  // RENDER: Full review & validation implementation (not placeholder)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Onay & Kaydet
        </h2>
        <p className="text-sm text-gray-500">
          Sınav bilgilerini kontrol edin ve onaylayın
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">{step1Data.examName || 'Sınav Adı Girilmedi'}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {step1Data.examDate
                  ? new Date(step1Data.examDate).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Tarih belirlenmedi'}
              </span>
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                {step1Data.examType}
              </span>
              {step1Data.gradeLevel && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {step1Data.gradeLevel}. Sınıf
                </span>
              )}
            </div>
            {organizationName && (
              <div className="flex items-center gap-1 mt-2 text-white/70 text-sm">
                <Building2 className="w-4 h-4" />
                {organizationName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ders Dağılımı */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Ders Dağılımı</h4>
          </div>
          <div className="space-y-2">
            {step2Data.lessons.map((lesson, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{lesson.name}</span>
                <span className="font-medium text-gray-900">{lesson.question_count} soru</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-semibold">
              <span className="text-gray-700">Toplam</span>
              <span className="text-emerald-600">{step2Data.totalQuestions} soru</span>
            </div>
          </div>
        </div>

        {/* Cevap Anahtarı */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-5 h-5 text-amber-500" />
            <h4 className="font-semibold text-gray-900">Cevap Anahtarı</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tamamlanan</span>
              <span className="font-medium text-gray-900">
                {answerKeyStats.filled} / {answerKeyStats.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  isAnswerKeyComplete ? 'bg-emerald-500' : 'bg-amber-500'
                )}
                style={{
                  width: `${(answerKeyStats.filled / answerKeyStats.total) * 100}%`,
                }}
              />
            </div>
            {answerKeyStats.cancelled > 0 && (
              <p className="text-xs text-amber-600">
                {answerKeyStats.cancelled} soru iptal edildi
              </p>
            )}
            {!isAnswerKeyComplete && !isEmpty && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Bazı cevaplar eksik
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-900">Sistem Doğrulamaları</h4>
          <span className={cn(
            'ml-auto text-xs font-medium px-2 py-0.5 rounded-full',
            allValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          )}>
            {allValid ? 'Tamamlandı' : `${criticalErrors.length} hata`}
          </span>
        </div>
        <div className="space-y-2">
          {validations.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg',
                item.isValid ? 'bg-emerald-50' : 'bg-red-50'
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                {item.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  {item.detail && !item.isValid && (
                    <span className="text-xs text-red-600">{item.detail}</span>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  'text-sm font-medium text-right',
                  item.isValid ? 'text-emerald-700' : 'text-red-700',
                  item.warning && 'text-amber-700'
                )}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Notlar (Opsiyonel)
        </label>
        <textarea
          value={step4Data.notes || ''}
          onChange={(e) => onChange({ ...step4Data, notes: e.target.value })}
          placeholder="Sınav hakkında eklemek istediğiniz notlar..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Confirmation Checkbox */}
      <label 
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl transition-colors',
          allValid 
            ? 'bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100' 
            : 'bg-gray-100 border border-gray-200 cursor-not-allowed opacity-60'
        )}
      >
        <input
          type="checkbox"
          checked={step4Data.confirmed}
          onChange={(e) => onChange({ ...step4Data, confirmed: e.target.checked })}
          disabled={!allValid}
          className="w-5 h-5 mt-0.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50"
        />
        <div>
          <p className={cn(
            'font-medium',
            allValid ? 'text-emerald-900' : 'text-gray-500'
          )}>
            Bilgileri kontrol ettim, sınavı aktif etmek istiyorum
          </p>
          <p className={cn(
            'text-sm mt-1',
            allValid ? 'text-emerald-700' : 'text-gray-400'
          )}>
            Sınav aktif edildikten sonra optik okuma yapabilir ve sonuçları görebilirsiniz.
          </p>
        </div>
      </label>

      {/* Warning if not complete */}
      {!allValid && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <strong>Uyarı:</strong> {criticalErrors.length} zorunlu kontrol başarısız. 
            Lütfen yukarıdaki hataları düzeltin.
          </div>
        </div>
      )}

      {/* Info */}
      {allValid && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Hazır:</strong> Tüm kontroller başarılı. 
            Onay kutusunu işaretleyip &quot;Sınavı Oluştur&quot; butonuna basarak sınavı aktif edebilirsiniz.
          </div>
        </div>
      )}
    </div>
  );
}
