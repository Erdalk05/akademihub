import { NextRequest, NextResponse } from 'next/server';
import { createRlsServerClient, getServiceRoleClient } from '@/lib/supabase/server';

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// GET /api/students -> Supabase students tablosundan liste
// Not:
// - Authorization header varsa RLS'li client kullanılır.
// - Yoksa, eğer service role key tanımlıysa service client, değilse anon client kullanılır.
export async function GET(req: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(req);
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = accessToken
      ? createRlsServerClient(accessToken)
      : hasServiceRoleKey
        ? getServiceRoleClient()
        : createRlsServerClient();

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 },
    );
  }
}

// POST /api/students -> Supabase students tablosuna ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accessToken = getAccessTokenFromRequest(req);

    const supabase = accessToken
      ? createRlsServerClient(accessToken)
      : getServiceRoleClient();

    // TC Kimlik kontrolü (eğer varsa)
    if (body.tc_id || body.tc_no) {
      const tcValue = body.tc_id || body.tc_no;
      const { data: existing } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('tc_id', tcValue)
        .single();

      if (existing) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Bu TC Kimlik numarası zaten kayıtlı: ${existing.first_name} ${existing.last_name}`,
            code: 'DUPLICATE_TC'
          },
          { status: 409 } // Conflict
        );
      }
    }

    // Otomatik öğrenci numarası üretimi (eğer body'de yoksa)
    if (!body.student_no) {
      try {
        const nextNumberResponse = await fetch(
          `${req.nextUrl.origin}/api/students/next-number`,
          { method: 'GET' }
        );
        const nextNumberResult = await nextNumberResponse.json();
        
        if (nextNumberResult.success && nextNumberResult.data.studentNumber) {
          body.student_no = nextNumberResult.data.studentNumber;
          // eslint-disable-next-line no-console
          console.log('✅ Auto-generated student number:', body.student_no);
        }
      } catch (numberError) {
        // eslint-disable-next-line no-console
        console.warn('Student number generation failed, continuing without it:', numberError);
        // Numara üretilemese bile kayıt devam etsin
      }
    }

    const { data, error } = await supabase
      .from('students')
      .insert([body])
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase students insert error:', error);
      
      // Duplicate key hatası özel mesajı
      if (error.code === '23505' && error.message.includes('tc_id')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Bu TC Kimlik numarası sistemde zaten kayıtlı. Lütfen kontrol edin.',
            code: 'DUPLICATE_TC'
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const totalAmount = body?.total_amount;
    const installmentCount = body?.installment_count;
    const firstDueDate = body?.first_due_date;
    
    if (totalAmount && installmentCount && firstDueDate) {
      try {
        const url = new URL('/api/installments/generate', req.url);
        const genRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: data.id,
            total_amount: totalAmount,
            installment_count: installmentCount,
            first_due_date: firstDueDate,
            force: false,
          }),
          cache: 'no-store',
        });
        if (!genRes.ok) {
          const j = await genRes.json().catch(() => ({}));
          // eslint-disable-next-line no-console
          console.error('Installments generate failed:', j?.error || genRes.statusText);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Generate call error:', (e as any)?.message);
      }
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 },
    );
  }
}

// DELETE /api/students?id=UUID
// Not: İlgili öğrencinin finance_installments kayıtlarını da temizler.
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // body yoksa sessiz geç
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id parametresi zorunlu' },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();

    const { error: instErr } = await supabase
      .from('finance_installments')
      .delete()
      .eq('student_id', id);

    if (instErr) {
      return NextResponse.json(
        { success: false, error: instErr.message },
        { status: 500 },
      );
    }

    const { error: stdErr } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (stdErr) {
      return NextResponse.json(
        { success: false, error: stdErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 },
    );
  }
}
