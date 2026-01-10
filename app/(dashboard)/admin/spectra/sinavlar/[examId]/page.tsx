'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useSpectraDetail, useOrganizationTrend } from '@/hooks/spectra-detail';
import { useStudentFilters } from '@/hooks/spectra-detail/useStudentFilters';
import {
  SpectraHeader,
  SummaryCards,
  MatchWarningBanner,
  DistributionCharts,
  StudentRankingTable,
  ClassComparison,
  SubjectPerformanceTable,
  TopPerformersCards,
  OrganizationTrendChart,
  AdvancedToolbar,
} from '@/components/spectra-detail';
import { UniversalExamTable } from '@/components/spectra-detail/table';
import { useColumns, useBulkActions } from '@/hooks/spectra-detail';
import type { AdvancedFilters } from '@/types/spectra-detail';
import { exportToExcel, exportToPDF } from '@/lib/spectra-detail';
import { detectExamFormat, sortSectionsByFormat } from '@/lib/spectra-detail/format-detector';
import { transformToUniversalTableData } from '@/lib/spectra-detail/data-transformer';
import { quickExportPDF } from '@/lib/spectra-detail/export-pdf-sirali-liste';
import toast from 'react-hot-toast';

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

  // Kurum trend hook'u
  const {
    trends,
    isLoading: trendLoading,
    trendDirection,
    trendPercentage,
  } = useOrganizationTrend({
    organizationId: currentOrganization?.id,
    examId,
    limit: 5,
  });

  // Filtreleme hook'u
  const filterHook = useStudentFilters({
    rows: data?.tableRows || [],
  });

  // Kolon ayarları hook'u
  const columnsHook = useColumns(data?.sections || []);

  // Toplu işlemler hook'u
  const bulkHook = useBulkActions(data?.tableRows || []);

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

  // ═══════════════════════════════════════════════════════════════════════
  // UNIVERSAL TABLE - Format algılama ve veri dönüştürme
  // ═══════════════════════════════════════════════════════════════════════
  const formatConfig = useMemo(() => {
    // #region agent log
    console.log('🔍 [HYP-D] Computing formatConfig:', {
      hasSections: !!data?.sections,
      sectionsLength: data?.sections?.length || 0,
      firstSection: data?.sections?.[0]
    });
    // #endregion
    if (!data?.sections) return null;
    const firstStudent = data.tableRows[0];
    const sinif = firstStudent?.className.match(/\d+/)?.[0];
    const detected = detectExamFormat(data.sections, sinif, data.exam.exam_type);
    // #region agent log
    console.log('🔍 [HYP-D] formatConfig computed:', {
      format: detected?.format,
      displayName: detected?.displayName,
      sectionsProvided: data.sections.length
    });
    // #endregion
    return detected;
  }, [data?.sections, data?.tableRows, data?.exam.exam_type]);

  const sortedSections = useMemo(() => {
    if (!data?.sections || !formatConfig) return [];
    return sortSectionsByFormat(data.sections, formatConfig.format);
  }, [data?.sections, formatConfig]);

  const universalTableData = useMemo(() => {
    // #region agent log
    console.log('🔍 [HYP-B,D] universalTableData BEFORE transform:', {
      hasTableRows: !!data?.tableRows,
      tableRowsCount: data?.tableRows?.length || 0,
      hasFormatConfig: !!formatConfig,
      sortedSectionsCount: sortedSections.length
    });
    // #endregion
    if (!data?.tableRows || !formatConfig) return [];
    const transformed = transformToUniversalTableData(
      filterHook.filteredRows,
      sortedSections,
      formatConfig.format
    );
    console.log('🔍 UniversalTable Debug:', {
      formatDetected: formatConfig.format,
      totalRows: data.tableRows.length,
      filteredRows: filterHook.filteredRows.length,
      transformedRows: transformed.length,
      sections: sortedSections.length
    });
    // #region agent log
    console.log('🔍 [HYP-B,D] universalTableData AFTER transform:', {
      transformedCount: transformed.length,
      firstRow: transformed[0]
    });
    // #endregion
    return transformed;
  }, [filterHook.filteredRows, sortedSections, formatConfig]);

  // PDF Export handler - Genel Sıralı Liste
  const handleExportSiraliListe = useCallback(() => {
    if (!data || !formatConfig) {
      toast.error('Veri yüklenemedi');
      return;
    }
    try {
      quickExportPDF(
        universalTableData,
        data.exam.name,
        currentOrganization?.name || 'AkademiHub',
        'detailed'
      );
      toast.success('PDF başarıyla oluşturuldu');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF oluşturulurken hata oluştu');
    }
  }, [universalTableData, data, formatConfig, currentOrganization?.name]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Excel export handler
  const handleExportExcel = useCallback(async () => {
    if (!data) return;
    try {
      await exportToExcel({
        exam: data.exam,
        sections: data.sections,
        rows: data.tableRows,
        statistics: data.statistics,
        organizationName: currentOrganization?.name || 'AkademiHub',
      });
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Excel export sırasında bir hata oluştu.');
    }
  }, [data, currentOrganization?.name]);

  // PDF export handler
  const handleExportPDF = useCallback(async () => {
    if (!data) return;
    try {
      await exportToPDF({
        exam: data.exam,
        sections: data.sections,
        rows: data.tableRows,
        statistics: data.statistics,
        organizationName: currentOrganization?.name || 'AkademiHub',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF export sırasında bir hata oluştu.');
    }
  }, [data, currentOrganization?.name]);

  // Share handler (WhatsApp)
  const handleShare = useCallback(() => {
    if (!data) return;
    const text = `📊 ${data.exam.name} Sonuçları\n\n` +
      `👥 Katılımcı: ${data.statistics.totalParticipants}\n` +
      `📈 Ortalama Net: ${data.statistics.averageNet.toFixed(1)}\n` +
      `🏆 En Yüksek: ${data.statistics.maxNet.toFixed(1)}\n` +
      `📉 En Düşük: ${data.statistics.minNet.toFixed(1)}\n\n` +
      `🔗 ${window.location.href}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }, [data]);

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

  // Toplam soru sayısı
  const totalQuestions = data.sections.reduce((sum, s) => sum + s.question_count, 0) || 90;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <SpectraHeader
        exam={data.exam}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onShare={handleShare}
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

        {/* 1. Özet Kartları (8 kart) */}
        <SummaryCards statistics={data.statistics} totalQuestions={totalQuestions} />

        {/* 2. Ders Bazlı Performans Tablosu */}
        <SubjectPerformanceTable
          sectionAverages={data.statistics.sectionAverages}
          sections={data.sections}
        />

        {/* 3. Dağılım Grafikleri + Kurum Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DistributionCharts
            netDistribution={data.statistics.netDistribution}
            totalCorrect={totals.correct}
            totalWrong={totals.wrong}
            totalBlank={totals.blank}
            averageNet={data.statistics.averageNet}
          />
          <OrganizationTrendChart
            trends={trends}
            isLoading={trendLoading}
            trendDirection={trendDirection}
            trendPercentage={trendPercentage}
          />
        </div>

        {/* 4. Sınıf Karşılaştırma (ders bazlı ortalamalar ile) */}
        <ClassComparison
          classAverages={data.statistics.classAverages}
          organizationAverage={data.statistics.averageNet}
          sections={data.sections}
        />

        {/* 5. En İyi/Kötü Performans Kartları */}
        <TopPerformersCards
          topStudents={data.statistics.topStudents}
          bottomStudents={data.statistics.bottomStudents}
        />

        {/* 6. Gelişmiş Filtre & Araçlar Toolbar */}
        <AdvancedToolbar
          sections={data.sections}
          siniflar={classOptions.map(c => c.value)}
          toplamOgrenci={data.tableRows.length}
          filtrelenmisOgrenci={filterHook.filteredRows.length}
          filters={{
            search: filterHook.filters.search,
            classId: filterHook.filters.classId,
            participantType: filterHook.filters.participantType,
            sortBy: filterHook.filters.sortBy,
            sortOrder: filterHook.filters.sortOrder,
            siniflar: filterHook.filters.classId ? [filterHook.filters.classId] : [],
            kitapcik: [],
            netMin: 0,
            netMax: 120,
            puanMin: 0,
            puanMax: 500,
            siraMin: 1,
            siraMax: 100,
            yuzdelikDilim: 'all',
            ekFiltreler: {
              sadeceBosOlan: false,
              sadeceTamYapan: false,
              ortalamaAlti: false,
              ortalamaUstu: false,
              eksikVeriOlan: false,
            },
            pageSize: filterHook.pageSize,
            currentPage: filterHook.currentPage,
          }}
          onFilterChange={(newFilters) => {
            if (newFilters.search !== undefined) filterHook.setSearch(newFilters.search);
            if (newFilters.participantType !== undefined) filterHook.setParticipantType(newFilters.participantType);
            if (newFilters.sortBy !== undefined) filterHook.setSortBy(newFilters.sortBy);
            if (newFilters.sortOrder !== undefined) filterHook.setSortOrder(newFilters.sortOrder);
            if (newFilters.siniflar !== undefined) filterHook.setClassId(newFilters.siniflar[0] || null);
            if (newFilters.pageSize !== undefined) filterHook.setPageSize(newFilters.pageSize);
            if (newFilters.currentPage !== undefined) filterHook.setCurrentPage(newFilters.currentPage);
          }}
          onResetFilters={() => {
            filterHook.setSearch('');
            filterHook.setClassId(null);
            filterHook.setParticipantType('all');
            filterHook.setSortBy('rank');
            filterHook.setSortOrder('asc');
          }}
          columns={columnsHook.columns}
          onColumnChange={columnsHook.setColumn}
          onResetColumns={columnsHook.resetColumns}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPDF}
          onPrint={() => window.print()}
          isExporting={false}
          selectedCount={bulkHook.selectedIds.length}
          onSelectAll={bulkHook.selectAll}
          onClearSelection={bulkHook.clearSelection}
          onBulkAction={bulkHook.executeAction}
          isProcessing={bulkHook.isProcessing}
        />

        {/* 7. Universal Exam Table - Yeni Özdebir/K12Net Formatı (Akordiyon + PDF) */}
        {formatConfig && universalTableData.length > 0 ? (
          <UniversalExamTable
            data={universalTableData}
            formatConfig={formatConfig}
            filters={filterHook.filters}
            onFilterChange={(filters) => {
              if (filters.search !== undefined) filterHook.setSearch(filters.search);
              if (filters.classId !== undefined) filterHook.setClassId(filters.classId);
              if (filters.participantType !== undefined) filterHook.setParticipantType(filters.participantType);
              if (filters.sortBy !== undefined) filterHook.setSortBy(filters.sortBy);
              if (filters.sortOrder !== undefined) filterHook.setSortOrder(filters.sortOrder);
            }}
            onExport={handleExportSiraliListe}
            cellFormat="ozdebir"
            showPuanTurleri={true}
            highlightTop3={true}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-gray-600">Sınav tablosu hazırlanıyor...</p>
            <p className="text-sm text-gray-400 mt-2">
              {!formatConfig && 'Format algılanıyor...'}
              {formatConfig && universalTableData.length === 0 && 'Öğrenci verileri yükleniyor...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

