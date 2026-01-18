-- =============================================
-- EXAM ANALYTICS - RLS POLICIES
-- Migration: 20260118_ea_002_rls_policies.sql
-- Date: 2026-01-18
-- Purpose: Row Level Security policies for Exam Analytics tables
-- =============================================

-- SECURITY PRINCIPLE:
-- Multi-tenant isolation via organization_id
-- Every query must filter by current user's organization

-- =============================================
-- 1. ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE ea_dersler ENABLE ROW LEVEL SECURITY;
ALTER TABLE ea_sinavlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ea_sinav_dersler ENABLE ROW LEVEL SECURITY;
ALTER TABLE ea_cevap_anahtarlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE ea_katilimcilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ea_katilimci_cevaplar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ea_sonuclar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ea_ders_sonuclari ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. DERSLER POLICIES
-- =============================================

-- SELECT: Organization bazlı izolasyon
CREATE POLICY "dersler_select_org_isolation" ON ea_dersler
  FOR SELECT
  USING (organization_id = current_setting('app.organization_id', true)::uuid);

-- INSERT: Sadece admin, organization kontrolü
CREATE POLICY "dersler_insert_org_isolation" ON ea_dersler
  FOR INSERT
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- UPDATE: Sadece admin, organization kontrolü
CREATE POLICY "dersler_update_org_isolation" ON ea_dersler
  FOR UPDATE
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
  );

-- DELETE: Sadece admin, organization kontrolü
CREATE POLICY "dersler_delete_org_isolation" ON ea_dersler
  FOR DELETE
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- =============================================
-- 3. SINAVLAR POLICIES
-- =============================================

-- SELECT: Organization bazlı izolasyon
CREATE POLICY "sinavlar_select_org_isolation" ON ea_sinavlar
  FOR SELECT
  USING (organization_id = current_setting('app.organization_id', true)::uuid);

-- INSERT: Sadece admin
CREATE POLICY "sinavlar_insert_admin_only" ON ea_sinavlar
  FOR INSERT
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- UPDATE: Sadece admin
CREATE POLICY "sinavlar_update_admin_only" ON ea_sinavlar
  FOR UPDATE
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
  );

-- DELETE: Sadece admin
CREATE POLICY "sinavlar_delete_admin_only" ON ea_sinavlar
  FOR DELETE
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- =============================================
-- 4. SINAV_DERSLER POLICIES
-- =============================================

-- SELECT: Sınav üzerinden organization kontrolü
CREATE POLICY "sinav_dersler_select_via_sinav" ON ea_sinav_dersler
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
  );

-- INSERT: Sadece admin
CREATE POLICY "sinav_dersler_insert_admin_only" ON ea_sinav_dersler
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- UPDATE: Sadece admin
CREATE POLICY "sinav_dersler_update_admin_only" ON ea_sinav_dersler
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- DELETE: Sadece admin
CREATE POLICY "sinav_dersler_delete_admin_only" ON ea_sinav_dersler
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- =============================================
-- 5. CEVAP ANAHTARLARI POLICIES
-- =============================================

-- SELECT: Sınav üzerinden organization kontrolü
CREATE POLICY "cevap_anahtar_select_via_sinav" ON ea_cevap_anahtarlari
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
  );

-- INSERT: Sadece admin
CREATE POLICY "cevap_anahtar_insert_admin_only" ON ea_cevap_anahtarlari
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- UPDATE: Sadece admin
CREATE POLICY "cevap_anahtar_update_admin_only" ON ea_cevap_anahtarlari
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- DELETE: Sadece admin
CREATE POLICY "cevap_anahtar_delete_admin_only" ON ea_cevap_anahtarlari
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ea_sinavlar s
      WHERE s.id = sinav_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- =============================================
-- 6. KATILIMCILAR POLICIES
-- =============================================

-- SELECT: Organization bazlı izolasyon
CREATE POLICY "katilimcilar_select_org_isolation" ON ea_katilimcilar
  FOR SELECT
  USING (organization_id = current_setting('app.organization_id', true)::uuid);

-- INSERT: Sadece admin
CREATE POLICY "katilimcilar_insert_admin_only" ON ea_katilimcilar
  FOR INSERT
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- UPDATE: Sadece admin
CREATE POLICY "katilimcilar_update_admin_only" ON ea_katilimcilar
  FOR UPDATE
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
  );

-- DELETE: Sadece admin
CREATE POLICY "katilimcilar_delete_admin_only" ON ea_katilimcilar
  FOR DELETE
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- =============================================
-- 7. KATILIMCI CEVAPLAR POLICIES
-- =============================================

-- SELECT: Katılımcı üzerinden organization kontrolü
CREATE POLICY "katilimci_cevaplar_select_via_katilimci" ON ea_katilimci_cevaplar
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ea_katilimcilar k
      WHERE k.id = katilimci_id
        AND k.organization_id = current_setting('app.organization_id', true)::uuid
    )
  );

-- INSERT: Sadece admin
CREATE POLICY "katilimci_cevaplar_insert_admin_only" ON ea_katilimci_cevaplar
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ea_katilimcilar k
      WHERE k.id = katilimci_id
        AND k.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- UPDATE: Sadece admin
CREATE POLICY "katilimci_cevaplar_update_admin_only" ON ea_katilimci_cevaplar
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ea_katilimcilar k
      WHERE k.id = katilimci_id
        AND k.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- DELETE: Sadece admin
CREATE POLICY "katilimci_cevaplar_delete_admin_only" ON ea_katilimci_cevaplar
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ea_katilimcilar k
      WHERE k.id = katilimci_id
        AND k.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- =============================================
-- 8. SONUÇLAR POLICIES
-- =============================================

-- SELECT: Organization bazlı izolasyon
CREATE POLICY "sonuclar_select_org_isolation" ON ea_sonuclar
  FOR SELECT
  USING (organization_id = current_setting('app.organization_id', true)::uuid);

-- INSERT: Sadece admin
CREATE POLICY "sonuclar_insert_admin_only" ON ea_sonuclar
  FOR INSERT
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- UPDATE: Sadece admin
CREATE POLICY "sonuclar_update_admin_only" ON ea_sonuclar
  FOR UPDATE
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    organization_id = current_setting('app.organization_id', true)::uuid
  );

-- DELETE: Sadece admin
CREATE POLICY "sonuclar_delete_admin_only" ON ea_sonuclar
  FOR DELETE
  USING (
    organization_id = current_setting('app.organization_id', true)::uuid
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- =============================================
-- 9. DERS SONUÇLARI POLICIES
-- =============================================

-- SELECT: Sonuç üzerinden organization kontrolü
CREATE POLICY "ders_sonuclari_select_via_sonuc" ON ea_ders_sonuclari
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ea_sonuclar s
      WHERE s.id = sonuc_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
  );

-- INSERT: Sadece admin
CREATE POLICY "ders_sonuclari_insert_admin_only" ON ea_ders_sonuclari
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ea_sonuclar s
      WHERE s.id = sonuc_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- UPDATE: Sadece admin
CREATE POLICY "ders_sonuclari_update_admin_only" ON ea_ders_sonuclari
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ea_sonuclar s
      WHERE s.id = sonuc_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- DELETE: Sadece admin
CREATE POLICY "ders_sonuclari_delete_admin_only" ON ea_ders_sonuclari
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ea_sonuclar s
      WHERE s.id = sonuc_id
        AND s.organization_id = current_setting('app.organization_id', true)::uuid
    )
    AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
  );

-- =============================================
-- VERIFICATION
-- =============================================
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename LIKE 'ea_%';
  
  IF policy_count < 32 THEN
    RAISE WARNING 'Beklenen policy sayısı: 32+, Oluşan: %', policy_count;
  END IF;
  
  RAISE NOTICE '✓ Exam Analytics RLS policy''leri başarıyla oluşturuldu (% policy)', policy_count;
END $$;

-- =============================================
-- END OF MIGRATION
-- =============================================
