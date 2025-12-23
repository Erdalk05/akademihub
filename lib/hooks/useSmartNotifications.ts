'use client';

import { useEffect, useRef } from 'react';
import { useNotifications } from '@/lib/contexts/NotificationContext';
import { analyzeRisk, type RiskAnalysis } from '@/lib/risk/RiskEngine';

interface SmartNotificationConfig {
  enabled?: boolean;
  checkInterval?: number; // ms
}

interface StudentRiskData {
  id: string;
  name: string;
  totalDebt: number;
  overdueDays: number;
}

/**
 * useSmartNotifications - RiskEngine tabanlı akıllı bildirim sistemi
 * 
 * Dashboard yüklendiğinde kritik durumları kontrol eder ve bildirim oluşturur:
 * - Kritik risk öğrencileri
 * - Bugün vadesi dolan taksitler
 * - Yüksek borç uyarıları
 */
export function useSmartNotifications(
  riskStudents: StudentRiskData[],
  config: SmartNotificationConfig = {}
) {
  const { addNotification } = useNotifications();
  const hasCheckedRef = useRef(false);
  const lastCheckRef = useRef<string | null>(null);
  
  const { enabled = true, checkInterval = 60 * 60 * 1000 } = config; // Default: 1 saat

  useEffect(() => {
    if (!enabled || riskStudents.length === 0) return;
    
    // Günde bir kez kontrol et (veya belirtilen aralıkta)
    const today = new Date().toDateString();
    const lastCheck = typeof window !== 'undefined' 
      ? localStorage.getItem('smart_notifications_last_check')
      : null;
    
    if (lastCheck === today) {
      return; // Bugün zaten kontrol edildi
    }
    
    // RiskEngine ile analiz
    const analyses: (RiskAnalysis & { studentId: string; studentName: string })[] = [];
    
    riskStudents.forEach(student => {
      const analysis = analyzeRisk({
        totalDebt: student.totalDebt,
        overdueDays: student.overdueDays,
        overdueAmount: student.totalDebt
      });
      
      if (analysis.level === 'critical' || analysis.level === 'high') {
        analyses.push({
          ...analysis,
          studentId: student.id,
          studentName: student.name
        });
      }
    });
    
    // Kritik riskli öğrenciler için bildirim
    const criticalCount = analyses.filter(a => a.level === 'critical').length;
    const highCount = analyses.filter(a => a.level === 'high').length;
    
    if (criticalCount > 0) {
      addNotification({
        type: 'system_alert',
        title: '🚨 Kritik Risk Uyarısı',
        message: `${criticalCount} öğrenci kritik risk seviyesinde! Acil müdahale gerekebilir.`,
        data: {
          count: criticalCount,
          students: analyses.filter(a => a.level === 'critical').map(a => a.studentName)
        }
      });
    }
    
    if (highCount > 0) {
      addNotification({
        type: 'installment_overdue',
        title: '⚠️ Yüksek Risk Uyarısı',
        message: `${highCount} öğrenci yüksek risk seviyesinde. Bu hafta takip edilmeli.`,
        data: {
          count: highCount,
          students: analyses.filter(a => a.level === 'high').map(a => a.studentName)
        }
      });
    }
    
    // Toplam borç uyarısı
    const totalDebt = riskStudents.reduce((sum, s) => sum + s.totalDebt, 0);
    if (totalDebt > 100000) {
      addNotification({
        type: 'payment_reminder',
        title: '💰 Yüksek Borç Uyarısı',
        message: `Toplam tahsil edilmemiş borç: ₺${totalDebt.toLocaleString('tr-TR')}`,
        data: { totalDebt }
      });
    }
    
    // Son kontrol tarihini kaydet
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_notifications_last_check', today);
    }
    
    hasCheckedRef.current = true;
    lastCheckRef.current = today;
    
  }, [riskStudents, enabled, addNotification, checkInterval]);
  
  return {
    hasChecked: hasCheckedRef.current
  };
}

/**
 * generateRiskNotification - Tek bir öğrenci için risk bildirimi oluştur
 */
export function generateRiskNotification(
  studentName: string,
  riskAnalysis: RiskAnalysis,
  addNotification: (notification: any) => void
) {
  if (riskAnalysis.level === 'critical') {
    addNotification({
      type: 'system_alert',
      title: '🚨 Kritik Risk',
      message: `${studentName}: ${riskAnalysis.summary}`,
      data: {
        level: riskAnalysis.level,
        score: riskAnalysis.score,
        reasons: riskAnalysis.reasons.map(r => r.title)
      }
    });
  } else if (riskAnalysis.level === 'high') {
    addNotification({
      type: 'installment_overdue',
      title: '⚠️ Yüksek Risk',
      message: `${studentName}: ${riskAnalysis.summary}`,
      data: {
        level: riskAnalysis.level,
        score: riskAnalysis.score
      }
    });
  }
}

export default useSmartNotifications;
