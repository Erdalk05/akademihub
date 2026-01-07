// ============================================================================
// SPECTRA MODULE - CONSTANTS
// Sabitler, ders renkleri, aralıklar
// ============================================================================

// Ders renkleri
export const SECTION_COLORS: Record<string, string> = {
  TUR: '#3B82F6', // Blue - Türkçe
  MAT: '#EF4444', // Red - Matematik
  FEN: '#22C55E', // Green - Fen Bilimleri
  SOS: '#F59E0B', // Amber - Sosyal Bilgiler
  ING: '#8B5CF6', // Purple - İngilizce
  DIN: '#EC4899', // Pink - Din Kültürü
  // Fallback
  DEFAULT: '#6B7280', // Gray
};

// Ders renkleri (bg sınıfları)
export const SECTION_BG_COLORS: Record<string, string> = {
  TUR: 'bg-blue-500',
  MAT: 'bg-red-500',
  FEN: 'bg-green-500',
  SOS: 'bg-amber-500',
  ING: 'bg-purple-500',
  DIN: 'bg-pink-500',
  DEFAULT: 'bg-gray-500',
};

// Ders renkleri (text sınıfları)
export const SECTION_TEXT_COLORS: Record<string, string> = {
  TUR: 'text-blue-600',
  MAT: 'text-red-600',
  FEN: 'text-green-600',
  SOS: 'text-amber-600',
  ING: 'text-purple-600',
  DIN: 'text-pink-600',
  DEFAULT: 'text-gray-600',
};

// Net dağılım aralıkları
export const NET_RANGES = [
  { label: '0-20', min: 0, max: 20 },
  { label: '20-40', min: 20, max: 40 },
  { label: '40-60', min: 40, max: 60 },
  { label: '60-80', min: 60, max: 80 },
  { label: '80+', min: 80, max: Infinity },
];

// Sayfa boyutları
export const PAGE_SIZES = [10, 20, 50, 100];

// Sıralama seçenekleri
export const SORT_OPTIONS = [
  { value: 'rank', label: 'Sıralama' },
  { value: 'name', label: 'İsim' },
  { value: 'net', label: 'Net' },
  { value: 'class', label: 'Sınıf' },
];

// Katılımcı tipi seçenekleri
export const PARTICIPANT_TYPE_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'institution', label: 'Asil' },
  { value: 'guest', label: 'Misafir' },
];

// Sınav tipleri
export const EXAM_TYPES = [
  { value: 'LGS', label: 'LGS' },
  { value: 'TYT', label: 'TYT' },
  { value: 'AYT', label: 'AYT' },
  { value: 'YKS', label: 'YKS' },
  { value: 'deneme', label: 'Deneme' },
];

// Eşleştirme durumu renkleri
export const MATCH_STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Bekliyor' },
  matched: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Eşleşti' },
  guest: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Misafir' },
  conflict: { bg: 'bg-red-100', text: 'text-red-700', label: 'Çakışma' },
};

// Sıralama madalyaları
export const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

// Primary tema renkleri
export const THEME_COLORS = {
  primary: '#10B981', // Emerald
  primaryDark: '#059669',
  primaryLight: '#D1FAE5',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
  info: '#3B82F6',
};

// Grafik renkleri
export const CHART_COLORS = {
  correct: '#22C55E', // Yeşil
  wrong: '#EF4444', // Kırmızı
  blank: '#9CA3AF', // Gri
  average: '#3B82F6', // Mavi
  histogram: '#10B981', // Emerald
};

