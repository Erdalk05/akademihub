/**
 * Activity Logger (Audit Trail)
 * 
 * Tracks all user actions for security and compliance
 * Logs to database and optionally to file
 */

export type ActivityType =
  | 'student_create'
  | 'student_update'
  | 'student_delete'
  | 'payment_create'
  | 'payment_update'
  | 'payment_delete'
  | 'user_login'
  | 'user_logout'
  | 'registration_complete'
  | 'whatsapp_sent'
  | 'email_sent'
  | 'excel_export'
  | 'excel_import'
  | 'settings_change';

export interface ActivityLog {
  id?: string;
  userId: string;
  userName: string;
  action: ActivityType;
  entityType?: string; // 'student', 'payment', 'user', etc.
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Log an activity to database
 */
export async function logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, this would save to database
    const log: ActivityLog = {
      ...activity,
      timestamp: new Date().toISOString(),
    };

    // Development: Just console log
    if (process.env.NODE_ENV === 'development') {
      console.log('[Activity Log]', log);
      return { success: true };
    }

    // Production: Save to database
    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get activity logs with filters
 */
export async function getActivityLogs(filters?: {
  userId?: string;
  action?: ActivityType;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{ success: boolean; data?: ActivityLog[]; error?: string }> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });
    }

    const response = await fetch(`/api/activity-logs?${queryParams.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const data = await response.json();
    return { success: true, data: data.logs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Helper: Log student creation
 */
export async function logStudentCreate(
  userId: string,
  userName: string,
  studentId: string,
  studentName: string
) {
  return logActivity({
    userId,
    userName,
    action: 'student_create',
    entityType: 'student',
    entityId: studentId,
    description: `Yeni öğrenci kaydı oluşturuldu: ${studentName}`,
  });
}

/**
 * Helper: Log payment creation
 */
export async function logPaymentCreate(
  userId: string,
  userName: string,
  paymentId: string,
  amount: number,
  studentName: string
) {
  return logActivity({
    userId,
    userName,
    action: 'payment_create',
    entityType: 'payment',
    entityId: paymentId,
    description: `${studentName} için ${amount} TL ödeme kaydedildi`,
    metadata: { amount },
  });
}

/**
 * Helper: Log WhatsApp sent
 */
export async function logWhatsAppSent(
  userId: string,
  userName: string,
  to: string,
  templateName: string
) {
  return logActivity({
    userId,
    userName,
    action: 'whatsapp_sent',
    description: `${to} numarasına WhatsApp gönderildi (Template: ${templateName})`,
    metadata: { to, templateName },
  });
}

/**
 * Helper: Log Excel export
 */
export async function logExcelExport(
  userId: string,
  userName: string,
  rowCount: number,
  exportType: string
) {
  return logActivity({
    userId,
    userName,
    action: 'excel_export',
    description: `${exportType} için ${rowCount} kayıt Excel'e aktarıldı`,
    metadata: { rowCount, exportType },
  });
}

/**
 * Helper: Log user login
 */
export async function logUserLogin(
  userId: string,
  userName: string,
  ipAddress?: string,
  userAgent?: string
) {
  return logActivity({
    userId,
    userName,
    action: 'user_login',
    description: `Kullanıcı giriş yaptı`,
    ipAddress,
    userAgent,
  });
}

/**
 * Format activity for display
 */
export function formatActivityLog(log: ActivityLog): string {
  const date = new Date(log.timestamp).toLocaleString('tr-TR');
  return `[${date}] ${log.userName}: ${log.description}`;
}

/**
 * Get action label in Turkish
 */
export function getActionLabel(action: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    student_create: 'Öğrenci Oluşturma',
    student_update: 'Öğrenci Güncelleme',
    student_delete: 'Öğrenci Silme',
    payment_create: 'Ödeme Oluşturma',
    payment_update: 'Ödeme Güncelleme',
    payment_delete: 'Ödeme Silme',
    user_login: 'Kullanıcı Girişi',
    user_logout: 'Kullanıcı Çıkışı',
    registration_complete: 'Kayıt Tamamlama',
    whatsapp_sent: 'WhatsApp Gönderimi',
    email_sent: 'Email Gönderimi',
    excel_export: 'Excel Export',
    excel_import: 'Excel Import',
    settings_change: 'Ayar Değişikliği',
  };
  return labels[action] || action;
}





