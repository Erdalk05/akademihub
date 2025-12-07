'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  category: string;
  action: () => void;
}

// Varsayılan kısayollar
const defaultShortcuts: Omit<KeyboardShortcut, 'action'>[] = [
  // Navigasyon
  { key: 'd', ctrlKey: true, description: 'Dashboard\'a git', category: 'Navigasyon' },
  { key: 's', ctrlKey: true, shiftKey: true, description: 'Öğrenciler sayfasına git', category: 'Navigasyon' },
  { key: 'f', ctrlKey: true, shiftKey: true, description: 'Finans sayfasına git', category: 'Navigasyon' },
  { key: 'r', ctrlKey: true, shiftKey: true, description: 'Raporlar sayfasına git', category: 'Navigasyon' },
  { key: ',', ctrlKey: true, description: 'Ayarlar sayfasına git', category: 'Navigasyon' },
  
  // Hızlı İşlemler
  { key: 'k', ctrlKey: true, description: 'Hızlı arama aç', category: 'Hızlı İşlemler' },
  { key: 'n', ctrlKey: true, description: 'Yeni öğrenci kaydı', category: 'Hızlı İşlemler' },
  { key: 'p', ctrlKey: true, shiftKey: true, description: 'Ödeme al', category: 'Hızlı İşlemler' },
  
  // Genel
  { key: 'Escape', description: 'Modal/Popup kapat', category: 'Genel' },
  { key: '?', ctrlKey: true, description: 'Kısayolları göster', category: 'Genel' },
];

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  // Kısayol aksiyonlarını tanımla
  const shortcuts: KeyboardShortcut[] = [
    // Navigasyon
    { 
      key: 'd', ctrlKey: true, 
      description: 'Dashboard\'a git', 
      category: 'Navigasyon',
      action: () => router.push('/dashboard')
    },
    { 
      key: 's', ctrlKey: true, shiftKey: true, 
      description: 'Öğrenciler sayfasına git', 
      category: 'Navigasyon',
      action: () => router.push('/students')
    },
    { 
      key: 'f', ctrlKey: true, shiftKey: true, 
      description: 'Finans sayfasına git', 
      category: 'Navigasyon',
      action: () => router.push('/finance')
    },
    { 
      key: 'r', ctrlKey: true, shiftKey: true, 
      description: 'Raporlar sayfasına git', 
      category: 'Navigasyon',
      action: () => router.push('/finance/reports')
    },
    { 
      key: ',', ctrlKey: true, 
      description: 'Ayarlar sayfasına git', 
      category: 'Navigasyon',
      action: () => router.push('/settings')
    },
    
    // Hızlı İşlemler
    { 
      key: 'k', ctrlKey: true, 
      description: 'Hızlı arama aç', 
      category: 'Hızlı İşlemler',
      action: () => {
        const searchBtn = document.querySelector('[data-search-trigger]') as HTMLButtonElement;
        if (searchBtn) searchBtn.click();
        else toast('Arama butonu bulunamadı', { icon: '🔍' });
      }
    },
    { 
      key: 'n', ctrlKey: true, 
      description: 'Yeni öğrenci kaydı', 
      category: 'Hızlı İşlemler',
      action: () => router.push('/students/new')
    },
    { 
      key: 'p', ctrlKey: true, shiftKey: true, 
      description: 'Ödeme al', 
      category: 'Hızlı İşlemler',
      action: () => router.push('/finance/collection')
    },
    
    // Genel
    { 
      key: '?', ctrlKey: true, 
      description: 'Kısayolları göster', 
      category: 'Genel',
      action: () => setShowShortcutsModal(true)
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return;
    
    // Input/textarea içindeyken bazı kısayolları devre dışı bırak
    const target = event.target as HTMLElement;
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || 
                          target.isContentEditable;
    
    // Escape her zaman çalışsın
    if (event.key === 'Escape') {
      const modals = document.querySelectorAll('[data-modal-close]');
      modals.forEach((btn) => (btn as HTMLButtonElement).click());
      setShowShortcutsModal(false);
      return;
    }
    
    // Input içindeyken sadece Ctrl+K çalışsın
    if (isInputFocused && !(event.ctrlKey && event.key === 'k')) {
      return;
    }
    
    // Kısayolları kontrol et
    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
      const altMatch = !!shortcut.altKey === event.altKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      
      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [isEnabled, router, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
    showShortcutsModal,
    setShowShortcutsModal,
    isEnabled,
    setIsEnabled,
  };
}

// Kısayol tuşunu formatlama
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'action'>): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('⌘/Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  
  let key = shortcut.key;
  if (key === ' ') key = 'Space';
  if (key === 'Escape') key = 'Esc';
  if (key === ',') key = ',';
  
  parts.push(key.toUpperCase());
  
  return parts.join(' + ');
}

