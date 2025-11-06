-- AZReader Database Row Level Security Policies
-- Enable RLS and create security policies for all tables

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can view their own profile and public profiles
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (is_public = true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (when signing up)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Articles table policies
-- Users can view their own articles
CREATE POLICY "Users can view own articles" ON articles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view public articles
CREATE POLICY "Users can view public articles" ON articles
    FOR SELECT USING (is_public = true);

-- Users can insert their own articles
CREATE POLICY "Users can insert own articles" ON articles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own articles
CREATE POLICY "Users can update own articles" ON articles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own articles
CREATE POLICY "Users can delete own articles" ON articles
    FOR DELETE USING (auth.uid() = user_id);

-- Comments table policies
-- Users can view comments on articles they can see
CREATE POLICY "Users can view comments on accessible articles" ON comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM articles 
            WHERE articles.id = comments.article_id 
            AND (articles.user_id = auth.uid() OR articles.is_public = true)
        )
    );

-- Users can insert comments on articles they can see
CREATE POLICY "Users can insert comments on accessible articles" ON comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM articles 
            WHERE articles.id = article_id 
            AND (articles.user_id = auth.uid() OR articles.is_public = true)
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Likes table policies
-- Users can view likes on articles they can see
CREATE POLICY "Users can view likes on accessible articles" ON likes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM articles 
            WHERE articles.id = likes.article_id 
            AND (articles.user_id = auth.uid() OR articles.is_public = true)
        )
    );

-- Users can like articles they can see
CREATE POLICY "Users can like accessible articles" ON likes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM articles 
            WHERE articles.id = article_id 
            AND (articles.user_id = auth.uid() OR articles.is_public = true)
        )
    );

-- Users can unlike their own likes
CREATE POLICY "Users can delete own likes" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- Reading log table policies
-- Users can only see and manage their own reading logs
CREATE POLICY "Users can view own reading logs" ON reading_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading logs" ON reading_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading logs" ON reading_log
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading logs" ON reading_log
    FOR DELETE USING (auth.uid() = user_id);

-- User follows table policies
-- Users can view their own following/followers
CREATE POLICY "Users can view own follows" ON user_follows
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can follow others
CREATE POLICY "Users can follow others" ON user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow others
CREATE POLICY "Users can unfollow others" ON user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Tags table policies
-- All authenticated users can view tags
CREATE POLICY "Authenticated users can view tags" ON tags
    FOR SELECT TO authenticated USING (true);

-- Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags" ON tags
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Users can update tags they created
CREATE POLICY "Users can update own tags" ON tags
    FOR UPDATE USING (auth.uid() = created_by);

-- Article tags table policies
-- Users can view article tags for articles they can see
CREATE POLICY "Users can view article tags for accessible articles" ON article_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM articles 
            WHERE articles.id = article_tags.article_id 
            AND (articles.user_id = auth.uid() OR articles.is_public = true)
        )
    );

-- Users can tag their own articles
CREATE POLICY "Users can tag own articles" ON article_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM articles 
            WHERE articles.id = article_id 
            AND articles.user_id = auth.uid()
        )
    );

-- Users can remove tags from their own articles
CREATE POLICY "Users can remove tags from own articles" ON article_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM articles 
            WHERE articles.id = article_id 
            AND articles.user_id = auth.uid()
        )
    );

-- User preferences table policies
-- Users can only see and manage their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);