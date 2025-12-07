import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// SERVER-SIDE SUPABASE CLIENTLERİ
// ============================================================
// NOT:
// - Service role key **sadece** yönetim/seed senaryolarında kullanılmalıdır.
// - Uygulama API'leri varsayılan olarak RLS + anon key ile çalışmalıdır.
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ------------------------------------------------------------
// 1) RLS UYUMLU CLIENT (Anon key + isteğe bağlı Authorization)
// ------------------------------------------------------------

export const createRlsServerClient = (accessToken?: string): SupabaseClient<any> =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

// ------------------------------------------------------------
// 2) SERVICE ROLE CLIENT (sadece seed / bakım scriptleri için)
// ------------------------------------------------------------

export const createServiceRoleClient = (): SupabaseClient<any> =>
  createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

// Singleton instance (service role)
let serviceRoleInstance: SupabaseClient<any> | null = null;

export const getServiceRoleClient = (): SupabaseClient<any> => {
  if (!serviceRoleInstance) {
    serviceRoleInstance = createServiceRoleClient();
  }
  return serviceRoleInstance;
};









