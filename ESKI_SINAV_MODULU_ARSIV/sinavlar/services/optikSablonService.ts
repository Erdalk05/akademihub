/**
 * OPTİK ŞABLON SERVİSİ
 * Supabase'den optik şablonlarını yönetir
 */

import { createClient } from '@/lib/supabase/client';

export interface OptikSablonDB {
  id: string;
  sablon_adi: string;
  aciklama: string | null;
  alan_tanimlari: {
    alan: string;
    baslangic: number;
    bitis: number;
    label?: string;
  }[];
  cevap_baslangic: number;
  toplam_soru: number;
  kitapcik_pozisyon: number | null;
  is_default: boolean;
  is_active: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Tüm aktif şablonları getir
 */
export async function getOptikSablonlari(organizationId?: string): Promise<OptikSablonDB[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('optik_sablonlari')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('sablon_adi');
  
  // Organizasyona özel veya genel şablonları getir
  if (organizationId) {
    query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
  } else {
    query = query.is('organization_id', null);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Şablon yükleme hatası:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Tek bir şablon getir
 */
export async function getOptikSablon(id: string): Promise<OptikSablonDB | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('optik_sablonlari')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Şablon getirme hatası:', error);
    return null;
  }
  
  return data;
}

/**
 * Yeni şablon oluştur
 */
export async function createOptikSablon(
  sablon: Omit<OptikSablonDB, 'id' | 'created_at' | 'updated_at'>
): Promise<OptikSablonDB | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('optik_sablonlari')
    .insert(sablon)
    .select()
    .single();
  
  if (error) {
    console.error('Şablon oluşturma hatası:', error);
    return null;
  }
  
  return data;
}

/**
 * Şablon güncelle
 */
export async function updateOptikSablon(
  id: string,
  updates: Partial<OptikSablonDB>
): Promise<OptikSablonDB | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('optik_sablonlari')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Şablon güncelleme hatası:', error);
    return null;
  }
  
  return data;
}

/**
 * Şablon sil (soft delete - is_active = false)
 */
export async function deleteOptikSablon(id: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('optik_sablonlari')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) {
    console.error('Şablon silme hatası:', error);
    return false;
  }
  
  return true;
}

/**
 * Varsayılan şablonu getir
 */
export async function getDefaultOptikSablon(): Promise<OptikSablonDB | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('optik_sablonlari')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();
  
  if (error) {
    console.error('Varsayılan şablon getirme hatası:', error);
    return null;
  }
  
  return data;
}

