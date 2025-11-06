-- AZReader Complete Database Migration Script (FIXED)
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
-- NOTE: auth.users.id is TEXT, not UUID in Supabase
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table  
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique like per user per article
    UNIQUE(article_id, user_id)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique tag name per user
    UNIQUE(user_id, name)
);

-- Article Tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS article_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique tag per article
    UNIQUE(article_id, tag_id)
);

-- User follows table
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent self-follows and duplicate follows
    CHECK (follower_id != following_id),
    UNIQUE(follower_id, following_id)
);

-- User activities table for activity feed
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('like', 'comment', 'save', 'tag', 'share')),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User privacy settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_name TEXT NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, setting_name)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles(domain);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_reading_status ON articles(reading_status);
CREATE INDEX IF NOT EXISTS idx_articles_is_favorite ON articles(is_favorite);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_is_public ON articles(is_public);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Likes indexes  
CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Article tags indexes
CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- User activities indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_article_id ON user_activities(article_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_public ON user_activities(is_public);

-- Privacy settings indexes
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON user_privacy_settings(user_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_articles_fulltext ON articles USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(excerpt, '')));

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid()::TEXT = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::TEXT = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid()::TEXT = id);
CREATE POLICY "Public profiles are viewable" ON users FOR SELECT USING (is_public = true);

-- Articles policies
CREATE POLICY "Users can view their own articles" ON articles FOR SELECT USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can insert their own articles" ON articles FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can update their own articles" ON articles FOR UPDATE USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can delete their own articles" ON articles FOR DELETE USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Public articles are viewable" ON articles FOR SELECT USING (is_public = true);

-- Comments policies
CREATE POLICY "Users can view comments on their articles" ON comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE id = comments.article_id AND user_id = auth.uid()::TEXT)
    OR auth.uid()::TEXT = user_id
    OR is_public = true
);
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid()::TEXT = user_id);

-- Likes policies
CREATE POLICY "Users can view likes on accessible articles" ON likes FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE id = likes.article_id AND (user_id = auth.uid()::TEXT OR is_public = true))
);
CREATE POLICY "Users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid()::TEXT = user_id);

-- Tags policies
CREATE POLICY "Users can view their own tags" ON tags FOR SELECT USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can insert their own tags" ON tags FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can update their own tags" ON tags FOR UPDATE USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can delete their own tags" ON tags FOR DELETE USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Public tags are viewable" ON tags FOR SELECT USING (is_public = true);

-- Article tags policies
CREATE POLICY "Users can view article tags for accessible articles" ON article_tags FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE id = article_tags.article_id AND (user_id = auth.uid()::TEXT OR is_public = true))
);
CREATE POLICY "Users can manage tags on their articles" ON article_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM articles WHERE id = article_tags.article_id AND user_id = auth.uid()::TEXT)
);

-- User follows policies
CREATE POLICY "Users can view their own follows" ON user_follows FOR SELECT USING (
    auth.uid()::TEXT = follower_id OR auth.uid()::TEXT = following_id
);
CREATE POLICY "Users can manage their own follows" ON user_follows FOR ALL USING (auth.uid()::TEXT = follower_id);

-- User activities policies  
CREATE POLICY "Users can view their own activities" ON user_activities FOR SELECT USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Users can view public activities from followed users" ON user_activities FOR SELECT USING (
    is_public = true AND EXISTS (
        SELECT 1 FROM user_follows WHERE following_id = user_activities.user_id AND follower_id = auth.uid()::TEXT
    )
);
CREATE POLICY "Users can insert their own activities" ON user_activities FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);
CREATE POLICY "Public activities are viewable" ON user_activities FOR SELECT USING (is_public = true);

-- Privacy settings policies
CREATE POLICY "Users can manage their own privacy settings" ON user_privacy_settings FOR ALL USING (auth.uid()::TEXT = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_article_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET like_count = like_count + 1 WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET like_count = like_count - 1 WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like count updates
DROP TRIGGER IF EXISTS likes_count_trigger ON likes;
CREATE TRIGGER likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_article_like_count();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_article_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles SET comment_count = comment_count - 1 WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment count updates
DROP TRIGGER IF EXISTS comments_count_trigger ON comments;
CREATE TRIGGER comments_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_article_comment_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;
CREATE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS articles_updated_at_trigger ON articles;
CREATE TRIGGER articles_updated_at_trigger
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS comments_updated_at_trigger ON comments;
CREATE TRIGGER comments_updated_at_trigger
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tags_updated_at_trigger ON tags;
CREATE TRIGGER tags_updated_at_trigger
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS privacy_settings_updated_at_trigger ON user_privacy_settings;
CREATE TRIGGER privacy_settings_updated_at_trigger
    BEFORE UPDATE ON user_privacy_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function for personalized feed (optimized query)
CREATE OR REPLACE FUNCTION get_personalized_feed(
    user_uuid TEXT,
    feed_limit INTEGER DEFAULT 20,
    feed_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    excerpt TEXT,
    image_url TEXT,
    domain TEXT,
    author TEXT,
    published_date TIMESTAMPTZ,
    like_count INTEGER,
    comment_count INTEGER,
    is_favorite BOOLEAN,
    user_name TEXT,
    user_avatar TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.excerpt,
        a.image_url,
        a.domain,
        a.author,
        a.published_date,
        a.like_count,
        a.comment_count,
        a.is_favorite,
        u.name as user_name,
        u.avatar_url as user_avatar,
        a.created_at
    FROM articles a
    JOIN users u ON a.user_id = u.id
    WHERE a.is_public = true
       OR a.user_id = user_uuid
       OR EXISTS (
           SELECT 1 FROM user_follows uf 
           WHERE uf.follower_id = user_uuid 
           AND uf.following_id = a.user_id
       )
    ORDER BY a.created_at DESC
    LIMIT feed_limit
    OFFSET feed_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA (OPTIONAL)
-- =====================================================

-- This section can be used to insert default data if needed
-- For now, we'll leave it empty as users will be created through auth