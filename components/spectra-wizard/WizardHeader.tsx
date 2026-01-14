'use client';

// ============================================================================
// SPECTRA WIZARD - HEADER COMPONENT
// Adım göstergeleri ve navigasyon
// ============================================================================

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface WizardStepInfo {
  step: 1 | 2 | 3 | 4;
  label: string;
  description: string;
}

interface WizardHeaderProps {
  steps: WizardStepInfo[];
  currentStep: 1 | 2 | 3 | 4;
  completedSteps: (1 | 2 | 3 | 4)[];
  onStepClick?: (step: 1 | 2 | 3 | 4) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function WizardHeader({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: WizardHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((stepInfo, index) => {
            const isCompleted = completedSteps.includes(stepInfo.step);
            const isCurrent = currentStep === stepInfo.step;
            const isClickable = isCompleted || isCurrent || stepInfo.step <= currentStep;

            return (
              <React.Fragment key={stepInfo.step}>
                {/* Step Circle & Label */}
                <button
                  onClick={() => isClickable && onStepClick?.(stepInfo.step)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-3 transition-all',
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  )}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all',
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-2'
                        : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      stepInfo.step
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-left">
                    <p
                      className={cn(
                        'font-semibold text-sm',
                        isCurrent || isCompleted ? 'text-gray-900' : 'text-gray-400'
                      )}
                    >
                      {stepInfo.label}
                    </p>
                    <p className="text-xs text-gray-400">{stepInfo.description}</p>
                  </div>
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-colors',
                      completedSteps.includes(stepInfo.step)
                        ? 'bg-emerald-500'
                        : 'bg-gray-200'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-4">
            {steps.map((stepInfo) => {
              const isCompleted = completedSteps.includes(stepInfo.step);
              const isCurrent = currentStep === stepInfo.step;

              return (
                <div
                  key={stepInfo.step}
                  className={cn(
                    'flex-1 h-2 rounded-full transition-colors',
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-emerald-300'
                      : 'bg-gray-200'
                  )}
                />
              );
            })}
          </div>

          {/* Current Step Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
              {currentStep}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {steps.find((s) => s.step === currentStep)?.label}
              </p>
              <p className="text-xs text-gray-500">
                Adım {currentStep} / {steps.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WizardHeader;
