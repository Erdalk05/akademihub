'use client';

import React from 'react';
import { Check, FileText, Target, Grid3X3, Upload, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Sınav Bilgisi', description: 'Ad, tarih ve tür', icon: <FileText size={20} /> },
  { id: 2, title: 'Cevap Anahtarı', description: 'Kazanım bazlı', icon: <Target size={20} /> },
  { id: 3, title: 'Optik Şablon', description: 'Alan tanımları', icon: <Grid3X3 size={20} /> },
  { id: 4, title: 'Veri Yükle', description: 'Öğrenci cevapları', icon: <Upload size={20} /> },
  { id: 5, title: 'Önizleme', description: 'Sonuçları gör', icon: <BarChart3 size={20} /> },
];

interface WizardStepsProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedSteps?: number[];
}

export function WizardSteps({ currentStep, onStepClick, completedSteps = [] }: WizardStepsProps) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = step.id < currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <button
  onClick={() => onStepClick?.(step.id)}
  className={cn(
    'flex items-center gap-3 group transition-all cursor-pointer',
    'hover:scale-105 active:scale-95',
    isCurrent && 'scale-110'
  )}
>
                {/* Circle */}
                <div
  className={cn(
    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
    isCompleted && 'bg-emerald-500 text-white shadow-md',
    isCurrent && !isCompleted && 'bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-lg',
    !isCurrent && !isCompleted && step.id < currentStep && 'bg-sky-100 text-sky-600 border-2 border-sky-300',
    !isCurrent && !isCompleted && step.id > currentStep && 'bg-gray-100 text-gray-400 border-2 border-gray-200'
  )}
>
  {isCompleted ? <Check size={20} /> : step.icon}
</div>

                {/* Text */}
                <div className="hidden lg:block text-left">
                  <p
                    className={cn(
                      'font-semibold text-sm',
                      (isCurrent || isCompleted) ? 'text-gray-900' : 'text-gray-400'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </button>

              {/* Connector */}
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-3 transition-all',
                    isPast || isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-center gap-2 mb-2">
          {WIZARD_STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;

            return (
              <div
                key={step.id}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  isCompleted && 'bg-emerald-500',
                  isCurrent && !isCompleted && 'bg-emerald-500 w-6',
                  !isCurrent && !isCompleted && 'bg-gray-300'
                )}
              />
            );
          })}
        </div>
        <p className="text-center text-sm font-medium text-gray-700">
          Adım {currentStep} / {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1]?.title}
        </p>
      </div>
    </div>
  );
}

export default WizardSteps;

