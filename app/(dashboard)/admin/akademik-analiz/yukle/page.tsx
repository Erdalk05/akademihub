/**
 * ============================================
 * AkademiHub - Akıllı Optik Okuma & Veri Aktarımı
 * ============================================
 * 
 * PHASE 8.6 - TAMAMEN YENİ TASARIM
 * 
 * "Kullanıcı sütun düşünmemeli. Sistem düşünmeli."
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet, Camera, FileText, CheckCircle, Sparkles } from 'lucide-react';
import SmartOpticalImport from '@/lib/sinavlar/import/ui/SmartOpticalImport';

type Step = 'select' | 'import' | 'success';

export default function VeriAktarimiPage() {
  const [step, setStep] = useState<Step>('select');
  const [importResult, setImportResult] = useState<{rowCount: number; fields: string[]} | null>(null);
  
  // ==================== SUCCESS SCREEN ====================
  if (step === 'success' && importResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-8 animate-pulse">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            🎉 Veri Aktarımı Başarılı!
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            {importResult.rowCount} satır başarıyla işlendi.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {importResult.fields.map((field, idx) => (
              <span 
                key={idx}
                className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
              >
                ✓ {field}
              </span>
            ))}
          </div>
          
          <div className="flex justify-center gap-4">
            <Link
              href="/admin/akademik-analiz"
              className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              ← Geri Dön
            </Link>
            <Link
              href="/admin/akademik-analiz/sinavlar"
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-colors shadow-lg"
            >
              Sınavları Görüntüle →
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // ==================== IMPORT SCREEN ====================
  if (step === 'import') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setStep('select')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Akıllı Optik Okuma
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Dosyanızı yükleyin, sistem otomatik analiz etsin
              </p>
            </div>
          </div>
          
          {/* Smart Import Component */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <SmartOpticalImport
              examId="demo-exam"
              examName="Sınav Aktarımı"
              onComplete={(data) => {
                console.log('Import tamamlandı:', data);
                setImportResult({
                  rowCount: data.rows.length,
                  fields: data.assignments.map(a => {
                    const labels: Record<string, string> = {
                      tc: 'TC Kimlik',
                      student_no: 'Öğrenci No',
                      name: 'Ad Soyad',
                      class: 'Sınıf',
                      booklet: 'Kitapçık',
                      answers: 'Cevaplar'
                    };
                    return labels[a.field] || a.field;
                  })
                });
                setStep('success');
              }}
              onBack={() => setStep('select')}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // ==================== SELECT SCREEN ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
        
        {/* NEW: Smart Import Card - Primary Action */}
        <div className="mb-8">
          <div 
            onClick={() => setStep('import')}
            className="group cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            </div>
            
            <div className="relative flex items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    🔍 Akıllı Optik Okuma
                  </h2>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium text-white">
                    YENİ
                  </span>
                </div>
                <p className="text-blue-100 mb-4 max-w-xl">
                  Excel, CSV veya TXT dosyanızı yükleyin. Sistem otomatik olarak verileri analiz eder, 
                  alanları tespit eder ve tek tıkla eşleştirmenizi sağlar.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-sm text-white flex items-center gap-1">
                    ✓ Otomatik alan tespiti
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-sm text-white flex items-center gap-1">
                    ✓ Tek sütun veri desteği
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-sm text-white flex items-center gap-1">
                    ✓ Türkçe OCR düzeltme
                  </span>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-blue-600 rotate-180" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Other Options */}
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Diğer Seçenekler
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Optik Form */}
          <ImportOptionCard
            icon={<FileText className="w-8 h-8" />}
            title="Optik Form Şablonu"
            description="Optik okuyucunuz için hazır şablon indirin."
            buttonText="Şablon İndir"
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
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            📋 Nasıl Çalışır?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard
              number={1}
              title="Dosya Yükle"
              description="Excel, CSV veya TXT dosyanızı sürükleyip bırakın."
            />
            <StepCard
              number={2}
              title="Alanları Eşleştir"
              description="Sistem otomatik tanır, siz sadece onaylayın."
            />
            <StepCard
              number={3}
              title="Tamamla"
              description="Analizler otomatik hesaplanır, AI yorumları hazırlanır."
            />
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="text-xl">💡</span>
              <span>
                <strong>İpucu:</strong> Optik okuyucu çıktınız tek sütunda mı? Sorun değil! 
                Akıllı sistemimiz verileri otomatik ayırır.
              </span>
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}

// ==================== STEP CARD ====================

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl flex items-center justify-center font-bold shadow-lg">
        {number}
      </span>
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
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
