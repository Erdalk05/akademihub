'use client';

// ============================================================================
// EXAM TABLE - Ana Sınav Tablosu
// ============================================================================

import React from 'react';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { ExamListItem, ExamExpandedDetails } from '@/types/exam-list';
import { ExamRow } from './ExamRow';

interface ExamTableProps {
  exams: ExamListItem[];
  isLoading?: boolean;
  onLoadDetails?: (examId: string) => Promise<ExamExpandedDetails>;
}

/**
 * Skeleton loader for exam rows
 */
function ExamRowSkeleton() {
  return (
    <div className="border border-gray-200 rounded-xl bg-white p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-8 h-4 bg-gray-200 rounded" />
        <div className="w-6 h-6 bg-gray-200 rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="hidden sm:block w-20 h-8 bg-gray-100 rounded" />
        <div className="hidden md:block w-20 h-8 bg-gray-100 rounded" />
        <div className="hidden sm:block w-20 h-8 bg-gray-100 rounded" />
        <div className="hidden lg:block w-16 h-8 bg-gray-100 rounded" />
        <div className="hidden lg:block w-20 h-8 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz Sınav Yok</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Sınav ekleyerek öğrenci performansını takip etmeye başlayın. 
        İlk sınavınızı eklemek için aşağıdaki butonu kullanın.
      </p>
      <Link
        href="/admin/spectra/sihirbaz"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        İlk Sınavı Ekle
      </Link>
    </div>
  );
}

/**
 * Table header component
 */
function TableHeader() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-2 hidden lg:flex items-center gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
      <div className="w-8 text-center">#</div>
      <div className="w-6" /> {/* Expand icon placeholder */}
      <div className="flex-1">Sınav Adı</div>
      <div className="w-20 text-center hidden sm:block">Katılımcı</div>
      <div className="w-20 text-center hidden md:block">Asil/Misafir</div>
      <div className="w-20 text-center hidden sm:block">Ort. Net</div>
      <div className="w-16 text-center hidden lg:block">Max</div>
      <div className="w-20 text-center hidden lg:block">Risk</div>
      <div className="w-24 text-center hidden xl:block">Analiz</div>
    </div>
  );
}

export function ExamTable({ exams, isLoading = false, onLoadDetails }: ExamTableProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <TableHeader />
        {[...Array(5)].map((_, i) => (
          <ExamRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (exams.length === 0) {
    return <EmptyState />;
  }

  // Normal render
  return (
    <div className="space-y-2">
      <TableHeader />
      {exams.map((exam, index) => (
        <ExamRow
          key={exam.id}
          exam={exam}
          index={index}
          onLoadDetails={onLoadDetails}
        />
      ))}
    </div>
  );
}

export default ExamTable;
