-- ============================================================================
-- SCORING RULES - COMPLETE VALIDATION & SETUP
-- This migration ensures scoring_rules is fully operational
-- ============================================================================

-- ============================================================================
-- 1. VERIFY TABLE EXISTS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'scoring_rules'
  ) THEN
    RAISE EXCEPTION 'scoring_rules table does not exist! Run 054_scoring_rules.sql first.';
  END IF;
  
  RAISE NOTICE '✅ scoring_rules table exists';
END $$;

-- ============================================================================
-- 2. VERIFY RLS IS ENABLED
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_class 
    WHERE relname = 'scoring_rules' 
    AND relrowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on scoring_rules!';
  END IF;
  
  RAISE NOTICE '✅ RLS is enabled on scoring_rules';
END $$;

-- ============================================================================
-- 3. UPDATE RLS POLICIES FOR SERVICE ROLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS scoring_rules_select ON scoring_rules;
DROP POLICY IF EXISTS scoring_rules_insert ON scoring_rules;
DROP POLICY IF EXISTS scoring_rules_update ON scoring_rules;
DROP POLICY IF EXISTS scoring_rules_delete ON scoring_rules;

-- SELECT: Service role + authenticated users
CREATE POLICY scoring_rules_select ON scoring_rules
  FOR SELECT
  USING (
    -- Service role has full access
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    -- Authenticated users see their org's rules + global rules
    (
      organization_id::text = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'organization_id',
        current_setting('app.current_organization_id', true)
      )
      OR organization_id IS NULL
    )
  );

-- INSERT: Service role + authenticated users
CREATE POLICY scoring_rules_insert ON scoring_rules
  FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    organization_id::text = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'organization_id',
      current_setting('app.current_organization_id', true)
    )
  );

-- UPDATE: Service role + authenticated users (non-system rules only)
CREATE POLICY scoring_rules_update ON scoring_rules
  FOR UPDATE
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    (
      organization_id::text = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'organization_id',
        current_setting('app.current_organization_id', true)
      )
      AND is_system = false
    )
  );

-- DELETE: Service role + authenticated users (non-system rules only)
CREATE POLICY scoring_rules_delete ON scoring_rules
  FOR DELETE
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    (
      organization_id::text = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'organization_id',
        current_setting('app.current_organization_id', true)
      )
      AND is_system = false
    )
  );

RAISE NOTICE '✅ RLS policies updated for service_role compatibility';

-- ============================================================================
-- 4. SEED DEFAULT RULES FOR ALL ORGANIZATIONS
-- ============================================================================

DO $$
DECLARE
  org_record RECORD;
  existing_count INT;
  created_count INT := 0;
BEGIN
  FOR org_record IN 
    SELECT id, name FROM organizations WHERE is_active = true
  LOOP
    -- Check if org already has rules
    SELECT COUNT(*) INTO existing_count
    FROM scoring_rules
    WHERE organization_id = org_record.id;

    IF existing_count = 0 THEN
      -- Create default rules using the function
      PERFORM create_default_scoring_rules(org_record.id);
      created_count := created_count + 1;
      RAISE NOTICE '✅ Created scoring rules for: %', org_record.name;
    ELSE
      RAISE NOTICE '⏭️  Organization % already has % rules, skipping', org_record.name, existing_count;
    END IF;
  END LOOP;
  
  IF created_count > 0 THEN
    RAISE NOTICE '✅ Created scoring rules for % organizations', created_count;
  ELSE
    RAISE NOTICE '✅ All organizations already have scoring rules';
  END IF;
END $$;

-- ============================================================================
-- 5. VALIDATION REPORT
-- ============================================================================

-- Check organizations without rules
DO $$
DECLARE
  orgs_without_rules INT;
BEGIN
  SELECT COUNT(*) INTO orgs_without_rules
  FROM organizations o
  WHERE o.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM scoring_rules sr 
    WHERE sr.organization_id = o.id
  );
  
  IF orgs_without_rules > 0 THEN
    RAISE WARNING '⚠️  % active organizations still have NO scoring rules!', orgs_without_rules;
  ELSE
    RAISE NOTICE '✅ All active organizations have scoring rules';
  END IF;
END $$;

-- Summary statistics
SELECT 
  '📊 SUMMARY: Scoring Rules by Organization' AS report;

SELECT 
  o.name AS organization,
  COUNT(sr.id) AS rule_count,
  COUNT(sr.id) FILTER (WHERE sr.is_default = true) AS default_rules,
  COUNT(sr.id) FILTER (WHERE sr.is_system = true) AS system_rules
FROM organizations o
LEFT JOIN scoring_rules sr ON sr.organization_id = o.id
WHERE o.is_active = true
GROUP BY o.id, o.name
ORDER BY o.name;

-- Rules by type
SELECT 
  '📊 SUMMARY: Rules by Exam Type' AS report;

SELECT 
  sinav_turu AS exam_type,
  COUNT(*) AS total_rules,
  COUNT(DISTINCT organization_id) AS org_count,
  COUNT(*) FILTER (WHERE is_default = true) AS default_count
FROM scoring_rules
GROUP BY sinav_turu
ORDER BY sinav_turu;

-- ============================================================================
-- 6. VERIFICATION CHECKLIST
-- ============================================================================

DO $$
DECLARE
  total_orgs INT;
  orgs_with_rules INT;
  total_rules INT;
  default_rules INT;
  policies_count INT;
BEGIN
  -- Count organizations
  SELECT COUNT(*) INTO total_orgs 
  FROM organizations WHERE is_active = true;
  
  -- Count orgs with rules
  SELECT COUNT(DISTINCT organization_id) INTO orgs_with_rules
  FROM scoring_rules;
  
  -- Count total rules
  SELECT COUNT(*) INTO total_rules FROM scoring_rules;
  
  -- Count default rules
  SELECT COUNT(*) INTO default_rules FROM scoring_rules WHERE is_default = true;
  
  -- Count policies
  SELECT COUNT(*) INTO policies_count 
  FROM pg_policies WHERE tablename = 'scoring_rules';
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════╗';
  RAISE NOTICE '║   SCORING RULES VALIDATION COMPLETE        ║';
  RAISE NOTICE '╚════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Active Organizations: %', total_orgs;
  RAISE NOTICE '✅ Organizations with Rules: %', orgs_with_rules;
  RAISE NOTICE '✅ Total Rules: %', total_rules;
  RAISE NOTICE '✅ Default Rules: %', default_rules;
  RAISE NOTICE '✅ RLS Policies: %', policies_count;
  RAISE NOTICE '';
  
  IF orgs_with_rules = total_orgs AND policies_count = 4 THEN
    RAISE NOTICE '🎉 ALL CHECKS PASSED - System is ready!';
  ELSE
    RAISE WARNING '⚠️  Some checks failed - review output above';
  END IF;
END $$;
