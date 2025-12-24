-- ============================================
-- AkademiHub - Exam Assessment Seed Data
-- PHASE 1B: Initial Data
-- Version: 1.0
-- Date: 2024-12-24
-- ============================================
-- 
-- LGS, TYT, AYT sınav tipleri ve dersleri
-- Standart Türk eğitim sistemi yapısı
-- ============================================

-- ============================================
-- 1. EXAM TYPES - Sınav Tipleri
-- ============================================

-- LGS (Liselere Giriş Sınavı)
INSERT INTO exam_types (code, name, description, wrong_penalty_divisor, total_questions, total_duration_minutes, score_weights) 
VALUES (
  'LGS',
  'Liselere Giriş Sınavı',
  '8. sınıf öğrencileri için merkezi sınav. 90 soru, 135 dakika.',
  3, -- LGS: Yanlış / 3
  90,
  135,
  '{"turkce": 1.0, "matematik": 1.0, "fen": 1.0, "inkilap": 1.0, "din": 1.0, "ingilizce": 1.0}'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- TYT (Temel Yeterlilik Testi)
INSERT INTO exam_types (code, name, description, wrong_penalty_divisor, total_questions, total_duration_minutes, score_weights) 
VALUES (
  'TYT',
  'Temel Yeterlilik Testi',
  'Üniversite sınavı 1. oturum. 120 soru, 135 dakika.',
  4, -- TYT: Yanlış / 4
  120,
  135,
  '{"turkce": 1.32, "sosyal": 1.36, "matematik": 1.32, "fen": 1.36}'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- AYT Sayısal
INSERT INTO exam_types (code, name, description, wrong_penalty_divisor, total_questions, total_duration_minutes, score_weights) 
VALUES (
  'AYT_SAY',
  'Alan Yeterlilik Testi - Sayısal',
  'Üniversite sınavı 2. oturum Sayısal. 80 soru, 180 dakika.',
  4,
  80,
  180,
  '{"matematik": 1.0, "fizik": 1.0, "kimya": 1.0, "biyoloji": 1.0}'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- AYT Eşit Ağırlık
INSERT INTO exam_types (code, name, description, wrong_penalty_divisor, total_questions, total_duration_minutes, score_weights) 
VALUES (
  'AYT_EA',
  'Alan Yeterlilik Testi - Eşit Ağırlık',
  'Üniversite sınavı 2. oturum Eşit Ağırlık. 80 soru, 180 dakika.',
  4,
  80,
  180,
  '{"edebiyat": 1.0, "tarih1": 1.0, "cografya1": 1.0, "matematik": 1.0}'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- AYT Sözel
INSERT INTO exam_types (code, name, description, wrong_penalty_divisor, total_questions, total_duration_minutes, score_weights) 
VALUES (
  'AYT_SOZ',
  'Alan Yeterlilik Testi - Sözel',
  'Üniversite sınavı 2. oturum Sözel. 80 soru, 180 dakika.',
  4,
  80,
  180,
  '{"edebiyat": 1.0, "tarih1": 1.0, "cografya1": 1.0, "tarih2": 1.0, "cografya2": 1.0, "felsefe": 1.0, "din": 1.0}'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- AYT Dil
INSERT INTO exam_types (code, name, description, wrong_penalty_divisor, total_questions, total_duration_minutes, score_weights) 
VALUES (
  'AYT_DIL',
  'Alan Yeterlilik Testi - Yabancı Dil',
  'Üniversite sınavı 2. oturum Yabancı Dil. 80 soru, 120 dakika.',
  4,
  80,
  120,
  '{"ydt": 1.0}'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- Deneme Sınavı (Genel)
INSERT INTO exam_types (code, name, description, wrong_penalty_divisor, total_questions, total_duration_minutes) 
VALUES (
  'DENEME',
  'Deneme Sınavı',
  'Kurum içi deneme sınavları. Esnek yapı.',
  4,
  NULL,
  NULL
) ON CONFLICT (code) DO NOTHING;

-- Kurs Sınavı
INSERT INTO exam_types (code, name, description, wrong_penalty_divisor, total_questions, total_duration_minutes) 
VALUES (
  'KURS',
  'Kurs Sınavı',
  'Kurs içi değerlendirme sınavları.',
  4,
  NULL,
  NULL
) ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. LGS SUBJECTS - LGS Dersleri
-- ============================================

-- LGS exam_type_id'yi al
DO $$
DECLARE
  lgs_type_id UUID;
  tyt_type_id UUID;
  ayt_say_type_id UUID;
BEGIN
  SELECT id INTO lgs_type_id FROM exam_types WHERE code = 'LGS';
  SELECT id INTO tyt_type_id FROM exam_types WHERE code = 'TYT';
  SELECT id INTO ayt_say_type_id FROM exam_types WHERE code = 'AYT_SAY';
  
  -- LGS Dersleri
  IF lgs_type_id IS NOT NULL THEN
    INSERT INTO exam_subjects (exam_type_id, code, name, short_name, question_count, question_start_no, question_end_no, weight, display_order, color, icon)
    VALUES 
      (lgs_type_id, 'TUR', 'Türkçe', 'Trk', 20, 1, 20, 1.0, 1, '#3B82F6', 'BookOpen'),
      (lgs_type_id, 'MAT', 'Matematik', 'Mat', 20, 21, 40, 1.0, 2, '#EF4444', 'Calculator'),
      (lgs_type_id, 'FEN', 'Fen Bilimleri', 'Fen', 20, 41, 60, 1.0, 3, '#10B981', 'Flask'),
      (lgs_type_id, 'INK', 'T.C. İnkılap Tarihi ve Atatürkçülük', 'İnk', 10, 61, 70, 1.0, 4, '#F59E0B', 'Landmark'),
      (lgs_type_id, 'DIN', 'Din Kültürü ve Ahlak Bilgisi', 'Din', 10, 71, 80, 1.0, 5, '#8B5CF6', 'BookHeart'),
      (lgs_type_id, 'ING', 'İngilizce', 'İng', 10, 81, 90, 1.0, 6, '#EC4899', 'Languages')
    ON CONFLICT (exam_type_id, code) DO NOTHING;
  END IF;
  
  -- TYT Dersleri
  IF tyt_type_id IS NOT NULL THEN
    INSERT INTO exam_subjects (exam_type_id, code, name, short_name, question_count, question_start_no, question_end_no, weight, display_order, color, icon)
    VALUES 
      (tyt_type_id, 'TUR', 'Türkçe', 'Trk', 40, 1, 40, 1.32, 1, '#3B82F6', 'BookOpen'),
      (tyt_type_id, 'SOS', 'Sosyal Bilimler', 'Sos', 20, 41, 60, 1.36, 2, '#F59E0B', 'Users'),
      (tyt_type_id, 'MAT', 'Temel Matematik', 'Mat', 40, 61, 100, 1.32, 3, '#EF4444', 'Calculator'),
      (tyt_type_id, 'FEN', 'Fen Bilimleri', 'Fen', 20, 101, 120, 1.36, 4, '#10B981', 'Flask')
    ON CONFLICT (exam_type_id, code) DO NOTHING;
  END IF;
  
  -- AYT Sayısal Dersleri
  IF ayt_say_type_id IS NOT NULL THEN
    INSERT INTO exam_subjects (exam_type_id, code, name, short_name, question_count, question_start_no, question_end_no, weight, display_order, color, icon)
    VALUES 
      (ayt_say_type_id, 'MAT', 'Matematik', 'Mat', 40, 1, 40, 1.0, 1, '#EF4444', 'Calculator'),
      (ayt_say_type_id, 'FIZ', 'Fizik', 'Fiz', 14, 41, 54, 1.0, 2, '#3B82F6', 'Atom'),
      (ayt_say_type_id, 'KIM', 'Kimya', 'Kim', 13, 55, 67, 1.0, 3, '#10B981', 'TestTube'),
      (ayt_say_type_id, 'BIY', 'Biyoloji', 'Biy', 13, 68, 80, 1.0, 4, '#8B5CF6', 'Dna')
    ON CONFLICT (exam_type_id, code) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 3. LGS SAMPLE TOPICS - Örnek Konular
-- ============================================

-- Türkçe Konuları
DO $$
DECLARE
  tur_subject_id UUID;
  mat_subject_id UUID;
  fen_subject_id UUID;
BEGIN
  -- LGS Türkçe subject_id
  SELECT s.id INTO tur_subject_id 
  FROM exam_subjects s 
  JOIN exam_types t ON s.exam_type_id = t.id 
  WHERE t.code = 'LGS' AND s.code = 'TUR';
  
  -- LGS Matematik subject_id
  SELECT s.id INTO mat_subject_id 
  FROM exam_subjects s 
  JOIN exam_types t ON s.exam_type_id = t.id 
  WHERE t.code = 'LGS' AND s.code = 'MAT';
  
  -- LGS Fen subject_id
  SELECT s.id INTO fen_subject_id 
  FROM exam_subjects s 
  JOIN exam_types t ON s.exam_type_id = t.id 
  WHERE t.code = 'LGS' AND s.code = 'FEN';
  
  -- Türkçe Ana Konuları
  IF tur_subject_id IS NOT NULL THEN
    INSERT INTO exam_topics (subject_id, code, name, level, display_order)
    VALUES 
      (tur_subject_id, 'TUR_001', 'Sözcükte Anlam', 0, 1),
      (tur_subject_id, 'TUR_002', 'Cümlede Anlam', 0, 2),
      (tur_subject_id, 'TUR_003', 'Paragraf', 0, 3),
      (tur_subject_id, 'TUR_004', 'Dil Bilgisi', 0, 4),
      (tur_subject_id, 'TUR_005', 'Yazım ve Noktalama', 0, 5),
      (tur_subject_id, 'TUR_006', 'Söz Sanatları', 0, 6),
      (tur_subject_id, 'TUR_007', 'Fiilimsiler', 0, 7),
      (tur_subject_id, 'TUR_008', 'Cümle Türleri', 0, 8)
    ON CONFLICT (subject_id, code) DO NOTHING;
  END IF;
  
  -- Matematik Ana Konuları
  IF mat_subject_id IS NOT NULL THEN
    INSERT INTO exam_topics (subject_id, code, name, level, display_order)
    VALUES 
      (mat_subject_id, 'MAT_001', 'Üslü İfadeler', 0, 1),
      (mat_subject_id, 'MAT_002', 'Kareköklü İfadeler', 0, 2),
      (mat_subject_id, 'MAT_003', 'Veri Analizi', 0, 3),
      (mat_subject_id, 'MAT_004', 'Basit Olayların Olasılığı', 0, 4),
      (mat_subject_id, 'MAT_005', 'Cebirsel İfadeler ve Özdeşlikler', 0, 5),
      (mat_subject_id, 'MAT_006', 'Doğrusal Denklemler', 0, 6),
      (mat_subject_id, 'MAT_007', 'Eşitsizlikler', 0, 7),
      (mat_subject_id, 'MAT_008', 'Üçgenler', 0, 8),
      (mat_subject_id, 'MAT_009', 'Eşlik ve Benzerlik', 0, 9),
      (mat_subject_id, 'MAT_010', 'Dönüşüm Geometrisi', 0, 10),
      (mat_subject_id, 'MAT_011', 'Geometrik Cisimler', 0, 11),
      (mat_subject_id, 'MAT_012', 'Doğrusal İlişkiler', 0, 12)
    ON CONFLICT (subject_id, code) DO NOTHING;
  END IF;
  
  -- Fen Bilimleri Ana Konuları
  IF fen_subject_id IS NOT NULL THEN
    INSERT INTO exam_topics (subject_id, code, name, level, display_order)
    VALUES 
      (fen_subject_id, 'FEN_001', 'Mevsimler ve İklim', 0, 1),
      (fen_subject_id, 'FEN_002', 'DNA ve Genetik Kod', 0, 2),
      (fen_subject_id, 'FEN_003', 'Basınç', 0, 3),
      (fen_subject_id, 'FEN_004', 'Madde ve Endüstri', 0, 4),
      (fen_subject_id, 'FEN_005', 'Basit Makineler', 0, 5),
      (fen_subject_id, 'FEN_006', 'Enerji Dönüşümleri ve Çevre Bilimi', 0, 6),
      (fen_subject_id, 'FEN_007', 'Elektrik Yükleri ve Elektrik Enerjisi', 0, 7),
      (fen_subject_id, 'FEN_008', 'Maddenin Halleri ve Isı', 0, 8),
      (fen_subject_id, 'FEN_009', 'Periyodik Sistem', 0, 9),
      (fen_subject_id, 'FEN_010', 'Kimyasal Tepkimeler', 0, 10),
      (fen_subject_id, 'FEN_011', 'Asitler ve Bazlar', 0, 11),
      (fen_subject_id, 'FEN_012', 'Canlılar ve Enerji İlişkileri', 0, 12)
    ON CONFLICT (subject_id, code) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 4. SAMPLE LEARNING OUTCOMES - Örnek Kazanımlar
-- ============================================

DO $$
DECLARE
  topic_id_sozcuk UUID;
  topic_id_uslu UUID;
BEGIN
  -- Sözcükte Anlam topic_id
  SELECT id INTO topic_id_sozcuk FROM exam_topics WHERE code = 'TUR_001' LIMIT 1;
  
  -- Üslü İfadeler topic_id
  SELECT id INTO topic_id_uslu FROM exam_topics WHERE code = 'MAT_001' LIMIT 1;
  
  -- Sözcükte Anlam Kazanımları
  IF topic_id_sozcuk IS NOT NULL THEN
    INSERT INTO exam_learning_outcomes (topic_id, code, name, cognitive_level, display_order)
    VALUES 
      (topic_id_sozcuk, 'T.8.1.1', 'Sözcüğün gerçek, mecaz ve terim anlamlarını ayırt eder.', 2, 1),
      (topic_id_sozcuk, 'T.8.1.2', 'Eş anlamlı ve zıt anlamlı sözcükleri belirler.', 1, 2),
      (topic_id_sozcuk, 'T.8.1.3', 'Eş sesli sözcükleri cümle içinde doğru kullanır.', 3, 3),
      (topic_id_sozcuk, 'T.8.1.4', 'Sözcükler arası anlam ilişkilerini kavrar.', 2, 4)
    ON CONFLICT (topic_id, code) DO NOTHING;
  END IF;
  
  -- Üslü İfadeler Kazanımları
  IF topic_id_uslu IS NOT NULL THEN
    INSERT INTO exam_learning_outcomes (topic_id, code, name, cognitive_level, display_order)
    VALUES 
      (topic_id_uslu, 'M.8.1.1', 'Bir tam sayının negatif kuvvetini anlar ve hesaplar.', 2, 1),
      (topic_id_uslu, 'M.8.1.2', 'Üslü ifadelerle çarpma ve bölme işlemleri yapar.', 3, 2),
      (topic_id_uslu, 'M.8.1.3', 'Ondalık gösterimi 10 un kuvvetleri olarak ifade eder.', 3, 3),
      (topic_id_uslu, 'M.8.1.4', 'Üslü ifadeleri karşılaştırır ve sıralar.', 4, 4)
    ON CONFLICT (topic_id, code) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- END OF SEED DATA
-- ============================================
