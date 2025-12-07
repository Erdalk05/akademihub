import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-4 h-4" />}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-gray-900 transition">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-900 font-semibold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Header with Title and Actions */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 mt-2">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="ml-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

