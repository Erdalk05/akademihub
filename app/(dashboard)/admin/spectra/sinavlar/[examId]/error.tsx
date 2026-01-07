'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function SpectraExamDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">Bir Hata Oluştu</h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        Sınav detayları yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
        >
          Tekrar Dene
        </button>
        <Link
          href="/admin/spectra/sinavlar"
          className="px-5 py-2.5 bg-white border border-slate-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Sınavlara Dön
        </Link>
      </div>
    </div>
  );
}

