import { createClient } from '@supabase/supabase-js';

// İstemci: yalnızca public (anon) anahtar ile hafif SELECT için
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false },
  }
);


