'use client';

import React, { useState, useMemo } from 'react';
import { Grid3X3, Check, Settings, Plus, Save } from 'lucide-react';
import type { WizardStep1Data, WizardStep3Data, OptikFormSablonu } from '@/types/spectra-wizard';
import { OPTIK_SABLONLARI, getSablonlariByTur } from '@/lib/spectra-wizard/optical-parser';
import { cn } from '@/lib/utils';

interface Step3Props {
  step1Data: WizardStep1Data;
  data: WizardStep3Data | null;
  onChange: (data: WizardStep3Data) => void;
}

export function Step3OptikSablon({ step1Data, data, onChange }: Step3Props) {
  const [sablonKaynagi, setSablonKaynagi] = useState<'kutuphane' | 'ozel'>(data?.sablonKaynagi || 'kutuphane');

  // Sınav türüne uygun şablonlar
  const uygunSablonlar = useMemo(() => {
    return getSablonlariByTur(step1Data.sinavTuru);
  }, [step1Data.sinavTuru]);

  // Seçili şablon
  const seciliSablon = data?.optikSablon || uygunSablonlar[0];

  // Şablon seç
  const handleSablonSec = (sablon: OptikFormSablonu) => {
    onChange({
      optikSablon: sablon,
      sablonKaynagi: 'kutuphane',
    });
  };

  return (
    <div className="space-y-6">
      {/* Kaynak Seçimi */}
      <div className="flex gap-3 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setSablonKaynagi('kutuphane')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all',
            sablonKaynagi === 'kutuphane'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Grid3X3 size={16} />
          Hazır Şablonlar
        </button>
        <button
          onClick={() => setSablonKaynagi('ozel')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all',
            sablonKaynagi === 'ozel'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Settings size={16} />
          Özel Şablon
        </button>
      </div>

      {/* HAZIR ŞABLONLAR */}
      {sablonKaynagi === 'kutuphane' && (
        <div className="space-y-4">
          {uygunSablonlar.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Grid3X3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Bu sınav türü için hazır şablon bulunamadı.</p>
              <button
                onClick={() => setSablonKaynagi('ozel')}
                className="mt-3 text-emerald-600 font-medium hover:underline"
              >
                Özel şablon oluştur →
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {uygunSablonlar.map((sablon) => {
                const isSecili = seciliSablon?.id === sablon.id;
                return (
                  <button
                    key={sablon.id}
                    onClick={() => handleSablonSec(sablon)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all text-left',
                      isSecili
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{sablon.ad}</p>
                        <p className="text-sm text-gray-500 mt-1">{sablon.yayinevi}</p>
                        <p className="text-xs text-gray-400 mt-2">{sablon.aciklama}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isSecili && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-emerald-600">
                          {sablon.toplamSoru} soru
                        </span>
                      </div>
                    </div>

                    {/* Alan Önizleme */}
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
                      <div className="text-gray-500">
                        <span className="font-medium">Öğrenci No:</span> {sablon.alanlar.ogrenciNo.baslangic}-{sablon.alanlar.ogrenciNo.bitis}
                      </div>
                      <div className="text-gray-500">
                        <span className="font-medium">Öğrenci Adı:</span> {sablon.alanlar.ogrenciAdi.baslangic}-{sablon.alanlar.ogrenciAdi.bitis}
                      </div>
                      <div className="text-gray-500">
                        <span className="font-medium">Cevaplar:</span> {sablon.alanlar.cevaplar.baslangic}-{sablon.alanlar.cevaplar.bitis}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ÖZEL ŞABLON */}
      {sablonKaynagi === 'ozel' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-700">
              <strong>⚙️ Özel Şablon:</strong> Kendi optik okuyucu formatınızı tanımlayın. Her alanın karakter başlangıç ve bitiş pozisyonlarını girin.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şablon Adı</label>
              <input
                type="text"
                placeholder="Örn: Kurum Özel Şablon"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Satır Uzunluğu</label>
              <input
                type="number"
                placeholder="Örn: 171"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-700 mb-3">Alan Tanımları (Karakter Pozisyonları)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { id: 'ogrenciNo', label: 'Öğrenci No', zorunlu: true },
                { id: 'ogrenciAdi', label: 'Öğrenci Adı', zorunlu: true },
                { id: 'cevaplar', label: 'Cevaplar', zorunlu: true },
                { id: 'kitapcik', label: 'Kitapçık', zorunlu: false },
                { id: 'sinif', label: 'Sınıf', zorunlu: false },
                { id: 'tcKimlik', label: 'TC Kimlik', zorunlu: false },
              ].map((alan) => (
                <div key={alan.id}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {alan.label} {alan.zorunlu && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Başl."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Bitiş"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
            <Save size={18} />
            Şablonu Kaydet
          </button>
        </div>
      )}

      {/* Seçili Şablon Özeti */}
      {seciliSablon && sablonKaynagi === 'kutuphane' && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm text-emerald-700">
            <strong>✅ Seçili Şablon:</strong> {seciliSablon.ad} - {seciliSablon.toplamSoru} soru, satır uzunluğu: {seciliSablon.satirUzunlugu} karakter
          </p>
        </div>
      )}
    </div>
  );
}

export default Step3OptikSablon;

