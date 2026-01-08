'use client';

import React, { useMemo } from 'react';
import { BarChart3, Users, Trophy, TrendingUp, Save, AlertCircle } from 'lucide-react';
import type { WizardStep1Data, WizardStep2Data, WizardStep4Data, WizardStep5Data, ScoringRuleSnapshot } from '@/types/spectra-wizard';
import { hesaplaTopluSonuclar, hesaplaIstatistikler, ekleTohminiPuanlar, createScoringSnapshot } from '@/lib/spectra-wizard/scoring-engine';
import { SINAV_KONFIGURASYONLARI, getDersDagilimi } from '@/lib/spectra-wizard/exam-configs';
import { cn } from '@/lib/utils';

interface Step5Props {
  step1Data: WizardStep1Data;
  step2Data: WizardStep2Data;
  step4Data: WizardStep4Data;
  examId: string;
  onSave: (step5Data: WizardStep5Data) => void;
  isSaving: boolean;
}

export function Step5Onizleme({ step1Data, step2Data, step4Data, examId, onSave, isSaving }: Step5Props) {
  // Sınav konfigürasyonu
  const sinavKonfig = SINAV_KONFIGURASYONLARI[step1Data.sinavTuru];
  
  // Ders dağılımı
  const dersDagilimi = useMemo(() => {
    return step1Data.ozelDersDagilimi || getDersDagilimi(step1Data.sinavTuru, step1Data.sinifSeviyesi);
  }, [step1Data]);

  // Sonuçları hesapla
  const { sonuclar, istatistikler, scoringSnapshot } = useMemo(() => {
    if (!step4Data.parseResult?.satirlar) {
      return { sonuclar: [], istatistikler: null, scoringSnapshot: null };
    }

    // Puanlama kuralını al (step1'den veya fallback)
    const puanlamaFormulu = step1Data.puanlamaAyarlari || sinavKonfig.puanlamaFormulu;

    const hesaplananSonuclar = hesaplaTopluSonuclar(
      step4Data.parseResult.satirlar,
      step2Data.cevapAnahtari,
      sinavKonfig,
      examId,
      step1Data.iptalSoruMantigi || 'herkese_dogru'
    );

    // Tahmini puanları ekle
    const sonuclarWithPuan = ekleTohminiPuanlar(hesaplananSonuclar, step1Data.sinavTuru, puanlamaFormulu);

    const stats = hesaplaIstatistikler(sonuclarWithPuan);

    // Scoring snapshot oluştur (değişmez kural kaydı)
    let snapshot: ScoringRuleSnapshot | null = null;
    if (puanlamaFormulu) {
      snapshot = createScoringSnapshot(
        step1Data.sinavTuru,
        puanlamaFormulu,
        dersDagilimi,
        step1Data.iptalSoruMantigi || 'herkese_dogru'
      );
    }

    return { sonuclar: sonuclarWithPuan, istatistikler: stats, scoringSnapshot: snapshot };
  }, [step4Data.parseResult, step2Data.cevapAnahtari, sinavKonfig, examId, step1Data, dersDagilimi]);

  // Kaydet butonuna tıklandığında
  const handleSave = () => {
    if (!istatistikler || sonuclar.length === 0) return;

    const step5Data: WizardStep5Data = {
      sonuclar,
      istatistikler,
      onayDurumu: 'onaylandi',
      scoringSnapshot: scoringSnapshot || undefined,
      kayitSecenekleri: {
        hemenHesapla: true,
        taslakKaydet: false,
        portaldeGoster: true,
      },
    };

    onSave(step5Data);
  };

  if (!istatistikler || sonuclar.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
        <p className="text-gray-600">Önizleme için veri bulunamadı.</p>
        <p className="text-sm text-gray-400">Lütfen önceki adımları kontrol edin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sınav Bilgisi */}
      <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{step1Data.sinavAdi || 'İsimsiz Sınav'}</h3>
            <p className="text-emerald-100">
              {step1Data.sinavTarihi} • {sinavKonfig.ad}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{istatistikler.toplamKatilimci}</p>
            <p className="text-emerald-100">Katılımcı</p>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Ortalama Net</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{istatistikler.ortalamaNet}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Trophy size={18} />
            <span className="text-sm font-medium">En Yüksek</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{istatistikler.enYuksekNet}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <BarChart3 size={18} />
            <span className="text-sm font-medium">Medyan</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{istatistikler.medyan}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Users size={18} />
            <span className="text-sm font-medium">Asil / Misafir</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {istatistikler.asilKatilimci} / {istatistikler.misafirKatilimci}
          </p>
        </div>
      </div>

      {/* Puanlama Kuralı Bilgisi */}
      {step1Data.puanlamaAyarlari && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
          <span className="font-medium text-blue-800">📊 Kurum Puanlama Kuralı: </span>
          <span className="text-blue-700">
            1/{step1Data.puanlamaAyarlari.yanlisKatsayisi} yanlış, 
            {step1Data.puanlamaAyarlari.tabanPuan}-{step1Data.puanlamaAyarlari.tavanPuan} puan
          </span>
        </div>
      )}

      {/* D/Y/B Özet */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h4 className="font-semibold text-gray-700 mb-3">Genel Dağılım</h4>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500"></div>
            <span className="text-sm text-gray-600">Doğru: <strong>{istatistikler.ortalamaDogru}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600">Yanlış: <strong>{istatistikler.ortalamaYanlis}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-300"></div>
            <span className="text-sm text-gray-600">Boş: <strong>{istatistikler.ortalamaBos}</strong></span>
          </div>
          <div className="ml-auto">
            <span className="text-sm text-gray-500">Standart Sapma: <strong>{istatistikler.standartSapma}</strong></span>
          </div>
        </div>
      </div>

      {/* Ders Bazlı Ortalamalar */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-semibold text-gray-700">Ders Bazlı Ortalamalar</h4>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {istatistikler.dersBazliOrtalamalar.map((ders) => (
            <div key={ders.dersKodu} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{ders.ortalama}</p>
              <p className="text-xs text-gray-500 truncate">{ders.dersAdi}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sınıf Bazlı Ortalamalar */}
      {istatistikler.sinifBazliOrtalamalar.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-700">Sınıf Karşılaştırma</h4>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {istatistikler.sinifBazliOrtalamalar.slice(0, 8).map((sinif) => (
              <div key={sinif.sinif} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">{sinif.sinif}</p>
                <p className="text-sm text-gray-500">{sinif.ogrenciSayisi} öğrenci</p>
                <p className="text-lg font-bold text-emerald-600">{sinif.ortalama} net</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 10 Öğrenci */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h4 className="font-semibold text-gray-700">🏆 Sıralama (İlk 10)</h4>
          <span className="text-sm text-gray-500">{sonuclar.length} öğrenci</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Sıra</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Öğrenci</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Sınıf</th>
                <th className="text-center px-4 py-2 font-medium text-gray-600">D</th>
                <th className="text-center px-4 py-2 font-medium text-gray-600">Y</th>
                <th className="text-center px-4 py-2 font-medium text-gray-600">B</th>
                <th className="text-center px-4 py-2 font-medium text-gray-600">Net</th>
                <th className="text-center px-4 py-2 font-medium text-gray-600">Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sonuclar.slice(0, 10).map((sonuc, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {i === 0 && '🥇'}
                    {i === 1 && '🥈'}
                    {i === 2 && '🥉'}
                    {i > 2 && <span className="text-gray-400">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-2 font-medium">{sonuc.ogrenciAdi}</td>
                  <td className="px-4 py-2 text-gray-500">{sonuc.sinif || '-'}</td>
                  <td className="px-4 py-2 text-center text-emerald-600 font-medium">{sonuc.toplamDogru}</td>
                  <td className="px-4 py-2 text-center text-red-500 font-medium">{sonuc.toplamYanlis}</td>
                  <td className="px-4 py-2 text-center text-gray-400">{sonuc.toplamBos}</td>
                  <td className="px-4 py-2 text-center font-bold text-gray-900">{sonuc.toplamNet}</td>
                  <td className="px-4 py-2 text-center font-bold text-blue-600">{sonuc.tahminiPuan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kaydet Butonu */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <div>
          <p className="font-semibold text-emerald-800">Sınav kaydedilmeye hazır!</p>
          <p className="text-sm text-emerald-600">
            {istatistikler.toplamKatilimci} öğrenci, {sinavKonfig.toplamSoru || step2Data.cevapAnahtari.toplamSoru} soru
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all',
            isSaving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          )}
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save size={18} />
              Sınavı Kaydet
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Step5Onizleme;
