import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Edge Runtime
export const runtime = 'edge';

function getEdgeSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET - Öğrenci notlarını getir
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const supabase = getEdgeSupabaseClient();

    const { data, error } = await supabase
      .from('student_notes')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[NOTES] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e: any) {
    console.error('[NOTES] Error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST - Yeni not ekle
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await req.json();
    const { title, content, category, organization_id, created_by_name } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ success: false, error: 'Not içeriği gerekli' }, { status: 400 });
    }

    const supabase = getEdgeSupabaseClient();

    const { data, error } = await supabase
      .from('student_notes')
      .insert({
        student_id: studentId,
        organization_id,
        title: title || null,
        content: content.trim(),
        category: category || 'general',
        created_by_name: created_by_name || 'Sistem',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[NOTES] Insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error('[NOTES] Error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE - Not sil (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('note_id');

    if (!noteId) {
      return NextResponse.json({ success: false, error: 'note_id gerekli' }, { status: 400 });
    }

    const supabase = getEdgeSupabaseClient();

    const { error } = await supabase
      .from('student_notes')
      .update({ is_deleted: true })
      .eq('id', noteId);

    if (error) {
      console.error('[NOTES] Delete error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[NOTES] Error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
