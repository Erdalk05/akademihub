'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User } from 'lucide-react';

export default function StudentExamIntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  
  // TODO: useStudentStore veya session kontrolü eklenecek
  const isLoading = false;
  const hasAccess = true;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Erişim Engellendi</h2>
          <p className="text-slate-600">Bu sayfaya erişim yetkiniz yok.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/30">
      {children}
    </div>
  );
}