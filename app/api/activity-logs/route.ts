import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/activity-logs
 * Fetch activity logs with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Filters
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // TODO: Replace with actual Supabase query when table is created
    // For now, return mock data from localStorage

    // Mock data structure
    const mockLogs = [
      {
        id: '1',
        userId: 'admin_001',
        userName: 'Admin User',
        action: 'student_create',
        entityType: 'student',
        entityId: 'std_001',
        description: 'Yeni öğrenci kaydı oluşturuldu: Ahmet Yılmaz',
        metadata: { studentName: 'Ahmet Yılmaz', class: '9' },
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: '2',
        userId: 'admin_001',
        userName: 'Admin User',
        action: 'payment_create',
        entityType: 'payment',
        entityId: 'pay_001',
        description: 'Ahmet Yılmaz için 5000 TL ödeme kaydedildi',
        metadata: { amount: 5000 },
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: '3',
        userId: 'accounting_001',
        userName: 'Muhasebe User',
        action: 'excel_export',
        description: 'Öğrenci Listesi için 25 kayıt Excel\'e aktarıldı',
        metadata: { rowCount: 25, exportType: 'Öğrenci Listesi' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ];

    // Apply filters
    let filteredLogs = mockLogs;

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    if (entityType) {
      filteredLogs = filteredLogs.filter(log => log.entityType === entityType);
    }

    if (entityId) {
      filteredLogs = filteredLogs.filter(log => log.entityId === entityId);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }

    // Apply limit
    filteredLogs = filteredLogs.slice(0, limit);

    return NextResponse.json({
      success: true,
      logs: filteredLogs,
      count: filteredLogs.length,
    });
  } catch (error: any) {
    console.error('Activity logs fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activity-logs
 * Create a new activity log entry
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.userId || !body.userName || !body.action || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Save to Supabase when table is created
    // For now, just log to console
    const log = {
      id: `log_${Date.now()}`,
      ...body,
      timestamp: new Date().toISOString(),
    };

    // eslint-disable-next-line no-console
    console.log('[Activity Log]', log);

    return NextResponse.json({
      success: true,
      log,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Activity log creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create activity log' },
      { status: 500 }
    );
  }
}

