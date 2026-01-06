/**
 * ============================================
 * AkademiHub - Action Center
 * ============================================
 * 
 * PHASE 6 - Productization Layer
 * 
 * BU DOSYA:
 * - CTA butonları
 * - PDF indir, koçtan öneri al, öğretmene sor
 */

'use client';

import React from 'react';
import type { CTAButton, CTAAction } from '../types';

// ==================== PROPS ====================

export interface ActionCenterProps {
  ctas: CTAButton[];
  onAction: (action: CTAAction) => void;
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  language?: 'tr' | 'en';
}

// ==================== ANA COMPONENT ====================

/**
 * Action Center - CTA butonları
 */
export function ActionCenter({
  ctas,
  onAction,
  layout = 'horizontal',
  size = 'md',
  language = 'tr'
}: ActionCenterProps) {
  const enabledCtas = ctas.filter(cta => cta.enabled);
  
  if (enabledCtas.length === 0) {
    return null;
  }
  
  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 gap-2'
  };
  
  return (
    <div className={`${layoutClasses[layout]}`}>
      {enabledCtas.map((cta) => (
        <ActionButton
          key={cta.action}
          cta={cta}
          onClick={() => onAction(cta.action)}
          size={size}
        />
      ))}
    </div>
  );
}

// ==================== ACTION BUTTON ====================

interface ActionButtonProps {
  cta: CTAButton;
  onClick: () => void;
  size: 'sm' | 'md' | 'lg';
}

function ActionButton({ cta, onClick, size }: ActionButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  // Action-specific styles
  const actionStyles = getActionStyles(cta.action);
  
  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${actionStyles.bg}
        ${actionStyles.text}
        ${actionStyles.border}
        rounded-lg
        font-medium
        transition-all duration-200
        hover:scale-[1.02]
        active:scale-[0.98]
        flex items-center justify-center gap-2
        shadow-sm
      `}
    >
      <span className="text-lg">{cta.icon}</span>
      <span>{cta.label}</span>
    </button>
  );
}

// ==================== ACTION STYLES ====================

function getActionStyles(action: CTAAction) {
  switch (action) {
    case 'download_pdf':
      return {
        bg: 'bg-blue-600 hover:bg-blue-700',
        text: 'text-white',
        border: 'border-blue-600'
      };
    
    case 'open_ai':
      return {
        bg: 'bg-purple-600 hover:bg-purple-700',
        text: 'text-white',
        border: 'border-purple-600'
      };
    
    case 'ask_teacher':
      return {
        bg: 'bg-green-600 hover:bg-green-700',
        text: 'text-white',
        border: 'border-green-600'
      };
    
    case 'share_whatsapp':
      return {
        bg: 'bg-emerald-500 hover:bg-emerald-600',
        text: 'text-white',
        border: 'border-emerald-500'
      };
    
    case 'view_details':
      return {
        bg: 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border border-gray-200 dark:border-gray-600'
      };
    
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border border-gray-200 dark:border-gray-600'
      };
  }
}

// ==================== PRIMARY ACTION ====================

export interface PrimaryActionProps {
  action: CTAAction;
  label: string;
  icon: string;
  onClick: () => void;
  loading?: boolean;
}

export function PrimaryAction({
  action,
  label,
  icon,
  onClick,
  loading = false
}: PrimaryActionProps) {
  const styles = getActionStyles(action);
  
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        w-full px-6 py-4 text-lg
        ${styles.bg}
        ${styles.text}
        ${styles.border}
        rounded-xl
        font-semibold
        transition-all duration-200
        hover:scale-[1.01]
        active:scale-[0.99]
        flex items-center justify-center gap-3
        shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : (
        <span className="text-2xl">{icon}</span>
      )}
      <span>{label}</span>
    </button>
  );
}

// ==================== FLOATING ACTION ====================

export interface FloatingActionProps {
  icon: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  color?: 'blue' | 'green' | 'purple';
}

export function FloatingAction({
  icon,
  onClick,
  position = 'bottom-right',
  color = 'blue'
}: FloatingActionProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };
  
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]}
        w-14 h-14 rounded-full
        ${colorClasses[color]}
        text-white text-2xl
        shadow-lg
        flex items-center justify-center
        transition-transform duration-200
        hover:scale-110
        active:scale-95
        z-50
      `}
    >
      {icon}
    </button>
  );
}

// ==================== EXPORT ====================

export default ActionCenter;

