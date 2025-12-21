import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const BodySchema = z.object({
  student_id: z.string().uuid(),
  agreement_id: z.string().uuid().optional().nullable(),
  count: z.number().int().positive(),
  amount: z.number().positive(),
  first_due: z.string(), // YYYY-MM-DD
});

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// POST /api/installments/create
// Body: { student_id, agreement_id?, count, amount, first_due }
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { student_id, agreement_id, count, amount, first_due } = parsed.data;
    const accessToken = getAccessTokenFromRequest(req);
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.rpc('generate_installments', {
      p_student_id: student_id,
      p_agreement_id: agreement_id || null,
      p_count: count,
      p_amount: amount,
      p_first_due: first_due,
    });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}






