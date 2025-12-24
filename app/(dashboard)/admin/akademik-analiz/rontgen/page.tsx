/**
 * ============================================
 * AkademiHub - Akademik Röntgen
 * ============================================
 * 
 * PHASE 8.5 - Academic X-Ray
 * Sınıf, ders ve konu bazlı karşılaştırmalı analiz
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, Users } from 'lucide-react';

type ViewMode = 'class' | 'subject' | 'topic';

export default function RontgenPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('class');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/akademik-analiz"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-500" />
              Akademik Röntgen
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Karşılaştırmalı derinlemesine analiz
            </p>
          </div>
        </div>
        
        {/* View Mode Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-8 w-fit">
          <ViewModeButton
            active={viewMode === 'class'}
            onClick={() => setViewMode('class')}
            icon={<Users className="w-4 h-4" />}
            label="Sınıflar"
          />
          <ViewModeButton
            active={viewMode === 'subject'}
            onClick={() => setViewMode('subject')}
            icon={<BarChart3 className="w-4 h-4" />}
            label="Dersler"
          />
          <ViewModeButton
            active={viewMode === 'topic'}
            onClick={() => setViewMode('topic')}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Konular"
          />
        </div>
        
        {/* View Description */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-200 dark:border-purple-800 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              {viewMode === 'class' ? '🏫' : viewMode === 'subject' ? '📚' : '📊'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                {viewMode === 'class' && 'Sınıf Karşılaştırması'}
                {viewMode === 'subject' && 'Ders Bazlı Analiz'}
                {viewMode === 'topic' && 'Konu Bazlı Derinlik'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {viewMode === 'class' && 'Sınıfların genel performansını yan yana görün. Hangi sınıf nerede güçlü?'}
                {viewMode === 'subject' && 'Her dersin kurum geneli performansını inceleyin. Odak gerektiren dersler neler?'}
                {viewMode === 'topic' && 'Konu bazında derinlemesine bakış. Hangi kazanımlar pekiştirilmeli?'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Analysis Placeholder */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {viewMode === 'class' && 'Sınıf Performans Karşılaştırması'}
              {viewMode === 'subject' && 'Ders Performans Analizi'}
              {viewMode === 'topic' && 'Konu Bazlı Başarı Haritası'}
            </h2>
          </div>
          
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              Analiz için Veri Gerekli
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Sınav sonuçları yüklendikten sonra karşılaştırmalı analizler burada görünür.
            </p>
            <Link
              href="/admin/akademik-analiz/yukle"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Veri Yükle
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}

function ViewModeButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
        active
          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

