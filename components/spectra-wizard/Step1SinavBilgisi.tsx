'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { Calendar, FileText, GraduationCap, Settings2, BookOpen, Loader2 } from 'lucide-react';
import type { SinavTuru, SinifSeviyesi, WizardStep1Data } from '@/types/spectra-wizard';
import { SINIF_BILGILERI, SINAV_KONFIGURASYONLARI, getUygunSinavTurleri, getDersDagilimi, DERS_RENKLERI } from '@/lib/spectra-wizard';
import { useScoringRules } from '@/lib/hooks/useScoringRules';

interface Step1Props {
  data: WizardStep1Data | null;
  onChange: (data: WizardStep1Data) => void;
}

export function Step1SinavBilgisi({ data, onChange }: Step1Props) {
  // DB'den kurum puanlama kurallarını çek
  const { loading: rulesLoading, getDefaultRuleWithFallback } = useScoringRules();
  const prevSinavTuru = useRef<SinavTuru | null>(null);

  // Varsayılan değerler
  const formData: WizardStep1Data = data || {
    sinavAdi: '',
    sinavTarihi: new Date().toISOString().split('T')[0],
    sinavTuru: 'LGS',
    sinifSeviyesi: '8',
    kitapcikTurleri: ['A', 'B', 'C', 'D'],
    yanlisKatsayisi: 3,
  };

  // Seçili sınıfa göre uygun sınav türleri
  const uygunSinavTurleri = useMemo(() => {
    return getUygunSinavTurleri(formData.sinifSeviyesi);
  }, [formData.sinifSeviyesi]);

  // Seçili sınav türüne göre ders dağılımı
  const dersDagilimi = useMemo(() => {
    return getDersDagilimi(formData.sinavTuru, formData.sinifSeviyesi);
  }, [formData.sinavTuru, formData.sinifSeviyesi]);

  // Sınav konfigürasyonu (sadece UI bilgileri için)
  const sinavKonfig = SINAV_KONFIGURASYONLARI[formData.sinavTuru];

  // Kurum puanlama kuralı (DB'den veya fallback)
  const kurumPuanlamaKurali = useMemo(() => {
    return getDefaultRuleWithFallback(formData.sinavTuru);
  }, [formData.sinavTuru, getDefaultRuleWithFallback]);

  // Sınav türü değiştiğinde kurum kuralını uygula
  useEffect(() => {
    if (prevSinavTuru.current !== formData.sinavTuru && kurumPuanlamaKurali) {
      prevSinavTuru.current = formData.sinavTuru;
      onChange({
        ...formData,
        yanlisKatsayisi: kurumPuanlamaKurali.yanlisKatsayisi,
        puanlamaAyarlari: kurumPuanlamaKurali,
      });
    }
  }, [formData.sinavTuru, kurumPuanlamaKurali]);

  // Input değişikliği
  const handleChange = (field: keyof WizardStep1Data, value: any) => {
    const newData = { ...formData, [field]: value };

    // Sınıf değişince sınav türünü kontrol et
    if (field === 'sinifSeviyesi') {
      const yeniUygunTurler = getUygunSinavTurleri(value as SinifSeviyesi);
      const mevcutTurUygun = yeniUygunTurler.some(t => t.kod === newData.sinavTuru);
      if (!mevcutTurUygun && yeniUygunTurler.length > 0) {
        newData.sinavTuru = yeniUygunTurler[0].kod;
      }
    }

    // Sınav türü değişince kitapçık türlerini güncelle
    if (field === 'sinavTuru') {
      const yeniKonfig = SINAV_KONFIGURASYONLARI[value as SinavTuru];
      newData.kitapcikTurleri = yeniKonfig?.kitapcikTurleri || ['A'];
      // yanlisKatsayisi useEffect'te kurumPuanlamaKurali'ndan alınacak
    }

    onChange(newData);
  };

  if (rulesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-slate-600">Puanlama kuralları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sınav Adı */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline w-4 h-4 mr-2" />
          Sınav Adı
        </label>
        <input
          type="text"
          value={formData.sinavAdi}
          onChange={(e) => handleChange('sinavAdi', e.target.value)}
          placeholder="Örn: ÖZDEBİR LGS DENEME 1"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Tarih */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline w-4 h-4 mr-2" />
          Sınav Tarihi
        </label>
        <input
          type="date"
          value={formData.sinavTarihi}
          onChange={(e) => handleChange('sinavTarihi', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Sınıf Seviyesi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <GraduationCap className="inline w-4 h-4 mr-2" />
          Sınıf Seviyesi
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-11 gap-2">
          {Object.values(SINIF_BILGILERI).map((sinif) => (
            <button
              key={sinif.seviye}
              onClick={() => handleChange('sinifSeviyesi', sinif.seviye)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.sinifSeviyesi === sinif.seviye
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sinif.seviye === 'mezun' ? 'Mez.' : `${sinif.seviye}.`}
            </button>
          ))}
        </div>
      </div>

      {/* Sınav Türü */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <BookOpen className="inline w-4 h-4 mr-2" />
          Sınav Türü
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {uygunSinavTurleri.map((sinav) => (
            <button
              key={sinav.kod}
              onClick={() => handleChange('sinavTuru', sinav.kod)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                formData.sinavTuru === sinav.kod
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-1">{sinav.icon}</div>
              <p className="font-semibold text-gray-900 text-sm">{sinav.ad.split(' - ')[0]}</p>
              <p className="text-xs text-gray-500">{sinav.toplamSoru > 0 ? `${sinav.toplamSoru} soru` : 'Özel'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Ders Dağılımı Önizleme */}
      {dersDagilimi.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Settings2 size={16} />
            Ders Dağılımı
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {dersDagilimi.map((ders) => {
              const renkler = DERS_RENKLERI[ders.dersKodu] || { bg: 'bg-gray-500', icon: '📚' };
              return (
                <div
                  key={ders.dersKodu}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                >
                  <div className="text-lg mb-1">{renkler.icon}</div>
                  <p className="font-medium text-gray-900 text-xs truncate">{ders.dersAdi}</p>
                  <p className="text-emerald-600 font-bold text-sm">{ders.soruSayisi} Soru</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600 flex-wrap gap-2">
            <span>Toplam: <strong>{dersDagilimi.reduce((s, d) => s + d.soruSayisi, 0)} soru</strong></span>
            <span>Süre: <strong>{sinavKonfig?.sure || 0} dk</strong></span>
            <span>Yanlış: <strong>1/{kurumPuanlamaKurali.yanlisKatsayisi}</strong></span>
            <span>Puan: <strong>{kurumPuanlamaKurali.tabanPuan}-{kurumPuanlamaKurali.tavanPuan}</strong></span>
          </div>
        </div>
      )}

      {/* Kitapçık Türleri */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kitapçık Türleri
        </label>
        <div className="flex gap-3">
          {(['A', 'B', 'C', 'D'] as const).map((kit) => (
            <label
              key={kit}
              className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 cursor-pointer transition-all ${
                formData.kitapcikTurleri.includes(kit)
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.kitapcikTurleri.includes(kit)}
                onChange={(e) => {
                  const newKitapciklar = e.target.checked
                    ? [...formData.kitapcikTurleri, kit]
                    : formData.kitapcikTurleri.filter((k) => k !== kit);
                  handleChange('kitapcikTurleri', newKitapciklar.length > 0 ? newKitapciklar : ['A']);
                }}
                className="sr-only"
              />
              <span className="font-bold text-lg">{kit}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Açıklama (opsiyonel) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Açıklama (Opsiyonel)
        </label>
        <textarea
          value={formData.aciklama || ''}
          onChange={(e) => handleChange('aciklama', e.target.value)}
          placeholder="Sınav hakkında ek notlar..."
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
        />
      </div>
    </div>
  );
}

export default Step1SinavBilgisi;
