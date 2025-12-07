'use client';

import React from 'react';
import { X, CreditCard, AlertTriangle, CheckCircle, Info, Bell } from 'lucide-react';
import { useNotifications } from '@/lib/contexts/NotificationContext';
import { Notification, NotificationType } from '@/lib/types/notification-types';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();
  const router = useRouter();

  const handleClick = () => {
    markAsRead(notification.id);
    
    // Navigate if action_url exists
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  const getIcon = () => {
    const iconMap: Record<NotificationType, React.ReactNode> = {
      payment_reminder: <CreditCard className="w-5 h-5 text-orange-500" />,
      payment_received: <CheckCircle className="w-5 h-5 text-green-500" />,
      student_registered: <CheckCircle className="w-5 h-5 text-blue-500" />,
      installment_overdue: <AlertTriangle className="w-5 h-5 text-red-500" />,
      system_alert: <Bell className="w-5 h-5 text-purple-500" />,
      success: <CheckCircle className="w-5 h-5 text-green-500" />,
      warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      info: <Info className="w-5 h-5 text-blue-500" />,
    };
    return iconMap[notification.type] || <Bell className="w-5 h-5 text-gray-500" />;
  };

  const getTimeAgo = () => {
    const now = new Date();
    const created = new Date(notification.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return created.toLocaleDateString('tr-TR');
  };

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 hover:bg-gray-50 transition cursor-pointer relative ${
        !notification.is_read ? 'bg-indigo-50/30' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold text-gray-900 ${!notification.is_read ? 'font-bold' : ''}`}>
              {notification.title}
            </h4>
            <button
              onClick={handleDelete}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition"
              title="Sil"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500">{getTimeAgo()}</span>
            {!notification.is_read && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                Yeni
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
      )}
    </div>
  );
}





