'use client';

import React from 'react';

type ButtonVariant = 'default' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed';

  const variantClass =
    variant === 'outline'
      ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      : 'border border-transparent bg-indigo-600 text-white hover:bg-indigo-700';

  return (
    <button
      type={props.type || 'button'}
      className={`${base} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};


