'use client';

/**
 * Akademik Analiz - Sonuçlar
 * Sınav sonuçlarını görüntüleme - Supabase entegreli
 */

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ResultsExplorer } from '@/lib/sinavlar/ui';
import { StudentResult, Conflict } from '@/lib/sinavlar/core/types';
import { useOrganizationStore } from '@/lib/store/organizationStore';

function SonuclarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');
  const { selectedOrganization } = useOrganizationStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [examName, setExamName] = useState('Sınav Sonuçları');

  useEffect(() => {
    async function fetchResults() {
      if (!examId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Sınav detaylarını çek
        const examResponse = await fetch(`/api/akademik-analiz/exams/${examId}`);
        if (examResponse.ok) {
          const { exam } = await examResponse.json();
          setExamName(exam?.name || 'Sınav Sonuçları');
        }

        // Sonuçları çek
        const resultsResponse = await fetch(`/api/akademik-analiz/results?examId=${examId}`);
        if (!resultsResponse.ok) {
          throw new Error('Sonuçlar yüklenemedi');
        }

        const { results: apiResults } = await resultsResponse.json();
        
        // API verisini StudentResult formatına dönüştür
        const formattedResults: StudentResult[] = (apiResults || []).map((r: any) => ({
          studentNo: r.student?.student_number || '',
          studentId: r.student_id,
          tc: '',
          name: r.student ? `${r.student.first_name} ${r.student.last_name}` : 'Bilinmeyen Öğrenci',
          booklet: 'A',
          totalCorrect: r.total_correct || 0,
          totalWrong: r.total_wrong || 0,
          totalEmpty: r.total_empty || 0,
          totalNet: parseFloat(r.total_net) || 0,
          totalScore: parseFloat(r.raw_score) || 0,
          rank: r.rank_in_exam || 0,
          percentile: parseFloat(r.percentile) || 0,
          subjects: Object.entries(r.subject_results || {}).map(([code, data]: [string, any]) => ({
            subjectId: code,
            subjectName: getSubjectName(code),
            correct: data.correct || 0,
            wrong: data.wrong || 0,
            empty: data.empty || 0,
            net: data.net || 0,
            weightedScore: data.net * 4 || 0,
            percentage: data.correct && (data.correct + data.wrong + data.empty) > 0 
              ? Math.round((data.correct / (data.correct + data.wrong + data.empty)) * 100)
              : 0,
          })),
          evaluatedAt: new Date(r.calculated_at),
          examId: r.exam_id,
        }));

        setResults(formattedResults);

        // Çakışmaları çek
        if (selectedOrganization?.id) {
          const conflictsResponse = await fetch(
            `/api/akademik-analiz/conflicts?examId=${examId}&resolved=false`
          );
          if (conflictsResponse.ok) {
            const { conflicts: apiConflicts } = await conflictsResponse.json();
            setConflicts((apiConflicts || []).map((c: any) => ({
              type: c.error_code || 'UNKNOWN',
              studentNo: c.student?.student_number || '',
              tc: '',
              name: c.student ? `${c.student.first_name} ${c.student.last_name}` : '',
              lineNumber: c.question_no || 0,
              description: c.error_message || 'Bilinmeyen hata',
              severity: c.error_type === 'critical' ? 'HIGH' : 'MEDIUM',
              autoResolvable: false,
              suggestedAction: 'Manuel kontrol gerekli',
            })));
          }
        }

      } catch (err) {
        console.error('[Sonuçlar] Hata:', err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [examId, selectedOrganization?.id]);

  // Yardımcı fonksiyon
  function getSubjectName(code: string): string {
    const names: Record<string, string> = {
      TUR: 'Türkçe',
      MAT: 'Matematik',
      FEN: 'Fen Bilimleri',
      SOS: 'Sosyal Bilimler',
      ING: 'İngilizce',
      DIN: 'Din Kültürü',
    };
    return names[code] || code;
  }

  // Yükleniyor
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#25D366',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#64748b' }}>Sonuçlar yükleniyor...</p>
      </div>
    );
  }

  // Sınav ID yok
  if (!examId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '1rem',
        color: '#64748b',
      }}>
        <p>Sınav seçilmedi</p>
        <button
          onClick={() => router.push('/admin/akademik-analiz')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#25D366',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Dashboard'a Dön
        </button>
      </div>
    );
  }

  // Hata
  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '1rem',
        color: '#ef4444',
      }}>
        <p>❌ {error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#25D366',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <ResultsExplorer
      results={results}
      conflicts={conflicts}
      examName={examName}
      onRecalculate={async () => {
        // Yeniden hesaplama
        console.log('Recalculating...');
        window.location.reload();
      }}
      onExport={() => {
        // PDF karne sayfasına yönlendir
        router.push(`/admin/akademik-analiz/karne?examId=${examId}`);
      }}
      onResolveConflict={async (conflict) => {
        console.log('Resolving conflict:', conflict);
        // TODO: Çakışma çözme API'si
      }}
    />
  );
}

// Suspense ile sarmalama
export default function SonuclarPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#6B7280',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#25D366',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    }>
      <SonuclarContent />
    </Suspense>
  );
}
