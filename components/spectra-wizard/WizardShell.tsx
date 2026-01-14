'use client';

// ============================================================================
// SPECTRA WIZARD - SHELL COMPONENT
// Adım içeriğinin render edildiği kapsayıcı + navigasyon butonları
// ============================================================================

import React from 'react';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface WizardShellProps {
  children: React.ReactNode;
  currentStep: 1 | 2 | 3 | 4;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  onSubmit?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function WizardShell({
  children,
  currentStep,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  isLastStep,
  isSubmitting = false,
  onSubmit,
}: WizardShellProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Step Content */}
        <div className="p-6 md:p-8 min-h-[400px]">{children}</div>

        {/* Navigation Footer */}
        <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {/* Previous Button */}
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
              canGoPrev
                ? 'text-gray-700 hover:bg-gray-200'
                : 'text-gray-300 cursor-not-allowed'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>

          {/* Step Indicator (Mobile) */}
          <div className="md:hidden text-sm text-gray-500">
            {currentStep} / 4
          </div>

          {/* Next / Submit Button */}
          {isLastStep ? (
            <button
              onClick={onSubmit}
              disabled={!canGoNext || isSubmitting}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all',
                canGoNext && !isSubmitting
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Sınavı Kaydet
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all',
                canGoNext
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              Devam Et
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Adım {currentStep}: Tüm zorunlu alanları doldurun ve devam edin
      </p>
    </div>
  );
}

export default WizardShell;
