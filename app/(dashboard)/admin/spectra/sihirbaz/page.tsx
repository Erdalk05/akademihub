'use client';

// ============================================================================
// SPECTRA - YENİ SINAV EKLE WIZARD (v2.0)
// Route: /admin/spectra/sihirbaz
// 4 Adımlı sınav oluşturma sihirbazı
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle, Building2, CheckCircle } from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { WizardHeader } from '@/components/spectra-wizard';
import { WizardShell } from './_components/WizardShell';
import { Step1ExamInfo } from './_steps/Step1ExamInfo';
import { Step2Lessons } from './_steps/Step2Lessons';
import { Step3AnswerKey } from './_steps/Step3AnswerKey';
import { Step4Review } from './_steps/Step4Review';
import type {
  WizardState,
  WizardStep1Data,
  WizardStep2Data,
  WizardStep3Data,
  WizardStep4Data,
  ExamType,
  GradeLevel,
} from '@/lib/spectra/types';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4;

const WIZARD_STEPS = [
  { step: 1 as const, label: 'Sınav Bilgileri', description: 'Temel bilgiler' },
  { step: 2 as const, label: 'Dersler', description: 'Ders ve soru dağılımı' },
  { step: 3 as const, label: 'Cevap Anahtarı', description: 'Doğru cevaplar' },
  { step: 4 as const, label: 'Onay', description: 'Kaydet' },
];

const initialStep1: WizardStep1Data = {
  examName: '',
  examDate: new Date().toISOString().split('T')[0],
  examType: 'LGS',
  gradeLevel: 8,
  description: '',
};

const initialStep2: WizardStep2Data = {
  lessons: [],
  totalQuestions: 0,
};

const initialStep3: WizardStep3Data = {
  answerKey: [],
  source: 'manual',
};

const initialStep4: WizardStep4Data = {
  confirmed: false,
  notes: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectraWizardPage() {
  const router = useRouter();
  const { currentOrganization, _hasHydrated } = useOrganizationStore();

  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [step1Data, setStep1Data] = useState<WizardStep1Data>(initialStep1);
  const [step2Data, setStep2Data] = useState<WizardStep2Data>(initialStep2);
  const [step3Data, setStep3Data] = useState<WizardStep3Data>(initialStep3);
  const [step4Data, setStep4Data] = useState<WizardStep4Data>(initialStep4);
  const [examId, setExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Client-side hydration
  useEffect(() => {
    setIsClient(true);
    console.log('🚀 [SpectraWizard] Sayfa yüklendi');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const updateStep1 = useCallback((field: keyof WizardStep1Data, value: string | ExamType | GradeLevel | null) => {
    setStep1Data((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────

  const handleBack = () => {
    router.push('/admin/spectra/sinavlar');
  };

  const handleStepClick = (step: WizardStep) => {
    if (step <= currentStep || completedSteps.includes(step)) {
      setCurrentStep(step);
    }
  };

  const handleNext = async () => {
    // Step 1'den geçerken sınav kaydı oluştur
    if (currentStep === 1 && !examId) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/spectra/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: step1Data.examName,
            exam_type: step1Data.examType,
            exam_date: step1Data.examDate,
            grade_level: step1Data.gradeLevel,
            description: step1Data.description,
            organization_id: currentOrganization?.id,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(result.message || 'Sınav oluşturulamadı');
          return;
        }

        setExamId(result.examId);
        toast.success('Sınav taslağı oluşturuldu');
      } catch (error) {
        console.error('[Wizard] Exam create error:', error);
        toast.error('Bağlantı hatası');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Step 2'den geçerken ders config kaydet
    if (currentStep === 2 && examId) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/spectra/exams/${examId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessons: step2Data.lessons,
            total_questions: step2Data.totalQuestions,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(result.message || 'Ders dağılımı kaydedilemedi');
          return;
        }
      } catch (error) {
        console.error('[Wizard] Lessons save error:', error);
        toast.error('Bağlantı hatası');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Step 3'ten geçerken cevap anahtarı kaydet
    if (currentStep === 3 && examId) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/spectra/exams/${examId}/answer-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: step3Data.answerKey,
            source: step3Data.source,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error(result.message || 'Cevap anahtarı kaydedilemedi');
          return;
        }
      } catch (error) {
        console.error('[Wizard] Answer key save error:', error);
        toast.error('Bağlantı hatası');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Sonraki adıma geç
    const nextStep = (currentStep + 1) as WizardStep;
    if (nextStep <= 4) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
      setCurrentStep(nextStep);
    }
  };

  const handlePrev = () => {
    const prevStep = (currentStep - 1) as WizardStep;
    if (prevStep >= 1) {
      setCurrentStep(prevStep);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE (Final Step)
  // ─────────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!examId || !step4Data.confirmed) {
      toast.error('Lütfen onay kutusunu işaretleyin');
      return;
    }

    try {
      setIsSaving(true);

      // Sınav durumunu "ready" yap
      const response = await fetch(`/api/spectra/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready',
          total_questions: step2Data.totalQuestions,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || 'Sınav kaydedilemedi');
        return;
      }

      toast.success('Sınav başarıyla oluşturuldu!');

      // Sınav detay sayfasına yönlendir
      router.push(`/admin/spectra/sinavlar/${examId}`);
    } catch (error) {
      console.error('[Wizard] Save error:', error);
      toast.error('Bağlantı hatası');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────────────────

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return step1Data.examName.trim().length > 0 && !!step1Data.examDate && !!step1Data.examType;
      case 2:
        return step2Data.lessons.length > 0 && step2Data.totalQuestions > 0;
      case 3:
        return step3Data.answerKey.length > 0;
      case 4:
        return step4Data.confirmed;
      default:
        return false;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────

  if (!isClient || !_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ORGANIZATION CHECK
  // ─────────────────────────────────────────────────────────────────────────

  if (!currentOrganization?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Kurum Seçilmedi</h2>
          <p className="text-gray-600 mb-6">
            Yeni sınav eklemek için önce bir kurum seçmelisiniz.
            Lütfen sol menüden kurum seçimi yapın.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Geri"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Yeni Sınav Ekle</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>{currentOrganization.name}</span>
                  {examId && (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Taslak
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Organization Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              Kurum: {currentOrganization.name}
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Header (Steps) */}
      <WizardHeader
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Wizard Content */}
      <div className="flex-1">
        <WizardShell
          currentStep={currentStep}
          onNext={handleNext}
          onPrev={handlePrev}
          onSave={handleSave}
          canGoNext={canGoNext()}
          canGoPrev={currentStep > 1}
          isLoading={isLoading}
          isSaving={isSaving}
          isLastStep={currentStep === 4}
          nextLabel={
            currentStep === 1
              ? 'Devam Et'
              : currentStep === 2
                ? 'Cevap Anahtarı'
                : currentStep === 3
                  ? 'Onay'
                  : 'Kaydet'
          }
        >
          {/* Step 1: Sınav Bilgileri */}
          {currentStep === 1 && (
            <Step1ExamInfo
              data={step1Data}
              onChange={updateStep1}
            />
          )}

          {/* Step 2: Dersler */}
          {currentStep === 2 && (
            <Step2Lessons
              data={step2Data}
              examType={step1Data.examType}
              onChange={setStep2Data}
            />
          )}

          {/* Step 3: Cevap Anahtarı */}
          {currentStep === 3 && (
            <Step3AnswerKey
              data={step3Data}
              lessonsData={step2Data}
              onChange={setStep3Data}
            />
          )}

          {/* Step 4: Onay & Kaydet */}
          {currentStep === 4 && (
            <Step4Review
              step1Data={step1Data}
              step2Data={step2Data}
              step3Data={step3Data}
              step4Data={step4Data}
              organizationName={currentOrganization.name}
              onChange={setStep4Data}
            />
          )}
        </WizardShell>
      </div>
    </div>
  );
}
