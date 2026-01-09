// ============================================================================
// EXAM LIST TYPES - Sınavlar Sayfası İçin TypeScript Interface'leri
// ============================================================================

/**
 * Risk durumu enum
 * - low: Düşük risk (yeşil)
 * - medium: Orta risk (sarı)
 * - high: Yüksek risk (kırmızı)
 */
export type RiskStatus = 'low' | 'medium' | 'high';

/**
 * Analiz durumu
 * - pending: Beklemede
 * - processing: İşleniyor
 * - completed: Tamamlandı
 * - error: Hata
 */
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'error';

/**
 * Sınav türü
 */
export type ExamType = 'LGS' | 'TYT' | 'AYT' | 'YDT' | 'ARA_SINAV' | 'DENEME';

/**
 * Branş özeti
 */
export interface BranchSummary {
  branchName: string;
  branchCode: string;
  questionCount: number;
  averageNet: number;
  averageCorrect: number;
  averageWrong: number;
  successRate: number; // Yüzde olarak
}

/**
 * Katılım dağılımı
 */
export interface ParticipationStats {
  totalParticipants: number;
  institutionCount: number;  // Asil öğrenci
  guestCount: number;        // Misafir öğrenci
  absentCount: number;       // Katılmayan
  matchedCount: number;      // Eşleşen
  unmatchedCount: number;    // Eşleşmeyen
}

/**
 * İstatistik özeti
 */
export interface ExamStatsSummary {
  averageNet: number;
  maxNet: number;
  minNet: number;
  medianNet: number;
  standardDeviation: number;
  homogeneityRate: number;   // Homojenlik oranı (0-100)
  averageCorrect: number;
  averageWrong: number;
  averageBlank: number;
}

/**
 * Sınav listesi için ana interface
 */
export interface ExamListItem {
  id: string;
  name: string;
  examType: ExamType;
  examDate: string;
  createdAt: string;
  totalQuestions: number;
  
  // Katılım
  totalParticipants: number;
  institutionCount: number;
  guestCount: number;
  
  // İstatistikler
  averageNet: number;
  maxNet: number;
  
  // Durum
  riskStatus: RiskStatus;
  analysisStatus: AnalysisStatus;
  isPublished: boolean;
  
  // Opsiyonel detaylar
  gradeLevel?: string;
  description?: string;
}

/**
 * Genişletilmiş sınav detayı (accordion için)
 */
export interface ExamExpandedDetails {
  examId: string;
  
  // Katılım dağılımı
  participation: ParticipationStats;
  
  // İstatistikler
  stats: ExamStatsSummary;
  
  // Branş özeti
  branches: BranchSummary[];
  
  // AI yorumu (mock)
  aiComment?: string;
}

/**
 * Sınıf seviyesi (4-12 + Mezun)
 */
export type GradeLevel = '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'mezun' | 'all';

/**
 * Sınıf seviyeleri listesi
 */
export const GRADE_LEVELS: { value: GradeLevel; label: string }[] = [
  { value: 'all', label: 'Tüm Sınıflar' },
  { value: '4', label: '4. Sınıf' },
  { value: '5', label: '5. Sınıf' },
  { value: '6', label: '6. Sınıf' },
  { value: '7', label: '7. Sınıf' },
  { value: '8', label: '8. Sınıf' },
  { value: '9', label: '9. Sınıf' },
  { value: '10', label: '10. Sınıf' },
  { value: '11', label: '11. Sınıf' },
  { value: '12', label: '12. Sınıf' },
  { value: 'mezun', label: 'Mezun' },
];

/**
 * Sınav listesi filtre state'i
 */
export interface ExamListFilters {
  search: string;
  examType: ExamType | 'all';
  riskStatus: RiskStatus | 'all';
  analysisStatus: AnalysisStatus | 'all';
  gradeLevel: GradeLevel;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

/**
 * Sınav listesi sıralama
 */
export interface ExamListSort {
  field: 'name' | 'examDate' | 'totalParticipants' | 'averageNet' | 'riskStatus';
  direction: 'asc' | 'desc';
}

/**
 * Hızlı aksiyonlar
 */
export interface ExamQuickAction {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  variant: 'primary' | 'secondary' | 'danger';
}

/**
 * Risk durumuna göre renk ve metin
 */
export const RISK_CONFIG: Record<RiskStatus, { color: string; bgColor: string; text: string }> = {
  low: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', text: 'Düşük' },
  medium: { color: 'text-amber-700', bgColor: 'bg-amber-100', text: 'Orta' },
  high: { color: 'text-red-700', bgColor: 'bg-red-100', text: 'Yüksek' },
};

/**
 * Analiz durumuna göre renk ve metin
 */
export const ANALYSIS_STATUS_CONFIG: Record<AnalysisStatus, { color: string; bgColor: string; text: string; icon: string }> = {
  pending: { color: 'text-gray-600', bgColor: 'bg-gray-100', text: 'Beklemede', icon: 'Clock' },
  processing: { color: 'text-blue-600', bgColor: 'bg-blue-100', text: 'İşleniyor', icon: 'Loader2' },
  completed: { color: 'text-emerald-600', bgColor: 'bg-emerald-100', text: 'Tamamlandı', icon: 'CheckCircle2' },
  error: { color: 'text-red-600', bgColor: 'bg-red-100', text: 'Hata', icon: 'AlertCircle' },
};

/**
 * Sınav türüne göre badge rengi
 */
export const EXAM_TYPE_CONFIG: Record<ExamType, { color: string; bgColor: string }> = {
  LGS: { color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  TYT: { color: 'text-blue-700', bgColor: 'bg-blue-100' },
  AYT: { color: 'text-purple-700', bgColor: 'bg-purple-100' },
  YDT: { color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  ARA_SINAV: { color: 'text-orange-700', bgColor: 'bg-orange-100' },
  DENEME: { color: 'text-gray-700', bgColor: 'bg-gray-100' },
};
