import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/academic-years
 * Akademik yılları listele
 * Query params:
 *   - organization_id: UUID (optional)
 *   - active_only: boolean (default: false)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organization_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    const supabase = getServiceRoleClient();
    
    let query = supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Academic years fetch error:', error);
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
    console.error('Academic years GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academic-years
 * Yeni akademik yıl oluştur
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getServiceRoleClient();

    // Display name oluştur (eğer yoksa)
    if (!body.display_name && body.name) {
      body.display_name = `Eğitim Öğretim Yılı ${body.name}`;
    }

    const { data, error } = await supabase
      .from('academic_years')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Academic year insert error:', error);
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
    console.error('Academic years POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/academic-years
 * Akademik yıl güncelle (örn: aktif yıl değiştir)
 */
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearId = searchParams.get('id');
    
    if (!yearId) {
      return NextResponse.json(
        { success: false, error: 'Year ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('academic_years')
      .update(body)
      .eq('id', yearId)
      .select()
      .single();

    if (error) {
      console.error('Academic year update error:', error);
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
    console.error('Academic years PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
