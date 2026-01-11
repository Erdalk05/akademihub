-- ============================================================================
-- SCORING RULES - Mevcut Organizasyonlar İçin Seed Data
-- Varsa işlem yapma (ON CONFLICT DO NOTHING ile güvenli)
-- ============================================================================

-- Her organization için varsayılan puanlama kurallarını oluştur
DO $$
DECLARE
  org_record RECORD;
  existing_count INT;
BEGIN
  FOR org_record IN SELECT id FROM organizations WHERE is_active = true
  LOOP
    -- Bu kurum için zaten kural var mı kontrol et
    SELECT COUNT(*) INTO existing_count
    FROM scoring_rules
    WHERE organization_id = org_record.id;

    -- Yoksa oluştur
    IF existing_count = 0 THEN
      RAISE NOTICE 'Creating scoring rules for organization: %', org_record.id;
      PERFORM create_default_scoring_rules(org_record.id);
    ELSE
      RAISE NOTICE 'Organization % already has % scoring rules, skipping', org_record.id, existing_count;
    END IF;
  END LOOP;
END $$;

-- Sonuç raporu
SELECT 
  o.name AS kurum,
  COUNT(sr.id) AS kural_sayisi
FROM organizations o
LEFT JOIN scoring_rules sr ON sr.organization_id = o.id
WHERE o.is_active = true
GROUP BY o.id, o.name
ORDER BY o.name;

-- İstatistik
SELECT 
  sinav_turu,
  COUNT(*) AS toplam_kural,
  COUNT(DISTINCT organization_id) AS kurum_sayisi
FROM scoring_rules
GROUP BY sinav_turu
ORDER BY sinav_turu;
