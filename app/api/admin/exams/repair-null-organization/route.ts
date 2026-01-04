import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: organization_id = null olan sınavları listeler (onarım adayları)
export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient()
  const url = new URL(request.url)
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') || 200)))
  const q = String(url.searchParams.get('q') || '').trim()
  const organizationId = String(url.searchParams.get('organizationId') || '').trim()
  const mode = String(url.searchParams.get('mode') || 'null').trim() // 'null' | 'search'

  try {
    let query = supabase
      .from('exams')
      .select('id, name, exam_date, exam_type, grade_level, status, created_at, organization_id')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (mode === 'search') {
      // Kayıp sınavı bulmak için isimle ara (org filtre opsiyonel)
      if (q) query = query.ilike('name', `%${q}%`)
      // Eğer organizationId verildiyse, "bu kuruma ait olmayan"ları getir (null dahil)
      if (organizationId) query = query.neq('organization_id', organizationId)
    } else {
      // default: sadece null org
      query = query.is('organization_id', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('[repair-null-org-exams] list error:', error)
      return NextResponse.json({ exams: [] }, { status: 200 })
    }

    return NextResponse.json({ exams: data || [] }, { status: 200 })
  } catch (e) {
    console.error('[repair-null-org-exams] unexpected:', e)
    return NextResponse.json({ exams: [] }, { status: 200 })
  }
}

// POST: seçilen sınavları organizationId'ye bağlar
export async function POST(request: NextRequest) {
  const supabase = getServiceRoleClient()

  try {
    const body = await request.json().catch(() => null)
    const organizationId = String(body?.organizationId || '').trim()
    const examIds = Array.isArray(body?.examIds) ? body.examIds.map((x: any) => String(x).trim()).filter(Boolean) : []
    const force = Boolean(body?.force) // true ise org dolu olsa da bu kuruma taşır

    if (!organizationId) {
      return NextResponse.json({ ok: false, error: 'organizationId gerekli' }, { status: 400 })
    }

    if (examIds.length === 0) {
      return NextResponse.json({ ok: false, error: 'examIds gerekli' }, { status: 400 })
    }

    // Varsayılan güvenli mod: sadece organization_id=null olanlar güncellenir.
    // force=true ise seçilen sınavlar başka kuruma bağlı olsa bile bu kuruma taşınır.
    let upd = supabase
      .from('exams')
      .update({ organization_id: organizationId, updated_at: new Date().toISOString() })
      .in('id', examIds)

    if (!force) {
      upd = upd.is('organization_id', null)
    }

    const { data: updated, error } = await upd.select('id')

    if (error) {
      console.error('[repair-null-org-exams] update error:', error)
      return NextResponse.json({ ok: false, error: 'Güncelleme başarısız' }, { status: 200 })
    }

    // Audit log (hata olsa bile ana işi bozmasın)
    try {
      const rows = (updated || []).map((r: any) => ({
        action: 'REPAIR',
        entity_type: 'exam',
        entity_id: r.id,
        exam_id: r.id,
        description: `organization_id null olan sınav kuruma bağlandı: ${organizationId}`,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
      }))
      if (rows.length) await supabase.from('exam_audit_log').insert(rows)
    } catch (auditErr) {
      console.warn('[repair-null-org-exams] audit warn:', auditErr)
    }

    return NextResponse.json({ ok: true, updatedCount: (updated || []).length, updatedIds: (updated || []).map((r: any) => r.id) }, { status: 200 })
  } catch (e) {
    console.error('[repair-null-org-exams] unexpected:', e)
    return NextResponse.json({ ok: false, error: 'Beklenmeyen hata' }, { status: 200 })
  }
}
