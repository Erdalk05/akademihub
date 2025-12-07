import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Tüm ayarları getir
export async function GET() {
  try {
    // Kurum ayarları
    const { data: schoolSettings } = await supabase
      .from('school_settings')
      .select('key, value');

    // Ayarları object'e çevir
    const school: Record<string, string> = {};
    (schoolSettings || []).forEach((s: any) => {
      school[s.key] = s.value || '';
    });

    // İletişim ayarları
    const { data: commSettings } = await supabase
      .from('communication_settings')
      .select('*');

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
    const body = await request.json();
    const { school, contractTemplate, kvkkText, communication } = body;

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

      for (const update of updates) {
        await supabase
          .from('school_settings')
          .upsert({ key: update.key, value: update.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      }
    }

    // Sözleşme şablonu
    if (contractTemplate !== undefined) {
      await supabase
        .from('school_settings')
        .upsert({ key: 'contract_template', value: contractTemplate, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }

    // KVKK metni
    if (kvkkText !== undefined) {
      await supabase
        .from('school_settings')
        .upsert({ key: 'kvkk_text', value: kvkkText, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }

    // İletişim ayarları
    if (communication) {
      for (const comm of communication) {
        await supabase
          .from('communication_settings')
          .update({
            is_enabled: comm.is_enabled,
            provider_name: comm.provider_name,
            api_key: comm.api_key,
            config: comm.config,
            updated_at: new Date().toISOString()
          })
          .eq('provider_type', comm.provider_type);
      }
    }

    return NextResponse.json({ success: true, message: 'Ayarlar kaydedildi' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


