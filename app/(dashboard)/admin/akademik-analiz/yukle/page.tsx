/**
 * ============================================
 * AkademiHub - Veri Aktarımı Sayfası
 * ============================================
 * 
 * PHASE 8.5 - Import Wizard Entegrasyonu
 * 
 * Bu sayfa:
 * - Excel/CSV yükleme
 * - Optik form aktarımı
 * - Fotoğraf ile cevap okuma (gelecek)
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet, Camera, FileText } from 'lucide-react';
import { ImportWizard } from '@/lib/sinavlar/import';

export default function VeriAktarimiPage() {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  
  if (showWizard && selectedExamId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <ImportWizard
            examId={selectedExamId}
            examName="Seçili Sınav"
            onComplete={(result) => {
              console.log('Import tamamlandı:', result);
              // TODO: Başarı sayfasına yönlendir
            }}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/akademik-analiz"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Veri Aktarımı
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Sınav sonuçlarını sisteme yükleyin
            </p>
          </div>
        </div>
        
        {/* Import Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Excel/CSV */}
          <ImportOptionCard
            icon={<FileSpreadsheet className="w-8 h-8" />}
            title="Excel / CSV"
            description="Hazır tablolarınızı yükleyin. Sistem otomatik olarak sütunları tanır."
            buttonText="Excel Yükle"
            colorTheme="emerald"
            onClick={() => {
              // TODO: Sınav seçimi modalı aç
              setSelectedExamId('demo-exam-id');
              setShowWizard(true);
            }}
          />
          
          {/* Optik Form */}
          <ImportOptionCard
            icon={<FileText className="w-8 h-8" />}
            title="Optik Form"
            description="Optik okuyucudan gelen verileri aktarın."
            buttonText="Optik Aktar"
            colorTheme="blue"
            badge="Yakında"
            disabled
          />
          
          {/* Fotoğraf */}
          <ImportOptionCard
            icon={<Camera className="w-8 h-8" />}
            title="Fotoğraf ile Okuma"
            description="Cevap kağıdını fotoğraflayın, AI cevapları tanısın."
            buttonText="Fotoğraf Çek"
            colorTheme="purple"
            badge="Yakında"
            disabled
          />
          
        </div>
        
        {/* Instructions */}
        <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            📋 Excel Yükleme Rehberi
          </h2>
          
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p>Excel dosyanızda öğrenci numarası ve cevaplar olmalı. Sistem sütunları otomatik tanır.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p>Eşleşmeyen öğrenciler için sistem size seçenekler sunar. Hiçbir veri kaybolmaz.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p>Yükleme tamamlandığında analizler otomatik hesaplanır ve AI yorumları hazırlanır.</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              💡 <strong>İpucu:</strong> İlk sütun öğrenci numarası, sonraki sütunlar soru cevapları olursa en hızlı sonucu alırsınız.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}

// ==================== IMPORT OPTION CARD ====================

interface ImportOptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  colorTheme: 'emerald' | 'blue' | 'purple';
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
}

function ImportOptionCard({
  icon,
  title,
  description,
  buttonText,
  colorTheme,
  badge,
  disabled,
  onClick
}: ImportOptionCardProps) {
  const colorStyles = {
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      button: 'bg-emerald-600 hover:bg-emerald-700'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      button: 'bg-purple-600 hover:bg-purple-700'
    }
  };
  
  return (
    <div className={`relative rounded-xl overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
      {badge && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium text-white z-10">
          {badge}
        </div>
      )}
      
      <div className={`${colorStyles[colorTheme].bg} p-6 text-white`}>
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-white/80 text-sm mb-6">{description}</p>
        
        <button
          onClick={onClick}
          disabled={disabled}
          className={`w-full py-3 ${colorStyles[colorTheme].button} rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

