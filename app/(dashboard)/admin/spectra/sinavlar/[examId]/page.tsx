'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useSpectraDetail } from '@/hooks/spectra-detail';
import { useStudentFilters } from '@/hooks/spectra-detail/useStudentFilters';
import {
  SpectraHeader,
  SummaryCards,
  MatchWarningBanner,
  DistributionCharts,
  StudentRankingTable,
  ClassComparison,
} from '@/components/spectra-detail';

// ============================================================================
// SPECTRA - SINAV DETAY SAYFASI
// Ana sayfa - tüm component'leri birleştirir
// ============================================================================

export default function SpectraExamDetailPage() {
  const params = useParams();
  const examId = params.examId as string;
  const { currentOrganization } = useOrganizationStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ana veri hook'u
  const { data, isLoading, error, refetch } = useSpectraDetail({
    examId,
    organizationId: currentOrganization?.id,
  });

  // Filtreleme hook'u
  const filterHook = useStudentFilters({
    rows: data?.tableRows || [],
  });

  // Sınıf seçeneklerini oluştur
  const classOptions = useMemo(() => {
    if (!data?.statistics.classAverages) return [];
    return data.statistics.classAverages.map((c) => ({
      value: c.className,
      label: c.className,
    }));
  }, [data?.statistics.classAverages]);

  // Sınıf ortalamalarını Map'e çevir
  const classAveragesMap = useMemo(() => {
    const map = new Map<string, number>();
    data?.statistics.classAverages.forEach((c) => {
      map.set(c.className, c.averageNet);
    });
    return map;
  }, [data?.statistics.classAverages]);

  // Ders ortalamalarını Map'e çevir
  const sectionAveragesMap = useMemo(() => {
    const map = new Map<string, number>();
    data?.statistics.sectionAverages.forEach((s) => {
      map.set(s.sectionId, s.averageNet);
    });
    return map;
  }, [data?.statistics.sectionAverages]);

  // Toplam D/Y/B hesapla
  const totals = useMemo(() => {
    if (!data?.tableRows || data.tableRows.length === 0) {
      return { correct: 0, wrong: 0, blank: 0 };
    }
    return data.tableRows.reduce(
      (acc, row) => ({
        correct: acc.correct + row.totalCorrect,
        wrong: acc.wrong + row.totalWrong,
        blank: acc.blank + row.totalBlank,
      }),
      { correct: 0, wrong: 0, blank: 0 }
    );
  }, [data?.tableRows]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sınav Bulunamadı</h2>
        <p className="text-gray-500 mb-4 text-center">
          {error?.message || 'Bu sınav mevcut değil veya silinmiş olabilir.'}
        </p>
        <Link
          href="/admin/spectra/sinavlar"
          className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
        >
          Sınavlara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SpectraHeader
        exam={data.exam}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExportExcel={() => {
          // TODO: Excel export
          alert('Excel export - yakında!');
        }}
        onExportPDF={() => {
          // TODO: PDF export
          alert('PDF export - yakında!');
        }}
      />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Eşleşme Uyarısı */}
        <MatchWarningBanner
          pendingCount={data.statistics.pendingMatchCount}
          onOpenModal={() => {
            // TODO: Eşleştirme modalı
            alert('Eşleştirme modalı - yakında!');
          }}
        />

        {/* Özet Kartları */}
        <SummaryCards statistics={data.statistics} />

        {/* Dağılım Grafikleri */}
        <DistributionCharts
          netDistribution={data.statistics.netDistribution}
          totalCorrect={totals.correct}
          totalWrong={totals.wrong}
          totalBlank={totals.blank}
          averageNet={data.statistics.averageNet}
        />

        {/* Öğrenci Sıralama Tablosu */}
        <StudentRankingTable
          rows={filterHook.paginatedRows}
          sections={data.sections}
          classOptions={classOptions}
          search={filterHook.filters.search}
          onSearchChange={filterHook.setSearch}
          classId={filterHook.filters.classId}
          onClassChange={filterHook.setClassId}
          participantType={filterHook.filters.participantType}
          onParticipantTypeChange={filterHook.setParticipantType}
          sortBy={filterHook.filters.sortBy}
          onSortByChange={filterHook.setSortBy}
          sortOrder={filterHook.filters.sortOrder}
          onSortOrderChange={filterHook.setSortOrder}
          currentPage={filterHook.currentPage}
          pageSize={filterHook.pageSize}
          totalPages={filterHook.totalPages}
          totalCount={filterHook.filteredRows.length}
          onPageChange={filterHook.setCurrentPage}
          onPageSizeChange={filterHook.setPageSize}
          classAverages={classAveragesMap}
          sectionAverages={sectionAveragesMap}
        />

        {/* Sınıf Karşılaştırma */}
        <ClassComparison
          classAverages={data.statistics.classAverages}
          organizationAverage={data.statistics.averageNet}
        />
      </div>
    </div>
  );
}

