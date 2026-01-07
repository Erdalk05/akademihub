-- ============================================================================
-- NOTIFICATION LOGS TABLE
-- WhatsApp, SMS, Email bildirim geçmişi
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- 'whatsapp', 'sms', 'email', 'push'
    
    recipient_type VARCHAR(50), -- 'student', 'parent', 'teacher'
    recipient_id UUID, -- student_id, user_id vb.
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(255),
    
    message_type VARCHAR(50), -- 'exam_result', 'report_card', 'risk_alert', 'payment_reminder', 'custom'
    message_preview TEXT,
    
    template_id VARCHAR(100),
    context JSONB, -- Ek bilgiler (exam_id, payment_id vb.)
    
    status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'failed', 'read'
    error_message TEXT,
    
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Profil Tablosu (Eğer yoksa)
CREATE TABLE IF NOT EXISTS student_ai_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    organization_id UUID REFERENCES organizations(id),
    
    -- Risk Skorları (0-1 arası)
    dropout_risk DECIMAL(4,3), -- Terk etme riski
    performance_risk DECIMAL(4,3), -- Performans düşüşü riski
    
    -- Tahminler
    predicted_lgs_score INTEGER,
    predicted_percentile INTEGER,
    
    -- Güçlü/Zayıf Alanlar
    strength_areas JSONB, -- ["Matematik", "Fen"]
    weakness_areas JSONB, -- ["Sosyal", "İngilizce"]
    
    -- Öneriler
    recommendations JSONB,
    -- [{"type": "study", "subject": "Matematik", "topic": "Denklemler", "reason": "..."}]
    
    -- Topic Mastery
    topic_mastery JSONB,
    -- [{"subject": "Matematik", "topic": "Denklemler", "mastery": 0.85}]
    
    last_analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_notification_logs_org ON notification_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_student_ai_profiles_student ON student_ai_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_ai_profiles_org ON student_ai_profiles(organization_id);

