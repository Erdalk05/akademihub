import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Ödeme şablonlarını getir
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('payment_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Yeni şablon ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, basePrice, maxInstallments, description } = body;

    if (!name || !basePrice) {
      return NextResponse.json({ success: false, error: 'Ad ve fiyat zorunlu' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('payment_templates')
      .insert({
        name,
        base_price: basePrice,
        max_installments: maxInstallments || 10,
        description: description || '',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Şablon güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, basePrice, maxInstallments, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID zorunlu' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('payment_templates')
      .update({
        name,
        base_price: basePrice,
        max_installments: maxInstallments,
        description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Şablon sil (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID zorunlu' }, { status: 400 });
    }

    const { error } = await supabase
      .from('payment_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Şablon silindi' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


