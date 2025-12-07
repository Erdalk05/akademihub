'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/lib/contexts/NotificationContext';
import NotificationItem from './NotificationItem';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        aria-label="Bildirimler"
      >
        <Bell className="w-6 h-6" />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Bildirimler</h3>
              <p className="text-xs text-white/80">
                {unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tüm bildirimler okundu'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b flex gap-2">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
              >
                <Check className="w-3 h-3" />
                Tümünü Okundu İşaretle
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
              >
                <Trash2 className="w-3 h-3" />
                Tümünü Temizle
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">Henüz bildirim yok</p>
                <p className="text-xs mt-1">Yeni bildirimler burada görünecek</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Bildirimleri Kapat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}





