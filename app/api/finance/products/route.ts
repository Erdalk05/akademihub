import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// GET /api/finance/products
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('query') || '').trim();

    let q = supabase.from('products').select('*');

    if (query) {
      q = q.ilike('name', `%${query}%`);
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
      { success: false, error: e.message || 'Ürünler alınamadı' },
      { status: 500 },
    );
  }
}

// POST /api/finance/products  (create or update by id presence)
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));

    const id = body.id as string | undefined;
    const name = (body.name || '').trim();
    const category = (body.category || '').trim();
    const price = Number(body.price || 0);
    const stock = Number(body.stock ?? 0);
    const minimumStock = Number(body.minimum_stock ?? body.minimumStock ?? 0);
    const description = (body.description || '').trim() || null;
    const imageUrl = (body.image_url || body.imageUrl || '').trim() || null;

    if (!name || !category || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Ad, kategori ve fiyat zorunludur' },
        { status: 400 },
      );
    }

    if (id) {
      const { data, error } = await supabase
        .from('products')
        .update({
          name,
          category,
          price,
          stock,
          minimum_stock: minimumStock,
          description,
          image_url: imageUrl,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        category,
        price,
        stock,
        minimum_stock: minimumStock,
        description,
        image_url: imageUrl,
      })
      .select('*')
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
      { success: false, error: e.message || 'Ürün kaydedilemedi' },
      { status: 500 },
    );
  }
}

// DELETE /api/finance/products?id=UUID
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id parametresi zorunludur' },
        { status: 400 },
      );
    }

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Ürün silinemedi' },
      { status: 500 },
    );
  }
}


