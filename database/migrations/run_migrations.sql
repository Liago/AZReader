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