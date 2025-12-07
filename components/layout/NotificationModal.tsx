'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Clock, Trash2 } from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onDelete,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-orange-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'info':
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes}m önce`;
    if (hours < 24) return `${hours}s önce`;
    if (days < 7) return `${days}g önce`;
    return date.toLocaleDateString('tr-TR');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-0 right-0 w-full max-w-md h-screen bg-white dark:bg-slate-800 shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Bildirimler
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {unreadCount} yeni bildirim
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-4 border-b dark:border-slate-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
            }`}
          >
            Tüm Bildirimler
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
            }`}
          >
            Okunmamış
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-slate-400">
              <p>Bildirim yok</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition ${
                    notification.read
                      ? 'bg-gray-50 dark:bg-slate-700/30 border-gray-200 dark:border-slate-600'
                      : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-slate-500">
                        <Clock size={12} />
                        {formatTime(notification.timestamp)}
                      </div>

                      {/* Action Button */}
                      {notification.action && (
                        <button
                          onClick={notification.action.onClick}
                          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {notification.action.label}
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => onMarkAsRead(notification.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition"
                          title="Okundu olarak işaretle"
                        >
                          <CheckCircle size={16} className="text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(notification.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition text-red-500"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationModal;
