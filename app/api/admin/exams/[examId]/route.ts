import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/server'
import { verifyToken, verifyPassword as verifyPasswordHash } from '@/lib/auth/security'

export const dynamic = 'force-dynamic'

function pickErr(e: any) {
  if (!e) return null
  return {
    code: e.code || null,
    message: e.message || null,
    details: e.details || null,
    hint: e.hint || null,
  }
}

// DELETE /api/admin/exams/:examId
// Not: Service role ile çalışır. Exam Intelligence tarafında hızlı silme için.
export async function DELETE(request: NextRequest, { params }: { params: { examId: string } }) {
  const supabase = getServiceRoleClient()
  const examId = params.examId

  if (!examId) {
    return NextResponse.json({ ok: false, error: 'examId gerekli' }, { status: 400 })
  }

  try {
    const url = new URL(request.url)
    const debug = url.searchParams.get('debug') === '1'

    // --- AUTHZ + PASSWORD GATE (critical action) ---
    const auth = request.headers.get('authorization') || request.headers.get('Authorization') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    const vt = token ? verifyToken(token) : { valid: false, error: 'missing token' }
    if (!vt.valid || !vt.payload) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz (token gerekli)' }, { status: 401 })
    }

    const role = String(vt.payload.role || '').toUpperCase()
    const allowed = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TEACHER'
    if (!allowed) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz (rol)' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const password = String(body?.password || '')
    const email = String(body?.email || vt.payload.email || '').trim().toLowerCase()
    if (!password) {
      return NextResponse.json({ ok: false, error: 'Şifre gerekli' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Email gerekli' }, { status: 400 })
    }

    // 1) Master password shortcut (existing behavior in /api/auth/verify-password)
    const ADMIN_PASSWORDS = ['DİKMEN2025!', 'DIKMEN2025!', 'dikmen2025!', 'Dikmen2025!']
    let passwordOk = ADMIN_PASSWORDS.includes(password)

    // 2) Verify against app_users.password_hash (real per-user password)
    if (!passwordOk) {
      const { data: u, error: uErr } = await supabase
        .from('app_users')
        .select('id, email, password_hash, status')
        .eq('email', email)
        .maybeSingle()

      if (uErr) {
        return NextResponse.json(
          { ok: false, error: 'Şifre doğrulanamadı', meta: debug ? { step: 'auth.user', supabase: pickErr(uErr) } : undefined },
          { status: 500 },
        )
      }
      if (!u) {
        return NextResponse.json({ ok: false, error: 'Kullanıcı bulunamadı' }, { status: 401 })
      }
      if (String(u.status || '').toLowerCase() === 'inactive') {
        return NextResponse.json({ ok: false, error: 'Kullanıcı pasif' }, { status: 403 })
      }
      passwordOk = await verifyPasswordHash(password, String(u.password_hash || ''))
    }

    if (!passwordOk) {
      return NextResponse.json({ ok: false, error: 'Şifre yanlış' }, { status: 401 })
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'DEL-A',
        location: 'api/admin/exams/[examId]/route.ts:DELETE:start',
        message: 'admin exam delete start',
        data: {
          examId,
          hasAuthHeader: Boolean(request.headers.get('authorization') || request.headers.get('Authorization')),
          ua: request.headers.get('user-agent') || null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    // 1) student_exam_results
    const r1 = await supabase.from('student_exam_results').delete().eq('exam_id', examId)
    if (r1.error) {
      console.error('[admin exam delete] student_exam_results delete error:', r1.error)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'DEL-B',
          location: 'api/admin/exams/[examId]/route.ts:DELETE:r1',
          message: 'student_exam_results delete error',
          data: { examId, code: (r1.error as any)?.code || null, message: r1.error.message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return NextResponse.json(
        { ok: false, error: 'Öğrenci sınav sonuçları silinemedi', meta: debug ? { step: 'student_exam_results', supabase: pickErr(r1.error) } : undefined },
        { status: 500 },
      )
    }

    // 2) student_test_results (varsa)
    const r2 = await supabase.from('student_test_results').delete().eq('exam_id', examId)
    if (r2.error) {
      console.error('[admin exam delete] student_test_results delete error:', r2.error)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'DEL-C',
          location: 'api/admin/exams/[examId]/route.ts:DELETE:r2',
          message: 'student_test_results delete error',
          data: { examId, code: (r2.error as any)?.code || null, message: r2.error.message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      // Uzun süredir görülen durum: bazı ortamlarda tablo yok / şema farklı. Bu adımı "opsiyonel" say.
      const code = (r2.error as any)?.code || ''
      const msg = String(r2.error.message || '')
      const isMissingTable = code === '42P01' || msg.toLowerCase().includes('does not exist')
      if (!isMissingTable) {
        return NextResponse.json(
          { ok: false, error: 'Öğrenci test sonuçları silinemedi', meta: debug ? { step: 'student_test_results', supabase: pickErr(r2.error) } : undefined },
          { status: 500 },
        )
      }
    }

    // 3) booklet_answer_keys (yeni mimari)
    const r3 = await supabase.from('booklet_answer_keys').delete().eq('exam_id', examId)
    if (r3.error) {
      console.error('[admin exam delete] booklet_answer_keys delete error:', r3.error)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'DEL-D',
          location: 'api/admin/exams/[examId]/route.ts:DELETE:r3',
          message: 'booklet_answer_keys delete error',
          data: { examId, code: (r3.error as any)?.code || null, message: r3.error.message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return NextResponse.json(
        { ok: false, error: 'Cevap anahtarları silinemedi', meta: debug ? { step: 'booklet_answer_keys', supabase: pickErr(r3.error) } : undefined },
        { status: 500 },
      )
    }

    // 4) exam_tests
    const r4 = await supabase.from('exam_tests').delete().eq('exam_id', examId)
    if (r4.error) {
      console.error('[admin exam delete] exam_tests delete error:', r4.error)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'DEL-E',
          location: 'api/admin/exams/[examId]/route.ts:DELETE:r4',
          message: 'exam_tests delete error',
          data: { examId, code: (r4.error as any)?.code || null, message: r4.error.message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return NextResponse.json(
        { ok: false, error: 'Sınav testleri silinemedi', meta: debug ? { step: 'exam_tests', supabase: pickErr(r4.error) } : undefined },
        { status: 500 },
      )
    }

    // 5) exam_audit_log (opsiyonel)
    const r5 = await supabase.from('exam_audit_log').delete().eq('exam_id', examId)
    if (r5.error) {
      console.warn('[admin exam delete] exam_audit_log delete error:', r5.error)
      // audit log kritik değil, devam
    }

    // 6) exams
    const { error: examError } = await supabase.from('exams').delete().eq('id', examId)

    if (examError) {
      console.error('[admin exam delete] exam delete error:', examError)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'DEL-F',
          location: 'api/admin/exams/[examId]/route.ts:DELETE:exam',
          message: 'exams delete error',
          data: { examId, code: (examError as any)?.code || null, message: examError.message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return NextResponse.json(
        { ok: false, error: 'Sınav silinemedi', meta: debug ? { step: 'exams', supabase: pickErr(examError) } : undefined },
        { status: 500 },
      )
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'DEL-G',
        location: 'api/admin/exams/[examId]/route.ts:DELETE:ok',
        message: 'admin exam delete ok',
        data: { examId },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error('[admin exam delete] unexpected:', e)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/016afb74-602c-437e-b39f-b018d97de079', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'DEL-Z',
        location: 'api/admin/exams/[examId]/route.ts:DELETE:catch',
        message: 'admin exam delete unexpected',
        data: { examId, error: e instanceof Error ? e.message : String(e) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json(
      { ok: false, error: 'Beklenmeyen hata', meta: { message: e instanceof Error ? e.message : String(e) } },
      { status: 500 },
    )
  }
}
