'use client';

// ============================================================================
// RESULTS TABLE - Sınav Sonuçları Tablosu
// Sıralama, arama, pagination destekli tablo
// ============================================================================

import React, { useState } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Loader2,
  Download,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResultsRow, LessonBreakdown } from '@/lib/spectra/types';

interface ResultsTableProps {
  rows: ResultsRow[];
  lessons: { code: string; name: string }[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onRowClick?: (row: ResultsRow) => void;
  onSearch?: (query: string) => void;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
}

export function ResultsTable({
  rows,
  lessons,
  isLoading,
  pagination,
  onPageChange,
  onRowClick,
  onSearch,
  onSort,
}: ResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    onSort?.(field, newOrder);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İsim veya numara ara..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center gap-1">
                  # <SortIcon field="rank" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tip
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Öğrenci <SortIcon field="name" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sınıf
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('correct')}
              >
                <div className="flex items-center justify-center gap-1">
                  D <SortIcon field="correct" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Y
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                B
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('net')}
              >
                <div className="flex items-center justify-center gap-1">
                  Net <SortIcon field="net" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center justify-center gap-1">
                  Puan <SortIcon field="score" />
                </div>
              </th>
              {/* Lesson Columns */}
              {lessons.map((lesson) => (
                <th
                  key={lesson.code}
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  title={lesson.name}
                >
                  {lesson.code.substring(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={9 + lessons.length} className="px-4 py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Yükleniyor...</p>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9 + lessons.length} className="px-4 py-12 text-center text-gray-500">
                  Sonuç bulunamadı
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.participantId}
                  className={cn(
                    'hover:bg-gray-50 cursor-pointer transition-colors',
                    index < 3 && 'bg-emerald-50/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                        row.rank === 1
                          ? 'bg-yellow-100 text-yellow-700'
                          : row.rank === 2
                            ? 'bg-gray-200 text-gray-700'
                            : row.rank === 3
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {row.rank}
                    </span>
                  </td>

                  {/* Participant Type */}
                  <td className="px-4 py-3">
                    {row.participantType === 'institution' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        <User className="w-3 h-3" />
                        Asil
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        <Users className="w-3 h-3" />
                        Misafir
                      </span>
                    )}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{row.participantName}</span>
                  </td>

                  {/* Class */}
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {row.className || '—'}
                  </td>

                  {/* Correct */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-emerald-600 font-medium">{row.totalCorrect}</span>
                  </td>

                  {/* Wrong */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-red-500 font-medium">{row.totalWrong}</span>
                  </td>

                  {/* Empty */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-400">{row.totalEmpty}</span>
                  </td>

                  {/* Net */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-emerald-700 font-bold text-lg">
                      {row.totalNet.toFixed(2)}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-blue-600 font-semibold">
                      {row.totalScore.toFixed(1)}
                    </span>
                  </td>

                  {/* Lesson Nets */}
                  {lessons.map((lesson) => {
                    const lessonResult = row.lessonBreakdown?.find(
                      (lb) => lb.lesson_code === lesson.code
                    );
                    return (
                      <td key={lesson.code} className="px-3 py-3 text-center text-sm">
                        {lessonResult ? (
                          <span className="text-gray-700">{lessonResult.net.toFixed(1)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Toplam {pagination.total} sonuçtan {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} gösteriliyor
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className={cn(
                'p-2 rounded-lg transition-colors',
                pagination.page > 1
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className={cn(
                'p-2 rounded-lg transition-colors',
                pagination.page < pagination.totalPages
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
