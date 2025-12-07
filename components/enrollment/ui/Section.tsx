'use client';

import React from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';

interface SectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  badge?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export const Section = ({
  title,
  icon: Icon,
  children,
  badge,
  collapsible = false,
  defaultOpen = true,
  className = '',
}: SectionProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`
      bg-white rounded-2xl border border-slate-200 overflow-hidden
      shadow-sm hover:shadow-md transition-shadow duration-300
      print:break-inside-avoid print:border-slate-300 print:shadow-none
      ${className}
    `}>
      {/* Header */}
      <div 
        className={`
          bg-gradient-to-r from-slate-50 to-white 
          px-6 py-4 
          border-b border-slate-100
          flex items-center justify-between
          ${collapsible ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}
        `}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
            {badge && (
              <span className="text-xs text-slate-500">{badge}</span>
            )}
          </div>
        </div>
        
        {collapsible && (
          <ChevronDown 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        )}
      </div>
      
      {/* Content */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}
      `}>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Info Card Component
interface InfoCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export const InfoCard = ({ label, value, icon: Icon, variant = 'default' }: InfoCardProps) => {
  const variants = {
    default: 'bg-slate-50 border-slate-200 text-slate-700',
    primary: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <div className={`p-4 rounded-xl border ${variants[variant]}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 opacity-60" />}
        <span className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

// Divider Component
export const Divider = ({ label }: { label?: string }) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-slate-200" />
    </div>
    {label && (
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
    )}
  </div>
);



