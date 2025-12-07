'use client';

import { create } from 'zustand';
import { Toast, ToastType } from '@/types';

interface UIStore {
  // Toasts
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modals
  modals: Map<string, boolean>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  toggleModal: (id: string) => void;

  // Global loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Global error
  error: string | null;
  setError: (error: string | null) => void;

  // Sidebar state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Toasts
  toasts: [],
  addToast: (type: ToastType, message: string, duration = 3000) => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, isVisible: true }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),

  // Modals
  modals: new Map(),
  openModal: (id: string) => {
    set((state) => ({
      modals: new Map(state.modals).set(id, true),
    }));
  },

  closeModal: (id: string) => {
    set((state) => ({
      modals: new Map(state.modals).set(id, false),
    }));
  },

  toggleModal: (id: string) => {
    set((state) => {
      const newModals = new Map(state.modals);
      newModals.set(id, !newModals.get(id));
      return { modals: newModals };
    });
  },

  // Global loading
  isLoading: false,
  setLoading: (isLoading: boolean) => set({ isLoading }),

  // Global error
  error: null,
  setError: (error: string | null) => set({ error }),

  // Sidebar
  isSidebarOpen: true,
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  // Theme
  isDarkMode: false,
  toggleTheme: () => {
    set((state) => ({ isDarkMode: !state.isDarkMode }));
  },
}));
