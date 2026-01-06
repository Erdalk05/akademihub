/**
 * ============================================
 * AkademiHub - Dashboard States
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Loading / Empty / Stale / Error UI state'leri
 * - Skeleton loader
 * - State-based rendering
 */

'use client';

import React from 'react';
import type { ProductDataState } from '../types';

// ==================== PROPS ====================

export interface StateContainerProps {
  state: ProductDataState;
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  onRetry?: () => void;
  language?: 'tr' | 'en';
}

// ==================== ANA COMPONENT ====================

/**
 * State bazlı container
 * State'e göre loading, empty, error veya içeriği gösterir
 */
export function StateContainer({
  state,
  isLoading = false,
  error,
  children,
  onRetry,
  language = 'tr'
}: StateContainerProps) {
  // Loading
  if (isLoading) {
    return <LoadingState language={language} />;
  }
  
  // Error
  if (state === 'error' || error) {
    return <ErrorState message={error} onRetry={onRetry} language={language} />;
  }
  
  // Empty
  if (state === 'empty') {
    return <EmptyState language={language} />;
  }
  
  // Generating
  if (state === 'generating') {
    return <GeneratingState language={language} />;
  }
  
  // Stale - içeriği göster ama uyarı ekle
  if (state === 'stale') {
    return (
      <div className="relative">
        <StaleIndicator language={language} />
        {children}
      </div>
    );
  }
  
  // Ready - içeriği göster
  return <>{children}</>;
}

// ==================== LOADING STATE ====================

export function LoadingState({ language = 'tr' }: { language?: 'tr' | 'en' }) {
  return (
    <div className="animate-pulse space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
      {/* Header skeleton */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      
      {/* Body skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
      
      {/* Priority list skeleton */}
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          </div>
        ))}
      </div>
      
      {/* Loading text */}
      <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
        {language === 'tr' ? 'Yükleniyor...' : 'Loading...'}
      </p>
    </div>
  );
}

// ==================== EMPTY STATE ====================

export function EmptyState({ language = 'tr' }: { language?: 'tr' | 'en' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
      {/* Icon */}
      <div className="text-5xl mb-4">📭</div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {language === 'tr' ? 'Henüz Analiz Yok' : 'No Analysis Yet'}
      </h3>
      
      {/* Description */}
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
        {language === 'tr'
          ? 'AI koç yorumu henüz oluşturulmadı. Sınav sonuçları yüklendikten sonra otomatik olarak oluşturulacak.'
          : 'AI coach feedback has not been generated yet. It will be created automatically after exam results are uploaded.'}
      </p>
    </div>
  );
}

// ==================== GENERATING STATE ====================

export function GeneratingState({ language = 'tr' }: { language?: 'tr' | 'en' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
      {/* Animated icon */}
      <div className="relative mb-4">
        <div className="text-5xl animate-bounce">🤖</div>
        <div className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500" />
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
        {language === 'tr' ? 'Koçunuz Analiz Yapıyor...' : 'Your Coach is Analyzing...'}
      </h3>
      
      {/* Description */}
      <p className="text-blue-600 dark:text-blue-400 text-center max-w-sm">
        {language === 'tr'
          ? 'AI koçunuz sınav sonuçlarını değerlendiriyor. Bu işlem birkaç saniye sürebilir.'
          : 'Your AI coach is evaluating the exam results. This may take a few seconds.'}
      </p>
      
      {/* Progress bar */}
      <div className="w-48 h-1 bg-blue-200 dark:bg-blue-800 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" 
             style={{ width: '60%' }} />
      </div>
    </div>
  );
}

// ==================== ERROR STATE ====================

export function ErrorState({
  message,
  onRetry,
  language = 'tr'
}: {
  message?: string | null;
  onRetry?: () => void;
  language?: 'tr' | 'en';
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
      {/* Icon */}
      <div className="text-5xl mb-4">😕</div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
        {language === 'tr' ? 'Bir Hata Oluştu' : 'An Error Occurred'}
      </h3>
      
      {/* Message */}
      {message && (
        <p className="text-red-600 dark:text-red-400 text-center max-w-sm mb-4">
          {message}
        </p>
      )}
      
      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          {language === 'tr' ? 'Tekrar Dene' : 'Try Again'}
        </button>
      )}
    </div>
  );
}

// ==================== STALE INDICATOR ====================

export function StaleIndicator({ language = 'tr' }: { language?: 'tr' | 'en' }) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 rounded-t-xl">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
        <span>♻️</span>
        <span>
          {language === 'tr'
            ? 'Yeni analiz hazırlanıyor, mevcut yorum gösteriliyor.'
            : 'New analysis is being prepared, showing current feedback.'}
        </span>
      </div>
    </div>
  );
}

// ==================== PULSE DOT ====================

export function PulseDot({ color = 'green' }: { color?: 'green' | 'amber' | 'red' }) {
  const colorClasses = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  };
  
  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colorClasses[color]}`} />
    </span>
  );
}

// ==================== EXPORT ====================

export default {
  StateContainer,
  LoadingState,
  EmptyState,
  GeneratingState,
  ErrorState,
  StaleIndicator,
  PulseDot
};

