import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { deprecated: true, message: 'This endpoint is archived. Use new finance APIs.' },
    { status: 410 }
  );
}






