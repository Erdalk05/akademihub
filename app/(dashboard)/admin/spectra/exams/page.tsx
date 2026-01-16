'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * REDIRECT: /admin/spectra/exams → /admin/spectra/sinavlar
 * Legacy route compatibility
 */
export default function AdminSpectraExamsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/spectra/sinavlar');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-gray-500">Yönlendiriliyor...</p>
      </div>
    </div>
  );
}
