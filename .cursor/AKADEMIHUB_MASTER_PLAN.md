# 🌍 AKADEMİHUB - DÜNYA STANDARTLARINDA K12 EĞİTİM PLATFORMU

## 🎯 VİZYON

**"Türkiye'nin ilk AI-destekli, oyunlaştırılmış, çok kurumlu eğitim ekosistemi"**

---

# 📐 BÖLÜM 1: TEKNİK MİMARİ

## 1.1 MİKROSERVİS MİMARİSİ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AKADEMİHUB CLOUD PLATFORM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   API       │  │   Auth      │  │  Student    │  │   Exam      │        │
│  │   Gateway   │  │   Service   │  │  Service    │  │   Service   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐        │
│  │                      MESSAGE BROKER (Redis/RabbitMQ)           │        │
│  └──────┬────────────────┬────────────────┬────────────────┬──────┘        │
│         │                │                │                │                │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐        │
│  │  Finance    │  │  Analytics  │  │  Notification│ │  Gamification│       │
│  │  Service    │  │  AI Engine  │  │  Service    │  │  Engine     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    SUPABASE (PostgreSQL + Realtime)             │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    BLOB STORAGE (PDF, Images, Reports)          │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 VERİTABANI ŞEMASI (GENİŞLETİLMİŞ)

### CORE TABLES

```sql
-- ═══════════════════════════════════════════════════════════════
-- 1. KURUM VE KİMLİK YÖNETİMİ
-- ═══════════════════════════════════════════════════════════════

-- Kurumlar (Multi-tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'standalone', -- 'standalone', 'franchise', 'branch'
    parent_org_id UUID REFERENCES organizations(id),
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#10B981',
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kişiler (Tek Kimlik Merkezi)
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tc_no VARCHAR(11) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı Hesapları (Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES persons(id),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT,
    role VARCHAR(50) NOT NULL, -- 'super_admin', 'admin', 'teacher', 'counselor', 'accountant', 'parent', 'student'
    permissions JSONB DEFAULT '[]',
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, organization_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 2. ÖĞRENCİ & ROL YÖNETİMİ
-- ═══════════════════════════════════════════════════════════════

-- Akademik Dönemler
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name VARCHAR(50) NOT NULL, -- '2025-2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sınıflar
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    name VARCHAR(50) NOT NULL, -- '7-A', '8-B'
    grade_level INTEGER, -- 7, 8, 9...
    branch VARCHAR(50), -- 'FEN', 'TM', 'SÖZEL'
    capacity INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kurum Öğrencileri (Muhasebe Bağlantılı)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES persons(id) NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    student_no VARCHAR(50), -- Okul numarası
    class_id UUID REFERENCES classes(id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'passive', 'graduated', 'transferred'
    target_exam VARCHAR(50), -- 'LGS', 'YKS-TYT', 'YKS-AYT'
    target_score INTEGER,
    target_ranking INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, student_no)
);

-- Öğretmenler
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES persons(id) NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    employee_no VARCHAR(50),
    branches TEXT[], -- ['Matematik', 'Geometri']
    title VARCHAR(50), -- 'Öğretmen', 'Uzman Öğretmen', 'Başöğretmen'
    is_counselor BOOLEAN DEFAULT false,
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Öğretmen-Sınıf İlişkisi
CREATE TABLE teacher_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) NOT NULL,
    class_id UUID REFERENCES classes(id) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    is_primary BOOLEAN DEFAULT false, -- Sınıf öğretmeni mi?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, class_id, subject)
);

-- Veliler
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES persons(id) NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    occupation VARCHAR(100),
    workplace VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Veli-Öğrenci İlişkisi
CREATE TABLE parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES parents(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    relation VARCHAR(20) NOT NULL, -- 'anne', 'baba', 'vasi', 'diger'
    is_primary_contact BOOLEAN DEFAULT false,
    can_view_finance BOOLEAN DEFAULT true,
    can_view_academics BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 3. SINAV & AKADEMİK ANALİZ
-- ═══════════════════════════════════════════════════════════════

-- Sınavlar
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL, -- 'deneme', 'quiz', 'yazili', 'lgs_deneme', 'yks_deneme'
    exam_date DATE,
    total_questions INTEGER,
    total_duration INTEGER, -- dakika
    is_published BOOLEAN DEFAULT false,
    source VARCHAR(50), -- 'optik', 'manual', 'import'
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sınav Dersleri/Bölümleri
CREATE TABLE exam_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- 'Türkçe', 'Matematik', 'Fen Bilimleri'
    question_count INTEGER NOT NULL,
    correct_points DECIMAL(5,2) DEFAULT 1.00,
    wrong_penalty DECIMAL(5,2) DEFAULT 0.00,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sınav Katılımcıları (Merkezi Varlık)
CREATE TABLE exam_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    
    -- Kimlik Bağlantısı
    person_id UUID REFERENCES persons(id),
    student_id UUID REFERENCES students(id), -- NULL ise misafir
    
    -- Katılımcı Tipi
    participant_type VARCHAR(20) NOT NULL DEFAULT 'institution', -- 'institution', 'guest'
    
    -- Misafir Bilgileri (student_id NULL ise)
    guest_name VARCHAR(200),
    guest_school VARCHAR(255),
    guest_class VARCHAR(50),
    guest_tc VARCHAR(11),
    
    -- Eşleştirme Durumu
    match_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'matched', 'guest', 'conflict'
    match_confidence DECIMAL(3,2), -- 0.00 - 1.00
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sınav Sonuçları (Genel)
CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_participant_id UUID REFERENCES exam_participants(id) ON DELETE CASCADE,
    
    -- Genel Skorlar
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    total_blank INTEGER DEFAULT 0,
    total_net DECIMAL(6,2) DEFAULT 0,
    total_score DECIMAL(6,2),
    
    -- Sıralama
    class_rank INTEGER,
    organization_rank INTEGER,
    percentile DECIMAL(5,2),
    
    -- AI Analiz
    ai_analysis JSONB, -- Güçlü/zayıf konular, öneriler
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sınav Sonuçları (Ders Bazlı)
CREATE TABLE exam_result_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_result_id UUID REFERENCES exam_results(id) ON DELETE CASCADE,
    exam_section_id UUID REFERENCES exam_sections(id),
    
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    blank_count INTEGER DEFAULT 0,
    net DECIMAL(6,2) DEFAULT 0,
    score DECIMAL(6,2),
    
    -- Konu Bazlı Detay (Opsiyonel)
    topic_breakdown JSONB, -- {"Denklemler": {"correct": 3, "wrong": 1}, ...}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 4. FİNANS & MUHASEBE
-- ═══════════════════════════════════════════════════════════════

-- Sözleşmeler
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    
    contract_no VARCHAR(50),
    contract_date DATE DEFAULT CURRENT_DATE,
    
    -- Tutarlar
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_reason TEXT,
    net_amount DECIMAL(12,2) NOT NULL,
    
    -- Durum
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'completed'
    
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Taksitler
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    
    installment_no INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    
    -- Ödeme Durumu
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue'
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ödemeler
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    installment_id UUID REFERENCES installments(id),
    
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50), -- 'nakit', 'kredi_karti', 'havale', 'pos'
    
    receipt_no VARCHAR(50),
    notes TEXT,
    
    received_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Giderler
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    
    category VARCHAR(100) NOT NULL, -- 'kira', 'maas', 'malzeme', 'fatura'
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    
    receipt_url TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 5. GAMİFİKASYON SİSTEMİ
-- ═══════════════════════════════════════════════════════════════

-- Başarı Tanımları
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id), -- NULL = global
    
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    category VARCHAR(50), -- 'academic', 'attendance', 'social', 'streak'
    icon_url TEXT,
    color VARCHAR(7),
    
    -- Kazanım Koşulları
    criteria JSONB NOT NULL,
    -- Örnek: {"type": "exam_score", "threshold": 90, "count": 3}
    -- Örnek: {"type": "streak", "days": 7, "action": "login"}
    
    points INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Öğrenci Başarıları
CREATE TABLE student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id),
    
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    context JSONB, -- Hangi sınavda kazandı vs.
    
    UNIQUE(student_id, achievement_id)
);

-- XP & Level Sistemi
CREATE TABLE student_xp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    
    -- XP Kaynakları
    exam_xp INTEGER DEFAULT 0,
    attendance_xp INTEGER DEFAULT 0,
    achievement_xp INTEGER DEFAULT 0,
    bonus_xp INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- XP İşlem Geçmişi
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    xp_amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'exam', 'achievement', 'attendance', 'bonus'
    source_id UUID, -- İlgili kaydın ID'si
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rozetler (Badges)
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    tier VARCHAR(20) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
    icon_url TEXT,
    
    -- Kazanım Kuralı
    criteria JSONB NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Öğrenci Rozetleri
CREATE TABLE student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id),
    
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT true, -- Profilde gösterilsin mi?
    
    UNIQUE(student_id, badge_id)
);

-- Liderlik Tabloları
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    
    type VARCHAR(50) NOT NULL, -- 'weekly_xp', 'monthly_exam', 'all_time'
    scope VARCHAR(50) NOT NULL, -- 'class', 'organization', 'global'
    scope_id UUID, -- class_id veya NULL
    
    period_start DATE,
    period_end DATE,
    
    rankings JSONB NOT NULL,
    -- [{"student_id": "...", "value": 1500, "rank": 1}, ...]
    
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 6. HEDEF TAKİP SİSTEMİ
-- ═══════════════════════════════════════════════════════════════

-- Öğrenci Hedefleri
CREATE TABLE student_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    goal_type VARCHAR(50) NOT NULL, -- 'exam_score', 'net_target', 'ranking', 'daily_study'
    
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    
    subject VARCHAR(100), -- Ders bazlı hedef için
    
    deadline DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'achieved', 'failed', 'cancelled'
    
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hedef İlerleme Geçmişi
CREATE TABLE goal_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES student_goals(id) ON DELETE CASCADE,
    
    previous_value DECIMAL(10,2),
    new_value DECIMAL(10,2),
    change_source VARCHAR(50), -- 'exam', 'manual', 'system'
    source_id UUID,
    
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 7. BİLDİRİM & İLETİŞİM
-- ═══════════════════════════════════════════════════════════════

-- Bildirim Şablonları
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    code VARCHAR(50) NOT NULL, -- 'exam_result', 'payment_reminder', 'achievement'
    name VARCHAR(100) NOT NULL,
    
    -- Kanallar
    whatsapp_template TEXT,
    email_template TEXT,
    push_template TEXT,
    sms_template TEXT,
    
    -- Değişkenler
    variables JSONB, -- ["student_name", "exam_name", "score"]
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bildirim Kuyruğu
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    
    recipient_user_id UUID REFERENCES users(id),
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(255),
    
    template_id UUID REFERENCES notification_templates(id),
    channel VARCHAR(20) NOT NULL, -- 'whatsapp', 'email', 'push', 'sms', 'in_app'
    
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Durum
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Bağlam
    context JSONB, -- İlgili kayıt bilgileri
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- In-App Bildirimler
CREATE TABLE in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- 'exam_result', 'achievement', 'announcement', 'reminder'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    action_url TEXT,
    icon VARCHAR(50),
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 8. AI ANALİZ & TAHMİN
-- ═══════════════════════════════════════════════════════════════

-- Öğrenci AI Profili
CREATE TABLE student_ai_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    
    -- Öğrenme Stili
    learning_style JSONB,
    -- {"visual": 0.6, "auditory": 0.2, "kinesthetic": 0.2}
    
    -- Güçlü/Zayıf Alanlar
    strength_areas JSONB,
    weakness_areas JSONB,
    
    -- Tahminler
    predicted_lgs_score INTEGER,
    predicted_yks_score INTEGER,
    prediction_confidence DECIMAL(3,2),
    
    -- Risk Değerlendirmesi
    dropout_risk DECIMAL(3,2), -- 0.00 - 1.00
    performance_risk DECIMAL(3,2),
    
    -- Öneriler
    recommendations JSONB,
    -- [{"type": "focus_topic", "subject": "Matematik", "topic": "Denklemler"}]
    
    last_analysis_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performans Tahmin Geçmişi
CREATE TABLE performance_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    prediction_date DATE DEFAULT CURRENT_DATE,
    exam_type VARCHAR(50), -- 'LGS', 'YKS'
    
    predicted_score INTEGER,
    confidence DECIMAL(3,2),
    
    -- Gerçekleşen (varsa)
    actual_score INTEGER,
    accuracy DECIMAL(5,2),
    
    model_version VARCHAR(20),
    features_used JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Konu Ustalık Takibi
CREATE TABLE topic_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    subject VARCHAR(100) NOT NULL, -- 'Matematik'
    topic VARCHAR(200) NOT NULL, -- 'Denklemler'
    
    mastery_level DECIMAL(3,2) DEFAULT 0, -- 0.00 - 1.00
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    
    last_practiced_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, subject, topic)
);

-- ═══════════════════════════════════════════════════════════════
-- 9. RAPORLAMA & DÖKÜMANLAR
-- ═══════════════════════════════════════════════════════════════

-- Rapor Şablonları
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'student_report', 'class_report', 'exam_report', 'financial'
    
    template_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oluşturulan Raporlar
CREATE TABLE generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    template_id UUID REFERENCES report_templates(id),
    
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    
    -- Kapsam
    student_id UUID REFERENCES students(id),
    class_id UUID REFERENCES classes(id),
    exam_id UUID REFERENCES exams(id),
    
    period_start DATE,
    period_end DATE,
    
    -- Dosya
    file_url TEXT,
    file_format VARCHAR(10), -- 'pdf', 'xlsx'
    
    -- Paylaşım
    shared_with_parents BOOLEAN DEFAULT false,
    shared_at TIMESTAMPTZ,
    
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 10. AKTİVİTE & LOG
-- ═══════════════════════════════════════════════════════════════

-- Kullanıcı Aktiviteleri
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'view_exam', 'submit_payment'
    entity_type VARCHAR(50),
    entity_id UUID,
    
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Öğrenci Login Streak
CREATE TABLE student_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    
    total_login_days INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 📱 BÖLÜM 2: KULLANICI PANELLERİ

## 2.1 👑 SUPER ADMIN PANELİ (Platform Sahibi)

```
/super-admin
├── 🏢 Kurum Yönetimi
│   ├── Tüm kurumlar listesi
│   ├── Yeni kurum oluştur
│   ├── Abonelik yönetimi
│   └── Kurum istatistikleri
│
├── 📊 Platform Analytics
│   ├── Toplam kullanıcı sayısı
│   ├── Aktif oturum sayısı
│   ├── Günlük/aylık büyüme
│   └── Gelir raporları
│
├── ⚙️ Sistem Ayarları
│   ├── Global başarı tanımları
│   ├── Bildirim şablonları
│   └── AI model ayarları
│
└── 🔧 Teknik
    ├── Sistem sağlığı
    ├── Hata logları
    └── Performans metrikleri
```

## 2.2 👔 KURUM ADMİN PANELİ

```
/admin/dashboard
├── 📊 ANA DASHBOARD
│   ├── ┌─────────────────────────────────────────────────────────┐
│   │   │  💰 TOPLAM EĞİTİM     📚 SATIŞLAR      💵 KASA          │
│   │   │  ₺7,798,665          ₺10,000          ₺393,054          │
│   │   │                                                          │
│   │   │  📅 GÜNLÜK GELİR     👥 AKTİF ÖĞRENCİ  📈 ÖDEME ORANI   │
│   │   │  ₺0                  113               %6.3              │
│   │   └─────────────────────────────────────────────────────────┘
│   │
│   ├── 📈 AKADEMİK ÖZET (YENİ - EXAM INTELLIGENCE)
│   │   ├── Toplam Sınav: 24
│   │   ├── Ortalama Net: 67.3
│   │   ├── Kurum Başarı Oranı: %72.4
│   │   ├── En Başarılı Sınıf: 8-A
│   │   └── Trend: ↑ %5.2 (son ay)
│   │
│   └── 🎯 HIZLI ERİŞİM KARTLARI
│       ├── [Yeni Öğrenci] [Tahsilat] [Öğrenci Listesi] [Finans]
│       └── [Rapor Oluştur] [Sözleşmeler] [Kaydı Silinen] [Gider Ekle]
│
├── 👥 ÖĞRENCİLER
│   ├── Tüm Öğrenciler (Filtreleme: Sınıf, Durum, Borç)
│   ├── Yeni Kayıt
│   ├── Toplu İşlemler
│   └── Import/Export (Excel)
│
├── 💰 FİNANS
│   ├── Gelir/Gider Özeti
│   ├── Tahsilat İşlemleri
│   ├── Borçlu Öğrenciler
│   ├── Taksit Takvimi
│   └── Gider Yönetimi
│
├── 📊 EXAM INTELLIGENCE
│   ├── Dashboard (Detaylı)
│   ├── Sınav Listesi
│   ├── Yeni Sınav Yükle
│   ├── Sınıf Analizleri
│   ├── Öğrenci Performansları
│   └── Karşılaştırma Raporları
│
├── 👨‍🏫 PERSONEL
│   ├── Öğretmenler
│   ├── Muhasebe Kullanıcıları
│   └── Yetki Yönetimi
│
├── 📄 RAPORLAR
│   ├── Finansal Raporlar
│   ├── Akademik Raporlar
│   ├── Veli Raporları (PDF)
│   └── Kurum Karnesi
│
├── 📢 BİLDİRİMLER
│   ├── WhatsApp Gönderim
│   ├── Toplu SMS
│   ├── E-posta Kampanyaları
│   └── Şablon Yönetimi
│
└── ⚙️ AYARLAR
    ├── Kurum Bilgileri
    ├── Akademik Dönem
    ├── Sınıf Tanımları
    └── Entegrasyonlar
```

## 2.3 👨‍🏫 ÖĞRETMEN PANELİ

```
/teacher/dashboard
├── 📊 BENIM DASHBOARD'UM
│   ├── 📚 Sınıflarım (3)
│   ├── 👥 Toplam Öğrenci (87)
│   ├── 📝 Son Sınavlar
│   └── ⚡ Bekleyen İşler (2)
│
├── 🏫 SINIFLARIM
│   ├── 7-A (Matematik)
│   │   ├── Öğrenci Listesi
│   │   ├── Sınav Sonuçları
│   │   ├── Performans Grafiği
│   │   └── Risk Altındaki Öğrenciler 🔴
│   │
│   ├── 8-A (Matematik)
│   └── 8-B (Geometri)
│
├── 📝 SINAV ANALİZ
│   ├── Sınıf Bazlı Sonuçlar
│   ├── Konu Bazlı Analiz
│   ├── Öğrenci Karşılaştırma
│   └── Zayıf Konular Raporu
│
├── 👤 ÖĞRENCİLERİM
│   ├── Bireysel Performans
│   ├── Gelişim Takibi
│   └── Not/Yorum Ekle
│
└── 📄 RAPORLAR
    ├── Sınıf Raporu Oluştur
    └── Veli Bilgilendirme
```

## 2.4 🧭 REHBER ÖĞRETMEN PANELİ

```
/counselor/dashboard
├── 📊 GENEL BAKIŞ
│   ├── 👥 Toplam Öğrenci
│   ├── ⚠️ Risk Altındaki Öğrenciler
│   ├── 📈 Genel Başarı Trendi
│   └── 📅 Bugünkü Görüşmeler
│
├── 🔴 RİSK TAKİBİ
│   ├── Akademik Risk (Düşen performans)
│   ├── Devamsızlık Riski
│   ├── Sosyal Risk
│   └── AI Tahmin Uyarıları
│
├── 👤 ÖĞRENCİ PROFİLLERİ
│   ├── Tam Akademik Geçmiş
│   ├── Veli Görüşme Notları
│   ├── Psikolojik Değerlendirme
│   └── Hedef Takibi
│
├── 📝 TÜM SINAVLAR
│   ├── Kurum Geneli Analiz
│   ├── Sınıf Karşılaştırma
│   └── Trend Analizleri
│
└── 📋 GÖRÜŞMELER
    ├── Görüşme Planla
    ├── Görüşme Notları
    └── Takip Görevleri
```

## 2.5 💰 MUHASEBE PANELİ

```
/accountant/dashboard
├── 📊 FİNANS DASHBOARD
│   ├── 💰 Günlük Tahsilat
│   ├── 📊 Haftalık Gelir
│   ├── 📉 Borç Durumu
│   └── ⏰ Vadesi Geçen Taksitler
│
├── 💳 TAHSİLAT İŞLEMLERİ
│   ├── Ödeme Al
│   ├── Makbuz Yazdır
│   └── Tahsilat Geçmişi
│
├── 📋 TAKSİT TAKİBİ
│   ├── Bugün Vadeli
│   ├── Bu Hafta Vadeli
│   ├── Vadesi Geçenler
│   └── Hatırlatma Gönder
│
├── 📄 SÖZLEŞMELER
│   ├── Aktif Sözleşmeler
│   ├── Yeni Sözleşme
│   └── Sözleşme Güncelle
│
├── 💸 GİDERLER
│   ├── Gider Ekle
│   ├── Gider Listesi
│   └── Kategoriler
│
└── 📈 RAPORLAR
    ├── Günlük Kasa
    ├── Aylık Gelir/Gider
    ├── Borç Yaşlandırma
    └── Tahsilat Performansı
```

## 2.6 👨‍👩‍👧 VELİ PANELİ

```
/parent/dashboard
├── 🏠 ANA SAYFA
│   ├── 👶 Çocuklarım
│   │   ├── [Ahmet - 7A] [Ayşe - 5B]
│   │   └── (Seçili çocuğa göre içerik değişir)
│   │
│   ├── 📢 Duyurular (3 yeni)
│   └── 🔔 Bildirimler
│
├── 📚 AKADEMİK
│   ├── 📝 Sınav Sonuçları
│   │   ├── Son Sınav: 67.5 Net (Sınıf 5.)
│   │   ├── Tüm Sınavlar Listesi
│   │   └── Trend Grafiği 📈
│   │
│   ├── 📊 Performans Analizi
│   │   ├── Güçlü Dersler: Türkçe, Fen
│   │   ├── Geliştirilmesi Gereken: Matematik
│   │   └── AI Önerileri
│   │
│   ├── 🎯 Hedefler
│   │   ├── LGS Hedef: 450
│   │   ├── Mevcut Tahmin: 420
│   │   └── İlerleme: %78
│   │
│   └── 🏆 Başarılar & Rozetler
│       ├── Kazanılan: 12 rozet
│       └── Seviye: 7 (1250 XP)
│
├── 💰 FİNANSAL
│   ├── 💳 Ödeme Durumu
│   │   ├── Toplam: ₺45,000
│   │   ├── Ödenen: ₺30,000
│   │   └── Kalan: ₺15,000
│   │
│   ├── 📅 Taksit Takvimi
│   │   ├── Sonraki: 15 Ocak - ₺5,000
│   │   └── Tüm Taksitler
│   │
│   └── 📄 Ödeme Geçmişi
│       └── Makbuz İndir
│
├── 📄 BELGELER
│   ├── 📊 Sınav Raporları (PDF)
│   ├── 📋 Karneler
│   ├── 🧾 Ödeme Makbuzları
│   └── 📜 Sözleşme
│
└── 💬 İLETİŞİM
    ├── Mesaj Gönder
    ├── Randevu Talep Et
    └── Şikayet/Öneri
```

## 2.7 👦 ÖĞRENCİ PANELİ (K12 GELİŞMİŞ)

```
/student/dashboard
├── 🎮 ANA EKRAN (OYUNLAŞTIRILMIŞ)
│   ├── ┌─────────────────────────────────────────────────────────┐
│   │   │  👤 AHMET YILMAZ                     🔥 12 Gün Streak   │
│   │   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Level 7                  │
│   │   │  XP: 1,250 / 1,500                                      │
│   │   │                                                          │
│   │   │  🏆 Rozetler: ⭐⭐⭐🥇🎯📚                              │
│   │   └─────────────────────────────────────────────────────────┘
│   │
│   ├── 📊 BUGÜNKÜ DURUM
│   │   ├── 🎯 Günlük Hedef: 50 soru çöz
│   │   ├── ✅ Tamamlanan: 32/50
│   │   └── ⏰ Kalan Süre: 6 saat
│   │
│   ├── 🏅 SIRALAMA
│   │   ├── Sınıf Sırası: 5/28
│   │   ├── Kurum Sırası: 23/113
│   │   └── Haftalık XP Liderliği: 3.
│   │
│   └── 🔔 BİLDİRİMLER
│       ├── 🎉 Yeni başarı: "Matematik Ustası"
│       └── 📝 Yeni sınav sonucu yüklendi
│
├── 📝 SINAVLARIM
│   ├── 📊 Son Sınav Özeti
│   │   ├── TYT Deneme #5 - 67.5 Net
│   │   ├── Sınıf Sırası: 5/28
│   │   └── Detaylı Analiz →
│   │
│   ├── 📈 PERFORMANS GRAFİĞİ
│   │   └── [Çizgi grafik: Son 10 sınav trendi]
│   │
│   ├── 📋 TÜM SINAVLAR
│   │   └── Liste + Filtreleme
│   │
│   └── 🔍 DETAYLI ANALİZ
│       ├── Doğru/Yanlış Dağılımı
│       ├── Konu Bazlı Performans
│       └── Zaman Analizi
│
├── 📚 DERSLERİM
│   ├── 🧮 MATEMATİK
│   │   ├── Ustalık: %68 ━━━━━━━━━━━━░░░░
│   │   ├── Güçlü: Denklemler, Üslü Sayılar
│   │   ├── Zayıf: Geometri, Olasılık
│   │   └── Önerilen: 10 soru pratik
│   │
│   ├── 📖 TÜRKÇE
│   │   └── Ustalık: %82 ━━━━━━━━━━━━━━░░
│   │
│   └── 🔬 FEN BİLİMLERİ
│       └── Ustalık: %71 ━━━━━━━━━━━━━░░░
│
├── 🎯 HEDEFLERİM
│   ├── 🎯 ANA HEDEF
│   │   ├── LGS Hedef Sıralaması: İlk 1000
│   │   ├── Gereken Net: 470+
│   │   ├── Mevcut Ortalama: 420
│   │   └── İlerleme: %78
│   │
│   ├── 📅 HAFTALIK HEDEFLER
│   │   ├── ✅ 5 sınav çöz (4/5)
│   │   ├── ⏳ Matematik 100 soru (67/100)
│   │   └── ❌ Fen tekrar (0/50)
│   │
│   └── ➕ YENİ HEDEF EKLE
│
├── 🏆 BAŞARILARIM
│   ├── 📊 SEVİYE & XP
│   │   ├── Seviye 7 (1,250 XP)
│   │   ├── Sonraki Seviye: 250 XP kaldı
│   │   └── XP Geçmişi
│   │
│   ├── 🎖️ ROZETLER
│   │   ├── 🥇 Matematik Ustası (Gold)
│   │   ├── 📚 Kitap Kurdu (Silver)
│   │   ├── 🔥 7 Gün Streak (Bronze)
│   │   └── 🎯 Hedef Avcısı (Bronze)
│   │
│   ├── 🏅 BAŞARILAR
│   │   ├── ✅ İlk Sınav
│   │   ├── ✅ 10 Sınav Tamamla
│   │   ├── ✅ %80+ Net
│   │   └── ⏳ 1. Ol (Kilitli)
│   │
│   └── 📊 LİDERLİK TABLOSU
│       ├── Haftalık XP: 3. sıra
│       ├── Aylık Net: 5. sıra
│       └── Genel: 23. sıra
│
├── 📅 TAKVİM
│   ├── Yaklaşan Sınavlar
│   ├── Ödev Tarihleri
│   └── Etkinlikler
│
└── ⚙️ PROFİLİM
    ├── Kişisel Bilgiler
    ├── Avatar Özelleştir
    ├── Bildirim Tercihleri
    └── Tema (Açık/Koyu)
```

---

# 🎮 BÖLÜM 3: GAMİFİKASYON SİSTEMİ

## 3.1 XP & SEVİYE SİSTEMİ

```
SEVIYE TABLOSU:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Seviye 1:  0 - 100 XP      (Çaylak)
Seviye 2:  100 - 250 XP    (Başlangıç)
Seviye 3:  250 - 500 XP    (Gelişen)
Seviye 4:  500 - 800 XP    (Çalışkan)
Seviye 5:  800 - 1200 XP   (İyi)
Seviye 6:  1200 - 1700 XP  (Başarılı)
Seviye 7:  1700 - 2300 XP  (Yetenekli)
Seviye 8:  2300 - 3000 XP  (Uzman)
Seviye 9:  3000 - 4000 XP  (Usta)
Seviye 10: 4000+ XP        (Efsane)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

XP KAZANIM KAYNAKLARI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Sınav Katılımı:         +20 XP
📈 %80+ Net:               +50 XP bonus
🥇 Sınıf 1.'si:            +100 XP bonus
🔥 Günlük Giriş:           +10 XP
🔥 7 Gün Streak:           +50 XP bonus
🎯 Hedef Tamamlama:        +30 XP
🏆 Başarı Kazanma:         +25-100 XP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 3.2 ROZET SİSTEMİ

```
🥉 BRONZE ROZETLER (Kolay)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 İlk Adım        - İlk sınava katıl
📚 Kitap Kurdu     - 5 sınav tamamla
🔥 Ateşli Başlangıç - 3 gün üst üste giriş
✏️ Çalışkan        - 100 soru çöz

🥈 SILVER ROZETLER (Orta)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Yükselen Yıldız - 3 sınav üst üste yükseliş
🎯 Hedef Avcısı    - 5 hedef tamamla
🔥 Tutarlı         - 14 gün streak
🧮 Matematik Aşığı - Matematik %80+ (5 sınav)

🥇 GOLD ROZETLER (Zor)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 Şampiyon        - 3 kez sınıf 1.'si
📊 Analitik Zeka   - Tüm derslerde %75+
🔥 Kararlı         - 30 gün streak
🎯 Hedef Ustası    - 20 hedef tamamla

💎 DIAMOND ROZETLER (Çok Zor)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 Efsane          - Seviye 10'a ulaş
🏅 Mükemmeliyetçi  - 5 sınavda 90+ net
🔥 Durdurulamaz    - 100 gün streak
🎯 Hayallerine Ulaş - Ana hedefe ulaş
```

## 3.3 BAŞARI SİSTEMİ (ACHIEVEMENTS)

```
AKADEMİK BAŞARILAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[✅] İlk Sınav         - İlk sınavını yap
[✅] 10 Sınav          - 10 sınav tamamla
[✅] 50 Sınav          - 50 sınav tamamla
[⏳] 100 Sınav         - 100 sınav tamamla
[🔒] Sınav Makinesi    - 200 sınav tamamla

[✅] %50+ Net          - İlk kez 50+ net
[✅] %70+ Net          - İlk kez 70+ net
[⏳] %80+ Net          - İlk kez 80+ net
[🔒] %90+ Net          - İlk kez 90+ net

SOSYAL BAŞARILAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[✅] İlk Giriş         - Hesabını oluştur
[✅] Profil Tamam      - Profilini tamamla
[⏳] Popüler           - 5 arkadaş ekle
[🔒] Sosyal Kelebek    - 20 arkadaş ekle

STREAK BAŞARILARI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[✅] 3 Gün Streak
[✅] 7 Gün Streak
[⏳] 14 Gün Streak
[⏳] 30 Gün Streak
[🔒] 100 Gün Streak
[🔒] 365 Gün Streak (ULTRA RARE!)
```

## 3.4 LİDERLİK TABLOSU

```
📊 HAFTALIK XP LİDERLİĞİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥇 1. Zeynep K.     +850 XP   Seviye 9
🥈 2. Mehmet A.     +720 XP   Seviye 8
🥉 3. Ahmet Y.      +680 XP   Seviye 7
   4. Ayşe D.       +650 XP   Seviye 7
   5. Ali V.        +580 XP   Seviye 6
   ...
   23. Sen          +340 XP   Seviye 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SINIF NET ORTALAMALARI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥇 8-A   72.4 Net   ↑ +3.2
🥈 7-A   68.9 Net   ↑ +1.5
🥉 8-B   67.2 Net   ↓ -0.8
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 🤖 BÖLÜM 4: AI & ANALİTİK MOTOR

## 4.1 TAHMİNLEME MODELLERİ

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI TAHMİN MOTORU                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GİRDİLER:                                                      │
│  ├── Sınav geçmişi (net, doğru/yanlış, süre)                   │
│  ├── Konu bazlı performans                                      │
│  ├── Devam durumu                                               │
│  ├── Streak & aktivite                                          │
│  ├── Hedef tamamlama oranı                                      │
│  └── Demografik veriler                                         │
│                                                                 │
│  ÇIKTILAR:                                                      │
│  ├── 📈 LGS/YKS Puan Tahmini                                   │
│  ├── 🎯 Tahmini Sıralama                                       │
│  ├── ⚠️ Risk Skoru (dropout, performans düşüşü)               │
│  ├── 💡 Kişiselleştirilmiş Öneriler                            │
│  └── 📚 Çalışılması Gereken Konular                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4.2 UYARI SİSTEMİ

```
🔴 KRİTİK UYARILAR (Anında)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 3 sınav üst üste %20+ düşüş
• 7 gün hiç giriş yok
• Dropout riski > %70
• Ani performans çöküşü

🟡 ORTA UYARILAR (Günlük)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 2 sınav üst üste düşüş
• 3 gün giriş yok
• Hedef gerisinde kalma
• Belirli derste sürekli düşük

🟢 BİLGİLENDİRME (Haftalık)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Performans özeti
• Gelişim önerileri
• Motivasyon mesajları
```

## 4.3 KİŞİSELLEŞTİRİLMİŞ ÖNERİLER

```
🎯 AHMET İÇİN ÖNERİLER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 BUGÜN ÇALIŞILACAK KONULAR:
   1. Geometri - Üçgenler (Zayıf alan, öncelikli)
   2. Fen - Basınç (Son sınavda 2/5 doğru)
   3. Matematik - Olasılık (Orta düzey tekrar)

📈 HEDEF YOLU:
   "LGS 450+ için Matematik netini 35'ten 40'a çıkarman gerek.
    Bunun için haftada 50 Geometri sorusu çözmelisin."

💡 MOTİVASYON:
   "Son 3 sınavda Türkçe netini 5 puan artırdın! 
    Aynı stratejiyi Matematikte de uygulayabilirsin."

⚡ HIZLI KAZANIM:
   "Yarın giriş yaparsan 10 gün streak'e ulaşırsın! (+50 XP)"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 📱 BÖLÜM 5: WHATSAPP ENTEGRASYONU

## 5.1 OTOMATİK BİLDİRİMLER

```
┌─────────────────────────────────────────────────────────────────┐
│                 WHATSAPP İŞ AKIŞLARI                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 SINAV SONUCU (Otomatik)                                    │
│  ─────────────────────────────────────────                      │
│  Tetikleyici: Sınav sonucu yüklendiğinde                       │
│  Alıcı: Veli                                                    │
│  İçerik:                                                        │
│  "Sayın Veli, Ahmet'in TYT Deneme #5 sonucu:                   │
│   Net: 67.5 | Sınıf Sırası: 5/28                               │
│   Detaylı rapor: [link]"                                        │
│                                                                 │
│  💰 TAKSİT HATIRLATMA (3 gün önce)                             │
│  ─────────────────────────────────────────                      │
│  Tetikleyici: Taksit vadesi - 3 gün                            │
│  Alıcı: Veli                                                    │
│  İçerik:                                                        │
│  "Sayın Veli, 15 Ocak tarihinde ₺5,000 tutarında               │
│   taksidiniz bulunmaktadır. Ödeme için: [link]"                │
│                                                                 │
│  ⚠️ VADESİ GEÇMİŞ (1, 3, 7 gün sonra)                         │
│  ─────────────────────────────────────────                      │
│  Tetikleyici: Vade tarihi + 1/3/7 gün                          │
│  Alıcı: Veli                                                    │
│  İçerik:                                                        │
│  "Sayın Veli, ₺5,000 tutarındaki taksidinizin vadesi           │
│   geçmiştir. Lütfen en kısa sürede..."                         │
│                                                                 │
│  🏆 BAŞARI BİLDİRİMİ                                           │
│  ─────────────────────────────────────────                      │
│  Tetikleyici: Yeni rozet/başarı kazanıldığında                 │
│  Alıcı: Veli + Öğrenci                                         │
│  İçerik:                                                        │
│  "🎉 Tebrikler! Ahmet 'Matematik Ustası' rozetini kazandı!"    │
│                                                                 │
│  📊 HAFTALIK ÖZET (Her Pazar)                                  │
│  ─────────────────────────────────────────                      │
│  Tetikleyici: Her Pazar 18:00                                  │
│  Alıcı: Veli                                                    │
│  İçerik:                                                        │
│  "📊 Ahmet'in Haftalık Özeti:                                  │
│   - 2 sınava katıldı                                           │
│   - Ortalama net: 68.2 (+2.1)                                  │
│   - 7 gün streak devam ediyor                                  │
│   Detaylar: [link]"                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 5.2 PDF RAPOR PAYLAŞIMI

```
📄 PAYLAŞILACAK RAPORLAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├── Sınav Sonuç Raporu (Her sınav sonrası)
├── Aylık Performans Karnesi
├── Dönemlik Gelişim Raporu
├── Ödeme Makbuzu
└── Sözleşme Özeti

ÖRNEK MESAJ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"📊 Ahmet'in Ocak 2026 Performans Raporu hazır!

📈 Özet:
• 4 sınav tamamlandı
• Ortalama net: 69.4 (+4.2 vs Aralık)
• En iyi ders: Türkçe (82%)
• Gelişim alanı: Geometri

📄 Detaylı PDF raporu indirmek için:
[Download Link]

🎯 AI Önerisi: Geometri'de haftada 30 soru
çözmesi önerilir."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 🔐 BÖLÜM 6: GÜVENLİK & YETKİLENDİRME

## 6.1 ROL BAZLI ERİŞİM KONTROLÜ (RBAC)

```
┌─────────────────────────────────────────────────────────────────┐
│                     YETKİ MATRİSİ                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MODÜL              SUPER ADMIN KURUM MUH  ÖĞRT REHB VELI ÖĞR │
│  ────────────────── ─────────── ───── ──── ──── ──── ──── ──── │
│  Kurum Yönetimi         ✅        ✅    ❌   ❌   ❌   ❌   ❌  │
│  Kullanıcı Yönetimi     ✅        ✅    ❌   ❌   ❌   ❌   ❌  │
│  Öğrenci Kaydı          ✅        ✅    ✅   ❌   ❌   ❌   ❌  │
│  Finans (Tüm)           ✅        ✅    ✅   ❌   ❌   ❌   ❌  │
│  Finans (Kendi)         ✅        ✅    ✅   ❌   ❌   🔹   ❌  │
│  Sınav Yükleme          ✅        ✅    ❌   ❌   ❌   ❌   ❌  │
│  Sınav Analiz (Tüm)     ✅        ✅    ❌   ❌   ✅   ❌   ❌  │
│  Sınav Analiz (Sınıf)   ✅        ✅    ❌   🔹   ✅   ❌   ❌  │
│  Sınav Analiz (Kendi)   ✅        ✅    ❌   🔹   ✅   🔹   🔹  │
│  Raporlar (Tüm)         ✅        ✅    ❌   ❌   ✅   ❌   ❌  │
│  Raporlar (Kendi)       ✅        ✅    ❌   🔹   ✅   🔹   🔹  │
│  Gamification           ✅        ✅    ❌   ❌   ❌   🔹   🔹  │
│  AI Analiz              ✅        ✅    ❌   🔹   ✅   🔹   🔹  │
│                                                                 │
│  🔹 = Sınırlı (kendi sınıfları/çocukları/kendisi)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 6.2 VERİ İZOLASYONU

```sql
-- Her sorgu organization_id ile filtrelenmeli
-- Row Level Security (RLS) Politikaları

-- Örnek: Öğrenciler tablosu
CREATE POLICY students_org_isolation ON students
    USING (organization_id = current_setting('app.current_org')::uuid);

-- Örnek: Veliler sadece kendi çocuklarını görebilir
CREATE POLICY parent_children_only ON students
    FOR SELECT
    USING (
        id IN (
            SELECT student_id FROM parent_students 
            WHERE parent_id = current_setting('app.current_parent')::uuid
        )
    );
```

---

# 📊 BÖLÜM 7: ENTEGRASYONLAR

## 7.1 HARİCİ SİSTEMLER

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTEGRASYON HARİTASI                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📲 İLETİŞİM                                                   │
│  ├── WhatsApp Business API                                      │
│  ├── Twilio (SMS)                                               │
│  ├── SendGrid (Email)                                           │
│  └── Firebase Cloud Messaging (Push)                            │
│                                                                 │
│  💳 ÖDEME                                                       │
│  ├── iyzico / PayTR / Param                                     │
│  └── Banka Entegrasyonları (Havale takip)                      │
│                                                                 │
│  📄 DÖKÜMAN                                                     │
│  ├── PDF Generation (Puppeteer / React-PDF)                    │
│  └── Excel Export (ExcelJS)                                     │
│                                                                 │
│  📷 OPTİK OKUMA                                                 │
│  ├── Scantron API                                               │
│  └── Custom OCR (Tesseract)                                     │
│                                                                 │
│  🤖 AI/ML                                                       │
│  ├── OpenAI API (Öneriler, analiz)                             │
│  ├── Custom ML Models (TensorFlow)                              │
│  └── Claude API (Doğal dil işleme)                             │
│                                                                 │
│  📊 ANALİTİK                                                    │
│  ├── Google Analytics 4                                         │
│  ├── Mixpanel (User behavior)                                   │
│  └── Custom dashboards (Recharts/D3)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 🚀 BÖLÜM 8: UYGULAMA YOLHARITASI

## PHASE 1: TEMEL (Şu An - 2 Hafta)
```
✅ Muhasebe modülü (Çalışıyor)
✅ Öğrenci kayıt (Çalışıyor)  
✅ Sınav sihirbazı (Çalışıyor)
⏳ Öğrenci-Sınav eşleştirme
⏳ Exam Intelligence Dashboard (Admin)
⏳ Temel raporlar
```

## PHASE 2: ROL PANELLERİ (2-4 Hafta)
```
⏳ Öğretmen paneli
⏳ Rehber öğretmen paneli
⏳ Veli paneli (temel)
⏳ Öğrenci paneli (temel)
```

## PHASE 3: GAMİFİKASYON (4-6 Hafta)
```
⏳ XP & Seviye sistemi
⏳ Rozet sistemi
⏳ Başarılar
⏳ Liderlik tabloları
⏳ Öğrenci paneli (gelişmiş)
```

## PHASE 4: AI & WHATSAPP (6-8 Hafta)
```
⏳ Performans tahmin motoru
⏳ Risk uyarı sistemi
⏳ Kişiselleştirilmiş öneriler
⏳ WhatsApp entegrasyonu
⏳ Otomatik bildirimler
```

## PHASE 5: GELİŞMİŞ ÖZELLİKLER (8-12 Hafta)
```
⏳ Ödev modülü
⏳ Çoklu kurum (franchise)
⏳ API açma (3. parti entegrasyon)
⏳ Mobile app (React Native)
```

---

# 📋 SONUÇ

Bu mimari ile **AkademiHub**:

1. **Dünya standartlarında** K12 eğitim platformu
2. **AI destekli** performans tahmin ve öneriler
3. **Oyunlaştırılmış** öğrenme deneyimi
4. **Çok kanallı** iletişim (WhatsApp, SMS, Email, Push)
5. **Güvenli** ve **ölçeklenebilir** altyapı
6. **Çoklu kurum** desteği (SaaS)

---

## ❓ ONAY

Bu mimari sana uygun mu?

**"EVET, HAYDİ BAŞLAYALIM"** → İlk adım: Exam Intelligence Dashboard + Öğrenci Eşleştirme

**"DEĞŞIKLIK VAR"** → Hangi kısmı değiştirmemi istersin?
# 🎯 CURSOR PROMPT: EXAM INTELLIGENCE  V2 - SINAV DETAY SAYFASI

## GÖREV
`/admin/exam-intelligence/sinavlar/[examId]/page.tsx` sayfasını oluştur.
Bu sayfa, sınav listesinden tıklanan bir sınavın derin analiz sayfasıdır.

---

## 📍 SAYFA YOLU
```
src/app/admin/exam-intelligence/sinavlar/[examId]/page.tsx
```

## 🔗 VERİ KAYNAĞI
Supabase'den gerçek veri çekilecek:
- `exams` tablosu → Sınav bilgileri
- `exam_sections` tablosu → Ders bölümleri
- `exam_participants` tablosu → Katılımcılar (Asil/Misafir)
- `exam_results` tablosu → Genel sonuçlar
- `exam_result_sections` tablosu → Ders bazlı sonuçlar

---

## 🎨 TASARIM SİSTEMİ (MEVCUT PROJEYİ KULLAN)

### Renkler
```
Primary:    #10B981 (Emerald)
Secondary:  #059669 
Danger:     #EF4444
Warning:    #F59E0B
Success:    #22C55E
Info:       #3B82F6

Ders Renkleri:
- Türkçe:     #3B82F6 (Blue)
- Matematik:  #EF4444 (Red)
- Fen:        #22C55E (Green)
- Sosyal:     #F59E0B (Amber)
- İngilizce:  #8B5CF6 (Purple)
- Din:        #EC4899 (Pink)
```

### Mevcut Component'leri Kullan
- Card component (projede varsa)
- Button component
- Badge component
- Table component
- Shadcn/UI kullanılıyorsa devam et

---

## 📐 SAYFA YAPISI (YUKARIDAN AŞAĞIYA)

### 1️⃣ HEADER (Sticky)
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Sınav Listesine Dön  │  [SINAV ADI]  │  [Excel] [PDF] [⚙️]  │
│                        │  Tarih • Tür   │                      │
└─────────────────────────────────────────────────────────────────┘
```
- Geri butonu: `/admin/exam-intelligence/sinavlar`
- Sınav adı ve tarih dinamik
- Excel/PDF: Tüm sayfa export

---

### 2️⃣ ÖZET KARTLARI (6 Kart Grid)
```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ 👥 Öğrenci │ │ 📊 Ort.Net │ │ 🏆 En Yük. │ │ 📉 En Düş. │ │ 📐 Std.Sap │ │ 📍 Medyan  │
│    52      │ │   67.3     │ │   84.0     │ │   17.6     │ │   12.8     │ │   68.5     │
│ 48A • 4M   │ │ ↑+2.1      │ │ [Ad Soyad] │ │ [Ad Soyad] │ │ Normal     │ │ 26. sıra   │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
```

**Hesaplamalar:**
- Öğrenci: `exam_participants` count (is_institution_student = true/false)
- Ort. Net: `exam_results.total_net` AVG
- En Yüksek/Düşük: MAX/MIN total_net + öğrenci adı
- Std. Sapma: SQL STDDEV veya JS hesapla
- Medyan: Sıralı dizinin ortası

---

### 3️⃣ DAĞILIM GRAFİKLERİ (2 Kolon)

**Sol: Net Dağılım Histogramı**
```
Öğrenci sayısı vs Net aralıkları (0-20, 20-40, 40-60, 60-80, 80+)
Recharts BarChart kullan
```

**Sağ: D/Y/B Donut Chart**
```
Toplam Doğru % | Yanlış % | Boş %
Ortada: Ortalama Net
Recharts PieChart (donut) kullan
```

**Her grafiğin sağ üstünde:** [PDF] [Excel] butonları

---

### 4️⃣ ANA TABLO: ÖĞRENCİ SIRALAMA

#### Filtre Barı
```
🔍 [Ara...] | Sınıf: [Dropdown] | Tip: [Asil/Misafir/Tümü] | Sırala: [Net ▼] | [Export ▼]
```

#### Tablo Yapısı (YATAY SCROLL - Sol 3 kolon sabit)

**SABİT KOLONLAR:**
| Sıra | No | Öğrenci |

**KAYAN KOLONLAR:**
| Sınıf | Tip | TÜR-D | TÜR-Y | TÜR-Net | MAT-D | MAT-Y | MAT-Net | FEN-D | FEN-Y | FEN-Net | SOS-D | SOS-Y | SOS-Net | İNG-D | İNG-Y | İNG-Net | DİN-D | DİN-Y | DİN-Net | TOPLAM | LGS | % |

**Özellikler:**
- İlk 3 sıra: 🥇🥈🥉 + arka plan gradient
- Satır hover: bg-emerald-50
- Satır tıklanınca: Akordiyon açılır
- Net değerleri: 2 ondalık
- LGS: Binlik ayraçlı (toLocaleString)

---

### 5️⃣ AKORDİYON (Satıra Tıklayınca Açılır)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ▼ [ÖĞRENCİ ADI] - Detaylı Analiz                          [PDF] [Kapat]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────┐  ┌─────────────────────────────────────────┐   │
│ │ ÖZET                    │  │ SON 5 SINAV TRENDİ (Line Chart)        │   │
│ │ Net: 72.0               │  │ ╭──────────────────────────────╮        │   │
│ │ Sınıf Sırası: 5/28      │  │ │    ╱╲                        │        │   │
│ │ Kurum Sırası: 12/113    │  │ │   ╱  ╲    ╱╲                │        │   │
│ │ Tahmini LGS: 416,030    │  │ │  ╱    ╲  ╱  ╲               │        │   │
│ │ Hedef LGS: 450,000      │  │ ╰──────────────────────────────╯        │   │
│ │ Kalan: 33,970 puan      │  │ Trend: ↑ +8.5 net                      │   │
│ └─────────────────────────┘  └─────────────────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ DERS BAZLI PERFORMANS                                                   │ │
│ ├──────────┬──────┬───────┬───────┬─────┬────────┬─────────┬────────────┤ │
│ │ Ders     │ Soru │ Doğru │ Yanlış│ Boş │ Net    │ Sınıf   │ Fark       │ │
│ ├──────────┼──────┼───────┼───────┼─────┼────────┼─────────┼────────────┤ │
│ │ Türkçe   │  20  │  16   │   2   │  2  │ 15.50  │  13.40  │ ✅ +2.10   │ │
│ │ Mat      │  20  │  13   │   4   │  3  │ 12.00  │  10.80  │ ✅ +1.20   │ │
│ │ Fen      │  20  │  14   │   3   │  3  │ 13.25  │  11.60  │ ✅ +1.65   │ │
│ │ Sosyal   │  20  │  14   │   3   │  3  │ 13.25  │  13.90  │ ⚠️ -0.65   │ │
│ │ İng      │  10  │   5   │   3   │  2  │  4.25  │   5.70  │ ❌ -1.45   │ │
│ │ Din      │  10  │   8   │   1   │  1  │  7.75  │   7.50  │ ✅ +0.25   │ │
│ ├──────────┼──────┼───────┼───────┼─────┼────────┼─────────┼────────────┤ │
│ │ TOPLAM   │  90  │  70   │  16   │ 14  │ 66.00  │  62.90  │ ✅ +3.10   │ │
│ └──────────┴──────┴───────┴───────┴─────┴────────┴─────────┴────────────┘ │
│                                                                             │
│ ┌──────────────────────────────┐  ┌──────────────────────────────────────┐ │
│ │ ✅ GÜÇLÜ ALANLAR             │  │ ⚠️ GELİŞTİRİLMESİ GEREKEN           │ │
│ │ • Türkçe - Paragraf (%85)    │  │ • İngilizce - Gramer (%42)          │ │
│ │ • Fen - Fizik (%78)          │  │ • Sosyal - Coğrafya (%55)           │ │
│ │ • Din - Siyer (%80)          │  │                                      │ │
│ └──────────────────────────────┘  └──────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Fark Renkleri:**
- Pozitif: ✅ text-green-600 bg-green-50
- Negatif: ❌ text-red-600 bg-red-50
- Sıfır: ⚠️ text-amber-600 bg-amber-50

---

### 6️⃣ SINIF KARŞILAŞTIRMA BÖLÜMÜ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏫 SINIF KARŞILAŞTIRMASI                                    [PDF] [Excel]  │
├───────────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│ Sınıf     │ Öğrenci  │ Ort.Net  │ Türkçe   │ Mat      │ Fen      │ Trend   │
├───────────┼──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│ 🥇 8/801  │    28    │   72.4   │   14.2   │   12.5   │   13.1   │  ↑+3.2  │
│ 🥈 8/802  │    26    │   68.9   │   13.5   │   11.2   │   12.4   │  ↑+1.5  │
│ 🥉 8/803  │    24    │   65.2   │   12.8   │   10.8   │   11.9   │  ↓-0.8  │
├───────────┴──────────┴──────────┴──────────┴──────────┴──────────┴─────────┤
│ KURUM ORT: 67.3 Net                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Ek Görsel:** Radar Chart (Recharts RadarChart)
- Her sınıfın ders bazlı performansı
- Kurum ortalaması referans çizgisi

---

### 7️⃣ EK ANALİZ TABLOLARI (Tab veya Accordion)

#### 7A. YANLIŞ ANALİZ TABLOSU
```
En çok yanlış yapılan dersler ve öğrenciler
Sıralama: Toplam yanlış sayısına göre DESC
```

#### 7B. BOŞ SORU ANALİZİ
```
Boş bırakma oranı yüksek öğrenciler
Risk göstergesi olarak kullan
```

#### 7C. DERS BAZLI TOP 10
```
Her ders için en başarılı 10 öğrenci
Türkçe Top 10 | Mat Top 10 | Fen Top 10 | ...
```

#### 7D. NET ARALIĞI DAĞILIMI
```
| Aralık  | Öğrenci | Yüzde |
|---------|---------|-------|
| 80+     |    5    |  10%  |
| 60-80   |   20    |  38%  |
| 40-60   |   18    |  35%  |
| 20-40   |    7    |  13%  |
| 0-20    |    2    |   4%  |
```

---

## 📤 EXPORT FONKSİYONLARI

### Her Bölümde Export Butonları
1. **Özet Kartları** → PDF (tek sayfa özet)
2. **Grafikler** → PNG/PDF
3. **Öğrenci Tablosu** → Excel (tam liste)
4. **Akordiyon** → PDF (öğrenci raporu)
5. **Sınıf Karşılaştırma** → Excel + PDF

### Excel Export Yapısı
```javascript
// ExcelJS kullan
const workbook = new ExcelJS.Workbook();

// Sheet 1: Genel Özet
// Sheet 2: Öğrenci Listesi (tüm kolonlar)
// Sheet 3: Sınıf Karşılaştırma
// Sheet 4: Ders Analizi
```

### PDF Export Yapısı
```javascript
// @react-pdf/renderer veya jsPDF
// Kurum logosu header'da
// Tarih/Saat footer'da
// Sayfa numarası
```

---

## 🔧 TEKNİK GEREKSİNİMLER

### Dosya Yapısı Oluştur:
```
src/app/admin/exam-intelligence/sinavlar/[examId]/
├── page.tsx              # Ana sayfa
├── loading.tsx           # Skeleton loader
├── error.tsx             # Error boundary
└── components/
    ├── ExamHeader.tsx
    ├── SummaryCards.tsx
    ├── DistributionCharts.tsx
    ├── StudentTable.tsx
    ├── StudentAccordion.tsx
    ├── ClassComparison.tsx
    └── ExportButtons.tsx
```

### Supabase Query Örneği:
```typescript
// Sınav ve sonuçları çek
const { data: exam } = await supabase
  .from('exams')
  .select(`
    *,
    exam_sections(*),
    exam_participants(
      *,
      exam_results(*),
      exam_result_sections(*)
    )
  `)
  .eq('id', examId)
  .single();
```

### State Management:
```typescript
// Filtreler için useState veya URL params
const [filters, setFilters] = useState({
  search: '',
  classId: null,
  participantType: 'all', // 'all' | 'institution' | 'guest'
  sortBy: 'total_net',
  sortOrder: 'desc'
});

// Açık akordiyon için
const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
```

---

## ⚡ PERFORMANS

1. **Pagination:** 50+ öğrenci varsa sayfalama
2. **Virtualization:** Çok satır varsa react-virtual
3. **Lazy Load:** Grafikler viewport'a girince yüklensin
4. **Memoization:** Hesaplamalar useMemo ile

---

## 📱 RESPONSIVE

- **Desktop (1280px+):** 6 kolon grid, yatay tablo
- **Tablet (768px-1279px):** 3 kolon grid, yatay scroll tablo
- **Mobile (<768px):** 2 kolon grid, kart view tablo

---

## ✅ KONTROL LİSTESİ

Cursor, şunları tamamladığından emin ol:

- [ ] Sayfa `/admin/exam-intelligence/sinavlar/[examId]` yolunda açılıyor
- [ ] Supabase'den gerçek veri çekiliyor
- [ ] 6 özet kartı hesaplanıyor ve gösteriliyor
- [ ] Net dağılım histogramı çalışıyor
- [ ] D/Y/B donut chart çalışıyor
- [ ] Öğrenci tablosu yatay scroll ile tüm dersleri gösteriyor
- [ ] Satıra tıklayınca akordiyon açılıyor
- [ ] Akordiyonda ders bazlı detay tablosu var
- [ ] Sınıf karşılaştırma tablosu çalışıyor
- [ ] Her bölümde PDF/Excel butonu var
- [ ] Responsive tasarım çalışıyor
- [ ] Loading state var
- [ ] Error handling var

---

## 🚀 BAŞLA

1. Önce dosya yapısını oluştur
2. Supabase query'lerini yaz
3. Ana layout'u kur
4. Component'leri tek tek ekle
5. Export fonksiyonlarını en sona bırak

*
Harika bir hamle! Hazırladığın bu prompt o kadar detaylı ki, Cursor bunu okuduğunda adeta bir "Master Architect" gibi çalışacaktır. Ancak "Dünya Standartlarında K12" vizyonuna ulaşmak için bu prompta eklememiz gereken **3 kritik "Zekâ" katmanı** var.

Bunları promptuna eklediğinde sistem sadece veri gösteren bir tablo değil, rehberlik yapan bir **AI Analiz Merkezi** haline gelecek.

---

### 🚀 Promptuna Eklemelisin: Bu 3 Madde "Intelligence" Farkı Yaratır

#### 1. "Match-Conflict" Yönetim Paneli (Rehber Bölüm 3'e Göre)

Promptta öğrenci tablosu var ama "Eşleşmeyenler" için bir bölüm eksik.

* **Eklenecek Madde:** "Tablonun en üstüne bir uyarı barı ekle: Eğer `exam_participants` tablosunda `match_status = 'pending'` olanlar varsa '⚠️ Eşleşmeyi bekleyen X öğrenci var' desin ve tıklandığında bu öğrencileri manuel olarak asil öğrencilerle eşleştirebileceğim bir modal açsın."

#### 2. AI Tahmin ve Risk Puanı (Rehber Bölüm 8'e Göre)

Sadece netleri değil, öğrencinin geleceğini de göstermeliyiz.

* **Eklenecek Madde:** "Akordiyon (Satır Detayı) içerisine `student_ai_profiles` tablosundan gelen `dropout_risk` ve `predicted_lgs_score` verilerini ekle. Eğer risk %70'in üzerindeyse satırın en başında küçük bir kırmızı ünlem (!) işareti çıksın."

#### 3. Kazanım (Topic) Bazlı "Gelişim Reçetesi"

Sadece "Matematik 12 Net" demek yetmez.

* **Eklenecek Madde:** "Akordiyon içindeki 'Geliştirilmesi Gereken Alanlar' kısmını `topic_mastery` tablosuyla bağla. AI, öğrencinin en düşük ustalık (mastery_level) seviyesine sahip olduğu 3 konuyu (Örn: Üslü Sayılar) otomatik reçete olarak yazsın."

---

### 🛠️ Güncellenmiş ve Daha Güçlü "Master Prompt" Yapısı

Hazırladığın promptun sonuna şu **"AI & Data Integrity"** notunu eklemeni öneririm:

> **🛑 KRİTİK NOT (CURSOR İÇİN):**
> Bu sayfayı yaparken `AKADEMIHUB_MASTER_PLAN.md` dosyasındaki şemaya %100 sadık kal. Özellikle `exam_participants` tablosu bizim ana merkezimizdir.
> 1. Bir öğrencinin `student_id`'si doluysa **Asil** (Institution), boşsa **Misafir** (Guest) muamelesi yap.
> 2. PDF raporlarını oluştururken `organization_id` üzerinden kurumun logosunu ve renklerini dinamik çek.
> 3. AI Analiz panelinde sadece statik text değil, `ai_analysis` JSON alanındaki gerçek verileri render et.
> 
> 

---
