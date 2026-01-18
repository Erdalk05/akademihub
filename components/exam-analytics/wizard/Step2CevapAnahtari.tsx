'use client';

/**
 * Step 2 - Cevap Anahtarı Editörü
 */

import React, { useState } from 'react';
import { Key, Clipboard, Trash2, ChevronDown, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kitapcik, getDersRenk } from '@/types/exam-analytics';
import { UseExamWizardReturn } from '@/hooks/useExamWizard';

interface Step2Props {
  wizard: UseExamWizardReturn;
}

const KITAPCIKLAR: Kitapcik[] = ['A', 'B', 'C', 'D'];
const SECENEKLER = ['A', 'B', 'C', 'D', 'E'];

export function Step2CevapAnahtari({ wizard }: Step2Props) {
  const { state, setKitapcik, setCevapDizisi, setTumCevaplar } = wizard;
  const { step1, step2 } = state;

  const [topluCevap, setTopluCevap] = useState('');
  const [acikDers, setAcikDers] = useState<string | null>(null);

  // Toplu cevap uygula
  const handleTopluCevapUygula = () => {
    setTumCevaplar(topluCevap);
  };

  // Temizle
  const handleTemizle = () => {
    setTopluCevap('');
    step2.cevaplar.forEach(c => {
      setCevapDizisi(c.dersId, '');
    });
  };

  // Progress hesapla
  const progressYuzde = step2.toplamCevap > 0 
    ? Math.round((step2.girilenCevap / step2.toplamCevap) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Key className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Cevap Anahtarı</h2>
            <p className="text-sm text-gray-500">Her soru için doğru cevabı belirleyin</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {step2.girilenCevap} / {step2.toplamCevap}
          </div>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                progressYuzde === 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progressYuzde}%` }}
            />
          </div>
          <span className="text-sm font-medium">{progressYuzde}%</span>
        </div>
      </div>

      {/* Kitapçık Seçimi */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Kitapçık Seçimi</span>
          <span className="text-xs text-gray-500">Aktif: Kitapçık {step2.kitapcik}</span>
        </div>
        <div className="flex gap-2">
          {KITAPCIKLAR.map((k) => (
            <button
              key={k}
              onClick={() => setKitapcik(k)}
              className={cn(
                'w-16 h-16 rounded-lg border-2 font-semibold text-lg transition-all',
                step2.kitapcik === k
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              )}
            >
              {k}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Farklı kitapçıklar için ayrı cevap anahtarları tanımlanabilir. (Yakında)
        </p>
      </div>

      {/* Tek Seferde Yapıştır */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Tek Seferde Yapıştır</span>
          </div>
          <span className="text-sm text-blue-600">
            {step2.toplamCevap} sorunun tamamını tek alana yapıştırın
          </span>
        </div>
        
        <div className="mb-3">
          <textarea
            value={topluCevap}
            onChange={(e) => setTopluCevap(e.target.value)}
            placeholder={`Örnek: ABCDABCDABCD... (toplam ${step2.toplamCevap} cevap)`}
            className="w-full h-20 px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Desteklenen: ABCDABCD... | A B C D... | Satır satır
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTemizle}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Trash2 className="w-4 h-4" />
            Temizle
          </button>
          <button
            onClick={handleTopluCevapUygula}
            disabled={!topluCevap}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            <Check className="w-4 h-4" />
            Cevapları Uygula
          </button>
        </div>
      </div>

      {/* Hızlı Ders Bazlı Giriş */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-gray-900">⚡ Hızlı Ders Bazlı Cevap Girişi</span>
          <span className="text-sm text-gray-500">Her derse direkt yapıştır</span>
        </div>

        <div className="space-y-3">
          {step2.cevaplar.map((cevap) => {
            const ders = step1.dersler.find(d => d.dersId === cevap.dersId);
            const renk = ders?.renkKodu || getDersRenk(cevap.dersKodu);
            
            return (
              <div key={cevap.dersId} className="border rounded-lg overflow-hidden">
                {/* Ders Başlık */}
                <button
                  onClick={() => setAcikDers(acikDers === cevap.dersId ? null : cevap.dersId)}
                  className="w-full p-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: renk }}
                    />
                    <span className="font-medium">{cevap.dersAdi}</span>
                    <span className="text-sm text-gray-500">
                      Soru {ders?.baslangicSoru}-{ders?.bitisSoru}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full',
                            cevap.tamamlandi ? 'bg-green-500' : 'bg-blue-500'
                          )}
                          style={{ width: `${(cevap.girilenCevap / cevap.soruSayisi) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {cevap.girilenCevap}/{cevap.soruSayisi}
                      </span>
                    </div>
                    
                    {/* Durum */}
                    {cevap.tamamlandi ? (
                      <span className="text-green-600">✓ Tamam</span>
                    ) : (
                      <span className="text-gray-400">✗ Boş</span>
                    )}
                    
                    {acikDers === cevap.dersId ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Ders İçerik */}
                {acikDers === cevap.dersId && (
                  <div className="p-4 border-t bg-white">
                    {/* Hızlı yapıştır */}
                    <div className="mb-4">
                      <input
                        type="text"
                        value={cevap.cevapDizisi}
                        onChange={(e) => setCevapDizisi(cevap.dersId, e.target.value)}
                        placeholder={`${cevap.soruSayisi} cevap yazın veya yapıştırın...`}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Manuel seçim grid */}
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: cevap.soruSayisi }).map((_, idx) => {
                        const soruNo = (ders?.baslangicSoru || 1) + idx;
                        const mevcutCevap = cevap.cevapDizisi[idx] || '';
                        
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-6 text-right text-sm text-gray-500">{soruNo}</span>
                            <div className="flex gap-1">
                              {SECENEKLER.map((secenek) => (
                                <button
                                  key={secenek}
                                  onClick={() => {
                                    const yeniDizi = cevap.cevapDizisi.split('');
                                    yeniDizi[idx] = secenek;
                                    // Boşlukları doldur
                                    while (yeniDizi.length < idx) {
                                      yeniDizi.push(' ');
                                    }
                                    setCevapDizisi(cevap.dersId, yeniDizi.join(''));
                                  }}
                                  className={cn(
                                    'w-6 h-6 text-xs rounded border transition-all',
                                    mevcutCevap === secenek
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                                  )}
                                >
                                  {secenek}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Durum Bar */}
      <div className={cn(
        'p-4 rounded-lg flex items-center gap-3',
        step2.isCompleted ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
      )}>
        {step2.isCompleted ? (
          <>
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Cevap anahtarı tamamlandı! ({step2.girilenCevap} cevap)
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">
              {step2.toplamCevap - step2.girilenCevap} cevap daha girilmeli
            </span>
          </>
        )}
      </div>
    </div>
  );
}
