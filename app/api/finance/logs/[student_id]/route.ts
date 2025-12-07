import { NextRequest, NextResponse } from 'next/server';
import { createRlsServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// GET /api/finance/logs/[student_id]
export async function GET(req: NextRequest, { params }: { params: { student_id: string } }) {
  try {
    const accessToken = getAccessTokenFromRequest(req);
    const supabase = createRlsServerClient(accessToken);
    const { data, error } = await supabase
      .from('finance_logs')
      .select('*')
      .eq('student_id', params.student_id)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}











