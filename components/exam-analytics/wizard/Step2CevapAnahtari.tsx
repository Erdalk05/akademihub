'use client';

/**
 * Step 2 - Cevap Anahtarı Yönetim Sistemi
 * 
 * Özellikler:
 * - Cevap Anahtarı Kütüphanesi
 * - Kitapçık seçimi (A/B/C/D)
 * - Tek seferde yapıştırma
 * - Ders bazlı hızlı giriş
 * - Excel import/export
 * - MEB Kazanım sistemi (opsiyonel)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Key, Clipboard, Trash2, ChevronDown, ChevronRight, Check, AlertCircle,
  Library, Download, Upload, Copy, Edit2, FileSpreadsheet, BookOpen,
  Search, Save, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kitapcik, getDersRenk } from '@/types/exam-analytics';
import { UseExamWizardReturn } from '@/hooks/useExamWizard';

interface Step2Props {
  wizard: UseExamWizardReturn;
  organizationId?: string;
}

interface AnswerKeyTemplate {
  id: string;
  sablon_adi: string;
  sinav_tipi: string;
  toplam_soru: number;
  ders_dagilimi: any[];
  kullanim_sayisi: number;
  updated_at: string;
  kitapciklar: Array<{
    id: string;
    kitapcik_kodu: string;
    cevap_dizisi: string;
    is_primary: boolean;
  }>;
}

const KITAPCIKLAR: Kitapcik[] = ['A', 'B', 'C', 'D'];
const SECENEKLER = ['A', 'B', 'C', 'D', 'E'];

export function Step2CevapAnahtari({ wizard, organizationId }: Step2Props) {
  const { state, setKitapcik, setCevapDizisi, setTumCevaplar } = wizard;
  const { step1, step2 } = state;

  // Local state
  const [topluCevap, setTopluCevap] = useState('');
  const [acikDers, setAcikDers] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [templates, setTemplates] = useState<AnswerKeyTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Şablonları yükle
  const fetchTemplates = useCallback(async () => {
    if (!organizationId) return;
    
    setLoadingTemplates(true);
    try {
      const res = await fetch(
        `/api/admin/exam-analytics/answer-keys?organizationId=${organizationId}&sinavTipi=${step1.sinavTuru}`
      );
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.data || []);
      }
    } catch (err) {
      console.error('Şablon yükleme hatası:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, [organizationId, step1.sinavTuru]);

  useEffect(() => {
    if (showLibrary) {
      fetchTemplates();
    }
  }, [showLibrary, fetchTemplates]);

  // Cevap dizisini parse et
  const parseCevapDizisi = useCallback((input: string): string => {
    if (!input) return '';
    
    // Temizle
    let clean = input.toUpperCase().trim();
    
    // Farklı formatları destekle
    // Format 1: ABCDABCD...
    // Format 2: A B C D...
    // Format 3: 1:A, 2:B, 3:C...
    // Format 4: Satır satır
    
    // Satır satır kontrolü
    if (clean.includes('\n')) {
      clean = clean.split('\n').map(line => {
        // 1:A formatı
        const match = line.match(/^\d+\s*[:\.]\s*([A-E])/i);
        if (match) return match[1];
        // Sadece harf
        const letterMatch = line.match(/^([A-E])/i);
        if (letterMatch) return letterMatch[1];
        return '';
      }).join('');
    } else {
      // Tek satır - boşlukları, virgülleri kaldır
      clean = clean.replace(/[\s,;:\.\d]/g, '');
    }
    
    // Sadece geçerli harfleri al
    return clean.replace(/[^ABCDE]/g, '');
  }, []);

  // Toplu cevap uygula
  const handleTopluCevapUygula = useCallback(() => {
    const parsed = parseCevapDizisi(topluCevap);
    
    if (parsed.length !== step2.toplamCevap) {
      setParseError(`Beklenen: ${step2.toplamCevap} cevap, Girilen: ${parsed.length} cevap`);
      return;
    }
    
    setParseError(null);
    setTumCevaplar(parsed);
  }, [topluCevap, step2.toplamCevap, parseCevapDizisi, setTumCevaplar]);

  // Temizle
  const handleTemizle = useCallback(() => {
    setTopluCevap('');
    setParseError(null);
    step2.cevaplar.forEach(c => {
      setCevapDizisi(c.dersId, '');
    });
  }, [step2.cevaplar, setCevapDizisi]);

  // Şablon yükle
  const handleLoadTemplate = useCallback((template: AnswerKeyTemplate) => {
    const primaryKitapcik = template.kitapciklar.find(k => k.is_primary) || template.kitapciklar[0];
    if (primaryKitapcik?.cevap_dizisi) {
      setTumCevaplar(primaryKitapcik.cevap_dizisi);
      setTopluCevap(primaryKitapcik.cevap_dizisi);
    }
    setShowLibrary(false);
  }, [setTumCevaplar]);

  // Şablon kaydet
  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !organizationId) return;
    
    setSavingTemplate(true);
    try {
      // Tüm cevapları birleştir
      const tumCevaplar = step2.cevaplar.map(c => c.cevapDizisi).join('');
      
      const res = await fetch('/api/admin/exam-analytics/answer-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          sablonAdi: templateName.trim(),
          sinavTipi: step1.sinavTuru,
          toplamSoru: step2.toplamCevap,
          dersDagilimi: step1.dersler.map(d => ({
            dersKodu: d.dersKodu,
            soruSayisi: d.soruSayisi,
            baslangic: d.baslangicSoru,
            bitis: d.bitisSoru,
          })),
          kitapciklar: [{
            kitapcikKodu: step2.kitapcik,
            cevapDizisi: tumCevaplar,
          }],
        }),
      });

      if (res.ok) {
        setShowSaveDialog(false);
        setTemplateName('');
        fetchTemplates();
      } else {
        const json = await res.json();
        alert(`Hata: ${json.error}`);
      }
    } catch (err) {
      console.error('Şablon kaydetme hatası:', err);
    } finally {
      setSavingTemplate(false);
    }
  };

  // Cevapları panoya kopyala
  const handleCopyAnswers = useCallback(() => {
    const tumCevaplar = step2.cevaplar.map(c => c.cevapDizisi).join('');
    navigator.clipboard.writeText(tumCevaplar);
  }, [step2.cevaplar]);

  // Progress hesapla
  const progressYuzde = step2.toplamCevap > 0 
    ? Math.round((step2.girilenCevap / step2.toplamCevap) * 100)
    : 0;

  // Canlı sayaç
  const liveCount = useMemo(() => {
    return parseCevapDizisi(topluCevap).length;
  }, [topluCevap, parseCevapDizisi]);

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
        
        <div className="flex items-center gap-4">
          {/* Progress */}
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
      </div>

      {/* ============================================ */}
      {/* 1. CEVAP ANAHTARI KÜTÜPHANESİ */}
      {/* ============================================ */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-indigo-900">Cevap Anahtarı Kütüphanesi</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              {showLibrary ? 'Gizle' : 'Kütüphaneyi Aç'}
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={!step2.isCompleted}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              Şablon Olarak Kaydet
            </button>
          </div>
        </div>

        {/* Şablon Listesi */}
        {showLibrary && (
          <div className="mt-4 bg-white rounded-lg border border-indigo-100 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Kayıtlı Şablonlar ({templates.length})
              </span>
              <button
                onClick={fetchTemplates}
                disabled={loadingTemplates}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4", loadingTemplates && "animate-spin")} />
              </button>
            </div>
            
            {loadingTemplates ? (
              <div className="p-8 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Yükleniyor...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Library className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Henüz kayıtlı şablon yok
              </div>
            ) : (
              <div className="divide-y max-h-64 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{template.sablon_adi}</div>
                      <div className="text-xs text-gray-500">
                        {template.toplam_soru} soru • {template.kullanim_sayisi} kullanım
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                      >
                        Yükle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kaydet Dialog */}
        {showSaveDialog && (
          <div className="mt-4 bg-white rounded-lg border border-indigo-200 p-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Şablon adı girin..."
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim() || savingTemplate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {savingTemplate ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* 2. KİTAPÇIK SEÇİMİ */}
      {/* ============================================ */}
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
                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
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

      {/* ============================================ */}
      {/* 3. TEK SEFERDE YAPIŞTIR */}
      {/* ============================================ */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Tek Seferde Yapıştır</span>
          </div>
          <span className={cn(
            "text-sm font-medium px-2 py-0.5 rounded",
            liveCount === step2.toplamCevap 
              ? "bg-green-100 text-green-700" 
              : liveCount > step2.toplamCevap
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
          )}>
            {liveCount} / {step2.toplamCevap}
          </span>
        </div>
        
        <div className="mb-3">
          <textarea
            value={topluCevap}
            onChange={(e) => {
              setTopluCevap(e.target.value);
              setParseError(null);
            }}
            placeholder={`Örnek: ABCDABCDABCD... (toplam ${step2.toplamCevap} cevap)`}
            className={cn(
              "w-full h-24 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono",
              parseError ? "border-red-300 bg-red-50" : "border-blue-200"
            )}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              Desteklenen: ABCDABCD... | A B C D... | 1:A, 2:B... | Satır satır
            </p>
            {parseError && (
              <p className="text-xs text-red-600 font-medium">{parseError}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleTemizle}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Temizle
          </button>
          
          <button
            onClick={handleCopyAnswers}
            disabled={step2.girilenCevap === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Kopyala
          </button>

          <div className="flex-1" />

          <button
            onClick={handleTopluCevapUygula}
            disabled={!topluCevap || liveCount !== step2.toplamCevap}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            Cevapları Uygula
          </button>
        </div>

        {/* Excel Import Butonları */}
        <div className="mt-4 pt-4 border-t border-blue-200 flex gap-2 flex-wrap">
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel'den İçe Aktar
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel'e Aktar
          </button>
          <span className="text-xs text-gray-500 flex items-center ml-2">
            Excel: Soru No | Cevap | MEB Kazanım Kodu (opsiyonel)
          </span>
        </div>
      </div>

      {/* ============================================ */}
      {/* 4. DERS BAZLI HIZLI GİRİŞ */}
      {/* ============================================ */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="font-semibold text-gray-900">Hızlı Ders Bazlı Cevap Girişi</span>
          </div>
          <span className="text-sm text-gray-500">Her derse direkt yapıştır</span>
        </div>

        <div className="space-y-3">
          {step2.cevaplar.map((cevap) => {
            const ders = step1.dersler.find(d => d.dersId === cevap.dersId);
            const renk = ders?.renkKodu || getDersRenk(cevap.dersKodu);
            const isOpen = acikDers === cevap.dersId;
            
            return (
              <div key={cevap.dersId} className="border rounded-lg overflow-hidden">
                {/* Ders Başlık */}
                <button
                  onClick={() => setAcikDers(isOpen ? null : cevap.dersId)}
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
                          className={cn('h-full', cevap.tamamlandi ? 'bg-green-500' : 'bg-blue-500')}
                          style={{ width: `${(cevap.girilenCevap / cevap.soruSayisi) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {cevap.girilenCevap}/{cevap.soruSayisi}
                      </span>
                    </div>
                    
                    {/* Durum */}
                    {cevap.tamamlandi ? (
                      <span className="text-green-600 text-sm font-medium">✓ Tamam</span>
                    ) : cevap.girilenCevap > 0 ? (
                      <span className="text-yellow-600 text-sm">Eksik</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Boş</span>
                    )}
                    
                    {isOpen ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Ders İçerik */}
                {isOpen && (
                  <div className="p-4 border-t bg-white">
                    {/* Hızlı yapıştır */}
                    <div className="mb-4">
                      <input
                        type="text"
                        value={cevap.cevapDizisi}
                        onChange={(e) => setCevapDizisi(cevap.dersId, parseCevapDizisi(e.target.value))}
                        placeholder={`${cevap.soruSayisi} cevap yazın veya yapıştırın... (örn: ABCDABCD)`}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Girilen: {cevap.cevapDizisi.length} / {cevap.soruSayisi}
                      </p>
                    </div>

                    {/* Manuel seçim grid */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {Array.from({ length: cevap.soruSayisi }).map((_, idx) => {
                        const soruNo = (ders?.baslangicSoru || 1) + idx;
                        const mevcutCevap = cevap.cevapDizisi[idx] || '';
                        
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1 p-1 bg-gray-50 rounded">
                            <span className="text-xs text-gray-500 font-medium">{soruNo}</span>
                            <div className="flex gap-0.5">
                              {SECENEKLER.slice(0, step1.sinavTuru === 'lgs' ? 4 : 5).map((secenek) => (
                                <button
                                  key={secenek}
                                  onClick={() => {
                                    const yeniDizi = cevap.cevapDizisi.padEnd(cevap.soruSayisi, ' ').split('');
                                    yeniDizi[idx] = secenek;
                                    setCevapDizisi(cevap.dersId, yeniDizi.join('').replace(/ /g, ''));
                                  }}
                                  className={cn(
                                    'w-5 h-5 text-[10px] rounded border transition-all font-medium',
                                    mevcutCevap === secenek
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
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

      {/* ============================================ */}
      {/* 5. DURUM BAR */}
      {/* ============================================ */}
      <div className={cn(
        'p-4 rounded-xl flex items-center gap-3',
        step2.isCompleted 
          ? 'bg-green-50 border-2 border-green-200' 
          : 'bg-yellow-50 border-2 border-yellow-200'
      )}>
        {step2.isCompleted ? (
          <>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <span className="text-green-800 font-semibold block">
                Cevap anahtarı tamamlandı!
              </span>
              <span className="text-green-600 text-sm">
                {step2.girilenCevap} cevap girildi • Kitapçık {step2.kitapcik}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <span className="text-yellow-800 font-semibold block">
                {step2.toplamCevap - step2.girilenCevap} cevap daha girilmeli
              </span>
              <span className="text-yellow-600 text-sm">
                Tüm cevapları girdikten sonra ileri butonuna tıklayın
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
