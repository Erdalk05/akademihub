/**
 * Exam Intelligence - Optik Şablon API
 * Supabase'den optik şablonlarını getirir (tek veri kaynağı)
 * 
 * ✅ YIL BAĞIMSIZ: Optik şablonlar akademik yıla bağlı DEĞİL
 * Aynı kurum = her yıl aynı şablonlar (uzun yıllar kullanılabilir)
 */

import { getServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Varsayılan şablonlar (DB boşsa kullanılır)
const DEFAULT_TEMPLATES = [
  {
    id: 'default-lgs',
    sablon_adi: 'LGS Varsayılan',
    aciklama: '90 soru LGS şablonu',
    alan_tanimlari: [
      { alan: 'ogrenci_no', baslangic: 1, bitis: 10, label: 'Öğrenci No' },
      { alan: 'ogrenci_adi', baslangic: 11, bitis: 40, label: 'Öğrenci Adı' },
      { alan: 'kitapcik', baslangic: 41, bitis: 41, label: 'Kitapçık' },
      { alan: 'cevaplar', baslangic: 42, bitis: 131, label: 'Cevaplar' },
    ],
    cevap_baslangic: 42,
    toplam_soru: 90,
    kitapcik_pozisyon: 41,
    is_default: true,
    is_active: true,
    organization_id: null,
  },
  {
    id: 'default-tyt',
    sablon_adi: 'TYT Varsayılan',
    aciklama: '120 soru TYT şablonu',
    alan_tanimlari: [
      { alan: 'ogrenci_no', baslangic: 1, bitis: 10, label: 'Öğrenci No' },
      { alan: 'ogrenci_adi', baslangic: 11, bitis: 40, label: 'Öğrenci Adı' },
      { alan: 'kitapcik', baslangic: 41, bitis: 41, label: 'Kitapçık' },
      { alan: 'cevaplar', baslangic: 42, bitis: 161, label: 'Cevaplar' },
    ],
    cevap_baslangic: 42,
    toplam_soru: 120,
    kitapcik_pozisyon: 41,
    is_default: true,
    is_active: true,
    organization_id: null,
  },
];

export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient();
  const url = new URL(request.url);
  const organizationId = url.searchParams.get('organizationId');
  // ✅ academicYearId KULLANILMIYOR - Optik şablonlar yıl bağımsız

  if (!organizationId) {
    return NextResponse.json({ ok: false, error: 'organizationId gerekli' }, { status: 400 });
  }

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ YIL BAĞIMSIZ SORGULAMA
    // Optik şablonlar akademik yıla bağlı değil - uzun yıllar kullanılabilir
    // Sadece organizationId ile filtreleniyor
    // ═══════════════════════════════════════════════════════════════════════════
    const { data: templates, error } = await supabase
      .from('optik_sablonlari')
      .select('*')
      .eq('is_active', true)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('is_default', { ascending: false })
      .order('sablon_adi');

    if (error) {
      console.error('[optic-templates] Supabase error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // DB boşsa varsayılan şablonları döndür
    const source = templates && templates.length > 0 ? 'supabase' : 'fallback';
    const finalTemplates = source === 'supabase' ? templates : DEFAULT_TEMPLATES;

    return NextResponse.json({
      ok: true,
      source,
      data: { opticTemplates: finalTemplates },
      meta: {
        organizationId,
        count: finalTemplates.length,
        // ✅ Yıl bilgisi yok - şablonlar her yıl geçerli
      },
    });
  } catch (e: any) {
    console.error('[optic-templates] Unexpected error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Beklenmeyen hata' }, { status: 500 });
  }
}

