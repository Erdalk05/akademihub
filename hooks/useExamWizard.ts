/**
 * Exam Analytics - Wizard Hook
 * Tüm wizard state'ini ve işlemlerini yöneten ana hook
 */

import { useState, useCallback, useMemo } from 'react';
import {
  WizardState,
  WizardStep,
  SinavTipi,
  SinavDers,
  DersCevapGirisi,
  ParsedKatilimci,
  Kitapcik,
  SINAV_TURLERI,
} from '@/types/exam-analytics';

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const initialState: WizardState = {
  currentStep: 1,
  sinavId: undefined,
  sinavKodu: undefined,
  
  step1: {
    sinavAdi: '',
    sinavTarihi: undefined,
    sinifSeviyesi: 8,
    sinavTuru: '',
    sureDakika: 120,
    yanlisKatsayi: 0.333,
    dersler: [],
    toplamSoru: 0,
    isCompleted: false,
  },
  
  step2: {
    kitapcik: 'A',
    cevaplar: [],
    toplamCevap: 0,
    girilenCevap: 0,
    isCompleted: false,
  },
  
  step3: {
    optikSablonId: undefined,
    sablonSecildi: false,
    isCompleted: false,
  },
  
  step4: {
    dosyaAdi: undefined,
    dosyaIcerik: undefined,
    katilimcilar: [],
    toplamKatilimci: 0,
    eslesen: 0,
    eslesemeyen: 0,
    isCompleted: false,
  },
  
  step5: {
    hazirMi: false,
    kontrolListesi: {
      sinavBilgileri: false,
      cevapAnahtari: false,
      katilimcilar: false,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useExamWizard() {
  const [state, setState] = useState<WizardState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────

  const canGoNext = useMemo(() => {
    switch (state.currentStep) {
      case 1:
        return state.step1.isCompleted;
      case 2:
        return state.step2.isCompleted;
      case 3:
        return state.step3.isCompleted;
      case 4:
        return state.step4.isCompleted;
      case 5:
        return state.step5.hazirMi;
      default:
        return false;
    }
  }, [state]);

  const goToStep = useCallback((step: WizardStep) => {
    // Sadece tamamlanmış adımlara veya bir sonraki adıma gidilebilir
    if (step <= state.currentStep + 1) {
      setState(prev => ({ ...prev, currentStep: step }));
    }
  }, [state.currentStep]);

  const goNext = useCallback(() => {
    if (canGoNext && state.currentStep < 5) {
      setState(prev => ({ ...prev, currentStep: (prev.currentStep + 1) as WizardStep }));
    }
  }, [canGoNext, state.currentStep]);

  const goBack = useCallback(() => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: (prev.currentStep - 1) as WizardStep }));
    }
  }, [state.currentStep]);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 - SINAV BİLGİLERİ
  // ─────────────────────────────────────────────────────────────────────────

  const setSinavAdi = useCallback((adi: string) => {
    setState(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        sinavAdi: adi,
        isCompleted: validateStep1({ ...prev.step1, sinavAdi: adi }),
      },
    }));
  }, []);

  const setSinavTarihi = useCallback((tarih: Date | undefined) => {
    setState(prev => ({
      ...prev,
      step1: { ...prev.step1, sinavTarihi: tarih },
    }));
  }, []);

  const setSinifSeviyesi = useCallback((seviye: number) => {
    setState(prev => ({
      ...prev,
      step1: { ...prev.step1, sinifSeviyesi: seviye },
    }));
  }, []);

  const setSinavTuru = useCallback((tur: SinavTipi) => {
    const config = SINAV_TURLERI[tur];
    
    // Varsayılan dersleri oluştur
    let dersler: SinavDers[] = [];
    let baslangic = 1;
    
    if (config?.varsayilanDersler?.length > 0) {
      dersler = config.varsayilanDersler.map((d, index) => ({
        dersId: '', // Backend'den gelecek
        dersKodu: d.kod,
        dersAdi: d.ad,
        renkKodu: '#3B82F6',
        soruSayisi: d.soru,
        siraNo: index + 1,
        baslangicSoru: baslangic,
        bitisSoru: baslangic + d.soru - 1,
      }));
      baslangic += dersler.reduce((t, d) => t + d.soruSayisi, 0);
    }
    
    const toplamSoru = config?.toplamSoru || dersler.reduce((t, d) => t + d.soruSayisi, 0);
    
    setState(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        sinavTuru: tur,
        sureDakika: config?.sure || 120,
        yanlisKatsayi: config?.yanlisKatsayi || 0.333,
        dersler,
        toplamSoru,
        isCompleted: validateStep1({
          ...prev.step1,
          sinavTuru: tur,
          dersler,
        }),
      },
    }));
  }, []);

  const setDersler = useCallback((dersler: SinavDers[]) => {
    // Başlangıç/bitiş sorularını yeniden hesapla
    let baslangic = 1;
    const guncelDersler = dersler.map((d, index) => ({
      ...d,
      siraNo: index + 1,
      baslangicSoru: baslangic,
      bitisSoru: baslangic + d.soruSayisi - 1,
    }));
    baslangic = guncelDersler.reduce((t, d) => t + d.soruSayisi, 0);
    
    const toplamSoru = guncelDersler.reduce((t, d) => t + d.soruSayisi, 0);
    
    setState(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        dersler: guncelDersler,
        toplamSoru,
        isCompleted: validateStep1({
          ...prev.step1,
          dersler: guncelDersler,
        }),
      },
      // Step 2'yi de güncelle (ders listesi değişti)
      step2: {
        ...prev.step2,
        cevaplar: guncelDersler.map(d => ({
          dersId: d.dersId,
          dersKodu: d.dersKodu,
          dersAdi: d.dersAdi,
          soruSayisi: d.soruSayisi,
          cevapDizisi: '',
          girilenCevap: 0,
          tamamlandi: false,
        })),
        toplamCevap: toplamSoru,
        girilenCevap: 0,
        isCompleted: false,
      },
    }));
  }, []);

  const addDers = useCallback((ders: Omit<SinavDers, 'siraNo' | 'baslangicSoru' | 'bitisSoru'>) => {
    setState(prev => {
      const yeniDersler = [...prev.step1.dersler];
      const sonBitis = yeniDersler.length > 0 
        ? yeniDersler[yeniDersler.length - 1].bitisSoru 
        : 0;
      
      yeniDersler.push({
        ...ders,
        siraNo: yeniDersler.length + 1,
        baslangicSoru: sonBitis + 1,
        bitisSoru: sonBitis + ders.soruSayisi,
      });
      
      const toplamSoru = yeniDersler.reduce((t, d) => t + d.soruSayisi, 0);
      
      return {
        ...prev,
        step1: {
          ...prev.step1,
          dersler: yeniDersler,
          toplamSoru,
          isCompleted: validateStep1({
            ...prev.step1,
            dersler: yeniDersler,
          }),
        },
      };
    });
  }, []);

  const removeDers = useCallback((dersId: string) => {
    setState(prev => {
      const yeniDersler = prev.step1.dersler.filter(d => d.dersId !== dersId);
      
      // Sıra ve pozisyonları yeniden hesapla
      let baslangic = 1;
      const guncelDersler = yeniDersler.map((d, index) => {
        const guncellenmis = {
          ...d,
          siraNo: index + 1,
          baslangicSoru: baslangic,
          bitisSoru: baslangic + d.soruSayisi - 1,
        };
        baslangic += d.soruSayisi;
        return guncellenmis;
      });
      
      const toplamSoru = guncelDersler.reduce((t, d) => t + d.soruSayisi, 0);
      
      return {
        ...prev,
        step1: {
          ...prev.step1,
          dersler: guncelDersler,
          toplamSoru,
          isCompleted: validateStep1({
            ...prev.step1,
            dersler: guncelDersler,
          }),
        },
      };
    });
  }, []);

  const updateDersSoruSayisi = useCallback((dersId: string, soruSayisi: number) => {
    setState(prev => {
      const yeniDersler = prev.step1.dersler.map(d => 
        d.dersId === dersId ? { ...d, soruSayisi } : d
      );
      
      // Pozisyonları yeniden hesapla
      let baslangic = 1;
      const guncelDersler = yeniDersler.map((d, index) => {
        const guncellenmis = {
          ...d,
          siraNo: index + 1,
          baslangicSoru: baslangic,
          bitisSoru: baslangic + d.soruSayisi - 1,
        };
        baslangic += d.soruSayisi;
        return guncellenmis;
      });
      
      const toplamSoru = guncelDersler.reduce((t, d) => t + d.soruSayisi, 0);
      
      return {
        ...prev,
        step1: {
          ...prev.step1,
          dersler: guncelDersler,
          toplamSoru,
        },
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 - CEVAP ANAHTARI
  // ─────────────────────────────────────────────────────────────────────────

  const setKitapcik = useCallback((kitapcik: Kitapcik) => {
    setState(prev => ({
      ...prev,
      step2: { ...prev.step2, kitapcik },
    }));
  }, []);

  const setCevapDizisi = useCallback((dersId: string, cevapDizisi: string) => {
    setState(prev => {
      const yeniCevaplar = prev.step2.cevaplar.map(c => {
        if (c.dersId === dersId) {
          const girilenCevap = cevapDizisi.replace(/[^A-Ea-e]/g, '').length;
          return {
            ...c,
            cevapDizisi: cevapDizisi.toUpperCase(),
            girilenCevap,
            tamamlandi: girilenCevap >= c.soruSayisi,
          };
        }
        return c;
      });
      
      const toplamGirilen = yeniCevaplar.reduce((t, c) => t + c.girilenCevap, 0);
      const tumTamamlandi = yeniCevaplar.every(c => c.tamamlandi);
      
      return {
        ...prev,
        step2: {
          ...prev.step2,
          cevaplar: yeniCevaplar,
          girilenCevap: toplamGirilen,
          isCompleted: tumTamamlandi,
        },
      };
    });
  }, []);

  const setTumCevaplar = useCallback((tumCevaplar: string) => {
    setState(prev => {
      const temiz = tumCevaplar.replace(/[^A-Ea-e]/g, '').toUpperCase();
      let index = 0;
      
      const yeniCevaplar = prev.step2.cevaplar.map(c => {
        const dersCevaplari = temiz.substring(index, index + c.soruSayisi);
        index += c.soruSayisi;
        
        return {
          ...c,
          cevapDizisi: dersCevaplari,
          girilenCevap: dersCevaplari.length,
          tamamlandi: dersCevaplari.length >= c.soruSayisi,
        };
      });
      
      const toplamGirilen = yeniCevaplar.reduce((t, c) => t + c.girilenCevap, 0);
      const tumTamamlandi = yeniCevaplar.every(c => c.tamamlandi);
      
      return {
        ...prev,
        step2: {
          ...prev.step2,
          cevaplar: yeniCevaplar,
          girilenCevap: toplamGirilen,
          isCompleted: tumTamamlandi,
        },
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 - OPTİK ŞABLON
  // ─────────────────────────────────────────────────────────────────────────

  const setOptikSablon = useCallback((sablonId: string | undefined) => {
    setState(prev => ({
      ...prev,
      step3: {
        ...prev.step3,
        optikSablonId: sablonId,
        sablonSecildi: true,
        isCompleted: true,
      },
    }));
  }, []);

  const skipOptikSablon = useCallback(() => {
    setState(prev => ({
      ...prev,
      step3: {
        ...prev.step3,
        optikSablonId: undefined,
        sablonSecildi: false,
        isCompleted: true, // Atla seçeneği de tamamlanmış sayılır
      },
    }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4 - VERİ YÜKLE
  // ─────────────────────────────────────────────────────────────────────────

  const setDosya = useCallback((dosyaAdi: string, dosyaIcerik: string) => {
    setState(prev => ({
      ...prev,
      step4: {
        ...prev.step4,
        dosyaAdi,
        dosyaIcerik,
      },
    }));
  }, []);

  const setKatilimcilar = useCallback((katilimcilar: ParsedKatilimci[]) => {
    const eslesen = katilimcilar.filter(k => k.studentId).length;
    const eslesemeyen = katilimcilar.filter(k => !k.studentId).length;
    
    setState(prev => ({
      ...prev,
      step4: {
        ...prev.step4,
        katilimcilar,
        toplamKatilimci: katilimcilar.length,
        eslesen,
        eslesemeyen,
        isCompleted: katilimcilar.length > 0,
      },
    }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5 - ÖNİZLEME & YAYINLA
  // ─────────────────────────────────────────────────────────────────────────

  const checkKontrolListesi = useCallback(() => {
    setState(prev => {
      const kontrolListesi = {
        sinavBilgileri: prev.step1.isCompleted,
        cevapAnahtari: prev.step2.isCompleted,
        katilimcilar: prev.step4.isCompleted,
      };
      
      const hazirMi = Object.values(kontrolListesi).every(v => v);
      
      return {
        ...prev,
        step5: {
          ...prev.step5,
          kontrolListesi,
          hazirMi,
        },
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // API İŞLEMLERİ
  // ─────────────────────────────────────────────────────────────────────────

  const setSinavId = useCallback((sinavId: string, sinavKodu: string) => {
    setState(prev => ({
      ...prev,
      sinavId,
      sinavKodu,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    setError(null);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────

  const validateStep1 = (step1: typeof state.step1): boolean => {
    return (
      step1.sinavAdi.trim().length >= 3 &&
      step1.sinavTuru !== '' &&
      step1.dersler.length >= 1 &&
      step1.dersler.every(d => d.soruSayisi > 0)
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // State
    state,
    isLoading,
    error,
    canGoNext,
    
    // Navigation
    goToStep,
    goNext,
    goBack,
    
    // Step 1
    setSinavAdi,
    setSinavTarihi,
    setSinifSeviyesi,
    setSinavTuru,
    setDersler,
    addDers,
    removeDers,
    updateDersSoruSayisi,
    
    // Step 2
    setKitapcik,
    setCevapDizisi,
    setTumCevaplar,
    
    // Step 3
    setOptikSablon,
    skipOptikSablon,
    
    // Step 4
    setDosya,
    setKatilimcilar,
    
    // Step 5
    checkKontrolListesi,
    
    // API
    setSinavId,
    setIsLoading,
    setError,
    reset,
  };
}

export type UseExamWizardReturn = ReturnType<typeof useExamWizard>;
