import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/organizations
 * Tüm kurumları listele veya slug ile tek kurum getir
 * Query params:
 * - slug: Kurum slug'ı (opsiyonel) - tek kurum getirmek için
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    
    const supabase = getServiceRoleClient();
    
    let query = supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true);
    
    // Slug parametresi varsa, sadece o kurumu getir
    if (slug) {
      query = query.eq('slug', slug);
    }
    
    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Organizations fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Organizations GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * Yeni kurum oluştur
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getServiceRoleClient();

    // Slug oluştur (name'den)
    if (!body.slug && body.name) {
      body.slug = body.name
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Organization insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Organizations POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
