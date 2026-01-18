-- 20260118_ea_006_kazanim_tables.sql

CREATE TABLE IF NOT EXISTS ea_kazanimlar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    ders_id UUID NOT NULL REFERENCES ea_dersler(id) ON DELETE RESTRICT,
    kazanim_kodu VARCHAR(50) NOT NULL,
    kazanim_adi TEXT NOT NULL,
    aciklama TEXT,
    sinif_seviyesi INT,
    derinlik INT DEFAULT 1,
    ust_kazanim_id UUID REFERENCES ea_kazanimlar(id) ON DELETE SET NULL,
    sira_no INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unq_ea_kazanim_kod UNIQUE (organization_id, ders_id, kazanim_kodu)
);

CREATE TABLE IF NOT EXISTS ea_kazanim_sonuclari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sinav_id UUID NOT NULL REFERENCES ea_sinavlar(id) ON DELETE RESTRICT,
    katilimci_id UUID NOT NULL REFERENCES ea_katilimcilar(id) ON DELETE RESTRICT,
    kazanim_id UUID NOT NULL REFERENCES ea_kazanimlar(id) ON DELETE RESTRICT,
    soru_sayisi INT DEFAULT 0,
    dogru_sayisi INT DEFAULT 0,
    yanlis_sayisi INT DEFAULT 0,
    bos_sayisi INT DEFAULT 0,
    basari_yuzdesi NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unq_ea_kazanim_sonuc UNIQUE (katilimci_id, kazanim_id)
);

CREATE TABLE IF NOT EXISTS ea_degisiklik_loglari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    tablo_adi VARCHAR(100) NOT NULL,
    kayit_id UUID NOT NULL,
    islem_tipi VARCHAR(20) NOT NULL,
    eski_deger JSONB,
    yeni_deger JSONB,
    degisiklik_tarihi TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    kullanici_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_adresi VARCHAR(50),
    aciklama TEXT,
    CONSTRAINT chk_ea_log_islem CHECK (islem_tipi IN ('INSERT', 'UPDATE', 'DELETE', 'PUBLISH', 'HESAPLAMA', 'HATA'))
);

ALTER TABLE ea_kazanimlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ea_kazanim_sonuclari ENABLE ROW LEVEL SECURITY;
ALTER TABLE ea_degisiklik_loglari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ea_kazanimlar_select" ON ea_kazanimlar;
DROP POLICY IF EXISTS "ea_kazanimlar_insert" ON ea_kazanimlar;
DROP POLICY IF EXISTS "ea_kazanimlar_update" ON ea_kazanimlar;
DROP POLICY IF EXISTS "ea_kazanimlar_delete" ON ea_kazanimlar;

CREATE POLICY "ea_kazanimlar_select" ON ea_kazanimlar
    FOR SELECT USING (organization_id = current_setting('app.organization_id', true)::uuid);

CREATE POLICY "ea_kazanimlar_insert" ON ea_kazanimlar
    FOR INSERT WITH CHECK (
        organization_id = current_setting('app.organization_id', true)::uuid
        AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
    );

CREATE POLICY "ea_kazanimlar_update" ON ea_kazanimlar
    FOR UPDATE USING (
        organization_id = current_setting('app.organization_id', true)::uuid
        AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
    );

CREATE POLICY "ea_kazanimlar_delete" ON ea_kazanimlar
    FOR DELETE USING (
        organization_id = current_setting('app.organization_id', true)::uuid
        AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "ea_kazanim_sonuclari_select" ON ea_kazanim_sonuclari;
DROP POLICY IF EXISTS "ea_kazanim_sonuclari_insert" ON ea_kazanim_sonuclari;
DROP POLICY IF EXISTS "ea_kazanim_sonuclari_delete" ON ea_kazanim_sonuclari;

CREATE POLICY "ea_kazanim_sonuclari_select" ON ea_kazanim_sonuclari
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ea_katilimcilar k
            WHERE k.id = katilimci_id
            AND k.organization_id = current_setting('app.organization_id', true)::uuid
        )
    );

CREATE POLICY "ea_kazanim_sonuclari_insert" ON ea_kazanim_sonuclari
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ea_katilimcilar k
            WHERE k.id = katilimci_id
            AND k.organization_id = current_setting('app.organization_id', true)::uuid
        )
        AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
    );

CREATE POLICY "ea_kazanim_sonuclari_delete" ON ea_kazanim_sonuclari
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ea_katilimcilar k
            WHERE k.id = katilimci_id
            AND k.organization_id = current_setting('app.organization_id', true)::uuid
        )
        AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "ea_degisiklik_loglari_select" ON ea_degisiklik_loglari;
DROP POLICY IF EXISTS "ea_degisiklik_loglari_insert" ON ea_degisiklik_loglari;

CREATE POLICY "ea_degisiklik_loglari_select" ON ea_degisiklik_loglari
    FOR SELECT USING (
        organization_id = current_setting('app.organization_id', true)::uuid
        AND current_setting('app.user_role', true) IN ('admin', 'super_admin')
    );

CREATE POLICY "ea_degisiklik_loglari_insert" ON ea_degisiklik_loglari
    FOR INSERT WITH CHECK (
        organization_id = current_setting('app.organization_id', true)::uuid
    );

CREATE INDEX IF NOT EXISTS idx_ea_kazanimlar_org ON ea_kazanimlar(organization_id);
CREATE INDEX IF NOT EXISTS idx_ea_kazanimlar_ders ON ea_kazanimlar(ders_id);
CREATE INDEX IF NOT EXISTS idx_ea_kazanimlar_kod ON ea_kazanimlar(kazanim_kodu);
CREATE INDEX IF NOT EXISTS idx_ea_kazanimlar_ust ON ea_kazanimlar(ust_kazanim_id);
CREATE INDEX IF NOT EXISTS idx_ea_kazanimlar_sinif ON ea_kazanimlar(sinif_seviyesi);
CREATE INDEX IF NOT EXISTS idx_ea_kazanimlar_active ON ea_kazanimlar(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ea_kazanim_sonuclari_sinav ON ea_kazanim_sonuclari(sinav_id);
CREATE INDEX IF NOT EXISTS idx_ea_kazanim_sonuclari_katilimci ON ea_kazanim_sonuclari(katilimci_id);
CREATE INDEX IF NOT EXISTS idx_ea_kazanim_sonuclari_kazanim ON ea_kazanim_sonuclari(kazanim_id);

CREATE INDEX IF NOT EXISTS idx_ea_degisiklik_loglari_org ON ea_degisiklik_loglari(organization_id);
CREATE INDEX IF NOT EXISTS idx_ea_degisiklik_loglari_tablo ON ea_degisiklik_loglari(tablo_adi);
CREATE INDEX IF NOT EXISTS idx_ea_degisiklik_loglari_kayit ON ea_degisiklik_loglari(kayit_id);
CREATE INDEX IF NOT EXISTS idx_ea_degisiklik_loglari_tarih ON ea_degisiklik_loglari(degisiklik_tarihi);
CREATE INDEX IF NOT EXISTS idx_ea_degisiklik_loglari_kullanici ON ea_degisiklik_loglari(kullanici_id);

DROP TRIGGER IF EXISTS trg_ea_kazanimlar_updated ON ea_kazanimlar;
CREATE TRIGGER trg_ea_kazanimlar_updated
    BEFORE UPDATE ON ea_kazanimlar
    FOR EACH ROW EXECUTE FUNCTION trg_ea_updated_at();
