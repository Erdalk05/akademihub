// Mevcut splash page'i dashboard'a redirect yapacak şekilde güncelleyin:

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AkademikAnalizPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Direkt dashboard'a yönlendir
    router.replace('/admin/akademik-analiz/exam-dashboard');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-slate-600">Yönlendiriliyor...</p>
      </div>
    </div>
  );
}