'use client';

/**
 * Akademik Analiz - Karne Oluşturucu
 * LocalStorage'dan veri okuyarak öğrenci karneleri oluşturur
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
  Users,
  Award,
  Target,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';

interface SavedExam {
  id: string;
  ad: string;
  tarih: string;
  tip: string;
  toplamSoru: number;
  toplamOgrenci: number;
  ortalamaNet: string | number;
  ilk20Ogrenci?: { ogrenciNo: string; ogrenciAdi: string; toplamNet: number; siralama: number }[];
  createdAt: string;
}

function KarneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = searchParams.get('examId');

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<SavedExam | null>(null);
  const [allExams, setAllExams] = useState<SavedExam[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: '' });
  const [generated, setGenerated] = useState(false);

  // Veri yükle
  useEffect(() => {
    const loadData = () => {
      try {
        const examsJson = localStorage.getItem('akademihub_exams');
        if (examsJson) {
          const exams = JSON.parse(examsJson) as SavedExam[];
          setAllExams(exams);

          if (examId) {
            const found = exams.find(e => e.id === examId);
            setExam(found || null);
          }
        }
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [examId]);

  // Öğrenci adını temizle
  const cleanName = (name: string): string => {
    if (!name) return 'Bilinmeyen';
    let cleaned = name.replace(/^[\d\s]+/, '').trim();
    cleaned = cleaned.replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.split(' ')
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') || name;
  };

  // Tarihi formatla
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const students = exam?.ilk20Ogrenci || [];

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
      setSelectedStudents(new Set(students.map(s => s.ogrenciNo)));
    }
  };

  const generatePDFs = async () => {
    setIsGenerating(true);
    setGenerated(false);

    const total = selectedStudents.size;
    let current = 0;

    for (const studentNo of selectedStudents) {
      const student = students.find(s => s.ogrenciNo === studentNo);
      if (student) {
        current++;
        setProgress({ current, total, name: cleanName(student.ogrenciAdi) });
        // Simüle delay
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsGenerating(false);
    setGenerated(true);
  };

  // Yükleniyor
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Sınav seçilmedi - tüm sınavları göster
  if (!examId || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <button
              onClick={() => router.push('/admin/akademik-analiz')}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Öğrenci Karnesi</h1>
              <p className="text-slate-500">Karne oluşturmak için bir sınav seçin</p>
            </div>
          </motion.div>

          {allExams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Henüz kayıtlı sınav yok</p>
              <button
                onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
              >
                İlk Sınavınızı Oluşturun
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {allExams.map((e, idx) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => router.push(`/admin/akademik-analiz/karne?examId=${e.id}`)}
                  className="p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">
                        {e.ad || 'İsimsiz Sınav'}
                      </h3>
                      <p className="text-sm text-slate-500">{formatDate(e.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-700">{e.toplamOgrenci || 0}</p>
                        <p className="text-xs text-slate-400">Öğrenci</p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90 group-hover:text-purple-600" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Seçili sınav için karne oluştur
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/akademik-analiz/karne')}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Sınav Karnesi Oluşturucu</h1>
              <p className="text-slate-500">{exam.ad} • {formatDate(exam.createdAt)}</p>
            </div>
          </div>
        </motion.div>

        {/* Sınav Bilgisi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-4 mb-6"
        >
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Öğrenci</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-blue-600">{exam.toplamOgrenci}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Soru</span>
              <Target className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl font-bold text-purple-600">{exam.toplamSoru}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Ort. Net</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-emerald-600">{exam.ortalamaNet}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Seçili</span>
              <CheckCircle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-amber-600">{selectedStudents.size}</p>
          </div>
        </motion.div>

        {/* Öğrenci Listesi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-4">
              <button
                onClick={selectAll}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <CheckCircle
                  size={18}
                  className={selectedStudents.size === students.length ? 'text-emerald-500' : 'text-slate-400'}
                />
                {selectedStudents.size === students.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
              </button>
              <span className="text-sm text-slate-500">
                {selectedStudents.size} öğrenci seçildi
              </span>
            </div>

            <button
              onClick={generatePDFs}
              disabled={selectedStudents.size === 0 || isGenerating}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                selectedStudents.size === 0 || isGenerating
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Karneleri Oluştur (ZIP)
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="p-4 bg-purple-50 border-b border-purple-100">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">
                  {progress.name} için karne oluşturuluyor...
                </span>
                <span className="text-sm text-purple-600">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {generated && !isGenerating && (
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
              <CheckCircle size={24} className="text-emerald-600" />
              <span className="font-semibold text-emerald-700">
                {selectedStudents.size} karne başarıyla oluşturuldu! ZIP dosyası indiriliyor...
              </span>
            </div>
          )}

          {/* Student Table */}
          {students.length > 0 ? (
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left w-12"></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Sıra</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Öğrenci</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Net</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Puan</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.ogrenciNo}
                    className={`hover:bg-slate-50 transition-colors ${
                      selectedStudents.has(student.ogrenciNo) ? 'bg-purple-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.ogrenciNo)}
                        onChange={() => toggleStudent(student.ogrenciNo)}
                        className="w-4 h-4 cursor-pointer accent-purple-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        student.siralama === 1 ? 'bg-yellow-100 text-yellow-800' :
                        student.siralama === 2 ? 'bg-slate-100 text-slate-700' :
                        student.siralama === 3 ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {student.siralama}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{cleanName(student.ogrenciAdi)}</div>
                      <div className="text-xs text-slate-400 font-mono">{student.ogrenciNo}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-800">{student.toplamNet?.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                        {(student.toplamNet * 5).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Önizle"
                        >
                          <Eye size={16} className="text-slate-600" />
                        </button>
                        <button
                          className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                          title="PDF İndir"
                        >
                          <Download size={16} className="text-purple-600" />
                        </button>
                        <button
                          className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                          title="Yazdır"
                        >
                          <Printer size={16} className="text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>Henüz sonuç bulunmuyor.</p>
            </div>
          )}
        </motion.div>

        {/* Ayarlar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 mt-6 border border-slate-200"
        >
          <h3 className="font-semibold text-slate-800 mb-4">⚙️ Karne Ayarları</h3>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-purple-600" />
              <span className="text-sm text-slate-700">AI Öğretmen Notu</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-purple-600" />
              <span className="text-sm text-slate-700">Ders Bazlı Grafik</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-purple-600" />
              <span className="text-sm text-slate-700">Sıralama Bilgisi</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-purple-600" />
              <span className="text-sm text-slate-700">Sınıf Karşılaştırması</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-purple-600" />
              <span className="text-sm text-slate-700">Geçmiş Sınav Trendi</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-purple-600" />
              <span className="text-sm text-slate-700">QR Kod (Detay Linki)</span>
            </label>
          </div>
        </motion.div>

        {/* Alt Bilgi */}
        <div className="mt-4 text-center text-sm text-slate-500">
          Gösterilen: {students.length} / {exam.toplamOgrenci || 0} öğrenci
          {students.length < (exam.toplamOgrenci || 0) && (
            <span className="ml-2 text-amber-600">
              (İlk {students.length} öğrenci gösteriliyor)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Suspense ile sarmalama
export default function KarnePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <KarneContent />
    </Suspense>
  );
}
