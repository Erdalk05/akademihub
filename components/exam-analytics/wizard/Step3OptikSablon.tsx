'use client';

/**
 * Step 3 - Optik Şablon Seçimi
 */

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Check, SkipForward, Settings, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EAOptikSablon } from '@/types/exam-analytics';
import { UseExamWizardReturn } from '@/hooks/useExamWizard';

interface Step3Props {
  wizard: UseExamWizardReturn;
  organizationId: string;
}

export function Step3OptikSablon({ wizard, organizationId }: Step3Props) {
  const { state, setOptikSablon, skipOptikSablon } = wizard;
  const { step3 } = state;

  const [sablonlar, setSablonlar] = useState<EAOptikSablon[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [secim, setSecim] = useState<'mevcut' | 'olustur' | 'atla'>('mevcut');

  // Şablonları yükle (gerçek API hazır olduğunda)
  useEffect(() => {
    // Mock data - API hazır olduğunda değiştirilecek
    setSablonlar([
      {
        id: 'default-k12',
        organization_id: organizationId,
        sablon_adi: 'K12Net Standart',
        aciklama: '15 alan, 200 karakter',
        format_tipi: 'fixed_width',
        satir_uzunlugu: 200,
        alan_tanimlari: [],
        cevap_baslangic: 100,
        cevap_uzunluk: 90,
        is_active: true,
        is_default: true,
      },
      {
        id: 'lgs-format',
        organization_id: organizationId,
        sablon_adi: 'LGS Formatı',
        aciklama: '10 alan, 150 karakter',
        format_tipi: 'fixed_width',
        satir_uzunlugu: 150,
        alan_tanimlari: [],
        cevap_baslangic: 60,
        cevap_uzunluk: 90,
        is_active: true,
        is_default: false,
      },
    ]);
  }, [organizationId]);

  const handleSablonSec = (sablonId: string) => {
    setOptikSablon(sablonId);
  };

  const handleAtla = () => {
    setSecim('atla');
    skipOptikSablon();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <FileSpreadsheet className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Optik Şablon</h2>
          <p className="text-sm text-gray-500">TXT dosyasının format yapısını belirleyin</p>
        </div>
      </div>

      {/* Seçim Kartları */}
      <div className="grid grid-cols-3 gap-4">
        {/* Mevcut Şablonlardan Seç */}
        <button
          onClick={() => setSecim('mevcut')}
          className={cn(
            'p-6 rounded-lg border-2 text-left transition-all',
            secim === 'mevcut'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              'w-4 h-4 rounded-full border-2',
              secim === 'mevcut' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            )}>
              {secim === 'mevcut' && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="font-medium">Mevcut Şablonlardan Seç</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Daha önce oluşturulmuş şablonlardan birini seçin
          </p>
        </button>

        {/* Yeni Şablon Oluştur */}
        <button
          onClick={() => setSecim('olustur')}
          className={cn(
            'p-6 rounded-lg border-2 text-left transition-all',
            secim === 'olustur'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              'w-4 h-4 rounded-full border-2',
              secim === 'olustur' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            )}>
              {secim === 'olustur' && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="font-medium">Yeni Şablon Oluştur</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Özel format tanımlayın (yakında)
          </p>
        </button>

        {/* Şablonsuz Devam Et */}
        <button
          onClick={handleAtla}
          className={cn(
            'p-6 rounded-lg border-2 text-left transition-all',
            secim === 'atla'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              'w-4 h-4 rounded-full border-2',
              secim === 'atla' ? 'border-green-500 bg-green-500' : 'border-gray-300'
            )}>
              {secim === 'atla' && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="font-medium">Şablonsuz Devam Et</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Manuel parse veya basit format
          </p>
        </button>
      </div>

      {/* Mevcut Şablonlar Listesi */}
      {secim === 'mevcut' && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-medium text-gray-900">Kayıtlı Şablonlar</h3>
          </div>
          
          <div className="p-4 space-y-3">
            {sablonlar.map((sablon) => (
              <button
                key={sablon.id}
                onClick={() => handleSablonSec(sablon.id)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between',
                  step3.optikSablonId === sablon.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    step3.optikSablonId === sablon.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  )}>
                    {step3.optikSablonId === sablon.id && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{sablon.sablon_adi}</div>
                    <div className="text-sm text-gray-500">{sablon.aciklama}</div>
                  </div>
                </div>
                
                {sablon.is_default && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Varsayılan
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Yeni Şablon Oluştur (Placeholder) */}
      {secim === 'olustur' && (
        <div className="border rounded-lg p-8 text-center bg-gray-50">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Özel Şablon Oluşturma
          </h3>
          <p className="text-gray-500 mb-4">
            Bu özellik yakında eklenecek. Şimdilik mevcut şablonlardan birini seçin veya şablonsuz devam edin.
          </p>
          <button
            onClick={handleAtla}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Şablonsuz Devam Et
          </button>
        </div>
      )}

      {/* Bilgi Kutusu */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Optik Şablon Nedir?</p>
          <p>
            Optik şablon, TXT dosyasındaki öğrenci bilgilerinin (öğrenci no, ad-soyad, sınıf, cevaplar vb.) 
            hangi pozisyonlarda yer aldığını tanımlar. Doğru şablon seçimi, verilerin otomatik olarak 
            doğru şekilde ayrıştırılmasını sağlar.
          </p>
        </div>
      </div>

      {/* Durum */}
      <div className={cn(
        'p-4 rounded-lg flex items-center gap-3',
        step3.isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
      )}>
        {step3.isCompleted ? (
          <>
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              {step3.optikSablonId 
                ? `Şablon seçildi: ${sablonlar.find(s => s.id === step3.optikSablonId)?.sablon_adi}`
                : 'Şablonsuz devam edilecek'
              }
            </span>
          </>
        ) : (
          <>
            <SkipForward className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">
              Bir şablon seçin veya şablonsuz devam edin
            </span>
          </>
        )}
      </div>
    </div>
  );
}
