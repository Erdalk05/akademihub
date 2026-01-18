'use client';

// ============================================================================
// SPECTRA - YENİ SINAV EKLE WIZARD (v3.0)
// Route: /admin/spectra/sihirbaz
// 3 Adımlı sınav oluşturma sihirbazı
// Step 1: Sınav Bilgileri + Ders Dağılımı
// Step 2: Cevap Anahtarı
// Step 3: Onay & Kaydet
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Building2, CheckCircle } from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { WizardShell } from './_components/WizardShell';
import Step1ExamInfo from './_steps/Step1ExamInfo';
import Step3AnswerKey from './_steps/Step3AnswerKey';
import Step4Review from './_steps/Step4Review';
import type {
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

type WizardStep = 1 | 2 | 3;

const WIZARD_STEPS = [
  { step: 1 as const, label: 'Sınav Bilgileri', description: 'Ad, tarih ve tür' },
  { step: 2 as const, label: 'Cevap Anahtarı', description: 'Kazanım bazlı' },
  { step: 3 as const, label: 'Onay', description: 'Sonuçları gör' },
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
  const [step2Data, setStep2Data] = useState<WizardStep2Data>(initialStep2); // Dersler (Step1'de yönetilir)
  const [step3Data, setStep3Data] = useState<WizardStep3Data>(initialStep3); // Cevap Anahtarı
  const [step4Data, setStep4Data] = useState<WizardStep4Data>(initialStep4); // Onay
  const [examId, setExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Organization check (soft warning - does not block)
  useEffect(() => {
    if (isClient && _hasHydrated && !currentOrganization?.id) {
      console.warn('[Wizard] No organization selected, but allowing wizard to render');
    }
  }, [isClient, _hasHydrated, currentOrganization]);

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
    // Step 1'den geçerken: Sınav + Ders kaydı oluştur
    if (currentStep === 1 && !examId && currentOrganization?.id) {
      try {
        setIsLoading(true);
        
        // 1. Sınav kaydı oluştur
        console.log('[Wizard] Creating exam with payload:', {
          name: step1Data.examName,
          exam_type: step1Data.examType,
          exam_date: step1Data.examDate,
          grade_level: step1Data.gradeLevel,
          total_questions: step2Data.totalQuestions,
          organization_id: currentOrganization.id,
        });
        
        const response = await fetch('/api/spectra/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: step1Data.examName,
            exam_type: step1Data.examType,
            exam_date: step1Data.examDate,
            grade_level: step1Data.gradeLevel,
            description: step1Data.description,
            organization_id: currentOrganization.id,
            total_questions: step2Data.totalQuestions,
          }),
        });

        const result = await response.json();
        console.log('[Wizard] Exam creation result:', result);
        
        if (result.success) {
          setExamId(result.examId);
          console.log('[Wizard] Exam created with ID:', result.examId);
          
          // 2. Ders config kaydet
          await fetch(`/api/spectra/exams/${result.examId}/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessons: step2Data.lessons,
              total_questions: step2Data.totalQuestions,
            }),
          });
          
          toast.success('Sınav taslağı oluşturuldu');
        } else {
          console.error('[Wizard] Exam creation FAILED:', result.message);
          toast.error('Sınav kaydı başarısız: ' + (result.message || 'Bilinmeyen hata'));
          // examId yoksa wizard devam etmemeli
          return;
        }
      } catch (error) {
        console.error('[Wizard] Exam create error:', error);
        toast('⚠️ API hatası ama wizard devam ediyor', { duration: 4000 });
      } finally {
        setIsLoading(false);
      }
    }

    // Step 2'den geçerken: Cevap anahtarı kaydet
    if (currentStep === 2 && examId) {
      console.log('[Wizard] Saving answer key for exam:', examId);
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
          console.warn('[Wizard] Answer key save failed:', result.message);
        }
      } catch (error) {
        console.error('[Wizard] Answer key save error:', error);
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 2 && !examId) {
      console.error('[Wizard] Cannot save answer key: examId is missing');
      toast.error('Sınav ID bulunamadı. Lütfen Step 1\'den başlayın.');
      return;
    }

    // Sonraki adıma geç
    const nextStep = (currentStep + 1) as WizardStep;
    if (nextStep <= 3) {
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
      
      // ✅ FIX: Başarısızlıkta redirect YAPMA
      if (!result.success) {
        console.error('[Wizard] Activation failed:', result.message, result.blockingErrors);
        
        // Detaylı hata mesajı göster
        if (result.blockingErrors && result.blockingErrors.length > 0) {
          toast.error(result.blockingErrors[0], { duration: 6000 });
          // Ek hatalar varsa konsola yaz
          if (result.blockingErrors.length > 1) {
            console.warn('[Wizard] Diğer hatalar:', result.blockingErrors.slice(1));
          }
        } else {
          toast.error(result.message || 'Sınav kaydedilemedi');
        }
        
        // ❌ REDIRECT YOK - Kullanıcı wizard'da kalır
        return;
      }

      // ✅ Başarılı - Redirect yap
      toast.success('Sınav başarıyla oluşturuldu!');
      router.push(`/admin/spectra/sinavlar/${examId}`);
      
    } catch (error) {
      console.error('[Wizard] Save error:', error);
      toast.error('Bağlantı hatası');
      // ❌ REDIRECT YOK
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
        // Minimum: Sınav adı ve en az 1 ders
        return step1Data.examName.trim().length > 0 && step2Data.lessons.length > 0;
      case 2:
        // Cevap anahtarı tamamlanmamış olabilir
        return true;
      case 3:
        // Onay gerekli
        return step4Data.confirmed;
      default:
        return true;
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
                  <span>{currentOrganization?.name || 'Kurum seçilmedi'}</span>
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
            {currentOrganization?.name && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                Kurum: {currentOrganization.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="flex-1">
        <WizardShell
          currentStep={currentStep}
          totalSteps={3}
          onNext={handleNext}
          onPrev={handlePrev}
          onSave={handleSave}
          canGoNext={canGoNext()}
          canGoPrev={currentStep > 1}
          isLoading={isLoading}
          isSaving={isSaving}
          isLastStep={currentStep === 3}
          nextLabel={
            currentStep === 1
              ? 'Cevap Anahtarı'
              : currentStep === 2
                ? 'Onay & Kaydet'
                : 'Kaydet'
          }
        >
          {/* Step 1: Sınav Bilgileri + Ders Dağılımı */}
          {currentStep === 1 && (
            <Step1ExamInfo
              data={step1Data}
              lessonsData={step2Data}
              onChange={updateStep1}
              onLessonsChange={setStep2Data}
            />
          )}

          {/* Step 2: Cevap Anahtarı */}
          {currentStep === 2 && (
            <Step3AnswerKey
              data={step3Data}
              lessonsData={step2Data}
              examData={step1Data}
              organizationId={currentOrganization?.id || ''}
              onChange={setStep3Data}
            />
          )}

          {/* Step 3: Onay & Kaydet */}
          {currentStep === 3 && (
            <Step4Review
              step1Data={step1Data}
              step2Data={step2Data}
              step3Data={step3Data}
              step4Data={step4Data}
              organizationName={currentOrganization?.name}
              examId={examId}
              onChange={setStep4Data}
            />
          )}
        </WizardShell>
      </div>
    </div>
  );
}
