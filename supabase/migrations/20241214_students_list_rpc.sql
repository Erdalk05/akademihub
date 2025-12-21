-- ============================================================================
-- STUDENTS LIST RPC FUNCTION
-- Öğrenci listesi için optimize edilmiş, pagination destekli
-- Tüm finansal hesaplamalar SQL'de yapılır
-- ============================================================================

CREATE OR REPLACE FUNCTION get_students_list(
  p_organization_id UUID DEFAULT NULL,
  p_academic_year TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_class_filter TEXT DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'name',
  p_sort_dir TEXT DEFAULT 'asc',
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_count INTEGER;
BEGIN
  -- Toplam sayıyı hesapla (filtrelere göre)
  SELECT COUNT(*) INTO total_count
  FROM students s
  WHERE (p_organization_id IS NULL OR s.organization_id = p_organization_id)
    AND (p_academic_year IS NULL OR s.academic_year = p_academic_year)
    AND (
      CASE p_status_filter
        WHEN 'deleted' THEN s.status = 'deleted'
        ELSE (s.status != 'deleted' OR s.status IS NULL)
      END
    )
    AND (p_class_filter IS NULL OR s.class = p_class_filter)
    AND (
      p_search IS NULL 
      OR LOWER(COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) LIKE '%' || LOWER(p_search) || '%'
      OR LOWER(COALESCE(s.full_name, '')) LIKE '%' || LOWER(p_search) || '%'
      OR LOWER(COALESCE(s.parent_name, '')) LIKE '%' || LOWER(p_search) || '%'
      OR LOWER(COALESCE(s.student_no, '')) LIKE '%' || LOWER(p_search) || '%'
    );

  -- Ana sorgu
  WITH student_finance AS (
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
      s.status,
      s.created_at,
      -- Finansal hesaplamalar
      COALESCE(SUM(fi.amount), 0) as total_amount,
      COALESCE(SUM(CASE WHEN fi.is_paid THEN fi.amount ELSE 0 END), 0) as paid_amount,
      COALESCE(SUM(fi.amount), 0) - COALESCE(SUM(CASE WHEN fi.is_paid THEN fi.amount ELSE 0 END), 0) as debt,
      COUNT(CASE WHEN NOT fi.is_paid AND fi.due_date < CURRENT_DATE THEN 1 END) as overdue_count,
      MIN(CASE WHEN NOT fi.is_paid AND fi.due_date < CURRENT_DATE THEN fi.due_date END) as oldest_overdue_date,
      MAX(CASE WHEN fi.is_paid THEN fi.paid_at END) as last_payment_date,
      (
        SELECT fi2.amount 
        FROM finance_installments fi2 
        WHERE fi2.student_id = s.id AND fi2.is_paid 
        ORDER BY fi2.paid_at DESC NULLS LAST 
        LIMIT 1
      ) as last_payment_amount
    FROM students s
    LEFT JOIN finance_installments fi ON fi.student_id = s.id
    WHERE (p_organization_id IS NULL OR s.organization_id = p_organization_id)
      AND (p_academic_year IS NULL OR s.academic_year = p_academic_year)
      AND (
        CASE p_status_filter
          WHEN 'deleted' THEN s.status = 'deleted'
          ELSE (s.status != 'deleted' OR s.status IS NULL)
        END
      )
      AND (p_class_filter IS NULL OR s.class = p_class_filter)
      AND (
        p_search IS NULL 
        OR LOWER(COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) LIKE '%' || LOWER(p_search) || '%'
        OR LOWER(COALESCE(s.full_name, '')) LIKE '%' || LOWER(p_search) || '%'
        OR LOWER(COALESCE(s.parent_name, '')) LIKE '%' || LOWER(p_search) || '%'
        OR LOWER(COALESCE(s.student_no, '')) LIKE '%' || LOWER(p_search) || '%'
      )
    GROUP BY s.id, s.first_name, s.last_name, s.full_name, s.parent_name, s.class, s.section, s.student_no, s.photo_url, s.status, s.created_at
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
      CASE 
        WHEN sf.oldest_overdue_date IS NOT NULL 
        THEN CURRENT_DATE - sf.oldest_overdue_date 
        ELSE 0 
      END as avg_delay
    FROM student_finance sf
  ),
  sorted_data AS (
    SELECT * FROM with_risk
    ORDER BY 
      CASE 
        WHEN p_sort_field = 'name' AND p_sort_dir = 'asc' THEN 
          LOWER(COALESCE(full_name, first_name || ' ' || last_name, parent_name, ''))
      END ASC NULLS LAST,
      CASE 
        WHEN p_sort_field = 'name' AND p_sort_dir = 'desc' THEN 
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
  -- Filtre istatistikleri (sidebar için)
  filter_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE (status != 'deleted' OR status IS NULL)) as total_active,
      COUNT(*) FILTER (WHERE (status != 'deleted' OR status IS NULL) AND debt > 0) as with_debt,
      COUNT(*) FILTER (WHERE (status != 'deleted' OR status IS NULL) AND debt = 0) as paid,
      COUNT(*) FILTER (WHERE (status != 'deleted' OR status IS NULL) AND debt > 10000) as critical,
      COUNT(*) FILTER (WHERE status = 'deleted') as deleted
    FROM with_risk
  )
  SELECT json_build_object(
    'students', (
      SELECT COALESCE(json_agg(
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
          'status', COALESCE(status, 'active'),
          'debt', debt,
          'risk', risk,
          'overdue_count', overdue_count,
          'avg_delay', avg_delay,
          'last_payment_date', last_payment_date,
          'last_payment_amount', last_payment_amount
        )
      ), '[]'::json)
      FROM sorted_data
    ),
    'pagination', json_build_object(
      'total', total_count,
      'page', (p_offset / p_limit) + 1,
      'pageSize', p_limit,
      'totalPages', CEIL(total_count::float / p_limit)
    ),
    'stats', (SELECT row_to_json(filter_stats) FROM filter_stats)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- İzinler
GRANT EXECUTE ON FUNCTION get_students_list TO authenticated, anon, service_role;

-- Performans için index'ler (eğer yoksa)
CREATE INDEX IF NOT EXISTS idx_students_org_year ON students(organization_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_fi_student_paid ON finance_installments(student_id, is_paid);
CREATE INDEX IF NOT EXISTS idx_fi_due_date ON finance_installments(due_date);
