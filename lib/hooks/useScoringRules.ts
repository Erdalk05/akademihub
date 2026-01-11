// ============================================================================
// useScoringRules Hook - Kurum Puanlama Kurallarını Yönetme
// DB'den puanlama kurallarını çeker ve wizard/scoring-engine'de kullanır
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useOrganizationStore } from '@/lib/store/organizationStore';
import type { 
  SinavTuru, 
  PuanlamaFormulu, 
  DersDagilimi,
  DersKatsayisi 
} from '@/types/spectra-wizard';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoringRuleDB {
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

export interface UseScoringRulesReturn {
  rules: ScoringRuleDB[];
  loading: boolean;
  error: string | null;
  getDefaultRule: (sinavTuru: SinavTuru) => ScoringRuleDB | null;
  getDefaultRuleWithFallback: (sinavTuru: SinavTuru) => PuanlamaFormulu;
  getRuleById: (id: string) => ScoringRuleDB | null;
  getRulesForType: (sinavTuru: SinavTuru) => ScoringRuleDB[];
  toPuanlamaFormulu: (rule: ScoringRuleDB) => PuanlamaFormulu;
  refresh: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useScoringRules(): UseScoringRulesReturn {
  const [rules, setRules] = useState<ScoringRuleDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Canlı veri - Zustand store'dan direkt al + hydration durumu
  const { currentOrganization, _hasHydrated } = useOrganizationStore();
  const organizationId = currentOrganization?.id;

  const fetchRules = useCallback(async () => {
    // ⏳ Zustand henüz hydrate olmadıysa bekle
    if (!_hasHydrated) {
      return;
    }
    
    const startTime = Date.now();
    
    try {
      setLoading(true);
      setError(null);

      if (!organizationId) {
        const duration = Date.now() - startTime;
        console.warn(`[SCORING_RULES] ⏳ Waiting for organization... (${duration}ms)`);
        setError('No organization selected. Please select an organization.');
        setRules([]);
        setLoading(false);
        return;
      }

      console.log(`[SCORING_RULES] 📡 Fetching rules for org: ${organizationId}`);

      const fetchUrl = `/api/settings/scoring-rules?active=true&organization_id=${organizationId}`;

      const res = await fetch(fetchUrl);
      
      const duration = Date.now() - startTime;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`[SCORING_RULES] ❌ API error (${res.status}): ${errorData.error} (${duration}ms)`);
        setError(`API error: ${errorData.error || res.statusText}`);
        setRules([]);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!data.success) {
        console.error(`[SCORING_RULES] ❌ API returned error: ${data.error} (${duration}ms)`);
        setError(data.error || 'Failed to fetch scoring rules');
        setRules([]);
        setLoading(false);
        return;
      }

      const fetchedRules = data.data || [];
      
      if (fetchedRules.length === 0) {
        console.warn(`[SCORING_RULES] ⚠️  DB returned 0 rules (${duration}ms) - fallback will be used if needed`);
        setError('No scoring rules configured for this organization');
        setRules([]);
      } else {
        console.log(`[SCORING_RULES] ✅ DB'den ${fetchedRules.length} kural yüklendi (${duration}ms)`);
        setError(null);
        setRules(fetchedRules);
      }
      
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.error(`[SCORING_RULES] ❌ Network error: ${err.message} (${duration}ms)`);
      setError(`Network error: ${err.message}`);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, _hasHydrated]);

  // Hydration tamamlanınca ve organization değişince yeniden fetch et
  useEffect(() => {
    if (_hasHydrated && organizationId) {
      fetchRules();
    }
  }, [_hasHydrated, organizationId, fetchRules]);

  // Sınav türü için varsayılan kuralı getir
  const getDefaultRule = useCallback((sinavTuru: SinavTuru): ScoringRuleDB | null => {
    // Önce varsayılan olanı bul
    const defaultRule = rules.find(r => r.sinav_turu === sinavTuru && r.is_default);
    if (defaultRule) return defaultRule;

    // Varsayılan yoksa aktif olan ilkini döndür
    const activeRule = rules.find(r => r.sinav_turu === sinavTuru && r.is_active);
    return activeRule || null;
  }, [rules]);

  // ID'ye göre kural getir
  const getRuleById = useCallback((id: string): ScoringRuleDB | null => {
    return rules.find(r => r.id === id) || null;
  }, [rules]);

  // Sınav türüne göre tüm kuralları getir
  const getRulesForType = useCallback((sinavTuru: SinavTuru): ScoringRuleDB[] => {
    return rules.filter(r => r.sinav_turu === sinavTuru && r.is_active);
  }, [rules]);

  // DB kuralını PuanlamaFormulu'na dönüştür
  const toPuanlamaFormulu = useCallback((rule: ScoringRuleDB): PuanlamaFormulu => {
    return {
      netHesaplama: rule.net_hesaplama as PuanlamaFormulu['netHesaplama'],
      yanlisKatsayisi: rule.yanlis_katsayisi,
      tabanPuan: rule.taban_puan,
      tavanPuan: rule.tavan_puan,
      formulTipi: rule.formul_tipi as PuanlamaFormulu['formulTipi'],
      dersKatsayilari: rule.ders_katsayilari || [],
      normalizasyon: rule.normalizasyon as PuanlamaFormulu['normalizasyon'],
      standartSapmaDahil: rule.standart_sapma_dahil,
      isDuzenlenebilir: !rule.is_system,
    };
  }, []);

  // Fallback ile birlikte kural getir (NULL döndürmez)
  const getDefaultRuleWithFallback = useCallback((sinavTuru: SinavTuru): PuanlamaFormulu => {
    const rule = getDefaultRule(sinavTuru);
    
    if (rule) return toPuanlamaFormulu(rule);
    
    // Fallback sadece DB'de kural yoksa çalışır
    console.warn('[SCORING_RULES] ⚠️ Using fallback for:', sinavTuru);
    return getHardcodedScoringRule(sinavTuru);
  }, [getDefaultRule, toPuanlamaFormulu]);

  return {
    rules,
    loading,
    error,
    getDefaultRule,
    getDefaultRuleWithFallback,
    getRuleById,
    getRulesForType,
    toPuanlamaFormulu,
    refresh: fetchRules,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS (Server-side veya API'de kullanım için)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DB puanlama kuralını wizard'ın beklediği formata dönüştür
 */
export function convertDBRuleToPuanlamaFormulu(rule: ScoringRuleDB): PuanlamaFormulu {
  return {
    netHesaplama: rule.net_hesaplama as PuanlamaFormulu['netHesaplama'],
    yanlisKatsayisi: rule.yanlis_katsayisi,
    tabanPuan: rule.taban_puan,
    tavanPuan: rule.tavan_puan,
    formulTipi: rule.formul_tipi as PuanlamaFormulu['formulTipi'],
    dersKatsayilari: rule.ders_katsayilari || [],
    normalizasyon: rule.normalizasyon as PuanlamaFormulu['normalizasyon'],
    standartSapmaDahil: rule.standart_sapma_dahil,
    isDuzenlenebilir: !rule.is_system,
  };
}

/**
 * Varsayılan (hardcoded) kuralları DB formatına dönüştür
 * (Fallback için kullanılır)
 */
export function getHardcodedScoringRule(sinavTuru: SinavTuru): PuanlamaFormulu {
  // Eğer DB'den kural alınamazsa bu varsayılanlar kullanılır
  const DEFAULTS: Record<string, PuanlamaFormulu> = {
    LGS: {
      netHesaplama: 'standart_3',
      yanlisKatsayisi: 3,
      tabanPuan: 100,
      tavanPuan: 500,
      formulTipi: 'lgs',
      dersKatsayilari: [
        { dersKodu: 'TUR', dersAdi: 'Türkçe', katsayi: 4.0 },
        { dersKodu: 'MAT', dersAdi: 'Matematik', katsayi: 4.0 },
        { dersKodu: 'FEN', dersAdi: 'Fen Bilimleri', katsayi: 4.0 },
        { dersKodu: 'SOS', dersAdi: 'T.C. İnkılap Tarihi', katsayi: 4.0 },
        { dersKodu: 'DIN', dersAdi: 'Din Kültürü', katsayi: 4.0 },
        { dersKodu: 'ING', dersAdi: 'İngilizce', katsayi: 4.0 },
      ],
      normalizasyon: 'yok',
      standartSapmaDahil: false,
      isDuzenlenebilir: true,
    },
    TYT: {
      netHesaplama: 'standart_4',
      yanlisKatsayisi: 4,
      tabanPuan: 0,
      tavanPuan: 500,
      formulTipi: 'tyt',
      dersKatsayilari: [
        { dersKodu: 'TYT_TUR', dersAdi: 'Türkçe', katsayi: 1.32 },
        { dersKodu: 'TYT_SOS', dersAdi: 'Sosyal Bilimler', katsayi: 1.36 },
        { dersKodu: 'TYT_MAT', dersAdi: 'Temel Matematik', katsayi: 1.32 },
        { dersKodu: 'TYT_FEN', dersAdi: 'Fen Bilimleri', katsayi: 1.36 },
      ],
      normalizasyon: 'standart_sapma',
      standartSapmaDahil: true,
      isDuzenlenebilir: false,
    },
    AYT_SAY: {
      netHesaplama: 'standart_4',
      yanlisKatsayisi: 4,
      tabanPuan: 0,
      tavanPuan: 500,
      formulTipi: 'ayt_say',
      dersKatsayilari: [
        { dersKodu: 'AYT_MAT', dersAdi: 'Matematik', katsayi: 3.00 },
        { dersKodu: 'AYT_FIZ', dersAdi: 'Fizik', katsayi: 2.85 },
        { dersKodu: 'AYT_KIM', dersAdi: 'Kimya', katsayi: 3.07 },
        { dersKodu: 'AYT_BIY', dersAdi: 'Biyoloji', katsayi: 3.07 },
      ],
      normalizasyon: 'standart_sapma',
      standartSapmaDahil: true,
      isDuzenlenebilir: false,
    },
  };

  return DEFAULTS[sinavTuru] || {
    netHesaplama: 'standart_4',
    yanlisKatsayisi: 4,
    tabanPuan: 0,
    tavanPuan: 100,
    formulTipi: 'linear',
    dersKatsayilari: [],
    normalizasyon: 'yok',
    standartSapmaDahil: false,
    isDuzenlenebilir: true,
  };
}

export default useScoringRules;
