/**
 * ============================================
 * AkademiHub - Executive Types
 * ============================================
 * 
 * PHASE 8.2 - Founder Command Center
 * 
 * BU DOSYA:
 * - Kurucu dashboard tipleri
 * - Kurumsal analitik tipleri
 * - AI kurumsal özet tipleri
 */

// ==================== CRISIS ALERT ====================

export type CrisisLevel = 'critical' | 'warning' | 'stable' | 'improving';

export interface AcademicCrisisAlert {
  /** Alert ID */
  id: string;
  
  /** Kriz seviyesi */
  level: CrisisLevel;
  
  /** Konu */
  subject: string;
  
  /** Konu kodu */
  subjectCode: string;
  
  /** Konu adı (Türkçe) */
  topicName?: string;
  
  /** Mevcut başarı oranı (%) */
  currentRate: number;
  
  /** Önceki başarı oranı (%) */
  previousRate: number;
  
  /** Değişim (%) */
  change: number;
  
  /** Etkilenen öğrenci sayısı */
  affectedStudents: number;
  
  /** Kullanıcı dostu mesaj */
  message: string;
  
  /** Önerilen aksiyon */
  suggestedAction: string;
  
  /** Öncelik sırası (1 = en yüksek) */
  priority: number;
}

// ==================== PARTICIPATION ====================

export interface ParticipationAnalysis {
  /** Toplam öğrenci sayısı */
  totalStudents: number;
  
  /** Sınava giren sayısı */
  participatedCount: number;
  
  /** Girmeyen sayısı */
  absentCount: number;
  
  /** Katılım oranı (%) */
  participationRate: number;
  
  /** Devamsız öğrenciler listesi */
  absentStudents: AbsentStudent[];
  
  /** Sınıf bazlı katılım */
  byClass: ClassParticipation[];
}

export interface AbsentStudent {
  id: string;
  studentNo: string;
  fullName: string;
  className: string;
  /** Ardışık devamsızlık */
  consecutiveAbsences?: number;
}

export interface ClassParticipation {
  className: string;
  totalStudents: number;
  participatedCount: number;
  participationRate: number;
}

// ==================== CLASS COMPARISON ====================

export interface ClassComparison {
  /** Sınıf adı */
  className: string;
  
  /** Öğrenci sayısı */
  studentCount: number;
  
  /** Ortalama başarı (%) */
  averageScore: number;
  
  /** En yüksek */
  highestScore: number;
  
  /** En düşük */
  lowestScore: number;
  
  /** Standart sapma */
  standardDeviation: number;
  
  /** Ders bazlı */
  bySubject: SubjectClassPerformance[];
  
  /** Trend */
  trend: 'up' | 'down' | 'stable';
  
  /** Önceki sınava göre değişim */
  changeFromPrevious: number;
}

export interface SubjectClassPerformance {
  subject: string;
  subjectCode: string;
  averageScore: number;
  netAverage: number;
}

// ==================== AI KURUMSAL ÖZET ====================

export interface AIInstitutionalSummary {
  /** Özet ID */
  id: string;
  
  /** Oluşturulma zamanı */
  generatedAt: string;
  
  /** Hitap */
  salutation: string;
  
  /** Genel değerlendirme */
  overallAssessment: string;
  
  /** Kritik bulgular */
  criticalFindings: CriticalFinding[];
  
  /** Önerilen aksiyonlar */
  recommendedActions: RecommendedAction[];
  
  /** Haftalık öncelikler */
  weeklyPriorities: WeeklyPriority[];
  
  /** Kapanış notu */
  closingNote: string;
}

export interface CriticalFinding {
  /** Bulgu türü */
  type: 'academic' | 'participation' | 'trend' | 'risk';
  
  /** Öncelik */
  priority: 'high' | 'medium' | 'low';
  
  /** Açıklama */
  description: string;
  
  /** Veri referansı */
  dataReference: string;
  
  /** Emoji */
  emoji: string;
}

export interface RecommendedAction {
  /** Aksiyon tipi */
  type: 'meeting' | 'intervention' | 'monitoring' | 'communication';
  
  /** Açıklama */
  description: string;
  
  /** Hedef kitle */
  target: 'teachers' | 'students' | 'parents' | 'all';
  
  /** Önerilen tarih */
  suggestedDate?: string;
  
  /** Emoji */
  emoji: string;
}

export interface WeeklyPriority {
  /** Sıra */
  order: number;
  
  /** Açıklama */
  description: string;
  
  /** Sorumlu */
  responsible: string;
}

// ==================== FOUNDER DASHBOARD ====================

export interface FounderDashboardData {
  /** Son güncelleme */
  lastUpdated: string;
  
  /** Kurum bilgisi */
  organization: {
    id: string;
    name: string;
    studentCount: number;
    teacherCount: number;
    classCount: number;
  };
  
  /** Son sınav */
  lastExam: {
    id: string;
    name: string;
    date: string;
    participationRate: number;
    averageScore: number;
  } | null;
  
  /** Kriz uyarıları */
  crisisAlerts: AcademicCrisisAlert[];
  
  /** Katılım analizi */
  participation: ParticipationAnalysis;
  
  /** Sınıf karşılaştırma */
  classComparison: ClassComparison[];
  
  /** AI kurumsal özet */
  aiSummary: AIInstitutionalSummary | null;
  
  /** Trend verileri */
  trends: TrendData[];
}

export interface TrendData {
  /** Tarih */
  date: string;
  
  /** Sınav adı */
  examName: string;
  
  /** Ortalama başarı */
  averageScore: number;
  
  /** Katılım oranı */
  participationRate: number;
}

// ==================== INSIGHT FEED ====================

export interface InsightFeedItem {
  /** ID */
  id: string;
  
  /** Tip */
  type: 'crisis' | 'achievement' | 'trend' | 'action' | 'ai_insight';
  
  /** Başlık */
  title: string;
  
  /** Açıklama */
  description: string;
  
  /** Zaman */
  timestamp: string;
  
  /** Emoji */
  emoji: string;
  
  /** Renk sınıfı */
  colorClass: string;
  
  /** Aksiyon gerekli mi? */
  actionRequired: boolean;
  
  /** Aksiyon metni */
  actionText?: string;
  
  /** Aksiyon linki */
  actionLink?: string;
}

// ==================== EXECUTIVE ADAPTER OUTPUT ====================

export interface ExecutiveViewModel {
  /** Dashboard verisi */
  dashboard: FounderDashboardData;
  
  /** Insight feed */
  insights: InsightFeedItem[];
  
  /** Hızlı istatistikler */
  quickStats: QuickStat[];
  
  /** Durum */
  state: 'loading' | 'ready' | 'error' | 'empty';
  
  /** Hata mesajı */
  errorMessage?: string;
}

export interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  emoji: string;
  colorClass: string;
}

// ==================== EXPORT ====================

export type {
  CrisisLevel as ExecutiveCrisisLevel,
  AcademicCrisisAlert as ExecutiveCrisisAlert
};

