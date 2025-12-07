import { NextRequest, NextResponse } from 'next/server';

// Memory store - Gerçek projede database kullanılmalı
let activityLogs: any[] = [];

// GET - Logları getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let logs = [...activityLogs];
    
    if (userId) logs = logs.filter(l => l.userId === userId);
    if (action) logs = logs.filter(l => l.action === action);
    if (entityType) logs = logs.filter(l => l.entityType === entityType);
    if (startDate) {
      const start = new Date(startDate);
      logs = logs.filter(l => new Date(l.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      logs = logs.filter(l => new Date(l.timestamp) <= end);
    }
    
    logs = logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return NextResponse.json({ success: true, logs, total: logs.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - Yeni log ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.userId || !body.action || !body.description) {
      return NextResponse.json(
        { success: false, message: 'userId, action ve description zorunludur' },
        { status: 400 }
      );
    }
    
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: body.userId,
      userName: body.userName || 'Bilinmeyen',
      action: body.action,
      entityType: body.entityType || null,
      entityId: body.entityId || null,
      description: body.description,
      metadata: body.metadata || {},
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    };
    
    activityLogs.unshift(newLog);
    if (activityLogs.length > 1000) activityLogs = activityLogs.slice(0, 1000);
    
    return NextResponse.json({ success: true, log: newLog });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE - Logları temizle
export async function DELETE() {
  try {
    activityLogs = [];
    return NextResponse.json({ success: true, message: 'Loglar temizlendi' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
