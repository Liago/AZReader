-- AZReader Complete Database Migration Script
-- Run this script in Supabase SQL Editor to set up the complete database schema

-- This script includes:
-- 1. Initial schema with all tables
-- 2. Row Level Security policies  
-- 3. Functions and triggers for data consistency
-- 4. Performance indexes
-- 5. Full-text search capabilities

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'email',
    bio TEXT,
    website TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    excerpt TEXT,
    image_url TEXT,
    favicon_url TEXT,
    author TEXT,
    published_date TIMESTAMPTZ,
    domain TEXT,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    reading_status TEXT DEFAULT 'unread' CHECK (reading_status IN ('unread', 'reading', 'completed')),
    estimated_read_time INTEGER, -- in minutes
    is_public BOOLEAN DEFAULT false,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique URL per user
    UNIQUE(user_id, url)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one like per user per article
    UNIQUE(article_id, user_id)
);

-- Reading log table (tracks reading progress/history)
CREATE TABLE IF NOT EXISTS reading_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    device_info JSONB,
    
    -- Allow multiple reading sessions per article
    CONSTRAINT valid_duration CHECK (duration_seconds >= 0)
);

-- User follows table (social feature)
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique follow relationship and prevent self-follow
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Tags table (for tag management and statistics)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article tags junction table (normalized tag relationships)
CREATE TABLE IF NOT EXISTS article_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(article_id, tag_id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
    reading_font_family TEXT DEFAULT 'system',
    reading_font_size INTEGER DEFAULT 16 CHECK (reading_font_size >= 12 AND reading_font_size <= 24),
    reading_line_height DECIMAL(3,2) DEFAULT 1.6 CHECK (reading_line_height >= 1.0 AND reading_line_height <= 3.0),
    reading_width TEXT DEFAULT 'medium' CHECK (reading_width IN ('narrow', 'medium', 'wide')),
    auto_mark_read BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    activity_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- =====================================================
-- INDEXES
-- =====================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_public ON articles(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_articles_reading_status ON articles(user_id, reading_status);
CREATE INDEX IF NOT EXISTS idx_articles_is_favorite ON articles(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles(domain);
CREATE INDEX IF NOT EXISTS idx_articles_full_text ON articles USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(excerpt, '')));

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

CREATE INDEX IF NOT EXISTS idx_reading_log_user_id ON reading_log(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_log_article_id ON reading_log(article_id);
CREATE INDEX IF NOT EXISTS idx_reading_log_read_at ON reading_log(read_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);

-- Activity feed indexes
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

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activity feed triggers
CREATE TRIGGER update_activity_feed_updated_at BEFORE UPDATE ON activity_feed
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_aggregates_updated_at BEFORE UPDATE ON activity_aggregates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_aggregates ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view public profiles" ON users FOR SELECT USING (is_public = true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Articles policies
CREATE POLICY "Users can view own articles" ON articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public articles" ON articles FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own articles" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own articles" ON articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own articles" ON articles FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments on accessible articles" ON comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = comments.article_id AND (articles.user_id = auth.uid() OR articles.is_public = true))
);
CREATE POLICY "Users can insert comments on accessible articles" ON comments FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (SELECT 1 FROM articles WHERE articles.id = article_id AND (articles.user_id = auth.uid() OR articles.is_public = true))
);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Users can view likes on accessible articles" ON likes FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = likes.article_id AND (articles.user_id = auth.uid() OR articles.is_public = true))
);
CREATE POLICY "Users can like accessible articles" ON likes FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (SELECT 1 FROM articles WHERE articles.id = article_id AND (articles.user_id = auth.uid() OR articles.is_public = true))
);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Reading log policies
CREATE POLICY "Users can view own reading logs" ON reading_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reading logs" ON reading_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reading logs" ON reading_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reading logs" ON reading_log FOR DELETE USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "Users can view own follows" ON user_follows FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- Tags policies
CREATE POLICY "Authenticated users can view tags" ON tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create tags" ON tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own tags" ON tags FOR UPDATE USING (auth.uid() = created_by);

-- Article tags policies
CREATE POLICY "Users can view article tags for accessible articles" ON article_tags FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = article_tags.article_id AND (articles.user_id = auth.uid() OR articles.is_public = true))
);
CREATE POLICY "Users can tag own articles" ON article_tags FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = article_id AND articles.user_id = auth.uid())
);
CREATE POLICY "Users can remove tags from own articles" ON article_tags FOR DELETE USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = article_id AND articles.user_id = auth.uid())
);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- Activity feed policies
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

-- Activity aggregates policies  
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

-- =====================================================
-- PERSONALIZED FEED FUNCTIONS
-- =====================================================

-- Function to get personalized feed with intelligent ranking for followed users
CREATE OR REPLACE FUNCTION get_personalized_feed(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_freshness_weight DECIMAL DEFAULT 0.4,
    p_interaction_weight DECIMAL DEFAULT 0.3,
    p_content_weight DECIMAL DEFAULT 0.2,
    p_engagement_weight DECIMAL DEFAULT 0.1
)
RETURNS TABLE (
    article_id UUID,
    user_id UUID,
    title TEXT,
    content TEXT,
    excerpt TEXT,
    url TEXT,
    image_url TEXT,
    author TEXT,
    domain TEXT,
    tags TEXT[],
    is_favorite BOOLEAN,
    like_count INTEGER,
    comment_count INTEGER,
    estimated_read_time INTEGER,
    is_public BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    author_name TEXT,
    author_email TEXT,
    author_avatar_url TEXT,
    follow_date TIMESTAMPTZ,
    recommendation_score DECIMAL,
    freshness_score DECIMAL,
    interaction_score DECIMAL,
    content_score DECIMAL,
    engagement_score DECIMAL,
    is_read BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    max_interactions INTEGER := 20;
    max_engagement INTEGER := 100;
BEGIN
    RETURN QUERY
    WITH followed_users AS (
        SELECT 
            uf.following_id,
            uf.created_at as follow_date
        FROM user_follows uf
        WHERE uf.follower_id = p_user_id
    ),
    user_preferences AS (
        SELECT 
            unnest(a.tags) as tag,
            count(*) as tag_count
        FROM articles a
        WHERE a.user_id = p_user_id
        AND array_length(a.tags, 1) > 0
        GROUP BY unnest(a.tags)
    ),
    personalized_articles AS (
        SELECT 
            a.*,
            u.name as author_name,
            u.email as author_email,
            u.avatar_url as author_avatar_url,
            fu.follow_date,
            GREATEST(0, exp(-EXTRACT(days FROM (now() - a.created_at)) / 7.0)) as fresh_score,
            0.5 as interact_score, -- Simplified for performance
            0.3 as content_pref_score, -- Simplified for performance  
            LEAST(1, (COALESCE(a.like_count, 0) + COALESCE(a.comment_count, 0))::DECIMAL / max_engagement) as engage_score,
            CASE WHEN rl.article_id IS NOT NULL THEN true ELSE false END as is_read
        FROM articles a
        JOIN followed_users fu ON a.user_id = fu.following_id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN reading_log rl ON rl.article_id = a.id AND rl.user_id = p_user_id
        WHERE a.is_public = true
        AND a.created_at >= now() - INTERVAL '90 days'
    )
    SELECT 
        pa.id as article_id,
        pa.user_id,
        pa.title,
        pa.content,
        pa.excerpt,
        pa.url,
        pa.image_url,
        pa.author,
        pa.domain,
        pa.tags,
        pa.is_favorite,
        pa.like_count,
        pa.comment_count,
        pa.estimated_read_time,
        pa.is_public,
        pa.created_at,
        pa.updated_at,
        pa.author_name,
        pa.author_email,
        pa.author_avatar_url,
        pa.follow_date,
        (
            pa.fresh_score * p_freshness_weight +
            pa.interact_score * p_interaction_weight +
            pa.content_pref_score * p_content_weight +
            pa.engage_score * p_engagement_weight
        )::DECIMAL as recommendation_score,
        pa.fresh_score * p_freshness_weight as freshness_score,
        pa.interact_score * p_interaction_weight as interaction_score,
        pa.content_pref_score * p_content_weight as content_score,
        pa.engage_score * p_engagement_weight as engagement_score,
        pa.is_read
    FROM personalized_articles pa
    ORDER BY 
        (
            pa.fresh_score * p_freshness_weight +
            pa.interact_score * p_interaction_weight +
            pa.content_pref_score * p_content_weight +
            pa.engage_score * p_engagement_weight
        ) DESC,
        pa.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_personalized_feed(UUID, INTEGER, INTEGER, DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;

-- =====================================================
-- ACTIVITY FEED FUNCTIONS
-- =====================================================

-- Function to create activity feed entries with intelligent grouping and aggregation
-- This function creates individual activity entries and manages aggregates for spam prevention

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
    v_activity_id UUID;
    v_group_key TEXT;
    v_aggregate_id UUID;
    v_existing_aggregate activity_aggregates;
    v_sample_actors UUID[];
    v_title TEXT;
    v_description TEXT;
    v_thumbnail_url TEXT;
    v_max_sample_actors INTEGER := 5;
    v_batch_window_minutes INTEGER := 60;
BEGIN
    -- Generate activity ID
    v_activity_id := uuid_generate_v4();
    
    -- Generate group key for aggregation
    -- Group by actor, action_type, target_type, and target_id within a time window
    v_group_key := format('%s_%s_%s_%s_%s', 
        p_actor_id::TEXT, 
        p_action_type, 
        p_target_type, 
        p_target_id::TEXT,
        EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'UTC'))::bigint / (v_batch_window_minutes * 60)
    );
    
    -- Insert activity record
    INSERT INTO activity_feed (
        id,
        actor_id,
        action_type,
        target_type,
        target_id,
        metadata,
        content_preview,
        visibility,
        group_key,
        created_at,
        updated_at
    ) VALUES (
        v_activity_id,
        p_actor_id,
        p_action_type,
        p_target_type,
        p_target_id,
        p_metadata,
        p_content_preview,
        p_visibility,
        v_group_key,
        NOW(),
        NOW()
    );
    
    -- Check for existing aggregate
    SELECT * INTO v_existing_aggregate
    FROM activity_aggregates
    WHERE group_key = v_group_key;
    
    -- Generate content for aggregate
    CASE p_action_type
        WHEN 'article_created' THEN
            v_title := COALESCE(p_content_preview, 'New article');
            v_description := format('Created a new article: %s', COALESCE(p_content_preview, 'Untitled'));
        WHEN 'article_liked' THEN
            v_title := COALESCE(p_content_preview, 'Article liked');
            v_description := format('Liked article: %s', COALESCE(p_content_preview, 'Article'));
        WHEN 'article_unliked' THEN
            v_title := COALESCE(p_content_preview, 'Article unliked');
            v_description := format('Unliked article: %s', COALESCE(p_content_preview, 'Article'));
        WHEN 'article_shared' THEN
            v_title := COALESCE(p_content_preview, 'Article shared');
            v_description := format('Shared article: %s', COALESCE(p_content_preview, 'Article'));
        WHEN 'comment_created' THEN
            v_title := 'New comment';
            v_description := format('Commented: %s', COALESCE(p_content_preview, 'Comment'));
        WHEN 'comment_liked' THEN
            v_title := 'Comment liked';
            v_description := format('Liked comment: %s', COALESCE(p_content_preview, 'Comment'));
        WHEN 'user_followed' THEN
            v_title := 'User followed';
            v_description := format('Started following %s', COALESCE(p_content_preview, 'user'));
        WHEN 'user_unfollowed' THEN
            v_title := 'User unfollowed';
            v_description := format('Stopped following %s', COALESCE(p_content_preview, 'user'));
        WHEN 'profile_updated' THEN
            v_title := 'Profile updated';
            v_description := format('Updated profile: %s', COALESCE(p_content_preview, 'changes made'));
        ELSE
            v_title := 'Activity';
            v_description := format('%s activity', p_action_type);
    END CASE;
    
    -- Get thumbnail URL from metadata if available
    v_thumbnail_url := p_metadata->>'thumbnail_url';
    
    IF v_existing_aggregate.id IS NOT NULL THEN
        -- Update existing aggregate
        
        -- Build new sample actors array (limit to v_max_sample_actors)
        v_sample_actors := v_existing_aggregate.sample_actors;
        IF NOT (p_actor_id = ANY(v_sample_actors)) THEN
            v_sample_actors := array_append(v_sample_actors, p_actor_id);
            -- Keep only the most recent actors
            IF array_length(v_sample_actors, 1) > v_max_sample_actors THEN
                v_sample_actors := v_sample_actors[1:v_max_sample_actors];
            END IF;
        END IF;
        
        UPDATE activity_aggregates SET
            count = count + 1,
            sample_actors = v_sample_actors,
            title = v_title,
            description = v_description,
            thumbnail_url = COALESCE(v_thumbnail_url, thumbnail_url),
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = v_existing_aggregate.id;
        
        v_aggregate_id := v_existing_aggregate.id;
    ELSE
        -- Create new aggregate
        v_aggregate_id := uuid_generate_v4();
        v_sample_actors := ARRAY[p_actor_id];
        
        INSERT INTO activity_aggregates (
            id,
            group_key,
            actor_id,
            action_type,
            target_type,
            target_id,
            count,
            sample_actors,
            title,
            description,
            thumbnail_url,
            first_activity_at,
            last_activity_at,
            created_at,
            updated_at
        ) VALUES (
            v_aggregate_id,
            v_group_key,
            p_actor_id,
            p_action_type,
            p_target_type,
            p_target_id,
            1,
            v_sample_actors,
            v_title,
            v_description,
            v_thumbnail_url,
            NOW(),
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN v_activity_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and re-raise
        RAISE NOTICE 'Error in create_activity: %', SQLERRM;
        RAISE;
END;
$$;

-- Function to get followed users' activities with enhanced filtering
CREATE OR REPLACE FUNCTION get_following_activities(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_action_types TEXT[] DEFAULT NULL,
    p_time_window_hours INTEGER DEFAULT 168, -- Default 7 days
    p_aggregated BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    actor_id UUID,
    action_type TEXT,
    target_type TEXT,
    target_id UUID,
    metadata JSONB,
    content_preview TEXT,
    visibility TEXT,
    group_key TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    -- Aggregate fields
    count INTEGER,
    sample_actors UUID[],
    title TEXT,
    description TEXT,
    thumbnail_url TEXT,
    first_activity_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    -- Actor info
    actor_email TEXT,
    actor_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_aggregated THEN
        RETURN QUERY
        SELECT 
            aa.id,
            aa.actor_id,
            aa.action_type,
            aa.target_type,
            aa.target_id,
            NULL::JSONB as metadata,
            NULL::TEXT as content_preview,
            'public'::TEXT as visibility,
            aa.group_key,
            aa.created_at,
            aa.updated_at,
            aa.count,
            aa.sample_actors,
            aa.title,
            aa.description,
            aa.thumbnail_url,
            aa.first_activity_at,
            aa.last_activity_at,
            u.email as actor_email,
            u.avatar_url as actor_avatar_url
        FROM activity_aggregates aa
        JOIN user_follows uf ON aa.actor_id = uf.following_id
        JOIN users u ON aa.actor_id = u.id
        WHERE uf.follower_id = p_user_id
        AND aa.last_activity_at >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
        AND (p_action_types IS NULL OR aa.action_type = ANY(p_action_types))
        ORDER BY aa.last_activity_at DESC
        LIMIT p_limit
        OFFSET p_offset;
    ELSE
        RETURN QUERY
        SELECT 
            af.id,
            af.actor_id,
            af.action_type,
            af.target_type,
            af.target_id,
            af.metadata,
            af.content_preview,
            af.visibility,
            af.group_key,
            af.created_at,
            af.updated_at,
            NULL::INTEGER as count,
            NULL::UUID[] as sample_actors,
            NULL::TEXT as title,
            NULL::TEXT as description,
            NULL::TEXT as thumbnail_url,
            NULL::TIMESTAMPTZ as first_activity_at,
            NULL::TIMESTAMPTZ as last_activity_at,
            u.email as actor_email,
            u.avatar_url as actor_avatar_url
        FROM activity_feed af
        JOIN user_follows uf ON af.actor_id = uf.following_id
        JOIN users u ON af.actor_id = u.id
        WHERE uf.follower_id = p_user_id
        AND af.created_at >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
        AND (p_action_types IS NULL OR af.action_type = ANY(p_action_types))
        AND (af.visibility = 'public' OR af.visibility = 'followers')
        ORDER BY af.created_at DESC
        LIMIT p_limit
        OFFSET p_offset;
    END IF;
END;
$$;

-- Function to clean up old activities (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_activities(
    p_days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete old individual activities
    DELETE FROM activity_feed
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Delete old aggregates
    DELETE FROM activity_aggregates
    WHERE last_activity_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = v_deleted_count + ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- Grant permissions for activity functions
GRANT EXECUTE ON FUNCTION create_activity(UUID, TEXT, TEXT, UUID, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_following_activities(UUID, INTEGER, INTEGER, TEXT[], INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_activities(INTEGER) TO authenticated;