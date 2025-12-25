'use client';

/**
 * Akademik Analiz - Ana Sayfa (Dashboard)
 * Yönetici özet ekranı - Gerçek Supabase verisi ile
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/lib/sinavlar/ui';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import { useAcademicYearStore } from '@/lib/store/academicYearStore';

interface DashboardData {
  metrics: {
    totalExams: number;
    totalParticipants: number;
    avgNet: number;
    conflicts: number;
  };
  recentExams: any[];
  topPerformers: any[];
  subjectAverages: Record<string, number>;
  scoreDistribution: Record<string, number>;
}

export default function AkademikAnalizPage() {
  const router = useRouter();
  const { selectedOrganization } = useOrganizationStore();
  const { selectedYear } = useAcademicYearStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  // Veriyi çek
  useEffect(() => {
    async function fetchDashboard() {
      if (!selectedOrganization?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          organizationId: selectedOrganization.id,
        });
        
        if (selectedYear?.id) {
          params.append('academicYearId', selectedYear.id);
        }

        const response = await fetch(`/api/akademik-analiz/dashboard?${params}`);
        
        if (!response.ok) {
          throw new Error('Veriler yüklenemedi');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('[Dashboard] Hata:', err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [selectedOrganization?.id, selectedYear?.id]);

  // Veri dönüşümü
  const recentExams = (data?.recentExams || []).map((exam: any) => ({
    id: exam.id,
    name: exam.name,
    date: new Date(exam.exam_date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    studentCount: exam.stats_cache?.totalStudents || 0,
    averageScore: parseFloat(exam.stats_cache?.avgNet || '0'),
    conflictCount: 0, // TODO: Conflict count ekle
  }));

  const stats = {
    totalStudents: data?.metrics?.totalParticipants || 0,
    totalExams: data?.metrics?.totalExams || 0,
    averageScore: data?.metrics?.avgNet || 0,
    conflictRate: data?.metrics?.conflicts || 0,
    trend: 'up' as const,
    trendValue: 0,
  };

  // Ders renkleri
  const subjectColors: Record<string, string> = {
    TUR: '#25D366',
    MAT: '#3B82F6',
    FEN: '#8B5CF6',
    SOS: '#F59E0B',
    ING: '#EC4899',
    DIN: '#14B8A6',
  };

  const subjectNames: Record<string, string> = {
    TUR: 'Türkçe',
    MAT: 'Matematik',
    FEN: 'Fen Bilimleri',
    SOS: 'Sosyal Bilimler',
    ING: 'İngilizce',
    DIN: 'Din Kültürü',
  };

  const subjectStats = Object.entries(data?.subjectAverages || {}).map(([code, avg]) => ({
    name: subjectNames[code] || code,
    averagePercentage: Math.round((avg as number / 20) * 100), // 20 soru üzerinden
    color: subjectColors[code] || '#64748B',
  }));

  // Yükleniyor durumu
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
        <p style={{ color: '#64748b' }}>Veriler yükleniyor...</p>
      </div>
    );
  }

  // Hata durumu
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
    <Dashboard
      recentExams={recentExams}
      stats={stats}
      subjectStats={subjectStats.length > 0 ? subjectStats : undefined}
      onNewExam={() => router.push('/admin/akademik-analiz/sihirbaz')}
      onViewExam={(examId) => router.push(`/admin/akademik-analiz/sonuclar?examId=${examId}`)}
      onExportExam={(examId) => {
        // PDF karne oluşturma
        router.push(`/admin/akademik-analiz/karne?examId=${examId}`);
      }}
    />
  );
}
