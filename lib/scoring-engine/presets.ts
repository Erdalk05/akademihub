// ============================================================================
// SCORING ENGINE - PRESETS (v1.0)
// Predefined scoring rules for LGS, TYT, AYT exams
// Pure TypeScript, no dependencies
// ============================================================================

import type { ScoringPreset } from '@/types/scoring-engine.types';

/**
 * LGS (Liseye Geçiş Sınavı) Puanlama Kuralı
 * 
 * - 3 yanlış 1 doğruyu götürür
 * - Doğru: 1 puan
 * - Yanlış: -1/3 puan
 * - Boş: 0 puan
 */
export const LGS_PRESET: ScoringPreset = {
  name: 'LGS',
  correctPoints: 1,
  wrongPoints: -1 / 3,
  emptyPoints: 0,
  wrongCancelsCorrect: 3,
};

/**
 * TYT (Temel Yeterlilik Testi) Puanlama Kuralı
 * 
 * - 4 yanlış 1 doğruyu götürür
 * - Doğru: 1 puan
 * - Yanlış: -1/4 puan
 * - Boş: 0 puan
 */
export const TYT_PRESET: ScoringPreset = {
  name: 'TYT',
  correctPoints: 1,
  wrongPoints: -1 / 4,
  emptyPoints: 0,
  wrongCancelsCorrect: 4,
};

/**
 * AYT Sayısal (Alan Yeterlilik Testi - Sayısal) Puanlama Kuralı
 * 
 * - 4 yanlış 1 doğruyu götürür
 * - Doğru: 1 puan
 * - Yanlış: -1/4 puan
 * - Boş: 0 puan
 */
export const AYT_SAY_PRESET: ScoringPreset = {
  name: 'AYT_SAY',
  correctPoints: 1,
  wrongPoints: -1 / 4,
  emptyPoints: 0,
  wrongCancelsCorrect: 4,
};

/**
 * AYT Eşit Ağırlık (Alan Yeterlilik Testi - EA) Puanlama Kuralı
 * 
 * - 4 yanlış 1 doğruyu götürür
 * - Doğru: 1 puan
 * - Yanlış: -1/4 puan
 * - Boş: 0 puan
 */
export const AYT_EA_PRESET: ScoringPreset = {
  name: 'AYT_EA',
  correctPoints: 1,
  wrongPoints: -1 / 4,
  emptyPoints: 0,
  wrongCancelsCorrect: 4,
};

/**
 * AYT Sözel (Alan Yeterlilik Testi - Sözel) Puanlama Kuralı
 * 
 * - 4 yanlış 1 doğruyu götürür
 * - Doğru: 1 puan
 * - Yanlış: -1/4 puan
 * - Boş: 0 puan
 */
export const AYT_SOZ_PRESET: ScoringPreset = {
  name: 'AYT_SOZ',
  correctPoints: 1,
  wrongPoints: -1 / 4,
  emptyPoints: 0,
  wrongCancelsCorrect: 4,
};

/**
 * Özel Sınav (Custom) - Yanlış cezası yok
 * 
 * - Yanlış cezası yok
 * - Doğru: 1 puan
 * - Yanlış: 0 puan
 * - Boş: 0 puan
 */
export const CUSTOM_NO_PENALTY_PRESET: ScoringPreset = {
  name: 'Custom_No_Penalty',
  correctPoints: 1,
  wrongPoints: 0,
  emptyPoints: 0,
  wrongCancelsCorrect: 0, // Sıfır: yanlış cezası yok
};

/**
 * Tüm preset'leri içeren map (string key ile erişim)
 */
export const PRESET_MAP: Record<string, ScoringPreset> = {
  LGS: LGS_PRESET,
  TYT: TYT_PRESET,
  AYT_SAY: AYT_SAY_PRESET,
  AYT_EA: AYT_EA_PRESET,
  AYT_SOZ: AYT_SOZ_PRESET,
  CUSTOM_NO_PENALTY: CUSTOM_NO_PENALTY_PRESET,
};

/**
 * Preset adından preset objesini döndürür
 * 
 * @param presetName - Preset adı (örn: "LGS", "TYT")
 * @returns ScoringPreset veya undefined
 */
export function getPresetByName(presetName: string): ScoringPreset | undefined {
  return PRESET_MAP[presetName];
}

/**
 * Tüm preset isimlerini döndürür
 * 
 * @returns Preset isimleri array
 */
export function getAllPresetNames(): string[] {
  return Object.keys(PRESET_MAP);
}

/**
 * Özel (custom) preset oluşturur
 * 
 * @param name - Preset adı
 * @param wrongCancelsCorrect - Kaç yanlış 1 doğruyu götürür (0 = ceza yok)
 * @param correctPoints - Doğru puan (varsayılan: 1)
 * @returns Yeni ScoringPreset
 */
export function createCustomPreset(
  name: string,
  wrongCancelsCorrect: number,
  correctPoints: number = 1
): ScoringPreset {
  const wrongPoints = wrongCancelsCorrect > 0 ? -correctPoints / wrongCancelsCorrect : 0;

  return {
    name,
    correctPoints,
    wrongPoints,
    emptyPoints: 0,
    wrongCancelsCorrect,
  };
}
