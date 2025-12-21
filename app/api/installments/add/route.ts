import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const BodySchema = z.object({
  student_id: z.string().uuid(),
  installment_no: z.number().int().positive(),
  amount: z.number().positive(),
  due_date: z.string(), // YYYY-MM-DD
  note: z.string().optional(),
});

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// POST /api/installments/add
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    
    const { student_id, installment_no, amount, due_date, note } = parsed.data;

    const accessToken = getAccessTokenFromRequest(req);
    if (!accessToken) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('finance_installments')
      .insert({
        student_id,
        installment_no,
        amount,
        due_date,
        is_paid: false,
        paid_amount: 0,
        note: note || 'Manuel eklendi',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

