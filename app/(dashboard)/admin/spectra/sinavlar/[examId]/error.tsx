'use client';

import { AlertTriangle, RefreshCw, ArrowLeft, Bug } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

// ============================================================================
// SPECTRA DETAIL - ERROR STATE
// Error boundary
// ============================================================================

export default function SpectraExamDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error to console in development
  useEffect(() => {
    console.error('Spectra Detail Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bir Hata Oluştu</h2>

        {/* Description */}
        <p className="text-gray-500 mb-6">
          Sınav detayları yüklenirken bir sorun oluştu. Bu geçici bir hata olabilir.
        </p>

        {/* Error Details (Dev Mode) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Bug className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-red-600 uppercase">
                Hata Detayı
              </span>
            </div>
            <p className="text-sm text-red-700 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-500 mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tekrar Dene
          </button>
          <Link
            href="/admin/spectra/sinavlar"
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Sınavlara Dön
          </Link>
        </div>
      </div>

      {/* Help Text */}
      <p className="text-sm text-gray-400 mt-6">
        Sorun devam ederse, lütfen yöneticinizle iletişime geçin.
      </p>
    </div>
  );
}

