-- User Activities Table for Activity Feed
-- Tracks actions performed by users that are followed by other users

CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB NOT NULL DEFAULT '{}',
    target_type VARCHAR(50), -- 'article', 'user', 'comment', etc.
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_activity_type CHECK (
        activity_type IN (
            'article_saved',
            'article_liked',
            'article_unliked', 
            'comment_created',
            'comment_liked',
            'user_followed',
            'user_unfollowed',
            'profile_updated'
        )
    ),
    CONSTRAINT valid_target_type CHECK (
        target_type IN ('article', 'user', 'comment') OR target_type IS NULL
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_target ON user_activities(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_composite ON user_activities(user_id, created_at DESC, activity_type);

-- RLS (Row Level Security)
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Allow users to read activities from users they follow
CREATE POLICY "Users can view activities of followed users" ON user_activities
    FOR SELECT
    USING (
        user_id IN (
            SELECT following_id 
            FROM user_follows 
            WHERE follower_id = auth.uid()
        )
        OR user_id = auth.uid() -- Users can see their own activities
    );

-- Allow users to insert their own activities
CREATE POLICY "Users can create their own activities" ON user_activities
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Allow users to update their own activities (for grouping/metadata updates)
CREATE POLICY "Users can update their own activities" ON user_activities
    FOR UPDATE
    USING (user_id = auth.uid());

-- Function to create activity with automatic deduplication
CREATE OR REPLACE FUNCTION create_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_activity_data JSONB DEFAULT '{}',
    p_target_type VARCHAR(50) DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activity_id UUID;
    recent_activity_id UUID;
    group_window_minutes INTEGER := 30;
BEGIN
    -- Check for recent similar activity for grouping
    IF p_activity_type IN ('article_liked', 'comment_liked') THEN
        SELECT id INTO recent_activity_id
        FROM user_activities
        WHERE user_id = p_user_id
            AND activity_type = p_activity_type
            AND created_at > now() - INTERVAL '30 minutes'
            AND (metadata->>'grouped')::boolean IS NOT TRUE
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- If recent similar activity found, group them
        IF recent_activity_id IS NOT NULL THEN
            -- Update existing activity to mark as grouped and increment count
            UPDATE user_activities 
            SET 
                metadata = metadata || jsonb_build_object(
                    'grouped', true,
                    'group_count', COALESCE((metadata->>'group_count')::integer, 1) + 1,
                    'last_grouped_at', now()::text
                ),
                updated_at = now()
            WHERE id = recent_activity_id;
            
            RETURN recent_activity_id;
        END IF;
    END IF;
    
    -- Insert new activity
    INSERT INTO user_activities (
        user_id,
        activity_type,
        activity_data,
        target_type,
        target_id,
        metadata
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_activity_data,
        p_target_type,
        p_target_id,
        p_metadata
    )
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$;

-- Function to get activity feed for a user
CREATE OR REPLACE FUNCTION get_activity_feed(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_activity_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_avatar_url TEXT,
    activity_type VARCHAR(50),
    activity_data JSONB,
    target_type VARCHAR(50),
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    target_title TEXT,
    target_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.id,
        ua.user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar_url,
        ua.activity_type,
        ua.activity_data,
        ua.target_type,
        ua.target_id,
        ua.metadata,
        ua.created_at,
        ua.updated_at,
        CASE 
            WHEN ua.target_type = 'article' THEN p.title
            WHEN ua.target_type = 'user' THEN target_u.name
            ELSE NULL
        END as target_title,
        CASE 
            WHEN ua.target_type = 'article' THEN p.url
            ELSE NULL
        END as target_url
    FROM user_activities ua
    JOIN users u ON ua.user_id = u.id
    LEFT JOIN posts p ON ua.target_type = 'article' AND ua.target_id = p.id
    LEFT JOIN users target_u ON ua.target_type = 'user' AND ua.target_id = target_u.id
    WHERE ua.user_id IN (
        SELECT following_id 
        FROM user_follows 
        WHERE follower_id = p_user_id
    )
    AND (p_activity_types IS NULL OR ua.activity_type = ANY(p_activity_types))
    ORDER BY ua.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Trigger to automatically create activity on certain actions
CREATE OR REPLACE FUNCTION trigger_create_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create activity based on table and action
    IF TG_TABLE_NAME = 'posts' AND TG_OP = 'INSERT' THEN
        PERFORM create_user_activity(
            NEW.user_id,
            'article_saved',
            jsonb_build_object(
                'article_title', NEW.title,
                'article_url', NEW.url,
                'article_excerpt', LEFT(NEW.excerpt, 200)
            ),
            'article',
            NEW.id
        );
    END IF;
    
    IF TG_TABLE_NAME = 'post_likes' AND TG_OP = 'INSERT' THEN
        PERFORM create_user_activity(
            NEW.user_id,
            'article_liked',
            jsonb_build_object(
                'post_id', NEW.post_id::text
            ),
            'article',
            NEW.post_id
        );
    END IF;
    
    IF TG_TABLE_NAME = 'post_likes' AND TG_OP = 'DELETE' THEN
        PERFORM create_user_activity(
            OLD.user_id,
            'article_unliked',
            jsonb_build_object(
                'post_id', OLD.post_id::text
            ),
            'article',
            OLD.post_id
        );
    END IF;
    
    IF TG_TABLE_NAME = 'post_comments' AND TG_OP = 'INSERT' THEN
        PERFORM create_user_activity(
            NEW.user_id,
            'comment_created',
            jsonb_build_object(
                'post_id', NEW.post_id::text,
                'comment_content', LEFT(NEW.content, 200)
            ),
            'article',
            NEW.post_id,
            jsonb_build_object('comment_id', NEW.id::text)
        );
    END IF;
    
    IF TG_TABLE_NAME = 'user_follows' AND TG_OP = 'INSERT' THEN
        PERFORM create_user_activity(
            NEW.follower_id,
            'user_followed',
            jsonb_build_object(
                'followed_user_id', NEW.following_id::text
            ),
            'user',
            NEW.following_id
        );
    END IF;
    
    IF TG_TABLE_NAME = 'user_follows' AND TG_OP = 'DELETE' THEN
        PERFORM create_user_activity(
            OLD.follower_id,
            'user_unfollowed',
            jsonb_build_object(
                'unfollowed_user_id', OLD.following_id::text
            ),
            'user',
            OLD.following_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for automatic activity creation
DROP TRIGGER IF EXISTS trigger_posts_activity ON posts;
CREATE TRIGGER trigger_posts_activity
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_activity();

DROP TRIGGER IF EXISTS trigger_post_likes_activity ON post_likes;
CREATE TRIGGER trigger_post_likes_activity
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_activity();

DROP TRIGGER IF EXISTS trigger_post_comments_activity ON post_comments;
CREATE TRIGGER trigger_post_comments_activity
    AFTER INSERT ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_activity();

DROP TRIGGER IF EXISTS trigger_user_follows_activity ON user_follows;
CREATE TRIGGER trigger_user_follows_activity
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_activity();

-- Clean up old activities (optional, can be run as a scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_activities(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_activities 
    WHERE created_at < now() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;