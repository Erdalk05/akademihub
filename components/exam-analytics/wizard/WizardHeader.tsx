'use client';

/**
 * Wizard Header - Adım göstergesi ve navigasyon
 */

import React from 'react';
import { Check, FileText, Key, FileSpreadsheet, Upload, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardStep } from '@/types/exam-analytics';

interface WizardHeaderProps {
  currentStep: WizardStep;
  sinavAdi?: string;
  sinavKodu?: string;
  durum?: string;
  stepsCompleted: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
    step5: boolean;
  };
  onStepClick?: (step: WizardStep) => void;
}

const STEPS = [
  { step: 1 as WizardStep, label: 'Sınav Bilgisi', icon: FileText },
  { step: 2 as WizardStep, label: 'Cevap Anahtarı', icon: Key },
  { step: 3 as WizardStep, label: 'Optik Şablon', icon: FileSpreadsheet },
  { step: 4 as WizardStep, label: 'Veri Yükle', icon: Upload },
  { step: 5 as WizardStep, label: 'Önizleme', icon: Eye },
];

export function WizardHeader({
  currentStep,
  sinavAdi,
  sinavKodu,
  durum = 'Taslak',
  stepsCompleted,
  onStepClick,
}: WizardHeaderProps) {
  const getStepStatus = (step: WizardStep) => {
    const key = `step${step}` as keyof typeof stepsCompleted;
    if (stepsCompleted[key]) return 'completed';
    if (step === currentStep) return 'active';
    if (step < currentStep) return 'passed';
    return 'pending';
  };

  return (
    <div className="bg-white border-b sticky top-0 z-10">
      {/* Üst Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Geri
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {sinavAdi || 'Yeni Sınav Ekle'}
            </h1>
            {sinavKodu && (
              <p className="text-sm text-gray-500">{sinavKodu}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            durum === 'Taslak' && 'bg-yellow-100 text-yellow-800',
            durum === 'Yayınlandı' && 'bg-green-100 text-green-800',
            durum === 'Hata' && 'bg-red-100 text-red-800',
          )}>
            ○ {durum}
          </span>
        </div>
      </div>

      {/* Adım Göstergesi */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {STEPS.map((stepInfo, index) => {
            const status = getStepStatus(stepInfo.step);
            const Icon = stepInfo.icon;
            const isClickable = status === 'completed' || status === 'passed' || stepInfo.step <= currentStep;

            return (
              <React.Fragment key={stepInfo.step}>
                {/* Step Circle */}
                <button
                  onClick={() => isClickable && onStepClick?.(stepInfo.step)}
                  disabled={!isClickable}
                  className={cn(
                    'flex flex-col items-center gap-2 transition-all',
                    isClickable && 'cursor-pointer hover:opacity-80',
                    !isClickable && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      status === 'completed' && 'bg-green-500 text-white',
                      status === 'active' && 'bg-blue-500 text-white ring-4 ring-blue-100',
                      status === 'passed' && 'bg-blue-500 text-white',
                      status === 'pending' && 'bg-gray-200 text-gray-500',
                    )}
                  >
                    {status === 'completed' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      status === 'active' && 'text-blue-600',
                      status === 'completed' && 'text-green-600',
                      status === 'passed' && 'text-blue-600',
                      status === 'pending' && 'text-gray-400',
                    )}
                  >
                    {stepInfo.label}
                  </span>
                </button>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-2 rounded">
                    <div
                      className={cn(
                        'h-full rounded transition-all',
                        (status === 'completed' || status === 'passed') && 'bg-blue-500',
                        status === 'active' && 'bg-gradient-to-r from-blue-500 to-gray-200',
                        status === 'pending' && 'bg-gray-200',
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
