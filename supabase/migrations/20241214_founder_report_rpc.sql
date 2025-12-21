-- ============================================================================
-- FOUNDER REPORT RPC FUNCTION
-- Tüm aggregation'ları SQL tarafında yapar, JS yükünü azaltır
-- ============================================================================

-- 1. GENEL ÖZET FONKSİYONU
CREATE OR REPLACE FUNCTION get_founder_summary(p_organization_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH student_stats AS (
    SELECT 
      s.id,
      s.status,
      s.class,
      COALESCE(SUM(fi.amount), 0) as total_amount,
      COALESCE(SUM(CASE WHEN fi.is_paid THEN fi.amount ELSE 0 END), 0) as paid_amount,
      COUNT(CASE WHEN NOT fi.is_paid AND fi.due_date < CURRENT_DATE THEN 1 END) as overdue_count,
      COALESCE(SUM(CASE WHEN NOT fi.is_paid AND fi.due_date < CURRENT_DATE THEN fi.amount ELSE 0 END), 0) as overdue_amount
    FROM students s
    LEFT JOIN finance_installments fi ON fi.student_id = s.id
    WHERE (p_organization_id IS NULL OR s.organization_id = p_organization_id)
    GROUP BY s.id, s.status, s.class
  ),
  active_stats AS (
    SELECT * FROM student_stats WHERE status != 'deleted' OR status IS NULL
  ),
  deleted_stats AS (
    SELECT * FROM student_stats WHERE status = 'deleted'
  )
  SELECT json_build_object(
    'totalStudents', (SELECT COUNT(*) FROM active_stats),
    'paidStudents', (SELECT COUNT(*) FROM active_stats WHERE total_amount > 0),
    'freeStudents', (SELECT COUNT(*) FROM active_stats WHERE total_amount = 0),
    'deletedStudents', (SELECT COUNT(*) FROM deleted_stats),
    'totalRevenue', (SELECT COALESCE(SUM(total_amount), 0) FROM active_stats),
    'collectedRevenue', (SELECT COALESCE(SUM(paid_amount), 0) FROM active_stats),
    'pendingRevenue', (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM active_stats),
    'overdueAmount', (SELECT COALESCE(SUM(overdue_amount), 0) FROM active_stats),
    'overdueStudents', (SELECT COUNT(*) FROM active_stats WHERE overdue_count > 0),
    'deletedTotalAmount', (SELECT COALESCE(SUM(total_amount), 0) FROM deleted_stats),
    'deletedCollectedAmount', (SELECT COALESCE(SUM(paid_amount), 0) FROM deleted_stats),
    'totalClasses', (SELECT COUNT(DISTINCT class) FROM active_stats WHERE class IS NOT NULL)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 2. SINIF BAZLI İSTATİSTİKLER
CREATE OR REPLACE FUNCTION get_class_stats(p_organization_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH class_data AS (
    SELECT 
      COALESCE(s.class, 'Belirsiz') as class_name,
      COUNT(DISTINCT s.id) as total_students,
      COUNT(DISTINCT CASE WHEN sub.total_amount > 0 THEN s.id END) as paid_students,
      COUNT(DISTINCT CASE WHEN sub.total_amount = 0 OR sub.total_amount IS NULL THEN s.id END) as free_students,
      COALESCE(SUM(sub.total_amount), 0) as total_amount,
      COALESCE(SUM(sub.paid_amount), 0) as collected_amount,
      COALESCE(SUM(sub.overdue_count), 0) as overdue_count
    FROM students s
    LEFT JOIN LATERAL (
      SELECT 
        COALESCE(SUM(fi.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN fi.is_paid THEN fi.amount ELSE 0 END), 0) as paid_amount,
        COUNT(CASE WHEN NOT fi.is_paid AND fi.due_date < CURRENT_DATE THEN 1 END) as overdue_count
      FROM finance_installments fi
      WHERE fi.student_id = s.id
    ) sub ON true
    WHERE (s.status != 'deleted' OR s.status IS NULL)
      AND (p_organization_id IS NULL OR s.organization_id = p_organization_id)
    GROUP BY COALESCE(s.class, 'Belirsiz')
    ORDER BY 
      CASE WHEN COALESCE(s.class, 'Belirsiz') ~ '^[0-9]+$' 
           THEN CAST(COALESCE(s.class, '99') AS INTEGER) 
           ELSE 99 END
  )
  SELECT json_agg(
    json_build_object(
      'class', class_name,
      'totalStudents', total_students,
      'paidStudents', paid_students,
      'freeStudents', free_students,
      'totalAmount', total_amount,
      'collectedAmount', collected_amount,
      'remainingAmount', total_amount - collected_amount,
      'averageFee', CASE WHEN paid_students > 0 THEN total_amount / paid_students ELSE 0 END,
      'collectionRate', CASE WHEN total_amount > 0 THEN (collected_amount::float / total_amount) * 100 ELSE 0 END,
      'overdueCount', overdue_count,
      'riskScore', LEAST(100, GREATEST(0, 
        (100 - CASE WHEN total_amount > 0 THEN (collected_amount::float / total_amount) * 100 ELSE 0 END) * 0.6 +
        (overdue_count::float / GREATEST(1, paid_students)) * 40
      ))
    )
  ) INTO result FROM class_data;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 3. AYLIK VERİLER
CREATE OR REPLACE FUNCTION get_monthly_stats(p_organization_id UUID DEFAULT NULL, p_year INTEGER DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_year INTEGER;
BEGIN
  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  
  WITH months AS (
    SELECT generate_series(1, 12) as month_num
  ),
  monthly_data AS (
    SELECT 
      m.month_num,
      COALESCE(SUM(fi.amount), 0) as expected,
      COALESCE(SUM(CASE WHEN fi.is_paid THEN fi.amount ELSE 0 END), 0) as collected
    FROM months m
    LEFT JOIN finance_installments fi ON 
      EXTRACT(MONTH FROM fi.due_date) = m.month_num AND
      EXTRACT(YEAR FROM fi.due_date) = v_year AND
      (p_organization_id IS NULL OR fi.organization_id = p_organization_id)
    GROUP BY m.month_num
    ORDER BY m.month_num
  ),
  with_cumulative AS (
    SELECT 
      month_num,
      expected,
      collected,
      SUM(collected) OVER (ORDER BY month_num) as cumulative_revenue
    FROM monthly_data
  )
  SELECT json_agg(
    json_build_object(
      'monthNum', month_num,
      'expected', expected,
      'collected', collected,
      'rate', CASE WHEN expected > 0 THEN (collected::float / expected) * 100 ELSE 0 END,
      'cumulativeRevenue', cumulative_revenue
    ) ORDER BY month_num
  ) INTO result FROM with_cumulative;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 4. RİSKLİ ÖĞRENCİLER
CREATE OR REPLACE FUNCTION get_risk_students(p_organization_id UUID DEFAULT NULL, p_limit INTEGER DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH overdue_data AS (
    SELECT 
      s.id,
      COALESCE(s.first_name || ' ' || s.last_name, s.parent_name, 'İsimsiz') as name,
      COALESCE(s.class, '-') as class,
      SUM(fi.amount) as total_debt,
      MIN(fi.due_date) as oldest_due_date,
      CURRENT_DATE - MIN(fi.due_date) as overdue_days
    FROM students s
    JOIN finance_installments fi ON fi.student_id = s.id
    WHERE NOT fi.is_paid 
      AND fi.due_date < CURRENT_DATE
      AND (s.status != 'deleted' OR s.status IS NULL)
      AND (p_organization_id IS NULL OR s.organization_id = p_organization_id)
    GROUP BY s.id, s.first_name, s.last_name, s.parent_name, s.class
    HAVING SUM(fi.amount) > 0
  )
  SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'class', class,
      'totalDebt', total_debt,
      'overdueDays', overdue_days,
      'riskLevel', CASE 
        WHEN overdue_days > 90 OR total_debt > 50000 THEN 'critical'
        WHEN overdue_days > 60 OR total_debt > 30000 THEN 'high'
        WHEN overdue_days > 30 OR total_debt > 15000 THEN 'medium'
        ELSE 'low'
      END
    ) ORDER BY total_debt DESC
  ) INTO result 
  FROM (SELECT * FROM overdue_data ORDER BY total_debt DESC LIMIT p_limit) sub;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 5. ÖĞRENCİ DETAYLARI (Modal için)
CREATE OR REPLACE FUNCTION get_student_finance_details(p_organization_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH student_data AS (
    SELECT 
      s.id,
      COALESCE(s.first_name || ' ' || s.last_name, SPLIT_PART(s.parent_name, ' - ', 1), 'İsimsiz') as name,
      COALESCE(s.class, 'Belirsiz') as class,
      s.status,
      s.created_at as registration_date,
      s.deleted_at,
      COALESCE(SUM(fi.amount), 0) as total_amount,
      COALESCE(SUM(CASE WHEN fi.is_paid THEN fi.amount ELSE 0 END), 0) as collected_amount
    FROM students s
    LEFT JOIN finance_installments fi ON fi.student_id = s.id
    WHERE (p_organization_id IS NULL OR s.organization_id = p_organization_id)
    GROUP BY s.id, s.first_name, s.last_name, s.parent_name, s.class, s.status, s.created_at, s.deleted_at
  )
  SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'class', class,
      'status', COALESCE(status, 'active'),
      'totalAmount', total_amount,
      'collectedAmount', collected_amount,
      'remainingAmount', total_amount - collected_amount,
      'registrationDate', registration_date,
      'deletedDate', deleted_at,
      'isPaid', total_amount > 0
    )
  ) INTO result FROM student_data;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 6. TÜM FOUNDER VERİLERİNİ TEK ÇAĞRI İLE AL
CREATE OR REPLACE FUNCTION get_founder_report(p_organization_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'summary', get_founder_summary(p_organization_id),
    'classStats', get_class_stats(p_organization_id),
    'monthlyData', get_monthly_stats(p_organization_id),
    'riskStudents', get_risk_students(p_organization_id),
    'students', get_student_finance_details(p_organization_id)
  );
END;
$$;

-- İzinler
GRANT EXECUTE ON FUNCTION get_founder_summary TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_class_stats TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_monthly_stats TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_risk_students TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_student_finance_details TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_founder_report TO authenticated, anon, service_role;
