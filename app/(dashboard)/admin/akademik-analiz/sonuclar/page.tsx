'use client';

/**
 * Akademik Analiz - Sonuçlar
 * Sınav sonuçlarını görüntüleme
 */

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResultsExplorer } from '@/lib/sinavlar/ui';
import { StudentResult, Conflict } from '@/lib/sinavlar/core/types';

function SonuclarContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId') || '1';

  // Demo veriler
  const demoResults: StudentResult[] = [
    {
      studentNo: '2024001',
      tc: '12345678901',
      name: 'Ali Yılmaz',
      booklet: 'A',
      totalCorrect: 72,
      totalWrong: 12,
      totalEmpty: 6,
      totalNet: 68.0,
      totalScore: 456.8,
      rank: 1,
      percentile: 99,
      subjects: [
        { subjectId: 'turkce', subjectName: 'Türkçe', correct: 18, wrong: 2, empty: 0, net: 17.33, weightedScore: 69.33, percentage: 90 },
        { subjectId: 'matematik', subjectName: 'Matematik', correct: 17, wrong: 2, empty: 1, net: 16.33, weightedScore: 65.33, percentage: 85 },
        { subjectId: 'fen', subjectName: 'Fen Bilimleri', correct: 16, wrong: 3, empty: 1, net: 15.0, weightedScore: 60.0, percentage: 80 },
        { subjectId: 'sosyal', subjectName: 'Sosyal Bilimler', correct: 8, wrong: 1, empty: 1, net: 7.67, weightedScore: 7.67, percentage: 80 },
        { subjectId: 'ingilizce', subjectName: 'İngilizce', correct: 7, wrong: 2, empty: 1, net: 6.33, weightedScore: 6.33, percentage: 70 },
        { subjectId: 'din', subjectName: 'Din Kültürü', correct: 6, wrong: 2, empty: 2, net: 5.33, weightedScore: 5.33, percentage: 60 },
      ],
      evaluatedAt: new Date(),
      examId: '1',
    },
    {
      studentNo: '2024002',
      tc: '12345678902',
      name: 'Ayşe Kaya',
      booklet: 'B',
      totalCorrect: 68,
      totalWrong: 15,
      totalEmpty: 7,
      totalNet: 63.0,
      totalScore: 432.5,
      rank: 2,
      percentile: 97,
      subjects: [
        { subjectId: 'turkce', subjectName: 'Türkçe', correct: 17, wrong: 2, empty: 1, net: 16.33, weightedScore: 65.33, percentage: 85 },
        { subjectId: 'matematik', subjectName: 'Matematik', correct: 15, wrong: 4, empty: 1, net: 13.67, weightedScore: 54.67, percentage: 75 },
        { subjectId: 'fen', subjectName: 'Fen Bilimleri', correct: 15, wrong: 4, empty: 1, net: 13.67, weightedScore: 54.67, percentage: 75 },
        { subjectId: 'sosyal', subjectName: 'Sosyal Bilimler', correct: 9, wrong: 1, empty: 0, net: 8.67, weightedScore: 8.67, percentage: 90 },
        { subjectId: 'ingilizce', subjectName: 'İngilizce', correct: 6, wrong: 2, empty: 2, net: 5.33, weightedScore: 5.33, percentage: 60 },
        { subjectId: 'din', subjectName: 'Din Kültürü', correct: 6, wrong: 2, empty: 2, net: 5.33, weightedScore: 5.33, percentage: 60 },
      ],
      evaluatedAt: new Date(),
      examId: '1',
    },
    {
      studentNo: '2024003',
      tc: '12345678903',
      name: 'Mehmet Demir',
      booklet: 'A',
      totalCorrect: 65,
      totalWrong: 18,
      totalEmpty: 7,
      totalNet: 59.0,
      totalScore: 398.2,
      rank: 3,
      percentile: 95,
      subjects: [
        { subjectId: 'turkce', subjectName: 'Türkçe', correct: 16, wrong: 3, empty: 1, net: 15.0, weightedScore: 60.0, percentage: 80 },
        { subjectId: 'matematik', subjectName: 'Matematik', correct: 14, wrong: 5, empty: 1, net: 12.33, weightedScore: 49.33, percentage: 70 },
        { subjectId: 'fen', subjectName: 'Fen Bilimleri', correct: 14, wrong: 5, empty: 1, net: 12.33, weightedScore: 49.33, percentage: 70 },
        { subjectId: 'sosyal', subjectName: 'Sosyal Bilimler', correct: 8, wrong: 2, empty: 0, net: 7.33, weightedScore: 7.33, percentage: 80 },
        { subjectId: 'ingilizce', subjectName: 'İngilizce', correct: 7, wrong: 2, empty: 1, net: 6.33, weightedScore: 6.33, percentage: 70 },
        { subjectId: 'din', subjectName: 'Din Kültürü', correct: 6, wrong: 1, empty: 3, net: 5.67, weightedScore: 5.67, percentage: 60 },
      ],
      evaluatedAt: new Date(),
      examId: '1',
    },
    {
      studentNo: '2024004',
      tc: '12345678904',
      name: 'Zeynep Öztürk',
      booklet: 'B',
      totalCorrect: 60,
      totalWrong: 20,
      totalEmpty: 10,
      totalNet: 53.33,
      totalScore: 365.4,
      rank: 4,
      percentile: 92,
      subjects: [
        { subjectId: 'turkce', subjectName: 'Türkçe', correct: 15, wrong: 4, empty: 1, net: 13.67, weightedScore: 54.67, percentage: 75 },
        { subjectId: 'matematik', subjectName: 'Matematik', correct: 12, wrong: 5, empty: 3, net: 10.33, weightedScore: 41.33, percentage: 60 },
        { subjectId: 'fen', subjectName: 'Fen Bilimleri', correct: 13, wrong: 5, empty: 2, net: 11.33, weightedScore: 45.33, percentage: 65 },
        { subjectId: 'sosyal', subjectName: 'Sosyal Bilimler', correct: 7, wrong: 2, empty: 1, net: 6.33, weightedScore: 6.33, percentage: 70 },
        { subjectId: 'ingilizce', subjectName: 'İngilizce', correct: 7, wrong: 2, empty: 1, net: 6.33, weightedScore: 6.33, percentage: 70 },
        { subjectId: 'din', subjectName: 'Din Kültürü', correct: 6, wrong: 2, empty: 2, net: 5.33, weightedScore: 5.33, percentage: 60 },
      ],
      evaluatedAt: new Date(),
      examId: '1',
    },
    {
      studentNo: '2024005',
      tc: '12345678905',
      name: 'Emre Çelik',
      booklet: 'A',
      totalCorrect: 55,
      totalWrong: 25,
      totalEmpty: 10,
      totalNet: 46.67,
      totalScore: 312.8,
      rank: 5,
      percentile: 88,
      subjects: [
        { subjectId: 'turkce', subjectName: 'Türkçe', correct: 14, wrong: 5, empty: 1, net: 12.33, weightedScore: 49.33, percentage: 70 },
        { subjectId: 'matematik', subjectName: 'Matematik', correct: 10, wrong: 7, empty: 3, net: 7.67, weightedScore: 30.67, percentage: 50 },
        { subjectId: 'fen', subjectName: 'Fen Bilimleri', correct: 12, wrong: 6, empty: 2, net: 10.0, weightedScore: 40.0, percentage: 60 },
        { subjectId: 'sosyal', subjectName: 'Sosyal Bilimler', correct: 7, wrong: 2, empty: 1, net: 6.33, weightedScore: 6.33, percentage: 70 },
        { subjectId: 'ingilizce', subjectName: 'İngilizce', correct: 6, wrong: 3, empty: 1, net: 5.0, weightedScore: 5.0, percentage: 60 },
        { subjectId: 'din', subjectName: 'Din Kültürü', correct: 6, wrong: 2, empty: 2, net: 5.33, weightedScore: 5.33, percentage: 60 },
      ],
      evaluatedAt: new Date(),
      examId: '1',
    },
  ];

  // Demo çakışmalar
  const demoConflicts: Conflict[] = [
    {
      type: 'TC_NAME_MISMATCH',
      studentNo: '2024006',
      tc: '12345678906',
      name: 'Ahmet Yıldız',
      lineNumber: 6,
      description: 'TC numarası veritabanında farklı bir isimle kayıtlı: "Ahmet Yıldırım"',
      existingData: {
        name: 'Ahmet Yıldırım',
        studentNo: '2024006',
      },
      severity: 'HIGH',
      autoResolvable: false,
      suggestedAction: 'Öğrenci kaydını manuel olarak kontrol edin',
    },
  ];

  return (
    <ResultsExplorer
      results={demoResults}
      conflicts={demoConflicts}
      examName="LGS Deneme Sınavı 1 - Sonuçlar"
      onRecalculate={() => {
        console.log('Recalculating...');
      }}
      onExport={() => {
        console.log('Exporting...');
      }}
      onResolveConflict={(conflict) => {
        console.log('Resolving conflict:', conflict);
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
        Yükleniyor...
      </div>
    }>
      <SonuclarContent />
    </Suspense>
  );
}

