-- ============================================================================
-- SCORING RULES - RLS DÜZELTMESİ
-- Service Role + Authenticated User uyumlu policies
-- ============================================================================

-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS scoring_rules_select ON scoring_rules;
DROP POLICY IF EXISTS scoring_rules_insert ON scoring_rules;
DROP POLICY IF EXISTS scoring_rules_update ON scoring_rules;
DROP POLICY IF EXISTS scoring_rules_delete ON scoring_rules;

-- ============================================================================
-- YENİ POLİCY: SELECT
-- Kurum kullanıcıları kendi verilerini + global kuralları görebilir
-- Service role her şeyi görebilir
-- ============================================================================
CREATE POLICY scoring_rules_select ON scoring_rules
  FOR SELECT
  USING (
    -- Service role bypass (API calls)
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Kendi kurum verileri
    organization_id::text = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'organization_id',
      current_setting('app.current_organization_id', true)
    )
    OR
    -- Global kurallar (organization_id NULL olanlar)
    organization_id IS NULL
  );

-- ============================================================================
-- YENİ POLİCY: INSERT
-- Service role ekleyebilir
-- Authenticated user kendi kurumuna ekleyebilir
-- ============================================================================
CREATE POLICY scoring_rules_insert ON scoring_rules
  FOR INSERT
  WITH CHECK (
    -- Service role bypass
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Kendi kurumuna ekleyebilir
    organization_id::text = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'organization_id',
      current_setting('app.current_organization_id', true)
    )
  );

-- ============================================================================
-- YENİ POLİCY: UPDATE
-- Service role güncelleyebilir
-- Authenticated user kendi kurum verilerini güncelleyebilir (sistem kayıtları hariç)
-- ============================================================================
CREATE POLICY scoring_rules_update ON scoring_rules
  FOR UPDATE
  USING (
    -- Service role bypass
    auth.jwt()->>'role' = 'service_role'
    OR
    (
      -- Kendi kurum verileri + sistem olmayan
      organization_id::text = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'organization_id',
        current_setting('app.current_organization_id', true)
      )
      AND is_system = false
    )
  );

-- ============================================================================
-- YENİ POLİCY: DELETE
-- Service role silebilir
-- Authenticated user kendi kurum verilerini silebilir (sistem kayıtları hariç)
-- ============================================================================
CREATE POLICY scoring_rules_delete ON scoring_rules
  FOR DELETE
  USING (
    -- Service role bypass
    auth.jwt()->>'role' = 'service_role'
    OR
    (
      -- Kendi kurum verileri + sistem olmayan
      organization_id::text = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'organization_id',
        current_setting('app.current_organization_id', true)
      )
      AND is_system = false
    )
  );

-- ============================================================================
-- YORUM
-- Bu policy'ler Service Role (API) ve Authenticated User (browser) için uyumlu.
-- organization_id artık header veya query param'dan alınabilir.
-- ============================================================================
