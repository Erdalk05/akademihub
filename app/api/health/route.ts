import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Health Check Endpoint
 * İnternet bağlantısı kontrolü için kullanılır
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
