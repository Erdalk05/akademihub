'use client';

import React, { useState, useEffect } from 'react';
import { X, Activity, Filter, Calendar, User, FileText } from 'lucide-react';
import { getActivityLogs, getActionLabel, type ActivityLog, type ActivityType } from '@/lib/utils/activityLogger';
import toast from 'react-hot-toast';

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: string;
  entityId?: string;
}

export default function ActivityLogDrawer({
  isOpen,
  onClose,
  entityType,
  entityId,
}: ActivityLogDrawerProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<ActivityType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, filterAction, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result = await getActivityLogs({
        entityType,
        entityId,
        action: filterAction || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });

      if (result.success && result.data) {
        setLogs(result.data);
      } else {
        toast.error(`Aktivite logları yüklenemedi: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getActionColor = (action: ActivityType): string => {
    const colors: Record<string, string> = {
      student_create: 'bg-emerald-100 text-emerald-800',
      student_update: 'bg-blue-100 text-blue-800',
      student_delete: 'bg-red-100 text-red-800',
      payment_create: 'bg-green-100 text-green-800',
      user_login: 'bg-purple-100 text-purple-800',
      whatsapp_sent: 'bg-teal-100 text-teal-800',
      email_sent: 'bg-indigo-100 text-indigo-800',
      excel_export: 'bg-orange-100 text-orange-800',
      excel_import: 'bg-cyan-100 text-cyan-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-100 p-2">
              <Activity className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Aktivite Logları</h2>
              <p className="text-sm text-gray-500">Tüm işlemler ve değişiklikler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-gray-200 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                İşlem Tipi
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as ActivityType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tümü</option>
                <option value="student_create">Öğrenci Oluşturma</option>
                <option value="payment_create">Ödeme Oluşturma</option>
                <option value="whatsapp_sent">WhatsApp Gönderimi</option>
                <option value="excel_export">Excel Export</option>
                <option value="user_login">Kullanıcı Girişi</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText size={48} className="mb-3 text-gray-300" />
              <p>Henüz aktivite kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(log.action)}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                        {log.entityType && (
                          <span className="text-xs text-gray-500">
                            ({log.entityType})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{log.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {log.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(log.timestamp).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-700">
                            Detaylar
                          </summary>
                          <pre className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-700">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





