-- ============================================================================
-- GAMIFICATION TABLES
-- XP, Seviye, Rozet, Başarı ve Liderlik Tabloları
-- ============================================================================

-- XP & Level Sistemi
CREATE TABLE IF NOT EXISTS student_xp (
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
CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    
    xp_amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'exam', 'achievement', 'attendance', 'bonus', 'streak'
    source_id UUID, -- İlgili kaydın ID'si
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Başarı Tanımları
CREATE TABLE IF NOT EXISTS achievements (
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
CREATE TABLE IF NOT EXISTS student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id),
    
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    context JSONB, -- Hangi sınavda kazandı vs.
    
    UNIQUE(student_id, achievement_id)
);

-- Rozetler (Badges)
CREATE TABLE IF NOT EXISTS badges (
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
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id),
    
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT true, -- Profilde gösterilsin mi?
    
    UNIQUE(student_id, badge_id)
);

-- Liderlik Tabloları
CREATE TABLE IF NOT EXISTS leaderboards (
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

-- Öğrenci Login Streak
CREATE TABLE IF NOT EXISTS student_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    
    total_login_days INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hedef Takip Sistemi
CREATE TABLE IF NOT EXISTS student_goals (
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

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_student_xp_student ON student_xp(student_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_student ON xp_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source);
CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_org_type ON leaderboards(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_student_streaks_student ON student_streaks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_student ON student_goals(student_id);

-- Varsayılan başarılar ekle
INSERT INTO achievements (code, name, description, category, criteria, xp) VALUES
('first_exam', 'İlk Adım', 'İlk sınavına katıl', 'academic', '{"type": "exam_count", "count": 1}', 20),
('ten_exams', 'Sınav Ustası', '10 sınav tamamla', 'academic', '{"type": "exam_count", "count": 10}', 100),
('fifty_exams', 'Sınav Efsanesi', '50 sınav tamamla', 'academic', '{"type": "exam_count", "count": 50}', 500),
('high_net_70', 'Başarılı', '70+ net al', 'academic', '{"type": "net_threshold", "threshold": 70}', 50),
('high_net_80', 'Çok Başarılı', '80+ net al', 'academic', '{"type": "net_threshold", "threshold": 80}', 100),
('high_net_90', 'Mükemmel', '90+ net al', 'academic', '{"type": "net_threshold", "threshold": 90}', 200),
('streak_3', 'Tutarlı', '3 gün üst üste giriş yap', 'streak', '{"type": "streak", "days": 3}', 30),
('streak_7', 'Kararlı', '7 gün üst üste giriş yap', 'streak', '{"type": "streak", "days": 7}', 70),
('streak_30', 'Durdurulamaz', '30 gün üst üste giriş yap', 'streak', '{"type": "streak", "days": 30}', 300),
('class_first', 'Sınıf Birincisi', 'Bir sınavda sınıf 1.si ol', 'academic', '{"type": "rank", "rank": 1, "scope": "class"}', 150)
ON CONFLICT (code) DO NOTHING;

-- Varsayılan rozetler ekle
INSERT INTO badges (code, name, description, tier, criteria) VALUES
('math_master_bronze', 'Matematik Çırağı', 'Matematikte 3 sınav 70+ net', 'bronze', '{"subject": "Matematik", "threshold": 70, "count": 3}'),
('math_master_silver', 'Matematik Ustası', 'Matematikte 5 sınav 80+ net', 'silver', '{"subject": "Matematik", "threshold": 80, "count": 5}'),
('math_master_gold', 'Matematik Efsanesi', 'Matematikte 10 sınav 85+ net', 'gold', '{"subject": "Matematik", "threshold": 85, "count": 10}'),
('bookworm', 'Kitap Kurdu', '20 sınav tamamla', 'bronze', '{"type": "exam_count", "count": 20}'),
('fire_streak', 'Ateşli Başlangıç', '7 gün streak', 'bronze', '{"type": "streak", "days": 7}'),
('target_hunter', 'Hedef Avcısı', '5 hedef tamamla', 'silver', '{"type": "goals", "count": 5}')
ON CONFLICT (code) DO NOTHING;

