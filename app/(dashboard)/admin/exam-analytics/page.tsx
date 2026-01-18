'use client';

import { Brain, FileText, Users, TrendingUp, Clock, Target } from 'lucide-react';
import Link from 'next/link';

export default function ExamAnalyticsDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sınav Analizi</h1>
        </div>
        <p className="text-gray-600 ml-14">
          Exam Analytics modülüne hoş geldiniz. Sınav oluşturma, analiz ve raporlama sistemi.
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Toplam Sınav</h3>
          <p className="text-xs text-gray-400 mt-1">Tüm zamanlar</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Toplam Katılımcı</h3>
          <p className="text-xs text-gray-400 mt-1">Tüm sınavlar</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">-</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Ortalama Net</h3>
          <p className="text-xs text-gray-400 mt-1">Son 30 gün</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Aktif Sınav</h3>
          <p className="text-xs text-gray-400 mt-1">Devam eden</p>
        </div>
      </div>

      {/* Hızlı Eylemler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Hızlı Başlangıç</h2>
          </div>
          
          <div className="space-y-4">
            <Link 
              href="/admin/exam-analytics/sinavlar/yeni"
              className="block p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    Yeni Sınav Oluştur
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    LGS, TYT, AYT veya deneme sınavı tanımla
                  </p>
                </div>
                <div className="text-blue-600 group-hover:translate-x-1 transition-transform">→</div>
              </div>
            </Link>

            <Link 
              href="/admin/exam-analytics/sinavlar"
              className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                    Sınavları Görüntüle
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Mevcut sınavları listele ve yönet
                  </p>
                </div>
                <div className="text-gray-600 group-hover:translate-x-1 transition-transform">→</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Sistem Durumu</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-white/90">Veritabanı</span>
              <span className="px-3 py-1 bg-green-500 rounded-full text-xs font-bold">
                ✓ Hazır
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-white/90">Migration</span>
              <span className="px-3 py-1 bg-green-500 rounded-full text-xs font-bold">
                ✓ Tamamlandı
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-white/90">İzolasyon</span>
              <span className="px-3 py-1 bg-green-500 rounded-full text-xs font-bold">
                ✓ Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FAZ Bilgisi */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-yellow-50 rounded-xl">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">FAZ 2 Tamamlandı</h3>
            <p className="text-gray-600 mb-4">
              Navigasyon ve Sidebar entegrasyonu başarıyla gerçekleştirildi. 
              Sistem artık sınav modülüne hazır.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                ✓ Sidebar Menüsü
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                ✓ Layout
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                ✓ Dashboard
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                → Sonraki: FAZ 3 (Veritabanı)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
