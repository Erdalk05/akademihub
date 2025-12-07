'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white ${className}`}
    {...props}
  >
    {children}
  </div>
);

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`border-b border-slate-100 px-4 py-3 ${className}`} {...props}>
    {children}
  </div>
);

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle: React.FC<CardTitleProps> = ({
  className = '',
  children,
  ...props
}) => (
  <h3 className={`text-sm font-semibold text-slate-900 ${className}`} {...props}>
    {children}
  </h3>
);

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`px-4 pb-4 pt-2 ${className}`} {...props}>
    {children}
  </div>
);


