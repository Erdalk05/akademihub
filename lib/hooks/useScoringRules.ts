// ============================================================================
// useScoringRules Hook - Kurum Puanlama Kurallarını Yönetme
// DB'den puanlama kurallarını çeker ve wizard/scoring-engine'de kullanır
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
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

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/settings/scoring-rules?active=true');
      const data = await res.json();

      if (data.success) {
        setRules(data.data || []);
      } else {
        setError(data.error || 'Puanlama kuralları yüklenemedi');
      }
    } catch (err) {
      console.error('Scoring rules fetch error:', err);
      setError('Puanlama kuralları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

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

  return {
    rules,
    loading,
    error,
    getDefaultRule,
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
