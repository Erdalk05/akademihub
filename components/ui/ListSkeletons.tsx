'use client';

import { memo } from 'react';

/**
 * Liste itemleri için özel skeleton componentleri
 * Layout shift önlemek için gerçek component boyutlarına yakın tasarlandı
 */

// Öğrenci listesi satırı için skeleton
export const StudentRowSkeleton = memo(function StudentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 animate-pulse">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gray-200" />
      
      {/* İsim ve numara */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-100 rounded w-24" />
      </div>
      
      {/* Sınıf */}
      <div className="w-12 h-6 bg-gray-200 rounded" />
      
      {/* Borç */}
      <div className="w-20 h-5 bg-gray-200 rounded" />
      
      {/* Risk badge */}
      <div className="w-16 h-6 bg-gray-200 rounded-full" />
      
      {/* İşlemler */}
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-100 rounded" />
        <div className="w-8 h-8 bg-gray-100 rounded" />
        <div className="w-8 h-8 bg-gray-100 rounded" />
      </div>
    </div>
  );
});

// Sözleşme satırı için skeleton
export const ContractRowSkeleton = memo(function ContractRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 animate-pulse">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gray-200" />
      
      {/* İsim */}
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-40" />
        <div className="h-3 bg-gray-100 rounded w-28 mt-1" />
      </div>
      
      {/* Sınıf */}
      <div className="w-12 h-6 bg-gray-200 rounded" />
      
      {/* Toplam */}
      <div className="w-20 h-5 bg-gray-200 rounded" />
      
      {/* Ödenen */}
      <div className="w-16 h-5 bg-gray-100 rounded" />
      
      {/* Kalan */}
      <div className="w-20 h-5 bg-gray-200 rounded" />
      
      {/* Durum */}
      <div className="w-20 h-6 bg-gray-200 rounded-full" />
    </div>
  );
});

// Kart için skeleton (Dashboard, Founder raporu vb.)
export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="w-8 h-8 bg-gray-100 rounded-full" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-20" />
    </div>
  );
});

// Risk öğrencisi kartı için skeleton
export const RiskStudentSkeleton = memo(function RiskStudentSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-28 mb-1" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
      <div className="text-right">
        <div className="h-4 bg-gray-200 rounded w-16 mb-1" />
        <div className="h-3 bg-red-100 rounded w-12" />
      </div>
    </div>
  );
});

// Tablo satırı için genel skeleton
export const TableRowSkeleton = memo(function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-gray-200 rounded w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
});

// Sınıf istatistik kartı için skeleton (Founder)
export const ClassStatSkeleton = memo(function ClassStatSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 bg-gray-200 rounded w-16" />
        <div className="h-5 bg-gray-100 rounded w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-12" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-12" />
        </div>
      </div>
    </div>
  );
});

// Aylık grafik placeholder
export const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 rounded-t"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'].map((m, i) => (
          <div key={i} className="text-xs text-gray-300">{m}</div>
        ))}
      </div>
    </div>
  );
});
