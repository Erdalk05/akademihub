import { Loader2 } from 'lucide-react';

// ============================================================================
// SPECTRA DETAIL - LOADING STATE
// Skeleton loader
// ============================================================================

export default function SpectraExamDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-32 h-4 bg-gray-100 rounded animate-pulse mt-2" />
            </div>
            <div className="flex gap-2">
              <div className="w-20 h-9 bg-gray-100 rounded-lg animate-pulse" />
              <div className="w-20 h-9 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-4 animate-pulse"
            >
              <div className="w-20 h-3 bg-white/30 rounded mb-3" />
              <div className="w-16 h-8 bg-white/30 rounded mb-2" />
              <div className="w-24 h-3 bg-white/20 rounded" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex gap-4">
            <div className="flex-1 h-10 bg-gray-100 rounded-lg animate-pulse" />
            <div className="w-32 h-10 bg-gray-100 rounded-lg animate-pulse" />
            <div className="w-24 h-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Center Loading Indicator */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl p-6 flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-gray-700 font-medium">Yükleniyor...</span>
        </div>
      </div>
    </div>
  );
}

