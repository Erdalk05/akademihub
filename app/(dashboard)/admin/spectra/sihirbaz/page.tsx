'use client';

// ============================================================================
// SPECTRA - YENİ SINAV EKLE WIZARD (v1.0)
// Route: /admin/spectra/sihirbaz
// TEK ve GERÇEK entry point
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { WizardHeader, WizardShell } from '@/components/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type WizardStep = 1 | 2 | 3 | 4;

export interface WizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  // Step 1: Sınav Bilgileri
  step1: {
    examName: string;
    examDate: string;
    examType: 'LGS' | 'TYT' | 'AYT' | 'DENEME';
    gradeLevel: number | null;
    description: string;
  };
  // Step 2-4 placeholders (ileride doldurulacak)
  step2: Record<string, unknown>;
  step3: Record<string, unknown>;
  step4: Record<string, unknown>;
}

const initialWizardState: WizardState = {
  currentStep: 1,
  completedSteps: [],
  step1: {
    examName: '',
    examDate: new Date().toISOString().split('T')[0],
    examType: 'LGS',
    gradeLevel: 8,
    description: '',
  },
  step2: {},
  step3: {},
  step4: {},
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP LABELS
// ─────────────────────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { step: 1 as const, label: 'Sınav Bilgileri', description: 'Temel bilgiler' },
  { step: 2 as const, label: 'Dersler', description: 'Ders ve soru dağılımı' },
  { step: 3 as const, label: 'Cevap Anahtarı', description: 'Doğru cevaplar' },
  { step: 4 as const, label: 'Onay', description: 'Kaydet' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectraWizardPage() {
  const router = useRouter();
  const { currentOrganization, _hasHydrated } = useOrganizationStore();
  
  // Wizard state
  const [wizardState, setWizardState] = useState<WizardState>(initialWizardState);
  const [isClient, setIsClient] = useState(false);

  // Client-side hydration
  useEffect(() => {
    setIsClient(true);
    console.log('🚀 [SpectraWizard] Sayfa yüklendi');
  }, []);

  // Organization debug
  useEffect(() => {
    if (_hasHydrated) {
      console.log('🏢 [SpectraWizard] Organization objesi:', currentOrganization);
      console.log('🔑 [SpectraWizard] Organization ID:', currentOrganization?.id || 'YOK');
    }
  }, [currentOrganization, _hasHydrated]);

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleBack = () => {
    router.push('/admin/spectra/sinavlar');
  };

  const handleStepChange = (step: WizardStep) => {
    // Sadece tamamlanmış veya mevcut adıma git
    if (step <= wizardState.currentStep || wizardState.completedSteps.includes(step)) {
      setWizardState(prev => ({ ...prev, currentStep: step }));
    }
  };

  const handleNext = () => {
    const nextStep = (wizardState.currentStep + 1) as WizardStep;
    if (nextStep <= 4) {
      setWizardState(prev => ({
        ...prev,
        currentStep: nextStep,
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
      }));
    }
  };

  const handlePrev = () => {
    const prevStep = (wizardState.currentStep - 1) as WizardStep;
    if (prevStep >= 1) {
      setWizardState(prev => ({ ...prev, currentStep: prevStep }));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 DATA HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const updateStep1 = (field: keyof WizardState['step1'], value: string | number | null) => {
    setWizardState(prev => ({
      ...prev,
      step1: { ...prev.step1, [field]: value },
    }));
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
    <div className="min-h-screen bg-gray-50">
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
        currentStep={wizardState.currentStep}
        completedSteps={wizardState.completedSteps}
        onStepClick={handleStepChange}
      />

      {/* Wizard Content */}
      <WizardShell
        currentStep={wizardState.currentStep}
        onNext={handleNext}
        onPrev={handlePrev}
        canGoNext={wizardState.step1.examName.trim().length > 0}
        canGoPrev={wizardState.currentStep > 1}
        isLastStep={wizardState.currentStep === 4}
      >
        {/* Step 1: Sınav Bilgileri */}
        {wizardState.currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Sınav Bilgileri</h2>
              <p className="text-sm text-gray-500">Sınavın temel bilgilerini girin</p>
            </div>

            {/* Sınav Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sınav Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={wizardState.step1.examName}
                onChange={(e) => updateStep1('examName', e.target.value)}
                placeholder="Örn: LGS Deneme #5"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Sınav Tarihi & Türü */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sınav Tarihi
                </label>
                <input
                  type="date"
                  value={wizardState.step1.examDate}
                  onChange={(e) => updateStep1('examDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sınav Türü
                </label>
                <select
                  value={wizardState.step1.examType}
                  onChange={(e) => updateStep1('examType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                >
                  <option value="LGS">LGS</option>
                  <option value="TYT">TYT</option>
                  <option value="AYT">AYT</option>
                  <option value="DENEME">Kurum Denemesi</option>
                </select>
              </div>
            </div>

            {/* Sınıf Seviyesi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sınıf Seviyesi
              </label>
              <select
                value={wizardState.step1.gradeLevel || ''}
                onChange={(e) => updateStep1('gradeLevel', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
              >
                <option value="">Seçiniz</option>
                <option value="4">4. Sınıf</option>
                <option value="5">5. Sınıf</option>
                <option value="6">6. Sınıf</option>
                <option value="7">7. Sınıf</option>
                <option value="8">8. Sınıf</option>
                <option value="9">9. Sınıf</option>
                <option value="10">10. Sınıf</option>
                <option value="11">11. Sınıf</option>
                <option value="12">12. Sınıf</option>
              </select>
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama (Opsiyonel)
              </label>
              <textarea
                value={wizardState.step1.description}
                onChange={(e) => updateStep1('description', e.target.value)}
                placeholder="Sınav hakkında notlar..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            {/* Debug Info (Development) */}
            <div className="p-4 bg-gray-100 rounded-xl text-xs font-mono text-gray-600">
              <p><strong>Debug:</strong></p>
              <p>Organization ID: {currentOrganization.id}</p>
              <p>Organization Name: {currentOrganization.name}</p>
              <p>Step 1 Data: {JSON.stringify(wizardState.step1, null, 2)}</p>
            </div>
          </div>
        )}

        {/* Step 2: Dersler (Placeholder) */}
        {wizardState.currentStep === 2 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Dersler</h2>
            <p className="text-gray-500">Bu adım henüz geliştirilmedi</p>
          </div>
        )}

        {/* Step 3: Cevap Anahtarı (Placeholder) */}
        {wizardState.currentStep === 3 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Cevap Anahtarı</h2>
            <p className="text-gray-500">Bu adım henüz geliştirilmedi</p>
          </div>
        )}

        {/* Step 4: Onay (Placeholder) */}
        {wizardState.currentStep === 4 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Onay & Kaydet</h2>
            <p className="text-gray-500">Bu adım henüz geliştirilmedi</p>
          </div>
        )}
      </WizardShell>
    </div>
  );
}

/**
 * SPECTRA NEW EXAM WIZARD – v1
 *
 * Bu sayfa /admin/spectra/sihirbaz route'unun TEK ve GERÇEK karşılığıdır.
 * Sidebar, Dashboard ve Sınavlar sayfasındaki tüm linkler buraya gelir.
 * organization context olmadan API çağrısı yapmaz.
 *
 * Adımlar:
 * Step 1 → sınav bilgileri
 * Step 2 → dersler
 * Step 3 → cevap anahtarı
 * Step 4 → onay & submit
 */
