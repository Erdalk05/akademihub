-- ============================================================================
-- EXAM VIEWS - DÜZELTILMIŞ VE ÇALIŞAN VERSİYON
-- Bu migration, sınav analytics view'larını oluşturur/güncelleor
-- ============================================================================
-- SORUNLAR VE ÇÖZÜMLERİ:
-- 1. subject kolonu yoktu -> KALDIRILDI, ders bilgisi exam_sections'tan
-- 2. student_exam_results yerine exam_participants kullanılıyor
-- 3. Placeholder'lar kaldırıldı, gerçek UUID sorguları
-- ============================================================================

-- ============================================================================
-- 1. EXAM_PARTICIPATION_SUMMARY VIEW
-- Her sınav için katılım özeti
-- ============================================================================
DROP VIEW IF EXISTS exam_participation_summary CASCADE;

CREATE VIEW exam_participation_summary AS
SELECT
  e.id AS exam_id,
  e.organization_id,
  e.name AS exam_name,
  e.exam_date,
  e.total_questions,
  
  -- Toplam katılımcı
  COUNT(ep.id) AS total_participants,
  
  -- Asil öğrenci sayısı (student_id olan)
  COUNT(CASE WHEN ep.participant_type = 'institution' OR ep.student_id IS NOT NULL THEN 1 END) AS institution_count,
  
  -- Misafir sayısı
  COUNT(CASE WHEN ep.participant_type = 'guest' OR (ep.student_id IS NULL AND ep.guest_name IS NOT NULL) THEN 1 END) AS guest_count,
  
  -- Eşleşen sayısı
  COUNT(CASE WHEN ep.student_id IS NOT NULL THEN 1 END) AS matched_count,
  
  -- Eşleşmeyen sayısı
  COUNT(CASE WHEN ep.student_id IS NULL THEN 1 END) AS unmatched_count,
  
  -- Katılım oranı (yüzde)
  CASE 
    WHEN COUNT(ep.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN ep.student_id IS NOT NULL THEN 1 END)::DECIMAL / COUNT(ep.id)) * 100, 1)
    ELSE 0 
  END AS match_rate

FROM exams e
LEFT JOIN exam_participants ep ON ep.exam_id = e.id
GROUP BY e.id, e.organization_id, e.name, e.exam_date, e.total_questions;

COMMENT ON VIEW exam_participation_summary IS 'Sınav katılım özeti - asil/misafir/eşleşen sayıları';

-- ============================================================================
-- 2. EXAM_STATISTICS_SUMMARY VIEW
-- Her sınav için istatistik özeti
-- ============================================================================
DROP VIEW IF EXISTS exam_statistics_summary CASCADE;

CREATE VIEW exam_statistics_summary AS
SELECT
  e.id AS exam_id,
  e.organization_id,
  e.name AS exam_name,
  e.exam_date,
  
  -- Temel istatistikler
  COUNT(ep.id) AS participant_count,
  ROUND(AVG(ep.net), 2) AS avg_net,
  ROUND(MAX(ep.net), 2) AS max_net,
  ROUND(MIN(CASE WHEN ep.net > 0 THEN ep.net END), 2) AS min_net,
  
  -- Doğru/Yanlış/Boş ortalamaları
  ROUND(AVG(ep.correct_count), 1) AS avg_correct,
  ROUND(AVG(ep.wrong_count), 1) AS avg_wrong,
  ROUND(AVG(ep.empty_count), 1) AS avg_empty,
  
  -- Standart sapma
  ROUND(STDDEV(ep.net), 2) AS std_deviation,
  
  -- Homojenlik oranı (düşük std sapma = yüksek homojenlik)
  CASE 
    WHEN MAX(ep.net) > 0 AND STDDEV(ep.net) IS NOT NULL THEN 
      GREATEST(0, ROUND(100 - (STDDEV(ep.net) / MAX(ep.net)) * 100, 0))
    ELSE 0 
  END AS homogeneity_rate,
  
  -- Puan ortalaması
  ROUND(AVG(ep.score), 2) AS avg_score

FROM exams e
LEFT JOIN exam_participants ep ON ep.exam_id = e.id
WHERE ep.net IS NOT NULL AND ep.net > 0
GROUP BY e.id, e.organization_id, e.name, e.exam_date;

COMMENT ON VIEW exam_statistics_summary IS 'Sınav istatistik özeti - net, doğru/yanlış ortalamaları';

-- ============================================================================
-- 3. EXAM_RISK_SUMMARY VIEW
-- Her sınav için risk durumu
-- Risk hesaplama: Ortalama net'e göre
-- - high: avg_net < 30
-- - medium: avg_net >= 30 AND avg_net < 50
-- - low: avg_net >= 50
-- ============================================================================
DROP VIEW IF EXISTS exam_risk_summary CASCADE;

CREATE VIEW exam_risk_summary AS
SELECT
  e.id AS exam_id,
  e.organization_id,
  e.name AS exam_name,
  COUNT(ep.id) AS participant_count,
  ROUND(AVG(ep.net), 2) AS avg_net,
  
  -- Risk seviyesi
  CASE 
    WHEN COUNT(ep.id) = 0 THEN 'high'
    WHEN AVG(ep.net) < 30 THEN 'high'
    WHEN AVG(ep.net) < 50 THEN 'medium'
    ELSE 'low'
  END AS risk_level,
  
  -- Risk skoru (0-100, yüksek = kötü)
  CASE 
    WHEN COUNT(ep.id) = 0 THEN 100
    WHEN AVG(ep.net) >= 80 THEN 0
    WHEN AVG(ep.net) >= 60 THEN 20
    WHEN AVG(ep.net) >= 50 THEN 40
    WHEN AVG(ep.net) >= 30 THEN 60
    ELSE 80
  END AS risk_score,
  
  -- Risk faktörleri (JSON array)
  CASE 
    WHEN COUNT(ep.id) = 0 THEN '["Katılımcı yok"]'::JSONB
    WHEN AVG(ep.net) < 30 THEN '["Çok düşük ortalama net", "Kritik durum"]'::JSONB
    WHEN AVG(ep.net) < 50 THEN '["Düşük ortalama net"]'::JSONB
    ELSE '[]'::JSONB
  END AS risk_factors

FROM exams e
LEFT JOIN exam_participants ep ON ep.exam_id = e.id
GROUP BY e.id, e.organization_id, e.name;

COMMENT ON VIEW exam_risk_summary IS 'Sınav risk özeti - ortalama net bazlı risk sınıflaması';

-- ============================================================================
-- 4. EXAM_LEADERBOARD VIEW
-- Her sınav için sıralama (ilk 100)
-- ============================================================================
DROP VIEW IF EXISTS exam_leaderboard CASCADE;

CREATE VIEW exam_leaderboard AS
SELECT
  ep.exam_id,
  ep.id AS participant_id,
  ep.student_id,
  COALESCE(s.first_name || ' ' || s.last_name, ep.guest_name, 'İsimsiz') AS participant_name,
  COALESCE(s.student_no, '') AS student_no,
  COALESCE(ep.class_name, s.class, '') AS class_name,
  ep.participant_type,
  ep.correct_count,
  ep.wrong_count,
  ep.empty_count,
  ep.net,
  ep.score,
  ep.rank,
  ep.booklet_type,
  ep.organization_id

FROM exam_participants ep
LEFT JOIN students s ON s.id = ep.student_id
WHERE ep.net IS NOT NULL
ORDER BY ep.exam_id, ep.rank NULLS LAST, ep.net DESC;

COMMENT ON VIEW exam_leaderboard IS 'Sınav sıralaması - net bazlı katılımcı listesi';

-- ============================================================================
-- 5. EXAM_CLASS_SUMMARY VIEW
-- Her sınav için sınıf bazlı özet
-- ============================================================================
DROP VIEW IF EXISTS exam_class_summary CASCADE;

CREATE VIEW exam_class_summary AS
SELECT
  ep.exam_id,
  ep.organization_id,
  COALESCE(ep.class_name, 'Belirsiz') AS class_name,
  COUNT(ep.id) AS student_count,
  ROUND(AVG(ep.net), 2) AS avg_net,
  ROUND(MAX(ep.net), 2) AS max_net,
  ROUND(MIN(CASE WHEN ep.net > 0 THEN ep.net END), 2) AS min_net,
  ROUND(AVG(ep.correct_count), 1) AS avg_correct,
  ROUND(AVG(ep.wrong_count), 1) AS avg_wrong

FROM exam_participants ep
WHERE ep.net IS NOT NULL
GROUP BY ep.exam_id, ep.organization_id, ep.class_name
ORDER BY ep.exam_id, avg_net DESC;

COMMENT ON VIEW exam_class_summary IS 'Sınıf bazlı sınav özeti';

-- ============================================================================
-- 6. EXAM_SECTION_STATS VIEW (Ders bazlı istatistik - varsa)
-- exam_sections tablosu üzerinden çalışır
-- ============================================================================
-- Not: Bu view yalnızca exam_sections tablosu varsa çalışır
-- Ders bazlı detaylı analiz için exam_sections + exam_answer_keys gerekli

DROP VIEW IF EXISTS exam_section_stats CASCADE;

CREATE VIEW exam_section_stats AS
SELECT
  es.exam_id,
  es.id AS section_id,
  es.name AS section_name,
  es.code AS section_code,
  es.question_count,
  es.start_question,
  es.end_question,
  e.organization_id

FROM exam_sections es
JOIN exams e ON e.id = es.exam_id
ORDER BY es.exam_id, es.sort_order;

COMMENT ON VIEW exam_section_stats IS 'Sınav bölüm/ders bilgileri';

-- ============================================================================
-- İNDEKSLER (View performansı için)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_exam_participants_exam_net ON exam_participants(exam_id, net DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_exam_participants_org_exam ON exam_participants(organization_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_participants_student ON exam_participants(student_id) WHERE student_id IS NOT NULL;

-- ============================================================================
-- ÖRNEK SORGULAR (UUID ile test için)
-- ============================================================================
-- NOT: Bu SQL'ler Supabase SQL Editor'da direkt çalıştırılabilir
-- Kendi exam_id'nizi yazarak test edin

-- Örnek 1: Belirli bir sınavın katılım özeti
-- SELECT * FROM exam_participation_summary 
-- WHERE exam_id = '9261d94a-5519-4d00-bed5-99d0e94a77e9';

-- Örnek 2: Belirli bir sınavın istatistikleri
-- SELECT * FROM exam_statistics_summary 
-- WHERE exam_id = '9261d94a-5519-4d00-bed5-99d0e94a77e9';

-- Örnek 3: Belirli bir sınavın risk durumu
-- SELECT * FROM exam_risk_summary 
-- WHERE exam_id = '9261d94a-5519-4d00-bed5-99d0e94a77e9';

-- Örnek 4: Belirli bir sınavın sıralaması (ilk 10)
-- SELECT * FROM exam_leaderboard 
-- WHERE exam_id = '9261d94a-5519-4d00-bed5-99d0e94a77e9'
-- LIMIT 10;

-- Örnek 5: Kurumdaki tüm sınavların risk özeti
-- SELECT * FROM exam_risk_summary 
-- WHERE organization_id = 'YOUR_ORG_ID'
-- ORDER BY risk_score DESC;

-- ============================================================================
-- DİREKT SQL SORGULARI (View kullanmadan)
-- ============================================================================

-- Katılımcı sayısı (gerçek UUID ile)
-- SELECT COUNT(*) AS participant_count
-- FROM exam_participants
-- WHERE exam_id = '9261d94a-5519-4d00-bed5-99d0e94a77e9';

-- Net ortalaması
-- SELECT 
--   ROUND(AVG(net), 2) AS avg_net,
--   ROUND(MAX(net), 2) AS max_net,
--   COUNT(*) AS total
-- FROM exam_participants
-- WHERE exam_id = '9261d94a-5519-4d00-bed5-99d0e94a77e9'
--   AND net IS NOT NULL;

-- Sınıf bazlı özet
-- SELECT 
--   class_name,
--   COUNT(*) AS student_count,
--   ROUND(AVG(net), 2) AS avg_net
-- FROM exam_participants
-- WHERE exam_id = '9261d94a-5519-4d00-bed5-99d0e94a77e9'
-- GROUP BY class_name
-- ORDER BY avg_net DESC;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
