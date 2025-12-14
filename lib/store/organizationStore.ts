'use client';

import { create } from 'zustand';

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
  isAllOrganizations: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setCurrentOrganization: (org: Organization | null) => void;
  fetchOrganizations: () => Promise<void>;
  switchOrganization: (orgId: string) => void;
  selectAllOrganizations: () => void;
  clearOrganization: () => void;
  hydrate: () => void;
}

// Persist olmadan basit store - hydration sorunu yok
export const useOrganizationStore = create<OrganizationStore>()((set, get) => ({
  organizations: [],
  currentOrganization: null,
  isAllOrganizations: false,
  isLoading: false,
  error: null,
  _hasHydrated: false,

  setHasHydrated: (state: boolean) => {
    set({ _hasHydrated: state });
  },

  // Manuel hydration - client-side only
  hydrate: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('organization-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state) {
          set({
            currentOrganization: parsed.state.currentOrganization || null,
            isAllOrganizations: parsed.state.isAllOrganizations === true,
            _hasHydrated: true,
          });
          return;
        }
      }
    } catch (e) {
      console.error('Hydration error:', e);
    }
    set({ _hasHydrated: true });
  },

  setOrganizations: (orgs) => set({ organizations: orgs }),

  setCurrentOrganization: (org) => {
    set({ currentOrganization: org, isAllOrganizations: false });
    // localStorage'a kaydet
    if (typeof window !== 'undefined') {
      const current = get();
      localStorage.setItem('organization-storage', JSON.stringify({
        state: {
          currentOrganization: org,
          isAllOrganizations: false,
        }
      }));
    }
  },

  fetchOrganizations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();

      if (data.success) {
        set({ organizations: data.data || [], isLoading: false });
        
        const current = get().currentOrganization;
        const isAll = get().isAllOrganizations;
        if (!current && !isAll && data.data?.length > 0) {
          get().setCurrentOrganization(data.data[0]);
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
      get().setCurrentOrganization(org);
    }
  },

  selectAllOrganizations: () => {
    set({ currentOrganization: null, isAllOrganizations: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('organization-storage', JSON.stringify({
        state: {
          currentOrganization: null,
          isAllOrganizations: true,
        }
      }));
    }
  },

  clearOrganization: () => {
    set({ currentOrganization: null, organizations: [], isAllOrganizations: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('organization-storage');
    }
  },
}));




