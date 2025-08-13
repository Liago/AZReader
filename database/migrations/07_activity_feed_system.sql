-- Activity Feed System Migration
-- Creates tables and functions for tracking and displaying user activities

-- Activity Feed table - tracks individual user activities
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'article_created', 'article_liked', 'article_unliked', 'article_shared',
        'comment_created', 'comment_liked', 'comment_unliked',
        'user_followed', 'user_unfollowed', 'profile_updated'
    )),
    target_type TEXT NOT NULL CHECK (target_type IN ('article', 'comment', 'user')),
    target_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    content_preview TEXT,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    group_key TEXT, -- For grouping similar activities
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Aggregates table - for grouped/summarized activities  
CREATE TABLE IF NOT EXISTS activity_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_key TEXT NOT NULL UNIQUE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    count INTEGER DEFAULT 1,
    sample_actors UUID[] DEFAULT '{}', -- Array of user IDs for "X and Y others" display
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT,
    first_activity_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor_id ON activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_action_type ON activity_feed(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_target ON activity_feed(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_visibility ON activity_feed(visibility);
CREATE INDEX IF NOT EXISTS idx_activity_feed_group_key ON activity_feed(group_key);
CREATE INDEX IF NOT EXISTS idx_activity_feed_composite ON activity_feed(actor_id, created_at DESC, action_type);

CREATE INDEX IF NOT EXISTS idx_activity_aggregates_actor_id ON activity_aggregates(actor_id);  
CREATE INDEX IF NOT EXISTS idx_activity_aggregates_last_activity_at ON activity_aggregates(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_aggregates_action_type ON activity_aggregates(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_aggregates_target ON activity_aggregates(target_type, target_id);

-- Enable Row Level Security
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_feed
CREATE POLICY "Users can view activities based on visibility" ON activity_feed
    FOR SELECT
    USING (
        visibility = 'public' 
        OR (visibility = 'followers' AND actor_id IN (
            SELECT following_id FROM user_follows WHERE follower_id = auth.uid()
        ))
        OR actor_id = auth.uid()
    );

CREATE POLICY "Users can create their own activities" ON activity_feed
    FOR INSERT
    WITH CHECK (actor_id = auth.uid());

CREATE POLICY "Users can update their own activities" ON activity_feed
    FOR UPDATE
    USING (actor_id = auth.uid());

-- RLS Policies for activity_aggregates  
CREATE POLICY "Users can view activity aggregates based on actor visibility" ON activity_aggregates
    FOR SELECT
    USING (
        actor_id IN (
            SELECT id FROM users WHERE is_public = true
        ) 
        OR actor_id IN (
            SELECT following_id FROM user_follows WHERE follower_id = auth.uid()
        )
        OR actor_id = auth.uid()
    );

CREATE POLICY "Users can manage their own activity aggregates" ON activity_aggregates
    FOR ALL
    USING (actor_id = auth.uid());

-- Function to create activity with intelligent grouping
CREATE OR REPLACE FUNCTION create_activity(
    p_actor_id UUID,
    p_action_type TEXT,
    p_target_type TEXT,
    p_target_id UUID,
    p_metadata JSONB DEFAULT '{}',
    p_content_preview TEXT DEFAULT NULL,
    p_visibility TEXT DEFAULT 'public'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activity_id UUID;
    group_key_val TEXT;
    existing_aggregate_id UUID;
    target_title TEXT;
    target_description TEXT;
    group_window_hours INTEGER := 6; -- Group similar activities within 6 hours
BEGIN
    -- Generate group key for groupable activities
    IF p_action_type IN ('article_liked', 'comment_liked', 'user_followed') THEN
        group_key_val := p_actor_id::TEXT || '_' || p_action_type || '_' || 
                        date_trunc('day', NOW())::TEXT;
    ELSE 
        group_key_val := NULL;
    END IF;
    
    -- Insert individual activity
    INSERT INTO activity_feed (
        actor_id, action_type, target_type, target_id, 
        metadata, content_preview, visibility, group_key
    ) VALUES (
        p_actor_id, p_action_type, p_target_type, p_target_id,
        p_metadata, p_content_preview, p_visibility, group_key_val
    ) RETURNING id INTO activity_id;
    
    -- Handle aggregation for groupable activities
    IF group_key_val IS NOT NULL THEN
        -- Get target details for display
        IF p_target_type = 'article' THEN
            SELECT title, COALESCE(excerpt, LEFT(content, 200))
            INTO target_title, target_description
            FROM articles WHERE id = p_target_id;
        ELSIF p_target_type = 'user' THEN
            SELECT COALESCE(name, email), bio
            INTO target_title, target_description
            FROM users WHERE id = p_target_id;
        END IF;
        
        -- Check for existing aggregate
        SELECT id INTO existing_aggregate_id
        FROM activity_aggregates 
        WHERE group_key = group_key_val
        AND last_activity_at > NOW() - INTERVAL '1 hour' * group_window_hours;
        
        IF existing_aggregate_id IS NOT NULL THEN
            -- Update existing aggregate
            UPDATE activity_aggregates 
            SET 
                count = count + 1,
                sample_actors = array_append(
                    sample_actors[1:4], -- Keep max 5 actors  
                    p_actor_id
                ),
                last_activity_at = NOW(),
                updated_at = NOW()
            WHERE id = existing_aggregate_id;
        ELSE
            -- Create new aggregate
            INSERT INTO activity_aggregates (
                group_key, actor_id, action_type, target_type, target_id,
                count, sample_actors, title, description,
                first_activity_at, last_activity_at
            ) VALUES (
                group_key_val, p_actor_id, p_action_type, p_target_type, p_target_id,
                1, ARRAY[p_actor_id], 
                COALESCE(target_title, 'Unknown'),
                COALESCE(target_description, ''),
                NOW(), NOW()
            );
        END IF;
    END IF;
    
    RETURN activity_id;
END;
$$;

-- Trigger function to automatically create activities for certain actions
CREATE OR REPLACE FUNCTION trigger_create_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    activity_metadata JSONB;
BEGIN
    -- Create activity based on table and action
    activity_metadata := '{}';
    
    IF TG_TABLE_NAME = 'articles' AND TG_OP = 'INSERT' THEN
        activity_metadata := jsonb_build_object(
            'article_title', NEW.title,
            'article_url', NEW.url,
            'domain', NEW.domain,
            'tags', NEW.tags
        );
        
        PERFORM create_activity(
            NEW.user_id,
            'article_created',
            'article',
            NEW.id,
            activity_metadata,
            LEFT(COALESCE(NEW.excerpt, NEW.content), 200),
            CASE WHEN NEW.is_public THEN 'public' ELSE 'followers' END
        );
    END IF;
    
    IF TG_TABLE_NAME = 'likes' AND TG_OP = 'INSERT' THEN
        -- Get article info for metadata
        SELECT jsonb_build_object(
            'article_title', title,
            'article_url', url,
            'author', author
        ) INTO activity_metadata
        FROM articles WHERE id = NEW.article_id;
        
        PERFORM create_activity(
            NEW.user_id,
            'article_liked',
            'article',
            NEW.article_id,
            activity_metadata,
            NULL,
            'followers'
        );
    END IF;
    
    IF TG_TABLE_NAME = 'likes' AND TG_OP = 'DELETE' THEN
        -- Remove activity when like is removed
        DELETE FROM activity_feed 
        WHERE actor_id = OLD.user_id 
        AND action_type = 'article_liked'
        AND target_type = 'article'
        AND target_id = OLD.article_id
        AND created_at > NOW() - INTERVAL '24 hours'; -- Only recent likes
        
        -- Update aggregate count
        UPDATE activity_aggregates 
        SET count = count - 1,
            updated_at = NOW()
        WHERE actor_id = OLD.user_id
        AND action_type = 'article_liked'
        AND target_id = OLD.article_id
        AND count > 1;
        
        -- Delete aggregate if count becomes 0
        DELETE FROM activity_aggregates
        WHERE actor_id = OLD.user_id
        AND action_type = 'article_liked'  
        AND target_id = OLD.article_id
        AND count <= 1;
    END IF;
    
    IF TG_TABLE_NAME = 'comments' AND TG_OP = 'INSERT' THEN
        -- Get article info for metadata
        SELECT jsonb_build_object(
            'article_title', a.title,
            'article_url', a.url,
            'comment_content', LEFT(NEW.content, 200)
        ) INTO activity_metadata
        FROM articles a WHERE a.id = NEW.article_id;
        
        PERFORM create_activity(
            NEW.user_id,
            'comment_created',
            'article',
            NEW.article_id,
            activity_metadata || jsonb_build_object('comment_id', NEW.id),
            LEFT(NEW.content, 200),
            'public'
        );
    END IF;
    
    IF TG_TABLE_NAME = 'user_follows' AND TG_OP = 'INSERT' THEN
        -- Get followed user info
        SELECT jsonb_build_object(
            'followed_user_name', COALESCE(name, email),
            'followed_user_bio', bio
        ) INTO activity_metadata
        FROM users WHERE id = NEW.following_id;
        
        PERFORM create_activity(
            NEW.follower_id,
            'user_followed',
            'user',
            NEW.following_id,
            activity_metadata,
            NULL,
            'public'
        );
    END IF;
    
    IF TG_TABLE_NAME = 'user_follows' AND TG_OP = 'DELETE' THEN
        -- Remove follow activity (optional - you might want to keep history)
        DELETE FROM activity_feed 
        WHERE actor_id = OLD.follower_id 
        AND action_type = 'user_followed'
        AND target_type = 'user'
        AND target_id = OLD.following_id
        AND created_at > NOW() - INTERVAL '24 hours';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for automatic activity creation
DROP TRIGGER IF EXISTS trigger_articles_activity ON articles;
CREATE TRIGGER trigger_articles_activity
    AFTER INSERT ON articles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_activity();

DROP TRIGGER IF EXISTS trigger_likes_activity ON likes;  
CREATE TRIGGER trigger_likes_activity
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_activity();

DROP TRIGGER IF EXISTS trigger_comments_activity ON comments;
CREATE TRIGGER trigger_comments_activity
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_activity();

DROP TRIGGER IF EXISTS trigger_user_follows_activity ON user_follows;
CREATE TRIGGER trigger_user_follows_activity
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_activity();

-- Add updated_at triggers
CREATE TRIGGER update_activity_feed_updated_at BEFORE UPDATE ON activity_feed
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_aggregates_updated_at BEFORE UPDATE ON activity_aggregates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old activities (can be run as scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_activities(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old individual activities
    DELETE FROM activity_feed 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old aggregates  
    DELETE FROM activity_aggregates
    WHERE last_activity_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    RETURN deleted_count;
END;
$$;