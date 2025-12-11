'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  settings?: {
    currency: string;
    fiscalYearStart: string;
    defaultInstallmentCount: number;
    defaultDiscounts?: {
      sibling: number;
      earlyBird: number;
      staff: number;
    };
  };
  is_active: boolean;
  is_demo?: boolean;
  created_at?: string;
}

interface OrganizationStore {
  // State
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setCurrentOrganization: (org: Organization | null) => void;
  fetchOrganizations: () => Promise<void>;
  switchOrganization: (orgId: string) => void;
  clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set, get) => ({
      organizations: [],
      currentOrganization: null,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      setOrganizations: (orgs) => set({ organizations: orgs }),

      setCurrentOrganization: (org) => set({ currentOrganization: org }),

      fetchOrganizations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/organizations');
          const data = await response.json();

          if (data.success) {
            set({ organizations: data.data || [], isLoading: false });
            
            // Eğer current organization yoksa ve veri varsa, ilkini seç
            const current = get().currentOrganization;
            if (!current && data.data?.length > 0) {
              set({ currentOrganization: data.data[0] });
            }
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      switchOrganization: (orgId) => {
        const org = get().organizations.find((o) => o.id === orgId);
        if (org) {
          set({ currentOrganization: org });
        }
      },

      clearOrganization: () => {
        set({ currentOrganization: null, organizations: [] });
      },
    }),
    {
      name: 'organization-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

