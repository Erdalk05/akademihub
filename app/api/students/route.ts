import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

// 🇹🇷 Türkçe büyük harf dönüşümü
const turkishToUpperCase = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .replace(/ş/g, 'Ş')
    .replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü')
    .replace(/ö/g, 'Ö')
    .replace(/ç/g, 'Ç')
    .toUpperCase()
    .trim();
};

export const runtime = 'nodejs';

const getAccessTokenFromRequest = (req: NextRequest): string | undefined => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return undefined;
  return token;
};

// GET /api/students -> Supabase students tablosundan liste
// - organization_id query parametresi ile filtreleme yapılabilir
// - academic_year query parametresi ile akademik yıla göre filtreleme yapılabilir
// - search query parametresi ile ad/soyad/numara araması yapılabilir
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organization_id');
    const academicYear = searchParams.get('academic_year');
    const searchQuery = searchParams.get('search')?.trim().toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    
    const supabase = getServiceRoleClient();

    // Eğer arama varsa, özel sorgu yap
    if (searchQuery && searchQuery.length >= 2) {
      // Türkçe karakter dönüşümü
      const normalizedSearch = searchQuery
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
      
      // Birden fazla kelime desteği
      const searchWords = searchQuery.split(/\s+/).filter(w => w.length > 0);
      
      let query = supabase
        .from('students')
        .select('*')
        .neq('status', 'deleted');
      
      // Organization filtresi
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      // Akademik yıl filtresi
      if (academicYear) {
        query = query.eq('academic_year', academicYear);
      }
      
      // Arama: Ad, soyad veya öğrenci numarasında ara
      // ilike case-insensitive arama yapar
      query = query.or(
        `first_name.ilike.%${searchQuery}%,` +
        `last_name.ilike.%${searchQuery}%,` +
        `student_no.ilike.%${searchQuery}%,` +
        `first_name.ilike.%${normalizedSearch}%,` +
        `last_name.ilike.%${normalizedSearch}%`
      );
      
      const { data, error } = await query.order('first_name', { ascending: true }).limit(limit);
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      // Sonuçları relevance'a göre sırala (tam eşleşme önce)
      const sortedData = (data || []).sort((a: any, b: any) => {
        const aName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
        const bName = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
        
        // Tam eşleşme öncelikli
        const aStartsWith = aName.startsWith(searchQuery) || a.first_name?.toLowerCase().startsWith(searchQuery);
        const bStartsWith = bName.startsWith(searchQuery) || b.first_name?.toLowerCase().startsWith(searchQuery);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Alfabetik sıralama
        return aName.localeCompare(bName, 'tr');
      });
      
      return NextResponse.json(
        { success: true, data: sortedData },
        { 
          status: 200,
          headers: { 'Cache-Control': 'private, max-age=10' }
        }
      );
    }

    // Normal liste sorgusu (arama yoksa)
    let query = supabase
      .from('students')
      .select('*')
      .neq('status', 'deleted') // Silinmiş öğrencileri hariç tut
      .order('created_at', { ascending: false })
      .limit(limit);

    // Organization filtresi (çoklu kurum desteği)
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    // ✅ AKADEMİK YIL FİLTRESİ - Sadece seçilen yıldaki öğrenciler
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Cache for 30 seconds
    return NextResponse.json(
      { success: true, data }, 
      { 
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' }
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 },
    );
  }
}

// POST /api/students -> Supabase students tablosuna ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getServiceRoleClient();

    // 🇹🇷 Ad ve Soyad'ı TÜRKÇE BÜYÜK HARFE çevir
    if (body.first_name) {
      body.first_name = turkishToUpperCase(body.first_name);
    }
    if (body.last_name) {
      body.last_name = turkishToUpperCase(body.last_name);
    }

    // TC Kimlik kontrolü (eğer varsa)
    if (body.tc_id || body.tc_no) {
      const tcValue = body.tc_id || body.tc_no;
      const { data: existing } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('tc_id', tcValue)
        .single();

      if (existing) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Bu TC Kimlik numarası zaten kayıtlı: ${existing.first_name} ${existing.last_name}`,
            code: 'DUPLICATE_TC'
          },
          { status: 409 } // Conflict
        );
      }
    }

    // Otomatik öğrenci numarası üretimi (eğer body'de yoksa)
    if (!body.student_no) {
      try {
        const nextNumberResponse = await fetch(
          `${req.nextUrl.origin}/api/students/next-number`,
          { method: 'GET' }
        );
        const nextNumberResult = await nextNumberResponse.json();
        
        if (nextNumberResult.success && nextNumberResult.data.studentNumber) {
          body.student_no = nextNumberResult.data.studentNumber;
          // eslint-disable-next-line no-console
          console.log('✅ Auto-generated student number:', body.student_no);
        }
      } catch (numberError) {
        // eslint-disable-next-line no-console
        console.warn('Student number generation failed, continuing without it:', numberError);
        // Numara üretilemese bile kayıt devam etsin
      }
    }

    const { data, error } = await supabase
      .from('students')
      .insert([body])
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Supabase students insert error:', error);
      
      // Duplicate key hatası özel mesajı
      if (error.code === '23505' && error.message.includes('tc_id')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Bu TC Kimlik numarası sistemde zaten kayıtlı. Lütfen kontrol edin.',
            code: 'DUPLICATE_TC'
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const totalAmount = body?.total_amount;
    const installmentCount = body?.installment_count;
    const firstDueDate = body?.first_due_date;
    
    if (totalAmount && installmentCount && firstDueDate) {
      try {
        const url = new URL('/api/installments/generate', req.url);
        const genRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: data.id,
            total_amount: totalAmount,
            installment_count: installmentCount,
            first_due_date: firstDueDate,
            force: false,
          }),
          cache: 'no-store',
        });
        if (!genRes.ok) {
          const j = await genRes.json().catch(() => ({}));
          // eslint-disable-next-line no-console
          console.error('Installments generate failed:', j?.error || genRes.statusText);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Generate call error:', (e as any)?.message);
      }
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 },
    );
  }
}

// DELETE /api/students?id=UUID
// Not: İlgili öğrencinin finance_installments kayıtlarını da temizler.
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // body yoksa sessiz geç
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id parametresi zorunlu' },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();

    const { error: instErr } = await supabase
      .from('finance_installments')
      .delete()
      .eq('student_id', id);

    if (instErr) {
      return NextResponse.json(
        { success: false, error: instErr.message },
        { status: 500 },
      );
    }

    const { error: stdErr } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (stdErr) {
      return NextResponse.json(
        { success: false, error: stdErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Bilinmeyen hata' },
      { status: 500 },
    );
  }
}
