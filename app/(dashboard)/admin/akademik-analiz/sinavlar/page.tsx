/**
 * ============================================
 * AkademiHub - Sınav Yönetimi Sayfası
 * ============================================
 * 
 * PHASE 8.5 - Exam Management
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, FileSpreadsheet, BarChart3, ChevronRight } from 'lucide-react';

export default function SinavlarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/akademik-analiz"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Sınav Yönetimi
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Sınavları oluşturun, düzenleyin ve analiz edin
              </p>
            </div>
          </div>
          
          <Link
            href="/admin/akademik-analiz/sinavlar/yeni"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Sınav
          </Link>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/admin/akademik-analiz/yukle"
            className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <div className="p-3 bg-emerald-500 rounded-lg text-white">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800 dark:text-slate-200">Sonuç Yükle</p>
              <p className="text-sm text-slate-500">Excel veya CSV dosyası ile</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
          
          <Link
            href="/admin/akademik-analiz/rontgen"
            className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="p-3 bg-purple-500 rounded-lg text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800 dark:text-slate-200">Karşılaştırmalı Analiz</p>
              <p className="text-sm text-slate-500">Sınıf ve ders bazlı</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
        </div>
        
        {/* Exam List Placeholder */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Son Sınavlar
            </h2>
          </div>
          
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              Henüz sınav oluşturulmadı
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              İlk sınavınızı oluşturarak başlayın.
            </p>
            <Link
              href="/admin/akademik-analiz/sinavlar/yeni"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Sınav Oluştur
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}

