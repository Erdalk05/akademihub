'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, NotificationContextType, NotificationType } from '@/lib/types/notification-types';
import toast from 'react-hot-toast';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Client-side check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch notifications from localStorage (or API in future)
  const fetchNotifications = useCallback(async () => {
    // SSR kontrolü
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('akademi_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchNotifications();
    }
  }, [isClient, fetchNotifications]);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    // SSR kontrolü
    if (typeof window === 'undefined') return;
    if (!isClient) return;
    
    if (notifications.length > 0) {
      try {
        localStorage.setItem('akademi_notifications', JSON.stringify(notifications));
      } catch (error) {
        console.error('Failed to save notifications:', error);
      }
    }
  }, [notifications, isClient]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast for important notifications
    if (['payment_reminder', 'installment_overdue', 'system_alert'].includes(notification.type)) {
      toast(notification.message, {
        icon: getNotificationIcon(notification.type),
        duration: 4000,
      });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, is_read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, is_read: true }))
    );
    toast.success('Tüm bildirimler okundu olarak işaretlendi');
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('akademi_notifications');
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      }
    }
    toast.success('Tüm bildirimler temizlendi');
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    payment_reminder: '💳',
    payment_received: '✅',
    student_registered: '🎓',
    installment_overdue: '⚠️',
    system_alert: '🔔',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
  };
  return icons[type] || '🔔';
}
