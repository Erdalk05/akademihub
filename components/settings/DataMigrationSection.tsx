'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, Calendar, Users, CreditCard, CheckCircle, 
  AlertTriangle, Loader2, ArrowRight, RefreshCw, FileText,
  TrendingUp, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAcademicYearStore, getCurrentAcademicYear } from '@/lib/store/academicYearStore';

interface DataMigrationSectionProps {
  organizationId?: string;
}

interface MigrationStats {
  students: number;
  installments: number;
  otherIncome: number;
}

export default function DataMigrationSection({ organizationId }: DataMigrationSectionProps) {
  const { availableYears } = useAcademicYearStore();
  const currentYear = getCurrentAcademicYear();
  
  const [sourceYear, setSourceYear] = useState('');
  const [targetYear, setTargetYear] = useState(currentYear);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sourceStats, setSourceStats] = useState<MigrationStats | null>(null);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  // Kaynak yıl değiştiğinde analiz yap
  useEffect(() => {
    if (sourceYear && organizationId) {
      analyzeSourceYear();
    }
  }, [sourceYear, organizationId]);

  const analyzeSourceYear = async () => {
    if (!sourceYear || !organizationId) return;
    
    setIsAnalyzing(true);
    setSourceStats(null);
    
    try {
      const response = await fetch(
        `/api/migration/analyze?sourceYear=${sourceYear}&organizationId=${organizationId}`
      );
      const result = await response.json();
      
      if (result.success) {
        setSourceStats(result.data);
      } else {
        toast.error(result.error || 'Analiz yapılamadı');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMigration = async () => {
    if (!sourceYear || !targetYear || !organizationId) {
      toast.error('Lütfen kaynak ve hedef yılı seçin');
      return;
    }

    if (sourceYear === targetYear) {
      toast.error('Kaynak ve hedef yıl aynı olamaz');
      return;
    }

    const confirmed = window.confirm(
      `${sourceYear} yılındaki ${sourceStats?.students || 0} öğrenci kaydını ${targetYear} yılına aktarmak istediğinize emin misiniz?\n\n` +
      `Bu işlem:\n` +
      `• Öğrencilerin academic_year alanını ${targetYear} olarak güncelleyecek\n` +
      `• Ödenmemiş taksitleri yeni yıla taşıyacak\n` +
      `• Ödenmiş taksitler korunacak`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setMigrationComplete(false);
    
    try {
      const response = await fetch('/api/migration/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceYear,
          targetYear,
          organizationId,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMigrationComplete(true);
        setMigrationResult(result.data);
        toast.success(`${result.data.studentsUpdated} öğrenci başarıyla aktarıldı!`);
      } else {
        toast.error(result.error || 'Aktarım başarısız');
      }
    } catch (error) {
      toast.error('Bağlantı hatası');
    } finally {
      setIsLoading(false);
    }
  };

  const pastYears = availableYears.filter(y => y !== currentYear && y < currentYear);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Geçmiş Yıllardan Veri Aktarımı</h2>
          <p className="text-sm text-slate-500">Önceki akademik yıllardan kayıtları yeni yıla aktarın</p>
        </div>
      </div>

      {/* Uyarı */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Önemli Bilgi</p>
          <p className="text-xs text-amber-700 mt-1">
            Bu işlem öğrencilerin akademik yılını değiştirir. Ödenmiş taksitler korunur, 
            sadece ödenmemiş taksitler ve öğrenci bilgileri yeni yıla aktarılır.
          </p>
        </div>
      </div>

      {/* Yıl Seçimi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Kaynak Yıl */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Kaynak Yıl (Eski)
          </label>
          <select
            value={sourceYear}
            onChange={(e) => setSourceYear(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seçiniz...</option>
            {pastYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Ok */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Hedef Yıl */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Hedef Yıl (Yeni)
          </label>
          <select
            value={targetYear}
            onChange={(e) => setTargetYear(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analiz Sonuçları */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-slate-600">Veriler analiz ediliyor...</span>
        </div>
      )}

      {sourceStats && !isAnalyzing && (
        <div className="bg-slate-50 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            {sourceYear} Yılı Verileri
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{sourceStats.students}</p>
                  <p className="text-xs text-slate-500">Öğrenci</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{sourceStats.installments}</p>
                  <p className="text-xs text-slate-500">Taksit Kaydı</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{sourceStats.otherIncome}</p>
                  <p className="text-xs text-slate-500">Diğer Gelir</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aktarım Butonu */}
      {sourceStats && sourceStats.students > 0 && !migrationComplete && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleMigration}
            disabled={isLoading || !sourceYear || !targetYear}
            className={`
              flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all
              ${isLoading 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 hover:shadow-xl'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Aktarılıyor...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                {sourceStats.students} Öğrenciyi {targetYear} Yılına Aktar
              </>
            )}
          </button>
        </div>
      )}

      {/* Başarı Mesajı */}
      {migrationComplete && migrationResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">Aktarım Tamamlandı!</h3>
              <p className="text-sm text-green-600">Veriler başarıyla yeni yıla aktarıldı</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-2xl font-bold text-green-700">{migrationResult.studentsUpdated}</p>
              <p className="text-xs text-green-600">Öğrenci Aktarıldı</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-2xl font-bold text-green-700">{migrationResult.installmentsUpdated || 0}</p>
              <p className="text-xs text-green-600">Taksit Güncellendi</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setMigrationComplete(false);
              setSourceYear('');
              setSourceStats(null);
            }}
            className="mt-4 flex items-center gap-2 text-green-700 hover:text-green-800 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Yeni Aktarım Yap
          </button>
        </div>
      )}

      {/* Boş Veri */}
      {sourceStats && sourceStats.students === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">Bu yılda aktarılacak öğrenci bulunamadı</p>
          <p className="text-slate-400 text-sm mt-1">Farklı bir yıl seçmeyi deneyin</p>
        </div>
      )}
    </div>
  );
}
