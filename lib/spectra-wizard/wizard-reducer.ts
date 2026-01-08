// ============================================================================
// SPECTRA WIZARD STATE REDUCER
// Merkezi state yönetimi, useReducer ile kullanım
// ============================================================================

import type {
  WizardState,
  WizardAction,
  WizardStep1Data,
  WizardStep2Data,
  WizardStep3Data,
  WizardStep4Data,
  WizardStep5Data,
  PuanlamaFormulu,
} from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

export const initialWizardState: WizardState = {
  currentStep: 1,
  maxReachedStep: 1,
  draftExamId: '',
  step1: null,
  step2: null,
  step3: null,
  step4: null,
  step5: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSavedAt: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────────────────────

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
        maxReachedStep: Math.max(state.maxReachedStep || 1, action.payload) as WizardState['maxReachedStep'],
        error: null,
      };

    case 'SET_STEP1_DATA':
      return {
        ...state,
        step1: action.payload,
        error: null,
      };

    case 'SET_STEP2_DATA':
      return {
        ...state,
        step2: action.payload,
        error: null,
      };

    case 'SET_STEP3_DATA':
      return {
        ...state,
        step3: action.payload,
        error: null,
      };

    case 'SET_STEP4_DATA':
      return {
        ...state,
        step4: action.payload,
        error: null,
      };

    case 'SET_STEP5_DATA':
      return {
        ...state,
        step5: action.payload,
        error: null,
      };

    case 'UPDATE_PUANLAMA_FORMULU':
      if (!state.step1) return state;
      return {
        ...state,
        step1: {
          ...state.step1,
          puanlamaAyarlari: {
            ...(state.step1.puanlamaAyarlari || {} as PuanlamaFormulu),
            ...action.payload,
          } as PuanlamaFormulu,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload,
        lastSavedAt: action.payload ? undefined : new Date().toISOString(),
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isSaving: false,
      };

    case 'SET_DRAFT_EXAM_ID':
      return {
        ...state,
        draftExamId: action.payload,
      };

    case 'RESET_WIZARD':
      return {
        ...initialWizardState,
        draftExamId: crypto.randomUUID(),
      };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION CREATORS
// ─────────────────────────────────────────────────────────────────────────────

export const wizardActions = {
  setStep: (step: 1 | 2 | 3 | 4 | 5): WizardAction => ({
    type: 'SET_STEP',
    payload: step,
  }),

  setStep1Data: (data: WizardStep1Data): WizardAction => ({
    type: 'SET_STEP1_DATA',
    payload: data,
  }),

  setStep2Data: (data: WizardStep2Data): WizardAction => ({
    type: 'SET_STEP2_DATA',
    payload: data,
  }),

  setStep3Data: (data: WizardStep3Data): WizardAction => ({
    type: 'SET_STEP3_DATA',
    payload: data,
  }),

  setStep4Data: (data: WizardStep4Data): WizardAction => ({
    type: 'SET_STEP4_DATA',
    payload: data,
  }),

  setStep5Data: (data: WizardStep5Data): WizardAction => ({
    type: 'SET_STEP5_DATA',
    payload: data,
  }),

  updatePuanlamaFormulu: (data: Partial<PuanlamaFormulu>): WizardAction => ({
    type: 'UPDATE_PUANLAMA_FORMULU',
    payload: data,
  }),

  setLoading: (loading: boolean): WizardAction => ({
    type: 'SET_LOADING',
    payload: loading,
  }),

  setSaving: (saving: boolean): WizardAction => ({
    type: 'SET_SAVING',
    payload: saving,
  }),

  setError: (error: string | null): WizardAction => ({
    type: 'SET_ERROR',
    payload: error,
  }),

  setDraftExamId: (id: string): WizardAction => ({
    type: 'SET_DRAFT_EXAM_ID',
    payload: id,
  }),

  resetWizard: (): WizardAction => ({
    type: 'RESET_WIZARD',
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export const wizardSelectors = {
  /**
   * Mevcut adım geçerli mi?
   */
  isStepValid: (state: WizardState, step: 1 | 2 | 3 | 4 | 5): boolean => {
    switch (step) {
      case 1:
        return !!(
          state.step1?.sinavAdi &&
          state.step1?.sinavTarihi &&
          state.step1?.sinavTuru &&
          state.step1?.sinifSeviyesi
        );
      case 2:
        const cevapAnahtari = state.step2?.cevapAnahtari;
        if (!cevapAnahtari) return false;
        const doldurulan = cevapAnahtari.items.filter(i => i.dogruCevap).length;
        return doldurulan > 0;
      case 3:
        return !!(state.step3?.optikSablon);
      case 4:
        return !!(state.step4?.parseResult?.basariliSatir && state.step4.parseResult.basariliSatir > 0);
      case 5:
        return !!(state.step5?.sonuclar && state.step5.sonuclar.length > 0);
      default:
        return false;
    }
  },

  /**
   * Bir sonraki adıma geçilebilir mi?
   */
  canProceed: (state: WizardState): boolean => {
    return wizardSelectors.isStepValid(state, state.currentStep);
  },

  /**
   * Tüm adımlar tamamlandı mı?
   */
  isComplete: (state: WizardState): boolean => {
    return (
      wizardSelectors.isStepValid(state, 1) &&
      wizardSelectors.isStepValid(state, 2) &&
      wizardSelectors.isStepValid(state, 4) &&
      wizardSelectors.isStepValid(state, 5)
    );
  },

  /**
   * Tamamlanan adım sayısı
   */
  completedSteps: (state: WizardState): number => {
    let count = 0;
    for (let i = 1; i <= 5; i++) {
      if (wizardSelectors.isStepValid(state, i as 1 | 2 | 3 | 4 | 5)) {
        count++;
      }
    }
    return count;
  },

  /**
   * İlerleme yüzdesi
   */
  progressPercentage: (state: WizardState): number => {
    return Math.round((wizardSelectors.completedSteps(state) / 5) * 100);
  },

  /**
   * Toplam soru sayısı
   */
  getTotalQuestions: (state: WizardState): number => {
    return state.step2?.cevapAnahtari?.toplamSoru || 0;
  },

  /**
   * Toplam öğrenci sayısı
   */
  getTotalStudents: (state: WizardState): number => {
    return state.step4?.parseResult?.basariliSatir || 0;
  },

  /**
   * Özet bilgi
   */
  getSummary: (state: WizardState): {
    sinavAdi: string;
    sinavTuru: string;
    sinavTarihi: string;
    toplamSoru: number;
    toplamOgrenci: number;
    asilOgrenci: number;
    misafirOgrenci: number;
  } => {
    const asilSayisi = state.step4?.eslestirmeler?.filter(e => !e.isMisafir).length || 0;
    const toplamOgrenci = state.step4?.parseResult?.basariliSatir || 0;

    return {
      sinavAdi: state.step1?.sinavAdi || '',
      sinavTuru: state.step1?.sinavTuru || '',
      sinavTarihi: state.step1?.sinavTarihi || '',
      toplamSoru: state.step2?.cevapAnahtari?.toplamSoru || 0,
      toplamOgrenci,
      asilOgrenci: asilSayisi,
      misafirOgrenci: toplamOgrenci - asilSayisi,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'spectra-wizard-draft';

/**
 * State'i localStorage'a kaydet
 */
export function saveWizardToStorage(state: WizardState): void {
  try {
    const serialized = JSON.stringify({
      ...state,
      lastSavedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Wizard state kaydetme hatası:', error);
  }
}

/**
 * State'i localStorage'dan yükle
 */
export function loadWizardFromStorage(): WizardState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    
    const parsed = JSON.parse(serialized) as WizardState;
    
    // 24 saatten eski draft'ları yoksay
    if (parsed.lastSavedAt) {
      const savedTime = new Date(parsed.lastSavedAt).getTime();
      const now = Date.now();
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        clearWizardStorage();
        return null;
      }
    }
    
    return parsed;
  } catch (error) {
    console.error('Wizard state yükleme hatası:', error);
    return null;
  }
}

/**
 * localStorage'daki draft'ı temizle
 */
export function clearWizardStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Wizard storage temizleme hatası:', error);
  }
}

/**
 * Draft var mı kontrol et
 */
export function hasSavedDraft(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export interface StepValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Step 1 validasyonu
 */
export function validateStep1(data: WizardStep1Data | null): StepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push('Sınav bilgileri girilmedi');
    return { valid: false, errors, warnings };
  }

  if (!data.sinavAdi?.trim()) {
    errors.push('Sınav adı zorunludur');
  }

  if (!data.sinavTarihi) {
    errors.push('Sınav tarihi zorunludur');
  }

  if (!data.sinavTuru) {
    errors.push('Sınav türü seçilmedi');
  }

  if (!data.sinifSeviyesi) {
    errors.push('Sınıf seviyesi seçilmedi');
  }

  if (data.kitapcikTurleri.length === 0) {
    errors.push('En az bir kitapçık türü seçilmeli');
  }

  // Uyarılar
  if (!data.aciklama) {
    warnings.push('Sınav açıklaması eklenmedi');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Step 2 validasyonu
 */
export function validateStep2(data: WizardStep2Data | null): StepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data?.cevapAnahtari) {
    errors.push('Cevap anahtarı oluşturulmadı');
    return { valid: false, errors, warnings };
  }

  const cevapAnahtari = data.cevapAnahtari;
  const doldurulan = cevapAnahtari.items.filter(i => i.dogruCevap).length;
  const bos = cevapAnahtari.items.filter(i => !i.dogruCevap && !i.iptal).length;

  if (doldurulan === 0) {
    errors.push('Hiç cevap girilmedi');
  }

  if (bos > 0) {
    warnings.push(`${bos} soru boş bırakıldı`);
  }

  // Kazanım kontrolü
  const kazanimsiz = cevapAnahtari.items.filter(i => !i.kazanimKodu && !i.iptal).length;
  if (kazanimsiz > 0) {
    warnings.push(`${kazanimsiz} soruda kazanım kodu eksik`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Step 4 validasyonu
 */
export function validateStep4(data: WizardStep4Data | null): StepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data?.parseResult) {
    errors.push('Veri yüklenmedi');
    return { valid: false, errors, warnings };
  }

  const parseResult = data.parseResult;

  if (parseResult.basariliSatir === 0) {
    errors.push('Başarılı okunan öğrenci yok');
  }

  if (parseResult.hataliSatir > 0) {
    warnings.push(`${parseResult.hataliSatir} satır hatalı okundu`);
  }

  // Eşleşme kontrolü
  const bekleyenEslestirme = data.eslestirmeler?.filter(e => !e.dbStudentId && !e.isMisafir).length || 0;
  if (bekleyenEslestirme > 0) {
    warnings.push(`${bekleyenEslestirme} öğrenci eşleştirilmeyi bekliyor`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

