'use client';

// ============================================================================
// WIZARD SHELL - Ana Container
// Step içeriğini saran ve navigasyonu yöneten bileşen
// ============================================================================

import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardShellProps {
  currentStep: number;
  totalSteps?: number;
  children: React.ReactNode;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  isLoading?: boolean;
  isSaving?: boolean;
  isLastStep?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  saveLabel?: string;
}

export function WizardShell({
  currentStep,
  totalSteps = 4,
  children,
  onNext,
  onPrev,
  onSave,
  canGoNext = true,
  canGoPrev = true,
  isLoading = false,
  isSaving = false,
  isLastStep = false,
  nextLabel,
  prevLabel = 'Geri',
  saveLabel = 'Sınavı Oluştur',
}: WizardShellProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WizardShell.tsx:render',message:'WizardShell rendering',data:{currentStep,isLoading,isSaving,hasChildren:!!children,childrenType:typeof children},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {isLoading ? (
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WizardShell.tsx:loading',message:'Showing loading spinner',data:{isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{}),
            // #endregion
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WizardShell.tsx:children',message:'Rendering children',data:{hasChildren:!!children,childrenType:typeof children},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{}),
            // #endregion
            children
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Previous Button */}
            <div>
              {currentStep > 1 && (
                <button
                  onClick={onPrev}
                  disabled={!canGoPrev || isLoading || isSaving}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                    canGoPrev && !isLoading && !isSaving
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {prevLabel}
                </button>
              )}
            </div>

            {/* Center: Step Indicator */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div
                  key={step}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all',
                    step === currentStep
                      ? 'w-8 bg-emerald-500'
                      : step < currentStep
                        ? 'bg-emerald-300'
                        : 'bg-gray-300'
                  )}
                />
              ))}
            </div>

            {/* Right: Next/Save Button */}
            <div>
              {isLastStep ? (
                <button
                  onClick={onSave}
                  disabled={!canGoNext || isLoading || isSaving}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all',
                    canGoNext && !isLoading && !isSaving
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {saveLabel}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={onNext}
                  disabled={!canGoNext || isLoading || isSaving}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all',
                    canGoNext && !isLoading && !isSaving
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  )}
                >
                  {nextLabel || `Adım ${currentStep + 1}`}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
