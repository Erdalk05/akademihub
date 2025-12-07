'use client';

import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { KeyboardShortcut, formatShortcut } from '@/lib/hooks/useKeyboardShortcuts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Omit<KeyboardShortcut, 'action'>[];
}

export default function KeyboardShortcutsModal({ isOpen, onClose, shortcuts }: Props) {
  if (!isOpen) return null;

  // Kategorilere göre grupla
  const categories = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Klavye Kısayolları
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Hızlı erişim için klavye kısayollarını kullanın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-modal-close
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {Object.entries(categories).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {formatShortcut(shortcut).split(' + ').map((key, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-slate-400 text-xs">+</span>}
                            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono font-medium text-slate-600 dark:text-slate-300 min-w-[28px] text-center">
                              {key === '⌘/Ctrl' ? (
                                <span className="flex items-center justify-center gap-0.5">
                                  <Command size={10} />
                                </span>
                              ) : key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs">Ctrl</kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs">?</kbd>
            {' ile bu pencereyi her zaman açabilirsiniz'}
          </p>
        </div>
      </div>
    </div>
  );
}

