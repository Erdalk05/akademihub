import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// GET /api/finance/sales-customers?query=...
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('query') || '').trim();

    let q = supabase.from('sales_customers').select('id, full_name, phone, note, created_at');

    if (query) {
      q = q.ilike('full_name', `%${query}%`);
    }

    const { data, error } = await q.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Satış müşterileri alınamadı' },
      { status: 500 },
    );
  }
}

// POST /api/finance/sales-customers
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));

    const fullName = (body.fullName || body.full_name || '').trim();
    const phone = (body.phone || '').trim() || null;
    const note = (body.note || '').trim() || null;

    if (!fullName) {
      return NextResponse.json(
        { success: false, error: 'Ad soyad zorunludur' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('sales_customers')
      .insert({ full_name: fullName, phone, note })
      .select('id, full_name, phone, note, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Müşteri kaydedilemedi' },
      { status: 500 },
    );
  }
}


