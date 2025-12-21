/**
 * Supabase Server Client - Singleton Pattern
 * ============================================
 * Production-grade implementation for Vercel serverless + Supabase Transaction Pooler
 * 
 * Key features:
 * - Single client instance (no per-request creation)
 * - Hot-reload safe in development
 * - Transaction Pooler compatible (no prepared statements)
 * - Node.js runtime only (not Edge)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
const hasServiceRole = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// =============================================================================
// GLOBAL SINGLETON STORAGE (survives hot-reload in development)
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __supabaseServiceRoleClient: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __supabaseAnonClient: SupabaseClient | undefined;
}

// =============================================================================
// CLIENT OPTIONS - Transaction Pooler Compatible
// =============================================================================

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public' as const,
  },
  global: {
    headers: {
      'x-connection-type': 'pooler',
    },
  },
};

// =============================================================================
// SERVICE ROLE CLIENT (SINGLETON)
// For server-side operations bypassing RLS
// =============================================================================

function createServiceRoleClientInternal(): SupabaseClient {
  if (!hasServiceRole) {
    console.warn('[Supabase] Service role key not configured - returning mock client');
    return createMockClient();
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, clientOptions);
}

/**
 * Get the singleton Service Role client
 * Use this for all server-side database operations
 */
export function getServiceRoleClient(): SupabaseClient {
  if (process.env.NODE_ENV === 'production') {
    // Production: create once at module load
    if (!global.__supabaseServiceRoleClient) {
      global.__supabaseServiceRoleClient = createServiceRoleClientInternal();
    }
    return global.__supabaseServiceRoleClient;
  } else {
    // Development: cache on global to survive hot-reload
    if (!global.__supabaseServiceRoleClient) {
      global.__supabaseServiceRoleClient = createServiceRoleClientInternal();
    }
    return global.__supabaseServiceRoleClient;
  }
}

// =============================================================================
// ANON CLIENT (SINGLETON) - For RLS-enabled queries
// =============================================================================

function createAnonClientInternal(): SupabaseClient {
  if (!isConfigured) {
    console.warn('[Supabase] Not configured - returning mock client');
    return createMockClient();
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);
}

/**
 * Get the singleton Anon client
 * Use for RLS-enabled queries where user context matters
 */
export function getAnonClient(): SupabaseClient {
  if (process.env.NODE_ENV === 'production') {
    if (!global.__supabaseAnonClient) {
      global.__supabaseAnonClient = createAnonClientInternal();
    }
    return global.__supabaseAnonClient;
  } else {
    if (!global.__supabaseAnonClient) {
      global.__supabaseAnonClient = createAnonClientInternal();
    }
    return global.__supabaseAnonClient;
  }
}

// =============================================================================
// DEPRECATED - Keep for backward compatibility but route to singletons
// =============================================================================

/**
 * @deprecated Use getServiceRoleClient() instead
 * This function now returns the singleton client
 */
export function createServiceRoleClient(): SupabaseClient {
  return getServiceRoleClient();
}

/**
 * @deprecated Use getAnonClient() instead
 * Creates RLS-compatible client. Now returns singleton.
 * Note: accessToken parameter is ignored - use proper auth middleware instead
 */
export function createRlsServerClient(_accessToken?: string): SupabaseClient {
  // For backward compatibility, return anon client
  // In production, you should use proper Supabase Auth middleware
  return getAnonClient();
}

// =============================================================================
// MOCK CLIENT (for when Supabase is not configured)
// =============================================================================

function createMockClient(): SupabaseClient {
  const mockResponse = { data: null, error: { message: 'Supabase not configured' } };
  const mockArrayResponse = { data: [], error: null };

  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    upsert: () => mockQueryBuilder,
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
// UTILITY EXPORTS
// =============================================================================

export { isConfigured, hasServiceRole };
