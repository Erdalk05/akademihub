import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET - Tüm ayarları getir
export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    
    // Paralel çağrı - her iki sorguyu aynı anda yap
    const [schoolResult, commResult] = await Promise.all([
      supabase.from('school_settings').select('key, value'),
      supabase.from('communication_settings').select('*')
    ]);

    const schoolSettings = schoolResult.data;
    const commSettings = commResult.data;

    // Ayarları object'e çevir
    const school: Record<string, string> = {};
    (schoolSettings || []).forEach((s: any) => {
      school[s.key] = s.value || '';
    });

    return NextResponse.json({
      success: true,
      data: {
        school: {
          name: school.school_name || '',
          address: school.school_address || '',
          phone: school.school_phone || '',
          email: school.school_email || '',
          website: school.school_website || '',
          logo: school.school_logo || '',
          taxNo: school.school_tax_no || '',
          mersisNo: school.school_mersis_no || '',
        },
        contractTemplate: school.contract_template || '',
        kvkkText: school.kvkk_text || '',
        communication: commSettings || []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Ayarları kaydet
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const body = await request.json();
    const { school, contractTemplate, kvkkText, communication } = body;
    const now = new Date().toISOString();

    // Tüm güncellemeleri paralel yap
    const promises: Promise<any>[] = [];

    // Kurum ayarlarını güncelle
    if (school) {
      const updates = [
        { key: 'school_name', value: school.name },
        { key: 'school_address', value: school.address },
        { key: 'school_phone', value: school.phone },
        { key: 'school_email', value: school.email },
        { key: 'school_website', value: school.website },
        { key: 'school_logo', value: school.logo },
        { key: 'school_tax_no', value: school.taxNo },
        { key: 'school_mersis_no', value: school.mersisNo },
      ];

      updates.forEach(update => {
        promises.push(
          supabase
            .from('school_settings')
            .upsert({ key: update.key, value: update.value, updated_at: now }, { onConflict: 'key' })
        );
      });
    }

    // Sözleşme şablonu
    if (contractTemplate !== undefined) {
      promises.push(
        supabase
          .from('school_settings')
          .upsert({ key: 'contract_template', value: contractTemplate, updated_at: now }, { onConflict: 'key' })
      );
    }

    // KVKK metni
    if (kvkkText !== undefined) {
      promises.push(
        supabase
          .from('school_settings')
          .upsert({ key: 'kvkk_text', value: kvkkText, updated_at: now }, { onConflict: 'key' })
      );
    }

    // İletişim ayarları
    if (communication) {
      communication.forEach((comm: any) => {
        promises.push(
          supabase
            .from('communication_settings')
            .update({
              is_enabled: comm.is_enabled,
              provider_name: comm.provider_name,
              api_key: comm.api_key,
              config: comm.config,
              updated_at: now
            })
            .eq('provider_type', comm.provider_type)
        );
      });
    }

    // Tüm güncellemeleri paralel çalıştır
    await Promise.all(promises);

    return NextResponse.json({ success: true, message: 'Ayarlar kaydedildi' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


