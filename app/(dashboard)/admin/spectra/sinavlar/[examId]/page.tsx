'use client';

// ============================================================================
// SPECTRA - SINAV DETAY SAYFASI (v3.0)
// Route: /admin/spectra/sinavlar/[examId]
// Sınav özeti + Sekmeli içerik (Katılımcılar, Optik, Sonuçlar, Ayarlar)
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Users,
  Upload,
  BarChart3,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { ExamHeaderSummary } from './_components/ExamHeaderSummary';
import { ResultsTable } from './_components/ResultsTable';
import { ParticipantDetailDrawer } from './_components/ParticipantDetailDrawer';
import { OpticalUploadPanel } from './_components/OpticalUploadPanel';
import { cn } from '@/lib/utils';
import type { ExamSummary, ResultsRow, LessonBreakdown } from '@/lib/spectra/types';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type TabId = 'participants' | 'optical' | 'results' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'participants', label: 'Katılımcılar', icon: <Users className="w-4 h-4" /> },
  { id: 'optical', label: 'Optik Yükle', icon: <Upload className="w-4 h-4" /> },
  { id: 'results', label: 'Sonuçlar', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'settings', label: 'Ayarlar', icon: <Settings className="w-4 h-4" /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectraExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const { currentOrganization, _hasHydrated } = useOrganizationStore();

  const [activeTab, setActiveTab] = useState<TabId>('results');
  const [summary, setSummary] = useState<ExamSummary | null>(null);
  const [results, setResults] = useState<ResultsRow[]>([]);
  const [lessons, setLessons] = useState<{ code: string; name: string }[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ResultsRow | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH SUMMARY
  // ─────────────────────────────────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    if (!examId) return;

    try {
      const response = await fetch(`/api/spectra/exams/${examId}/summary`);
      const data = await response.json();

      if (data.success) {
        setSummary(data);
      } else {
        console.error('[ExamDetail] Summary error:', data.message);
      }
    } catch (error) {
      console.error('[ExamDetail] Summary fetch error:', error);
    }
  }, [examId]);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH RESULTS
  // ─────────────────────────────────────────────────────────────────────────

  const fetchResults = useCallback(async (page = 1) => {
    if (!examId) return;

    try {
      setIsLoadingResults(true);
      const response = await fetch(
        `/api/spectra/exams/${examId}/results?page=${page}&pageSize=25`
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
      console.error('[ExamDetail] Results fetch error:', error);
    } finally {
      setIsLoadingResults(false);
    }
  }, [examId]);

  // ─────────────────────────────────────────────────────────────────────────
  // INITIAL LOAD
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadData = async () => {
      if (!examId || !_hasHydrated) return;

      setIsLoading(true);
      await Promise.all([fetchSummary(), fetchResults()]);
      setIsLoading(false);
    };

    loadData();
  }, [examId, _hasHydrated, fetchSummary, fetchResults]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleRefresh = () => {
    fetchSummary();
    fetchResults(pagination.page);
    toast.success('Veriler yenilendi');
  };

  const handleUploadSuccess = () => {
    fetchSummary();
    fetchResults(1);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-gray-500">Sınav yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - Not Found
  // ─────────────────────────────────────────────────────────────────────────

  if (!summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sınav Bulunamadı</h2>
        <p className="text-gray-500 mb-4 text-center">
          Bu sınav mevcut değil veya silinmiş olabilir.
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER - Success
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Geri</span>
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Yenile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header Summary */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <ExamHeaderSummary summary={summary} />
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Katılımcı Listesi</h3>
            <p className="text-gray-500">
              Toplam {summary.participantCount} katılımcı bulunmaktadır.
            </p>
            {/* Participants list can be expanded here */}
          </div>
        )}

        {/* Optical Upload Tab */}
        {activeTab === 'optical' && (
          <div className="max-w-xl">
            <OpticalUploadPanel
              examId={examId}
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <ResultsTable
            rows={results}
            lessons={lessons}
            isLoading={isLoadingResults}
            pagination={pagination}
            onPageChange={(page) => fetchResults(page)}
            onRowClick={(row) => setSelectedParticipant(row)}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Puanlama Ayarları</h3>
            <p className="text-gray-500">
              Puanlama kuralları ve ders ağırlıkları burada düzenlenebilir.
            </p>
            <Link
              href={`/spectra/exams/${examId}/step-4-scoring`}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Puanlama Ayarlarını Düzenle
            </Link>
          </div>
        )}
      </div>

      {/* Participant Detail Drawer */}
      <ParticipantDetailDrawer
        participant={selectedParticipant}
        isOpen={!!selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        lessons={lessons}
      />
    </div>
  );
}
