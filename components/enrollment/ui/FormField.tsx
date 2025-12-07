'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, icon: Icon, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          )}
          <input
            ref={ref}
            className={`
              w-full px-3 py-2.5 
              border rounded-lg text-sm
              transition-all duration-200
              focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
              outline-none
              disabled:bg-slate-50 disabled:text-slate-500
              print:border-slate-300 print:bg-white
              ${Icon ? 'pl-10' : ''}
              ${error ? 'border-red-300 bg-red-50/50' : 'border-slate-200 hover:border-slate-300'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  hint?: string;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, options, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select
          ref={ref}
          className={`
            w-full px-3 py-2.5 
            border rounded-lg text-sm
            bg-white
            transition-all duration-200
            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
            outline-none
            disabled:bg-slate-50 disabled:text-slate-500
            print:border-slate-300
            ${error ? 'border-red-300 bg-red-50/50' : 'border-slate-200 hover:border-slate-300'}
            ${className}
          `}
          {...props}
        >
          <option value="">Seçiniz</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormTextArea = React.forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2.5 
            border rounded-lg text-sm
            transition-all duration-200
            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
            outline-none resize-none
            disabled:bg-slate-50 disabled:text-slate-500
            print:border-slate-300 print:bg-white
            ${error ? 'border-red-300 bg-red-50/50' : 'border-slate-200 hover:border-slate-300'}
            ${className}
          `}
          rows={3}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
    );
  }
);

FormTextArea.displayName = 'FormTextArea';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', ...props }, ref) => {
    return (
      <label className={`flex items-start gap-3 cursor-pointer group ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          {...props}
        />
        <div>
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
            {label}
          </span>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';



