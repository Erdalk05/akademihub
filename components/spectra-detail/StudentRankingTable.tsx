'use client';

import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
} from 'lucide-react';
import type { StudentTableRow, ExamSection } from '@/types/spectra-detail';
import { RANK_MEDALS, PAGE_SIZES, SECTION_TEXT_COLORS } from '@/lib/spectra-detail/constants';
import { StudentAccordion } from './StudentAccordion';

// ============================================================================
// STUDENT RANKING TABLE COMPONENT
// Öğrenci sıralama tablosu - filtreleme, sıralama, akordiyon
// ============================================================================

interface StudentRankingTableProps {
  rows: StudentTableRow[];
  sections: ExamSection[];
  classOptions: { value: string; label: string }[];
  // Filter props
  search: string;
  onSearchChange: (value: string) => void;
  classId: string | null;
  onClassChange: (value: string | null) => void;
  participantType: 'all' | 'institution' | 'guest';
  onParticipantTypeChange: (value: 'all' | 'institution' | 'guest') => void;
  sortBy: 'rank' | 'name' | 'net' | 'class';
  onSortByChange: (value: 'rank' | 'name' | 'net' | 'class') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  // Pagination props
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  // Statistics for accordion
  classAverages: Map<string, number>;
  sectionAverages: Map<string, number>;
}

export function StudentRankingTable({
  rows,
  sections,
  classOptions,
  search,
  onSearchChange,
  classId,
  onClassChange,
  participantType,
  onParticipantTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  currentPage,
  pageSize,
  totalPages,
  totalCount,
  onPageChange,
  onPageSizeChange,
  classAverages,
  sectionAverages,
}: StudentRankingTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleSort = (column: 'rank' | 'name' | 'net' | 'class') => {
    if (sortBy === column) {
      onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortByChange(column);
      onSortOrderChange('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Filtre Barı */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Öğrenci ara..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={classId || 'all'}
          onChange={(e) => onClassChange(e.target.value === 'all' ? null : e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="all">Tüm Sınıflar</option>
          {classOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={participantType}
          onChange={(e) => onParticipantTypeChange(e.target.value as any)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="all">Tümü</option>
          <option value="institution">Asil</option>
          <option value="guest">Misafir</option>
        </select>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {/* Sticky kolonlar - sol tarafta sabit kalır */}
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 sticky left-0 bg-gray-50 z-10 w-16"
                onClick={() => toggleSort('rank')}
              >
                <div className="flex items-center gap-1">
                  Sıra <SortIcon column="rank" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase sticky left-16 bg-gray-50 z-10 w-20">
                No
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 sticky left-36 bg-gray-50 z-10 min-w-[180px]"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Öğrenci <SortIcon column="name" />
                </div>
              </th>
              {/* Normal kolonlar */}
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('class')}
              >
                <div className="flex items-center gap-1">
                  Sınıf <SortIcon column="class" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                Tip
              </th>
              {/* Ders kolonları */}
              {sections.map((section) => (
                <th
                  key={section.id}
                  className={`px-3 py-3 text-center text-xs font-semibold uppercase ${
                    SECTION_TEXT_COLORS[section.code] || SECTION_TEXT_COLORS.DEFAULT
                  }`}
                >
                  {section.code}
                </th>
              ))}
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('net')}
              >
                <div className="flex items-center justify-end gap-1">
                  Net <SortIcon column="net" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <React.Fragment key={row.participantId}>
                <tr
                  className={`hover:bg-emerald-50 cursor-pointer transition-colors ${
                    expandedId === row.participantId ? 'bg-emerald-50' : ''
                  }`}
                  onClick={() => toggleExpand(row.participantId)}
                >
                  {/* Sticky kolonlar - sol tarafta sabit kalır */}
                  <td className={`px-4 py-3 sticky left-0 z-10 w-16 ${expandedId === row.participantId ? 'bg-emerald-50' : 'bg-white'}`}>
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        row.rank === 1
                          ? 'bg-amber-100 text-amber-700'
                          : row.rank === 2
                          ? 'bg-slate-200 text-slate-700'
                          : row.rank === 3
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {RANK_MEDALS[row.rank] || row.rank}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm text-gray-600 sticky left-16 z-10 w-20 ${expandedId === row.participantId ? 'bg-emerald-50' : 'bg-white'}`}>
                    {row.studentNo}
                  </td>
                  <td className={`px-4 py-3 sticky left-36 z-10 min-w-[180px] ${expandedId === row.participantId ? 'bg-emerald-50' : 'bg-white'}`}>
                    <span className="font-medium text-gray-900">{row.name}</span>
                  </td>
                  {/* Normal kolonlar */}
                  <td className="px-4 py-3 text-sm text-gray-600">{row.className}</td>
                  <td className="px-4 py-3 text-center">
                    {row.participantType === 'institution' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                        <UserCheck className="w-3 h-3" />
                        Asil
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                        <UserX className="w-3 h-3" />
                        Misafir
                      </span>
                    )}
                  </td>
                  {/* Ders netleri */}
                  {sections.map((section) => {
                    const sectionData = row.sections.find((s) => s.sectionId === section.id);
                    return (
                      <td
                        key={section.id}
                        className="px-3 py-3 text-center text-sm font-medium text-gray-700"
                      >
                        {sectionData?.net.toFixed(1) ?? '-'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {row.totalNet.toFixed(1)}
                  </td>
                </tr>
                {/* Akordiyon Detay */}
                {expandedId === row.participantId && (
                  <tr>
                    <td colSpan={6 + sections.length} className="p-0">
                      <StudentAccordion
                        student={row}
                        classAverage={classAverages.get(row.className) || 0}
                        sectionAverages={sectionAverages}
                        onClose={() => setExpandedId(null)}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Boş durum */}
      {rows.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-gray-500">Arama kriterlerine uygun öğrenci bulunamadı.</p>
        </div>
      )}

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Toplam: {totalCount}</span>
            <span className="mx-2">|</span>
            <span>Sayfa:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-slate-200 rounded text-sm"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 border border-slate-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentRankingTable;

