/**
 * ============================================
 * AkademiHub - Sınav Modülü
 * ============================================
 * 
 * K12 Sınav Değerlendirme ve Analitik Sistemi
 * LGS / TYT / AYT desteği
 * 
 * MİMARİ:
 * 
 * lib/sinavlar/
 * ├── analytics/           # Analitik hesaplamalar
 * │   ├── engine/         # Pure functions (no DB) ✅
 * │   └── orchestrator/   # Data layer (TEK YETKİLİ) ✅
 * ├── calculation/        # Net/Puan hesaplama (lib/exam'den)
 * └── validation/         # Veri doğrulama (lib/exam'den)
 * 
 * KULLANIM:
 * 
 * @example
 * import { getStudentAnalytics } from '@/lib/sinavlar';
 * 
 * const result = await getStudentAnalytics(examId, studentId);
 * if (result.success) {
 *   console.log(result.data.summary);
 * }
 */

// ==================== ORCHESTRATOR (ANA GİRİŞ) ====================

export { 
  getStudentAnalytics,
  getExamAnalytics,
  recomputeStaleSnapshots
} from './analytics/orchestrator';

// ==================== ANALYTICS ====================

export * from './analytics';
export { Analytics, AnalyticsEngine, Orchestrator } from './analytics';

// ==================== RE-EXPORT FROM LIB/EXAM ====================

// Mevcut hesaplama motorunu da buradan erişilebilir yap
// (lib/exam altındaki mevcut kodlar korundu)
