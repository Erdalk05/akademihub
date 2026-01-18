'use client';

/**
 * Sınav Ekleme Wizard - Ana Sayfa
 * /admin/exam-analytics/create
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExamWizard } from '@/hooks/useExamWizard';
import {
  WizardHeader,
  Step1SinavBilgileri,
  Step2CevapAnahtari,
  Step3OptikSablon,
  Step4VeriYukle,
  Step5Onizleme,
} from '@/components/exam-analytics/wizard';

export default function CreateExamPage() {
  const router = useRouter();
  const wizard = useExamWizard();
  const { state, goNext, goBack, goToStep, canGoNext, setIsLoading, setError, setSinavId } = wizard;
  
  // Mock organization ID - gerçek uygulamada session'dan alınacak
  const [organizationId, setOrganizationId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [pageLoading, setPageLoading] = useState(true);

  // Organization bilgisini al
  useEffect(() => {
    // localStorage'dan veya session'dan al
    const storedOrgId = localStorage.getItem('selectedOrganizationId');
    const storedUserId = localStorage.getItem('userId');
    
    if (storedOrgId) {
      setOrganizationId(storedOrgId);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
    
    setPageLoading(false);
  }, []);

  // Adım 1 tamamlandığında API'ye kaydet
  const handleStep1Complete = async () => {
    if (!state.step1.isCompleted) return;
    
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/admin/exam-analytics/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          sinavAdi: state.step1.sinavAdi,
          sinavTarihi: state.step1.sinavTarihi?.toISOString(),
          sinifSeviyesi: state.step1.sinifSeviyesi,
          sinavTuru: state.step1.sinavTuru,
          sureDakika: state.step1.sureDakika,
          yanlisKatsayi: state.step1.yanlisKatsayi,
          dersler: state.step1.dersler.map(d => ({
            dersId: d.dersId,
            dersKodu: d.dersKodu,
            soruSayisi: d.soruSayisi,
            dogruPuan: d.dogruPuan,
            yanlisPuan: d.yanlisPuan,
          })),
          userId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Sınav oluşturulamadı');
      }

      setSinavId(json.sinavId, json.sinavKodu);
      goNext();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Adım 2 tamamlandığında cevap anahtarını kaydet
  const handleStep2Complete = async () => {
    if (!state.step2.isCompleted || !state.sinavId) return;
    
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/admin/exam-analytics/exams/${state.sinavId}/answer-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitapcik: state.step2.kitapcik,
          cevaplar: state.step2.cevaplar.map(c => ({
            dersId: c.dersId,
            cevapDizisi: c.cevapDizisi,
          })),
          userId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Cevap anahtarı kaydedilemedi');
      }

      goNext();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Adım 3 tamamlandığında optik şablonu kaydet
  const handleStep3Complete = async () => {
    if (!state.sinavId) return;
    
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/admin/exam-analytics/exams/${state.sinavId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optikSablonId: state.step3.optikSablonId || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Optik şablon kaydedilemedi');
      }

      goNext();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Adım 4 tamamlandığında katılımcıları kaydet
  const handleStep4Complete = async () => {
    if (!state.step4.isCompleted || !state.sinavId) return;
    
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/admin/exam-analytics/exams/${state.sinavId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          katilimcilar: state.step4.katilimcilar,
          hamDosyaAdi: state.step4.dosyaAdi,
          hamDosyaIcerik: state.step4.dosyaIcerik,
          sinavDersleri: state.step1.dersler.map(d => ({
            dersId: d.dersId,
            baslangicSoru: d.baslangicSoru,
            bitisSoru: d.bitisSoru,
            soruSayisi: d.soruSayisi,
          })),
          userId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Katılımcılar kaydedilemedi');
      }

      goNext();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Yayınla
  const handlePublish = async () => {
    if (!state.sinavId) return;
    
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/admin/exam-analytics/exams/${state.sinavId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yayinSecenegi: 'hemen',
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Yayınlama başarısız');
      }

      // Başarılı - sınav listesine yönlendir
      router.push('/admin/exam-analytics/sinavlar?success=published');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // İleri butonu handler
  const handleNext = async () => {
    switch (state.currentStep) {
      case 1:
        if (!state.sinavId) {
          await handleStep1Complete();
        } else {
          goNext();
        }
        break;
      case 2:
        await handleStep2Complete();
        break;
      case 3:
        await handleStep3Complete();
        break;
      case 4:
        await handleStep4Complete();
        break;
      default:
        goNext();
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WizardHeader
        currentStep={state.currentStep}
        sinavAdi={state.step1.sinavAdi}
        sinavKodu={state.sinavKodu}
        durum="Taslak"
        stepsCompleted={{
          step1: state.step1.isCompleted,
          step2: state.step2.isCompleted,
          step3: state.step3.isCompleted,
          step4: state.step4.isCompleted,
          step5: state.step5.hazirMi,
        }}
        onStepClick={goToStep}
      />

      {/* Content */}
      <div className="pb-24">
        {state.currentStep === 1 && (
          <Step1SinavBilgileri wizard={wizard} organizationId={organizationId} />
        )}
        {state.currentStep === 2 && (
          <Step2CevapAnahtari wizard={wizard} />
        )}
        {state.currentStep === 3 && (
          <Step3OptikSablon wizard={wizard} organizationId={organizationId} />
        )}
        {state.currentStep === 4 && (
          <Step4VeriYukle wizard={wizard} organizationId={organizationId} />
        )}
        {state.currentStep === 5 && (
          <Step5Onizleme 
            wizard={wizard} 
            organizationId={organizationId} 
            userId={userId}
            onPublish={handlePublish}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Geri Butonu */}
          <button
            onClick={goBack}
            disabled={state.currentStep === 1}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              state.currentStep === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
            Geri
          </button>

          {/* Adım Göstergesi */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  step === state.currentStep && 'w-6 bg-blue-500',
                  step < state.currentStep && 'bg-green-500',
                  step > state.currentStep && 'bg-gray-300',
                )}
              />
            ))}
          </div>

          {/* İleri Butonu */}
          {state.currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext || state.isLoading}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all',
                canGoNext && !state.isLoading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {state.isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  İleri
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <div /> // Placeholder - Step 5'te yayınla butonu içeride
          )}
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="max-w-4xl mx-auto mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}
