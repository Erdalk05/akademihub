'use client';

// ============================================================================
// STEP 5: ÖNİZLEME + KAYIT + ÖĞRENCİ DÜZENLEME v2.0
// Accordion öğrenci detayları, düzenleme, sınav kaydetme
// ============================================================================

import React, { useMemo, useState, useCallback } from 'react';
import {
  BarChart3,
  Users,
  Trophy,
  TrendingUp,
  Save,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Edit3,
  Check,
  X,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  WizardStep1Data,
  WizardStep2Data,
  WizardStep4Data,
  WizardStep5Data,
  ScoringRuleSnapshot,
  OgrenciSonuc,
  CevapSecenegi,
} from '@/types/spectra-wizard';
import {
  hesaplaTopluSonuclar,
  hesaplaIstatistikler,
  ekleTohminiPuanlar,
  createScoringSnapshot,
} from '@/lib/spectra-wizard/scoring-engine';
import { SINAV_KONFIGURASYONLARI, getDersDagilimi, DERS_RENKLERI } from '@/lib/spectra-wizard/exam-configs';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Step5Props {
  step1Data: WizardStep1Data;
  step2Data: WizardStep2Data;
  step4Data: WizardStep4Data;
  examId: string;
  onSave: (step5Data: WizardStep5Data) => void;
  onUpdateStudent?: (index: number, updatedData: Partial<OgrenciSonuc>) => void;
  isSaving: boolean;
}

interface DersCevaplari {
  dersKodu: string;
  dersAdi: string;
  cevaplar: { soruNo: number; ogrenciCevap: CevapSecenegi | null; dogruCevap: CevapSecenegi | null; sonuc: 'dogru' | 'yanlis' | 'bos' }[];
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function Step5Onizleme({
  step1Data,
  step2Data,
  step4Data,
  examId,
  onSave,
  onUpdateStudent,
  isSaving,
}: Step5Props) {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  const [editingStudent, setEditingStudent] = useState<number | null>(null);
  const [editingCevaplar, setEditingCevaplar] = useState<Map<number, CevapSecenegi | null>>(new Map());

  // ─────────────────────────────────────────────────────────────────────────
  // MEMOIZED VALUES
  // ─────────────────────────────────────────────────────────────────────────

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

    const puanlamaFormulu = step1Data.puanlamaAyarlari || sinavKonfig.puanlamaFormulu;

    const hesaplananSonuclar = hesaplaTopluSonuclar(
      step4Data.parseResult.satirlar,
      step2Data.cevapAnahtari,
      sinavKonfig,
      examId,
      step1Data.iptalSoruMantigi || 'herkese_dogru'
    );

    const sonuclarWithPuan = ekleTohminiPuanlar(hesaplananSonuclar, step1Data.sinavTuru, puanlamaFormulu);
    const stats = hesaplaIstatistikler(sonuclarWithPuan);

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

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  // Öğrenci accordion aç/kapat
  const handleToggleStudent = useCallback((index: number) => {
    setExpandedStudent(prev => prev === index ? null : index);
    setEditingStudent(null);
    setEditingCevaplar(new Map());
  }, []);

  // Düzenleme modunu aç
  const handleStartEdit = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudent(index);
    // Mevcut cevapları yükle
    const sonuc = sonuclar[index];
    if (sonuc?.cevaplar) {
      const cevapMap = new Map<number, CevapSecenegi | null>();
      sonuc.cevaplar.forEach((c, i) => cevapMap.set(i + 1, c as CevapSecenegi | null));
      setEditingCevaplar(cevapMap);
    }
  }, [sonuclar]);

  // Cevap değiştir
  const handleCevapChange = useCallback((soruNo: number, yeniCevap: CevapSecenegi | null) => {
    setEditingCevaplar(prev => {
      const newMap = new Map(prev);
      newMap.set(soruNo, yeniCevap);
      return newMap;
    });
  }, []);

  // Düzenlemeyi kaydet
  const handleSaveEdit = useCallback((index: number) => {
    // Yeni cevapları array'e çevir
    const cevapArray: (CevapSecenegi | null)[] = [];
    for (let i = 1; i <= step2Data.cevapAnahtari.toplamSoru; i++) {
      cevapArray.push(editingCevaplar.get(i) || null);
    }

    if (onUpdateStudent) {
      onUpdateStudent(index, { cevaplar: cevapArray.map(c => c || '') });
    }

    setEditingStudent(null);
    setEditingCevaplar(new Map());
    toast.success('Öğrenci cevapları güncellendi');
  }, [editingCevaplar, onUpdateStudent, step2Data.cevapAnahtari.toplamSoru]);

  // Düzenlemeyi iptal et
  const handleCancelEdit = useCallback(() => {
    setEditingStudent(null);
    setEditingCevaplar(new Map());
  }, []);

  // Öğrencinin ders bazlı cevaplarını hesapla
  const getOgrenciDersCevaplari = useCallback((sonuc: OgrenciSonuc): DersCevaplari[] => {
    const result: DersCevaplari[] = [];
    let soruIndex = 0;

    for (const ders of dersDagilimi) {
      const dersCevaplari: DersCevaplari['cevaplar'] = [];
      let dogru = 0, yanlis = 0, bos = 0;

      for (let i = 0; i < ders.soruSayisi; i++) {
        const ogrenciCevap = sonuc.cevaplar?.[soruIndex] as CevapSecenegi | null || null;
        const anahtarItem = step2Data.cevapAnahtari.items[soruIndex];
        const dogruCevap = anahtarItem?.dogruCevap || null;

        let sonucTipi: 'dogru' | 'yanlis' | 'bos' = 'bos';
        if (!ogrenciCevap || ogrenciCevap === '' || ogrenciCevap === ' ') {
          bos++;
          sonucTipi = 'bos';
        } else if (ogrenciCevap === dogruCevap) {
          dogru++;
          sonucTipi = 'dogru';
        } else {
          yanlis++;
          sonucTipi = 'yanlis';
        }

        dersCevaplari.push({
          soruNo: soruIndex + 1,
          ogrenciCevap,
          dogruCevap,
          sonuc: sonucTipi,
        });

        soruIndex++;
      }

      const net = dogru - (yanlis * (step1Data.yanlisKatsayisi || 0.25));

      result.push({
        dersKodu: ders.dersKodu,
        dersAdi: ders.dersAdi,
        cevaplar: dersCevaplari,
        dogru,
        yanlis,
        bos,
        net: Math.round(net * 100) / 100,
      });
    }

    return result;
  }, [dersDagilimi, step2Data.cevapAnahtari.items, step1Data.yanlisKatsayisi]);

  // Kaydet
  const handleSave = useCallback(() => {
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
  }, [istatistikler, sonuclar, scoringSnapshot, onSave]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ÖĞRENCİ SIRALAMASI - ACCORDION İLE DÜZENLEME */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h4 className="font-semibold text-gray-700">🏆 Sıralama (Tümü)</h4>
          <span className="text-sm text-gray-500">{sonuclar.length} öğrenci • Düzenlemek için tıklayın</span>
        </div>

        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {sonuclar.map((sonuc, i) => {
            const isExpanded = expandedStudent === i;
            const isEditing = editingStudent === i;
            const dersCevaplari = isExpanded ? getOgrenciDersCevaplari(sonuc) : [];

            return (
              <div key={i} className={cn('transition-colors', isExpanded ? 'bg-slate-50' : 'hover:bg-gray-50')}>
                {/* Öğrenci Satırı */}
                <div
                  onClick={() => handleToggleStudent(i)}
                  className="flex items-center px-4 py-3 cursor-pointer"
                >
                  <div className="w-8 text-center">
                    {i === 0 && '🥇'}
                    {i === 1 && '🥈'}
                    {i === 2 && '🥉'}
                    {i > 2 && <span className="text-gray-400">{i + 1}</span>}
                  </div>
                  <div className="flex-1 ml-2">
                    <span className="font-medium">{sonuc.ogrenciAdi}</span>
                    <span className="text-gray-400 ml-2 text-sm">{sonuc.sinif || '-'}</span>
                    {sonuc.kitapcik && (
                      <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">
                        {sonuc.kitapcik}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-emerald-600 font-medium w-8 text-center">{sonuc.toplamDogru}</span>
                    <span className="text-red-500 font-medium w-8 text-center">{sonuc.toplamYanlis}</span>
                    <span className="text-gray-400 w-8 text-center">{sonuc.toplamBos}</span>
                    <span className="font-bold text-gray-900 w-12 text-center">{sonuc.toplamNet}</span>
                    <span className="font-bold text-blue-600 w-16 text-center">{sonuc.tahminiPuan || '-'}</span>
                    <button
                      onClick={(e) => handleStartEdit(i, e)}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit3 size={16} className="text-gray-400 hover:text-emerald-600" />
                    </button>
                    {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                  </div>
                </div>

                {/* Accordion İçeriği - Ders Bazlı Cevaplar */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Düzenleme Modu Butonları */}
                    {isEditing && (
                      <div className="flex items-center justify-end gap-2 pb-2 border-b border-gray-200">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                        >
                          <X size={14} />
                          İptal
                        </button>
                        <button
                          onClick={() => handleSaveEdit(i)}
                          className="px-3 py-1.5 text-sm bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center gap-1"
                        >
                          <Check size={14} />
                          Kaydet
                        </button>
                      </div>
                    )}

                    {/* Ders Kartları */}
                    {dersCevaplari.map((ders) => {
                      const renkler = DERS_RENKLERI[ders.dersKodu] || { icon: '📚', bg: 'bg-gray-100', text: 'text-gray-600' };

                      return (
                        <div key={ders.dersKodu} className="bg-white rounded-lg border border-gray-200 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{renkler.icon}</span>
                              <span className={cn('font-medium', renkler.text)}>{ders.dersAdi}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-emerald-600 font-bold">D: {ders.dogru}</span>
                              <span className="text-red-500 font-bold">Y: {ders.yanlis}</span>
                              <span className="text-gray-400">B: {ders.bos}</span>
                              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">Net: {ders.net}</span>
                            </div>
                          </div>

                          {/* Cevap Kutuları */}
                          <div className="flex flex-wrap gap-1">
                            {ders.cevaplar.map((cevap) => {
                              const currentCevap = isEditing
                                ? editingCevaplar.get(cevap.soruNo) ?? cevap.ogrenciCevap
                                : cevap.ogrenciCevap;

                              return (
                                <div
                                  key={cevap.soruNo}
                                  className={cn(
                                    'relative w-8 h-8 flex items-center justify-center text-xs font-bold rounded border transition-all',
                                    isEditing ? 'cursor-pointer hover:ring-2 hover:ring-emerald-300' : '',
                                    cevap.sonuc === 'dogru' && !isEditing
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                      : cevap.sonuc === 'yanlis' && !isEditing
                                      ? 'bg-red-100 border-red-300 text-red-700'
                                      : 'bg-gray-50 border-gray-200 text-gray-400'
                                  )}
                                  title={`Soru ${cevap.soruNo} - Doğru: ${cevap.dogruCevap || '-'}`}
                                  onClick={() => {
                                    if (isEditing) {
                                      // Döngüsel cevap değiştirme: A→B→C→D→E→null→A
                                      const options: (CevapSecenegi | null)[] = ['A', 'B', 'C', 'D', 'E', null];
                                      const currentIndex = options.indexOf(currentCevap);
                                      const nextIndex = (currentIndex + 1) % options.length;
                                      handleCevapChange(cevap.soruNo, options[nextIndex]);
                                    }
                                  }}
                                >
                                  <span className="text-[10px] absolute -top-1 -left-1 bg-gray-600 text-white w-3 h-3 rounded-full flex items-center justify-center">
                                    {cevap.soruNo}
                                  </span>
                                  {currentCevap || '-'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'
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
