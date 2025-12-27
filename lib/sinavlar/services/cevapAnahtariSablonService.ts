/**
 * CEVAP ANAHTARI ŞABLON SERVİSİ
 * Supabase'den cevap anahtarı şablonlarını (kütüphane) yönetir.
 */

import { createClient } from '@/lib/supabase/client';
import type { CevapAnahtariSatir } from '@/lib/sinavlar/kazanim/types';

export interface CevapAnahtariSablonDB {
  id: string;
  sablon_adi: string;
  aciklama: string | null;
  sinav_turu: string | null;
  sinif_seviyesi: string | null;
  cevap_anahtari: CevapAnahtariSatir[];
  organization_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCevapAnahtariSablonlari(organizationId?: string): Promise<CevapAnahtariSablonDB[]> {
  const supabase = createClient();

  let query = supabase
    .from('cevap_anahtari_sablonlari')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Organizasyona özel veya genel şablonları getir
  if (organizationId) {
    query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
  } else {
    query = query.is('organization_id', null);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Cevap anahtarı şablonları yükleme hatası:', error);
    return [];
  }

  return (data || []) as CevapAnahtariSablonDB[];
}

export async function createCevapAnahtariSablon(input: {
  sablon_adi: string;
  aciklama?: string | null;
  sinav_turu?: string | null;
  sinif_seviyesi?: string | null;
  cevap_anahtari: CevapAnahtariSatir[];
  organization_id?: string | null;
}): Promise<CevapAnahtariSablonDB | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cevap_anahtari_sablonlari')
    .insert({
      sablon_adi: input.sablon_adi,
      aciklama: input.aciklama ?? null,
      sinav_turu: input.sinav_turu ?? null,
      sinif_seviyesi: input.sinif_seviyesi ?? null,
      cevap_anahtari: input.cevap_anahtari,
      organization_id: input.organization_id ?? null,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('Cevap anahtarı şablonu oluşturma hatası:', error);
    return null;
  }

  return data as CevapAnahtariSablonDB;
}

export async function deleteCevapAnahtariSablon(id: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('cevap_anahtari_sablonlari')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Cevap anahtarı şablonu silme hatası:', error);
    return false;
  }

  return true;
}


