import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/academic-years
 * Akademik yılları listele
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });

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

    // Sadece temel alanları kullan (display_name olmadan)
    const insertData: any = {
      name: body.name,
      start_date: body.start_date,
      end_date: body.end_date,
      is_active: body.is_active ?? false,
    };

    // Opsiyonel alanlar (varsa ekle)
    if (body.status) insertData.status = body.status;

    const { data, error } = await supabase
      .from('academic_years')
      .insert([insertData])
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

    // Eğer is_active true yapılıyorsa, diğerlerini false yap
    if (body.is_active === true) {
      await supabase
        .from('academic_years')
        .update({ is_active: false })
        .neq('id', yearId);
    }

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

/**
 * DELETE /api/academic-years
 * Akademik yıl sil
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearId = searchParams.get('id');
    
    if (!yearId) {
      return NextResponse.json(
        { success: false, error: 'Year ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Aktif yıl silinmesin
    const { data: year } = await supabase
      .from('academic_years')
      .select('is_active')
      .eq('id', yearId)
      .single();

    if (year?.is_active) {
      return NextResponse.json(
        { success: false, error: 'Aktif akademik yıl silinemez' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('academic_years')
      .delete()
      .eq('id', yearId);

    if (error) {
      console.error('Academic year delete error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Akademik yıl silindi' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Academic years DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
