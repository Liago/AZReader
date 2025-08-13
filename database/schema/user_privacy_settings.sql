-- User Privacy Settings Table
-- Advanced privacy controls for profiles and activities

CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Profile visibility settings
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'followers_only')),
    show_email BOOLEAN DEFAULT false,
    show_bio BOOLEAN DEFAULT true,
    show_website BOOLEAN DEFAULT true,
    show_join_date BOOLEAN DEFAULT true,
    show_avatar BOOLEAN DEFAULT true,
    
    -- Following/Followers visibility
    show_following_list BOOLEAN DEFAULT true,
    show_followers_list BOOLEAN DEFAULT true,
    show_following_count BOOLEAN DEFAULT true,
    show_followers_count BOOLEAN DEFAULT true,
    
    -- Activity feed visibility
    activity_feed_public BOOLEAN DEFAULT true,
    show_reading_activity BOOLEAN DEFAULT true,
    show_like_activity BOOLEAN DEFAULT true,
    show_comment_activity BOOLEAN DEFAULT true,
    show_save_activity BOOLEAN DEFAULT true,
    show_follow_activity BOOLEAN DEFAULT true,
    
    -- Content defaults
    articles_default_privacy VARCHAR(20) DEFAULT 'public' CHECK (articles_default_privacy IN ('public', 'private', 'followers_only')),
    include_in_discovery BOOLEAN DEFAULT true,
    discoverable_in_search BOOLEAN DEFAULT true,
    
    -- Interaction permissions
    allow_comments_from VARCHAR(20) DEFAULT 'everyone' CHECK (allow_comments_from IN ('everyone', 'followers_only', 'nobody')),
    allow_likes_from VARCHAR(20) DEFAULT 'everyone' CHECK (allow_likes_from IN ('everyone', 'followers_only', 'nobody')),
    allow_follows_from VARCHAR(20) DEFAULT 'everyone' CHECK (allow_follows_from IN ('everyone', 'nobody')),
    require_follow_approval BOOLEAN DEFAULT false,
    
    -- Notification preferences
    notify_on_follow BOOLEAN DEFAULT true,
    notify_on_like BOOLEAN DEFAULT true,
    notify_on_comment BOOLEAN DEFAULT true,
    notify_on_mention BOOLEAN DEFAULT true,
    notify_on_share BOOLEAN DEFAULT true,
    
    -- Advanced settings
    block_anonymous_access BOOLEAN DEFAULT false,
    require_verified_followers BOOLEAN DEFAULT false,
    auto_decline_suspicious_follows BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_profile_visibility ON user_privacy_settings(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_discoverable ON user_privacy_settings(discoverable_in_search) WHERE discoverable_in_search = true;
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_follow_approval ON user_privacy_settings(require_follow_approval) WHERE require_follow_approval = true;

-- RLS (Row Level Security)
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own privacy settings
CREATE POLICY "Users can manage their own privacy settings" ON user_privacy_settings
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Follow requests table for private profiles
CREATE TABLE IF NOT EXISTS follow_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
    message TEXT, -- Optional message from requester
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES users(id),
    
    -- Prevent duplicate requests
    UNIQUE(requester_id, target_user_id)
);

-- Indexes for follow requests
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester ON follow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_target ON follow_requests(target_user_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status ON follow_requests(status);
CREATE INDEX IF NOT EXISTS idx_follow_requests_pending ON follow_requests(target_user_id, status) WHERE status = 'pending';

-- RLS for follow requests
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- Users can see requests they made or received
CREATE POLICY "Users can view their follow requests" ON follow_requests
    FOR SELECT
    USING (requester_id = auth.uid() OR target_user_id = auth.uid());

-- Users can create follow requests
CREATE POLICY "Users can create follow requests" ON follow_requests
    FOR INSERT
    WITH CHECK (requester_id = auth.uid());

-- Users can update requests they made (to cancel) or received (to approve/deny)
CREATE POLICY "Users can update their follow requests" ON follow_requests
    FOR UPDATE
    USING (requester_id = auth.uid() OR target_user_id = auth.uid())
    WITH CHECK (
        (requester_id = auth.uid() AND status = 'cancelled') OR
        (target_user_id = auth.uid() AND status IN ('approved', 'denied'))
    );

-- Privacy audit log table
CREATE TABLE IF NOT EXISTS privacy_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- 'privacy_settings', 'profile', 'article', etc.
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index on timestamp for cleanup
    INDEX (timestamp DESC)
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_user_id ON privacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_timestamp ON privacy_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_action_type ON privacy_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_resource ON privacy_audit_log(resource_type, resource_id);

-- RLS for audit log
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit log
CREATE POLICY "Users can view their own audit log" ON privacy_audit_log
    FOR SELECT
    USING (user_id = auth.uid());

-- Function to initialize default privacy settings for new users
CREATE OR REPLACE FUNCTION initialize_user_privacy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Trigger to create privacy settings when a user is created
DROP TRIGGER IF EXISTS trigger_initialize_privacy_settings ON users;
CREATE TRIGGER trigger_initialize_privacy_settings
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_privacy_settings();

-- Function to log privacy changes
CREATE OR REPLACE FUNCTION log_privacy_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Convert OLD and NEW to JSONB, excluding metadata fields
    IF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD) - 'updated_at' - 'created_at';
        new_data := to_jsonb(NEW) - 'updated_at' - 'created_at';
        
        -- Only log if there are actual changes
        IF old_data IS DISTINCT FROM new_data THEN
            INSERT INTO privacy_audit_log (
                user_id,
                action_type,
                resource_type,
                resource_id,
                old_values,
                new_values
            ) VALUES (
                NEW.user_id,
                'privacy_settings_updated',
                'user_privacy_settings',
                NEW.id,
                old_data,
                new_data
            );
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        new_data := to_jsonb(NEW) - 'updated_at' - 'created_at';
        
        INSERT INTO privacy_audit_log (
            user_id,
            action_type,
            resource_type,
            resource_id,
            new_values
        ) VALUES (
            NEW.user_id,
            'privacy_settings_created',
            'user_privacy_settings',
            NEW.id,
            new_data
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to log privacy setting changes
DROP TRIGGER IF EXISTS trigger_log_privacy_changes ON user_privacy_settings;
CREATE TRIGGER trigger_log_privacy_changes
    AFTER INSERT OR UPDATE ON user_privacy_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_privacy_change();

-- Function to get user privacy settings with defaults
CREATE OR REPLACE FUNCTION get_user_privacy_settings(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    profile_visibility VARCHAR(20),
    show_email BOOLEAN,
    show_bio BOOLEAN,
    show_website BOOLEAN,
    show_join_date BOOLEAN,
    show_avatar BOOLEAN,
    show_following_list BOOLEAN,
    show_followers_list BOOLEAN,
    show_following_count BOOLEAN,
    show_followers_count BOOLEAN,
    activity_feed_public BOOLEAN,
    show_reading_activity BOOLEAN,
    show_like_activity BOOLEAN,
    show_comment_activity BOOLEAN,
    show_save_activity BOOLEAN,
    show_follow_activity BOOLEAN,
    articles_default_privacy VARCHAR(20),
    include_in_discovery BOOLEAN,
    discoverable_in_search BOOLEAN,
    allow_comments_from VARCHAR(20),
    allow_likes_from VARCHAR(20),
    allow_follows_from VARCHAR(20),
    require_follow_approval BOOLEAN,
    notify_on_follow BOOLEAN,
    notify_on_like BOOLEAN,
    notify_on_comment BOOLEAN,
    notify_on_mention BOOLEAN,
    notify_on_share BOOLEAN,
    block_anonymous_access BOOLEAN,
    require_verified_followers BOOLEAN,
    auto_decline_suspicious_follows BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ups.user_id,
        COALESCE(ups.profile_visibility, 'public'::VARCHAR(20)),
        COALESCE(ups.show_email, false),
        COALESCE(ups.show_bio, true),
        COALESCE(ups.show_website, true),
        COALESCE(ups.show_join_date, true),
        COALESCE(ups.show_avatar, true),
        COALESCE(ups.show_following_list, true),
        COALESCE(ups.show_followers_list, true),
        COALESCE(ups.show_following_count, true),
        COALESCE(ups.show_followers_count, true),
        COALESCE(ups.activity_feed_public, true),
        COALESCE(ups.show_reading_activity, true),
        COALESCE(ups.show_like_activity, true),
        COALESCE(ups.show_comment_activity, true),
        COALESCE(ups.show_save_activity, true),
        COALESCE(ups.show_follow_activity, true),
        COALESCE(ups.articles_default_privacy, 'public'::VARCHAR(20)),
        COALESCE(ups.include_in_discovery, true),
        COALESCE(ups.discoverable_in_search, true),
        COALESCE(ups.allow_comments_from, 'everyone'::VARCHAR(20)),
        COALESCE(ups.allow_likes_from, 'everyone'::VARCHAR(20)),
        COALESCE(ups.allow_follows_from, 'everyone'::VARCHAR(20)),
        COALESCE(ups.require_follow_approval, false),
        COALESCE(ups.notify_on_follow, true),
        COALESCE(ups.notify_on_like, true),
        COALESCE(ups.notify_on_comment, true),
        COALESCE(ups.notify_on_mention, true),
        COALESCE(ups.notify_on_share, true),
        COALESCE(ups.block_anonymous_access, false),
        COALESCE(ups.require_verified_followers, false),
        COALESCE(ups.auto_decline_suspicious_follows, false)
    FROM user_privacy_settings ups
    WHERE ups.user_id = p_user_id;
    
    -- If no settings exist, return defaults
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            p_user_id,
            'public'::VARCHAR(20),
            false,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            'public'::VARCHAR(20),
            true,
            true,
            'everyone'::VARCHAR(20),
            'everyone'::VARCHAR(20),
            'everyone'::VARCHAR(20),
            false,
            true,
            true,
            true,
            true,
            true,
            false,
            false,
            false;
    END IF;
END;
$$;

-- Function to check if user can view another user's profile
CREATE OR REPLACE FUNCTION can_view_user_profile(
    p_viewer_id UUID,
    p_target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_privacy_settings RECORD;
    v_is_following BOOLEAN := false;
BEGIN
    -- User can always view their own profile
    IF p_viewer_id = p_target_user_id THEN
        RETURN true;
    END IF;
    
    -- Get target user's privacy settings
    SELECT * INTO v_privacy_settings
    FROM get_user_privacy_settings(p_target_user_id)
    LIMIT 1;
    
    -- Check profile visibility
    CASE v_privacy_settings.profile_visibility
        WHEN 'public' THEN
            RETURN true;
        WHEN 'private' THEN
            RETURN false;
        WHEN 'followers_only' THEN
            -- Check if viewer is following target user
            IF p_viewer_id IS NULL THEN
                RETURN false;
            END IF;
            
            SELECT EXISTS(
                SELECT 1 FROM user_follows 
                WHERE follower_id = p_viewer_id 
                AND following_id = p_target_user_id
            ) INTO v_is_following;
            
            RETURN v_is_following;
        ELSE
            RETURN false;
    END CASE;
END;
$$;

-- Function to handle follow requests
CREATE OR REPLACE FUNCTION handle_follow_request(
    p_requester_id UUID,
    p_target_user_id UUID,
    p_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_privacy_settings RECORD;
    v_request_id UUID;
    v_result JSONB;
BEGIN
    -- Can't follow yourself
    IF p_requester_id = p_target_user_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cannot follow yourself');
    END IF;
    
    -- Get target user's privacy settings
    SELECT * INTO v_privacy_settings
    FROM get_user_privacy_settings(p_target_user_id)
    LIMIT 1;
    
    -- Check if follows are allowed
    IF v_privacy_settings.allow_follows_from = 'nobody' THEN
        RETURN jsonb_build_object('success', false, 'message', 'User is not accepting new followers');
    END IF;
    
    -- Check if already following
    IF EXISTS(
        SELECT 1 FROM user_follows 
        WHERE follower_id = p_requester_id 
        AND following_id = p_target_user_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already following user');
    END IF;
    
    -- Check if request already exists
    IF EXISTS(
        SELECT 1 FROM follow_requests 
        WHERE requester_id = p_requester_id 
        AND target_user_id = p_target_user_id
        AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Follow request already pending');
    END IF;
    
    -- If no approval required, create follow directly
    IF NOT v_privacy_settings.require_follow_approval THEN
        INSERT INTO user_follows (follower_id, following_id)
        VALUES (p_requester_id, p_target_user_id);
        
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Now following user',
            'type', 'immediate_follow'
        );
    ELSE
        -- Create follow request
        INSERT INTO follow_requests (requester_id, target_user_id, message)
        VALUES (p_requester_id, p_target_user_id, p_message)
        RETURNING id INTO v_request_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Follow request sent',
            'type', 'follow_request',
            'request_id', v_request_id
        );
    END IF;
END;
$$;

-- Function to respond to follow requests
CREATE OR REPLACE FUNCTION respond_to_follow_request(
    p_request_id UUID,
    p_response VARCHAR(20), -- 'approved' or 'denied'
    p_responder_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
BEGIN
    -- Get the follow request
    SELECT * INTO v_request
    FROM follow_requests
    WHERE id = p_request_id
    AND target_user_id = p_responder_id
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Update the request status
    UPDATE follow_requests
    SET 
        status = p_response,
        responded_at = NOW(),
        responded_by = p_responder_id
    WHERE id = p_request_id;
    
    -- If approved, create the follow relationship
    IF p_response = 'approved' THEN
        INSERT INTO user_follows (follower_id, following_id)
        VALUES (v_request.requester_id, v_request.target_user_id)
        ON CONFLICT (follower_id, following_id) DO NOTHING;
    END IF;
    
    RETURN true;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_privacy_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON follow_requests TO authenticated;
GRANT SELECT ON privacy_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_privacy_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_user_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_follow_request(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_follow_request(UUID, VARCHAR(20), UUID) TO authenticated;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_privacy_settings_updated_at ON user_privacy_settings;
CREATE TRIGGER update_user_privacy_settings_updated_at 
    BEFORE UPDATE ON user_privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for old audit logs (run as maintenance job)
CREATE OR REPLACE FUNCTION cleanup_old_privacy_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM privacy_audit_log
    WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;