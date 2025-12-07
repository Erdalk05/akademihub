import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// SERVER-SIDE SUPABASE CLIENTLERİ
// ============================================================

// Environment variables with safe defaults
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if Supabase is configured
const isSupabaseConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

// ------------------------------------------------------------
// 1) RLS UYUMLU CLIENT (Anon key + isteğe bağlı Authorization)
// ------------------------------------------------------------

export const createRlsServerClient = (accessToken?: string): SupabaseClient<any> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning mock client');
    return createMockClient();
  }
  
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : {},
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// ------------------------------------------------------------
// 2) SERVICE ROLE CLIENT (sadece seed / bakım scriptleri için)
// ------------------------------------------------------------

export const createServiceRoleClient = (): SupabaseClient<any> => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase service role not configured - returning mock client');
    return createMockClient();
  }
  
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Singleton instance (service role)
let serviceRoleInstance: SupabaseClient<any> | null = null;

export const getServiceRoleClient = (): SupabaseClient<any> => {
  if (!serviceRoleInstance) {
    serviceRoleInstance = createServiceRoleClient();
  }
  return serviceRoleInstance;
};

// Mock client for when Supabase is not configured
function createMockClient(): any {
  const mockResponse = { data: null, error: { message: 'Supabase not configured' } };
  const mockArrayResponse = { data: [], error: null };
  
  return {
    from: () => ({
      select: () => ({ 
        data: [], 
        error: null,
        eq: () => ({ data: [], error: null, single: () => ({ data: null, error: null }) }),
        single: () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null }),
        limit: () => ({ data: [], error: null }),
      }),
      insert: () => mockResponse,
      update: () => ({ eq: () => mockResponse }),
      delete: () => ({ eq: () => mockResponse }),
      upsert: () => mockResponse,
    }),
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
  };
}
