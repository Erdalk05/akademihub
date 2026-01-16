'use client';

// ============================================================================
// SPECTRA - SINAV SONUÇLARI SAYFASI
// Route: /admin/spectra/sinavlar/[examId]/results
// PDF benzeri header + tam ekran sonuç tablosu
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Download,
  RefreshCw,
  Calendar,
  Building2,
  Users,
  Printer,
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { ResultsTable } from '../_components/ResultsTable';
import { ParticipantDetailDrawer } from '../_components/ParticipantDetailDrawer';
import type { ExamSummary, ResultsRow } from '@/lib/spectra/types';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectraExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const { _hasHydrated } = useOrganizationStore();

  const [summary, setSummary] = useState<ExamSummary | null>(null);
  const [results, setResults] = useState<ResultsRow[]>([]);
  const [lessons, setLessons] = useState<{ code: string; name: string }[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ResultsRow | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    if (!examId) return;

    try {
      const response = await fetch(`/api/spectra/exams/${examId}/summary`);
      const data = await response.json();
      if (data.success) {
        setSummary(data);
      }
    } catch (error) {
      console.error('[Results] Summary fetch error:', error);
    }
  }, [examId]);

  const fetchResults = useCallback(async (page = 1) => {
    if (!examId) return;

    try {
      setIsLoadingResults(true);
      const response = await fetch(
        `/api/spectra/exams/${examId}/results?page=${page}&pageSize=50&sortBy=net&sortOrder=desc`
      );
      const data = await response.json();

      if (data.success) {
        setResults(data.rows || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        if (data.lessons) {
          setLessons(data.lessons);
        }
      }
    } catch (error) {
      console.error('[Results] Results fetch error:', error);
    } finally {
      setIsLoadingResults(false);
    }
  }, [examId]);

  useEffect(() => {
    const loadData = async () => {
      if (!examId || !_hasHydrated) return;
      setIsLoading(true);
      await Promise.all([fetchSummary(), fetchResults()]);
      setIsLoading(false);
    };
    loadData();
  }, [examId, _hasHydrated, fetchSummary, fetchResults]);

  const handleRefresh = () => {
    fetchSummary();
    fetchResults(pagination.page);
    toast.success('Veriler yenilendi');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-gray-500">Sonuçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sınav Bulunamadı</h2>
        <Link
          href="/admin/spectra/sinavlar"
          className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
        >
          Sınavlara Dön
        </Link>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100">
      {/* PDF-like Header */}
      <div className="bg-white border-b border-gray-300 print:border-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Top Actions (hide on print) */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Geri</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Printer className="w-4 h-4" />
                <span className="text-sm">Yazdır</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Excel İndir</span>
              </button>
            </div>
          </div>

          {/* Exam Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
              {summary.exam.name}
            </h1>
            <div className="flex items-center justify-center gap-4 mt-2 text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(summary.exam.exam_date).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm font-medium">
                {summary.exam.exam_type}
              </span>
            </div>
          </div>

          {/* Organization & Participation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Kurum:</span>
              <span>{summary.organization.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 md:justify-end">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Genel Katılım:</span>
              <span className="text-emerald-600 font-bold">{summary.participantCount}</span>
            </div>
          </div>

          {/* Stats Bar */}
          {summary.statistics && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Ortalama Net" value={summary.statistics.averageNet?.toFixed(2) || '—'} />
              <StatBox label="En Yüksek" value={summary.statistics.maxNet?.toFixed(2) || '—'} />
              <StatBox label="En Düşük" value={summary.statistics.minNet?.toFixed(2) || '—'} />
              <StatBox label="Medyan" value={summary.statistics.medianNet?.toFixed(2) || '—'} />
            </div>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <ResultsTable
          rows={results}
          lessons={lessons}
          isLoading={isLoadingResults}
          pagination={pagination}
          onPageChange={(page) => fetchResults(page)}
          onRowClick={(row) => setSelectedParticipant(row)}
        />
      </div>

      {/* Participant Drawer */}
      <ParticipantDetailDrawer
        participant={selectedParticipant}
        isOpen={!!selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        lessons={lessons}
      />
    </div>
  );
}

// Helper
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
