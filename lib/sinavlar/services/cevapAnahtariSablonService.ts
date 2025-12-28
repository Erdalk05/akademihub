/**
 * CEVAP ANAHTARI ŞABLON SERVİSİ
 * Supabase'den cevap anahtarı şablonlarını (kütüphane) yönetir.
 */

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
  const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : '';
  const res = await fetch(`/api/cevap-anahtari-sablonlari${qs}`, { method: 'GET' });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    console.error('Cevap anahtarı şablonları yükleme hatası:', json?.error || res.statusText);
    return [];
  }
  return (json.data || []) as CevapAnahtariSablonDB[];
}

export async function createCevapAnahtariSablon(input: {
  sablon_adi: string;
  aciklama?: string | null;
  sinav_turu?: string | null;
  sinif_seviyesi?: string | null;
  cevap_anahtari: CevapAnahtariSatir[];
  organization_id?: string | null;
}): Promise<CevapAnahtariSablonDB | null> {
  const res = await fetch('/api/cevap-anahtari-sablonlari', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    console.error('Cevap anahtarı şablonu oluşturma hatası:', json?.error || res.statusText);
    return null;
  }
  return json.data as CevapAnahtariSablonDB;
}

export async function deleteCevapAnahtariSablon(id: string): Promise<boolean> {
  const res = await fetch(`/api/cevap-anahtari-sablonlari/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    console.error('Cevap anahtarı şablonu silme hatası:', json?.error || res.statusText);
    return false;
  }
  return true;
}


