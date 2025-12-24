/**
 * ============================================
 * AkademiHub - Insight Pulse
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - Trend + risk nabız göstergesi
 * - Grafik değil, yorum destekli nabız
 */

'use client';

import React from 'react';
import type { InsightPulseViewModel, StatusColor } from '../types';

// ==================== PROPS ====================

export interface InsightPulseProps {
  viewModel: InsightPulseViewModel;
  showRisk?: boolean;
  compact?: boolean;
  language?: 'tr' | 'en';
}

// ==================== ANA COMPONENT ====================

/**
 * Insight Pulse - Trend ve risk nabız göstergesi
 */
export function InsightPulse({
  viewModel,
  showRisk = true,
  compact = false,
  language = 'tr'
}: InsightPulseProps) {
  const {
    trendDirection,
    trendMessage,
    trendIcon,
    riskLevel,
    riskMessage,
    pulseValue,
    pulseColor
  } = viewModel;
  
  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700
      ${compact ? 'p-4' : 'p-6'}
    `}>
      {/* Trend Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{trendIcon}</span>
          <div>
            <h4 className={`font-medium text-gray-800 dark:text-gray-200 ${compact ? 'text-sm' : ''}`}>
              {language === 'tr' ? 'Performans Trendi' : 'Performance Trend'}
            </h4>
            <p className={`text-gray-600 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
              {trendMessage}
            </p>
          </div>
        </div>
        
        {/* Trend indicator */}
        <TrendIndicator direction={trendDirection} />
      </div>
      
      {/* Pulse Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{language === 'tr' ? 'Veri Kalitesi' : 'Data Quality'}</span>
          <span>{pulseValue}%</span>
        </div>
        <PulseBar value={pulseValue} color={pulseColor} />
      </div>
      
      {/* Risk Section */}
      {showRisk && riskLevel !== 'unknown' && (
        <div className={`
          pt-4 border-t border-gray-100 dark:border-gray-700
          ${compact ? 'text-sm' : ''}
        `}>
          <RiskIndicator
            level={riskLevel}
            message={riskMessage}
            language={language}
          />
        </div>
      )}
    </div>
  );
}

// ==================== TREND INDICATOR ====================

function TrendIndicator({ direction }: { direction: InsightPulseViewModel['trendDirection'] }) {
  const indicators = {
    up: {
      bg: 'bg-green-100 dark:bg-green-800',
      text: 'text-green-600 dark:text-green-400',
      icon: '↑'
    },
    down: {
      bg: 'bg-amber-100 dark:bg-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
      icon: '↓'
    },
    stable: {
      bg: 'bg-blue-100 dark:bg-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      icon: '→'
    },
    unknown: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-400',
      icon: '?'
    }
  };
  
  const indicator = indicators[direction];
  
  return (
    <span className={`
      w-10 h-10 rounded-full flex items-center justify-center
      ${indicator.bg} ${indicator.text}
      text-xl font-bold
    `}>
      {indicator.icon}
    </span>
  );
}

// ==================== PULSE BAR ====================

function PulseBar({ value, color }: { value: number; color: StatusColor }) {
  const colorClasses = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    softRed: 'bg-rose-500'
  };
  
  return (
    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ==================== RISK INDICATOR ====================

function RiskIndicator({
  level,
  message,
  language
}: {
  level: InsightPulseViewModel['riskLevel'];
  message: string | null;
  language: 'tr' | 'en';
}) {
  const riskConfig = {
    low: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300',
      icon: '✓',
      label: language === 'tr' ? 'İyi Durumda' : 'Good Standing'
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      icon: '!',
      label: language === 'tr' ? 'Dikkat Alanları Var' : 'Areas Need Attention'
    },
    high: {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
      icon: '◆',
      label: language === 'tr' ? 'Öncelikli Çalışma Gerekli' : 'Priority Work Needed'
    },
    unknown: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      icon: '?',
      label: language === 'tr' ? 'Değerlendiriliyor' : 'Being Evaluated'
    }
  };
  
  const config = riskConfig[level];
  
  return (
    <div className={`
      p-3 rounded-lg border ${config.bg} ${config.border}
    `}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-bold ${config.text}`}>{config.icon}</span>
        <span className={`font-medium ${config.text}`}>{config.label}</span>
      </div>
      {message && (
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}

// ==================== COMPACT VERSION ====================

export function InsightPulseCompact({ viewModel }: { viewModel: InsightPulseViewModel }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <span className="text-2xl">{viewModel.trendIcon}</span>
      <div className="flex-1">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {viewModel.trendMessage}
        </p>
      </div>
      <PulseBar value={viewModel.pulseValue} color={viewModel.pulseColor} />
    </div>
  );
}

// ==================== EXPORT ====================

export default InsightPulse;

