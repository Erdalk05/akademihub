/**
 * RiskEngine - Akıllı Risk Analiz Motoru
 * 
 * Pure functions - Veritabanına yazma yok
 * Explainable output - Neden riskli olduğu açık
 * Returns: score, level, reasons, trend, recommendations
 */

// ==================== TYPES ====================

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type RiskTrend = 'improving' | 'stable' | 'worsening' | 'unknown';
export type RiskCategory = 'payment' | 'behavior' | 'engagement' | 'financial';

export interface RiskReason {
  code: string;
  category: RiskCategory;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number; // 0-100 arası etki puanı
}

export interface RiskTrendData {
  direction: RiskTrend;
  change: number; // Pozitif = kötüleşme, Negatif = iyileşme
  previousScore: number;
  currentScore: number;
  description: string;
}

export interface RiskRecommendation {
  priority: 'urgent' | 'high' | 'medium' | 'low';
  action: string;
  description: string;
  deadline?: string;
}

export interface RiskAnalysis {
  // Core
  score: number; // 0-100
  level: RiskLevel;
  label: string;
  
  // Visual
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  
  // Explainability
  reasons: RiskReason[];
  summary: string;
  
  // Trend
  trend: RiskTrendData;
  
  // Actions
  recommendations: RiskRecommendation[];
  
  // Raw data
  metrics: {
    overdueDays: number;
    overdueAmount: number;
    overdueCount: number;
    totalDebt: number;
    paidAmount: number;
    paymentRatio: number;
    avgPaymentDelay: number;
  };
}

export interface StudentPaymentData {
  // Financial
  totalDebt?: number;
  paidAmount?: number;
  remainingAmount?: number;
  
  // Overdue
  overdueCount?: number;
  overdueDays?: number;
  overdueAmount?: number;
  
  // Installments
  installments?: Array<{
    id?: string;
    is_paid: boolean;
    due_date: string;
    amount: number;
    paid_amount?: number;
    paid_date?: string;
  }>;
  
  // Historical (for trend)
  previousRiskScore?: number;
  paymentHistory?: Array<{
    date: string;
    amount: number;
    delay?: number; // gün cinsinden gecikme
  }>;
}

// ==================== CONSTANTS ====================

const RISK_THRESHOLDS = {
  CRITICAL_DAYS: 90,
  HIGH_DAYS: 60,
  MEDIUM_DAYS: 30,
  LOW_DAYS: 7,
  
  CRITICAL_SCORE: 75,
  HIGH_SCORE: 50,
  MEDIUM_SCORE: 25,
  
  HIGH_AMOUNT: 100000,
  MEDIUM_AMOUNT: 50000,
  
  LOW_PAYMENT_RATIO: 0.25,
  MEDIUM_PAYMENT_RATIO: 0.5,
};

const RISK_COLORS = {
  critical: {
    color: '#dc2626',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300'
  },
  high: {
    color: '#ea580c',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300'
  },
  medium: {
    color: '#ca8a04',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300'
  },
  low: {
    color: '#65a30d',
    bgColor: 'bg-lime-100',
    textColor: 'text-lime-700',
    borderColor: 'border-lime-300'
  },
  none: {
    color: '#16a34a',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300'
  }
};

const RISK_LABELS: Record<RiskLevel, string> = {
  critical: 'Kritik Risk',
  high: 'Yüksek Risk',
  medium: 'Orta Risk',
  low: 'Düşük Risk',
  none: 'Risk Yok'
};

// ==================== CORE ENGINE ====================

/**
 * Ana risk analizi fonksiyonu
 * Pure function - Side effect yok
 */
export function analyzeRisk(data: StudentPaymentData): RiskAnalysis {
  const metrics = calculateMetrics(data);
  const reasons = identifyRiskReasons(metrics, data);
  const score = calculateScore(reasons);
  const level = determineLevel(score);
  const trend = calculateTrend(score, data.previousRiskScore, data.paymentHistory);
  const recommendations = generateRecommendations(level, reasons, metrics);
  const summary = generateSummary(level, reasons, metrics);
  
  const colors = RISK_COLORS[level];
  
  return {
    score,
    level,
    label: RISK_LABELS[level],
    ...colors,
    reasons,
    summary,
    trend,
    recommendations,
    metrics
  };
}

/**
 * Metrikleri hesapla
 */
function calculateMetrics(data: StudentPaymentData): RiskAnalysis['metrics'] {
  const {
    totalDebt = 0,
    paidAmount = 0,
    overdueDays = 0,
    overdueAmount = 0,
    overdueCount = 0,
    installments = [],
    paymentHistory = []
  } = data;
  
  let calculatedOverdueDays = overdueDays;
  let calculatedOverdueAmount = overdueAmount;
  let calculatedOverdueCount = overdueCount;
  
  // Taksitlerden hesapla (daha doğru)
  if (installments.length > 0) {
    const today = new Date();
    const overdueInstallments = installments.filter(inst => {
      if (inst.is_paid) return false;
      const dueDate = new Date(inst.due_date);
      return dueDate < today;
    });
    
    calculatedOverdueCount = overdueInstallments.length;
    calculatedOverdueAmount = overdueInstallments.reduce(
      (sum, inst) => sum + (inst.amount - (inst.paid_amount || 0)), 
      0
    );
    
    if (overdueInstallments.length > 0) {
      const oldestDue = overdueInstallments.reduce((oldest, inst) => {
        const dueDate = new Date(inst.due_date);
        return dueDate < oldest ? dueDate : oldest;
      }, new Date(overdueInstallments[0].due_date));
      
      calculatedOverdueDays = Math.floor(
        (today.getTime() - oldestDue.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }
  
  // Ortalama ödeme gecikmesi
  let avgPaymentDelay = 0;
  if (paymentHistory.length > 0) {
    const delays = paymentHistory.filter(p => p.delay !== undefined).map(p => p.delay || 0);
    avgPaymentDelay = delays.length > 0 
      ? delays.reduce((a, b) => a + b, 0) / delays.length 
      : 0;
  }
  
  const paymentRatio = totalDebt > 0 ? paidAmount / totalDebt : 1;
  
  return {
    overdueDays: calculatedOverdueDays,
    overdueAmount: calculatedOverdueAmount,
    overdueCount: calculatedOverdueCount,
    totalDebt,
    paidAmount,
    paymentRatio,
    avgPaymentDelay
  };
}

/**
 * Risk nedenlerini belirle (Explainability)
 */
function identifyRiskReasons(
  metrics: RiskAnalysis['metrics'], 
  data: StudentPaymentData
): RiskReason[] {
  const reasons: RiskReason[] = [];
  
  // 1. Gecikme Günü Analizi
  if (metrics.overdueDays >= RISK_THRESHOLDS.CRITICAL_DAYS) {
    reasons.push({
      code: 'OVERDUE_CRITICAL',
      category: 'payment',
      severity: 'critical',
      title: '90+ Gün Gecikme',
      description: `${metrics.overdueDays} gündür ödeme yapılmamış. Acil müdahale gerekli.`,
      impact: 40
    });
  } else if (metrics.overdueDays >= RISK_THRESHOLDS.HIGH_DAYS) {
    reasons.push({
      code: 'OVERDUE_HIGH',
      category: 'payment',
      severity: 'high',
      title: '60+ Gün Gecikme',
      description: `${metrics.overdueDays} gündür ödeme bekliyor.`,
      impact: 30
    });
  } else if (metrics.overdueDays >= RISK_THRESHOLDS.MEDIUM_DAYS) {
    reasons.push({
      code: 'OVERDUE_MEDIUM',
      category: 'payment',
      severity: 'medium',
      title: '30+ Gün Gecikme',
      description: `${metrics.overdueDays} gün gecikmiş ödeme mevcut.`,
      impact: 20
    });
  } else if (metrics.overdueDays >= RISK_THRESHOLDS.LOW_DAYS) {
    reasons.push({
      code: 'OVERDUE_LOW',
      category: 'payment',
      severity: 'low',
      title: 'Gecikmiş Ödeme',
      description: `${metrics.overdueDays} gün gecikme var.`,
      impact: 10
    });
  }
  
  // 2. Gecikmiş Taksit Sayısı
  if (metrics.overdueCount >= 4) {
    reasons.push({
      code: 'MULTIPLE_OVERDUE_CRITICAL',
      category: 'payment',
      severity: 'critical',
      title: '4+ Gecikmiş Taksit',
      description: `${metrics.overdueCount} taksit ödenmemiş durumda. Ciddi tahsilat sorunu.`,
      impact: 35
    });
  } else if (metrics.overdueCount >= 3) {
    reasons.push({
      code: 'MULTIPLE_OVERDUE_HIGH',
      category: 'payment',
      severity: 'high',
      title: '3 Gecikmiş Taksit',
      description: 'Birden fazla taksit birikmiş durumda.',
      impact: 25
    });
  } else if (metrics.overdueCount >= 2) {
    reasons.push({
      code: 'MULTIPLE_OVERDUE_MEDIUM',
      category: 'payment',
      severity: 'medium',
      title: '2 Gecikmiş Taksit',
      description: '2 taksit ödeme bekliyor.',
      impact: 15
    });
  }
  
  // 3. Ödeme Oranı
  if (metrics.paymentRatio < RISK_THRESHOLDS.LOW_PAYMENT_RATIO) {
    reasons.push({
      code: 'LOW_PAYMENT_RATIO',
      category: 'financial',
      severity: 'high',
      title: 'Düşük Ödeme Oranı',
      description: `Toplam borcun sadece %${(metrics.paymentRatio * 100).toFixed(0)}'si ödenmiş.`,
      impact: 25
    });
  } else if (metrics.paymentRatio < RISK_THRESHOLDS.MEDIUM_PAYMENT_RATIO) {
    reasons.push({
      code: 'MEDIUM_PAYMENT_RATIO',
      category: 'financial',
      severity: 'medium',
      title: 'Orta Ödeme Oranı',
      description: `Borcun %${(metrics.paymentRatio * 100).toFixed(0)}'si ödenmiş.`,
      impact: 10
    });
  }
  
  // 4. Yüksek Gecikmiş Tutar
  if (metrics.overdueAmount >= RISK_THRESHOLDS.HIGH_AMOUNT) {
    reasons.push({
      code: 'HIGH_OVERDUE_AMOUNT',
      category: 'financial',
      severity: 'high',
      title: 'Yüksek Gecikmiş Tutar',
      description: `₺${metrics.overdueAmount.toLocaleString('tr-TR')} tutarında gecikmiş ödeme.`,
      impact: 15
    });
  } else if (metrics.overdueAmount >= RISK_THRESHOLDS.MEDIUM_AMOUNT) {
    reasons.push({
      code: 'MEDIUM_OVERDUE_AMOUNT',
      category: 'financial',
      severity: 'medium',
      title: 'Orta Düzey Gecikmiş Tutar',
      description: `₺${metrics.overdueAmount.toLocaleString('tr-TR')} ödeme bekliyor.`,
      impact: 10
    });
  }
  
  // 5. Ortalama Gecikme Davranışı
  if (metrics.avgPaymentDelay > 30) {
    reasons.push({
      code: 'CHRONIC_LATE_PAYER',
      category: 'behavior',
      severity: 'high',
      title: 'Kronik Geç Ödeme',
      description: `Ortalama ${Math.round(metrics.avgPaymentDelay)} gün geç ödeme alışkanlığı var.`,
      impact: 20
    });
  } else if (metrics.avgPaymentDelay > 14) {
    reasons.push({
      code: 'LATE_PAYER',
      category: 'behavior',
      severity: 'medium',
      title: 'Geç Ödeme Eğilimi',
      description: `Ortalama ${Math.round(metrics.avgPaymentDelay)} gün geç ödeme yapıyor.`,
      impact: 10
    });
  }
  
  return reasons.sort((a, b) => b.impact - a.impact);
}

/**
 * Risk skorunu hesapla
 */
function calculateScore(reasons: RiskReason[]): number {
  const totalImpact = reasons.reduce((sum, r) => sum + r.impact, 0);
  return Math.min(100, totalImpact);
}

/**
 * Risk seviyesini belirle
 */
function determineLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.CRITICAL_SCORE) return 'critical';
  if (score >= RISK_THRESHOLDS.HIGH_SCORE) return 'high';
  if (score >= RISK_THRESHOLDS.MEDIUM_SCORE) return 'medium';
  if (score > 0) return 'low';
  return 'none';
}

/**
 * Trend hesapla
 */
function calculateTrend(
  currentScore: number, 
  previousScore?: number,
  paymentHistory?: Array<{ date: string; amount: number; delay?: number }>
): RiskTrendData {
  if (previousScore === undefined) {
    // Ödeme geçmişinden trend çıkar
    if (paymentHistory && paymentHistory.length >= 3) {
      const recentPayments = paymentHistory.slice(-3);
      const delays = recentPayments.filter(p => p.delay !== undefined).map(p => p.delay || 0);
      
      if (delays.length >= 2) {
        const trend = delays[delays.length - 1] - delays[0];
        if (trend > 7) {
          return {
            direction: 'worsening',
            change: trend,
            previousScore: currentScore - 10,
            currentScore,
            description: 'Son ödemelerde gecikme artıyor'
          };
        } else if (trend < -7) {
          return {
            direction: 'improving',
            change: trend,
            previousScore: currentScore + 10,
            currentScore,
            description: 'Son ödemelerde düzelme var'
          };
        }
      }
    }
    
    return {
      direction: 'unknown',
      change: 0,
      previousScore: currentScore,
      currentScore,
      description: 'Yeterli veri yok'
    };
  }
  
  const change = currentScore - previousScore;
  
  if (change > 10) {
    return {
      direction: 'worsening',
      change,
      previousScore,
      currentScore,
      description: 'Risk seviyesi artıyor'
    };
  } else if (change < -10) {
    return {
      direction: 'improving',
      change,
      previousScore,
      currentScore,
      description: 'Risk seviyesi düşüyor'
    };
  }
  
  return {
    direction: 'stable',
    change,
    previousScore,
    currentScore,
    description: 'Risk seviyesi stabil'
  };
}

/**
 * Öneriler oluştur
 */
function generateRecommendations(
  level: RiskLevel, 
  reasons: RiskReason[],
  metrics: RiskAnalysis['metrics']
): RiskRecommendation[] {
  const recommendations: RiskRecommendation[] = [];
  
  if (level === 'critical') {
    recommendations.push({
      priority: 'urgent',
      action: 'Acil Telefon Görüşmesi',
      description: 'Veli ile hemen iletişime geçin ve ödeme planı oluşturun.',
      deadline: 'Bugün'
    });
    
    if (metrics.overdueAmount > 50000) {
      recommendations.push({
        priority: 'urgent',
        action: 'Yönetim Bildirimi',
        description: 'Yüksek tutarlı gecikme hakkında yönetimi bilgilendirin.'
      });
    }
  }
  
  if (level === 'high') {
    recommendations.push({
      priority: 'high',
      action: 'Ödeme Hatırlatması',
      description: 'SMS veya WhatsApp ile ödeme hatırlatması gönderin.',
      deadline: 'Bu hafta'
    });
  }
  
  if (reasons.some(r => r.code === 'CHRONIC_LATE_PAYER')) {
    recommendations.push({
      priority: 'medium',
      action: 'Ödeme Planı Revizyonu',
      description: 'Vade tarihlerini veya ödeme yöntemini gözden geçirin.'
    });
  }
  
  if (metrics.overdueCount >= 2) {
    recommendations.push({
      priority: 'high',
      action: 'Yapılandırma Teklifi',
      description: 'Birikmiş taksitler için yapılandırma seçeneği sunun.'
    });
  }
  
  if (level === 'medium') {
    recommendations.push({
      priority: 'medium',
      action: 'Takip Hatırlatması',
      description: 'Yaklaşan vadeler için önceden hatırlatma yapın.',
      deadline: 'Vade öncesi 3 gün'
    });
  }
  
  if (level === 'low' || level === 'none') {
    recommendations.push({
      priority: 'low',
      action: 'Düzenli Takip',
      description: 'Mevcut ödeme düzenini korumak için periyodik kontrol yapın.'
    });
  }
  
  return recommendations.slice(0, 3); // Max 3 öneri
}

/**
 * Özet metin oluştur
 */
function generateSummary(
  level: RiskLevel, 
  reasons: RiskReason[],
  metrics: RiskAnalysis['metrics']
): string {
  if (reasons.length === 0) {
    return 'Öğrenci ödeme konusunda düzenli, herhangi bir risk bulunmuyor.';
  }
  
  const topReason = reasons[0];
  const hasMultipleReasons = reasons.length > 1;
  
  let summary = '';
  
  switch (level) {
    case 'critical':
      summary = `ACİL MÜDAHALE GEREKLİ: ${topReason.description}`;
      break;
    case 'high':
      summary = `Yüksek risk: ${topReason.description}`;
      break;
    case 'medium':
      summary = `Takip gerekli: ${topReason.description}`;
      break;
    case 'low':
      summary = `Düşük risk: ${topReason.description}`;
      break;
    default:
      summary = 'Risk bulunmuyor.';
  }
  
  if (hasMultipleReasons) {
    summary += ` (+${reasons.length - 1} ek faktör)`;
  }
  
  return summary;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Birden fazla öğrenci için toplu analiz
 */
export function analyzeMultipleStudents(
  students: Array<{ id: string } & StudentPaymentData>
): Map<string, RiskAnalysis> {
  const results = new Map<string, RiskAnalysis>();
  
  students.forEach(student => {
    results.set(student.id, analyzeRisk(student));
  });
  
  return results;
}

/**
 * Risk istatistikleri hesapla
 */
export function calculateRiskStats(analyses: RiskAnalysis[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
  averageScore: number;
  totalAtRisk: number;
  worstReasons: RiskReason[];
} {
  const stats = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
    averageScore: 0,
    totalAtRisk: 0,
    worstReasons: [] as RiskReason[]
  };
  
  const allReasons: RiskReason[] = [];
  let totalScore = 0;
  
  analyses.forEach(analysis => {
    stats[analysis.level]++;
    totalScore += analysis.score;
    
    if (analysis.level !== 'none' && analysis.level !== 'low') {
      stats.totalAtRisk++;
    }
    
    allReasons.push(...analysis.reasons);
  });
  
  stats.averageScore = analyses.length > 0 ? totalScore / analyses.length : 0;
  
  // En yaygın risk nedenleri
  const reasonCounts = new Map<string, { reason: RiskReason; count: number }>();
  allReasons.forEach(r => {
    const existing = reasonCounts.get(r.code);
    if (existing) {
      existing.count++;
    } else {
      reasonCounts.set(r.code, { reason: r, count: 1 });
    }
  });
  
  stats.worstReasons = Array.from(reasonCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(item => item.reason);
  
  return stats;
}

/**
 * Basit risk seviyesi (backward compatibility)
 */
export function getSimpleRiskLevel(data: StudentPaymentData): {
  level: RiskLevel;
  label: string;
  score: number;
  color: string;
} {
  const analysis = analyzeRisk(data);
  return {
    level: analysis.level,
    label: analysis.label,
    score: analysis.score,
    color: analysis.color
  };
}

/**
 * Hızlı risk kontrolü
 */
export function isHighRisk(data: StudentPaymentData): boolean {
  const analysis = analyzeRisk(data);
  return analysis.level === 'critical' || analysis.level === 'high';
}

/**
 * Risk renk sınıfı (Tailwind)
 */
export function getRiskColorClasses(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
} {
  const colors = RISK_COLORS[level];
  return {
    bg: colors.bgColor,
    text: colors.textColor,
    border: colors.borderColor
  };
}
