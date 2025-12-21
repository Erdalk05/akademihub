/**
 * Supabase Browser Client - Singleton Pattern
 * ============================================
 * Browser-side client for Next.js App Router
 * 
 * Key features:
 * - Single client instance per browser session
 * - Lazy initialization
 * - Type-safe
 */

'use client';

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// =============================================================================
// BROWSER SINGLETON STORAGE
// =============================================================================

let browserClient: SupabaseClient | null = null;

// =============================================================================
// MOCK CLIENT (for unconfigured state)
// =============================================================================

function createMockBrowserClient(): SupabaseClient {
  const mockResponse = { data: null, error: { message: 'Supabase not configured' } };
  const mockArrayResponse = { data: [], error: null };

  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    neq: () => mockQueryBuilder,
    in: () => mockQueryBuilder,
    gte: () => mockQueryBuilder,
    lte: () => mockQueryBuilder,
    or: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve(mockArrayResponse),
  };

  return {
    from: () => mockQueryBuilder,
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve(mockResponse),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve(mockResponse),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => Promise.resolve({ error: null }),
  } as unknown as SupabaseClient;
}

// =============================================================================
// BROWSER CLIENT (SINGLETON)
// =============================================================================

/**
 * Get or create the browser Supabase client
 * This is the ONLY way to get the browser client - ensures singleton
 */
export function getBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: return mock to prevent errors during SSR
    console.warn('[Supabase] getBrowserClient called on server - returning mock');
    return createMockBrowserClient();
  }

  if (!browserClient) {
    if (!isConfigured) {
      console.warn('[Supabase] Browser client not configured - using mock');
      browserClient = createMockBrowserClient();
    } else {
      browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  return browserClient;
}

/**
 * @deprecated Use getBrowserClient() instead
 * Kept for backward compatibility
 */
export function createClient(): SupabaseClient {
  return getBrowserClient();
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export { isConfigured };
