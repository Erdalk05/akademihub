-- =====================================================
-- FİNANS DASHBOARD RPC FONKSİYONLARI
-- Tüm hesaplamalar SQL'de - JavaScript'e sadece sonuç gider
-- =====================================================

-- 1. Taksit Özet Fonksiyonu
CREATE OR REPLACE FUNCTION get_installment_summary(
  p_today DATE DEFAULT CURRENT_DATE,
  p_this_month TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM')
)
RETURNS TABLE (
  total_income NUMERIC,
  total_amount NUMERIC,
  paid_count INTEGER,
  pending_count INTEGER,
  overdue_count INTEGER,
  this_month_income NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN is_paid = true THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(amount), 0) as total_amount,
    COUNT(*) FILTER (WHERE is_paid = true)::INTEGER as paid_count,
    COUNT(*) FILTER (WHERE is_paid = false)::INTEGER as pending_count,
    COUNT(*) FILTER (WHERE is_paid = false AND due_date < p_today)::INTEGER as overdue_count,
    COALESCE(SUM(CASE WHEN is_paid = true AND paid_at::TEXT LIKE p_this_month || '%' THEN amount ELSE 0 END), 0) as this_month_income
  FROM finance_installments;
$$;

-- 2. Gider Özet Fonksiyonu
CREATE OR REPLACE FUNCTION get_expense_summary(
  p_this_month TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM')
)
RETURNS TABLE (
  total_expense NUMERIC,
  this_month_expense NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(amount), 0) as total_expense,
    COALESCE(SUM(CASE WHEN date::TEXT LIKE p_this_month || '%' THEN amount ELSE 0 END), 0) as this_month_expense
  FROM expenses;
$$;

-- 3. Sınıf Bazında Finans Verileri
CREATE OR REPLACE FUNCTION get_class_finance_data()
RETURNS TABLE (
  class_name TEXT,
  student_count INTEGER,
  total_amount NUMERIC,
  average_fee NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH student_classes AS (
    SELECT id, COALESCE(class, 'Belirsiz') as class
    FROM students
    WHERE status = 'active'
  ),
  student_totals AS (
    SELECT 
      sc.class,
      fi.student_id,
      SUM(fi.amount) as student_total
    FROM finance_installments fi
    JOIN student_classes sc ON sc.id = fi.student_id
    GROUP BY sc.class, fi.student_id
  )
  SELECT 
    class as class_name,
    COUNT(DISTINCT student_id)::INTEGER as student_count,
    SUM(student_total) as total_amount,
    CASE 
      WHEN COUNT(DISTINCT student_id) > 0 
      THEN SUM(student_total) / COUNT(DISTINCT student_id)
      ELSE 0 
    END as average_fee
  FROM student_totals
  GROUP BY class
  HAVING SUM(student_total) > 0
  ORDER BY 
    CASE 
      WHEN class ~ '^\d+$' THEN LPAD(class, 10, '0')
      ELSE class
    END;
$$;

-- İndeksler (zaten yoksa)
CREATE INDEX IF NOT EXISTS idx_finance_installments_is_paid ON finance_installments(is_paid);
CREATE INDEX IF NOT EXISTS idx_finance_installments_due_date ON finance_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_finance_installments_paid_at ON finance_installments(paid_at);
CREATE INDEX IF NOT EXISTS idx_finance_installments_student_id ON finance_installments(student_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);

-- Composite index for faster queries
CREATE INDEX IF NOT EXISTS idx_finance_installments_paid_status 
  ON finance_installments(is_paid, due_date, paid_at);
