'use client';

/**
 * Akademik Analiz - Karne Oluşturucu
 * Toplu ve tekil PDF karne üretimi
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Users,
  CheckCircle,
  Loader2,
  AlertCircle,
  Eye,
  Printer,
} from 'lucide-react';
import { colors } from '@/lib/sinavlar/ui/theme';
import type { StudentResult } from '@/lib/sinavlar/core/types';

// Demo veriler
const demoStudents: StudentResult[] = [
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
];

const examInfo = {
  name: 'LGS Deneme Sınavı 1',
  date: '20 Aralık 2024',
  type: 'LGS',
  totalStudents: 85,
};

const schoolInfo = {
  name: 'Dikmen Çözüm Kurs',
  address: 'Dikmen, Ankara',
  phone: '0312 XXX XX XX',
};

export default function KarnePage() {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: '' });
  const [generated, setGenerated] = useState(false);

  const toggleStudent = (studentNo: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(studentNo)) {
      newSet.delete(studentNo);
    } else {
      newSet.add(studentNo);
    }
    setSelectedStudents(newSet);
  };

  const selectAll = () => {
    if (selectedStudents.size === demoStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(demoStudents.map(s => s.studentNo)));
    }
  };

  const generatePDFs = async () => {
    setIsGenerating(true);
    setGenerated(false);
    
    const total = selectedStudents.size;
    let current = 0;

    for (const studentNo of selectedStudents) {
      const student = demoStudents.find(s => s.studentNo === studentNo);
      if (student) {
        current++;
        setProgress({ current, total, name: student.name });
        // Simüle delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsGenerating(false);
    setGenerated(true);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem' }}
      >
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: colors.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <FileText size={32} color={colors.primary[500]} />
          Sınav Karnesi Oluşturucu
        </h1>
        <p style={{ color: colors.text.secondary, marginTop: '0.5rem' }}>
          {examInfo.name} için öğrenci karnelerini oluşturun
        </p>
      </motion.div>

      {/* Sınav Bilgisi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: colors.primary[50],
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: '600', color: colors.primary[700] }}>
            📚 {examInfo.name}
          </div>
          <div style={{ fontSize: '0.875rem', color: colors.primary[600], marginTop: '0.25rem' }}>
            {examInfo.date} • {examInfo.type} • {examInfo.totalStudents} öğrenci
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: '600', color: colors.primary[700] }}>
            🏫 {schoolInfo.name}
          </div>
          <div style={{ fontSize: '0.875rem', color: colors.primary[600], marginTop: '0.25rem' }}>
            {schoolInfo.address}
          </div>
        </div>
      </motion.div>

      {/* Öğrenci Listesi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${colors.secondary[200]}`,
          backgroundColor: colors.background.subtle,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={selectAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'white',
                border: `1px solid ${colors.secondary[200]}`,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              <CheckCircle size={18} color={selectedStudents.size === demoStudents.length ? colors.primary[500] : colors.text.muted} />
              {selectedStudents.size === demoStudents.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </button>
            <span style={{ color: colors.text.secondary, fontSize: '0.875rem' }}>
              {selectedStudents.size} öğrenci seçildi
            </span>
          </div>

          <button
            onClick={generatePDFs}
            disabled={selectedStudents.size === 0 || isGenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: selectedStudents.size === 0 || isGenerating ? colors.secondary[300] : colors.primary[500],
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: selectedStudents.size === 0 || isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: selectedStudents.size > 0 && !isGenerating ? '0 4px 14px 0 rgba(37, 211, 102, 0.39)' : 'none',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Download size={20} />
                Karneleri Oluştur (ZIP)
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div style={{ padding: '1rem 1.5rem', backgroundColor: colors.primary[50] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                {progress.name} için karne oluşturuluyor...
              </span>
              <span style={{ fontSize: '0.875rem', color: colors.text.secondary }}>
                {progress.current} / {progress.total}
              </span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: colors.primary[100],
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(progress.current / progress.total) * 100}%`,
                height: '100%',
                backgroundColor: colors.primary[500],
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Success Message */}
        {generated && !isGenerating && (
          <div style={{ 
            padding: '1rem 1.5rem', 
            backgroundColor: '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <CheckCircle size={24} color="#22C55E" />
            <span style={{ fontWeight: '600', color: '#166534' }}>
              {selectedStudents.size} karne başarıyla oluşturuldu! ZIP dosyası indiriliyor...
            </span>
          </div>
        )}

        {/* Student Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: colors.secondary[50] }}>
              <th style={{ padding: '1rem', textAlign: 'left', width: '50px' }}></th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: colors.text.secondary }}>Sıra</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: colors.text.secondary }}>Öğrenci</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: colors.text.secondary }}>Net</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: colors.text.secondary }}>Puan</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: colors.text.secondary }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {demoStudents.map((student, index) => (
              <tr 
                key={student.studentNo}
                style={{ 
                  borderBottom: `1px solid ${colors.secondary[100]}`,
                  backgroundColor: selectedStudents.has(student.studentNo) ? colors.primary[50] : 'transparent',
                }}
              >
                <td style={{ padding: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.studentNo)}
                    onChange={() => toggleStudent(student.studentNo)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    backgroundColor: student.rank <= 3 
                      ? student.rank === 1 ? '#FEF3C7' : student.rank === 2 ? '#E5E7EB' : '#FED7AA'
                      : colors.secondary[100],
                    color: student.rank <= 3
                      ? student.rank === 1 ? '#92400E' : student.rank === 2 ? '#374151' : '#9A3412'
                      : colors.text.primary,
                  }}>
                    {student.rank}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: '600', color: colors.text.primary }}>{student.name}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.text.muted }}>{student.studentNo}</div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                  {student.totalNet.toFixed(2)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '700', color: colors.primary[600] }}>
                  {student.totalScore.toFixed(1)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    <button
                      style={{
                        padding: '0.5rem',
                        backgroundColor: colors.secondary[100],
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                      }}
                      title="Önizle"
                    >
                      <Eye size={18} color={colors.secondary[600]} />
                    </button>
                    <button
                      style={{
                        padding: '0.5rem',
                        backgroundColor: colors.primary[100],
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                      }}
                      title="PDF İndir"
                    >
                      <Download size={18} color={colors.primary[600]} />
                    </button>
                    <button
                      style={{
                        padding: '0.5rem',
                        backgroundColor: colors.info + '20',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                      }}
                      title="Yazdır"
                    >
                      <Printer size={18} color={colors.info} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Ayarlar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginTop: '1.5rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        }}
      >
        <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>⚙️ Karne Ayarları</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>AI Öğretmen Notu Ekle</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>Ders Bazlı Grafik</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>Sıralama Bilgisi</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" />
            <span>Sınıf Karşılaştırması</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" />
            <span>Geçmiş Sınav Trendi</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" />
            <span>QR Kod (Detay Linki)</span>
          </label>
        </div>
      </motion.div>
    </div>
  );
}

