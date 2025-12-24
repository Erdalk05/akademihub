-- ============================================
-- AkademiHub - Exam Analytics Production Schema
-- PHASE 3.1: Analytics Snapshot Cache Tables
-- Version: 1.0
-- Date: 2024-12-24
-- ============================================
-- 
-- Bu migration production-ready analytics için:
-- 1. exam_student_analytics - Öğrenci bazlı snapshot cache
-- 2. exam_risk_config - Risk ağırlıkları konfigürasyonu
-- 3. Analytics hesaplama sadece 1 kez yapılır
-- 4. API'ler snapshot okur, hesaplama yapmaz
-- ============================================

-- ============================================
-- 1. EXAM_STUDENT_ANALYTICS (Öğrenci Analitik Cache)
-- ============================================
-- Tek seferde hesaplanır, sonra okunur
-- Her sınav sonucu için tek kayıt
-- AI-ready JSON yapısı
-- ============================================
CREATE TABLE IF NOT EXISTS exam_student_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İlişkiler
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  result_id UUID REFERENCES exam_student_results(id) ON DELETE SET NULL,
  
  -- Öğrenci Bilgileri (denormalize - hızlı okuma için)
  student_no TEXT,
  student_name TEXT,
  class_name TEXT,
  
  -- Temel Metrikler
  total_net DECIMAL(6,2) NOT NULL,
  total_correct INT NOT NULL,
  total_wrong INT NOT NULL,
  total_empty INT NOT NULL,
  
  -- Sıralama
  rank_in_exam INT,
  rank_in_class INT,
  rank_in_school INT,
  percentile DECIMAL(5,2),
  
  -- Ders Performansı (JSON)
  -- {"TUR": {"net": 15.5, "correct": 17, "wrong": 2, "empty": 1, "rate": 0.85, "rank": 5}}
  subject_performance JSONB NOT NULL DEFAULT '{}',
  
  -- Konu Performansı (JSON)
  -- {"topic_id": {"name": "Sözcükte Anlam", "correct": 3, "total": 4, "rate": 0.75, "status": "good"}}
  topic_performance JSONB NOT NULL DEFAULT '{}',
  
  -- Kazanım Performansı (JSON)
  -- {"outcome_id": {"name": "T.8.1.1", "achieved": true, "rate": 0.80}}
  outcome_performance JSONB NOT NULL DEFAULT '{}',
  
  -- Zorluk Analizi (JSON)
  -- {"easy": {"correct": 20, "total": 25, "rate": 0.80}, "medium": {...}, "hard": {...}}
  difficulty_performance JSONB NOT NULL DEFAULT '{}',
  
  -- Tutarlılık Analizi
  consistency_score DECIMAL(5,4),           -- 0.0000 - 1.0000
  
  -- Güçlü Yönler (AI-ready JSON array)
  -- [{"topic": "Paragraf", "subject": "TUR", "rate": 0.90, "rank": 3}]
  strengths JSONB NOT NULL DEFAULT '[]',
  
  -- Zayıf Yönler (AI-ready JSON array)
  -- [{"topic": "Geometri", "subject": "MAT", "rate": 0.30, "priority": "high"}]
  weaknesses JSONB NOT NULL DEFAULT '[]',
  
  -- İyileştirme Öncelikleri (AI-ready)
  -- [{"topic": "Geometri", "priority": 1, "reason": "Düşük başarı + yüksek soru ağırlığı"}]
  improvement_priorities JSONB NOT NULL DEFAULT '[]',
  
  -- Çalışma Önerileri (AI-ready)
  -- ["Günlük 15dk geometri çalışması", "Üçgenler konusunu tekrar et"]
  study_recommendations JSONB NOT NULL DEFAULT '[]',
  
  -- Risk Analizi
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_score DECIMAL(5,4),                  -- 0.0000 - 1.0000
  risk_factors JSONB NOT NULL DEFAULT '[]', -- ["Düşen trend", "Düşük tutarlılık"]
  
  -- Karşılaştırmalar
  vs_class_avg DECIMAL(6,2),                -- Sınıf ortalamasına göre (+/-)
  vs_school_avg DECIMAL(6,2),               -- Okul ortalamasına göre
  vs_previous_exam DECIMAL(6,2),            -- Önceki sınava göre
  
  -- Trend (son 5 sınav)
  net_trend JSONB,                          -- [45.5, 48.0, 47.0, 50.0, 52.0]
  rank_trend JSONB,                         -- [15, 12, 13, 10, 8]
  trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable')),
  trend_change DECIMAL(6,2),                -- Son 2 sınav arasındaki fark
  
  -- Genel Değerlendirme (AI interpretation ready)
  overall_assessment TEXT CHECK (overall_assessment IN (
    'excellent', 'good', 'average', 'below_average', 'needs_improvement'
  )),
  assessment_summary TEXT,                  -- "Öğrenci genel olarak iyi performans gösteriyor..."
  
  -- Hesaplama Metadata
  calculation_version TEXT DEFAULT '1.0',   -- Algoritma versiyonu
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculation_duration_ms INT,              -- Hesaplama süresi (ms)
  
  -- Cache Kontrolü
  is_stale BOOLEAN DEFAULT false,           -- Yeniden hesaplama gerekiyor mu?
  invalidated_at TIMESTAMPTZ,
  invalidation_reason TEXT,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  academic_year_id UUID REFERENCES academic_years(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Her öğrenci her sınavda tek analitik kaydı
  UNIQUE(exam_id, student_id)
);

-- ============================================
-- 2. EXAM_RISK_CONFIG (Risk Konfigürasyonu)
-- ============================================
-- Risk hesaplama ağırlıkları
-- Dinamik olarak ayarlanabilir
-- ============================================
CREATE TABLE IF NOT EXISTS exam_risk_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Konfigürasyon Adı
  config_name TEXT NOT NULL DEFAULT 'default',
  config_version TEXT NOT NULL DEFAULT '1.0',
  description TEXT,
  
  -- Risk Faktör Ağırlıkları (0.0 - 1.0)
  weight_net_drop DECIMAL(4,3) DEFAULT 0.25,          -- Net düşüşü ağırlığı
  weight_consistency DECIMAL(4,3) DEFAULT 0.20,       -- Tutarlılık ağırlığı
  weight_weak_topics DECIMAL(4,3) DEFAULT 0.20,       -- Zayıf konu sayısı ağırlığı
  weight_difficulty_gap DECIMAL(4,3) DEFAULT 0.15,    -- Zorluk performans farkı
  weight_rank_drop DECIMAL(4,3) DEFAULT 0.10,         -- Sıralama düşüşü
  weight_empty_rate DECIMAL(4,3) DEFAULT 0.10,        -- Boş bırakma oranı
  
  -- Risk Eşikleri
  threshold_net_drop_critical DECIMAL(6,2) DEFAULT 5.0,   -- 5+ net düşüşü kritik
  threshold_net_drop_warning DECIMAL(6,2) DEFAULT 2.0,    -- 2+ net düşüşü uyarı
  threshold_weak_topic_rate DECIMAL(4,3) DEFAULT 0.40,    -- %40 altı zayıf sayılır
  threshold_consistency_low DECIMAL(4,3) DEFAULT 0.60,    -- %60 altı tutarsız
  
  -- Risk Seviye Eşikleri
  threshold_risk_high DECIMAL(4,3) DEFAULT 0.70,      -- 0.70+ yüksek risk
  threshold_risk_medium DECIMAL(4,3) DEFAULT 0.40,    -- 0.40-0.70 orta risk
  
  -- Trend Ayarları
  trend_period_count INT DEFAULT 5,                   -- Son kaç sınav trendde
  trend_significant_change DECIMAL(4,2) DEFAULT 2.0,  -- Anlamlı değişim eşiği
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  exam_type_id UUID REFERENCES exam_types(id),        -- Sınav tipine özel config
  
  -- Meta
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, config_name, exam_type_id)
);

-- ============================================
-- 3. EXAM_ANALYTICS_QUEUE (Hesaplama Kuyruğu)
-- ============================================
-- Büyük veri için asenkron hesaplama
-- Batch işlem desteği
-- ============================================
CREATE TABLE IF NOT EXISTS exam_analytics_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İş Bilgileri
  job_type TEXT NOT NULL CHECK (job_type IN (
    'student_analytics',   -- Tek öğrenci
    'exam_analytics',      -- Tüm sınav
    'class_analytics',     -- Sınıf bazlı
    'trend_update',        -- Trend güncelleme
    'bulk_recalculate'     -- Toplu yeniden hesaplama
  )),
  
  -- Hedef
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_name TEXT,
  
  -- Parametreler
  params JSONB DEFAULT '{}',
  
  -- Durum
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  priority INT DEFAULT 5,                   -- 1=en yüksek, 10=en düşük
  
  -- İlerleme
  progress_percent INT DEFAULT 0,
  progress_message TEXT,
  
  -- Sonuç
  result JSONB,
  error_message TEXT,
  error_stack TEXT,
  
  -- Zamanlama
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Retry
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- exam_student_analytics indexes (KRITIK - sık sorgulama)
CREATE INDEX IF NOT EXISTS idx_student_analytics_exam ON exam_student_analytics(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_analytics_student ON exam_student_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_student_analytics_class ON exam_student_analytics(class_name);
CREATE INDEX IF NOT EXISTS idx_student_analytics_rank ON exam_student_analytics(exam_id, rank_in_exam);
CREATE INDEX IF NOT EXISTS idx_student_analytics_risk ON exam_student_analytics(risk_level);
CREATE INDEX IF NOT EXISTS idx_student_analytics_stale ON exam_student_analytics(is_stale) WHERE is_stale = true;
CREATE INDEX IF NOT EXISTS idx_student_analytics_org ON exam_student_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_analytics_year ON exam_student_analytics(academic_year_id);

-- exam_risk_config indexes
CREATE INDEX IF NOT EXISTS idx_risk_config_org ON exam_risk_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_config_type ON exam_risk_config(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_risk_config_default ON exam_risk_config(is_default) WHERE is_default = true;

-- exam_analytics_queue indexes
CREATE INDEX IF NOT EXISTS idx_analytics_queue_status ON exam_analytics_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_analytics_queue_exam ON exam_analytics_queue(exam_id);
CREATE INDEX IF NOT EXISTS idx_analytics_queue_scheduled ON exam_analytics_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_analytics_queue_org ON exam_analytics_queue(organization_id);

-- ============================================
-- DEFAULT RISK CONFIG
-- ============================================

INSERT INTO exam_risk_config (
  config_name, 
  description, 
  is_default,
  weight_net_drop,
  weight_consistency,
  weight_weak_topics,
  weight_difficulty_gap,
  weight_rank_drop,
  weight_empty_rate
) VALUES (
  'default',
  'Varsayılan risk hesaplama konfigürasyonu. Tüm sınav tipleri için geçerlidir.',
  true,
  0.25,  -- Net düşüşü en önemli
  0.20,  -- Tutarlılık
  0.20,  -- Zayıf konular
  0.15,  -- Zorluk farkı
  0.10,  -- Sıralama düşüşü
  0.10   -- Boş bırakma
) ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE exam_student_analytics IS 'Öğrenci analitik snapshot cache - Tek seferde hesaplanır, sonra okunur';
COMMENT ON TABLE exam_risk_config IS 'Risk hesaplama ağırlıkları ve eşikleri - Dinamik konfigürasyon';
COMMENT ON TABLE exam_analytics_queue IS 'Büyük veri için asenkron analytics hesaplama kuyruğu';

COMMENT ON COLUMN exam_student_analytics.is_stale IS 'true ise yeniden hesaplama gerekiyor';
COMMENT ON COLUMN exam_student_analytics.calculation_version IS 'Hangi algoritma versiyonu ile hesaplandı';
COMMENT ON COLUMN exam_student_analytics.strengths IS 'AI-ready güçlü yönler listesi';
COMMENT ON COLUMN exam_student_analytics.weaknesses IS 'AI-ready zayıf yönler listesi';
COMMENT ON COLUMN exam_student_analytics.improvement_priorities IS 'AI-ready iyileştirme öncelikleri';
COMMENT ON COLUMN exam_student_analytics.study_recommendations IS 'AI-ready çalışma önerileri';

COMMENT ON COLUMN exam_risk_config.weight_net_drop IS 'Net düşüşü risk faktörü ağırlığı (0-1)';
COMMENT ON COLUMN exam_risk_config.threshold_risk_high IS 'Bu değerin üstü yüksek risk sayılır';

-- ============================================
-- TRIGGER: Sonuç değişince analytics stale yap
-- ============================================
CREATE OR REPLACE FUNCTION mark_analytics_stale()
RETURNS TRIGGER AS $$
BEGIN
  -- Sonuç güncellenince ilgili analytics'i stale yap
  UPDATE exam_student_analytics
  SET 
    is_stale = true,
    invalidated_at = NOW(),
    invalidation_reason = 'Result updated'
  WHERE exam_id = NEW.exam_id AND student_id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: exam_student_results güncellenince
DROP TRIGGER IF EXISTS trg_result_update_stale_analytics ON exam_student_results;
CREATE TRIGGER trg_result_update_stale_analytics
  AFTER UPDATE ON exam_student_results
  FOR EACH ROW
  EXECUTE FUNCTION mark_analytics_stale();

-- ============================================
-- FUNCTION: Get or Calculate Analytics
-- ============================================
-- Bu fonksiyon snapshot varsa okur, yoksa hesaplama tetikler
-- ============================================
CREATE OR REPLACE FUNCTION get_student_analytics(
  p_exam_id UUID,
  p_student_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_analytics JSONB;
  v_is_stale BOOLEAN;
BEGIN
  -- Mevcut analytics'i kontrol et
  SELECT 
    to_jsonb(esa.*),
    esa.is_stale
  INTO v_analytics, v_is_stale
  FROM exam_student_analytics esa
  WHERE esa.exam_id = p_exam_id AND esa.student_id = p_student_id;
  
  IF v_analytics IS NULL THEN
    -- Henüz hesaplanmamış - queue'ya ekle ve null dön
    INSERT INTO exam_analytics_queue (job_type, exam_id, student_id, priority)
    VALUES ('student_analytics', p_exam_id, p_student_id, 1)
    ON CONFLICT DO NOTHING;
    
    RETURN jsonb_build_object(
      'status', 'pending',
      'message', 'Analytics hesaplanıyor...'
    );
  END IF;
  
  IF v_is_stale THEN
    -- Stale - arka planda güncelleme tetikle
    INSERT INTO exam_analytics_queue (job_type, exam_id, student_id, priority, params)
    VALUES ('student_analytics', p_exam_id, p_student_id, 3, '{"reason": "stale"}')
    ON CONFLICT DO NOTHING;
    
    -- Ama mevcut veriyi yine de dön
    RETURN v_analytics || jsonb_build_object('_stale', true);
  END IF;
  
  RETURN v_analytics;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF PHASE 3.1
-- ============================================
