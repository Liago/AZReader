-- Activity Feed Database Schema for AZReader Social Features
-- Tracks user activities and interactions for social timeline

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Activity Feed Table
-- Stores all user activities and interactions
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User who performed the action
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Action details
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'article_created',
        'article_liked', 
        'article_unliked',
        'article_shared',
        'comment_created',
        'comment_liked',
        'comment_unliked',
        'user_followed',
        'user_unfollowed',
        'profile_updated'
    )),
    
    -- Target object information
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN (
        'article',
        'comment', 
        'user'
    )),
    target_id UUID NOT NULL,
    
    -- Additional context
    metadata JSONB DEFAULT '{}',
    
    -- Content preview for display
    content_preview TEXT,
    
    -- Visibility and grouping
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    group_key VARCHAR(100), -- For grouping related activities
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity Aggregates Table  
-- Pre-computed aggregations for performance
CREATE TABLE IF NOT EXISTS activity_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Grouping key
    group_key VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    
    -- Aggregated data
    count INTEGER DEFAULT 1,
    latest_activity_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE,
    sample_actors UUID[], -- Array of user IDs for "John and 5 others liked this"
    
    -- Display information
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    
    -- Timestamps
    first_activity_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(group_key, action_type, target_id)
);

-- User Following Table (if not already exists)
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(follower_id, following_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor_id ON activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_action_type ON activity_feed(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_target ON activity_feed(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_visibility ON activity_feed(visibility);
CREATE INDEX IF NOT EXISTS idx_activity_feed_group_key ON activity_feed(group_key);
CREATE INDEX IF NOT EXISTS idx_activity_feed_composite ON activity_feed(actor_id, created_at DESC, visibility);

CREATE INDEX IF NOT EXISTS idx_activity_aggregates_group_key ON activity_aggregates(group_key);
CREATE INDEX IF NOT EXISTS idx_activity_aggregates_last_activity ON activity_aggregates(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_aggregates_target ON activity_aggregates(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Row Level Security Policies

-- Activity Feed Policies
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Users can view public activities and activities from users they follow
CREATE POLICY activity_feed_select_policy ON activity_feed
    FOR SELECT
    USING (
        visibility = 'public' OR
        actor_id = auth.uid() OR
        (visibility = 'followers' AND EXISTS (
            SELECT 1 FROM user_follows 
            WHERE following_id = activity_feed.actor_id 
            AND follower_id = auth.uid()
        ))
    );

-- Users can insert their own activities
CREATE POLICY activity_feed_insert_policy ON activity_feed
    FOR INSERT
    WITH CHECK (actor_id = auth.uid());

-- Users can update their own activities
CREATE POLICY activity_feed_update_policy ON activity_feed
    FOR UPDATE
    USING (actor_id = auth.uid());

-- Users can delete their own activities
CREATE POLICY activity_feed_delete_policy ON activity_feed
    FOR DELETE
    USING (actor_id = auth.uid());

-- Activity Aggregates Policies  
ALTER TABLE activity_aggregates ENABLE ROW LEVEL SECURITY;

-- Similar policies for aggregates
CREATE POLICY activity_aggregates_select_policy ON activity_aggregates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM activity_feed af
            WHERE af.group_key = activity_aggregates.group_key
            AND (
                af.visibility = 'public' OR
                af.actor_id = auth.uid() OR
                (af.visibility = 'followers' AND EXISTS (
                    SELECT 1 FROM user_follows 
                    WHERE following_id = af.actor_id 
                    AND follower_id = auth.uid()
                ))
            )
        )
    );

-- System can insert/update aggregates (for functions)
CREATE POLICY activity_aggregates_system_policy ON activity_aggregates
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- User Follows Policies
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Users can view follows where they are involved
CREATE POLICY user_follows_select_policy ON user_follows
    FOR SELECT
    USING (follower_id = auth.uid() OR following_id = auth.uid());

-- Users can follow others
CREATE POLICY user_follows_insert_policy ON user_follows
    FOR INSERT
    WITH CHECK (follower_id = auth.uid());

-- Users can unfollow others
CREATE POLICY user_follows_delete_policy ON user_follows
    FOR DELETE
    USING (follower_id = auth.uid());

-- Helper Functions

-- Function to create activity entry
CREATE OR REPLACE FUNCTION create_activity(
    p_actor_id UUID,
    p_action_type TEXT,
    p_target_type TEXT,
    p_target_id UUID,
    p_metadata JSONB DEFAULT '{}',
    p_content_preview TEXT DEFAULT NULL,
    p_visibility TEXT DEFAULT 'public'
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
    group_key_val TEXT;
BEGIN
    -- Generate group key for potential aggregation
    group_key_val := p_target_type || '_' || p_target_id || '_' || 
        CASE 
            WHEN p_action_type IN ('article_liked', 'comment_liked') THEN 'likes'
            WHEN p_action_type IN ('comment_created') THEN 'comments'
            ELSE p_action_type
        END;
    
    -- Insert activity
    INSERT INTO activity_feed (
        actor_id, action_type, target_type, target_id,
        metadata, content_preview, visibility, group_key
    ) VALUES (
        p_actor_id, p_action_type, p_target_type, p_target_id,
        p_metadata, p_content_preview, p_visibility, group_key_val
    ) RETURNING id INTO activity_id;
    
    -- Update or create aggregate
    PERFORM update_activity_aggregate(group_key_val, p_action_type, p_target_type, p_target_id);
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update activity aggregates
CREATE OR REPLACE FUNCTION update_activity_aggregate(
    p_group_key TEXT,
    p_action_type TEXT,
    p_target_type TEXT,
    p_target_id UUID
) RETURNS VOID AS $$
DECLARE
    aggregate_record RECORD;
    sample_actors_array UUID[];
    activity_count INTEGER;
    latest_activity RECORD;
    target_info RECORD;
BEGIN
    -- Get latest activity for this group
    SELECT af.*, u.email as actor_email
    FROM activity_feed af
    JOIN users u ON af.actor_id = u.id
    WHERE af.group_key = p_group_key 
    AND af.action_type = p_action_type
    ORDER BY af.created_at DESC
    LIMIT 1
    INTO latest_activity;
    
    -- Get count and sample actors
    SELECT COUNT(*), ARRAY_AGG(DISTINCT actor_id) 
    FROM activity_feed
    WHERE group_key = p_group_key 
    AND action_type = p_action_type
    INTO activity_count, sample_actors_array;
    
    -- Get target information for display
    IF p_target_type = 'article' THEN
        SELECT title, content FROM articles WHERE id = p_target_id INTO target_info;
    ELSIF p_target_type = 'comment' THEN
        SELECT content, '' as title FROM comments WHERE id = p_target_id INTO target_info;
    ELSIF p_target_type = 'user' THEN
        SELECT email as title, '' as content FROM users WHERE id = p_target_id INTO target_info;
    END IF;
    
    -- Upsert aggregate
    INSERT INTO activity_aggregates (
        group_key, actor_id, action_type, target_type, target_id,
        count, latest_activity_id, sample_actors,
        title, description,
        first_activity_at, last_activity_at
    ) VALUES (
        p_group_key, 
        latest_activity.actor_id,
        p_action_type,
        p_target_type,
        p_target_id,
        activity_count,
        latest_activity.id,
        sample_actors_array,
        COALESCE(target_info.title, 'Activity'),
        CASE 
            WHEN p_action_type = 'article_liked' THEN 'liked an article'
            WHEN p_action_type = 'comment_liked' THEN 'liked a comment'  
            WHEN p_action_type = 'comment_created' THEN 'commented on an article'
            WHEN p_action_type = 'article_created' THEN 'published an article'
            WHEN p_action_type = 'user_followed' THEN 'started following'
            ELSE p_action_type
        END,
        (SELECT MIN(created_at) FROM activity_feed WHERE group_key = p_group_key AND action_type = p_action_type),
        latest_activity.created_at
    )
    ON CONFLICT (group_key, action_type, target_id) 
    DO UPDATE SET
        count = activity_count,
        latest_activity_id = latest_activity.id,
        sample_actors = sample_actors_array,
        last_activity_at = latest_activity.created_at,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old activities (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_activities() RETURNS VOID AS $$
BEGIN
    -- Delete activities older than 6 months
    DELETE FROM activity_feed 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
    
    -- Clean up orphaned aggregates
    DELETE FROM activity_aggregates 
    WHERE latest_activity_id IS NULL OR 
          latest_activity_id NOT IN (SELECT id FROM activity_feed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic activity creation

-- Article likes trigger
CREATE OR REPLACE FUNCTION trigger_article_like_activity() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM create_activity(
            NEW.user_id,
            'article_liked',
            'article', 
            NEW.post_id,
            jsonb_build_object('like_id', NEW.id),
            (SELECT COALESCE(title, SUBSTRING(content, 1, 100)) FROM articles WHERE id = NEW.post_id),
            'public'
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM create_activity(
            OLD.user_id,
            'article_unliked',
            'article',
            OLD.post_id,
            jsonb_build_object('like_id', OLD.id),
            (SELECT COALESCE(title, SUBSTRING(content, 1, 100)) FROM articles WHERE id = OLD.post_id),
            'public'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment creation trigger  
CREATE OR REPLACE FUNCTION trigger_comment_activity() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM create_activity(
            NEW.user_id,
            'comment_created',
            'article',
            NEW.post_id,
            jsonb_build_object('comment_id', NEW.id, 'comment_content', SUBSTRING(NEW.content, 1, 200)),
            SUBSTRING(NEW.content, 1, 100),
            'public'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_post_likes_activity ON post_likes;
CREATE TRIGGER trigger_post_likes_activity
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_article_like_activity();

DROP TRIGGER IF EXISTS trigger_comments_activity ON comments;
CREATE TRIGGER trigger_comments_activity
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_comment_activity();

-- Grant necessary permissions
GRANT SELECT, INSERT ON activity_feed TO authenticated;
GRANT SELECT ON activity_aggregates TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_follows TO authenticated;

GRANT EXECUTE ON FUNCTION create_activity TO authenticated;
GRANT EXECUTE ON FUNCTION update_activity_aggregate TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_activities TO service_role;

-- Create sample data (optional)
-- This would be run after users and articles exist
/*
-- Example: Create sample activities for testing
INSERT INTO activity_feed (actor_id, action_type, target_type, target_id, content_preview) VALUES
    ((SELECT id FROM users LIMIT 1), 'article_created', 'article', (SELECT id FROM articles LIMIT 1), 'Published a new article about technology'),
    ((SELECT id FROM users LIMIT 1), 'article_liked', 'article', (SELECT id FROM articles LIMIT 1), 'Liked an article about innovation');
*/

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_timeline ON activity_feed(actor_id, created_at DESC) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_activity_feed_global_timeline ON activity_feed(created_at DESC) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_activity_aggregates_timeline ON activity_aggregates(last_activity_at DESC);

-- Comments
COMMENT ON TABLE activity_feed IS 'Stores individual user activities and interactions for social timeline';
COMMENT ON TABLE activity_aggregates IS 'Pre-computed activity aggregations for improved timeline performance';
COMMENT ON TABLE user_follows IS 'User following relationships for social features';

COMMENT ON FUNCTION create_activity IS 'Creates a new activity entry and updates aggregations';
COMMENT ON FUNCTION update_activity_aggregate IS 'Updates or creates activity aggregates for timeline display';
COMMENT ON FUNCTION cleanup_old_activities IS 'Removes old activities to maintain performance';