'use client';

import { useState, useMemo, useCallback } from 'react';
import type { StudentTableRow, StudentFilters } from '@/types/spectra-detail';
import { filterTableRows, sortTableRows } from '@/lib/spectra-detail/calculations';

// ============================================================================
// STUDENT FILTERS HOOK
// Öğrenci tablosu filtreleme ve sıralama
// ============================================================================

interface UseStudentFiltersOptions {
  rows: StudentTableRow[];
  initialFilters?: Partial<StudentFilters>;
}

interface UseStudentFiltersResult {
  filters: StudentFilters;
  filteredRows: StudentTableRow[];
  setSearch: (search: string) => void;
  setClassId: (classId: string | null) => void;
  setParticipantType: (type: 'all' | 'institution' | 'guest') => void;
  setSortBy: (sortBy: 'rank' | 'name' | 'net' | 'class') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  paginatedRows: StudentTableRow[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

const DEFAULT_FILTERS: StudentFilters = {
  search: '',
  classId: null,
  participantType: 'all',
  sortBy: 'rank',
  sortOrder: 'asc',
};

export function useStudentFilters({
  rows,
  initialFilters = {},
}: UseStudentFiltersOptions): UseStudentFiltersResult {
  // Filters state
  const [filters, setFilters] = useState<StudentFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter handlers
  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const setClassId = useCallback((classId: string | null) => {
    setFilters((prev) => ({ ...prev, classId }));
    setCurrentPage(1);
  }, []);

  const setParticipantType = useCallback(
    (participantType: 'all' | 'institution' | 'guest') => {
      setFilters((prev) => ({ ...prev, participantType }));
      setCurrentPage(1);
    },
    []
  );

  const setSortBy = useCallback((sortBy: 'rank' | 'name' | 'net' | 'class') => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
    setFilters((prev) => ({ ...prev, sortOrder }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  // Filtered and sorted rows
  const filteredRows = useMemo(() => {
    const filtered = filterTableRows(rows, {
      search: filters.search,
      classId: filters.classId,
      participantType: filters.participantType,
    });
    return sortTableRows(filtered, filters.sortBy, filters.sortOrder);
  }, [rows, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, currentPage, pageSize]);

  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    filters,
    filteredRows,
    setSearch,
    setClassId,
    setParticipantType,
    setSortBy,
    setSortOrder,
    resetFilters,
    currentPage,
    pageSize,
    totalPages,
    paginatedRows,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
  };
}

