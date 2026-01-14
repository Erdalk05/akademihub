/**
 * ============================================
 * AkademiHub - Analytics API Route (DEPRECATED)
 * ============================================
 * 
 * Bu endpoint kullanımdan kaldırıldı.
 * Yeni sistem: /api/spectra/* API'leri
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'DEPRECATED', 
        message: 'Bu endpoint kullanımdan kaldırıldı. Yeni sistem için /api/spectra/* kullanın.' 
      } 
    },
    { status: 410 } // 410 Gone
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'DEPRECATED', 
        message: 'Bu endpoint kullanımdan kaldırıldı. Yeni sistem için /api/spectra/* kullanın.' 
      } 
    },
    { status: 410 }
  );
}
