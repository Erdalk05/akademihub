-- ============================================================================
-- SUPABASE EDGE FUNCTION: XP HESAPLAMA
-- Sınav sonucu sonrası otomatik XP hesaplama ve seviye güncelleme
-- ============================================================================

-- XP Hesaplama Fonksiyonu
CREATE OR REPLACE FUNCTION calculate_exam_xp(
    p_student_id UUID,
    p_exam_id UUID,
    p_net DECIMAL,
    p_rank INTEGER,
    p_total_students INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_base_xp INTEGER := 10; -- Her sınava katılım
    v_net_xp INTEGER := 0;
    v_rank_xp INTEGER := 0;
    v_total_xp INTEGER := 0;
    v_current_level INTEGER;
    v_total_student_xp INTEGER;
BEGIN
    -- Net bazlı XP (her net = 1 XP, bonus eşikler)
    v_net_xp := FLOOR(p_net);
    
    -- Bonus XP eşikleri
    IF p_net >= 90 THEN
        v_net_xp := v_net_xp + 50; -- 90+ net bonus
    ELSIF p_net >= 80 THEN
        v_net_xp := v_net_xp + 30;
    ELSIF p_net >= 70 THEN
        v_net_xp := v_net_xp + 15;
    ELSIF p_net >= 60 THEN
        v_net_xp := v_net_xp + 5;
    END IF;
    
    -- Sıralama bazlı XP
    IF p_rank = 1 THEN
        v_rank_xp := 100; -- 1. olma bonusu
    ELSIF p_rank = 2 THEN
        v_rank_xp := 50;
    ELSIF p_rank = 3 THEN
        v_rank_xp := 30;
    ELSIF p_rank <= 5 THEN
        v_rank_xp := 15;
    ELSIF p_rank <= 10 THEN
        v_rank_xp := 5;
    END IF;
    
    -- Yüzdelik dilim bonusu
    IF p_total_students > 0 THEN
        IF (p_total_students - p_rank + 1)::FLOAT / p_total_students >= 0.9 THEN
            v_rank_xp := v_rank_xp + 20; -- İlk %10
        ELSIF (p_total_students - p_rank + 1)::FLOAT / p_total_students >= 0.75 THEN
            v_rank_xp := v_rank_xp + 10; -- İlk %25
        END IF;
    END IF;
    
    v_total_xp := v_base_xp + v_net_xp + v_rank_xp;
    
    -- XP transaction kaydet
    INSERT INTO xp_transactions (student_id, xp_amount, source, source_id, description)
    VALUES (
        p_student_id,
        v_total_xp,
        'exam',
        p_exam_id,
        'Sınav sonucu: ' || p_net || ' net, ' || p_rank || '. sıra'
    );
    
    -- student_xp tablosunu güncelle
    INSERT INTO student_xp (student_id, total_xp, exam_xp, current_level, updated_at)
    VALUES (p_student_id, v_total_xp, v_total_xp, 1, NOW())
    ON CONFLICT (student_id) DO UPDATE SET
        total_xp = student_xp.total_xp + v_total_xp,
        exam_xp = student_xp.exam_xp + v_total_xp,
        updated_at = NOW();
    
    -- Yeni toplam XP'yi al
    SELECT total_xp INTO v_total_student_xp
    FROM student_xp
    WHERE student_id = p_student_id;
    
    -- Seviye hesapla (her 500 XP = 1 seviye)
    v_current_level := GREATEST(1, FLOOR(v_total_student_xp / 500) + 1);
    
    -- Seviyeyi güncelle
    UPDATE student_xp
    SET current_level = v_current_level
    WHERE student_id = p_student_id;
    
    RETURN v_total_xp;
END;
$$;

-- Streak Güncelleme Fonksiyonu
CREATE OR REPLACE FUNCTION update_student_streak(p_student_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_date DATE;
    v_today DATE := CURRENT_DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_xp_earned INTEGER := 0;
BEGIN
    -- Mevcut streak bilgisini al
    SELECT last_activity_date, current_streak, longest_streak
    INTO v_last_date, v_current_streak, v_longest_streak
    FROM student_streaks
    WHERE student_id = p_student_id;
    
    IF NOT FOUND THEN
        -- İlk giriş
        INSERT INTO student_streaks (student_id, current_streak, longest_streak, last_activity_date, total_login_days)
        VALUES (p_student_id, 1, 1, v_today, 1);
        v_xp_earned := 5; -- İlk giriş XP
    ELSIF v_last_date = v_today THEN
        -- Aynı gün, değişiklik yok
        v_xp_earned := 0;
    ELSIF v_last_date = v_today - 1 THEN
        -- Ardışık gün, streak devam
        v_current_streak := v_current_streak + 1;
        v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
        
        UPDATE student_streaks
        SET current_streak = v_current_streak,
            longest_streak = v_longest_streak,
            last_activity_date = v_today,
            total_login_days = total_login_days + 1,
            updated_at = NOW()
        WHERE student_id = p_student_id;
        
        -- Streak XP (artan)
        v_xp_earned := LEAST(50, 5 + v_current_streak);
        
        -- Milestone bonusları
        IF v_current_streak = 7 THEN
            v_xp_earned := v_xp_earned + 50; -- 1 hafta
        ELSIF v_current_streak = 30 THEN
            v_xp_earned := v_xp_earned + 200; -- 1 ay
        ELSIF v_current_streak = 100 THEN
            v_xp_earned := v_xp_earned + 500; -- 100 gün
        END IF;
    ELSE
        -- Streak kırıldı
        UPDATE student_streaks
        SET current_streak = 1,
            last_activity_date = v_today,
            total_login_days = total_login_days + 1,
            updated_at = NOW()
        WHERE student_id = p_student_id;
        
        v_xp_earned := 5;
    END IF;
    
    -- XP ekle
    IF v_xp_earned > 0 THEN
        INSERT INTO xp_transactions (student_id, xp_amount, source, description)
        VALUES (p_student_id, v_xp_earned, 'streak', 'Günlük giriş streaki');
        
        UPDATE student_xp
        SET total_xp = total_xp + v_xp_earned,
            updated_at = NOW()
        WHERE student_id = p_student_id;
    END IF;
    
    RETURN v_xp_earned;
END;
$$;

-- Başarı Kontrol Fonksiyonu
CREATE OR REPLACE FUNCTION check_achievements(p_student_id UUID)
RETURNS TABLE(achievement_code VARCHAR, earned BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exam_count INTEGER;
    v_max_net DECIMAL;
    v_current_streak INTEGER;
BEGIN
    -- Sınav sayısı
    SELECT COUNT(*) INTO v_exam_count
    FROM exam_participants
    WHERE student_id = p_student_id AND net IS NOT NULL;
    
    -- En yüksek net
    SELECT MAX(net) INTO v_max_net
    FROM exam_participants
    WHERE student_id = p_student_id;
    
    -- Mevcut streak
    SELECT ss.current_streak INTO v_current_streak
    FROM student_streaks ss
    WHERE ss.student_id = p_student_id;
    
    -- Başarıları kontrol et ve kazan
    FOR achievement_code, earned IN
        SELECT a.code, 
            CASE 
                WHEN sa.id IS NOT NULL THEN TRUE
                WHEN a.code = 'first_exam' AND v_exam_count >= 1 THEN TRUE
                WHEN a.code = 'ten_exams' AND v_exam_count >= 10 THEN TRUE
                WHEN a.code = 'fifty_exams' AND v_exam_count >= 50 THEN TRUE
                WHEN a.code = 'high_net_70' AND v_max_net >= 70 THEN TRUE
                WHEN a.code = 'high_net_80' AND v_max_net >= 80 THEN TRUE
                WHEN a.code = 'high_net_90' AND v_max_net >= 90 THEN TRUE
                WHEN a.code = 'streak_3' AND v_current_streak >= 3 THEN TRUE
                WHEN a.code = 'streak_7' AND v_current_streak >= 7 THEN TRUE
                WHEN a.code = 'streak_30' AND v_current_streak >= 30 THEN TRUE
                ELSE FALSE
            END
        FROM achievements a
        LEFT JOIN student_achievements sa ON sa.achievement_id = a.id AND sa.student_id = p_student_id
        WHERE a.is_active = TRUE
    LOOP
        IF earned AND NOT EXISTS (
            SELECT 1 FROM student_achievements 
            WHERE student_id = p_student_id 
            AND achievement_id = (SELECT id FROM achievements WHERE code = achievement_code)
        ) THEN
            -- Yeni başarı kazanıldı
            INSERT INTO student_achievements (student_id, achievement_id)
            SELECT p_student_id, id FROM achievements WHERE code = achievement_code;
            
            -- XP ekle
            INSERT INTO xp_transactions (student_id, xp_amount, source, description)
            SELECT p_student_id, xp, 'achievement', 'Başarı: ' || name
            FROM achievements WHERE code = achievement_code;
            
            UPDATE student_xp
            SET total_xp = total_xp + (SELECT xp FROM achievements WHERE code = achievement_code),
                achievement_xp = achievement_xp + (SELECT xp FROM achievements WHERE code = achievement_code)
            WHERE student_id = p_student_id;
        END IF;
        
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Liderlik Tablosu Güncelleme
CREATE OR REPLACE FUNCTION update_leaderboard(
    p_organization_id UUID,
    p_type VARCHAR DEFAULT 'weekly_xp',
    p_scope VARCHAR DEFAULT 'organization'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rankings JSONB;
BEGIN
    -- Haftalık XP sıralaması
    IF p_type = 'weekly_xp' THEN
        SELECT jsonb_agg(row_data ORDER BY xp DESC)
        INTO v_rankings
        FROM (
            SELECT jsonb_build_object(
                'student_id', sx.student_id,
                'value', COALESCE(SUM(xt.xp_amount), 0),
                'rank', ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(xt.xp_amount), 0) DESC)
            ) as row_data,
            COALESCE(SUM(xt.xp_amount), 0) as xp
            FROM student_xp sx
            JOIN students s ON s.id = sx.student_id
            LEFT JOIN xp_transactions xt ON xt.student_id = sx.student_id
                AND xt.created_at >= CURRENT_DATE - INTERVAL '7 days'
            WHERE s.organization_id = p_organization_id
            GROUP BY sx.student_id
            LIMIT 100
        ) sub;
    -- Aylık sınav ortalaması
    ELSIF p_type = 'monthly_exam' THEN
        SELECT jsonb_agg(row_data ORDER BY avg_net DESC)
        INTO v_rankings
        FROM (
            SELECT jsonb_build_object(
                'student_id', ep.student_id,
                'value', ROUND(AVG(ep.net)::NUMERIC, 2),
                'rank', ROW_NUMBER() OVER (ORDER BY AVG(ep.net) DESC)
            ) as row_data,
            AVG(ep.net) as avg_net
            FROM exam_participants ep
            JOIN exams e ON e.id = ep.exam_id
            WHERE e.organization_id = p_organization_id
                AND ep.created_at >= CURRENT_DATE - INTERVAL '30 days'
                AND ep.net IS NOT NULL
            GROUP BY ep.student_id
            LIMIT 100
        ) sub;
    END IF;
    
    -- Liderlik tablosunu güncelle
    INSERT INTO leaderboards (organization_id, type, scope, rankings, calculated_at)
    VALUES (p_organization_id, p_type, p_scope, COALESCE(v_rankings, '[]'::jsonb), NOW())
    ON CONFLICT (organization_id, type, scope) 
        WHERE period_start IS NULL AND period_end IS NULL
    DO UPDATE SET
        rankings = COALESCE(v_rankings, '[]'::jsonb),
        calculated_at = NOW();
END;
$$;

-- Trigger: Sınav sonucu eklendiğinde XP hesapla
CREATE OR REPLACE FUNCTION trigger_calculate_exam_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sadece öğrenci ID'si ve net varsa XP hesapla
    IF NEW.student_id IS NOT NULL AND NEW.net IS NOT NULL THEN
        PERFORM calculate_exam_xp(
            NEW.student_id,
            NEW.exam_id,
            NEW.net,
            COALESCE(NEW.rank, 0),
            (SELECT COUNT(*) FROM exam_participants WHERE exam_id = NEW.exam_id)
        );
        
        -- Başarıları kontrol et
        PERFORM check_achievements(NEW.student_id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trg_exam_participant_xp ON exam_participants;
CREATE TRIGGER trg_exam_participant_xp
    AFTER INSERT OR UPDATE OF net, rank ON exam_participants
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_exam_xp();

-- Unique constraint for leaderboards upsert
ALTER TABLE leaderboards 
ADD CONSTRAINT leaderboards_org_type_scope_unique 
UNIQUE (organization_id, type, scope) 
WHERE period_start IS NULL AND period_end IS NULL;

