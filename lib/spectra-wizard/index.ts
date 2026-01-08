// ============================================================================
// SPECTRA WIZARD LIBRARY - MAIN EXPORTS
// v2.0 - World-class exam reading module
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// EXAM CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────
export {
  SINIF_BILGILERI,
  DERS_BILGILERI,
  DERS_RENKLERI,
  VARSAYILAN_LGS_PUANLAMA,
  VARSAYILAN_LGS_DENEME_PUANLAMA,
  VARSAYILAN_TYT_PUANLAMA,
  VARSAYILAN_AYT_SAY_PUANLAMA,
  SINAV_KONFIGURASYONLARI,
  SINIF_DENEME_SABLONLARI,
  getUygunSinavTurleri,
  getDersDagilimi,
  getToplamSoruSayisi,
  getSoruDersBilgisi,
  recalculateDersSirasi,
  getDersBilgisi,
  getDersRenk,
} from './exam-configs';

// ─────────────────────────────────────────────────────────────────────────────
// ANSWER KEY PARSER
// ─────────────────────────────────────────────────────────────────────────────
export {
  parseCevapString,
  parseDersBazliCevaplar,
  createEmptyCevapAnahtari,
  updateSoruCevap,
  updateTopluCevap,
  updateSoruKazanim,
  updateTopluKazanim,
  iptalSoru,
  iptalTopluSoru,
  updateSoruZorluk,
  donusturKitapcikCevaplari,
  createKitapcikDonusumTablosu,
  parseExcelCevapAnahtari,
  EXCEL_KOLON_SABLONU,
  parseKazanimKodu,
  validateKazanimKodu,
  findMissingKazanimlar,
  getKazanimIstatistikleri,
  validateCevapAnahtari,
  cloneCevapAnahtari,
  copyCevaplarOnly,
} from './answer-key-parser';

export type { ExcelCevapAnahtariRow, CevapAnahtariValidation } from './answer-key-parser';

// ─────────────────────────────────────────────────────────────────────────────
// OPTICAL PARSER
// ─────────────────────────────────────────────────────────────────────────────
export {
  turkishToUpperCase,
  turkishToLowerCase,
  normalizeForMatching,
  cleanName,
  levenshteinDistance,
  calculateSimilarity,
  compareNames,
  findBestMatches,
  decodeWindows1254,
  detectEncoding,
  parseOptikData,
  OPTIK_SABLONLARI,
  findMatchingSablon,
  getSablonlariByTur,
  getSablonlariByYayinevi,
  getSablonlaribySinif,
  autoDetectSablon,
} from './optical-parser';

export type { MatchCandidate } from './optical-parser';

// ─────────────────────────────────────────────────────────────────────────────
// SCORING ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export {
  hesaplaNet,
  hesaplaOgrenciSonuc,
  hesaplaTopluSonuclar,
  hesaplaLGSPuanDetayli,
  hesaplaTYTPuanDetayli,
  hesaplaPuanDetayli,
  checkCompliance,
  createScoringSnapshot,
  simulatePuan,
  hesaplaIstatistikler,
  ekleTohminiPuanlar,
  // Legacy
  hesaplaLGSPuan,
  hesaplaTYTPuan,
  hesaplaAYTAgirlikliPuan,
} from './scoring-engine';

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD REDUCER
// ─────────────────────────────────────────────────────────────────────────────
export {
  initialWizardState,
  wizardReducer,
  wizardActions,
  wizardSelectors,
  saveWizardToStorage,
  loadWizardFromStorage,
  clearWizardStorage,
  hasSavedDraft,
  validateStep1,
  validateStep2,
  validateStep4,
} from './wizard-reducer';

export type { StepValidationResult } from './wizard-reducer';

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
export {
  prepareExcelData,
  exportToExcel,
  exportToPDF,
  exportToJSON,
  exportToCSV,
  downloadBlob,
  exportExam,
} from './export-utils';

export type { ExcelExportData } from './export-utils';
