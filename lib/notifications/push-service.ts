// ============================================================================
// PWA PUSH NOTIFICATION SERVICE
// Web Push bildirimleri için client-side servis
// ============================================================================

// VAPID public key - Gerçek uygulamada env'den gelir
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// ============================================================================
// TİPLER
// ============================================================================

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: { action: string; title: string; icon?: string }[];
}

// ============================================================================
// PERMISSION & SUBSCRIPTION
// ============================================================================

/**
 * Push notification desteği kontrol et
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Mevcut izin durumunu kontrol et
 */
export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Push notification izni iste
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications desteklenmiyor');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Service Worker'ı kaydet ve subscription al
 */
export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications desteklenmiyor');
    return null;
  }

  try {
    // Service Worker kaydı
    const registration = await navigator.serviceWorker.ready;

    // Mevcut subscription kontrol et
    let subscription = await registration.pushManager.getSubscription();

    // Yoksa yeni oluştur
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Subscription verisini düzenle
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    };

    return subscriptionData;
  } catch (error) {
    console.error('Push subscription error:', error);
    return null;
  }
}

/**
 * Push subscription'ı iptal et
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return false;
  }
}

// ============================================================================
// LOCAL NOTIFICATION (Fallback)
// ============================================================================

/**
 * Local notification göster (Push olmadan)
 */
export async function showLocalNotification(payload: NotificationPayload): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (!('Notification' in window)) {
    console.warn('Notifications desteklenmiyor');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification izni yok');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      tag: payload.tag,
      data: payload.data,
      actions: payload.actions,
      vibrate: [100, 50, 100],
      requireInteraction: false,
    });

    return true;
  } catch (error) {
    // Fallback: Normal Notification API
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        tag: payload.tag,
        data: payload.data,
      });
      return true;
    } catch (fallbackError) {
      console.error('Notification error:', fallbackError);
      return false;
    }
  }
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export const NotificationTemplates = {
  examResult: (examName: string, net: number, rank: number) => ({
    title: '📊 Sınav Sonucu Açıklandı',
    body: `${examName}: ${net} net, ${rank}. sıra`,
    icon: '/icons/exam-icon.png',
    tag: 'exam-result',
    data: { type: 'exam_result', examName },
  }),

  riskAlert: (studentName: string) => ({
    title: '⚠️ Risk Uyarısı',
    body: `${studentName} öğrencisinde performans düşüşü tespit edildi`,
    icon: '/icons/warning-icon.png',
    tag: 'risk-alert',
    data: { type: 'risk_alert', studentName },
  }),

  paymentReminder: (amount: number, dueDate: string) => ({
    title: '💳 Ödeme Hatırlatması',
    body: `${amount.toLocaleString('tr-TR')} TL taksit ödemesi - Son: ${dueDate}`,
    icon: '/icons/payment-icon.png',
    tag: 'payment-reminder',
    data: { type: 'payment_reminder', amount, dueDate },
  }),

  newBadge: (badgeName: string) => ({
    title: '🏆 Yeni Rozet Kazandın!',
    body: `Tebrikler! "${badgeName}" rozetini kazandın`,
    icon: '/icons/badge-icon.png',
    tag: 'new-badge',
    data: { type: 'badge', badgeName },
  }),

  levelUp: (level: number) => ({
    title: '⬆️ Seviye Atladın!',
    body: `Seviye ${level} oldun! Devam et 💪`,
    icon: '/icons/level-icon.png',
    tag: 'level-up',
    data: { type: 'level_up', level },
  }),

  streakReminder: (days: number) => ({
    title: '🔥 Streak Hatırlatması',
    body: `${days} günlük streak'ini kaybetme! Bugün giriş yap`,
    icon: '/icons/streak-icon.png',
    tag: 'streak-reminder',
    data: { type: 'streak', days },
  }),
};

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

