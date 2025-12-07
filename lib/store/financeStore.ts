'use client';

import { create } from 'zustand';
import { Payment, Installment, FinancialDashboard } from '@/types';

interface FinanceStore {
  payments: Payment[];
  installments: Installment[];
  dashboard: FinancialDashboard | null;
  isLoading: boolean;
  error: string | null;

  // Payment actions
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;

  // Installment actions
  setInstallments: (installments: Installment[]) => void;
  addInstallment: (installment: Installment) => void;
  updateInstallment: (installment: Installment) => void;
  deleteInstallment: (id: string) => void;

  // Dashboard
  setDashboard: (dashboard: FinancialDashboard | null) => void;

  // Loading and error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Fetch methods
  fetchPayments: (studentId?: string) => Promise<void>;
  fetchInstallments: (studentId?: string) => Promise<void>;
  fetchDashboard: () => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  payments: [],
  installments: [],
  dashboard: null,
  isLoading: false,
  error: null,

  setPayments: (payments: Payment[]) => set({ payments }),
  addPayment: (payment: Payment) =>
    set((state) => ({
      payments: [...state.payments, payment],
    })),

  updatePayment: (payment: Payment) =>
    set((state) => ({
      payments: state.payments.map((p) => (p.id === payment.id ? payment : p)),
    })),

  deletePayment: (id: string) =>
    set((state) => ({
      payments: state.payments.filter((p) => p.id !== id),
    })),

  setInstallments: (installments: Installment[]) => set({ installments }),
  addInstallment: (installment: Installment) =>
    set((state) => ({
      installments: [...state.installments, installment],
    })),

  updateInstallment: (installment: Installment) =>
    set((state) => ({
      installments: state.installments.map((i) => (i.id === installment.id ? installment : i)),
    })),

  deleteInstallment: (id: string) =>
    set((state) => ({
      installments: state.installments.filter((i) => i.id !== id),
    })),

  setDashboard: (dashboard: FinancialDashboard | null) => set({ dashboard }),

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  fetchPayments: async (studentId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = studentId ? `/api/installments?studentId=${studentId}` : '/api/installments';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Ödemeler yüklenemedi');

      const data = await response.json();
      set({ payments: data.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchInstallments: async (studentId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = studentId ? `/api/installments?studentId=${studentId}` : '/api/installments';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Taksitler yüklenemedi');

      const data = await response.json();
      set({ installments: data.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/finance/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Dashboard yüklenemedi');

      const data = await response.json();
      set({ dashboard: data.data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      set({ error: errorMessage, isLoading: false });
    }
  },
}));
