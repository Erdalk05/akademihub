import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type TemplateSchemaPayload = {
  optikSablon: object;
  alanlar: object[];
  dersler: object[];
};

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  if (!organizationId) {
    return NextResponse.json(
      { success: false, message: 'organizationId parametresi gerekli' },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('optical_templates')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, templates: data || [] });
}

export async function POST(request: NextRequest) {
  const { organizationId, name, schema, totalColumns, totalQuestions, templateId } =
    await request.json().catch(() => ({}));

  if (!organizationId || !name || !schema) {
    return NextResponse.json(
      { success: false, message: 'organizationId, name ve schema gerekli' },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();
  const payload: Record<string, any> = {
    organization_id: organizationId,
    name,
    schema,
    total_columns: totalColumns || null,
    total_questions: totalQuestions || null,
  };
  if (templateId) {
    payload.id = templateId;
  }

  const { data, error } = await supabase
    .from('optical_templates')
    .upsert(payload, { onConflict: 'id' })
    .select('id, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, template_id: data?.id });
}
