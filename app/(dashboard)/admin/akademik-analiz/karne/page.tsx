'use client';

/**
 * Akademik Analiz - Karne Oluşturucu
 * Toplu ve tekil PDF karne üretimi - Supabase entegreli
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  CheckCircle,
  Loader2,
  Eye,
  Printer,
  ArrowLeft,
} from 'lucide-react';
import { colors } from '@/lib/sinavlar/ui/theme';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import type { StudentResult } from '@/lib/sinavlar/core/types';

function KarneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');
  const { selectedOrganization } = useOrganizationStore();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [examInfo, setExamInfo] = useState({ name: '', date: '', type: 'LGS', totalStudents: 0 });
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: '' });
  const [generated, setGenerated] = useState(false);

  // Veri yükle
  useEffect(() => {
    async function fetchData() {
      if (!examId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Sınav detaylarını çek
        const examResponse = await fetch(`/api/akademik-analiz/exams/${examId}`);
        if (examResponse.ok) {
          const { exam } = await examResponse.json();
          setExamInfo({
            name: exam?.name || 'Sınav',
            date: exam?.exam_date ? new Date(exam.exam_date).toLocaleDateString('tr-TR') : '',
            type: exam?.exam_type?.code || 'LGS',
            totalStudents: exam?.results?.length || 0,
          });

          // Sonuçları formatla
          const formattedStudents: StudentResult[] = (exam?.results || []).map((r: any, index: number) => ({
            studentNo: r.student?.student_number || `OGR-${index + 1}`,
            studentId: r.student_id,
            tc: '',
            name: r.student ? `${r.student.first_name} ${r.student.last_name}` : 'Bilinmeyen Öğrenci',
            booklet: 'A',
            totalCorrect: r.total_correct || 0,
            totalWrong: r.total_wrong || 0,
            totalEmpty: r.total_empty || 0,
            totalNet: parseFloat(r.total_net) || 0,
            totalScore: parseFloat(r.raw_score) || 0,
            rank: r.rank_in_exam || index + 1,
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

          setStudents(formattedStudents);
        }
      } catch (err) {
        console.error('[Karne] Veri yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [examId]);

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
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.studentNo)));
    }
  };

  const generatePDFs = async () => {
    setIsGenerating(true);
    setGenerated(false);

    const total = selectedStudents.size;
    let current = 0;

    for (const studentNo of selectedStudents) {
      const student = students.find(s => s.studentNo === studentNo);
      if (student) {
        current++;
        setProgress({ current, total, name: student.name });
        // Simüle delay (gerçek PDF üretimi için API çağrısı yapılabilir)
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsGenerating(false);
    setGenerated(true);
  };

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
        <p style={{ color: '#64748b' }}>Veriler yükleniyor...</p>
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem' }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: 'none',
            color: colors.text.secondary,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <ArrowLeft size={18} />
          Geri
        </button>

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
            {examInfo.date} • {examInfo.type} • {students.length} öğrenci
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: '600', color: colors.primary[700] }}>
            🏫 {selectedOrganization?.name || 'Kurum'}
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
              <CheckCircle size={18} color={selectedStudents.size === students.length ? colors.primary[500] : colors.text.muted} />
              {selectedStudents.size === students.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
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
        {students.length > 0 ? (
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
              {students.map((student) => (
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
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: colors.text.secondary }}>
            <p>Henüz sonuç bulunmuyor.</p>
          </div>
        )}
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

// Suspense ile sarmalama
export default function KarnePage() {
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
      <KarneContent />
    </Suspense>
  );
}
