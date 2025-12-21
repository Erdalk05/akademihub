-- ============================================================================
-- PERFORMANS İNDEX'LERİ VE OPTİMİZASYON
-- Bu migration'ı Supabase SQL Editor'da çalıştırın
-- ============================================================================

-- =====================================================
-- 1. STUDENTS TABLOSU INDEX'LERİ
-- =====================================================

-- Organization + Academic Year + Status (en sık kullanılan filtre kombinasyonu)
CREATE INDEX IF NOT EXISTS idx_students_org_year_status 
ON students(organization_id, academic_year, status);

-- Organization + Class (sınıf filtresi için)
CREATE INDEX IF NOT EXISTS idx_students_org_class 
ON students(organization_id, class);

-- Full text search için (LIKE sorguları hızlandırır)
CREATE INDEX IF NOT EXISTS idx_students_search_name 
ON students USING gin(to_tsvector('simple', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(full_name, '') || ' ' || COALESCE(parent_name, '')));

-- Student_no için (kayıt numarası araması)
CREATE INDEX IF NOT EXISTS idx_students_student_no 
ON students(student_no) WHERE student_no IS NOT NULL;

-- Created_at için (sıralama)
CREATE INDEX IF NOT EXISTS idx_students_created_at 
ON students(created_at DESC);

-- =====================================================
-- 2. FINANCE_INSTALLMENTS INDEX'LERİ
-- =====================================================

-- Student + Organization (en kritik join)
CREATE INDEX IF NOT EXISTS idx_fi_student_org 
ON finance_installments(student_id, organization_id);

-- Ödeme durumu + vade tarihi (gecikmiş ödemeler için)
CREATE INDEX IF NOT EXISTS idx_fi_unpaid_overdue 
ON finance_installments(due_date) 
WHERE is_paid = false;

-- Ödeme tarihi (son ödeme için)
CREATE INDEX IF NOT EXISTS idx_fi_paid_date 
ON finance_installments(paid_at DESC) 
WHERE is_paid = true;

-- Covering index: Sık kullanılan alanları içerir (index-only scan)
CREATE INDEX IF NOT EXISTS idx_fi_student_summary 
ON finance_installments(student_id, is_paid, amount, due_date);

-- =====================================================
-- 3. OPTİMİZE EDİLMİŞ get_students_list FONKSIYONU
-- =====================================================

CREATE OR REPLACE FUNCTION get_students_list(
  p_organization_id UUID DEFAULT NULL,
  p_academic_year TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_class_filter TEXT DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'name',
  p_sort_dir TEXT DEFAULT 'asc',
  p_limit INTEGER DEFAULT 15,  -- ✅ Düşürüldü: 25 → 15
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '10s'  -- ✅ Timeout eklendi
AS $$
DECLARE
  result JSON;
  total_count INTEGER;
  search_pattern TEXT;
BEGIN
  -- ✅ Search pattern'i önceden hesapla (her satır için değil)
  search_pattern := '%' || LOWER(COALESCE(p_search, '')) || '%';

  -- Toplam sayıyı hesapla
  SELECT COUNT(*) INTO total_count
  FROM students s
  WHERE (p_organization_id IS NULL OR s.organization_id = p_organization_id)
    AND (p_academic_year IS NULL OR s.academic_year = p_academic_year)
    AND (
      CASE p_status_filter
        WHEN 'deleted' THEN s.status = 'deleted'
        ELSE COALESCE(s.status, 'active') != 'deleted'
      END
    )
    AND (p_class_filter IS NULL OR s.class = p_class_filter)
    AND (
      p_search IS NULL OR p_search = ''
      OR LOWER(COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) LIKE search_pattern
      OR LOWER(COALESCE(s.full_name, '')) LIKE search_pattern
      OR LOWER(COALESCE(s.parent_name, '')) LIKE search_pattern
      OR s.student_no ILIKE search_pattern
    );

  -- ✅ Ana sorgu - Optimize edilmiş
  WITH filtered_students AS (
    -- İlk önce sadece temel filtreleme yap
    SELECT 
      s.id,
      s.first_name,
      s.last_name,
      s.full_name,
      s.parent_name,
      s.class,
      s.section,
      s.student_no,
      s.photo_url,
      COALESCE(s.status, 'active') as status,
      s.created_at
    FROM students s
    WHERE (p_organization_id IS NULL OR s.organization_id = p_organization_id)
      AND (p_academic_year IS NULL OR s.academic_year = p_academic_year)
      AND (
        CASE p_status_filter
          WHEN 'deleted' THEN s.status = 'deleted'
          ELSE COALESCE(s.status, 'active') != 'deleted'
        END
      )
      AND (p_class_filter IS NULL OR s.class = p_class_filter)
      AND (
        p_search IS NULL OR p_search = ''
        OR LOWER(COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) LIKE search_pattern
        OR LOWER(COALESCE(s.full_name, '')) LIKE search_pattern
        OR LOWER(COALESCE(s.parent_name, '')) LIKE search_pattern
        OR s.student_no ILIKE search_pattern
      )
  ),
  -- ✅ Finansal verileri ayrı hesapla (sadece gerekli öğrenciler için)
  student_finance AS (
    SELECT 
      fs.id,
      fs.first_name,
      fs.last_name,
      fs.full_name,
      fs.parent_name,
      fs.class,
      fs.section,
      fs.student_no,
      fs.photo_url,
      fs.status,
      fs.created_at,
      COALESCE(f.total_amount, 0) - COALESCE(f.paid_amount, 0) as debt,
      COALESCE(f.overdue_count, 0) as overdue_count,
      f.oldest_overdue_date,
      f.last_payment_date,
      f.last_payment_amount
    FROM filtered_students fs
    LEFT JOIN LATERAL (
      SELECT 
        SUM(fi.amount) as total_amount,
        SUM(CASE WHEN fi.is_paid THEN fi.amount ELSE 0 END) as paid_amount,
        COUNT(*) FILTER (WHERE NOT fi.is_paid AND fi.due_date < CURRENT_DATE) as overdue_count,
        MIN(fi.due_date) FILTER (WHERE NOT fi.is_paid AND fi.due_date < CURRENT_DATE) as oldest_overdue_date,
        MAX(fi.paid_at) FILTER (WHERE fi.is_paid) as last_payment_date,
        (SELECT amount FROM finance_installments 
         WHERE student_id = fs.id AND is_paid 
         ORDER BY paid_at DESC NULLS LAST LIMIT 1) as last_payment_amount
      FROM finance_installments fi
      WHERE fi.student_id = fs.id
    ) f ON true
  ),
  with_risk AS (
    SELECT 
      sf.*,
      CASE 
        WHEN sf.debt > 10000 THEN 'Yüksek'
        WHEN sf.debt > 5000 THEN 'Orta'
        WHEN sf.debt > 0 THEN 'Düşük'
        ELSE 'Yok'
      END as risk,
      CASE 
        WHEN sf.debt > 10000 THEN 3
        WHEN sf.debt > 5000 THEN 2
        WHEN sf.debt > 0 THEN 1
        ELSE 0
      END as risk_order,
      COALESCE(CURRENT_DATE - sf.oldest_overdue_date, 0) as avg_delay
    FROM student_finance sf
  ),
  -- ✅ Sıralama ve pagination
  sorted_data AS (
    SELECT * FROM with_risk
    ORDER BY 
      CASE WHEN p_sort_field = 'name' AND p_sort_dir = 'asc' THEN 
        LOWER(COALESCE(full_name, first_name || ' ' || last_name, parent_name, ''))
      END ASC NULLS LAST,
      CASE WHEN p_sort_field = 'name' AND p_sort_dir = 'desc' THEN 
        LOWER(COALESCE(full_name, first_name || ' ' || last_name, parent_name, ''))
      END DESC NULLS LAST,
      CASE WHEN p_sort_field = 'debt' AND p_sort_dir = 'asc' THEN debt END ASC,
      CASE WHEN p_sort_field = 'debt' AND p_sort_dir = 'desc' THEN debt END DESC,
      CASE WHEN p_sort_field = 'risk' AND p_sort_dir = 'asc' THEN risk_order END ASC,
      CASE WHEN p_sort_field = 'risk' AND p_sort_dir = 'desc' THEN risk_order END DESC,
      created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  -- ✅ İstatistikler (basitleştirildi)
  filter_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status != 'deleted') as total_active,
      COUNT(*) FILTER (WHERE status != 'deleted' AND debt > 0) as with_debt,
      COUNT(*) FILTER (WHERE status != 'deleted' AND debt = 0) as paid,
      COUNT(*) FILTER (WHERE status != 'deleted' AND debt > 10000) as critical,
      COUNT(*) FILTER (WHERE status = 'deleted') as deleted
    FROM with_risk
  )
  SELECT json_build_object(
    'students', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id,
          'first_name', first_name,
          'last_name', last_name,
          'full_name', full_name,
          'parent_name', parent_name,
          'class', class,
          'section', section,
          'student_no', student_no,
          'photo_url', photo_url,
          'status', status,
          'debt', debt,
          'risk', risk,
          'overdue_count', overdue_count,
          'avg_delay', avg_delay,
          'last_payment_date', last_payment_date,
          'last_payment_amount', last_payment_amount
        )
      )
      FROM sorted_data
    ), '[]'::json),
    'pagination', json_build_object(
      'total', total_count,
      'page', (p_offset / p_limit) + 1,
      'pageSize', p_limit,
      'totalPages', CEIL(total_count::float / GREATEST(p_limit, 1))
    ),
    'stats', (SELECT row_to_json(filter_stats) FROM filter_stats)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- İzinler
GRANT EXECUTE ON FUNCTION get_students_list TO authenticated, anon, service_role;

-- =====================================================
-- 4. VERİ TABANI İSTATİSTİKLERİNİ GÜNCELLE
-- =====================================================
ANALYZE students;
ANALYZE finance_installments;

-- ✅ Index kullanımını kontrol et (debug için)
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM get_students_list('your-org-id-here');
