'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Target, Copy, FileSpreadsheet, Library, ChevronDown, ChevronRight, Check, RefreshCw, Save, Trash2 } from 'lucide-react';
import type { WizardStep1Data, WizardStep2Data, CevapAnahtari, CevapAnahtariItem, CevapSecenegi, DersDagilimi, KitapcikTuru } from '@/types/spectra-wizard';
import { createEmptyCevapAnahtari, parseCevapString, parseDersBazliCevaplar, updateSoruCevap, validateCevapAnahtari } from '@/lib/spectra-wizard/answer-key-parser';
import { getDersDagilimi, DERS_RENKLERI } from '@/lib/spectra-wizard/exam-configs';
import { cn } from '@/lib/utils';

interface Step2Props {
  step1Data: WizardStep1Data;
  data: WizardStep2Data | null;
  organizationId: string;
  onChange: (data: WizardStep2Data) => void;
}

type GirisYontemi = 'manuel' | 'yapistir' | 'dosya' | 'kutuphane';

export function Step2CevapAnahtari({ step1Data, data, organizationId, onChange }: Step2Props) {
  const [girisYontemi, setGirisYontemi] = useState<GirisYontemi>(data?.girisYontemi || 'manuel');
  const [expandedDersler, setExpandedDersler] = useState<Set<string>>(new Set());
  const [aktifKitapcik, setAktifKitapcik] = useState<KitapcikTuru>('A');
  const [yapistirInputlar, setYapistirInputlar] = useState<Record<string, string>>({});

  // Ders dağılımı
  const dersDagilimi = useMemo(() => {
    return getDersDagilimi(step1Data.sinavTuru, step1Data.sinifSeviyesi);
  }, [step1Data.sinavTuru, step1Data.sinifSeviyesi]);

  // Cevap anahtarını oluştur veya mevcut olanı kullan
  const cevapAnahtari: CevapAnahtari = useMemo(() => {
    if (data?.cevapAnahtari) return data.cevapAnahtari;
    return createEmptyCevapAnahtari(
      organizationId,
      step1Data.sinavTuru,
      step1Data.sinifSeviyesi,
      dersDagilimi,
      step1Data.kitapcikTurleri.length
    );
  }, [data?.cevapAnahtari, organizationId, step1Data, dersDagilimi]);

  // Toplam soru sayısı
  const toplamSoru = dersDagilimi.reduce((s, d) => s + d.soruSayisi, 0);

  // Validasyon
  const validation = useMemo(() => {
    return validateCevapAnahtari(cevapAnahtari, toplamSoru);
  }, [cevapAnahtari, toplamSoru]);

  // Cevap güncelle
  const handleCevapChange = useCallback((soruNo: number, cevap: CevapSecenegi) => {
    const newAnahtar = updateSoruCevap(cevapAnahtari, soruNo, cevap, aktifKitapcik);
    onChange({
      cevapAnahtari: newAnahtar,
      girisYontemi,
    });
  }, [cevapAnahtari, aktifKitapcik, girisYontemi, onChange]);

  // Yapıştır - Ders bazlı
  const handleYapistir = useCallback(() => {
    const dersCevaplari = Object.entries(yapistirInputlar).map(([dersKodu, cevapString]) => ({
      dersKodu,
      cevapString,
    }));

    const { items, hatalar } = parseDersBazliCevaplar(dersCevaplari, dersDagilimi);

    if (hatalar.length > 0) {
      console.warn('Parse hataları:', hatalar);
    }

    const newAnahtar: CevapAnahtari = {
      ...cevapAnahtari,
      items,
    };

    onChange({
      cevapAnahtari: newAnahtar,
      girisYontemi: 'yapistir',
    });
  }, [yapistirInputlar, dersDagilimi, cevapAnahtari, onChange]);

  // Ders genişlet/daralt
  const toggleDers = (dersKodu: string) => {
    const newSet = new Set(expandedDersler);
    if (newSet.has(dersKodu)) {
      newSet.delete(dersKodu);
    } else {
      newSet.add(dersKodu);
    }
    setExpandedDersler(newSet);
  };

  // Tüm dersleri genişlet
  const expandAll = () => {
    setExpandedDersler(new Set(dersDagilimi.map(d => d.dersKodu)));
  };

  return (
    <div className="space-y-6">
      {/* Giriş Yöntemi Seçimi */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl">
        {[
          { id: 'manuel' as const, label: 'Manuel Giriş', icon: <Target size={16} /> },
          { id: 'yapistir' as const, label: 'Sürükle-Bırak', icon: <Copy size={16} /> },
          { id: 'dosya' as const, label: 'Dosya Yükle', icon: <FileSpreadsheet size={16} /> },
          { id: 'kutuphane' as const, label: 'Kütüphane', icon: <Library size={16} /> },
        ].map((yontem) => (
          <button
            key={yontem.id}
            onClick={() => setGirisYontemi(yontem.id)}
            className={cn(
              'flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all',
              girisYontemi === yontem.id
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {yontem.icon}
            {yontem.label}
          </button>
        ))}
      </div>

      {/* Kitapçık Seçimi */}
      {step1Data.kitapcikTurleri.length > 1 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <span className="text-sm font-medium text-amber-800">📚 Kitapçık Seç:</span>
          <div className="flex gap-2">
            {step1Data.kitapcikTurleri.map((kit) => (
              <button
                key={kit}
                onClick={() => setAktifKitapcik(kit)}
                className={cn(
                  'w-10 h-10 rounded-lg font-bold text-lg transition-all',
                  aktifKitapcik === kit
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                )}
              >
                {kit}
              </button>
            ))}
          </div>
          <span className="text-xs text-amber-600 ml-auto">
            Aktif: Kitapçık {aktifKitapcik} ({validation.stats.doldurulanSoru}/{toplamSoru} cevap)
          </span>
        </div>
      )}

      {/* MANUEL GİRİŞ */}
      {girisYontemi === 'manuel' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-700">⚡ Hızlı Ders Bazlı Cevap Girişi - Kitapçık {aktifKitapcik}</h4>
            <button
              onClick={expandAll}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              Tümünü Genişlet
            </button>
          </div>

          {dersDagilimi.map((ders) => {
            const renkler = DERS_RENKLERI[ders.dersKodu] || { bg: 'bg-gray-500', text: 'text-gray-600', icon: '📚' };
            const isExpanded = expandedDersler.has(ders.dersKodu);
            const dersItems = cevapAnahtari.items.filter(i => i.dersKodu === ders.dersKodu);
            const doldurulan = dersItems.filter(i => i.dogruCevap).length;

            return (
              <div key={ders.dersKodu} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Ders Başlığı */}
                <button
                  onClick={() => toggleDers(ders.dersKodu)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{renkler.icon}</span>
                    <div className="text-left">
                      <p className={cn('font-semibold', renkler.text)}>{ders.dersAdi}</p>
                      <p className="text-xs text-gray-500">{ders.soruSayisi} Soru</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${(doldurulan / ders.soruSayisi) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{doldurulan}/{ders.soruSayisi}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                  </div>
                </button>

                {/* Cevap Girişi */}
                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {dersItems.map((item) => (
                        <div key={item.soruNo} className="relative">
                          <span className="absolute -top-1 -left-1 text-[10px] text-gray-400 font-medium">
                            {item.soruNo}
                          </span>
                          <div className="flex gap-0.5">
                            {(['A', 'B', 'C', 'D', 'E'] as CevapSecenegi[]).map((secen) => (
                              <button
                                key={secen}
                                onClick={() => handleCevapChange(item.soruNo, item.dogruCevap === secen ? null : secen)}
                                className={cn(
                                  'w-6 h-6 rounded text-xs font-bold transition-all',
                                  item.dogruCevap === secen
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-gray-400 border border-gray-200 hover:border-emerald-300'
                                )}
                              >
                                {secen}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* YAPISTIR (Sürükle-Bırak) */}
      {girisYontemi === 'yapistir' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>💡 Kullanım:</strong> Her ders için cevapları yapıştırın (örn: ABCDABCD...). Format: sadece A-B-C-D-E harfleri.
            </p>
          </div>

          {dersDagilimi.map((ders) => {
            const renkler = DERS_RENKLERI[ders.dersKodu] || { icon: '📚' };
            const inputValue = yapistirInputlar[ders.dersKodu] || '';
            const girilmisSayi = inputValue.replace(/[^ABCDE]/gi, '').length;

            return (
              <div key={ders.dersKodu} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-lg">{renkler.icon}</span>
                  <span className="font-medium text-gray-700">{ders.dersAdi}</span>
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setYapistirInputlar(prev => ({ ...prev, [ders.dersKodu]: e.target.value.toUpperCase() }))}
                    placeholder={`${ders.soruSayisi} cevap girin (A-E)...`}
                    className="w-full px-4 py-2.5 pr-16 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                  />
                  <span className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium',
                    girilmisSayi === ders.soruSayisi ? 'text-emerald-600' : 'text-gray-400'
                  )}>
                    {girilmisSayi}/{ders.soruSayisi}
                  </span>
                </div>
                {girilmisSayi === ders.soruSayisi && (
                  <Check className="text-emerald-500" size={20} />
                )}
              </div>
            );
          })}

          <button
            onClick={handleYapistir}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Cevapları Uygula
          </button>
        </div>
      )}

      {/* DOSYA YÜKLE */}
      {girisYontemi === 'dosya' && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Excel veya CSV dosyasını buraya sürükleyin</p>
          <p className="text-sm text-gray-400 mb-4">.xlsx, .xls, .csv formatları desteklenir</p>
          <button className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600">
            Dosya Seç
          </button>
        </div>
      )}

      {/* KÜTÜPHANE */}
      {girisYontemi === 'kutuphane' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-sm text-purple-700">
              <strong>📚 Cevap Anahtarı Kütüphanesi:</strong> Daha önce kaydettiğiniz cevap anahtarlarından seçin veya mevcut anahtarı kaydedin.
            </p>
          </div>
          
          <div className="flex gap-3">
            <select className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
              <option value="">SEÇİNİZ...</option>
              <option value="1">ÖZDEBİR LGS DENEME 1</option>
              <option value="2">NAR TYT DENEME 5</option>
            </select>
            <button className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              <RefreshCw size={18} className="text-gray-600" />
            </button>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ön: ÖZDEBİR LGS DENEME 1"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl"
            />
            <button className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center gap-2">
              <Save size={18} />
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Özet İstatistik */}
      <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{validation.stats.doldurulanSoru}</p>
            <p className="text-xs text-gray-500">Girildi</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{validation.stats.bosKalanSoru}</p>
            <p className="text-xs text-gray-500">Boş</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{validation.stats.iptalSoru}</p>
            <p className="text-xs text-gray-500">İptal</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            'text-sm font-medium',
            validation.valid ? 'text-emerald-600' : 'text-amber-600'
          )}>
            {validation.valid ? '✅ Hazır' : `⚠️ ${validation.stats.bosKalanSoru} soru eksik`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Step2CevapAnahtari;

