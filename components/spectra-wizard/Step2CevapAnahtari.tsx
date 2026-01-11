'use client';

// ============================================================================
// STEP 2: GELİŞMİŞ CEVAP ANAHTARI v4.0 - MASTER LAYOUT
// 4 Katmanlı: Kütüphane Bar + Toplu Yapıştır + Ders Bazlı + Editör
// ============================================================================

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Library,
  ChevronDown,
  ChevronRight,
  Check,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Edit3,
  X,
  Search,
  Zap,
  BookOpen,
  Download,
  XCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type {
  WizardStep1Data,
  WizardStep2Data,
  CevapAnahtari,
  CevapAnahtariItem,
  CevapSecenegi,
  KitapcikTuru,
  TopluYapistirResult,
  DersDagilimi,
} from '@/types/spectra-wizard';
import {
  createEmptyCevapAnahtari,
  updateSoruCevap,
  validateCevapAnahtari,
  parseTopluCevap,
  parseCevapString,
  deleteSelectedItems,
  clearAllAnswers,
} from '@/lib/spectra-wizard/answer-key-parser';
import { getDersDagilimi, DERS_RENKLERI } from '@/lib/spectra-wizard/exam-configs';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Step2Props {
  step1Data: WizardStep1Data;
  data: WizardStep2Data | null;
  organizationId: string;
  onChange: (data: WizardStep2Data) => void;
}

interface KayitliAnahtar {
  id: string;
  ad: string;
  sinavTuru: string;
  toplamSoru: number;
  olusturulmaTarihi: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function Step2CevapAnahtari({ step1Data, data, organizationId, onChange }: Step2Props) {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  
  // Kitapçık seçimi (tüm bölümler için ortak)
  const [aktifKitapcik, setAktifKitapcik] = useState<KitapcikTuru>('A');
  
  // Kütüphane state
  const [seciliSablonId, setSeciliSablonId] = useState<string>('');
  const [yeniSablonAdi, setYeniSablonAdi] = useState<string>('');
  const [kayitliAnahtarlar, setKayitliAnahtarlar] = useState<KayitliAnahtar[]>([]);
  const [isLoadingKutuphane, setIsLoadingKutuphane] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Supabase client
  const supabase = createClient();
  
  // Toplu yapıştır state
  const [topluCevapInput, setTopluCevapInput] = useState<string>('');
  const [topluParseResult, setTopluParseResult] = useState<TopluYapistirResult | null>(null);
  
  // Ders bazlı yapıştır state
  const [dersYapistirInputs, setDersYapistirInputs] = useState<Record<string, string>>({});
  const [dersYapistirResults, setDersYapistirResults] = useState<Record<string, { cevaplar: CevapSecenegi[]; hatalar: string[]; isValid: boolean } | null>>({});
  
  // Editör state
  const [expandedDersler, setExpandedDersler] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ders düzenleme state
  const [editingDersKodu, setEditingDersKodu] = useState<string | null>(null);


  // ─────────────────────────────────────────────────────────────────────────
  // MEMOIZED VALUES
  // ─────────────────────────────────────────────────────────────────────────

  // Ders dağılımı - sınav türü ve sınıf seviyesine göre dinamik
  const dersDagilimi = useMemo(() => {
    return getDersDagilimi(step1Data.sinavTuru, step1Data.sinifSeviyesi);
  }, [step1Data.sinavTuru, step1Data.sinifSeviyesi]);

  // Toplam soru sayısı - config'den hesaplanır (hardcode YOK)
  const toplamSoru = useMemo(() => {
    return dersDagilimi.reduce((s, d) => s + d.soruSayisi, 0);
  }, [dersDagilimi]);

  // Cevap anahtarı state
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

  // Aktif kitapçığa göre cevap oku
  const getItemCevap = useCallback((item: CevapAnahtariItem, kitapcik: KitapcikTuru): CevapSecenegi => {
    if (kitapcik === 'A') return item.dogruCevap ?? null;
    return item.kitapcikCevaplari?.[kitapcik] ?? null;
  }, []);

  // İstatistikler - aktif kitapçığa göre
  const stats = useMemo(() => {
    const doldurulanSoru = cevapAnahtari.items.filter(i => !!getItemCevap(i, aktifKitapcik) && !i.iptal).length;
    const iptalSoru = cevapAnahtari.items.filter(i => !!i.iptal).length;
    const bosKalanSoru = Math.max(0, toplamSoru - doldurulanSoru - iptalSoru);
    const kazanimliSoru = cevapAnahtari.items.filter(i => !!i.kazanimKodu || !!i.kazanimAciklamasi).length;
    return { doldurulanSoru, bosKalanSoru, iptalSoru, kazanimliSoru };
  }, [cevapAnahtari.items, aktifKitapcik, toplamSoru, getItemCevap]);

  // Ders bazlı istatistikler
  const dersStats = useMemo(() => {
    const result: Record<string, { dolduruan: number; toplam: number }> = {};
    for (const ders of dersDagilimi) {
      const dersItems = cevapAnahtari.items.filter(i => i.dersKodu === ders.dersKodu);
      const doldurulan = dersItems.filter(i => !!getItemCevap(i, aktifKitapcik)).length;
      result[ders.dersKodu] = { dolduruan: doldurulan, toplam: ders.soruSayisi };
    }
    return result;
  }, [cevapAnahtari.items, dersDagilimi, aktifKitapcik, getItemCevap]);

  // Tüm dersler tamamlandı mı
  const allLessonsComplete = useMemo(() => {
    return dersDagilimi.every(ders => {
      const stats = dersStats[ders.dersKodu];
      return stats?.dolduruan === ders.soruSayisi;
    });
  }, [dersDagilimi, dersStats]);

  // Filtrelenmiş items
  const filteredItems = useMemo(() => {
    if (!searchQuery) return cevapAnahtari.items;
    const query = searchQuery.toLowerCase();
    return cevapAnahtari.items.filter(item =>
      item.soruNo.toString().includes(query) ||
      item.dersAdi.toLowerCase().includes(query) ||
      item.dersKodu.toLowerCase().includes(query) ||
      (item.kazanimKodu && item.kazanimKodu.toLowerCase().includes(query))
    );
  }, [cevapAnahtari.items, searchQuery]);

  // Validation
  const validation = useMemo(() => {
    return validateCevapAnahtari(cevapAnahtari, toplamSoru);
  }, [cevapAnahtari, toplamSoru]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  // Parent'ı güncelle
  const updateCevapAnahtari = useCallback((newAnahtar: CevapAnahtari, source: 'manual' | 'paste' | 'excel' | 'photo' | 'library' = 'manual') => {
    onChange({
      cevapAnahtari: newAnahtar,
      girisYontemi: 'manuel',
      source,
      previewErrors: [],
      previewWarnings: [],
    });
  }, [onChange]);

  // Tek soru cevabı değiştir
  const handleCevapChange = useCallback((soruNo: number, cevap: CevapSecenegi) => {
    const newAnahtar = updateSoruCevap(cevapAnahtari, soruNo, cevap, aktifKitapcik);
    updateCevapAnahtari(newAnahtar, 'manual');
  }, [cevapAnahtari, aktifKitapcik, updateCevapAnahtari]);

  // TOPLU YAPIŞTIR - Input değişikliği
  const handleTopluInputChange = useCallback((value: string) => {
    setTopluCevapInput(value.toUpperCase());
    const result = parseTopluCevap(value, toplamSoru);
    setTopluParseResult(result);
  }, [toplamSoru]);

  // TOPLU YAPIŞTIR - Uygula
  const handleTopluApply = useCallback(() => {
    if (!topluParseResult || !topluParseResult.isValid) {
      toast.error('Lütfen geçerli cevapları girin.');
      return;
    }

    const newItems: CevapAnahtariItem[] = [];
    let soruIndex = 0;

    for (const ders of dersDagilimi) {
      for (let i = 0; i < ders.soruSayisi; i++) {
        const soruNo = soruIndex + 1;
        const cevap = topluParseResult.cevaplar[soruIndex] || null;
        const mevcutItem = cevapAnahtari.items.find(item => item.soruNo === soruNo);

        if (aktifKitapcik === 'A') {
          newItems.push({
            soruNo,
            dogruCevap: cevap,
            dersKodu: ders.dersKodu,
            dersAdi: ders.dersAdi,
            kazanimKodu: mevcutItem?.kazanimKodu,
            kazanimAciklamasi: mevcutItem?.kazanimAciklamasi,
            konuAdi: mevcutItem?.konuAdi,
            iptal: mevcutItem?.iptal || false,
            kitapcikCevaplari: mevcutItem?.kitapcikCevaplari,
          });
        } else {
          const updatedKitapcikCevaplari: Record<KitapcikTuru, CevapSecenegi> = {
            A: mevcutItem?.kitapcikCevaplari?.A ?? mevcutItem?.dogruCevap ?? null,
            B: mevcutItem?.kitapcikCevaplari?.B ?? null,
            C: mevcutItem?.kitapcikCevaplari?.C ?? null,
            D: mevcutItem?.kitapcikCevaplari?.D ?? null,
          };
          updatedKitapcikCevaplari[aktifKitapcik] = cevap;

          newItems.push({
            soruNo,
            dogruCevap: mevcutItem?.dogruCevap ?? null,
            dersKodu: ders.dersKodu,
            dersAdi: ders.dersAdi,
            kazanimKodu: mevcutItem?.kazanimKodu,
            kazanimAciklamasi: mevcutItem?.kazanimAciklamasi,
            konuAdi: mevcutItem?.konuAdi,
            iptal: mevcutItem?.iptal || false,
            kitapcikCevaplari: updatedKitapcikCevaplari,
          });
        }
        soruIndex++;
      }
    }

    const newAnahtar: CevapAnahtari = {
      ...cevapAnahtari,
      items: newItems,
      aktifKitapcik: aktifKitapcik,
    };

    updateCevapAnahtari(newAnahtar, 'paste');
    setTopluCevapInput('');
    setTopluParseResult(null);
    toast.success(`${toplamSoru} soru yüklendi (Kitapçık ${aktifKitapcik})`);
  }, [topluParseResult, aktifKitapcik, dersDagilimi, cevapAnahtari, updateCevapAnahtari, toplamSoru]);

  // DERS BAZLI YAPIŞTIR - Input değişikliği
  const handleDersInputChange = useCallback((dersKodu: string, soruSayisi: number, value: string) => {
    const key = `${aktifKitapcik}:${dersKodu}`;
    setDersYapistirInputs(prev => ({ ...prev, [key]: value.toUpperCase() }));
    
    const { cevaplar, hatalar } = parseCevapString(value, soruSayisi);
    const isValid = hatalar.length === 0 && cevaplar.filter(c => c !== null).length === soruSayisi;
    setDersYapistirResults(prev => ({ ...prev, [key]: { cevaplar, hatalar, isValid } }));
  }, [aktifKitapcik]);

  // DERS BAZLI YAPIŞTIR - Uygula (otomatik veya manuel)
  const handleDersApply = useCallback((dersKodu: string, dersAdi: string) => {
    const key = `${aktifKitapcik}:${dersKodu}`;
    const result = dersYapistirResults[key];
    
    if (!result || result.cevaplar.filter(c => c !== null).length === 0) {
      toast.error(`${dersAdi} için cevap bulunamadı.`);
      return;
    }

    const dersItems = cevapAnahtari.items
      .filter(i => i.dersKodu === dersKodu)
      .sort((a, b) => a.soruNo - b.soruNo);

    let newAnahtar = cevapAnahtari;
    for (let i = 0; i < dersItems.length && i < result.cevaplar.length; i++) {
      const soruNo = dersItems[i]?.soruNo;
      const cevap = result.cevaplar[i];
      if (soruNo) newAnahtar = updateSoruCevap(newAnahtar, soruNo, cevap, aktifKitapcik);
    }

    updateCevapAnahtari(newAnahtar, 'paste');
    setDersYapistirInputs(prev => ({ ...prev, [key]: '' }));
    setDersYapistirResults(prev => ({ ...prev, [key]: null }));
    toast.success(`${dersAdi} yüklendi (Kitapçık ${aktifKitapcik})`);
  }, [aktifKitapcik, dersYapistirResults, cevapAnahtari, updateCevapAnahtari]);

  // Kayıtlı anahtarları yükle (Supabase + localStorage)
  const loadKayitliAnahtarlar = useCallback(async () => {
    setIsLoadingKutuphane(true);
    try {
      let anahtarlar: KayitliAnahtar[] = [];

      // Yeni API: /api/cevap-anahtari?organizationId=xxx
      try {
        const response = await fetch(`/api/cevap-anahtari?organizationId=${organizationId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            anahtarlar = result.data.map((template: any) => ({
              id: template.examId,
              ad: template.examName,
              sinavTuru: template.examType,
              toplamSoru: template.totalQuestions,
              olusturulmaTarihi: template.examDate || new Date().toISOString(),
            }));
          }
        }
      } catch (apiError) {
        console.warn('API yüklenemedi:', apiError);
      }

      // 2. localStorage'dan da yükle (varsa) - backward compatibility
      try {
        const localKey = `answer_key_${organizationId}`;
        const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
        const localAnahtarlar = localData.map((row: any) => ({
          id: row.id,
          ad: row.name + ' (Yerel)',
          sinavTuru: row.exam_type,
          toplamSoru: row.total_questions,
          olusturulmaTarihi: row.created_at,
        }));
        anahtarlar = [...anahtarlar, ...localAnahtarlar];
      } catch (localError) {
        console.warn('localStorage yüklenemedi:', localError);
      }

      setKayitliAnahtarlar(anahtarlar);
    } catch (error) {
      console.error('Kütüphane yükleme hatası:', error);
    } finally {
      setIsLoadingKutuphane(false);
    }
  }, [supabase, organizationId]);

  // İlk yüklemede kütüphaneyi getir
  useEffect(() => {
    loadKayitliAnahtarlar();
  }, [loadKayitliAnahtarlar]);

  // KÜTÜPHANE - Yükle
  const handleKutuphaneYukle = useCallback(async () => {
    if (!seciliSablonId) {
      toast.error('Lütfen bir şablon seçin.');
      return;
    }

    setIsLoadingKutuphane(true);
    try {
      // localStorage'dan mı?
      if (seciliSablonId.startsWith('local-')) {
        const localKey = `answer_key_${organizationId}`;
        const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
        const found = localData.find((item: any) => item.id === seciliSablonId);
        if (found?.answer_data) {
          const loadedAnahtar = found.answer_data as CevapAnahtari;
          updateCevapAnahtari(loadedAnahtar, 'library');
          toast.success('Şablon yüklendi (Yerel).');
        } else {
          toast.error('Şablon bulunamadı.');
        }
        return;
      }

      // Yeni API: /api/cevap-anahtari?examId=xxx
      const response = await fetch(`/api/cevap-anahtari?organizationId=${organizationId}&examId=${seciliSablonId}`);
      if (!response.ok) {
        throw new Error('Şablon yüklenemedi');
      }

      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error('Geçersiz veri formatı');
      }

      // sinav_cevap_anahtari'ndan CevapAnahtari'ya dönüştür
      const items: CevapAnahtariItem[] = result.data.map((row: any) => ({
        soruNo: row.soru_no,
        dogruCevap: row.dogru_cevap,
        dersKodu: row.ders_kodu,
        dersAdi: row.ders_kodu, // Ders adı mapping yapılabilir
        kazanimKodu: row.kazanim_kodu,
        kazanimAciklamasi: row.kazanim_metni,
        konuAdi: row.konu_adi,
        zorlukDerecesi: row.zorluk ? Math.round(row.zorluk * 5) : 3, // 0.0-1.0 -> 1-5
      }));

      const loadedAnahtar: CevapAnahtari = {
        ...cevapAnahtari,
        items,
      };

      updateCevapAnahtari(loadedAnahtar, 'library');
      toast.success('Şablon yüklendi.');
    } catch (error: any) {
      console.error('Yükleme hatası:', error);
      toast.error(error.message || 'Şablon yüklenemedi.');
    } finally {
      setIsLoadingKutuphane(false);
    }
  }, [seciliSablonId, organizationId, cevapAnahtari, updateCevapAnahtari]);

  // KÜTÜPHANE - Kaydet
  const handleKutuphaneKaydet = useCallback(async () => {
    if (!yeniSablonAdi.trim()) {
      toast.error('Lütfen şablon adı girin.');
      return;
    }

    if (stats.doldurulanSoru === 0) {
      toast.error('Kaydedilecek cevap yok. Önce cevapları girin.');
      return;
    }

    setIsSaving(true);
    try {
      // Önce Supabase'e kaydetmeyi dene
      const { error } = await supabase.from('answer_key_templates').insert({
        organization_id: organizationId,
        name: yeniSablonAdi.trim(),
        exam_type: step1Data.sinavTuru,
        class_level: step1Data.sinifSeviyesi,
        total_questions: toplamSoru,
        answer_data: cevapAnahtari,
      });

      if (error) {
        // Tablo yoksa veya hata varsa localStorage'a kaydet
        console.warn('Supabase hatası, localStorage kullanılıyor:', error);
        const localKey = `answer_key_${organizationId}`;
        const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
        const newTemplate = {
          id: `local-${Date.now()}`,
          name: yeniSablonAdi.trim(),
          exam_type: step1Data.sinavTuru,
          class_level: step1Data.sinifSeviyesi,
          total_questions: toplamSoru,
          answer_data: cevapAnahtari,
          created_at: new Date().toISOString(),
        };
        existing.push(newTemplate);
        localStorage.setItem(localKey, JSON.stringify(existing));
        
        toast.success(`"${yeniSablonAdi}" yerel olarak kaydedildi.`);
        setYeniSablonAdi('');
        loadKayitliAnahtarlar();
        return;
      }

      toast.success(`"${yeniSablonAdi}" olarak kaydedildi.`);
      setYeniSablonAdi('');
      loadKayitliAnahtarlar(); // Listeyi yenile
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      
      // Fallback: localStorage'a kaydet
      try {
        const localKey = `answer_key_${organizationId}`;
        const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
        const newTemplate = {
          id: `local-${Date.now()}`,
          name: yeniSablonAdi.trim(),
          exam_type: step1Data.sinavTuru,
          class_level: step1Data.sinifSeviyesi,
          total_questions: toplamSoru,
          answer_data: cevapAnahtari,
          created_at: new Date().toISOString(),
        };
        existing.push(newTemplate);
        localStorage.setItem(localKey, JSON.stringify(existing));
        
        toast.success(`"${yeniSablonAdi}" yerel olarak kaydedildi.`);
        setYeniSablonAdi('');
        loadKayitliAnahtarlar();
      } catch (localError) {
        toast.error('Kaydetme başarısız: ' + (error.message || 'Bilinmeyen hata'));
      }
    } finally {
      setIsSaving(false);
    }
  }, [yeniSablonAdi, stats.doldurulanSoru, supabase, organizationId, step1Data, toplamSoru, cevapAnahtari, loadKayitliAnahtarlar]);

  // KÜTÜPHANE - Sil
  const handleKutuphaneSil = useCallback(async () => {
    if (!seciliSablonId) {
      toast.error('Lütfen bir şablon seçin.');
      return;
    }

    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return;

    try {
      // localStorage'dan mı?
      if (seciliSablonId.startsWith('local-')) {
        const localKey = `answer_key_${organizationId}`;
        const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
        const filtered = localData.filter((item: any) => item.id !== seciliSablonId);
        localStorage.setItem(localKey, JSON.stringify(filtered));
        toast.success('Şablon silindi (Yerel).');
        setSeciliSablonId('');
        loadKayitliAnahtarlar();
        return;
      }

      // Supabase'den sil
      const { error } = await supabase
        .from('answer_key_templates')
        .delete()
        .eq('id', seciliSablonId);

      if (error) throw error;

      toast.success('Şablon silindi.');
      setSeciliSablonId('');
      loadKayitliAnahtarlar();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Şablon silinemedi.');
    }
  }, [seciliSablonId, supabase, organizationId, loadKayitliAnahtarlar]);

  // Ders için girilen cevapları string olarak al (ABCD... formatında)
  const getDersCevapString = useCallback((dersKodu: string): string => {
    const dersItems = cevapAnahtari.items
      .filter(i => i.dersKodu === dersKodu)
      .sort((a, b) => a.soruNo - b.soruNo);
    
    return dersItems.map(item => getItemCevap(item, aktifKitapcik) || '-').join('');
  }, [cevapAnahtari.items, aktifKitapcik, getItemCevap]);

  // EDİTÖR - Ders genişlet/daralt
  const toggleDers = useCallback((dersKodu: string) => {
    setExpandedDersler(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dersKodu)) {
        newSet.delete(dersKodu);
      } else {
        newSet.add(dersKodu);
      }
      return newSet;
    });
  }, []);

  // EDİTÖR - Tümünü genişlet
  const expandAll = useCallback(() => {
    setExpandedDersler(new Set(dersDagilimi.map(d => d.dersKodu)));
  }, [dersDagilimi]);

  // EDİTÖR - Satır seçimi
  const toggleRowSelection = useCallback((soruNo: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(soruNo)) {
        newSet.delete(soruNo);
      } else {
        newSet.add(soruNo);
      }
      return newSet;
    });
  }, []);

  // EDİTÖR - Tümünü seç
  const toggleSelectAll = useCallback(() => {
    if (selectedRows.size === cevapAnahtari.items.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(cevapAnahtari.items.map(i => i.soruNo)));
    }
  }, [selectedRows.size, cevapAnahtari.items]);

  // EDİTÖR - Seçili satırları sil
  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.size === 0) return;
    if (!confirm(`${selectedRows.size} sorunun cevabı silinecek. Emin misiniz?`)) return;
    
    const newAnahtar = deleteSelectedItems(cevapAnahtari, Array.from(selectedRows));
    updateCevapAnahtari(newAnahtar, 'manual');
    setSelectedRows(new Set());
    toast.success(`${selectedRows.size} soru temizlendi.`);
  }, [selectedRows, cevapAnahtari, updateCevapAnahtari]);

  // EDİTÖR - Tümünü temizle
  const handleClearAll = useCallback(() => {
    if (!confirm('Tüm cevaplar silinecek. Emin misiniz?')) return;
    const newAnahtar = clearAllAnswers(cevapAnahtari);
    updateCevapAnahtari(newAnahtar, 'manual');
    toast.success('Tüm cevaplar temizlendi.');
  }, [cevapAnahtari, updateCevapAnahtari]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. BÖLÜM - CEVAP ANAHTARI KÜTÜPHANESİ (HER ZAMAN GÖRÜNÜR) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Library className="text-slate-600" size={20} />
            <h3 className="font-semibold text-slate-700">Cevap Anahtarı Kütüphanesi</h3>
            <span className="text-xs text-gray-400">Tekrar tekrar girmeyin</span>
          </div>
          <button
            onClick={loadKayitliAnahtarlar}
            disabled={isLoadingKutuphane}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw size={14} className={isLoadingKutuphane ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Sol: Kayıtlı anahtardan yükle */}
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <span className="text-sm text-gray-600 whitespace-nowrap">Kayıtlı anahtardan yükle</span>
            <select
              value={seciliSablonId}
              onChange={(e) => setSeciliSablonId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">SEÇİNİZ...</option>
              {kayitliAnahtarlar.map((a) => (
                <option key={a.id} value={a.id}>{a.ad}</option>
              ))}
            </select>
            <button
              onClick={handleKutuphaneYukle}
              disabled={!seciliSablonId || isLoadingKutuphane}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
                seciliSablonId && !isLoadingKutuphane
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {isLoadingKutuphane ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Yükle
            </button>
            <button
              onClick={handleKutuphaneSil}
              disabled={!seciliSablonId}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                seciliSablonId
                  ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              Sil
            </button>
          </div>

          {/* Sağ: Mevcut anahtarı kaydet */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Mevcut anahtarı kaydet</span>
            <input
              type="text"
              placeholder="Örn: ÖZDEBİR LGS DENEME 1"
              value={yeniSablonAdi}
              onChange={(e) => setYeniSablonAdi(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-56 focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleKutuphaneKaydet}
              disabled={isSaving || stats.doldurulanSoru === 0}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors',
                isSaving || stats.doldurulanSoru === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-slate-800 text-white hover:bg-slate-900'
              )}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Kaydet
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Kaydettikten sonra istediğiniz sınavda "Yükle" diyerek kullanabilirsiniz.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* KİTAPÇIK SEÇİMİ (TÜM BÖLÜMLER İÇİN ORTAK) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step1Data.kitapcikTurleri.length > 1 && (
        <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <span className="text-sm font-semibold text-amber-800">Kitapçık Seç:</span>
          <div className="flex gap-2">
            {(['A', 'B', 'C', 'D'] as KitapcikTuru[]).filter(k => step1Data.kitapcikTurleri.includes(k)).map((kit) => (
              <button
                key={kit}
                onClick={() => setAktifKitapcik(kit)}
                className={cn(
                  'w-12 h-12 rounded-xl font-bold text-lg transition-all',
                  aktifKitapcik === kit
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                )}
              >
                {kit}
              </button>
            ))}
          </div>
          <span className="text-sm text-amber-700 ml-auto font-medium">
            Aktif: Kitapçık {aktifKitapcik} ({stats.doldurulanSoru}/{toplamSoru})
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. BÖLÜM - TEK ALANDA TOPLU YAPIŞTIR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-emerald-600" size={20} />
          <h3 className="font-semibold text-emerald-700">Tek Seferde Yapıştır</h3>
          <span className="text-xs text-emerald-500 ml-2">
            {toplamSoru} sorunun tamamını tek alana yapıştırın.
          </span>
        </div>

        <div className="text-xs text-emerald-600 mb-3">
          Desteklenen: <code className="bg-white px-1 rounded">ABCDABCD...</code> | <code className="bg-white px-1 rounded">A B C D...</code> | <code className="bg-white px-1 rounded">1 2 3 4...</code> | Satır satır
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {toplamSoru} Sorunun Cevaplarını Yapıştırın (Kitapçık {aktifKitapcik}):
          </label>
          <div className="relative">
            <textarea
              value={topluCevapInput}
              onChange={(e) => handleTopluInputChange(e.target.value)}
              placeholder={`Örnek: ABCDABCDABCD... (toplam ${toplamSoru} cevap)`}
              className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm resize-none"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-bold',
                topluParseResult?.isValid
                  ? 'bg-emerald-100 text-emerald-700'
                  : topluParseResult?.girilmisSayi && topluParseResult.girilmisSayi > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
              )}>
                {topluParseResult?.girilmisSayi || 0} / {toplamSoru}
              </span>
              {topluParseResult?.isValid && <Check className="text-emerald-500" size={20} />}
            </div>
          </div>

          {/* Hata/Uyarı mesajları */}
          {topluParseResult && (topluParseResult.hatalar.length > 0 || topluParseResult.uyarilar.length > 0) && (
            <div className="space-y-1">
              {topluParseResult.hatalar.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {h}
                </div>
              ))}
              {topluParseResult.uyarilar.map((u, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle size={14} />
                  {u}
                </div>
              ))}
            </div>
          )}

          {/* Uygula butonu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setTopluCevapInput(''); setTopluParseResult(null); }}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
            >
              Temizle
            </button>
            <div className="flex-1" />
            <button
              onClick={handleTopluApply}
              disabled={!topluParseResult?.isValid}
              className={cn(
                'px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2',
                topluParseResult?.isValid
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              <Download size={18} />
              Cevapları Uygula
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. BÖLÜM - HIZLI DERS BAZLI YAPIŞTIRMA */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-sky-600" size={20} />
            <h3 className="font-semibold text-sky-700">Hızlı Ders Bazlı Cevap Girişi - Kitapçık {aktifKitapcik}</h3>
          </div>
          <span className="text-xs text-sky-500">Her derse direkt yapıştır!</span>
        </div>

        {/* Ders Tablosu */}
        <div className="border border-sky-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-sky-50">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-gray-700 w-8"></th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Ders</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700 w-14">Soru</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700 w-48">Yapıştır</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Girilen Cevaplar</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700 w-24">Durum</th>
              </tr>
            </thead>
            <tbody>
              {dersDagilimi.map((ders) => {
                const renkler = DERS_RENKLERI[ders.dersKodu] || { icon: '📚', text: 'text-gray-600' };
                const key = `${aktifKitapcik}:${ders.dersKodu}`;
                const inputValue = dersYapistirInputs[key] || '';
                const result = dersYapistirResults[key];
                const dersStatsItem = dersStats[ders.dersKodu];
                const girilmisSayi = result?.cevaplar.filter(c => c !== null).length || 0;
                const isComplete = dersStatsItem?.dolduruan === ders.soruSayisi;
                const hasPartial = (dersStatsItem?.dolduruan || 0) > 0 && !isComplete;
                const cevapString = getDersCevapString(ders.dersKodu);
                const hasEmpty = cevapString.includes('-');

                return (
                  <tr key={ders.dersKodu} className={cn(
                    'border-t border-gray-100 transition-colors',
                    isComplete ? 'bg-emerald-50/50' : hasPartial ? 'bg-amber-50/30' : 'hover:bg-gray-50'
                  )}>
                    <td className="px-3 py-3 text-gray-400">⋮⋮</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{renkler.icon}</span>
                        <span className={cn('font-medium', renkler.text)}>{ders.dersAdi}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-sky-600">{ders.soruSayisi}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => handleDersInputChange(ders.dersKodu, ders.soruSayisi, e.target.value)}
                          placeholder={`${ders.soruSayisi} cevap...`}
                          disabled={isComplete && editingDersKodu !== ders.dersKodu}
                          className={cn(
                            'w-full px-2 py-1.5 border rounded text-xs font-mono',
                            isComplete && editingDersKodu !== ders.dersKodu
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'
                          )}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && result?.isValid) {
                              handleDersApply(ders.dersKodu, ders.dersAdi);
                            }
                          }}
                        />
                        {result?.isValid && (
                          <button
                            onClick={() => handleDersApply(ders.dersKodu, ders.dersAdi)}
                            className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 flex-shrink-0"
                            title="Uygula"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {/* Girilen cevapları göster */}
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          'font-mono text-xs px-2 py-1 rounded max-w-[200px] overflow-hidden',
                          isComplete ? 'bg-emerald-100 text-emerald-700' :
                          hasPartial ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-400'
                        )}>
                          <span className="truncate block" title={cevapString}>
                            {cevapString.length > 0 ? cevapString : '---'}
                          </span>
                        </div>
                        <span className={cn(
                          'text-xs font-bold px-1.5 py-0.5 rounded',
                          isComplete ? 'bg-emerald-500 text-white' :
                          hasPartial ? 'bg-amber-500 text-white' :
                          'bg-gray-200 text-gray-500'
                        )}>
                          {dersStatsItem?.dolduruan || 0}/{ders.soruSayisi}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isComplete ? (
                          editingDersKodu === ders.dersKodu ? (
                            <button
                              onClick={() => setEditingDersKodu(null)}
                              className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600"
                            >
                              <Check size={14} />
                              Kaydet
                            </button>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 size={16} />
                                <span className="text-xs font-medium">Tamam</span>
                              </div>
                              <button
                                onClick={() => setEditingDersKodu(ders.dersKodu)}
                                className="p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                                title="Düzenle"
                              >
                                <Edit3 size={14} />
                              </button>
                            </>
                          )
                        ) : hasPartial ? (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle size={18} />
                            <span className="text-xs font-medium">Eksik</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-500">
                            <XCircle size={18} />
                            <span className="text-xs font-medium">Boş</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Global Kaydet Butonu */}
        {allLessonsComplete && editingDersKodu === null && (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                toast.success('✅ Tüm cevaplar kaydedildi!');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-md transition-all"
            >
              <Save size={18} />
              💾 Kaydet
            </button>
          </div>
        )}

        <p className="text-xs text-sky-500 mt-3 flex items-center gap-1">
          <AlertCircle size={12} />
          Her ders için cevap sayısına ulaştığında otomatik uygulanır.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. BÖLÜM - CEVAP ANAHTARI EDİTÖRÜ (MASTER KONTROL) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Başlık */}
        <div className="bg-gray-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="text-gray-600" size={18} />
            <h3 className="font-semibold text-gray-700">Cevap Anahtarı Editörü</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Arama */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 w-40 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {selectedRows.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
              >
                <Trash2 size={14} />
                {selectedRows.size} Sil
              </button>
            )}
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Tümünü Aç
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              Tümünü Temizle
            </button>
          </div>
        </div>

        {/* Ders Bazlı Accordion Editör */}
        <div className="divide-y divide-gray-100">
          {dersDagilimi.map((ders) => {
            const renkler = DERS_RENKLERI[ders.dersKodu] || { icon: '📚', text: 'text-gray-600', bg: 'bg-gray-500' };
            const isExpanded = expandedDersler.has(ders.dersKodu);
            const dersItems = cevapAnahtari.items.filter(i => i.dersKodu === ders.dersKodu);
            const doldurulan = dersItems.filter(i => !!getItemCevap(i, aktifKitapcik)).length;

            return (
              <div key={ders.dersKodu}>
                {/* Accordion Header */}
                <button
                  onClick={() => toggleDers(ders.dersKodu)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{renkler.icon}</span>
                    <div className="text-left">
                      <p className={cn('font-semibold', renkler.text)}>{ders.dersAdi}</p>
                      <p className="text-xs text-gray-500">Soru {ders.baslangicSoru || 1} - {(ders.baslangicSoru || 1) + ders.soruSayisi - 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${(doldurulan / ders.soruSayisi) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 font-medium">{doldurulan}/{ders.soruSayisi}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="bg-gray-50 p-4 border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 text-xs">
                          <th className="pb-2 w-8">
                            <input
                              type="checkbox"
                              onChange={() => {
                                const dersItemNos = dersItems.map(i => i.soruNo);
                                const allSelected = dersItemNos.every(no => selectedRows.has(no));
                                if (allSelected) {
                                  setSelectedRows(prev => {
                                    const newSet = new Set(prev);
                                    dersItemNos.forEach(no => newSet.delete(no));
                                    return newSet;
                                  });
                                } else {
                                  setSelectedRows(prev => new Set([...prev, ...dersItemNos]));
                                }
                              }}
                              className="rounded border-gray-300 text-emerald-500"
                            />
                          </th>
                          <th className="pb-2 w-12">No</th>
                          <th className="pb-2 w-32">Cevap</th>
                          <th className="pb-2 w-32">Kazanım Kodu</th>
                          <th className="pb-2">Kazanım Açıklaması</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dersItems.map((item) => {
                          const mevcutCevap = getItemCevap(item, aktifKitapcik);
                          return (
                            <tr key={item.soruNo} className={cn(
                              'border-t border-gray-200',
                              selectedRows.has(item.soruNo) ? 'bg-emerald-50' : 'hover:bg-white'
                            )}>
                              <td className="py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(item.soruNo)}
                                  onChange={() => toggleRowSelection(item.soruNo)}
                                  className="rounded border-gray-300 text-emerald-500"
                                />
                              </td>
                              <td className="py-2 font-medium text-gray-700">{item.soruNo}</td>
                              <td className="py-2">
                                <div className="flex gap-1">
                                  {(['A', 'B', 'C', 'D', 'E'] as CevapSecenegi[]).map((cevap) => (
                                    <button
                                      key={cevap}
                                      onClick={() => handleCevapChange(item.soruNo, mevcutCevap === cevap ? null : cevap)}
                                      className={cn(
                                        'w-7 h-7 rounded text-xs font-bold transition-all',
                                        mevcutCevap === cevap
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-white text-gray-400 border border-gray-200 hover:border-emerald-300'
                                      )}
                                    >
                                      {cevap}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2">
                                <input
                                  type="text"
                                  value={item.kazanimKodu || ''}
                                  placeholder="T.8.3.5"
                                  onChange={(e) => {
                                    const newItems = cevapAnahtari.items.map(i =>
                                      i.soruNo === item.soruNo ? { ...i, kazanimKodu: e.target.value } : i
                                    );
                                    updateCevapAnahtari({ ...cevapAnahtari, items: newItems }, 'manual');
                                  }}
                                  className="w-24 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500"
                                />
                              </td>
                              <td className="py-2">
                                <input
                                  type="text"
                                  value={item.kazanimAciklamasi || ''}
                                  placeholder="Kazanım açıklaması..."
                                  onChange={(e) => {
                                    const newItems = cevapAnahtari.items.map(i =>
                                      i.soruNo === item.soruNo ? { ...i, kazanimAciklamasi: e.target.value } : i
                                    );
                                    updateCevapAnahtari({ ...cevapAnahtari, items: newItems }, 'manual');
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ÖZET İSTATİSTİK */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.doldurulanSoru}</p>
            <p className="text-xs text-gray-500">Girildi</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.bosKalanSoru}</p>
            <p className="text-xs text-gray-500">Boş</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">{stats.kazanimliSoru}</p>
            <p className="text-xs text-gray-500">Kazanımlı</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.iptalSoru}</p>
            <p className="text-xs text-gray-500">İptal</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            'text-sm font-medium flex items-center gap-2',
            validation.valid ? 'text-emerald-600' : 'text-amber-600'
          )}>
            {validation.valid ? (
              <>
                <CheckCircle2 size={18} />
                Hazır
              </>
            ) : (
              <>
                <AlertCircle size={18} />
                {stats.bosKalanSoru} soru eksik
              </>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Kitapçık {aktifKitapcik} • {step1Data.sinavTuru} • {toplamSoru} soru
          </p>
        </div>
      </div>
    </div>
  );
}

export default Step2CevapAnahtari;
