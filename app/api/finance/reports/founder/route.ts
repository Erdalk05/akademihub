import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ Edge Runtime - Cold Start YOK
export const runtime = 'edge';

function getEdgeSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * GET /api/finance/reports/founder
 * Kurucu raporu için optimize edilmiş RPC endpoint
 * Tüm aggregation'ları SQL tarafında yapar
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organization_id');
    
    const supabase = getEdgeSupabaseClient();
    
    // Tek RPC çağrısı ile tüm verileri al
    const { data, error } = await supabase.rpc('get_founder_report', {
      p_organization_id: organizationId || null
    });
    
    if (error) {
      console.error('[FOUNDER_REPORT] RPC Error:', error);
      
      // RPC fonksiyonu yoksa fallback olarak eski yöntemi kullan
      if (error.message.includes('function') || error.code === '42883') {
        return NextResponse.json({ 
          success: false, 
          error: 'RPC function not found. Please run migration.',
          fallback: true 
        }, { status: 500 });
      }
      
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Veriyi frontend'in beklediği formata dönüştür
    const summary = data?.summary || {};
    const classStats = data?.classStats || [];
    const monthlyData = data?.monthlyData || [];
    const riskStudents = data?.riskStudents || [];
    const students = data?.students || [];
    
    // Ay isimleri ekle
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const shortMonthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 
                             'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    const formattedMonthlyData = monthlyData.map((m: any, index: number) => ({
      month: monthNames[m.monthNum - 1] || monthNames[index],
      shortMonth: shortMonthNames[m.monthNum - 1] || shortMonthNames[index],
      expected: Number(m.expected) || 0,
      collected: Number(m.collected) || 0,
      rate: Number(m.rate) || 0,
      cumulativeRevenue: Number(m.cumulativeRevenue) || 0
    }));
    
    // Totals hesapla
    const paidStudentsCount = Number(summary.paidStudents) || 0;
    const totalRevenue = Number(summary.totalRevenue) || 0;
    const collectedRevenue = Number(summary.collectedRevenue) || 0;
    const collectionRate = totalRevenue > 0 ? (collectedRevenue / totalRevenue) * 100 : 0;
    
    const criticalRiskCount = (riskStudents || []).filter((s: any) => s.riskLevel === 'critical').length;
    
    const totals = {
      totalStudents: Number(summary.totalStudents) || 0,
      paidStudents: paidStudentsCount,
      freeStudents: Number(summary.freeStudents) || 0,
      deletedStudents: Number(summary.deletedStudents) || 0,
      totalRevenue,
      collectedRevenue,
      pendingRevenue: Number(summary.pendingRevenue) || 0,
      overdueAmount: Number(summary.overdueAmount) || 0,
      collectionRate,
      averageFeePerStudent: paidStudentsCount > 0 ? totalRevenue / paidStudentsCount : 0,
      totalClasses: Number(summary.totalClasses) || 0,
      overdueStudents: Number(summary.overdueStudents) || 0,
      criticalRiskCount,
      deletedCollectedAmount: Number(summary.deletedCollectedAmount) || 0,
      deletedTotalAmount: Number(summary.deletedTotalAmount) || 0,
    };
    
    // Öğrencileri ayır
    const allStudents = (students || []).filter((s: any) => s.status !== 'deleted');
    const deletedStudents = (students || []).filter((s: any) => s.status === 'deleted').map((s: any) => ({
      ...s,
      deletedDate: s.deletedDate ? new Date(s.deletedDate).toLocaleDateString('tr-TR') : '-',
      registrationDate: s.registrationDate ? new Date(s.registrationDate).toLocaleDateString('tr-TR') : '-'
    }));
    const freeStudents = allStudents.filter((s: any) => !s.isPaid).map((s: any) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      registrationDate: s.registrationDate ? new Date(s.registrationDate).toLocaleDateString('tr-TR') : '-'
    }));
    
    // Format students for frontend
    const formattedAllStudents = allStudents.map((s: any) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      status: s.status,
      totalAmount: Number(s.totalAmount) || 0,
      collectedAmount: Number(s.collectedAmount) || 0,
      remainingAmount: Number(s.remainingAmount) || 0,
      registrationDate: s.registrationDate ? new Date(s.registrationDate).toLocaleDateString('tr-TR') : '-',
      isPaid: s.isPaid
    }));
    
    // Class stats'a students ekle (modal için)
    const classStatsWithStudents = (classStats || []).map((cs: any) => ({
      class: cs.class,
      totalStudents: Number(cs.totalStudents) || 0,
      paidStudents: Number(cs.paidStudents) || 0,
      freeStudents: Number(cs.freeStudents) || 0,
      totalAmount: Number(cs.totalAmount) || 0,
      collectedAmount: Number(cs.collectedAmount) || 0,
      remainingAmount: Number(cs.remainingAmount) || 0,
      averageFee: Number(cs.averageFee) || 0,
      collectionRate: Number(cs.collectionRate) || 0,
      overdueCount: Number(cs.overdueCount) || 0,
      riskScore: Number(cs.riskScore) || 0,
      students: formattedAllStudents.filter((s: any) => s.class === cs.class)
    }));
    
    // AI Insights
    const insights: any[] = [];
    if (collectionRate >= 95) {
      insights.push({ type: 'success', title: 'Mükemmel Tahsilat', description: `%${collectionRate.toFixed(1)} tahsilat oranı ile hedefin üzerindesiniz.` });
    } else if (collectionRate < 80) {
      insights.push({ type: 'danger', title: 'Tahsilat Uyarısı', description: `Tahsilat oranı %${collectionRate.toFixed(1)}. Acil aksiyon gerekli.` });
    }
    
    const freeRate = totals.totalStudents > 0 ? (totals.freeStudents / totals.totalStudents) * 100 : 0;
    if (freeRate > 30) {
      insights.push({ type: 'warning', title: 'Yüksek Burs Oranı', description: `Burslu öğrenci oranı %${freeRate.toFixed(1)}. Gelir potansiyeli etkilenebilir.` });
    }
    
    if (criticalRiskCount > 0) {
      insights.push({ type: 'warning', title: `${criticalRiskCount} Kritik Risk`, description: `Kritik seviyede ${criticalRiskCount} öğrenci mevcut.` });
    }
    
    const bestClass = classStatsWithStudents.length > 0 
      ? classStatsWithStudents.reduce((best: any, curr: any) => curr.collectionRate > best.collectionRate ? curr : best, classStatsWithStudents[0]) 
      : null;
    if (bestClass && bestClass.collectionRate > 0) {
      insights.push({ type: 'success', title: 'En Başarılı Sınıf', description: `${bestClass.class}. sınıf %${bestClass.collectionRate.toFixed(0)} tahsilat oranı ile lider.` });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        totals,
        classStats: classStatsWithStudents,
        monthlyData: formattedMonthlyData,
        riskStudents: (riskStudents || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          class: r.class,
          totalDebt: Number(r.totalDebt) || 0,
          overdueDays: Number(r.overdueDays) || 0,
          riskLevel: r.riskLevel
        })),
        freeStudents,
        deletedStudents,
        allStudents: formattedAllStudents,
        aiInsights: insights
      }
    }, { 
      status: 200,
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
    });
    
  } catch (e: any) {
    console.error('[FOUNDER_REPORT] Error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
