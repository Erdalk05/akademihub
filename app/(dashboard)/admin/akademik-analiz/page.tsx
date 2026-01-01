'use client';

/**
 * Exam Intelligence Platform - Giriş (Hub) Sayfası
 * Kullanıcıları ana dashboard'a yönlendirir
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Brain, ArrowRight, BarChart3, TrendingUp, Users, Award } from 'lucide-react';

export default function ExamIntelligencePlatformHub() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl shadow-2xl shadow-emerald-200 mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Exam Intelligence Platform
          </h1>
          
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Bu modül sınav verilerinden ileri seviye analiz ve karar desteği üretir.
          </p>
        </div>

        {/* Main CTA Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="space-y-6">
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">İstatistiksel Analiz</p>
                  <p className="text-xs text-slate-500">Net, yüzdelik, dağılım</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">Trend Takibi</p>
                  <p className="text-xs text-slate-500">Performans gidişatı</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">Risk Analizi</p>
                  <p className="text-xs text-slate-500">Erken uyarı sistemi</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">Segmentasyon</p>
                  <p className="text-xs text-slate-500">Sınıf ve öğrenci grupları</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => router.push('/admin/akademik-analiz/exam-dashboard')}
              className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all group"
            >
              <span>Exam Intelligence Dashboard'a Git</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="text-center text-sm text-slate-500">
          <p>Gelişmiş analiz ve görselleştirme araçlarına erişmek için dashboard'a gidin.</p>
        </div>
      </div>
    </div>
  );
}
