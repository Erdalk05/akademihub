-- ============================================================================
-- PUSH SUBSCRIPTIONS TABLE
-- Web Push bildirim subscription'ları
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    endpoint TEXT NOT NULL,
    p256dh TEXT,
    auth TEXT,
    
    user_agent TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    
    is_active BOOLEAN DEFAULT true,
    
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    UNIQUE(user_id, endpoint)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org ON push_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

