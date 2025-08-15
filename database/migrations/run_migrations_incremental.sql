-- AZReader Incremental Database Migration Script
-- This handles existing tables and adds missing columns/tables safely

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- =====================================================

-- Drop all existing policies before recreating tables
DO $$ 
BEGIN
    -- Drop policies on users table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP POLICY IF EXISTS "Users can view their own profile" ON users;
        DROP POLICY IF EXISTS "Users can update their own profile" ON users;
        DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
        DROP POLICY IF EXISTS "Public profiles are viewable" ON users;
    END IF;
    
    -- Drop policies on articles table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
        DROP POLICY IF EXISTS "Users can view their own articles" ON articles;
        DROP POLICY IF EXISTS "Users can insert their own articles" ON articles;
        DROP POLICY IF EXISTS "Users can update their own articles" ON articles;
        DROP POLICY IF EXISTS "Users can delete their own articles" ON articles;
        DROP POLICY IF EXISTS "Public articles are viewable" ON articles;
    END IF;
    
    -- Drop policies on posts table if it exists (legacy)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
        DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
        DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
        DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
        DROP POLICY IF EXISTS "Public posts are viewable" ON posts;
    END IF;
END $$;

-- =====================================================
-- MIGRATE EXISTING DATA IF NEEDED
-- =====================================================

-- If posts table exists, migrate it to articles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
        
        -- Create articles table first
        CREATE TABLE articles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT NOT NULL,
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
            estimated_read_time INTEGER,
            is_public BOOLEAN DEFAULT false,
            scraped_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, url)
        );
        
        -- Migrate data from posts to articles (with column mapping)
        INSERT INTO articles (
            id, user_id, url, title, content, excerpt, image_url, author, 
            published_date, domain, created_at, updated_at
        )
        SELECT 
            CASE 
                WHEN id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
                THEN id::UUID 
                ELSE uuid_generate_v4() 
            END,
            COALESCE(savedBy, 'unknown'::TEXT),
            url,
            title,
            content,
            COALESCE(dek, excerpt),
            lead_image_url,
            author,
            CASE 
                WHEN date_published IS NOT NULL THEN date_published::TIMESTAMPTZ
                ELSE NULL
            END,
            domain,
            COALESCE(old_savedon::TIMESTAMPTZ, NOW()),
            NOW()
        FROM posts
        WHERE url IS NOT NULL AND title IS NOT NULL;
        
        RAISE NOTICE 'Migrated data from posts to articles table';
    END IF;
END $$;

-- =====================================================
-- CREATE/UPDATE USERS TABLE
-- =====================================================

-- Create or update users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
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
    ELSE
        -- Add missing columns to existing users table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_public') THEN
            ALTER TABLE users ADD COLUMN is_public BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
            ALTER TABLE users ADD COLUMN bio TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'website') THEN
            ALTER TABLE users ADD COLUMN website TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_provider') THEN
            ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email';
        END IF;
    END IF;
END $$;

-- =====================================================
-- CREATE/UPDATE ARTICLES TABLE
-- =====================================================

-- Create articles table if it doesn't exist
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
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
    estimated_read_time INTEGER,
    is_public BOOLEAN DEFAULT false,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, url)
);

-- Add missing columns to articles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'is_public') THEN
        ALTER TABLE articles ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'tags') THEN
        ALTER TABLE articles ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'reading_status') THEN
        ALTER TABLE articles ADD COLUMN reading_status TEXT DEFAULT 'unread' CHECK (reading_status IN ('unread', 'reading', 'completed'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'estimated_read_time') THEN
        ALTER TABLE articles ADD COLUMN estimated_read_time INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'like_count') THEN
        ALTER TABLE articles ADD COLUMN like_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'comment_count') THEN
        ALTER TABLE articles ADD COLUMN comment_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add foreign key constraint if users table exists and constraint doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'articles_user_id_fkey') THEN
        ALTER TABLE articles ADD CONSTRAINT articles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- CREATE OTHER TABLES
-- =====================================================

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table  
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Article Tags junction table
CREATE TABLE IF NOT EXISTS article_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, tag_id)
);

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINTS SAFELY
-- =====================================================

-- Add user foreign keys to other tables if users table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Comments user constraint
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'comments_user_id_fkey') THEN
            ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
        -- Likes user constraint  
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'likes_user_id_fkey') THEN
            ALTER TABLE likes ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
        -- Tags user constraint
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tags_user_id_fkey') THEN
            ALTER TABLE tags ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- =====================================================
-- CREATE INDEXES
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

-- Likes indexes  
CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE POLICIES (ONLY AFTER ALL COLUMNS EXIST)
-- =====================================================

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
CREATE POLICY "Users can view comments on accessible articles" ON comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE id = comments.article_id AND (user_id = auth.uid()::TEXT OR is_public = true))
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

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created/updated tables: users, articles, comments, likes, tags, article_tags';
    RAISE NOTICE 'Applied Row Level Security policies';
    RAISE NOTICE 'Created performance indexes';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        RAISE NOTICE 'WARNING: Legacy "posts" table still exists. Consider dropping it after verifying migration.';
    END IF;
END $$;