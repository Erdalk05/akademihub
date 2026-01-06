/**
 * ============================================
 * AkademiHub - Analytics Recompute API
 * ============================================
 * 
 * Background job için stale snapshot yeniden hesaplama
 * 
 * Bu endpoint cron job veya admin panel tarafından çağrılır.
 */

import { NextRequest, NextResponse } from 'next/server';
import { recomputeStaleSnapshots } from '@/lib/sinavlar/analytics/orchestrator';
import { 
  getPendingJobs, 
  markJobCompleted, 
  markJobFailed 
} from '@/lib/sinavlar/analytics/orchestrator/cachePolicy';
import { getStudentAnalytics } from '@/lib/sinavlar/analytics/orchestrator';

// ==================== POST: Stale Recompute ====================

/**
 * POST /api/sinavlar/analytics/recompute
 * Body: { limit?: number, mode?: 'stale' | 'queue' }
 * 
 * Stale snapshot'ları veya queue'daki işleri yeniden hesaplar.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit ?? 10;
    const mode = body.mode ?? 'stale';
    
    if (mode === 'queue') {
      // Queue modunda bekleyen işleri işle
      const jobs = await getPendingJobs(limit);
      
      let processed = 0;
      let failed = 0;
      
      for (const job of jobs) {
        try {
          if (job.job_type === 'student_analytics' && job.student_id) {
            const result = await getStudentAnalytics(
              job.exam_id, 
              job.student_id,
              { enable_async_recompute: false }
            );
            
            if (result.success) {
              await markJobCompleted(job.job_id, { timing: result.timing });
              processed++;
            } else {
              await markJobFailed(job.job_id, result.error?.message ?? 'Unknown error');
              failed++;
            }
          }
        } catch (error) {
          await markJobFailed(
            job.job_id, 
            error instanceof Error ? error.message : 'Processing error'
          );
          failed++;
        }
      }
      
      return NextResponse.json({
        success: true,
        mode: 'queue',
        stats: {
          jobs_found: jobs.length,
          processed,
          failed
        }
      });
    }
    
    // Stale modunda (varsayılan) stale snapshot'ları yeniden hesapla
    const result = await recomputeStaleSnapshots(limit);
    
    return NextResponse.json({
      success: true,
      mode: 'stale',
      stats: {
        processed: result.processed,
        failed: result.failed
      }
    });
    
  } catch (error) {
    console.error('[Recompute API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Beklenmeyen hata' 
      },
      { status: 500 }
    );
  }
}

// ==================== GET: Status ====================

/**
 * GET /api/sinavlar/analytics/recompute
 * 
 * Bekleyen iş sayısını ve durum bilgisini döner.
 */
export async function GET() {
  try {
    const pendingJobs = await getPendingJobs(100);
    
    const byType = pendingJobs.reduce((acc, job) => {
      acc[job.job_type] = (acc[job.job_type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      success: true,
      pending_count: pendingJobs.length,
      by_type: byType,
      sample_jobs: pendingJobs.slice(0, 5).map(j => ({
        job_id: j.job_id,
        job_type: j.job_type,
        exam_id: j.exam_id,
        priority: j.priority,
        created_at: j.created_at
      }))
    });
    
  } catch (error) {
    console.error('[Recompute API] Status error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Status check failed' },
      { status: 500 }
    );
  }
}
