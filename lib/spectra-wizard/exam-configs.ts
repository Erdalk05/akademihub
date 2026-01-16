// ============================================================================
// EXAM CONFIGS - Sınav Konfigürasyonları
// ============================================================================

export interface SinavKonfig {
  id: string;
  name: string;
  questionCount: number;
  wrongPenalty: number;
}

export const SINAV_KONFIGURASYONLARI: Record<string, SinavKonfig> = {
  LGS: {
    id: 'LGS',
    name: 'LGS',
    questionCount: 90,
    wrongPenalty: 0.25,
  },
  TYT: {
    id: 'TYT',
    name: 'TYT',
    questionCount: 120,
    wrongPenalty: 0.25,
  },
  AYT: {
    id: 'AYT',
    name: 'AYT',
    questionCount: 80,
    wrongPenalty: 0.25,
  },
  DENEME: {
    id: 'DENEME',
    name: 'Deneme',
    questionCount: 100,
    wrongPenalty: 0.25,
  },
  KONU_TEST: {
    id: 'KONU_TEST',
    name: 'Konu Testi',
    questionCount: 20,
    wrongPenalty: 0.25,
  },
  YAZILI: {
    id: 'YAZILI',
    name: 'Yazılı',
    questionCount: 25,
    wrongPenalty: 0,
  },
};
