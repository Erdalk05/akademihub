-- K12 Enrollment System Tables
-- AkademiHub - Enrollment 6.0

-- Enrollments tablosu
CREATE TABLE IF NOT EXISTS enrollments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student JSONB NOT NULL,
  guardians JSONB NOT NULL,
  education JSONB NOT NULL,
  payment JSONB NOT NULL,
  contract JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  organization_id BIGINT REFERENCES organizations(id)
);

-- Installments tablosu
CREATE TABLE IF NOT EXISTS installments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id BIGINT REFERENCES enrollments(id) ON DELETE CASCADE,
  sira INT NOT NULL,
  tutar NUMERIC NOT NULL,
  vade_tarihi DATE NOT NULL,
  odeme_durumu TEXT DEFAULT 'Bekliyor' CHECK (odeme_durumu IN ('Bekliyor', 'Ödendi', 'Gecikmiş', 'İptal')),
  odeme_tarihi TIMESTAMPTZ,
  odenen_tutar NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollment documents tablosu (PDF, imzalı belgeler vb.)
CREATE TABLE IF NOT EXISTS enrollment_documents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id BIGINT REFERENCES enrollments(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'receipt', 'id_copy', 'photo', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollment logs tablosu (işlem geçmişi)
CREATE TABLE IF NOT EXISTS enrollment_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id BIGINT REFERENCES enrollments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON enrollments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_organization ON enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_installments_enrollment ON installments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(vade_tarihi);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(odeme_durumu);

-- Row Level Security
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view enrollments in their organization"
  ON enrollments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create enrollments in their organization"
  ON enrollments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update enrollments in their organization"
  ON enrollments FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view installments for their enrollments"
  ON installments FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage installments for their enrollments"
  ON installments FOR ALL
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_enrollment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_updated_at_trigger
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_updated_at();

-- Gecikmiş taksitleri güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION update_overdue_installments()
RETURNS void AS $$
BEGIN
  UPDATE installments
  SET odeme_durumu = 'Gecikmiş'
  WHERE vade_tarihi < CURRENT_DATE
    AND odeme_durumu = 'Bekliyor';
END;
$$ LANGUAGE plpgsql;

-- Views
CREATE OR REPLACE VIEW enrollment_summary AS
SELECT 
  e.id,
  e.student->>'firstName' || ' ' || e.student->>'lastName' AS student_name,
  e.student->>'tcNo' AS tc_no,
  e.education->>'programName' AS program,
  e.education->>'gradeName' AS grade,
  e.education->>'academicYear' AS academic_year,
  (e.payment->>'netFee')::NUMERIC AS net_fee,
  (e.payment->>'downPayment')::NUMERIC AS down_payment,
  (e.payment->>'installmentCount')::INT AS installment_count,
  e.status,
  e.created_at,
  (SELECT COUNT(*) FROM installments i WHERE i.enrollment_id = e.id AND i.odeme_durumu = 'Ödendi') AS paid_installments,
  (SELECT COALESCE(SUM(i.odenen_tutar), 0) FROM installments i WHERE i.enrollment_id = e.id AND i.odeme_durumu = 'Ödendi') AS total_paid
FROM enrollments e;

COMMENT ON TABLE enrollments IS 'K12 öğrenci kayıt ana tablosu';
COMMENT ON TABLE installments IS 'Taksit ödeme planı tablosu';
COMMENT ON TABLE enrollment_documents IS 'Kayıt belgeleri tablosu';
COMMENT ON TABLE enrollment_logs IS 'Kayıt işlem geçmişi tablosu';



