'use client';

import { SkeletonTable } from '@/components/ui/Skeleton';

export default function StudentsLoading() {
  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Başlık ve Filtre Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded-lg w-32 animate-pulse" />
        <div className="flex space-x-3">
          <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
        </div>
      </div>

      {/* Filtre Bar Skeleton */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex space-x-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg w-36 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Tablo Skeleton */}
      <SkeletonTable />
    </div>
  );
}
