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
      {/* ÖĞRENCİ SIRALAMASI - GELİŞMİŞ ACCORDION DÜZENLEME */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            🏆 Sıralama (Tümü)
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded">
              D = Doğru | Y = Yanlış | B = Boş
            </span>
            <span className="text-sm text-gray-500 font-medium">{sonuclar.length} öğrenci</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {sonuclar.map((sonuc, i) => {
            const isExpanded = expandedStudent === i;
            const isEditing = editingStudent === i;
            const dersCevaplari = isExpanded ? getOgrenciDersCevaplari(sonuc) : [];

            return (
              <div key={i} className={cn(
                'transition-all duration-200',
                isExpanded ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-inner' : 'hover:bg-gray-50'
              )}>
                {/* Öğrenci Satırı */}
                <div className="flex items-center px-4 py-3">
                  {/* Sıra */}
                  <div className="w-10 text-center flex-shrink-0">
                    {i === 0 && <span className="text-xl">🥇</span>}
                    {i === 1 && <span className="text-xl">🥈</span>}
                    {i === 2 && <span className="text-xl">🥉</span>}
                    {i > 2 && <span className="text-gray-400 font-medium">{i + 1}</span>}
                  </div>

                  {/* Öğrenci Bilgisi */}
                  <div 
                    className="flex-1 ml-2 cursor-pointer"
                    onClick={() => handleToggleStudent(i)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{sonuc.ogrenciAdi}</span>
                      <span className="text-gray-400 text-sm">{sonuc.sinif || '-'}</span>
                      {sonuc.kitapcik && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-bold">
                          Kitapçık {sonuc.kitapcik}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sonuçlar */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded">
                      <span className="text-emerald-700 font-bold">{sonuc.toplamDogru}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded">
                      <span className="text-red-600 font-bold">{sonuc.toplamYanlis}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                      <span className="text-gray-500 font-bold">{sonuc.toplamBos}</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-800 text-white rounded font-bold min-w-[60px] text-center">
                      {sonuc.toplamNet}
                    </div>
                    <div className="px-3 py-1 bg-blue-600 text-white rounded font-bold min-w-[70px] text-center">
                      {sonuc.tahminiPuan || '-'}
                    </div>

                    {/* Düzenle Butonu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isExpanded) setExpandedStudent(i);
                        handleStartEdit(i, e);
                      }}
                      className={cn(
                        'p-2 rounded-lg transition-all ml-2',
                        isEditing
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600'
                      )}
                      title="Cevapları Düzenle"
                    >
                      <Edit3 size={16} />
                    </button>

                    {/* Aç/Kapat */}
                    <button
                      onClick={() => handleToggleStudent(i)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-gray-600" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Accordion İçeriği - Ders Bazlı Cevaplar */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-blue-200 bg-white/80">
                    {/* Düzenleme Modu Header */}
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">
                          {isEditing ? '✏️ Düzenleme Modu - Cevaba tıklayarak değiştirin' : '👁️ Görüntüleme Modu'}
                        </span>
                        {isEditing && (
                          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                            Tıkla: A→B→C→D→E→Boş
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleCancelEdit}
                              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-1"
                            >
                              <X size={14} />
                              İptal
                            </button>
                            <button
                              onClick={() => handleSaveEdit(i)}
                              className="px-4 py-2 text-sm bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center gap-1 font-medium"
                            >
                              <Check size={14} />
                              Değişiklikleri Kaydet
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => handleStartEdit(i, e)}
                            className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg flex items-center gap-1 font-medium"
                          >
                            <Edit3 size={14} />
                            Düzenlemeye Başla
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ders Kartları */}
                    {dersCevaplari.map((ders) => {
                      const renkler = DERS_RENKLERI[ders.dersKodu] || { icon: '📚', bg: 'bg-gray-100', text: 'text-gray-600' };

                      return (
                        <div key={ders.dersKodu} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{renkler.icon}</span>
                              <span className={cn('font-semibold text-lg', renkler.text)}>{ders.dersAdi}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                                <span className="text-emerald-700 font-bold">{ders.dogru} Doğru</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-red-500"></div>
                                <span className="text-red-600 font-bold">{ders.yanlis} Yanlış</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-gray-300"></div>
                                <span className="text-gray-500">{ders.bos} Boş</span>
                              </div>
                              <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                                Net: {ders.net}
                              </span>
                            </div>
                          </div>

                          {/* Cevap Kutuları Grid */}
                          <div className="grid grid-cols-10 sm:grid-cols-20 gap-1">
                            {ders.cevaplar.map((cevap) => {
                              const currentCevap = isEditing
                                ? editingCevaplar.get(cevap.soruNo) ?? cevap.ogrenciCevap
                                : cevap.ogrenciCevap;

                              // Düzenleme modunda sonucu yeniden hesapla
                              let displaySonuc = cevap.sonuc;
                              if (isEditing) {
                                if (!currentCevap || currentCevap === '' || currentCevap === ' ') {
                                  displaySonuc = 'bos';
                                } else if (currentCevap === cevap.dogruCevap) {
                                  displaySonuc = 'dogru';
                                } else {
                                  displaySonuc = 'yanlis';
                                }
                              }

                              return (
                                <div
                                  key={cevap.soruNo}
                                  onClick={() => {
                                    if (isEditing) {
                                      const options: (CevapSecenegi | null)[] = ['A', 'B', 'C', 'D', 'E', null];
                                      const currentIndex = options.indexOf(currentCevap);
                                      const nextIndex = (currentIndex + 1) % options.length;
                                      handleCevapChange(cevap.soruNo, options[nextIndex]);
                                    }
                                  }}
                                  className={cn(
                                    'relative w-9 h-9 flex items-center justify-center text-xs font-bold rounded-lg border-2 transition-all',
                                    isEditing && 'cursor-pointer hover:scale-110 hover:shadow-md',
                                    displaySonuc === 'dogru'
                                      ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                                      : displaySonuc === 'yanlis'
                                      ? 'bg-red-100 border-red-400 text-red-700'
                                      : 'bg-gray-50 border-gray-200 text-gray-400'
                                  )}
                                  title={`Soru ${cevap.soruNo}\nÖğrenci: ${currentCevap || 'Boş'}\nDoğru: ${cevap.dogruCevap || '-'}`}
                                >
                                  <span className="text-[9px] absolute -top-1.5 -left-1.5 bg-slate-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-normal">
                                    {cevap.soruNo}
                                  </span>
                                  <span className="text-sm">{currentCevap || '-'}</span>
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
