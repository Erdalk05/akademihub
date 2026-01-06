/**
 * ============================================
 * AkademiHub - PDF Formatters
 * ============================================
 * 
 * PHASE 4 - Veri Formatlama Yardımcıları
 * 
 * Bu dosya:
 * - Tarih formatlama
 * - Sayı formatlama
 * - Metin kısaltma
 * - Türkçe karakter dönüşümleri
 */

// ==================== TARİH FORMATLAMA ====================

/**
 * Tarihi Türkçe formatta gösterir
 * @param date - ISO tarih string veya Date
 * @param format - 'short' | 'long' | 'full'
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: 'short' | 'long' | 'full' = 'long'
): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return '-';
    
    const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    };
    
    return d.toLocaleDateString('tr-TR', optionsMap[format]);
  } catch {
    return '-';
  }
}

/**
 * Tarihi kısa formatta gösterir (DD.MM.YYYY)
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  return formatDate(date, 'short');
}

/**
 * Saat formatlar (HH:mm)
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

// ==================== SAYI FORMATLAMA ====================

/**
 * Net değerini formatlar
 * @param net - Net değeri
 * @param decimals - Ondalık basamak sayısı
 */
export function formatNet(net: number | null | undefined, decimals: number = 2): string {
  if (net === null || net === undefined || isNaN(net)) return '-';
  
  const formatted = net.toFixed(decimals);
  
  // Gereksiz .00'ı kaldır
  if (decimals > 0 && formatted.endsWith('0'.repeat(decimals))) {
    return Math.round(net).toString();
  }
  
  return formatted;
}

/**
 * Yüzdeyi formatlar
 * @param rate - Oran (0-1)
 * @param showSymbol - % göster
 */
export function formatPercent(
  rate: number | null | undefined,
  showSymbol: boolean = true
): string {
  if (rate === null || rate === undefined || isNaN(rate)) return '-';
  
  const percent = Math.round(rate * 100);
  return showSymbol ? `%${percent}` : percent.toString();
}

/**
 * Sıralamayı formatlar
 * @param rank - Sıralama
 * @param total - Toplam (opsiyonel)
 */
export function formatRank(
  rank: number | null | undefined,
  total?: number | null
): string {
  if (rank === null || rank === undefined) return '-';
  
  if (total) {
    return `${rank}/${total}`;
  }
  
  return rank.toString();
}

/**
 * Büyük sayıları formatlar (1.5K, 2.3M gibi)
 */
export function formatLargeNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toString();
}

/**
 * Değişimi formatlar (+/- ile)
 */
export function formatChange(change: number | null | undefined): string {
  if (change === null || change === undefined || isNaN(change)) return '-';
  
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${formatNet(change)}`;
}

// ==================== METİN FORMATLAMA ====================

/**
 * Metni kısaltır
 * @param text - Metin
 * @param maxLength - Maksimum uzunluk
 */
export function truncate(
  text: string | null | undefined,
  maxLength: number = 30
): string {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * İlk harfi büyük yapar
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Tüm kelimelerin ilk harfini büyük yapar
 */
export function titleCase(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Öğrenci adını formatlar (İlk Soyad)
 */
export function formatStudentName(
  name: string | null | undefined,
  format: 'full' | 'short' | 'initials' = 'full'
): string {
  if (!name) return '-';
  
  const parts = name.trim().split(' ').filter(p => p);
  
  if (parts.length === 0) return '-';
  
  switch (format) {
    case 'short':
      if (parts.length === 1) return capitalize(parts[0]);
      return `${capitalize(parts[0])} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
    
    case 'initials':
      return parts.map(p => p.charAt(0).toUpperCase()).join('');
    
    case 'full':
    default:
      return parts.map(p => capitalize(p)).join(' ');
  }
}

// ==================== TÜRKÇE YARDIMCILAR ====================

/**
 * Türkçe karakterleri ASCII'ye dönüştürür
 */
export function turkishToAscii(text: string): string {
  const map: Record<string, string> = {
    'ş': 's', 'Ş': 'S',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ü': 'u', 'Ü': 'U',
    'ç': 'c', 'Ç': 'C'
  };
  
  return text.replace(/[şŞğĞıİöÖüÜçÇ]/g, char => map[char] || char);
}

/**
 * Dosya adı için güvenli string oluşturur
 */
export function toSafeFilename(text: string): string {
  return turkishToAscii(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// ==================== DERS ADI FORMATLAMA ====================

/**
 * Ders kodunu tam ada çevirir
 */
export function getSubjectName(code: string): string {
  const SUBJECT_NAMES: Record<string, string> = {
    TUR: 'Türkçe',
    MAT: 'Matematik',
    FEN: 'Fen Bilimleri',
    SOS: 'Sosyal Bilimler',
    INK: 'İnkılap Tarihi',
    DIN: 'Din Kültürü',
    ING: 'İngilizce',
    COG: 'Coğrafya',
    TAR: 'Tarih',
    FEL: 'Felsefe',
    FIZ: 'Fizik',
    KIM: 'Kimya',
    BIY: 'Biyoloji'
  };
  
  return SUBJECT_NAMES[code.toUpperCase()] ?? code;
}

// ==================== DURUM FORMATLAMA ====================

/**
 * Risk seviyesini Türkçe metne çevirir
 */
export function formatRiskLevel(level: string | null | undefined): string {
  if (!level) return '-';
  
  const labels: Record<string, string> = {
    low: 'Düşük Risk',
    medium: 'Orta Risk',
    high: 'Yüksek Risk',
    critical: 'Kritik Risk'
  };
  
  return labels[level] ?? level;
}

/**
 * Trend yönünü Türkçe metne çevirir
 */
export function formatTrendDirection(direction: string | null | undefined): string {
  if (!direction) return '-';
  
  const labels: Record<string, string> = {
    up: 'Yükseliyor',
    down: 'Düşüyor',
    stable: 'Stabil'
  };
  
  return labels[direction] ?? direction;
}

/**
 * Konu durumunu Türkçe metne çevirir
 */
export function formatTopicStatus(status: string | null | undefined): string {
  if (!status) return '-';
  
  const labels: Record<string, string> = {
    excellent: 'Mükemmel',
    good: 'İyi',
    average: 'Orta',
    weak: 'Zayıf',
    critical: 'Kritik'
  };
  
  return labels[status] ?? status;
}

// ==================== VELİ DOSTU METİNLER ====================

/**
 * Teknik risk faktörünü veli dostu metne çevirir
 */
export function formatRiskFactorForParent(factor: string): string {
  const parentFriendlyMap: Record<string, string> = {
    net_drop: 'Son sınavda net sayısında düşüş yaşandı',
    trend_velocity: 'Son sınavlarda çalışma temposunda değişim var',
    consistency: 'Performansta dalgalanmalar görülüyor',
    weak_topics: 'Bazı konularda eksiklikler tespit edildi',
    empty_answers: 'Boş bırakılan soru sayısı dikkat çekici',
    difficulty_gap: 'Zor sorularda performans düşüyor',
    rank_drop: 'Sıralamada gerileme yaşandı'
  };
  
  return parentFriendlyMap[factor] ?? factor;
}

/**
 * Öğrenci durumu özet metni oluşturur
 */
export function generateAssessmentSummary(
  totalNet: number,
  percentile: number | null,
  trendDirection: string | null
): string {
  let summary = '';
  
  if (percentile !== null) {
    if (percentile >= 90) {
      summary = 'Öğrenciniz çok başarılı bir performans sergiledi.';
    } else if (percentile >= 70) {
      summary = 'Öğrenciniz ortalamanın üzerinde bir performans gösterdi.';
    } else if (percentile >= 50) {
      summary = 'Öğrenciniz ortalama düzeyde bir performans sergiledi.';
    } else if (percentile >= 30) {
      summary = 'Öğrencinizin performansı ortalamanın biraz altında kaldı.';
    } else {
      summary = 'Öğrencinizin performansı gelişim gerektiriyor.';
    }
  } else {
    summary = `Öğrenciniz ${formatNet(totalNet)} net yaptı.`;
  }
  
  // Trend bilgisi ekle
  if (trendDirection === 'up') {
    summary += ' Son dönemde yükseliş eğilimi görülüyor.';
  } else if (trendDirection === 'down') {
    summary += ' Son dönemde dikkat edilmesi gereken bir düşüş var.';
  }
  
  return summary;
}

// ==================== EXPORT ====================

export default {
  formatDate,
  formatDateShort,
  formatTime,
  formatNet,
  formatPercent,
  formatRank,
  formatLargeNumber,
  formatChange,
  truncate,
  capitalize,
  titleCase,
  formatStudentName,
  turkishToAscii,
  toSafeFilename,
  getSubjectName,
  formatRiskLevel,
  formatTrendDirection,
  formatTopicStatus,
  formatRiskFactorForParent,
  generateAssessmentSummary
};

