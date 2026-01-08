// ============================================================================
// SCORING RULES API - Kurum Bazlı Puanlama Kuralları CRUD
// GET: Liste getir, POST: Yeni ekle, PUT: Güncelle, DELETE: Sil
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// TypeScript interfaces
interface DersKatsayisi {
  dersKodu: string;
  dersAdi: string;
  katsayi: number;
}

interface DersDagilimi {
  dersKodu: string;
  dersAdi: string;
  soruSayisi: number;
  baslangicSoru: number;
  bitisSoru: number;
}

interface ScoringRule {
  id: string;
  organization_id: string;
  sinav_turu: string;
  ad: string;
  aciklama?: string;
  net_hesaplama: string;
  yanlis_katsayisi: number;
  taban_puan: number;
  tavan_puan: number;
  formul_tipi: string;
  ders_katsayilari: DersKatsayisi[];
  ders_dagilimi?: DersDagilimi[];
  normalizasyon: string;
  standart_sapma_dahil: boolean;
  is_active: boolean;
  is_default: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Puanlama kurallarını listele
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    // URL parametreleri
    const { searchParams } = new URL(request.url);
    const sinavTuru = searchParams.get('sinav_turu');
    const onlyActive = searchParams.get('active') === 'true';
    const onlyDefault = searchParams.get('default') === 'true';

    // Organization ID al (session'dan veya header'dan)
    const { data: { session } } = await supabase.auth.getSession();
    const organizationId = session?.user?.user_metadata?.organization_id 
      || request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Kurum bilgisi bulunamadı' },
        { status: 401 }
      );
    }

    // Query oluştur
    let query = supabase
      .from('scoring_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sinav_turu', { ascending: true })
      .order('is_default', { ascending: false })
      .order('ad', { ascending: true });

    // Filtreler
    if (sinavTuru) {
      query = query.eq('sinav_turu', sinavTuru);
    }
    if (onlyActive) {
      query = query.eq('is_active', true);
    }
    if (onlyDefault) {
      query = query.eq('is_default', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Scoring rules fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Puanlama kuralları alınamadı: ' + error.message },
        { status: 500 }
      );
    }

    // Eğer hiç kural yoksa, varsayılanları oluştur
    if (!data || data.length === 0) {
      const { error: seedError } = await supabase.rpc('create_default_scoring_rules', {
        org_id: organizationId
      });

      if (seedError) {
        console.error('Default scoring rules creation error:', seedError);
        // Hata olsa bile boş liste dön
        return NextResponse.json({ success: true, data: [] });
      }

      // Tekrar getir
      const { data: newData } = await supabase
        .from('scoring_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sinav_turu', { ascending: true });

      return NextResponse.json({ success: true, data: newData || [] });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Scoring rules GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Yeni puanlama kuralı ekle
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const body = await request.json();

    // Organization ID al
    const { data: { session } } = await supabase.auth.getSession();
    const organizationId = session?.user?.user_metadata?.organization_id 
      || request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Kurum bilgisi bulunamadı' },
        { status: 401 }
      );
    }

    // Validasyon
    if (!body.sinav_turu || !body.ad) {
      return NextResponse.json(
        { success: false, error: 'Sınav türü ve ad zorunludur' },
        { status: 400 }
      );
    }

    // Eğer is_default true ise, aynı sınav türündeki diğer varsayılanları kaldır
    if (body.is_default) {
      await supabase
        .from('scoring_rules')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
        .eq('sinav_turu', body.sinav_turu);
    }

    // Yeni kural ekle
    const insertData = {
      organization_id: organizationId,
      sinav_turu: body.sinav_turu,
      ad: body.ad,
      aciklama: body.aciklama || null,
      net_hesaplama: body.net_hesaplama || 'standart_4',
      yanlis_katsayisi: body.yanlis_katsayisi ?? 4,
      taban_puan: body.taban_puan ?? 0,
      tavan_puan: body.tavan_puan ?? 500,
      formul_tipi: body.formul_tipi || 'linear',
      ders_katsayilari: body.ders_katsayilari || [],
      ders_dagilimi: body.ders_dagilimi || [],
      normalizasyon: body.normalizasyon || 'yok',
      standart_sapma_dahil: body.standart_sapma_dahil ?? false,
      is_active: body.is_active ?? true,
      is_default: body.is_default ?? false,
      is_system: false,
      created_by: session?.user?.id || null,
    };

    const { data, error } = await supabase
      .from('scoring_rules')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Scoring rule insert error:', error);
      return NextResponse.json(
        { success: false, error: 'Puanlama kuralı eklenemedi: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Scoring rules POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT: Puanlama kuralını güncelle
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID zorunludur' },
        { status: 400 }
      );
    }

    // Organization ID al
    const { data: { session } } = await supabase.auth.getSession();
    const organizationId = session?.user?.user_metadata?.organization_id 
      || request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Kurum bilgisi bulunamadı' },
        { status: 401 }
      );
    }

    // Mevcut kaydı kontrol et
    const { data: existing } = await supabase
      .from('scoring_rules')
      .select('is_system')
      .eq('id', body.id)
      .eq('organization_id', organizationId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Puanlama kuralı bulunamadı' },
        { status: 404 }
      );
    }

    // Sistem kaydı güncellenemez (ama kopyalanabilir)
    if (existing.is_system && !body.force_update) {
      return NextResponse.json(
        { success: false, error: 'Sistem puanlama kuralları değiştirilemez. Yeni bir kural oluşturun.' },
        { status: 403 }
      );
    }

    // Eğer is_default true yapılıyorsa, diğerlerini kaldır
    if (body.is_default) {
      await supabase
        .from('scoring_rules')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
        .eq('sinav_turu', body.sinav_turu)
        .neq('id', body.id);
    }

    // Güncelle
    const updateData: Partial<ScoringRule> = {};
    
    if (body.ad !== undefined) updateData.ad = body.ad;
    if (body.aciklama !== undefined) updateData.aciklama = body.aciklama;
    if (body.net_hesaplama !== undefined) updateData.net_hesaplama = body.net_hesaplama;
    if (body.yanlis_katsayisi !== undefined) updateData.yanlis_katsayisi = body.yanlis_katsayisi;
    if (body.taban_puan !== undefined) updateData.taban_puan = body.taban_puan;
    if (body.tavan_puan !== undefined) updateData.tavan_puan = body.tavan_puan;
    if (body.formul_tipi !== undefined) updateData.formul_tipi = body.formul_tipi;
    if (body.ders_katsayilari !== undefined) updateData.ders_katsayilari = body.ders_katsayilari;
    if (body.ders_dagilimi !== undefined) updateData.ders_dagilimi = body.ders_dagilimi;
    if (body.normalizasyon !== undefined) updateData.normalizasyon = body.normalizasyon;
    if (body.standart_sapma_dahil !== undefined) updateData.standart_sapma_dahil = body.standart_sapma_dahil;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;

    const { data, error } = await supabase
      .from('scoring_rules')
      .update(updateData)
      .eq('id', body.id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Scoring rule update error:', error);
      return NextResponse.json(
        { success: false, error: 'Puanlama kuralı güncellenemedi: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Scoring rules PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE: Puanlama kuralını sil
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID zorunludur' },
        { status: 400 }
      );
    }

    // Organization ID al
    const { data: { session } } = await supabase.auth.getSession();
    const organizationId = session?.user?.user_metadata?.organization_id 
      || request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Kurum bilgisi bulunamadı' },
        { status: 401 }
      );
    }

    // Mevcut kaydı kontrol et
    const { data: existing } = await supabase
      .from('scoring_rules')
      .select('is_system, is_default, sinav_turu')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Puanlama kuralı bulunamadı' },
        { status: 404 }
      );
    }

    // Sistem kaydı silinemez
    if (existing.is_system) {
      return NextResponse.json(
        { success: false, error: 'Sistem puanlama kuralları silinemez' },
        { status: 403 }
      );
    }

    // Sil
    const { error } = await supabase
      .from('scoring_rules')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Scoring rule delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Puanlama kuralı silinemedi: ' + error.message },
        { status: 500 }
      );
    }

    // Eğer varsayılan silindiyse, aynı türdeki başka bir kuralı varsayılan yap
    if (existing.is_default) {
      const { data: remaining } = await supabase
        .from('scoring_rules')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('sinav_turu', existing.sinav_turu)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (remaining) {
        await supabase
          .from('scoring_rules')
          .update({ is_default: true })
          .eq('id', remaining.id);
      }
    }

    return NextResponse.json({ success: true, message: 'Puanlama kuralı silindi' });

  } catch (error) {
    console.error('Scoring rules DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
