'use client';

/**
 * Akademik Analiz - Ana Sayfa (Dashboard)
 * Yönetici özet ekranı
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/lib/sinavlar/ui';

export default function AkademikAnalizPage() {
  const router = useRouter();

  // Demo veriler
  const recentExams = [
    {
      id: '1',
      name: 'LGS Deneme Sınavı 1',
      date: '20 Aralık 2024',
      studentCount: 85,
      averageScore: 342.5,
      conflictCount: 2,
    },
    {
      id: '2',
      name: 'LGS Deneme Sınavı 2',
      date: '15 Aralık 2024',
      studentCount: 82,
      averageScore: 356.8,
      conflictCount: 0,
    },
    {
      id: '3',
      name: 'TYT Deneme Sınavı',
      date: '10 Aralık 2024',
      studentCount: 45,
      averageScore: 285.3,
      conflictCount: 1,
    },
  ];

  const stats = {
    totalStudents: 212,
    totalExams: 8,
    averageScore: 328.2,
    conflictRate: 1.4,
    trend: 'up' as const,
    trendValue: 3.2,
  };

  const subjectStats = [
    { name: 'Türkçe', averagePercentage: 72, color: '#25D366' },
    { name: 'Matematik', averagePercentage: 58, color: '#3B82F6' },
    { name: 'Fen Bilimleri', averagePercentage: 65, color: '#8B5CF6' },
    { name: 'Sosyal Bilimler', averagePercentage: 78, color: '#F59E0B' },
    { name: 'İngilizce', averagePercentage: 55, color: '#EC4899' },
    { name: 'Din Kültürü', averagePercentage: 82, color: '#14B8A6' },
  ];

  return (
    <Dashboard
      recentExams={recentExams}
      stats={stats}
      subjectStats={subjectStats}
      onNewExam={() => router.push('/admin/akademik-analiz/sihirbaz')}
      onViewExam={(examId) => router.push(`/admin/akademik-analiz/sonuclar?examId=${examId}`)}
      onExportExam={(examId) => {
        // Excel export işlemi
        console.log('Export exam:', examId);
      }}
    />
  );
}

