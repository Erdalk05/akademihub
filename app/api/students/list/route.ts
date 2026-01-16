import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ Edge Runtime - Cold Start YOK, anında başlar
export const runtime = 'edge';

// Edge-compatible Supabase client
function getEdgeSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * GET /api/students/list
 * Öğrenci listesi için optimize edilmiş RPC endpoint
 * Tüm finansal hesaplamalar SQL'de yapılır, pagination destekli
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parametreleri al
    const organizationId = searchParams.get('organization_id') || null;
    const academicYear = searchParams.get('academic_year') || null;
    const search = searchParams.get('search') || null;
    const statusFilter = searchParams.get('status_filter') || 'all';
    const classFilter = searchParams.get('class_filter') || null;
    const sortField = searchParams.get('sort_field') || 'name';
    const sortDir = searchParams.get('sort_dir') || 'asc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    // ✅ Mobil için varsayılan 15, masaüstü 25
    const pageSize = parseInt(searchParams.get('page_size') || '15', 10);
    
    const offset = (page - 1) * pageSize;
    
    // ✅ GUARD: organizationId NULL olamaz
    if (!organizationId) {
      console.warn('[STUDENTS_LIST] ⚠️ organizationId NULL - boş liste dönülüyor');
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, pageSize: 15, totalPages: 0 },
        stats: { totalActive: 0, withDebt: 0, paid: 0, critical: 0, deleted: 0 }
      }, { status: 200 });
    }
    
    const supabase = getEdgeSupabaseClient();
    
    console.log('[STUDENTS_LIST] ⏱️ RPC çağrılıyor...', { organizationId, academicYear, page, pageSize });
    const startTime = Date.now();
    
    // RPC çağrısı
    const { data, error } = await supabase.rpc('get_students_list', {
      p_organization_id: organizationId,
      p_academic_year: academicYear,
      p_search: search,
      p_status_filter: statusFilter,
      p_class_filter: classFilter,
      p_sort_field: sortField,
      p_sort_dir: sortDir,
      p_limit: pageSize,
      p_offset: offset
    });
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('[STUDENTS_LIST] ❌ RPC HATA:', error.message, error.code, `(${duration}ms)`);
      
      // RPC fonksiyonu yoksa fallback
      if (error.message.includes('function') || error.code === '42883') {
        return NextResponse.json({ 
          success: false, 
          error: 'RPC function not found. Please run migration.',
          fallback: true 
        }, { status: 500 });
      }
      
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    console.log('[STUDENTS_LIST] ✅ RPC BAŞARILI:', { 
      duration: `${duration}ms`, 
      studentCount: data?.students?.length || 0,
      total: data?.pagination?.total || 0
    });
    
    // Response formatı
    const students = data?.students || [];
    const pagination = data?.pagination || { total: 0, page: 1, pageSize: 25, totalPages: 0 };
    const stats = data?.stats || { total_active: 0, with_debt: 0, paid: 0, critical: 0, deleted: 0 };
    
    // Öğrenci verilerini frontend formatına dönüştür
    const formattedStudents = students.map((s: any) => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      full_name: s.full_name,
      parent_name: s.parent_name,
      class: s.class,
      section: s.section,
      student_no: s.student_no || '',
      photo_url: s.photo_url,
      status: s.status || 'active',
      debt: Number(s.debt) || 0,
      risk: s.risk || 'Yok',
      overdue_count: Number(s.overdue_count) || 0,
      avgDelay: Number(s.avg_delay) || 0,
      lastPaymentDate: s.last_payment_date 
        ? new Date(s.last_payment_date).toLocaleDateString('tr-TR') 
        : undefined,
      lastPaymentAmount: s.last_payment_amount ? Number(s.last_payment_amount) : undefined
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedStudents,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: pagination.totalPages
      },
      stats: {
        totalActive: stats.total_active || 0,
        withDebt: stats.with_debt || 0,
        paid: stats.paid || 0,
        critical: stats.critical || 0,
        deleted: stats.deleted || 0
      }
    }, { 
      status: 200,
      headers: { 
        // ✅ Aggressive caching: 60s cache + 120s stale
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        'X-Response-Time': `${duration}ms`
      }
    });
    
  } catch (e: any) {
    console.error('[STUDENTS_LIST] Error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
