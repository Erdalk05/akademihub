'use client';

import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';

export default function FinanceLoading() {
  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Başlık Skeleton */}
      <div className="h-8 bg-gray-200 rounded-lg w-40 animate-pulse" />

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Tab ve Tablo */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b p-4">
          <div className="flex space-x-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-lg w-28 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="p-6">
          <SkeletonTable />
        </div>
      </div>
    </div>
  );
}
