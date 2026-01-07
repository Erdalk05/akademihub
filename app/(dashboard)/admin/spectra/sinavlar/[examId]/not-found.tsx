import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

// ============================================================================
// SPECTRA DETAIL - NOT FOUND
// 404 sayfası
// ============================================================================

export default function SpectraExamNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-gray-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sınav Bulunamadı</h2>

        {/* Description */}
        <p className="text-gray-500 mb-6">
          Aradığınız sınav bulunamadı. Silinmiş veya hiç var olmamış olabilir.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/spectra/sinavlar"
            className="w-full px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
          >
            Sınavlara Dön
          </Link>
          <Link
            href="/admin/spectra"
            className="w-full px-5 py-2.5 bg-white border border-slate-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Spectra Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

