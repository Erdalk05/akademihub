/**
 * ============================================
 * AkademiHub - Pure Weighting Functions
 * ============================================
 * 
 * PURE FUNCTIONS - No side effects
 * DB çağrısı YOK, API çağrısı YOK
 * 
 * LGS / TYT / AYT ağırlıklı skor hesaplamaları:
 * - MEB resmi katsayıları
 * - Ders bazlı ağırlıklandırma
 * - Puan türü hesaplama
 */

// ==================== LGS KATSAYILARI (MEB RESMİ) ====================

export const LGS_WEIGHTS = {
  TUR: 4.0,   // Türkçe
  MAT: 4.0,   // Matematik
  FEN: 4.0,   // Fen Bilimleri
  SOS: 1.0,   // Sosyal (İnkılap + Din Kültürü ortalaması)
  ING: 1.0    // İngilizce
} as const;

export const LGS_QUESTION_COUNTS = {
  TUR: 20,
  MAT: 20,
  FEN: 20,
  INK: 10,    // İnkılap Tarihi
  DIN: 10,    // Din Kültürü
  ING: 10
} as const;

// ==================== TYT KATSAYILARI ====================

export const TYT_WEIGHTS = {
  TUR: 1.32,  // Türkçe
  SOS: 1.36,  // Sosyal Bilimler
  MAT: 1.32,  // Temel Matematik
  FEN: 1.36   // Fen Bilimleri
} as const;

export const TYT_QUESTION_COUNTS = {
  TUR: 40,
  SOS: 20,
  MAT: 40,
  FEN: 20
} as const;

// ==================== AYT KATSAYILARI ====================

export const AYT_SAY_WEIGHTS = {
  MAT: 3.0,
  FIZ: 2.85,
  KIM: 3.07,
  BIY: 3.07
} as const;

export const AYT_EA_WEIGHTS = {
  MAT: 3.0,
  TUR: 3.0,
  TAR1: 2.80,
  COG1: 3.33
} as const;

export const AYT_SOZ_WEIGHTS = {
  TUR: 3.0,
  TAR1: 2.80,
  COG1: 3.33,
  TAR2: 2.91,
  COG2: 2.91,
  FEL: 3.0,
  DIN: 3.34
} as const;

// ==================== TYPES ====================

export type ExamType = 'LGS' | 'TYT' | 'AYT_SAY' | 'AYT_EA' | 'AYT_SOZ';

export interface SubjectNet {
  subjectCode: string;
  net: number;
  questionCount?: number;
}

export interface WeightedScoreInput {
  examType: ExamType;
  subjectNets: SubjectNet[];
  baseScore?: number;              // Baz puan (OBP vb.)
}

export interface WeightedScoreResult {
  examType: ExamType;
  rawTotal: number;                // Ham toplam
  weightedTotal: number;           // Ağırlıklı toplam
  subjectContributions: SubjectContribution[];
  estimatedScore?: number;         // Tahmini puan
  formula: string;
}

export interface SubjectContribution {
  subjectCode: string;
  net: number;
  weight: number;
  contribution: number;            // net * weight
  percentage: number;              // Toplam içindeki yüzde
}

// ==================== LGS PUAN HESAPLAMA ====================

/**
 * LGS puanı hesaplar
 * Resmi MEB formülü: 500 + (Σ(Net × Katsayı) × K)
 * K: Tüm doğruların yerleşim puanıyla ilişkili katsayı
 * 
 * @param input - Ağırlıklı skor girdisi
 * @returns Ağırlıklı skor sonucu
 */
export function calculateLGSScore(subjectNets: SubjectNet[]): WeightedScoreResult {
  const contributions: SubjectContribution[] = [];
  let rawTotal = 0;
  let weightedTotal = 0;
  
  // Her ders için hesapla
  for (const subject of subjectNets) {
    const weight = getWeight('LGS', subject.subjectCode);
    const contribution = subject.net * weight;
    
    rawTotal += subject.net;
    weightedTotal += contribution;
    
    contributions.push({
      subjectCode: subject.subjectCode,
      net: subject.net,
      weight,
      contribution: round(contribution, 2),
      percentage: 0 // Sonra hesaplanacak
    });
  }
  
  // Yüzdeleri hesapla
  for (const contrib of contributions) {
    contrib.percentage = weightedTotal > 0 
      ? round((contrib.contribution / weightedTotal) * 100, 1)
      : 0;
  }
  
  // Tahmini puan (500 + ağırlıklı net * katsayı)
  // K değeri yaklaşık 3.5-4.0 civarı
  const K = 3.79; // Ortalama K değeri
  const estimatedScore = round(500 + (weightedTotal * K), 2);
  
  return {
    examType: 'LGS',
    rawTotal: round(rawTotal, 2),
    weightedTotal: round(weightedTotal, 2),
    subjectContributions: contributions,
    estimatedScore: Math.min(500, Math.max(100, estimatedScore)),
    formula: `500 + (${round(weightedTotal, 2)} × ${K})`
  };
}

// ==================== TYT PUAN HESAPLAMA ====================

/**
 * TYT puanı hesaplar
 */
export function calculateTYTScore(subjectNets: SubjectNet[]): WeightedScoreResult {
  const contributions: SubjectContribution[] = [];
  let rawTotal = 0;
  let weightedTotal = 0;
  
  for (const subject of subjectNets) {
    const weight = getWeight('TYT', subject.subjectCode);
    const contribution = subject.net * weight;
    
    rawTotal += subject.net;
    weightedTotal += contribution;
    
    contributions.push({
      subjectCode: subject.subjectCode,
      net: subject.net,
      weight,
      contribution: round(contribution, 2),
      percentage: 0
    });
  }
  
  // Yüzdeleri hesapla
  for (const contrib of contributions) {
    contrib.percentage = weightedTotal > 0 
      ? round((contrib.contribution / weightedTotal) * 100, 1)
      : 0;
  }
  
  // TYT tahmini puan (100-500 arası)
  // Ham puan formülü: 100 + (net × ortalama katsayı × K)
  const avgWeight = 1.34;
  const K = 3.33;
  const estimatedScore = round(100 + (weightedTotal * K), 2);
  
  return {
    examType: 'TYT',
    rawTotal: round(rawTotal, 2),
    weightedTotal: round(weightedTotal, 2),
    subjectContributions: contributions,
    estimatedScore: Math.min(500, Math.max(100, estimatedScore)),
    formula: `100 + (${round(weightedTotal, 2)} × ${K})`
  };
}

// ==================== AYT PUAN HESAPLAMA ====================

/**
 * AYT puanı hesaplar (SAY/EA/SOZ)
 */
export function calculateAYTScore(
  examType: 'AYT_SAY' | 'AYT_EA' | 'AYT_SOZ',
  subjectNets: SubjectNet[]
): WeightedScoreResult {
  const contributions: SubjectContribution[] = [];
  let rawTotal = 0;
  let weightedTotal = 0;
  
  for (const subject of subjectNets) {
    const weight = getWeight(examType, subject.subjectCode);
    const contribution = subject.net * weight;
    
    rawTotal += subject.net;
    weightedTotal += contribution;
    
    contributions.push({
      subjectCode: subject.subjectCode,
      net: subject.net,
      weight,
      contribution: round(contribution, 2),
      percentage: 0
    });
  }
  
  for (const contrib of contributions) {
    contrib.percentage = weightedTotal > 0 
      ? round((contrib.contribution / weightedTotal) * 100, 1)
      : 0;
  }
  
  // AYT tahmini puan
  const K = 3.0;
  const estimatedScore = round(100 + (weightedTotal * K), 2);
  
  return {
    examType,
    rawTotal: round(rawTotal, 2),
    weightedTotal: round(weightedTotal, 2),
    subjectContributions: contributions,
    estimatedScore: Math.min(500, Math.max(100, estimatedScore)),
    formula: `100 + (${round(weightedTotal, 2)} × ${K})`
  };
}

// ==================== GENEL AĞIRLIKLI HESAPLAMA ====================

/**
 * Sınav tipine göre ağırlıklı skor hesaplar
 */
export function calculateWeightedScore(input: WeightedScoreInput): WeightedScoreResult {
  switch (input.examType) {
    case 'LGS':
      return calculateLGSScore(input.subjectNets);
    case 'TYT':
      return calculateTYTScore(input.subjectNets);
    case 'AYT_SAY':
    case 'AYT_EA':
    case 'AYT_SOZ':
      return calculateAYTScore(input.examType, input.subjectNets);
    default:
      throw new Error(`Bilinmeyen sınav tipi: ${input.examType}`);
  }
}

// ==================== DERS AĞIRLIĞI ALMA ====================

/**
 * Sınav tipi ve ders koduna göre ağırlık döner
 */
export function getWeight(examType: ExamType, subjectCode: string): number {
  const code = subjectCode.toUpperCase();
  
  switch (examType) {
    case 'LGS':
      return (LGS_WEIGHTS as Record<string, number>)[code] ?? 1.0;
    case 'TYT':
      return (TYT_WEIGHTS as Record<string, number>)[code] ?? 1.0;
    case 'AYT_SAY':
      return (AYT_SAY_WEIGHTS as Record<string, number>)[code] ?? 1.0;
    case 'AYT_EA':
      return (AYT_EA_WEIGHTS as Record<string, number>)[code] ?? 1.0;
    case 'AYT_SOZ':
      return (AYT_SOZ_WEIGHTS as Record<string, number>)[code] ?? 1.0;
    default:
      return 1.0;
  }
}

// ==================== DERS ETKİ ANALİZİ ====================

export interface SubjectImpactAnalysis {
  subjectCode: string;
  currentNet: number;
  weight: number;
  
  // +1 net artarsa toplam ağırlıklı skora etkisi
  impactPerNet: number;
  
  // Potansiyel iyileşme (maksimum nete göre)
  maxPossibleNet: number;
  potentialGain: number;
  
  // Öncelik skoru (düşük net + yüksek ağırlık = yüksek öncelik)
  priorityScore: number;
}

/**
 * Her dersin toplam skora etkisini analiz eder
 * Hangi derste çalışmanın daha etkili olacağını gösterir
 */
export function analyzeSubjectImpact(
  examType: ExamType,
  subjectNets: SubjectNet[]
): SubjectImpactAnalysis[] {
  const analyses: SubjectImpactAnalysis[] = [];
  
  for (const subject of subjectNets) {
    const weight = getWeight(examType, subject.subjectCode);
    const maxNet = subject.questionCount ?? getMaxNetForSubject(examType, subject.subjectCode);
    
    const potentialGain = (maxNet - subject.net) * weight;
    
    // Öncelik: düşük başarı oranı + yüksek ağırlık = yüksek öncelik
    const successRate = subject.net / maxNet;
    const priorityScore = (1 - successRate) * weight;
    
    analyses.push({
      subjectCode: subject.subjectCode,
      currentNet: subject.net,
      weight,
      impactPerNet: weight,
      maxPossibleNet: maxNet,
      potentialGain: round(potentialGain, 2),
      priorityScore: round(priorityScore, 2)
    });
  }
  
  // Önceliğe göre sırala
  return analyses.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Sınav tipi ve derse göre maksimum net döner
 */
function getMaxNetForSubject(examType: ExamType, subjectCode: string): number {
  const code = subjectCode.toUpperCase();
  
  if (examType === 'LGS') {
    return (LGS_QUESTION_COUNTS as Record<string, number>)[code] ?? 20;
  }
  
  if (examType === 'TYT') {
    return (TYT_QUESTION_COUNTS as Record<string, number>)[code] ?? 40;
  }
  
  // AYT için varsayılan
  return 40;
}

// ==================== PUAN TAHMİNİ ====================

export interface ScorePredictionInput {
  examType: ExamType;
  targetScore: number;              // Hedef puan
  currentNets: SubjectNet[];
}

export interface ScorePredictionResult {
  targetAchievable: boolean;
  requiredWeightedTotal: number;
  currentWeightedTotal: number;
  gap: number;
  suggestions: SubjectSuggestion[];
}

export interface SubjectSuggestion {
  subjectCode: string;
  currentNet: number;
  suggestedNet: number;
  netIncrease: number;
  feasibility: 'easy' | 'moderate' | 'hard';
}

/**
 * Hedef puana ulaşmak için gereken net artışlarını hesaplar
 */
export function predictRequiredNets(input: ScorePredictionInput): ScorePredictionResult {
  const currentResult = calculateWeightedScore({
    examType: input.examType,
    subjectNets: input.currentNets
  });
  
  // Gerekli ağırlıklı toplam (ters hesaplama)
  const K = input.examType === 'LGS' ? 3.79 : 3.33;
  const baseScore = input.examType === 'LGS' ? 500 : 100;
  const requiredWeightedTotal = (input.targetScore - baseScore) / K;
  
  const gap = requiredWeightedTotal - currentResult.weightedTotal;
  const targetAchievable = gap <= 0 || calculateMaxPossibleWeighted(input) >= requiredWeightedTotal;
  
  // Öneri oluştur
  const suggestions = generateSuggestions(input, gap);
  
  return {
    targetAchievable,
    requiredWeightedTotal: round(requiredWeightedTotal, 2),
    currentWeightedTotal: currentResult.weightedTotal,
    gap: round(gap, 2),
    suggestions
  };
}

function calculateMaxPossibleWeighted(input: ScorePredictionInput): number {
  let total = 0;
  
  for (const subject of input.currentNets) {
    const weight = getWeight(input.examType, subject.subjectCode);
    const maxNet = subject.questionCount ?? getMaxNetForSubject(input.examType, subject.subjectCode);
    total += maxNet * weight;
  }
  
  return total;
}

function generateSuggestions(input: ScorePredictionInput, gap: number): SubjectSuggestion[] {
  if (gap <= 0) return [];
  
  const impacts = analyzeSubjectImpact(input.examType, input.currentNets);
  const suggestions: SubjectSuggestion[] = [];
  let remainingGap = gap;
  
  for (const impact of impacts) {
    if (remainingGap <= 0) break;
    
    const potentialIncrease = Math.min(
      impact.potentialGain,
      remainingGap
    );
    
    const netIncrease = potentialIncrease / impact.weight;
    const feasibility = getFeasibility(netIncrease, impact.maxPossibleNet - impact.currentNet);
    
    if (netIncrease > 0.5) {
      suggestions.push({
        subjectCode: impact.subjectCode,
        currentNet: impact.currentNet,
        suggestedNet: round(impact.currentNet + netIncrease, 1),
        netIncrease: round(netIncrease, 1),
        feasibility
      });
      
      remainingGap -= potentialIncrease;
    }
  }
  
  return suggestions;
}

function getFeasibility(increase: number, available: number): 'easy' | 'moderate' | 'hard' {
  const ratio = increase / available;
  
  if (ratio <= 0.3) return 'easy';
  if (ratio <= 0.6) return 'moderate';
  return 'hard';
}

// ==================== YARDIMCI ====================

function round(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ==================== EXPORT ====================

export default {
  calculateWeightedScore,
  calculateLGSScore,
  calculateTYTScore,
  calculateAYTScore,
  getWeight,
  analyzeSubjectImpact,
  predictRequiredNets,
  LGS_WEIGHTS,
  TYT_WEIGHTS,
  AYT_SAY_WEIGHTS,
  AYT_EA_WEIGHTS,
  AYT_SOZ_WEIGHTS
};
