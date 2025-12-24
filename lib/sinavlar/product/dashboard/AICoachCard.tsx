/**
 * ============================================
 * AkademiHub - AI Coach Card
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Ana AI yorum kartı
 * - Header + Body + Priority List
 * - Status color
 */

'use client';

import React from 'react';
import type { DashboardViewModel, PriorityItem, CTAButton } from '../types';
import { StateContainer } from './states';

// ==================== PROPS ====================

export interface AICoachCardProps {
  viewModel: DashboardViewModel;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCTAClick?: (action: CTAButton['action']) => void;
  language?: 'tr' | 'en';
  showCTAs?: boolean;
  compact?: boolean;
}

// ==================== ANA COMPONENT ====================

/**
 * AI Coach ana kartı
 */
export function AICoachCard({
  viewModel,
  isLoading = false,
  error,
  onRetry,
  onCTAClick,
  language = 'tr',
  showCTAs = true,
  compact = false
}: AICoachCardProps) {
  const { header, body, priorityList, statusColor, ctas, isFallback, state, metadata } = viewModel;
  
  // Status color classes
  const statusColorClasses = {
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    amber: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
    softRed: 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
  };
  
  const headerColorClasses = {
    green: 'text-green-700 dark:text-green-300',
    amber: 'text-amber-700 dark:text-amber-300',
    softRed: 'text-rose-700 dark:text-rose-300'
  };
  
  return (
    <StateContainer
      state={state}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      language={language}
    >
      <div className={`
        rounded-xl border-l-4 ${statusColorClasses[statusColor]}
        ${compact ? 'p-4' : 'p-6'}
        shadow-sm
      `}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className={`font-semibold ${headerColorClasses[statusColor]} ${compact ? 'text-base' : 'text-lg'}`}>
                {header}
              </h3>
              {isFallback && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'tr' ? '(Otomatik yorum)' : '(Auto-generated)'}
                </span>
              )}
            </div>
          </div>
          
          {/* Status badge */}
          <StatusBadge status={statusColor} />
        </div>
        
        {/* Body */}
        <p className={`text-gray-700 dark:text-gray-300 ${compact ? 'text-sm' : ''} mb-4`}>
          {body}
        </p>
        
        {/* Priority List */}
        {priorityList.length > 0 && !compact && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {language === 'tr' ? 'Öncelikli Adımlar' : 'Priority Steps'}
            </h4>
            <div className="space-y-2">
              {priorityList.map((item) => (
                <PriorityItemCard key={item.priority} item={item} />
              ))}
            </div>
          </div>
        )}
        
        {/* CTAs */}
        {showCTAs && ctas.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'}`}>
            {ctas.map((cta) => (
              <CTAButtonComponent
                key={cta.action}
                cta={cta}
                onClick={() => onCTAClick?.(cta.action)}
                compact={compact}
              />
            ))}
          </div>
        )}
        
        {/* Metadata */}
        {!compact && metadata.generatedAt && (
          <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {language === 'tr' ? 'Oluşturulma: ' : 'Generated: '}
              {new Date(metadata.generatedAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}
      </div>
    </StateContainer>
  );
}

// ==================== STATUS BADGE ====================

function StatusBadge({ status }: { status: 'green' | 'amber' | 'softRed' }) {
  const badges = {
    green: { bg: 'bg-green-100 dark:bg-green-800', text: 'text-green-700 dark:text-green-300', label: '✓ İyi' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-800', text: 'text-amber-700 dark:text-amber-300', label: '! Dikkat' },
    softRed: { bg: 'bg-rose-100 dark:bg-rose-800', text: 'text-rose-700 dark:text-rose-300', label: '◆ Öncelik' }
  };
  
  const badge = badges[status];
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
      {badge.label}
    </span>
  );
}

// ==================== PRIORITY ITEM CARD ====================

function PriorityItemCard({ item }: { item: PriorityItem }) {
  const priorityColors = {
    1: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300',
    2: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300',
    3: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  };
  
  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Priority number */}
      <span className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
        ${priorityColors[item.priority as 1 | 2 | 3] || priorityColors[3]}
      `}>
        {item.priority}
      </span>
      
      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span>{item.icon}</span>
          <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
            {item.title}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          {item.description}
        </p>
      </div>
    </div>
  );
}

// ==================== CTA BUTTON ====================

function CTAButtonComponent({
  cta,
  onClick,
  compact = false
}: {
  cta: CTAButton;
  onClick: () => void;
  compact?: boolean;
}) {
  if (!cta.enabled) {
    return null;
  }
  
  const baseClasses = compact
    ? 'px-3 py-1.5 text-xs'
    : 'px-4 py-2 text-sm';
  
  return (
    <button
      onClick={onClick}
      className={`
        ${baseClasses}
        bg-white dark:bg-gray-700 
        border border-gray-200 dark:border-gray-600
        text-gray-700 dark:text-gray-300
        rounded-lg
        hover:bg-gray-50 dark:hover:bg-gray-600
        transition-colors
        flex items-center gap-1.5
      `}
    >
      <span>{cta.icon}</span>
      <span>{cta.label}</span>
    </button>
  );
}

// ==================== EXPORT ====================

export default AICoachCard;

