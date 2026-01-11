// ============================================================================
// SCORING RULES API
// Kurum + Global (organization_id IS NULL) puanlama kuralları
// Service Role uyumlu – session kullanılmaz
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// ----------------------------------------------------------------------------
// GET – Puanlama kurallarını getir (GLOBAL + ORG OVERRIDE)
// ----------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);

    const sinavTuru = searchParams.get('sinav_turu');
    const onlyActive = searchParams.get('active') === 'true';

    // ❗ Service role session taşımaz
    // organization_id SADECE header veya query’den alınır
    const organizationId =
      searchParams.get('organization_id') ||
      request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'organization_id is required (query or x-organization-id header)',
        },
        { status: 400 }
      );
    }

    // ✅ Global (NULL) + Organization kuralları
    let query = supabase
      .from('scoring_rules')
      .select('*')
      .or(
        `organization_id.eq.${organizationId},organization_id.is.null`
      )
      .order('organization_id', { ascending: false }) // org override önce
      .order('is_default', { ascending: false })
      .order('exam_type', { ascending: true });

    if (sinavTuru) {
      query = query.eq('exam_type', sinavTuru);
    }

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(
      `[SCORING_RULES] ✅ ${data.length} rule loaded from DB (${Date.now() - startTime}ms)`
    );

    return NextResponse.json({
      success: true,
      data,
      from_db: true,
      duration_ms: Date.now() - startTime,
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// POST – Yeni puanlama kuralı ekle
// ----------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();

    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organization_id header required' },
        { status: 400 }
      );
    }

    if (!body.exam_type) {
      return NextResponse.json(
        { success: false, error: 'exam_type required' },
        { status: 400 }
      );
    }

    const insertData = {
      organization_id: organizationId,
      exam_type: body.exam_type,
      wrong_penalty: body.wrong_penalty ?? 4,
      correct_score: body.correct_score ?? 1,
      net_formula: body.net_formula ?? null,
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('scoring_rules')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// PUT – Puanlama kuralını güncelle
// ----------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();

    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId || !body.id) {
      return NextResponse.json(
        { success: false, error: 'id and organization_id required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('scoring_rules')
      .update({
        wrong_penalty: body.wrong_penalty,
        correct_score: body.correct_score,
        net_formula: body.net_formula,
        is_active: body.is_active,
      })
      .eq('id', body.id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// DELETE – Puanlama kuralını sil
// ----------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const organizationId = request.headers.get('x-organization-id');

    if (!id || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'id and organization_id required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('scoring_rules')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
