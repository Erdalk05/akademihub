'use client';

import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Başlık Skeleton */}
      <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse" />
      
      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Grafik ve Tablo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonTable />
      </div>
    </div>
  );
}
