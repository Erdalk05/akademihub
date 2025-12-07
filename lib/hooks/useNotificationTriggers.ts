import { useEffect } from 'react';
import { useNotifications } from '@/lib/contexts/NotificationContext';

/**
 * Hook to automatically trigger notifications based on business events
 * Usage: Call this in your main layout or dashboard page
 */
export function useNotificationTriggers() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Example: Check for overdue installments on mount
    checkOverdueInstallments();

    // Example: Set up interval to check every hour
    const interval = setInterval(() => {
      checkOverdueInstallments();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, []);

  async function checkOverdueInstallments() {
    try {
      const response = await fetch('/api/installments?status=overdue');
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        addNotification({
          type: 'installment_overdue',
          title: 'Gecikmiş Taksitler',
          message: `${data.data.length} adet gecikmiş taksit bulunmaktadır.`,
          action_url: '/students?filter=overdue',
        });
      }
    } catch (error) {
      console.error('Failed to check overdue installments:', error);
    }
  }

  // Add more trigger functions as needed
  // Example: checkPaymentReminders, checkNewRegistrations, etc.
}

/**
 * Helper function to send notification when a payment is received
 */
export function notifyPaymentReceived(studentName: string, amount: number) {
  // This would be called from your payment processing code
  // For now, it's a placeholder
}

/**
 * Helper function to send notification when a student is registered
 */
export function notifyStudentRegistered(studentName: string) {
  // This would be called from your registration code
}





