import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Exam Intelligence API'leri için RLS-enabled Supabase client.
 * - Cookie tabanlı session kullanır (admin UI çağrıları için ideal)
 * - Service role kullanmaz (tenant izolasyonu RLS ile sağlanır)
 */
export function getSupabaseRls() {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(c) {
        c.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}


