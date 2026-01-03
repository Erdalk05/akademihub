'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { Loader2, Building2, AlertTriangle } from 'lucide-react';

export default function ExamIntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentOrganization, isLoading } = useOrganizationStore();

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // No Organization
  if (!currentOrganization?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Kurum Seçilmedi</h2>
          <p className="text-slate-600 mb-6">Devam etmek için bir kurum seçin.</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-indigo-50/20">
      {children}
    </div>
  );
}