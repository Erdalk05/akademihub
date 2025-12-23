/**
 * Risk Calculator
 * Öğrenci risk hesaplamalarını merkezi bir yerden yapar
 * Render döngüsünden bağımsız, lazy hesaplama
 */

export interface RiskData {
  level: 'low' | 'medium' | 'high' | 'critical';
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  score: number;
  overdueDays: number;
  overdueAmount: number;
  totalDebt: number;
  paidAmount: number;
  unpaidCount: number;
  reasons: string[];
}

export interface StudentFinanceData {
  totalDebt?: number;
  paidAmount?: number;
  unpaidAmount?: number;
  overdueCount?: number;
  overdueDays?: number;
  overdueAmount?: number;
  installments?: Array<{
    is_paid: boolean;
    due_date: string;
    amount: number;
    paid_amount?: number;
  }>;
}

function log(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[RISK] ${message}`, data || '');
  }
}

/**
 * Risk seviyesi hesapla
 */
export function calculateRiskLevel(data: StudentFinanceData): RiskData {
  const {
    totalDebt = 0,
    paidAmount = 0,
    overdueDays = 0,
    overdueAmount = 0,
    overdueCount = 0,
    installments = []
  } = data;

  // Gecikmiş taksitleri hesapla
  const today = new Date();
  let calculatedOverdueDays = overdueDays;
  let calculatedOverdueAmount = overdueAmount;
  let unpaidCount = overdueCount;
  const reasons: string[] = [];

  if (installments.length > 0) {
    const overdueInstallments = installments.filter(inst => {
      if (inst.is_paid) return false;
      const dueDate = new Date(inst.due_date);
      return dueDate < today;
    });

    unpaidCount = overdueInstallments.length;
    calculatedOverdueAmount = overdueInstallments.reduce((sum, inst) => sum + (inst.amount - (inst.paid_amount || 0)), 0);
    
    if (overdueInstallments.length > 0) {
      const oldestDue = overdueInstallments.reduce((oldest, inst) => {
        const dueDate = new Date(inst.due_date);
        return dueDate < oldest ? dueDate : oldest;
      }, new Date(overdueInstallments[0].due_date));
      
      calculatedOverdueDays = Math.floor((today.getTime() - oldestDue.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // Risk skoru hesapla (0-100)
  let score = 0;

  // Gecikme günü bazlı skor
  if (calculatedOverdueDays > 90) {
    score += 40;
    reasons.push('90+ gün gecikme');
  } else if (calculatedOverdueDays > 60) {
    score += 30;
    reasons.push('60+ gün gecikme');
  } else if (calculatedOverdueDays > 30) {
    score += 20;
    reasons.push('30+ gün gecikme');
  } else if (calculatedOverdueDays > 0) {
    score += 10;
    reasons.push('Gecikmiş ödeme var');
  }

  // Ödenmemiş taksit sayısı bazlı skor
  if (unpaidCount >= 3) {
    score += 30;
    reasons.push('3+ gecikmiş taksit');
  } else if (unpaidCount >= 2) {
    score += 20;
    reasons.push('2 gecikmiş taksit');
  } else if (unpaidCount >= 1) {
    score += 10;
  }

  // Ödeme oranı bazlı skor
  const paymentRatio = totalDebt > 0 ? paidAmount / totalDebt : 1;
  if (paymentRatio < 0.25) {
    score += 20;
    reasons.push('Ödeme oranı düşük');
  } else if (paymentRatio < 0.5) {
    score += 10;
  }

  // Gecikmiş tutar bazlı skor
  if (calculatedOverdueAmount > 50000) {
    score += 10;
    reasons.push('Yüksek gecikmiş tutar');
  }

  // Risk seviyesi belirleme
  let level: RiskData['level'];
  let label: string;
  let color: string;
  let bgColor: string;
  let textColor: string;

  if (score >= 70) {
    level = 'critical';
    label = 'Kritik Risk';
    color = '#dc2626';
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
  } else if (score >= 40) {
    level = 'high';
    label = 'Yüksek Risk';
    color = '#f97316';
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-700';
  } else if (score >= 20) {
    level = 'medium';
    label = 'Orta Risk';
    color = '#eab308';
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-700';
  } else {
    level = 'low';
    label = 'Düşük Risk';
    color = '#22c55e';
    bgColor = 'bg-green-100';
    textColor = 'text-green-700';
  }

  return {
    level,
    label,
    color,
    bgColor,
    textColor,
    score,
    overdueDays: calculatedOverdueDays,
    overdueAmount: calculatedOverdueAmount,
    totalDebt,
    paidAmount,
    unpaidCount,
    reasons
  };
}

/**
 * Öğrenci için risk hesapla (kısayol)
 */
export function calculateStudentRisk(student: any): RiskData {
  // Finance bilgisi varsa kullan
  if (student.finance) {
    return calculateRiskLevel({
      totalDebt: student.finance.totalAmount || 0,
      paidAmount: student.finance.paidAmount || 0,
      overdueCount: student.finance.overdueCount || 0,
      overdueDays: student.finance.overdueDays || 0,
      overdueAmount: student.finance.overdueAmount || 0
    });
  }

  // Direkt öğrenci objesinden hesapla
  return calculateRiskLevel({
    totalDebt: student.total_debt || student.totalDebt || 0,
    paidAmount: student.paid_amount || student.paidAmount || 0,
    overdueCount: student.overdue_count || student.overdueCount || 0,
    overdueDays: student.overdue_days || student.overdueDays || 0,
    overdueAmount: student.overdue_amount || student.overdueAmount || 0
  });
}

/**
 * Birden fazla öğrenci için toplu risk hesapla (lazy)
 */
export function calculateBulkRisk(students: any[]): Map<string, RiskData> {
  log(`Toplu risk hesaplanıyor: ${students.length} öğrenci`);
  
  const riskMap = new Map<string, RiskData>();
  
  students.forEach(student => {
    if (student.id) {
      riskMap.set(student.id, calculateStudentRisk(student));
    }
  });

  log(`Risk hesaplaması tamamlandı: ${riskMap.size} öğrenci`);
  return riskMap;
}

/**
 * Risk istatistikleri
 */
export function getRiskStats(students: any[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  totalRisky: number;
} {
  const stats = { critical: 0, high: 0, medium: 0, low: 0, totalRisky: 0 };
  
  students.forEach(student => {
    const risk = calculateStudentRisk(student);
    stats[risk.level]++;
    if (risk.level !== 'low') {
      stats.totalRisky++;
    }
  });

  return stats;
}
