'use client';

import { SkeletonCard } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Başlık */}
      <div className="h-8 bg-gray-200 rounded-lg w-32 animate-pulse" />

      {/* Tab Navigasyon */}
      <div className="flex space-x-2 border-b pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-lg w-28 animate-pulse" />
        ))}
      </div>

      {/* Ayar Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
