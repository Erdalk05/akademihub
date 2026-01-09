'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Wand2, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useOrganizationStore } from '@/lib/store/organizationStore';
import { createClient } from '@/lib/supabase/client';

// Wizard Components
import {
  WizardSteps,
  Step1SinavBilgisi,
  Step2CevapAnahtari,
  Step3OptikSablon,
  Step4VeriYukle,
  Step5Onizleme,
} from '@/components/spectra-wizard';

// Types
import type {
  WizardStep1Data,
  WizardStep2Data,
  WizardStep3Data,
  WizardStep4Data,
} from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectraSihirbazPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganizationStore();
  const supabase = createClient();

  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Step Data - Her step'in verisi kalıcı
  const [step1Data, setStep1Data] = useState<WizardStep1Data | null>(null);
  const [step2Data, setStep2Data] = useState<WizardStep2Data | null>(null);
  const [step3Data, setStep3Data] = useState<WizardStep3Data | null>(null);
  const [step4Data, setStep4Data] = useState<WizardStep4Data | null>(null);

  // Draft Exam ID
  const draftExamId = useMemo(() => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `draft-${Date.now()}`;
  }, []);

  // Öğrenci listesi
  const [ogrenciListesi, setOgrenciListesi] = useState<any[]>([]);

  // Öğrenci listesini yükle
  useEffect(() => {
    if (!currentOrganization?.id) return;

    const loadStudents = async () => {
      const { data } = await supabase
        .from('students')
        .select('id, student_no, persons(first_name, last_name), classes(name)')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active');

      if (data) {
        setOgrenciListesi(
          data.map((s: any) => ({
            id: s.id,
            ogrenciNo: s.student_no,
            ad: s.persons?.first_name || '',
            soyad: s.persons?.last_name || '',
            sinif: s.classes?.name || '',
          }))
        );
      }
    };

    loadStudents();
  }, [currentOrganization?.id, supabase]);

  // Adım doğrulama
  const canProceed = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!step1Data?.sinavAdi && !!step1Data?.sinavTarihi;
      case 2:
        return !!step2Data?.cevapAnahtari?.items?.some(i =>
          !!i.dogruCevap ||
          !!i.kitapcikCevaplari?.B ||
          !!i.kitapcikCevaplari?.C ||
          !!i.kitapcikCevaplari?.D
        );
      case 3:
        return !!step3Data?.optikSablon;
      case 4:
        return !!step4Data?.parseResult?.basariliSatir && step4Data.parseResult.basariliSatir > 0;
      case 5:
        return true;
      default:
        return false;
    }
  }, [step1Data, step2Data, step3Data, step4Data]);

  // İleri git
  const handleNext = () => {
    if (!canProceed(currentStep)) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Geri git
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Adıma git
  const handleStepClick = (step: number) => {
    setCurrentStep(step);
    // Validation uyarısı göstermek isterseniz:
    if (!canProceed(currentStep)) {
      toast('⚠️ Mevcut adımda eksik veriler var', { icon: '📝' });
    }
  };

  // Kaydet
  const handleSave = async () => {
    if (!currentOrganization?.id) {
      toast.error('Kurum bilgisi bulunamadı. Lütfen sayfayı yenileyin.');
      return;
    }

    if (!step1Data || !step2Data || !step4Data?.parseResult) {
      toast.error('Eksik veri. Lütfen tüm adımları tamamlayın.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/spectra/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          academicYearId: null, // Opsiyonel
          draftExamId,
          step1Data,
          step2Data,
          step3Data,
          step4Data,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Kayıt başarısız');
      }

      toast.success('✅ Sınav başarıyla kaydedildi!');
      router.push(`/admin/spectra/sinavlar/${result.examId}`);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Kayıt sırasında hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // İptal
  const handleCancel = () => {
    if (confirm('Değişiklikler kaydedilmedi. Çıkmak istediğinize emin misiniz?')) {
      router.push('/admin/spectra');
    }
  };

  if (!currentOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Wand2 className="text-emerald-500" size={24} />
                  Yeni Sınav Ekle
                </h1>
                <p className="text-sm text-gray-500">{currentOrganization.name}</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <WizardSteps
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            {/* Step 1: Sınav Bilgisi */}
            {currentStep === 1 && (
              <Step1SinavBilgisi
                data={step1Data}
                onChange={setStep1Data}
              />
            )}

            {/* Step 2: Cevap Anahtarı */}
            {currentStep === 2 && step1Data && (
              <Step2CevapAnahtari
                step1Data={step1Data}
                data={step2Data}
                organizationId={currentOrganization.id}
                onChange={setStep2Data}
              />
            )}

            {/* Step 3: Optik Şablon */}
            {currentStep === 3 && step1Data && (
              <Step3OptikSablon
                step1Data={step1Data}
                data={step3Data}
                onChange={setStep3Data}
              />
            )}

            {/* Step 4: Veri Yükle */}
            {currentStep === 4 && step3Data && (
              <Step4VeriYukle
                step3Data={step3Data}
                data={step4Data}
                ogrenciListesi={ogrenciListesi}
                onChange={setStep4Data}
              />
            )}

            {/* Step 5: Önizleme */}
            {currentStep === 5 && step1Data && step2Data && step4Data && (
              <Step5Onizleme
                step1Data={step1Data}
                step2Data={step2Data}
                step4Data={step4Data}
                examId={draftExamId}
                onSave={handleSave}
                isSaving={isSaving}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              currentStep === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <ArrowLeft size={18} />
            Geri
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed(currentStep)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                canProceed(currentStep)
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Devam Et
              <ArrowRight size={18} />
            </button>
          ) : (
            <div /> // Boş div - kaydet butonu Step5'te
          )}
        </div>
      </div>
    </div>
  );
}
