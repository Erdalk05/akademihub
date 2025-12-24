/**
 * ============================================
 * AkademiHub - Academic Analysis Command Center
 * ============================================
 * 
 * PHASE 8.5 - Core Intelligence Hub
 * 
 * Bu sayfa:
 * ❌ Pazarlama sayfası DEĞİL
 * ❌ Basit dashboard DEĞİL
 * ✅ Karar odaklı intelligence hub
 * ✅ Sınav, analitik, AI ve kurumsal içgörülerin giriş kapısı
 * 
 * 5 SANİYEDE CEVAP:
 * 1. Akademik olarak neredeyiz?
 * 2. Nerede risk/fırsat var?
 * 3. Şimdi ne yapmalıyım?
 */

import { Suspense } from 'react';
import { AcademicAnalysisLanding } from '@/lib/sinavlar/command-center/AcademicAnalysisLanding';

export const metadata = {
  title: 'Akademik Analiz | AkademiHub',
  description: 'Kurumsal akademik performans ve karar merkezi'
};

export default function AkademikAnalizPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AcademicAnalysisLanding />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-pulse text-5xl mb-4">📊</div>
        <p className="text-slate-500 dark:text-slate-400">
          Akademik veriler hazırlanıyor...
        </p>
      </div>
    </div>
  );
}

