-- ============================================
-- SUPABASE RPC FUNCTION: register_student_transaction
-- ============================================
-- 
-- Purpose: Atomic transaction for student registration
-- Inserts records into: students, parents, payment_plans, installments, transactions, contracts
-- 
-- ACID Guarantee: All-or-nothing execution
-- If ANY insertion fails, entire transaction ROLLBACKS
-- 
-- Author: AkademiHub System Architect
-- Version: 2.0.0
-- ============================================

CREATE OR REPLACE FUNCTION register_student_transaction(
  p_student JSONB,
  p_parent JSONB,
  p_payment_plan JSONB,
  p_installments JSONB,
  p_transaction JSONB,
  p_contract JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id TEXT;
  v_parent_id UUID;
  v_payment_plan_id UUID;
  v_transaction_id UUID;
  v_contract_id UUID;
  v_error_message TEXT;
BEGIN
  -- Start transaction
  -- Note: Function is already in a transaction context by default
  
  -- ============================================
  -- STEP 1: Insert Student
  -- ============================================
  BEGIN
    INSERT INTO students (
      tc_kimlik_no,
      first_name,
      last_name,
      date_of_birth,
      place_of_birth,
      gender,
      nationality,
      phone,
      email,
      photo_url,
      address_city,
      address_district,
      address_full,
      grade,
      section,
      academic_year,
      enrollment_date,
      start_date,
      status,
      created_at,
      updated_at
    )
    VALUES (
      p_student->>'tc_kimlik_no',
      p_student->>'first_name',
      p_student->>'last_name',
      (p_student->>'date_of_birth')::DATE,
      p_student->>'place_of_birth',
      p_student->>'gender',
      p_student->>'nationality',
      p_student->>'phone',
      p_student->>'email',
      p_student->>'photo_url',
      p_student->>'address_city',
      p_student->>'address_district',
      p_student->>'address_full',
      p_student->>'grade',
      p_student->>'section',
      p_student->>'academic_year',
      (p_student->>'enrollment_date')::DATE,
      (p_student->>'start_date')::DATE,
      COALESCE(p_student->>'status', 'active'),
      NOW(),
      NOW()
    )
    RETURNING tc_kimlik_no INTO v_student_id;
    
    -- Validate insertion
    IF v_student_id IS NULL THEN
      RAISE EXCEPTION 'Student insertion failed';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    v_error_message := 'Student insertion error: ' || SQLERRM;
    RAISE EXCEPTION '%', v_error_message;
  END;
  
  -- ============================================
  -- STEP 2: Insert Parent
  -- ============================================
  BEGIN
    INSERT INTO parents (
      student_tc_kimlik_no,
      mother_first_name,
      mother_last_name,
      mother_tc_kimlik_no,
      mother_phone,
      mother_email,
      father_first_name,
      father_last_name,
      father_tc_kimlik_no,
      father_phone,
      father_email,
      financial_responsible,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      home_address,
      work_address,
      blood_type,
      allergies,
      chronic_diseases,
      medications,
      emergency_medical_consent,
      created_at,
      updated_at
    )
    VALUES (
      v_student_id,
      p_parent->>'mother_first_name',
      p_parent->>'mother_last_name',
      p_parent->>'mother_tc_kimlik_no',
      p_parent->>'mother_phone',
      p_parent->>'mother_email',
      p_parent->>'father_first_name',
      p_parent->>'father_last_name',
      p_parent->>'father_tc_kimlik_no',
      p_parent->>'father_phone',
      p_parent->>'father_email',
      p_parent->>'financial_responsible',
      p_parent->>'emergency_contact_name',
      p_parent->>'emergency_contact_phone',
      p_parent->>'emergency_contact_relation',
      p_parent->>'home_address',
      p_parent->>'work_address',
      p_parent->>'blood_type',
      p_parent->>'allergies',
      p_parent->>'chronic_diseases',
      p_parent->>'medications',
      (p_parent->>'emergency_medical_consent')::BOOLEAN,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_parent_id;
    
    -- Validate insertion
    IF v_parent_id IS NULL THEN
      RAISE EXCEPTION 'Parent insertion failed';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    v_error_message := 'Parent insertion error: ' || SQLERRM;
    RAISE EXCEPTION '%', v_error_message;
  END;
  
  -- ============================================
  -- STEP 3: Insert Payment Plan
  -- ============================================
  BEGIN
    INSERT INTO payment_plans (
      student_tc_kimlik_no,
      base_price,
      total_discount,
      discounted_price,
      vat_amount,
      total_price,
      payment_method,
      installment_count,
      discount_details,
      calculation_data,
      created_at,
      updated_at
    )
    VALUES (
      v_student_id,
      (p_payment_plan->>'base_price')::NUMERIC(10,2),
      (p_payment_plan->>'total_discount')::NUMERIC(10,2),
      (p_payment_plan->>'discounted_price')::NUMERIC(10,2),
      (p_payment_plan->>'vat_amount')::NUMERIC(10,2),
      (p_payment_plan->>'total_price')::NUMERIC(10,2),
      p_payment_plan->>'payment_method',
      (p_payment_plan->>'installment_count')::INTEGER,
      p_payment_plan->'discount_details',
      p_payment_plan->'calculation_data',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_payment_plan_id;
    
    -- Validate insertion
    IF v_payment_plan_id IS NULL THEN
      RAISE EXCEPTION 'Payment plan insertion failed';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    v_error_message := 'Payment plan insertion error: ' || SQLERRM;
    RAISE EXCEPTION '%', v_error_message;
  END;
  
  -- ============================================
  -- STEP 4: Insert Installments (if any)
  -- ============================================
  IF jsonb_array_length(p_installments) > 0 THEN
    BEGIN
      INSERT INTO installments (
        student_tc_kimlik_no,
        payment_plan_id,
        installment_number,
        due_date,
        amount,
        is_paid,
        description,
        created_at,
        updated_at
      )
      SELECT
        v_student_id,
        v_payment_plan_id,
        (installment->>'installment_number')::INTEGER,
        (installment->>'due_date')::DATE,
        (installment->>'amount')::NUMERIC(10,2),
        COALESCE((installment->>'is_paid')::BOOLEAN, FALSE),
        installment->>'description',
        NOW(),
        NOW()
      FROM jsonb_array_elements(p_installments) AS installment;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_message := 'Installments insertion error: ' || SQLERRM;
      RAISE EXCEPTION '%', v_error_message;
    END;
  END IF;
  
  -- ============================================
  -- STEP 5: Insert Initial Transaction
  -- ============================================
  BEGIN
    INSERT INTO transactions (
      student_tc_kimlik_no,
      payment_plan_id,
      amount,
      transaction_type,
      payment_method,
      description,
      transaction_date,
      reference_number,
      created_at,
      updated_at
    )
    VALUES (
      v_student_id,
      v_payment_plan_id,
      (p_transaction->>'amount')::NUMERIC(10,2),
      COALESCE(p_transaction->>'transaction_type', 'payment'),
      p_transaction->>'payment_method',
      p_transaction->>'description',
      COALESCE((p_transaction->>'transaction_date')::TIMESTAMP, NOW()),
      p_transaction->>'reference_number',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_transaction_id;
    
    -- Validate insertion
    IF v_transaction_id IS NULL THEN
      RAISE EXCEPTION 'Transaction insertion failed';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    v_error_message := 'Transaction insertion error: ' || SQLERRM;
    RAISE EXCEPTION '%', v_error_message;
  END;
  
  -- ============================================
  -- STEP 6: Insert Contract Record
  -- ============================================
  BEGIN
    INSERT INTO contracts (
      student_tc_kimlik_no,
      contract_accepted,
      accepted_at,
      ip_address,
      digital_signature,
      sms_verified,
      contract_pdf_url,
      created_at,
      updated_at
    )
    VALUES (
      v_student_id,
      (p_contract->>'contract_accepted')::BOOLEAN,
      COALESCE((p_contract->>'accepted_at')::TIMESTAMP, NOW()),
      p_contract->>'ip_address',
      p_contract->>'digital_signature',
      COALESCE((p_contract->>'sms_verified')::BOOLEAN, FALSE),
      p_contract->>'contract_pdf_url',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_contract_id;
    
    -- Validate insertion
    IF v_contract_id IS NULL THEN
      RAISE EXCEPTION 'Contract insertion failed';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    v_error_message := 'Contract insertion error: ' || SQLERRM;
    RAISE EXCEPTION '%', v_error_message;
  END;
  
  -- ============================================
  -- SUCCESS: Return result
  -- ============================================
  RETURN jsonb_build_object(
    'success', TRUE,
    'student_id', v_student_id,
    'parent_id', v_parent_id,
    'payment_plan_id', v_payment_plan_id,
    'transaction_id', v_transaction_id,
    'contract_id', v_contract_id,
    'message', 'Öğrenci kaydı başarıyla tamamlandı',
    'error', NULL
  );
  
EXCEPTION
  -- ============================================
  -- ERROR HANDLING: Rollback is automatic
  -- ============================================
  WHEN OTHERS THEN
    -- Log error (optional: insert into error_logs table)
    -- INSERT INTO error_logs (function_name, error_message, created_at)
    -- VALUES ('register_student_transaction', SQLERRM, NOW());
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'student_id', NULL,
      'parent_id', NULL,
      'payment_plan_id', NULL,
      'transaction_id', NULL,
      'contract_id', NULL,
      'message', 'Kayıt işlemi başarısız oldu',
      'error', SQLERRM
    );
END;
$$;

-- ============================================
-- PERMISSIONS
-- ============================================
-- Grant execute permission to authenticated users
-- REVOKE ALL ON FUNCTION register_student_transaction FROM PUBLIC;
-- GRANT EXECUTE ON FUNCTION register_student_transaction TO authenticated;

-- ============================================
-- USAGE EXAMPLE
-- ============================================
/*
SELECT register_student_transaction(
  '{"tc_kimlik_no": "12345678901", "first_name": "Ali", ...}'::jsonb,
  '{"mother_first_name": "Ayşe", ...}'::jsonb,
  '{"base_price": 100000, "total_price": 118000, ...}'::jsonb,
  '[{"installment_number": 1, "amount": 9833.33, ...}]'::jsonb,
  '{"amount": 20000, "payment_method": "credit_card", ...}'::jsonb,
  '{"contract_accepted": true, "sms_verified": true, ...}'::jsonb
);
*/

-- ============================================
-- TESTING & VALIDATION
-- ============================================
-- 1. Test with valid data
-- 2. Test with duplicate TC Kimlik No (should fail)
-- 3. Test with invalid discount (should rollback)
-- 4. Test with missing required fields (should rollback)
-- 5. Verify no orphan records exist after failed transaction

