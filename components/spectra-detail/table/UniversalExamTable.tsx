// ============================================================================
// UNIVERSAL EXAM TABLE - Dinamik Sınav Tablosu
// Tüm formatları destekler: LGS, TYT, AYT-SAY, AYT-EA, AYT-SÖZ, YDT, CUSTOM
// ============================================================================

'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import type { 
  StudentRowDetailed, 
  ExamFormat, 
  ExamFormatConfig,
  StudentFilters 
} from '@/types/spectra-detail';
import { StudentRow } from './StudentRow';
import { cn } from '@/lib/utils';

interface UniversalExamTableProps {
  data: StudentRowDetailed[];
  formatConfig: ExamFormatConfig;
  filters?: StudentFilters;
  onFilterChange?: (filters: StudentFilters) => void;
  onExport?: () => void;
  cellFormat?: 'ozdebir' | 'k12net' | 'standart';
  showPuanTurleri?: boolean;
  highlightTop3?: boolean;
  className?: string;
}

export function UniversalExamTable({
  data,
  formatConfig,
  filters,
  onFilterChange,
  onExport,
  cellFormat = 'ozdebir',
  showPuanTurleri = true,
  highlightTop3 = true,
  className,
}: UniversalExamTableProps) {
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Akordiyon toggle
  const toggleStudent = (studentId: string) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Filtrelenmiş ve sıralanmış veri
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Arama filtresi
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        row.ogrenciAdi.toLowerCase().includes(term) ||
        row.ogrenciNo.toLowerCase().includes(term) ||
        row.sinif.toLowerCase().includes(term)
      );
    }

    // Diğer filtreler (eğer varsa)
    if (filters) {
      if (filters.classId) {
        filtered = filtered.filter(row => row.sinif === filters.classId);
      }
      if (filters.participantType !== 'all') {
        filtered = filtered.filter(row => row.participantType === filters.participantType);
      }
    }

    // Sıralama
    if (filters?.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'rank':
            comparison = a.sira - b.sira;
            break;
          case 'name':
            comparison = a.ogrenciAdi.localeCompare(b.ogrenciAdi, 'tr');
            break;
          case 'net':
            comparison = b.toplamNet - a.toplamNet;
            break;
          case 'class':
            comparison = a.sinif.localeCompare(b.sinif, 'tr');
            break;
        }
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filters]);

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER - Başlık ve Araçlar */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {formatConfig.displayName} - Sıralı Liste
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Toplam {filteredData.length} öğrenci
            </p>
          </div>

          {/* Araçlar */}
          <div className="flex items-center gap-3">
            {/* Arama */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Öğrenci ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Export Butonu */}
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
              >
                <Download className="w-4 h-4" />
                PDF İndir
              </button>
            )}
          </div>
        </div>

        {/* Filtre Özeti */}
        {(searchTerm || filters?.classId || filters?.participantType !== 'all') && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Aktif filtreler:</span>
            {searchTerm && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                Arama: "{searchTerm}"
              </span>
            )}
            {filters?.classId && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                Sınıf: {filters.classId}
              </span>
            )}
            {filters?.participantType !== 'all' && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                Tip: {filters.participantType === 'institution' ? 'Kurum' : 'Misafir'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TABLE HEADER - Kolon Başlıkları */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-2 py-2 bg-gray-100 border-b border-gray-300 sticky top-0 z-10">
        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase">
          <div className="w-8 flex-shrink-0 text-center">#</div>
          <div className="w-32 flex-shrink-0">Öğrenci</div>
          <div className="w-12 flex-shrink-0 text-center">Sınıf</div>
          <div className="w-14 flex-shrink-0 text-center border-l border-gray-300 pl-1">Sözel</div>
          <div className="w-14 flex-shrink-0 text-center">Sayısal</div>
          <div className="w-14 flex-shrink-0 text-center border-l border-gray-300 pl-1">TUR</div>
          <div className="w-14 flex-shrink-0 text-center">MAT</div>
          <div className="w-14 flex-shrink-0 text-center">FEN</div>
          <div className="w-14 flex-shrink-0 text-center">İNK</div>
          <div className="w-14 flex-shrink-0 text-center">DİN</div>
          <div className="w-14 flex-shrink-0 text-center">İNG</div>
          <div className="w-10 flex-shrink-0 text-center border-l border-gray-300 pl-1 text-emerald-600">D</div>
          <div className="w-10 flex-shrink-0 text-center text-red-600">Y</div>
          <div className="w-10 flex-shrink-0 text-center text-gray-500">B</div>
          <div className="w-12 flex-shrink-0 text-center border-l border-gray-300 pl-1">%</div>
          <div className="w-14 flex-shrink-0 text-center">Net</div>
          <div className="w-14 flex-shrink-0 text-center">Puan</div>
          <div className="w-6 flex-shrink-0"></div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TABLE BODY - Öğrenci Satırları */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="divide-y divide-gray-200">
        {filteredData.length > 0 ? (
          filteredData.map((row) => (
            <StudentRow
              key={row.ogrenciId}
              data={row}
              format={formatConfig.format}
              isExpanded={expandedStudents.has(row.ogrenciId)}
              onToggle={() => toggleStudent(row.ogrenciId)}
              showPuanTurleri={showPuanTurleri}
              cellFormat={cellFormat}
              highlightTop3={highlightTop3}
            />
          ))
        ) : (
          <div className="px-4 py-12 text-center">
            <div className="text-gray-400 mb-2">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600 font-medium">Öğrenci bulunamadı</p>
            <p className="text-sm text-gray-500 mt-1">
              Arama kriterlerinizi değiştirmeyi deneyin
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FOOTER - Sayfalama/İstatistik */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {filteredData.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Gösterilen: <span className="font-bold text-gray-900">{filteredData.length}</span> öğrenci
            </div>
            <div className="flex items-center gap-4">
              <div>
                Ortalama Net: <span className="font-bold text-gray-900">
                  {(filteredData.reduce((sum, row) => sum + row.toplamNet, 0) / filteredData.length).toFixed(2)}
                </span>
              </div>
              <div>
                En Yüksek: <span className="font-bold text-emerald-600">
                  {Math.max(...filteredData.map(row => row.toplamNet)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
