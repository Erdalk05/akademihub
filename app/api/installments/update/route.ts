import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const BodySchema = z.object({
  installment_id: z.string().uuid(),
  paid_amount: z.number().min(0),
  payment_date: z.string().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  reset: z.boolean().optional(), // Optional flag to force reset
});

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// PATCH /api/installments/update
// ⚠️ SADECE ADMIN ROLÜ GÜNCELLEYEBİLİR!
export async function PATCH(req: NextRequest) {
  try {
    // ========= ADMIN/ACCOUNTING YETKİ KONTROLÜ =========
    const userRole = req.headers.get('X-User-Role') || '';
    const allowedRoles = ['admin', 'super_admin', 'accounting', 'accountant'];
    
    if (!allowedRoles.includes(userRole.toLowerCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bu işlem için yetkiniz yok. Sadece admin ve muhasebe kullanıcıları ödeme bilgilerini güncelleyebilir.' 
        },
        { status: 403 }
      );
    }
    // ========================================

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    
    const { installment_id, paid_amount, payment_date, payment_method, note, reset } = parsed.data;

    const accessToken = getAccessTokenFromRequest(req);
    // Eğer oturum token'ı varsa RLS client, yoksa service role client kullan
    const supabase = accessToken ? getServiceRoleClient() : getServiceRoleClient();

    // Get existing installment to check total amount for status calculation
    const { data: existing, error: getError } = await supabase
        .from('finance_installments')
        .select('amount')
        .eq('id', installment_id)
        .single();

    if (getError || !existing) {
        return NextResponse.json({ success: false, error: 'Kayıt bulunamadı' }, { status: 404 });
    }

    const totalAmount = Number(existing.amount);
    
    // Logic:
    // If reset is true -> set paid_amount = 0, is_paid = false, status = pending, clear date/method
    // Else -> update fields, recalc is_paid

    let updates: any = {};

    if (reset) {
        updates = {
            paid_amount: 0,
            is_paid: false,
            status: 'pending',
            paid_at: null,
            payment_method: null,
            note: note // Keep note if updated
        };
    } else {
        const isPaid = paid_amount >= totalAmount - 0.01; // Tolerance
        let status = 'pending';
        if (isPaid) status = 'paid';
        else if (paid_amount > 0) status = 'partial';

        updates = {
            paid_amount,
            is_paid: isPaid,
            status,
            paid_at: payment_date,
            payment_method,
            note
        };
    }

    const { data, error } = await supabase
      .from('finance_installments')
      .update(updates)
      .eq('id', installment_id)
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

