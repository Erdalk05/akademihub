// Notification Service - Gerçek zamanlı bildirimler
import { Payment, PaymentStatusEnum } from '@/types/finance.types';

export interface PaymentNotification {
  id: string;
  studentId: string;
  studentName: string;
  type: 'overdue' | 'upcoming' | 'reminder' | 'success';
  title: string;
  message: string;
  amount: number;
  daysOverdue?: number;
  daysUntilDue?: number;
  timestamp: Date;
  read: boolean;
}

/**
 * Gecikmiş ödeme bildirimleri oluştur
 */
export const generateOverdueNotifications = (payments: Payment[]): PaymentNotification[] => {
  const overdue = payments.filter((p) => p.status === PaymentStatusEnum.OVERDUE && p.dueDate);

  return overdue.map((payment) => {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(payment.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: `notif-${payment.id}`,
      studentId: payment.studentId,
      studentName: payment.studentName || 'Bilinmeyen Öğrenci',
      type: 'overdue',
      title: '⚠️ Gecikmiş Ödeme!',
      message: `${payment.studentName} adlı öğrencinin ₺${payment.amount.toLocaleString('tr-TR')} tutarındaki ödemesi ${daysOverdue} gündür gecikmiş. Acil müdahale gereklidir.`,
      amount: payment.amount,
      daysOverdue,
      timestamp: new Date(),
      read: false,
    };
  });
};

/**
 * Yaklaşan ödeme bildirimlerini oluştur (3 gün öncesi)
 */
export const generateUpcomingNotifications = (payments: Payment[]): PaymentNotification[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = payments.filter((p) => {
    if (!p.dueDate) return false;
    const dueDate = new Date(p.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return p.status === PaymentStatusEnum.PENDING && daysUntil <= 3 && daysUntil > 0;
  });

  return upcoming.map((payment) => {
    const daysUntil = Math.floor(
      (new Date(payment.dueDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: `notif-${payment.id}`,
      studentId: payment.studentId,
      studentName: payment.studentName || 'Bilinmeyen Öğrenci',
      type: 'upcoming',
      title: '📅 Yaklaşan Ödeme',
      message: `${payment.studentName} adlı öğrencinin ₺${payment.amount.toLocaleString('tr-TR')} tutarındaki ödemesi ${daysUntil} gün içerisinde vadesi dolacak.`,
      amount: payment.amount,
      daysUntilDue: daysUntil,
      timestamp: new Date(),
      read: false,
    };
  });
};

/**
 * Başarılı ödeme bildirimleri oluştur
 */
export const generatePaymentSuccessNotifications = (payment: Payment): PaymentNotification => {
  return {
    id: `notif-${payment.id}`,
    studentId: payment.studentId,
    studentName: payment.studentName || 'Bilinmeyen Öğrenci',
    type: 'success',
    title: '✅ Ödeme Alındı',
    message: `${payment.studentName} adlı öğrenciden ₺${payment.amount.toLocaleString('tr-TR')} tutarında ödeme başarıyla alınmıştır.`,
    amount: payment.amount,
    timestamp: new Date(),
    read: false,
  };
};

/**
 * Risk tabanlı hatırlatma bildirimi oluştur
 */
export const generateRiskBasedReminder = (
  studentName: string,
  studentId: string,
  totalOverdue: number,
  count: number,
  riskScore: number
): PaymentNotification => {
  let urgency = 'Normal';
  let emoji = '📬';

  if (riskScore >= 80) {
    urgency = 'Acil';
    emoji = '🚨';
  } else if (riskScore >= 50) {
    urgency = 'Yüksek';
    emoji = '⚠️';
  }

  return {
    id: `reminder-${studentId}-${Date.now()}`,
    studentId,
    studentName,
    type: 'reminder',
    title: `${emoji} ${urgency} Hatırlatma`,
    message: `${studentName} için ${count} adet gecikmiş ödeme (Toplam: ₺${totalOverdue.toLocaleString('tr-TR')} - Risk: ${riskScore}/100). İletişim kurmaya başlayın.`,
    amount: totalOverdue,
    timestamp: new Date(),
    read: false,
  };
};

/**
 * Toplu bildirim oluştur (Dashboard için)
 */
export const generateBulkNotifications = (payments: Payment[]): PaymentNotification[] => {
  const overdueNotifs = generateOverdueNotifications(payments);
  const upcomingNotifs = generateUpcomingNotifications(payments);
  return [...overdueNotifs, ...upcomingNotifs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

/**
 * Notification Store'dan bildirim formatı
 */
export const formatNotificationForDisplay = (notif: PaymentNotification): string => {
  return `${notif.title} - ${notif.message}`;
};

/**
 * SMS mesajı oluştur
 */
export const generateSMSMessage = (
  studentName: string,
  amount: number,
  type: 'overdue' | 'upcoming'
): string => {
  if (type === 'overdue') {
    return `Merhaba ${studentName.split(' ')[0]}, okulunuza olan ₺${amount.toLocaleString('tr-TR')} tutarındaki ödemeniz gecikmiştir. Lütfen en kısa zamanda ödeme yapınız. AkademiHub`;
  }
  return `Merhaba ${studentName.split(' ')[0]}, okulunuza olan ₺${amount.toLocaleString('tr-TR')} tutarındaki ödemenizin vadesi 3 gün içerisinde dolacaktır. AkademiHub`;
};

/**
 * Email mesajı oluştur
 */
export const generateEmailMessage = (
  studentName: string,
  studentId: string,
  amount: number,
  type: 'overdue' | 'upcoming'
): { subject: string; body: string } => {
  if (type === 'overdue') {
    return {
      subject: `⚠️ Acil: Gecikmiş Ödeme Hatırlatması - ${studentName}`,
      body: `
Sayın Veli/Velilerimiz,

${studentName} adlı öğrencimizin okul ücretine ilişkin ₺${amount.toLocaleString('tr-TR')} tutarındaki ödemeniz gecikmiştir.

Lütfen en kısa zamanda ödeme yapınız. Bilgiler için sekreterliğimize başvurabilirsiniz.

İyi günler dileriz,
AkademiHub Mali Yönetim
      `,
    };
  }

  return {
    subject: `📅 Ödeme Hatırlatması - ${studentName}`,
    body: `
Sayın Veli/Velilerimiz,

${studentName} adlı öğrencimizin okul ücretine ilişkin ₺${amount.toLocaleString('tr-TR')} tutarındaki ödemenizin vadesi 3 gün içerisinde dolacaktır.

Zamanında ödeme yapmanız, muhasebe işlemlerimizin düzgün yürütülmesine yardımcı olacaktır.

İyi günler dileriz,
AkademiHub Mali Yönetim
    `,
  };
};
