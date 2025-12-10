'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'text';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

/**
 * WhatsApp URL bazlı buton komponenti
 * Tüm birimlerde kullanılabilir
 */
export default function WhatsAppButton({
  phone,
  message = '',
  className = '',
  variant = 'button',
  size = 'md',
  children,
}: WhatsAppButtonProps) {
  
  const handleClick = () => {
    if (!phone) return;
    
    // Telefon numarasını temizle
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Türkiye için: başında 0 varsa kaldır, 90 ekle
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '90' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('90') && cleanPhone.length === 10) {
      cleanPhone = '90' + cleanPhone;
    }
    
    // WhatsApp URL'i oluştur
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ''}`;
    
    // Yeni sekmede aç
    window.open(url, '_blank');
  };

  // Telefon yoksa disabled göster
  if (!phone) {
    return (
      <button
        disabled
        className={`opacity-50 cursor-not-allowed ${className}`}
        title="Telefon numarası bulunamadı"
      >
        {variant === 'icon' ? (
          <MessageCircle size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
        ) : (
          children || 'WhatsApp'
        )}
      </button>
    );
  }

  // Boyut stilleri
  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2.5',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  // Sadece icon
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all shadow-sm hover:shadow-md ${className}`}
        title={`WhatsApp: ${phone}`}
      >
        <MessageCircle size={iconSizes[size]} />
      </button>
    );
  }

  // Sadece text link
  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        className={`text-green-600 hover:text-green-700 hover:underline flex items-center gap-1 ${sizeStyles[size]} ${className}`}
      >
        <MessageCircle size={iconSizes[size]} />
        {children || 'WhatsApp'}
      </button>
    );
  }

  // Default: Tam buton
  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md ${sizeStyles[size]} ${className}`}
    >
      <MessageCircle size={iconSizes[size]} />
      {children || 'WhatsApp'}
    </button>
  );
}

/**
 * WhatsApp ile belge gönderme (URL + mesaj)
 * Örnek: Makbuz, sözleşme vs.
 */
export function sendWhatsAppDocument(
  phone: string,
  documentType: 'receipt' | 'contract' | 'installment' | 'general',
  details: {
    studentName?: string;
    amount?: number;
    date?: string;
    description?: string;
  }
) {
  if (!phone) return;

  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '90' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('90') && cleanPhone.length === 10) {
    cleanPhone = '90' + cleanPhone;
  }

  let message = '';
  
  switch (documentType) {
    case 'receipt':
      message = `🧾 *ÖDEME MAKBUZU*\n\n` +
        `📌 Öğrenci: ${details.studentName || '-'}\n` +
        `💰 Tutar: ₺${details.amount?.toLocaleString('tr-TR') || '0'}\n` +
        `📅 Tarih: ${details.date || new Date().toLocaleDateString('tr-TR')}\n\n` +
        `Ödemeniz için teşekkür ederiz. 🙏\n\n` +
        `_AkademiHub Eğitim Yönetim Sistemi_`;
      break;
      
    case 'contract':
      message = `📄 *KAYIT SÖZLEŞMESİ*\n\n` +
        `📌 Öğrenci: ${details.studentName || '-'}\n` +
        `📅 Tarih: ${details.date || new Date().toLocaleDateString('tr-TR')}\n\n` +
        `Kayıt işleminiz tamamlanmıştır. ✅\n\n` +
        `_AkademiHub Eğitim Yönetim Sistemi_`;
      break;
      
    case 'installment':
      message = `📋 *TAKSİT BİLGİLENDİRME*\n\n` +
        `📌 Öğrenci: ${details.studentName || '-'}\n` +
        `💰 Tutar: ₺${details.amount?.toLocaleString('tr-TR') || '0'}\n` +
        `📅 Vade: ${details.date || '-'}\n\n` +
        `${details.description || ''}\n\n` +
        `_AkademiHub Eğitim Yönetim Sistemi_`;
      break;
      
    default:
      message = details.description || 'AkademiHub Eğitim Yönetim Sistemi';
  }

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(url, '_blank');
}

