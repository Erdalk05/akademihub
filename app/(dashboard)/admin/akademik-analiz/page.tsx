'use client';

/**
 * Akademik Analiz - Ana Sayfa (Dashboard)
 * GERÇEK VERİLERİ LocalStorage'dan okur
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  FileSpreadsheet,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  Award,
  BookOpen,
  Sparkles,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';

// Sınav tipi
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

export default function AkademikAnalizPage() {
  const router = useRouter();
  const [savedExams, setSavedExams] = useState<SavedExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // LocalStorage'dan sınavları oku
  useEffect(() => {
    const loadExams = () => {
      try {
        const examsJson = localStorage.getItem('akademihub_exams');
        if (examsJson) {
          const exams = JSON.parse(examsJson) as SavedExam[];
          // Tarihe göre sırala (en yeni en üstte)
          exams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setSavedExams(exams);
        }
      } catch (error) {
        console.error('Sınavlar yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExams();
  }, []);

  // Sınav sil
  const deleteExam = (examId: string) => {
    if (confirm('Bu sınavı silmek istediğinizden emin misiniz?')) {
      const updated = savedExams.filter(e => e.id !== examId);
      setSavedExams(updated);
      localStorage.setItem('akademihub_exams', JSON.stringify(updated));
    }
  };

  // İstatistikleri hesapla
  const stats = {
    totalExams: savedExams.length,
    totalStudents: savedExams.reduce((sum, e) => sum + (e.toplamOgrenci || 0), 0),
    avgNet: savedExams.length > 0 
      ? (savedExams.reduce((sum, e) => sum + parseFloat(String(e.ortalamaNet || 0)), 0) / savedExams.length).toFixed(1)
      : '0.0',
    topStudent: savedExams[0]?.ilk20Ogrenci?.[0]?.ogrenciAdi || '-'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Başlık */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Akademik Analiz</h1>
              <p className="text-slate-500">Sınav yönetimi ve kazanım analizi</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-medium shadow-lg transition-all"
          >
            <Plus size={20} />
            Yeni Sınav Oluştur
          </motion.button>
        </motion.div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">Toplam Sınav</span>
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.totalExams}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">Öğrenci Sayısı</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">Ortalama Net</span>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.avgNet}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">En Başarılı</span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 truncate">{stats.topStudent}</p>
          </motion.div>
        </div>

        {/* Ana Aksiyonlar */}
        <div className="grid grid-cols-3 gap-6">
          {/* Yeni Sınav */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
            className="p-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl text-white cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Sınav Sihirbazı</h3>
            </div>
            <p className="text-white/80 mb-4">
              5 adımda sınav oluşturun: Bilgi → Cevap Anahtarı → Şablon → Veri → Kaydet
            </p>
            <div className="flex items-center gap-2 text-white/90 group-hover:translate-x-2 transition-transform">
              <span>Başla</span>
              <ArrowRight size={18} />
            </div>
          </motion.div>

          {/* Sonuçları Gör */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push('/admin/akademik-analiz/sonuclar')}
            className="p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Sınav Sonuçları</h3>
            </div>
            <p className="text-slate-500 mb-4">
              Öğrenci sonuçlarını görüntüleyin, filtreleyin ve dışa aktarın.
            </p>
            <div className="flex items-center gap-2 text-blue-600 group-hover:translate-x-2 transition-transform">
              <span>Görüntüle</span>
              <ArrowRight size={18} />
            </div>
          </motion.div>

          {/* Karne Oluştur */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => router.push('/admin/akademik-analiz/karne')}
            className="p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Öğrenci Karnesi</h3>
            </div>
            <p className="text-slate-500 mb-4">
              Kazanım bazlı karne oluşturun ve PDF olarak indirin.
            </p>
            <div className="flex items-center gap-2 text-purple-600 group-hover:translate-x-2 transition-transform">
              <span>Oluştur</span>
              <ArrowRight size={18} />
            </div>
          </motion.div>
        </div>

        {/* Kullanım Kılavuzu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800 mb-2">Nasıl Kullanılır?</h3>
              <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1">
                <li><strong>Yeni Sınav Oluştur</strong> butonuna tıklayın</li>
                <li>Sınav bilgilerini girin (ad, tarih, tip)</li>
                <li>Kazanım bazlı cevap anahtarını yükleyin (Excel veya kopyala-yapıştır)</li>
                <li>Optik şablon seçin veya oluşturun</li>
                <li>Öğrenci cevaplarını yükleyin (TXT dosyası)</li>
                <li>Sonuçları görüntüleyin ve karneleri indirin</li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* Son Sınavlar - GERÇEK VERİLER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              Kayıtlı Sınavlar
              <span className="text-sm font-normal text-slate-400">({savedExams.length})</span>
            </h3>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <RefreshCw size={14} />
              Yenile
            </button>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Yükleniyor...
            </div>
          ) : savedExams.length === 0 ? (
            <div className="p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-2">Henüz kayıtlı sınav yok</p>
              <button
                onClick={() => router.push('/admin/akademik-analiz/sihirbaz')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                İlk sınavınızı oluşturun →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {savedExams.map((exam) => (
                <div key={exam.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-slate-800">{exam.ad || 'İsimsiz Sınav'}</p>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                          {exam.tip || 'LGS'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{formatDate(exam.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Öğrenci</p>
                        <p className="font-semibold text-slate-700">{exam.toplamOgrenci || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Soru</p>
                        <p className="font-semibold text-slate-700">{exam.toplamSoru || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Ort. Net</p>
                        <p className="font-semibold text-emerald-600">{exam.ortalamaNet || 0}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/akademik-analiz/sonuclar?examId=${exam.id}`)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                          title="Detayları Gör"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteExam(exam.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* İlk 3 Öğrenci */}
                  {exam.ilk20Ogrenci && exam.ilk20Ogrenci.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400 mb-2">En Başarılı Öğrenciler:</p>
                      <div className="flex gap-4">
                        {exam.ilk20Ogrenci.slice(0, 3).map((ogrenci, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                              i === 0 ? 'bg-amber-100 text-amber-700' :
                              i === 1 ? 'bg-slate-100 text-slate-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {i + 1}
                            </span>
                            <span className="text-sm text-slate-600">{ogrenci.ogrenciAdi}</span>
                            <span className="text-xs text-emerald-600 font-medium">{ogrenci.toplamNet?.toFixed(1)} net</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
