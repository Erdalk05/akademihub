'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastType } from '@/types/dashboard';

interface ToastProps {
  type: ToastType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  type,
  message,
  isVisible,
  onClose,
  duration = 3000
}) => {
  const [show, setShow] = useState(false);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          textColor: 'text-green-800',
          iconColor: 'text-green-500'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-800',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-500'
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-500'
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      if (duration > 0) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !show) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg transform transition-all duration-300 ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0`} />
          <p className={`ml-3 text-sm font-medium ${config.textColor} flex-1`}>
            {message}
          </p>
          <button
            onClick={onClose}
            className={`ml-4 ${config.textColor} hover:opacity-75 focus:outline-none`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    type: ToastType;
    message: string;
    isVisible: boolean;
  }>>([]);

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message, isVisible: true }]);

    if (duration !== 0) {
      setTimeout(() => hideToast(id), duration || 3000);
    }
    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isVisible: false } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>
  );

  return { showToast, hideToast, ToastContainer };
};

export default Toast;
