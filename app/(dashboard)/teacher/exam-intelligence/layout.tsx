'use client';

import React from 'react';

export default function TeacherExamIntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/30 to-cyan-50/30">
      {children}
    </div>
  );
}