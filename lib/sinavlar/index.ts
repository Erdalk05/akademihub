/**
 * ============================================
 * AkademiHub - Sınav Modülü
 * ============================================
 * 
 * K12 Sınav Değerlendirme ve Analitik Sistemi
 * LGS / TYT / AYT desteği
 * 
 * MODÜL YAPISI:
 * 
 * lib/sinavlar/
 * ├── analytics/           # Analitik hesaplamalar
 * │   ├── engine/         # Pure functions (no DB)
 * │   └── orchestrator/   # Data layer (Phase 3.3)
 * ├── calculation/        # Net/Puan hesaplama (lib/exam'den)
 * └── validation/         # Veri doğrulama (lib/exam'den)
 */

// ==================== ANALYTICS ====================

export * from './analytics';
export { Analytics, AnalyticsEngine } from './analytics';

// ==================== RE-EXPORT FROM LIB/EXAM ====================

// Mevcut hesaplama motorunu da buradan erişilebilir yap
// (lib/exam altındaki mevcut kodlar korundu)
