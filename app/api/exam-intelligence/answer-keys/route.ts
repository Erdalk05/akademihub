import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ok<T> = { ok: true; data: T; meta?: Record<string, any> }
type Err = { ok: false; error: string }

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, error: msg } satisfies Err, { status: 400 })
}

function serverError(msg: string) {
  return NextResponse.json({ ok: false, error: msg } satisfies Err, { status: 500 })
}

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient()
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')
  const examId = url.searchParams.get('examId')

  if (!organizationId) return badRequest('organizationId gerekli')
  if (!examId) return badRequest('examId gerekli')

  try {
    const { data, error } = await supabase
      .from('exam_answer_keys')
      .select('id, organization_id, exam_id, answer_key, ders_sirasi, exam_type, updated_at')
      .eq('organization_id', organizationId)
      .eq('exam_id', examId)
      .maybeSingle()

    if (error) {
      console.error('[answer-keys][GET] supabase error:', error)
      return serverError(error.message)
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          answerKey: data?.answer_key ?? null,
          dersSirasi: data?.ders_sirasi ?? null,
          examType: data?.exam_type ?? null,
          updatedAt: data?.updated_at ?? null,
        },
        meta: { organizationId, examId },
      } satisfies Ok<any>,
      { status: 200 },
    )
  } catch (e: any) {
    console.error('[answer-keys][GET] unexpected:', e)
    return serverError(e?.message || 'Beklenmeyen hata')
  }
}

async function upsert(request: NextRequest) {
  const supabase = getServiceRoleClient()
  const body = await request.json().catch(() => null)

  const organizationId = String(body?.organizationId || '').trim()
  const examId = String(body?.examId || '').trim()
  const answerKey = body?.answerKey
  const dersSirasi = body?.dersSirasi
  const examType = body?.examType ? String(body.examType) : null

  if (!organizationId) return badRequest('organizationId gerekli')
  if (!examId) return badRequest('examId gerekli')
  if (!Array.isArray(answerKey)) return badRequest('answerKey array olmalı')
  if (dersSirasi != null && !Array.isArray(dersSirasi)) return badRequest('dersSirasi array olmalı')

  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('exam_answer_keys')
      .upsert(
        {
          organization_id: organizationId,
          exam_id: examId,
          answer_key: answerKey,
          ders_sirasi: Array.isArray(dersSirasi) ? dersSirasi : null,
          exam_type: examType,
          updated_at: now,
        },
        { onConflict: 'organization_id,exam_id' },
      )
      .select('id, updated_at')
      .single()

    if (error) {
      console.error('[answer-keys][UPSERT] supabase error:', error)
      return serverError(error.message)
    }

    return NextResponse.json(
      { ok: true, data: { id: data?.id, updatedAt: data?.updated_at }, meta: { organizationId, examId } } satisfies Ok<any>,
      { status: 200 },
    )
  } catch (e: any) {
    console.error('[answer-keys][UPSERT] unexpected:', e)
    return serverError(e?.message || 'Beklenmeyen hata')
  }
}

export async function POST(request: NextRequest) {
  return upsert(request)
}

export async function PUT(request: NextRequest) {
  return upsert(request)
}

export async function DELETE(request: NextRequest) {
  const supabase = getServiceRoleClient()
  const url = new URL(request.url)
  const organizationId = url.searchParams.get('organizationId')
  const examId = url.searchParams.get('examId')

  if (!organizationId) return badRequest('organizationId gerekli')
  if (!examId) return badRequest('examId gerekli')

  try {
    const { error } = await supabase
      .from('exam_answer_keys')
      .delete()
      .eq('organization_id', organizationId)
      .eq('exam_id', examId)

    if (error) {
      console.error('[answer-keys][DELETE] supabase error:', error)
      return serverError(error.message)
    }

    return NextResponse.json({ ok: true, data: { deleted: true }, meta: { organizationId, examId } } satisfies Ok<any>, { status: 200 })
  } catch (e: any) {
    console.error('[answer-keys][DELETE] unexpected:', e)
    return serverError(e?.message || 'Beklenmeyen hata')
  }
}


