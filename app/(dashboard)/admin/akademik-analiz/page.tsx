'use client';

/**
 * Akademik Analiz - Ana Sayfa (Dashboard)
 * Yeni sınav oluşturma ve sonuç görüntüleme
 */

import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

export default function AkademikAnalizPage() {
  const router = useRouter();

  // Demo istatistikler
  const stats = {
    totalExams: 12,
    totalStudents: 156,
    avgNet: 58.4,
    topStudent: 'Elif Yılmaz'
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
          {[
            { label: 'Toplam Sınav', value: stats.totalExams, icon: FileSpreadsheet, color: 'emerald' },
            { label: 'Öğrenci Sayısı', value: stats.totalStudents, icon: Users, color: 'blue' },
            { label: 'Ortalama Net', value: stats.avgNet.toFixed(1), icon: Target, color: 'purple' },
            { label: 'En Başarılı', value: stats.topStudent, icon: Award, color: 'amber' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">{stat.label}</span>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            </motion.div>
          ))}
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
            <p className="text-emerald-100 mb-4">
              5 adımda sınav oluşturun: Bilgi → Cevap Anahtarı → Şablon → Veri → Kaydet
            </p>
            <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
              <span>Başla</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Sonuçlar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push('/admin/akademik-analiz/sonuclar')}
            className="p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
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
            <div className="flex items-center gap-2 text-blue-600 group-hover:text-blue-700 transition-colors">
              <span>Görüntüle</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Karne */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => router.push('/admin/akademik-analiz/karne')}
            className="p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all group"
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
            <div className="flex items-center gap-2 text-purple-600 group-hover:text-purple-700 transition-colors">
              <span>Oluştur</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </div>

        {/* Hızlı İpuçları */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 mb-2">Nasıl Kullanılır?</h4>
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

        {/* Son Sınavlar (Demo) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              Son Sınavlar
            </h3>
            <button 
              onClick={() => router.push('/admin/akademik-analiz/sonuclar')}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              Tümünü Gör →
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {[
              { name: 'LGS Deneme 3', date: '20 Aralık 2025', students: 63, avg: 58.4 },
              { name: 'LGS Deneme 2', date: '15 Aralık 2025', students: 61, avg: 54.2 },
              { name: 'LGS Deneme 1', date: '10 Aralık 2025', students: 58, avg: 51.8 },
            ].map((exam, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{exam.name}</p>
                  <p className="text-sm text-slate-500">{exam.date}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Öğrenci</p>
                    <p className="font-semibold text-slate-700">{exam.students}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Ort. Net</p>
                    <p className="font-semibold text-emerald-600">{exam.avg}</p>
                  </div>
                  <button
                    onClick={() => router.push('/admin/akademik-analiz/sonuclar')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
                  >
                    Detay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
