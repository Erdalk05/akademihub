import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/test-rpc
 * RPC fonksiyonlarının çalışıp çalışmadığını test eder
 */
export async function GET() {
  const supabase = getServiceRoleClient();
  const results: Record<string, any> = {};
  
  // Test 1: get_students_list
  console.log('[TEST] Testing get_students_list...');
  const start1 = Date.now();
  const { data: studentsData, error: studentsError } = await supabase.rpc('get_students_list', {
    p_limit: 5,
    p_offset: 0
  });
  results.get_students_list = {
    success: !studentsError,
    duration: `${Date.now() - start1}ms`,
    error: studentsError?.message || null,
    studentCount: studentsData?.students?.length || 0,
    total: studentsData?.pagination?.total || 0
  };
  
  // Test 2: get_founder_report
  console.log('[TEST] Testing get_founder_report...');
  const start2 = Date.now();
  const { data: founderData, error: founderError } = await supabase.rpc('get_founder_report');
  results.get_founder_report = {
    success: !founderError,
    duration: `${Date.now() - start2}ms`,
    error: founderError?.message || null,
    hasData: !!founderData
  };
  
  // Özet
  const allSuccess = Object.values(results).every((r: any) => r.success);
  
  return NextResponse.json({
    success: allSuccess,
    message: allSuccess 
      ? '✅ Tüm RPC fonksiyonları çalışıyor!' 
      : '❌ Bazı RPC fonksiyonları çalışmıyor. Migration yapın!',
    results
  });
}
