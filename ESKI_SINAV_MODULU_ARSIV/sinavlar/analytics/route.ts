/**
 * ============================================
 * AkademiHub - Analytics API Route
 * ============================================
 * 
 * PHASE 3.3 - Orchestrator API Endpoint
 * 
 * Bu route Analytics Orchestrator'ı çağırır.
 * UI bu endpoint'i kullanır.
 * 
 * KURALLAR:
 * - Hesaplama YAPMA
 * - Orchestrator'a delege et
 * - Hata durumunda uygun HTTP status dön
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudentAnalytics } from '@/lib/sinavlar/analytics/orchestrator';

// ==================== GET: Öğrenci Analytics ====================

/**
 * GET /api/sinavlar/analytics?examId=xxx&studentId=yyy
 * 
 * Belirli bir öğrenci ve sınav için analytics getirir.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId');
    
    // Validasyon
    if (!examId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_EXAM_ID', message: 'examId parametresi gerekli' } },
        { status: 400 }
      );
    }
    
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_STUDENT_ID', message: 'studentId parametresi gerekli' } },
        { status: 400 }
      );
    }
    
    // Orchestrator'a delege et
    const result = await getStudentAnalytics(examId, studentId);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          timing: result.timing
        },
        { status: result.error?.recoverable ? 400 : 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      timing: result.timing
    });
    
  } catch (error) {
    console.error('[Analytics API] Unexpected error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Beklenmeyen hata',
          recoverable: false
        } 
      },
      { status: 500 }
    );
  }
}

// ==================== POST: Toplu Analytics ====================

/**
 * POST /api/sinavlar/analytics
 * Body: { examId: string, studentIds?: string[] }
 * 
 * Bir sınav için tüm veya seçili öğrencilerin analytics'ini getirir.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examId, studentIds } = body;
    
    // Validasyon
    if (!examId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_EXAM_ID', message: 'examId gerekli' } },
        { status: 400 }
      );
    }
    
    // Tek öğrenci varsa direkt dön
    if (studentIds && studentIds.length === 1) {
      const result = await getStudentAnalytics(examId, studentIds[0]);
      return NextResponse.json(result);
    }
    
    // Birden fazla öğrenci için paralel işlem
    if (studentIds && studentIds.length > 0) {
      const results = await Promise.all(
        studentIds.map((studentId: string) => 
          getStudentAnalytics(examId, studentId)
        )
      );
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      
      return NextResponse.json({
        success: failedCount === 0,
        data: results.filter(r => r.success).map(r => r.data),
        errors: results.filter(r => !r.success).map(r => r.error),
        stats: {
          total: results.length,
          success: successCount,
          failed: failedCount
        }
      });
    }
    
    // StudentIds yoksa hata dön (henüz tüm sınav desteği yok)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'NOT_IMPLEMENTED', 
          message: 'Tüm sınav analytics henüz desteklenmiyor. studentIds parametresi gerekli.' 
        } 
      },
      { status: 501 }
    );
    
  } catch (error) {
    console.error('[Analytics API] POST error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Beklenmeyen hata' 
        } 
      },
      { status: 500 }
    );
  }
}
