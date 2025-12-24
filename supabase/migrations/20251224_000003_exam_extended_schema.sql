-- ============================================
-- AkademiHub - Exam Assessment Extended Schema
-- PHASE 1B: Additional Tables & Audit Trail
-- Version: 1.1
-- Date: 2024-12-24
-- ============================================
-- 
-- Bu migration mevcut şemaya şunları ekler:
-- 1. exam_templates - Yeniden kullanılabilir sınav şablonları
-- 2. exam_optical_raw_data - Ham optik okuyucu verileri (audit trail)
-- 3. exam_validation_errors - Validasyon hata kayıtları
-- 4. exam_analytics_snapshots - Periyodik analitik kayıtları
-- 5. exam_audit_log - Tüm değişikliklerin kaydı
--
-- OPTİK OKUYUCU GERÇEKLİĞİ:
-- Optik veriler HİÇBİR ZAMAN temiz değildir.
-- - Boş cevaplar
-- - Çift işaretlemeler
-- - Geçersiz işaretler
-- - Kayık cevaplar (index offset)
-- Ham veri HER ZAMAN ayrı saklanmalıdır.
-- ============================================

-- ============================================
-- 1. EXAM_TEMPLATES (Sınav Şablonları)
-- ============================================
-- Yeniden kullanılabilir sınav yapıları
-- Örn: "LGS Deneme Şablonu", "TYT Haftalık Deneme"
-- ============================================
CREATE TABLE IF NOT EXISTS exam_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
  
  -- Şablon Bilgileri
  name TEXT NOT NULL,                      -- 'LGS Standart Deneme Şablonu'
  code TEXT,                               -- 'LGS_DENEME_STD'
  description TEXT,
  
  -- Soru Yapısı (JSON)
  -- Format: [{"subject_code": "TUR", "count": 20, "start_no": 1, "end_no": 20}, ...]
  question_structure JSONB NOT NULL,
  
  -- Toplam Bilgiler
  total_questions INT NOT NULL,
  default_duration_minutes INT,
  
  -- Varsayılan Konu Eşleştirmesi (JSON)
  -- Önceden tanımlı soru-konu eşleştirmeleri
  default_topic_mapping JSONB,
  
  -- Zorluk Dağılımı (JSON)
  -- {"easy": 30, "medium": 40, "hard": 20}
  difficulty_distribution JSONB,
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,        -- Bu tip için varsayılan şablon
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_type_id, code)
);

-- ============================================
-- 2. EXAM_OPTICAL_RAW_DATA (Ham Optik Veri)
-- ============================================
-- Optik okuyucudan gelen HAM, İŞLENMEMİŞ veri
-- AUDIT TRAIL - asla silinmez, asla değiştirilmez
-- Doğrulama ve hata ayıklama için kritik
-- ============================================
CREATE TABLE IF NOT EXISTS exam_optical_raw_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- HAM VERİ (optik okuyucudan olduğu gibi)
  raw_data_string TEXT,                    -- "ABCD_ABCD..." format
  raw_data_json JSONB,                     -- {"1": "A", "2": "AB", ...}
  raw_data_binary BYTEA,                   -- İkili format (opsiyonel)
  
  -- Optik Okuyucu Bilgileri
  scanner_device TEXT,                     -- 'SCANMARK-5000'
  scanner_version TEXT,                    -- 'v2.1.3'
  scan_timestamp TIMESTAMPTZ,              -- Tarama zamanı
  scan_quality_score DECIMAL(5,4),         -- 0.0000 - 1.0000
  
  -- Form Bilgileri
  form_type TEXT,                          -- 'A', 'B', 'C', 'D'
  form_serial TEXT,                        -- Form seri numarası
  student_id_on_form TEXT,                 -- Formda yazılı öğrenci no
  
  -- Kalite Metrikleri
  total_marks_detected INT,                -- Algılanan toplam işaret
  ambiguous_marks_count INT DEFAULT 0,     -- Belirsiz işaret sayısı
  double_marks_count INT DEFAULT 0,        -- Çift işaretleme sayısı
  empty_marks_count INT DEFAULT 0,         -- Boş bırakılan sayısı
  invalid_marks_count INT DEFAULT 0,       -- Geçersiz işaret sayısı
  
  -- Hata Detayları (JSON)
  -- [{"question": 5, "type": "double_mark", "values": ["A", "B"]}, ...]
  mark_issues JSONB,
  
  -- Durum
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'error', 'manual_review'
  processed_at TIMESTAMPTZ,
  
  -- İmaj Referansı (opsiyonel)
  scan_image_url TEXT,                     -- Taranan formun görseli
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta (değiştirilemez - immutable)
  received_at TIMESTAMPTZ DEFAULT NOW(),
  received_by UUID REFERENCES app_users(id),
  
  -- Constraint: Bir öğrenci bir sınavda bir ham veri
  UNIQUE(exam_id, student_id)
);

-- ============================================
-- 3. EXAM_VALIDATION_ERRORS (Validasyon Hataları)
-- ============================================
-- Veri girişi sırasında tespit edilen tüm hatalar
-- Her hata kaydedilir, raporlanır
-- ============================================
CREATE TABLE IF NOT EXISTS exam_validation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  optical_raw_data_id UUID REFERENCES exam_optical_raw_data(id),
  
  -- Hata Bilgileri
  error_code TEXT NOT NULL,                -- 'DOUBLE_MARK', 'OVER_LIMIT', 'INVALID_ANSWER'
  error_type TEXT NOT NULL,                -- 'critical', 'warning', 'info'
  error_message TEXT NOT NULL,
  
  -- Etkilenen Veri
  question_no INT,                         -- Hangi soru
  subject_code TEXT,                       -- Hangi ders
  field_name TEXT,                         -- Hangi alan
  
  -- Değerler
  received_value TEXT,                     -- Alınan değer
  expected_value TEXT,                     -- Beklenen değer/format
  
  -- Çözüm
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES app_users(id),
  resolution_action TEXT,                  -- 'corrected', 'ignored', 'deleted'
  resolution_note TEXT,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. EXAM_ANALYTICS_SNAPSHOTS (Analitik Kayıtları)
-- ============================================
-- Periyodik analitik snapshot'ları
-- Trend analizi ve karşılaştırma için
-- AI yorumlama için hazır yapı
-- ============================================
CREATE TABLE IF NOT EXISTS exam_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Kapsam
  scope_type TEXT NOT NULL,                -- 'student', 'class', 'school', 'exam'
  scope_id TEXT NOT NULL,                  -- İlgili ID (student_id, class_name, vb.)
  
  -- Zaman
  snapshot_date DATE NOT NULL,
  snapshot_period TEXT,                    -- 'daily', 'weekly', 'monthly', 'exam'
  
  -- İlişkiler
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id),
  
  -- Temel Metrikler
  exam_count INT DEFAULT 0,                -- Katıldığı sınav sayısı
  avg_net DECIMAL(6,2),                    -- Ortalama net
  avg_score DECIMAL(8,4),                  -- Ortalama puan
  avg_percentile DECIMAL(5,2),             -- Ortalama yüzdelik
  
  -- Trend Verileri
  net_trend DECIMAL(6,2),                  -- Net değişimi (+/-)
  score_trend DECIMAL(8,4),                -- Puan değişimi
  rank_trend INT,                          -- Sıralama değişimi
  
  -- Ders Bazlı Performans (JSON)
  subject_performance JSONB,
  -- {"TUR": {"avg_net": 15.5, "trend": +0.5}, ...}
  
  -- Konu Bazlı Performans (JSON)
  topic_performance JSONB,
  -- {"topic_id": {"success_rate": 0.75, "trend": +0.05}, ...}
  
  -- Güçlü/Zayıf Yönler (JSON) - AI-ready
  strengths JSONB,                         -- ["Paragraf", "Üslü İfadeler"]
  weaknesses JSONB,                        -- ["Geometri", "Sözcükte Anlam"]
  
  -- Risk Analizi
  risk_level TEXT,                         -- 'low', 'medium', 'high'
  risk_factors JSONB,                      -- ["Düşen performans", "Yüksek devamsızlık"]
  
  -- İyileştirme Önerileri (AI-ready)
  improvement_priorities JSONB,
  -- [{"topic": "Geometri", "priority": "high", "reason": "3 sınav düşüş"}]
  
  study_recommendations JSONB,
  -- ["Günlük 20dk geometri çalışması", "Konu tekrarı: Üçgenler"]
  
  -- Tutarlılık Skoru
  consistency_score DECIMAL(5,4),          -- 0.0000 - 1.0000
  
  -- Karşılaştırma
  vs_class_avg DECIMAL(6,2),               -- Sınıf ortalamasına göre fark
  vs_school_avg DECIMAL(6,2),              -- Okul ortalamasına göre fark
  vs_previous DECIMAL(6,2),                -- Önceki döneme göre fark
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(scope_type, scope_id, snapshot_date, exam_id)
);

-- ============================================
-- 5. EXAM_AUDIT_LOG (Değişiklik Kaydı)
-- ============================================
-- Tüm kritik işlemlerin kaydı
-- Uyumluluk ve güvenlik için
-- ============================================
CREATE TABLE IF NOT EXISTS exam_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İşlem Bilgileri
  action TEXT NOT NULL,                    -- 'CREATE', 'UPDATE', 'DELETE', 'CALCULATE', 'PUBLISH'
  entity_type TEXT NOT NULL,               -- 'exam', 'answer', 'result', 'answer_key'
  entity_id UUID,
  
  -- İlişkiler
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  
  -- Değişiklik Detayları
  old_value JSONB,
  new_value JSONB,
  changed_fields TEXT[],                   -- ['answer_key', 'status']
  
  -- Ek Bilgiler
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Kim, ne zaman
  performed_by UUID REFERENCES app_users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id)
);

-- ============================================
-- 6. VALIDATION RULES TABLE
-- ============================================
-- Dinamik validasyon kuralları
-- Her sınav tipi için özelleştirilebilir
-- ============================================
CREATE TABLE IF NOT EXISTS exam_validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID REFERENCES exam_types(id) ON DELETE CASCADE,
  
  -- Kural Bilgileri
  rule_code TEXT NOT NULL,                 -- 'MAX_QUESTIONS', 'VALID_ANSWERS', 'NO_DOUBLE_MARK'
  rule_name TEXT NOT NULL,
  description TEXT,
  
  -- Kural Yapısı
  field_name TEXT,                         -- Hangi alana uygulanır
  rule_type TEXT NOT NULL,                 -- 'range', 'enum', 'regex', 'custom'
  
  -- Kural Parametreleri
  params JSONB NOT NULL,
  -- range: {"min": 0, "max": 20}
  -- enum: {"allowed": ["A", "B", "C", "D", "E"]}
  -- regex: {"pattern": "^[A-E]$"}
  
  -- Hata Bilgileri
  error_code TEXT NOT NULL,
  error_message_template TEXT NOT NULL,    -- 'Soru {question_no} için geçersiz cevap: {value}'
  error_severity TEXT DEFAULT 'error',     -- 'error', 'warning', 'info'
  
  -- Davranış
  is_blocking BOOLEAN DEFAULT true,        -- Hata kaydı engeller mi?
  auto_fix_action TEXT,                    -- 'set_null', 'set_default', 'skip'
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_type_id, rule_code)
);

-- ============================================
-- EXTENDED INDEXES
-- ============================================

-- exam_templates indexes
CREATE INDEX IF NOT EXISTS idx_exam_templates_type ON exam_templates(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_exam_templates_org ON exam_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_exam_templates_default ON exam_templates(exam_type_id, is_default) WHERE is_default = true;

-- exam_optical_raw_data indexes
CREATE INDEX IF NOT EXISTS idx_optical_raw_exam ON exam_optical_raw_data(exam_id);
CREATE INDEX IF NOT EXISTS idx_optical_raw_student ON exam_optical_raw_data(student_id);
CREATE INDEX IF NOT EXISTS idx_optical_raw_status ON exam_optical_raw_data(processing_status);
CREATE INDEX IF NOT EXISTS idx_optical_raw_org ON exam_optical_raw_data(organization_id);

-- exam_validation_errors indexes
CREATE INDEX IF NOT EXISTS idx_validation_errors_exam ON exam_validation_errors(exam_id);
CREATE INDEX IF NOT EXISTS idx_validation_errors_student ON exam_validation_errors(student_id);
CREATE INDEX IF NOT EXISTS idx_validation_errors_code ON exam_validation_errors(error_code);
CREATE INDEX IF NOT EXISTS idx_validation_errors_resolved ON exam_validation_errors(is_resolved);
CREATE INDEX IF NOT EXISTS idx_validation_errors_org ON exam_validation_errors(organization_id);

-- exam_analytics_snapshots indexes
CREATE INDEX IF NOT EXISTS idx_analytics_scope ON exam_analytics_snapshots(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON exam_analytics_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_analytics_exam ON exam_analytics_snapshots(exam_id);
CREATE INDEX IF NOT EXISTS idx_analytics_org ON exam_analytics_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON exam_analytics_snapshots(snapshot_period, snapshot_date);

-- exam_audit_log indexes
CREATE INDEX IF NOT EXISTS idx_audit_action ON exam_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON exam_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_exam ON exam_audit_log(exam_id);
CREATE INDEX IF NOT EXISTS idx_audit_performed ON exam_audit_log(performed_at);
CREATE INDEX IF NOT EXISTS idx_audit_org ON exam_audit_log(organization_id);

-- exam_validation_rules indexes
CREATE INDEX IF NOT EXISTS idx_validation_rules_type ON exam_validation_rules(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_active ON exam_validation_rules(exam_type_id, is_active) WHERE is_active = true;

-- ============================================
-- DEFAULT VALIDATION RULES
-- ============================================

-- Genel kurallar (tüm sınav tipleri için)
INSERT INTO exam_validation_rules (rule_code, rule_name, description, rule_type, params, error_code, error_message_template, error_severity)
VALUES
  ('VALID_ANSWER_OPTIONS', 'Geçerli Cevap Seçenekleri', 'Cevaplar sadece A, B, C, D, E veya boş olabilir', 'enum', 
   '{"allowed": ["A", "B", "C", "D", "E", null]}', 'INVALID_ANSWER', 
   'Soru {question_no} için geçersiz cevap: {value}. Sadece A, B, C, D, E kabul edilir.', 'error'),
  
  ('NO_DOUBLE_MARK', 'Çift İşaretleme Kontrolü', 'Bir soruda birden fazla seçenek işaretlenemez', 'custom',
   '{"max_marks_per_question": 1}', 'DOUBLE_MARK',
   'Soru {question_no} için çift işaretleme: {value}. Tek bir seçenek işaretlenmelidir.', 'error'),
  
  ('QUESTION_NO_IN_RANGE', 'Soru Numarası Aralığı', 'Soru numarası sınav limitleri içinde olmalı', 'range',
   '{"min": 1, "max_field": "exam.total_questions"}', 'QUESTION_OUT_OF_RANGE',
   'Soru numarası {question_no} geçersiz. 1-{max} arasında olmalıdır.', 'error')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE exam_templates IS 'Yeniden kullanılabilir sınav şablonları ve varsayılan yapılar';
COMMENT ON TABLE exam_optical_raw_data IS 'Ham optik okuyucu verileri - AUDIT TRAIL (immutable)';
COMMENT ON TABLE exam_validation_errors IS 'Veri girişi sırasında tespit edilen validasyon hataları';
COMMENT ON TABLE exam_analytics_snapshots IS 'Periyodik analitik kayıtları ve AI-ready performans verileri';
COMMENT ON TABLE exam_audit_log IS 'Tüm kritik işlemlerin değişiklik kaydı';
COMMENT ON TABLE exam_validation_rules IS 'Dinamik validasyon kuralları - sınav tipine göre özelleştirilebilir';

COMMENT ON COLUMN exam_optical_raw_data.raw_data_string IS 'Optik okuyucudan gelen ham string veri - DEĞİŞTİRİLEMEZ';
COMMENT ON COLUMN exam_optical_raw_data.mark_issues IS 'Tespit edilen işaretleme sorunları - çift işaret, belirsiz, vb.';
COMMENT ON COLUMN exam_analytics_snapshots.improvement_priorities IS 'AI tarafından yorumlanabilir iyileştirme öncelikleri';
COMMENT ON COLUMN exam_analytics_snapshots.study_recommendations IS 'AI tarafından üretilecek çalışma önerileri için yapı';

-- ============================================
-- END OF EXTENDED SCHEMA
-- ============================================
