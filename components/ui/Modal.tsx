'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ModalProps } from '@/types/dashboard';

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const [visible, setVisible] = useState(false);

  // ESC tuşu ile modal kapatma
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Modal boyutları
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black backdrop-blur-sm transition-opacity duration-300 ${visible ? 'bg-opacity-50' : 'bg-opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden transition-all duration-300 ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Modalı kapat"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
