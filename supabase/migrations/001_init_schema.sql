-- Create Tables for AkademiHub

-- Users Table (Extended with custom fields)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  surname TEXT,
  role TEXT DEFAULT 'student', -- 'admin', 'teacher', 'parent', 'student'
  phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_no TEXT UNIQUE NOT NULL,
  class TEXT NOT NULL,
  section TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'passive', 'graduated'
  birth_date DATE,
  birth_place TEXT,
  gender TEXT,
  tc_id TEXT UNIQUE,
  blood_type TEXT,
  address TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_method TEXT, -- 'cash', 'card', 'transfer'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment Plans Table
CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  installment_count INT DEFAULT 3,
  paid_count INT DEFAULT 0,
  next_due_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'overdue'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Communication Logs Table
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_type TEXT, -- 'sms', 'email'
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guidance Notes Table
CREATE TABLE guidance_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES users(id),
  note_type TEXT, -- 'assessment', 'support', 'risk', 'career'
  content TEXT NOT NULL,
  risk_level TEXT, -- 'low', 'medium', 'high'
  action_items TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payment_plans_student_id ON payment_plans(student_id);
CREATE INDEX idx_communication_logs_recipient_id ON communication_logs(recipient_id);
CREATE INDEX idx_guidance_notes_student_id ON guidance_notes(student_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidance_notes ENABLE ROW LEVEL SECURITY;








