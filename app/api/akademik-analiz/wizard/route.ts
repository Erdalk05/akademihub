/**
 * DEPRECATED: Bu endpoint artık kullanılmıyor.
 * Yeni endpoint: /api/exam-intelligence/wizard
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST - DEPRECATED
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'DEPRECATED: Use /api/exam-intelligence/wizard' },
    { status: 410 }
  );
}

// GET - DEPRECATED
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { error: 'DEPRECATED: Use /api/exam-intelligence/wizard' },
    { status: 410 }
  );
}

