-- ============================================
-- AkademiHub - Exam Assessment & Analytics System
-- PHASE 1: Core Database Schema
-- Version: 1.0
-- Date: 2024-12-24
-- ============================================
-- 
-- Bu şema LGS, TYT, AYT ve özel sınavlar için
-- kapsamlı bir değerlendirme sistemi oluşturur.
--
-- TASARIM PRENSİPLERİ:
-- 1. Optik okuyucu uyumlu (A,B,C,D,E formatı)
-- 2. Net hesaplama formülleri (sınava özel)
-- 3. Konu/kazanım bazlı analiz
-- 4. Binlerce öğrenci için optimize
-- 5. AI yorumlama için hazır yapı
-- 6. Önbellek desteği (hesaplama sonuçları)
-- ============================================

-- ============================================
-- 1. EXAM_TYPES (Sınav Tipleri)
-- ============================================
-- LGS, TYT, AYT gibi ana sınav kategorileri
-- Her tip kendi net hesaplama formülüne sahip
-- ============================================
CREATE TABLE IF NOT EXISTS exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,              -- 'LGS', 'TYT', 'AYT_SAY', 'AYT_EA', 'AYT_SOZ', 'AYT_DIL', 'DENEME', 'KURS'
  name TEXT NOT NULL,                      -- 'Liselere Giriş Sınavı'
  description TEXT,
  
  -- Net Hesaplama Formülü
  -- LGS: Net = Doğru - (Yanlış / 3)
  -- TYT/AYT: Net = Doğru - (Yanlış / 4)
  wrong_penalty_divisor DECIMAL(3,1) DEFAULT 4, -- Yanlış ceza böleni (3 veya 4)
  
  -- Puan Hesaplama Ağırlıkları (JSON)
  -- Örnek: {"turkce": 1.32, "matematik": 1.32, ...}
  score_weights JSONB,
  
  -- Sınav Yapısı
  total_questions INT,                     -- Toplam soru sayısı
  total_duration_minutes INT,              -- Toplam süre (dakika)
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. EXAM_SUBJECTS (Ders/Alan)
-- ============================================
-- Türkçe, Matematik, Fen Bilimleri, vb.
-- Sınav tipine göre farklı dersler olabilir
-- ============================================
CREATE TABLE IF NOT EXISTS exam_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID REFERENCES exam_types(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL,                      -- 'TUR', 'MAT', 'FEN', 'SOS', 'ING'
  name TEXT NOT NULL,                      -- 'Türkçe'
  short_name TEXT,                         -- 'Trk'
  
  -- Soru Dağılımı
  question_count INT NOT NULL,             -- Bu dersteki soru sayısı
  question_start_no INT NOT NULL,          -- Başlangıç soru numarası (1, 21, 41...)
  question_end_no INT NOT NULL,            -- Bitiş soru numarası (20, 40, 60...)
  
  -- Puan Ağırlığı
  weight DECIMAL(4,2) DEFAULT 1.0,         -- Puan hesaplama ağırlığı
  
  -- Sıralama
  display_order INT DEFAULT 0,
  
  -- Renk (UI için)
  color TEXT DEFAULT '#4F46E5',            -- HEX renk kodu
  icon TEXT,                               -- Lucide icon adı
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_type_id, code)
);

-- ============================================
-- 3. EXAM_TOPICS (Konular)
-- ============================================
-- Her dersin alt konuları
-- Hiyerarşik yapı (ana konu -> alt konu)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES exam_subjects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES exam_topics(id),  -- Üst konu (hiyerarşi)
  
  code TEXT NOT NULL,                      -- 'TUR_001', 'MAT_CEBIR_001'
  name TEXT NOT NULL,                      -- 'Sözcükte Anlam'
  description TEXT,
  
  -- Düzey (0 = ana konu, 1 = alt konu, 2 = detay)
  level INT DEFAULT 0,
  
  -- Sınıf seviyesi (opsiyonel)
  grade_level TEXT,                        -- '8', '9', '10', '11', '12'
  
  -- Sıralama
  display_order INT DEFAULT 0,
  
  -- Zorluk ortalaması (hesaplanır)
  avg_difficulty DECIMAL(3,2),             -- 0.00 - 1.00
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subject_id, code)
);

-- ============================================
-- 4. EXAM_LEARNING_OUTCOMES (Kazanımlar)
-- ============================================
-- MEB müfredatına uygun kazanımlar
-- Her soru bir veya birden fazla kazanıma bağlı
-- ============================================
CREATE TABLE IF NOT EXISTS exam_learning_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES exam_topics(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL,                      -- 'T.8.1.2' (MEB kazanım kodu)
  name TEXT NOT NULL,                      -- 'Sözcüğün mecaz anlamını kavrar'
  description TEXT,
  
  -- Kazanım Seviyesi (Bloom Taksonomisi)
  -- 1=Hatırlama, 2=Anlama, 3=Uygulama, 4=Analiz, 5=Değerlendirme, 6=Oluşturma
  cognitive_level INT DEFAULT 1 CHECK (cognitive_level BETWEEN 1 AND 6),
  
  -- Sıralama
  display_order INT DEFAULT 0,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(topic_id, code)
);

-- ============================================
-- 5. EXAMS (Sınavlar)
-- ============================================
-- Yapılan her sınav için kayıt
-- Deneme, kurs sınavı, resmi sınav vb.
-- ============================================
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id),
  academic_year_id UUID REFERENCES academic_years(id),
  
  -- Sınav Bilgileri
  name TEXT NOT NULL,                      -- 'LGS Deneme 1'
  code TEXT,                               -- 'LGS-2024-D01'
  description TEXT,
  
  -- Tarih/Saat
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  
  -- Sınav Detayları
  total_questions INT NOT NULL,            -- Toplam soru sayısı
  duration_minutes INT,                    -- Süre (dakika)
  
  -- Cevap Anahtarı (JSON)
  -- Format: {"1": "A", "2": "B", "3": "C", ...}
  answer_key JSONB,
  
  -- Soru-Konu Eşleştirmesi (JSON)
  -- Format: {"1": {"topic_id": "uuid", "difficulty": 0.7}, ...}
  question_mapping JSONB,
  
  -- Durum
  status TEXT DEFAULT 'draft',             -- 'draft', 'scheduled', 'active', 'completed', 'cancelled'
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- İstatistikler (hesaplanır ve cache'lenir)
  stats_calculated_at TIMESTAMPTZ,
  stats_cache JSONB,                       -- Hesaplanmış istatistikler
  
  -- Hedef Sınıflar (JSON array)
  target_classes TEXT[],                   -- ['8-A', '8-B', '8-C']
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. EXAM_QUESTIONS (Sorular)
-- ============================================
-- Her sınavdaki sorular
-- Konu, kazanım, zorluk bilgisi
-- ============================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES exam_subjects(id),
  topic_id UUID REFERENCES exam_topics(id),
  learning_outcome_id UUID REFERENCES exam_learning_outcomes(id),
  
  -- Soru Bilgileri
  question_no INT NOT NULL,                -- 1, 2, 3, ...
  correct_answer CHAR(1) NOT NULL,         -- 'A', 'B', 'C', 'D', 'E'
  
  -- Zorluk (0.0 = çok kolay, 1.0 = çok zor)
  difficulty DECIMAL(3,2) DEFAULT 0.5,
  
  -- Ayırt Edicilik (-1.0 ile 1.0 arası)
  discrimination DECIMAL(4,3),
  
  -- Soru Metni (opsiyonel - soru bankası için)
  question_text TEXT,
  question_image_url TEXT,
  
  -- Seçenek Metinleri (opsiyonel)
  options JSONB,                           -- {"A": "...", "B": "...", ...}
  
  -- İstatistikler (hesaplanır)
  total_answers INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  empty_count INT DEFAULT 0,
  
  -- Seçenek Dağılımı (hesaplanır)
  option_distribution JSONB,               -- {"A": 25, "B": 30, "C": 15, "D": 20, "E": 10}
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_id, question_no)
);

-- ============================================
-- 7. EXAM_STUDENT_ANSWERS (Öğrenci Cevapları)
-- ============================================
-- Optik okuyucu uyumlu cevap girişi
-- Her öğrencinin her soruya verdiği cevap
-- ============================================
CREATE TABLE IF NOT EXISTS exam_student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id),
  
  -- Cevap Bilgileri
  question_no INT NOT NULL,
  given_answer CHAR(1),                    -- 'A', 'B', 'C', 'D', 'E' veya NULL (boş)
  
  -- Doğruluk (hesaplanır)
  is_correct BOOLEAN,
  is_empty BOOLEAN DEFAULT false,
  
  -- Cevaplama Süresi (opsiyonel - dijital sınavlar için)
  answer_time_seconds INT,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_id, student_id, question_no)
);

-- ============================================
-- 8. EXAM_STUDENT_RESULTS (Öğrenci Sonuçları)
-- ============================================
-- Hesaplanmış ve cache'lenmiş sonuçlar
-- Net, puan, sıralama bilgileri
-- ============================================
CREATE TABLE IF NOT EXISTS exam_student_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Genel Sonuçlar
  total_correct INT DEFAULT 0,
  total_wrong INT DEFAULT 0,
  total_empty INT DEFAULT 0,
  total_net DECIMAL(6,2) DEFAULT 0,        -- Net = Doğru - (Yanlış / 3 veya 4)
  
  -- Puan (0-500 veya 0-100 ölçeği)
  raw_score DECIMAL(8,4),                  -- Ham puan
  scaled_score DECIMAL(8,4),               -- Ölçeklenmiş puan
  
  -- Sıralama
  rank_in_exam INT,                        -- Sınav içi sıralama
  rank_in_class INT,                       -- Sınıf içi sıralama
  rank_in_school INT,                      -- Okul içi sıralama
  percentile DECIMAL(5,2),                 -- Yüzdelik dilim
  
  -- Ders Bazlı Sonuçlar (JSON)
  -- Format: {"TUR": {"correct": 15, "wrong": 3, "empty": 2, "net": 14.0}, ...}
  subject_results JSONB,
  
  -- Konu Bazlı Sonuçlar (JSON)
  -- Format: {"topic_id": {"correct": 3, "wrong": 1, "total": 4, "rate": 0.75}, ...}
  topic_results JSONB,
  
  -- Kazanım Bazlı Sonuçlar (JSON)
  learning_outcome_results JSONB,
  
  -- AI Analiz Verileri (JSON)
  -- Güçlü/zayıf yönler, öneriler
  ai_analysis JSONB,
  
  -- Hesaplama Zamanı
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_id, student_id)
);

-- ============================================
-- 9. EXAM_CLASS_ANALYTICS (Sınıf Analitiği)
-- ============================================
-- Sınıf bazlı istatistikler (cache)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_class_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,                -- '8-A', '8-B'
  
  -- Katılım
  total_students INT DEFAULT 0,
  participated_students INT DEFAULT 0,
  participation_rate DECIMAL(5,2),
  
  -- Genel İstatistikler
  avg_correct DECIMAL(6,2),
  avg_wrong DECIMAL(6,2),
  avg_empty DECIMAL(6,2),
  avg_net DECIMAL(6,2),
  avg_score DECIMAL(8,4),
  
  -- Dağılım
  min_net DECIMAL(6,2),
  max_net DECIMAL(6,2),
  median_net DECIMAL(6,2),
  std_deviation DECIMAL(6,2),
  
  -- Ders Bazlı Ortalamalar (JSON)
  subject_averages JSONB,
  
  -- Konu Bazlı Başarı Oranları (JSON)
  topic_success_rates JSONB,
  
  -- Zorluk Analizi (JSON)
  difficulty_analysis JSONB,
  
  -- Hesaplama Zamanı
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_id, class_name)
);

-- ============================================
-- 10. EXAM_QUESTION_ANALYTICS (Soru Analitiği)
-- ============================================
-- Her soru için detaylı istatistikler
-- ============================================
CREATE TABLE IF NOT EXISTS exam_question_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  
  -- Yanıt İstatistikleri
  total_answers INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  empty_count INT DEFAULT 0,
  
  -- Oranlar
  correct_rate DECIMAL(5,4),               -- 0.0000 - 1.0000
  empty_rate DECIMAL(5,4),
  
  -- Seçenek Dağılımı
  option_a_count INT DEFAULT 0,
  option_b_count INT DEFAULT 0,
  option_c_count INT DEFAULT 0,
  option_d_count INT DEFAULT 0,
  option_e_count INT DEFAULT 0,
  
  -- Seçenek Oranları (JSON)
  option_rates JSONB,                      -- {"A": 0.25, "B": 0.30, ...}
  
  -- Ayırt Edicilik İndeksi
  discrimination_index DECIMAL(4,3),       -- -1.000 ile 1.000 arası
  
  -- Zorluk İndeksi (hesaplanmış)
  difficulty_index DECIMAL(4,3),           -- 0.000 - 1.000
  
  -- Sınıf Bazlı Başarı (JSON)
  class_breakdown JSONB,                   -- {"8-A": 0.75, "8-B": 0.60, ...}
  
  -- Hesaplama Zamanı
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_id, question_id)
);

-- ============================================
-- 11. EXAM_ANSWER_SHEETS (Optik Form Girişi)
-- ============================================
-- Toplu cevap girişi için
-- Optik okuyucu veya manuel giriş
-- ============================================
CREATE TABLE IF NOT EXISTS exam_answer_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Cevap Dizisi (JSON veya String)
  -- Format 1 (JSON): {"1": "A", "2": "B", "3": null, ...}
  -- Format 2 (String): "ABCD_ABCD..." (boş için _ )
  answers_json JSONB,
  answers_string TEXT,
  
  -- Giriş Bilgileri
  entry_method TEXT DEFAULT 'manual',      -- 'manual', 'optical', 'api'
  entry_device TEXT,                       -- 'web', 'mobile', 'scanner'
  
  -- Optik Okuyucu Verileri
  optical_scan_data JSONB,                 -- Ham optik veri
  optical_confidence DECIMAL(5,4),         -- Okuma güvenilirliği (0-1)
  
  -- İşleme Durumu
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  -- Hata/Uyarılar
  validation_errors JSONB,
  warnings JSONB,
  
  -- Multi-tenant
  organization_id UUID REFERENCES organizations(id),
  
  -- Meta
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exam_id, student_id)
);

-- ============================================
-- INDEXES (Performans İndeksleri)
-- ============================================

-- exam_types indexes
CREATE INDEX IF NOT EXISTS idx_exam_types_code ON exam_types(code);
CREATE INDEX IF NOT EXISTS idx_exam_types_org ON exam_types(organization_id);

-- exam_subjects indexes
CREATE INDEX IF NOT EXISTS idx_exam_subjects_type ON exam_subjects(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_org ON exam_subjects(organization_id);

-- exam_topics indexes
CREATE INDEX IF NOT EXISTS idx_exam_topics_subject ON exam_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_topics_parent ON exam_topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_exam_topics_org ON exam_topics(organization_id);

-- exam_learning_outcomes indexes
CREATE INDEX IF NOT EXISTS idx_exam_outcomes_topic ON exam_learning_outcomes(topic_id);
CREATE INDEX IF NOT EXISTS idx_exam_outcomes_org ON exam_learning_outcomes(organization_id);

-- exams indexes
CREATE INDEX IF NOT EXISTS idx_exams_type ON exams(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_org ON exams(organization_id);
CREATE INDEX IF NOT EXISTS idx_exams_academic_year ON exams(academic_year_id);

-- exam_questions indexes
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_subject ON exam_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_topic ON exam_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_org ON exam_questions(organization_id);

-- exam_student_answers indexes (KRITIK - binlerce kayıt)
CREATE INDEX IF NOT EXISTS idx_exam_answers_exam ON exam_student_answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_student ON exam_student_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_exam_student ON exam_student_answers(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_org ON exam_student_answers(organization_id);

-- exam_student_results indexes (KRITIK - sık sorgulama)
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_student_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_student_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_rank ON exam_student_results(exam_id, rank_in_exam);
CREATE INDEX IF NOT EXISTS idx_exam_results_net ON exam_student_results(exam_id, total_net DESC);
CREATE INDEX IF NOT EXISTS idx_exam_results_org ON exam_student_results(organization_id);

-- exam_class_analytics indexes
CREATE INDEX IF NOT EXISTS idx_exam_class_analytics_exam ON exam_class_analytics(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_class_analytics_org ON exam_class_analytics(organization_id);

-- exam_question_analytics indexes
CREATE INDEX IF NOT EXISTS idx_exam_question_analytics_exam ON exam_question_analytics(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_question_analytics_org ON exam_question_analytics(organization_id);

-- exam_answer_sheets indexes
CREATE INDEX IF NOT EXISTS idx_exam_sheets_exam ON exam_answer_sheets(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sheets_student ON exam_answer_sheets(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_sheets_processed ON exam_answer_sheets(is_processed);
CREATE INDEX IF NOT EXISTS idx_exam_sheets_org ON exam_answer_sheets(organization_id);

-- ============================================
-- COMMENTS (Tablo Açıklamaları)
-- ============================================
COMMENT ON TABLE exam_types IS 'Sınav tipleri (LGS, TYT, AYT vb.) ve net hesaplama formülleri';
COMMENT ON TABLE exam_subjects IS 'Ders/alan tanımları ve soru dağılımı';
COMMENT ON TABLE exam_topics IS 'Konu hiyerarşisi (ana konu -> alt konu)';
COMMENT ON TABLE exam_learning_outcomes IS 'MEB müfredatı kazanımları';
COMMENT ON TABLE exams IS 'Yapılan sınavlar ve cevap anahtarları';
COMMENT ON TABLE exam_questions IS 'Soru detayları, zorluk ve konu bağlantıları';
COMMENT ON TABLE exam_student_answers IS 'Öğrenci cevapları (optik okuyucu uyumlu)';
COMMENT ON TABLE exam_student_results IS 'Hesaplanmış öğrenci sonuçları (cache)';
COMMENT ON TABLE exam_class_analytics IS 'Sınıf bazlı analitik veriler (cache)';
COMMENT ON TABLE exam_question_analytics IS 'Soru bazlı analitik veriler';
COMMENT ON TABLE exam_answer_sheets IS 'Toplu cevap girişi ve optik form verileri';

-- ============================================
-- END OF PHASE 1 - Core Schema
-- ============================================
