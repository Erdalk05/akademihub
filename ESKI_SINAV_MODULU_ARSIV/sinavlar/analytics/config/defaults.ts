/**
 * ============================================
 * AkademiHub - Analytics Default Configurations
 * ============================================
 * 
 * PHASE 3.4 - Varsayılan Konfigürasyonlar
 * 
 * Bu dosya:
 * - DB'de config bulunamazsa kullanılacak varsayılanları tanımlar
 * - Tüm ağırlıklar ve eşikler burada merkezi olarak tutulur
 * - FAIL-SAFE: Sistem her zaman çalışır
 * 
 * KURALLAR:
 * - Tüm değerler matematiksel olarak validate edilmiş
 * - Türkiye sınav sistemi (LGS/TYT/AYT) için optimize edilmiş
 * - Hiçbir değer DB'ye bağımlı değil
 */

// ==================== RISK WEIGHTS ====================

/**
 * Risk faktör ağırlıkları
 * Toplam = 1.0 olmalı
 */
export interface RiskWeightConfig {
  net_drop_weight: number;         // Net düşüşü
  trend_velocity_weight: number;   // Trend hızı
  consistency_weight: number;      // Tutarlılık
  weak_topic_weight: number;       // Zayıf konu oranı
  empty_answer_weight: number;     // Boş bırakma oranı
  difficulty_gap_weight: number;   // Zorluk farkı (kolay vs zor)
  rank_drop_weight: number;        // Sıralama düşüşü
}

export const DEFAULT_RISK_WEIGHTS: RiskWeightConfig = {
  net_drop_weight: 0.20,           // Net düşüşü en kritik
  trend_velocity_weight: 0.15,     // Trend yönü önemli
  consistency_weight: 0.15,        // Tutarlılık
  weak_topic_weight: 0.20,         // Zayıf konular kritik
  empty_answer_weight: 0.10,       // Boş bırakma
  difficulty_gap_weight: 0.10,     // Zorluk farkı
  rank_drop_weight: 0.10           // Sıralama düşüşü
};

// Ağırlık toplamı kontrolü (development için)
const weightSum = Object.values(DEFAULT_RISK_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.001) {
  console.warn(`[Defaults] Risk weight sum is ${weightSum}, should be 1.0`);
}

// ==================== RISK THRESHOLDS ====================

/**
 * Risk eşikleri
 * Her faktör için normalize edilmiş değerlerin hangi seviyede risk oluşturduğu
 */
export interface RiskThresholdConfig {
  // Net düşüşü eşikleri
  net_drop_critical: number;       // Bu kadar düşüş kritik (net cinsinden)
  net_drop_warning: number;        // Bu kadar düşüş uyarı
  net_drop_normal: number;         // Bu kadar düşüş normal
  
  // Boş bırakma eşikleri
  empty_rate_critical: number;     // %X üzeri kritik
  empty_rate_warning: number;      // %X üzeri uyarı
  
  // Zayıf konu eşikleri
  weak_topic_rate_critical: number;  // Konuların %X'i zayıfsa kritik
  weak_topic_rate_warning: number;   // Konuların %X'i zayıfsa uyarı
  
  // Tutarlılık eşikleri
  consistency_low: number;         // Bu altı düşük tutarlılık
  consistency_good: number;        // Bu üstü iyi tutarlılık
  
  // Zorluk farkı eşikleri
  difficulty_gap_critical: number; // Kolay-zor farkı bu kadarsa kritik
  difficulty_gap_warning: number;  // Kolay-zor farkı bu kadarsa uyarı
  
  // Sıralama düşüşü eşikleri
  rank_drop_critical: number;      // Bu kadar sıra düşüşü kritik
  rank_drop_warning: number;       // Bu kadar sıra düşüşü uyarı
  
  // Final risk skorları
  risk_critical: number;           // Bu üstü kritik (0-100)
  risk_high: number;               // Bu üstü yüksek
  risk_medium: number;             // Bu üstü orta
}

export const DEFAULT_RISK_THRESHOLDS: RiskThresholdConfig = {
  // Net düşüşü (net cinsinden)
  net_drop_critical: 8.0,          // 8+ net düşüş kritik
  net_drop_warning: 4.0,           // 4+ net düşüş uyarı
  net_drop_normal: 2.0,            // 2+ net düşüş normal

  // Boş bırakma (0-1 oran)
  empty_rate_critical: 0.25,       // %25+ boş kritik
  empty_rate_warning: 0.15,        // %15+ boş uyarı

  // Zayıf konu oranı (0-1)
  weak_topic_rate_critical: 0.50,  // %50+ konu zayıfsa kritik
  weak_topic_rate_warning: 0.30,   // %30+ konu zayıfsa uyarı

  // Tutarlılık (0-1)
  consistency_low: 0.50,           // 0.50 altı düşük
  consistency_good: 0.75,          // 0.75 üstü iyi

  // Zorluk farkı (kolay başarı - zor başarı, 0-1)
  difficulty_gap_critical: 0.50,   // %50+ fark kritik
  difficulty_gap_warning: 0.30,    // %30+ fark uyarı

  // Sıralama düşüşü (sıra cinsinden)
  rank_drop_critical: 50,          // 50+ sıra düşüş kritik
  rank_drop_warning: 20,           // 20+ sıra düşüş uyarı

  // Final risk kategorileri (0-100)
  risk_critical: 75,               // 75+ kritik
  risk_high: 50,                   // 50-75 yüksek
  risk_medium: 25                  // 25-50 orta
};

// ==================== TREND CONFIG ====================

/**
 * Trend hesaplama konfigürasyonu
 */
export interface TrendConfig {
  // Pencere boyutu
  window_size: number;             // Kaç sınav geriye bakılacak
  min_data_points: number;         // Minimum veri noktası
  
  // Ağırlık dağılımı (yeniden eskiye)
  weight_distribution: number[];   // [en_yeni, ..., en_eski]
  
  // Yön eşikleri
  direction_up_threshold: number;  // Bu üstü yükseliş
  direction_down_threshold: number; // Bu altı düşüş
  
  // Velocity normalizasyonu
  velocity_max: number;            // Maksimum velocity (net/sınav)
  velocity_min: number;            // Minimum velocity
  
  // Consistency
  consistency_good: number;        // İyi tutarlılık (std dev)
  consistency_bad: number;         // Kötü tutarlılık
}

export const DEFAULT_TREND_CONFIG: TrendConfig = {
  window_size: 5,                  // Son 5 sınav
  min_data_points: 2,              // En az 2 sınav

  // Ağırlıklar: En yeni = 0.35, sonraki = 0.25, 0.20, 0.12, 0.08
  weight_distribution: [0.35, 0.25, 0.20, 0.12, 0.08],

  direction_up_threshold: 2.0,     // 2+ net artış = yükseliş
  direction_down_threshold: -2.0,  // 2+ net düşüş = düşüş

  velocity_max: 10.0,              // Max +10 net/sınav
  velocity_min: -10.0,             // Min -10 net/sınav

  consistency_good: 3.0,           // 3 net std dev altı iyi
  consistency_bad: 8.0             // 8 net std dev üstü kötü
};

// ==================== EXPLANATION TEMPLATES ====================

/**
 * Risk faktörü açıklama şablonları (Türkçe)
 */
export const RISK_EXPLANATION_TEMPLATES = {
  net_drop: {
    critical: 'Son sınavda {value} net düşüş yaşandı. Bu ciddi bir performans kaybı.',
    warning: 'Son sınavda {value} net düşüş var. Dikkat edilmeli.',
    normal: 'Net performansı stabil.'
  },
  trend_velocity: {
    critical: 'Performans hızla düşüyor. Son {count} sınavda ortalama {value} net kayıp.',
    warning: 'Performansta düşüş eğilimi var.',
    normal: 'Performans trendi stabil veya yükseliyor.'
  },
  consistency: {
    critical: 'Performans çok dalgalı. Tutarlılık skoru düşük ({value}).',
    warning: 'Performansta dalgalanmalar var.',
    normal: 'Performans tutarlı.'
  },
  weak_topics: {
    critical: 'Konuların %{value}\'i zayıf. Acil müdahale gerekli.',
    warning: 'Bazı konularda eksiklik var (%{value}).',
    normal: 'Konu hakimiyeti iyi düzeyde.'
  },
  empty_answers: {
    critical: 'Soruların %{value}\'i boş bırakılıyor. Zaman yönetimi sorunu olabilir.',
    warning: 'Boş bırakma oranı yüksek (%{value}).',
    normal: 'Boş bırakma oranı normal.'
  },
  difficulty_gap: {
    critical: 'Kolay sorularda başarılı ama zor sorularda ciddi düşüş var.',
    warning: 'Zor sorularda performans düşüyor.',
    normal: 'Tüm zorluk seviyelerinde dengeli performans.'
  },
  rank_drop: {
    critical: 'Sıralamada {value} basamak düşüş yaşandı.',
    warning: 'Sıralamada gerileme var ({value} sıra).',
    normal: 'Sıralama stabil veya yükseliyor.'
  }
};

/**
 * Trend açıklama şablonları (Türkçe)
 */
export const TREND_EXPLANATION_TEMPLATES = {
  up_stable: 'Son {count} sınavda istikrarlı yükseliş. Ortalama {velocity} net artış.',
  up_volatile: 'Genel trend yükseliyor ama dalgalı. Tutarlılık artırılmalı.',
  down_stable: 'Son {count} sınavda istikrarlı düşüş. Acil müdahale gerekli.',
  down_volatile: 'Performans düşüyor ve dalgalı. Kritik durum.',
  stable_good: 'Performans yüksek ve stabil. Mevcut durumu korumak önemli.',
  stable_average: 'Performans stabil ama gelişim için çaba gerekli.',
  stable_low: 'Performans düşük ve değişmiyor. Motivasyon ve strateji değişikliği gerekebilir.',
  insufficient_data: 'Trend analizi için yeterli veri yok.'
};

// ==================== CATEGORY LABELS ====================

export const RISK_LEVEL_LABELS = {
  low: { tr: 'Düşük Risk', color: '#22c55e' },
  medium: { tr: 'Orta Risk', color: '#f59e0b' },
  high: { tr: 'Yüksek Risk', color: '#f97316' },
  critical: { tr: 'Kritik Risk', color: '#ef4444' }
};

export const TREND_DIRECTION_LABELS = {
  up: { tr: 'Yükseliyor', emoji: '📈', color: '#22c55e' },
  down: { tr: 'Düşüyor', emoji: '📉', color: '#ef4444' },
  stable: { tr: 'Stabil', emoji: '➡️', color: '#6b7280' }
};

// ==================== CONFIG VERSION ====================

export const CONFIG_VERSION = '1.0.0';
export const CONFIG_SCHEMA_VERSION = '2024.12.01';

// ==================== EXPORTS ====================

export default {
  risk: {
    weights: DEFAULT_RISK_WEIGHTS,
    thresholds: DEFAULT_RISK_THRESHOLDS,
    explanations: RISK_EXPLANATION_TEMPLATES,
    labels: RISK_LEVEL_LABELS
  },
  trend: {
    config: DEFAULT_TREND_CONFIG,
    explanations: TREND_EXPLANATION_TEMPLATES,
    labels: TREND_DIRECTION_LABELS
  },
  version: CONFIG_VERSION
};
