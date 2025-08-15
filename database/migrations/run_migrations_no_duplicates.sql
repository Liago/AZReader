-- AZReader Incremental Database Migration Script (HANDLES DUPLICATES)
-- This handles existing tables and prevents duplicate key errors

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
END $$;

-- =====================================================
-- MIGRATE EXISTING DATA IF NEEDED
-- =====================================================

-- If posts table exists, migrate it to articles (handling duplicates)
DO $$
DECLARE
    rec RECORD;
    migrated_count INTEGER := 0;
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
        
        RAISE NOTICE 'Migrating posts data to articles table (handling duplicates)...';
        
        -- Use a different approach: ROW_NUMBER() to handle duplicates
        -- Keep the most recent record for each user_id/url combination
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
            effective_user_id,
            url,
            title,
            content,
            COALESCE(dek, excerpt),
            lead_image_url,
            author,
            date_published,
            domain,
            NOW(),
            NOW()
        FROM (
            SELECT *,
                   -- Create a unique user_id, using row number to make it unique when old_savedon is null
                   CASE 
                       WHEN old_savedon IS NOT NULL THEN old_savedon::TEXT
                       ELSE 'unknown_' || ROW_NUMBER() OVER (PARTITION BY url ORDER BY COALESCE(date_published, CURRENT_TIMESTAMP) DESC)::TEXT
                   END as effective_user_id,
                   -- Use row number to pick the most recent record for each user/url combination
                   ROW_NUMBER() OVER (
                       PARTITION BY 
                           CASE 
                               WHEN old_savedon IS NOT NULL THEN old_savedon::TEXT
                               ELSE 'unknown_' || ROW_NUMBER() OVER (PARTITION BY url ORDER BY COALESCE(date_published, CURRENT_TIMESTAMP) DESC)::TEXT
                           END,
                           url 
                       ORDER BY COALESCE(date_published, CURRENT_TIMESTAMP) DESC
                   ) as rn
            FROM posts
            WHERE url IS NOT NULL AND title IS NOT NULL
        ) ranked_posts
        WHERE rn = 1;  -- Only take the first (most recent) record for each user/url combo
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Successfully migrated % rows from posts to articles table', migrated_count;
        
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') 
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
        RAISE NOTICE 'Both posts and articles tables exist - skipping migration';
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
        RAISE NOTICE 'Created users table';
    ELSE
        -- Add missing columns to existing users table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_public') THEN
            ALTER TABLE users ADD COLUMN is_public BOOLEAN DEFAULT false;
            RAISE NOTICE 'Added is_public column to users table';
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

-- Create articles table if it doesn't exist (might have been created in migration above)
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'favicon_url') THEN
        ALTER TABLE articles ADD COLUMN favicon_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'scraped_at') THEN
        ALTER TABLE articles ADD COLUMN scraped_at TIMESTAMPTZ DEFAULT NOW();
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
        -- Articles user constraint (only if it doesn't exist)
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'articles_user_id_fkey') THEN
            -- We can't add this constraint because articles may have user_ids that don't exist in users table
            RAISE NOTICE 'Skipping articles user foreign key - would need to clean up orphaned user_ids first';
        END IF;
        
        -- Comments user constraint
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'comments_user_id_fkey') THEN
            RAISE NOTICE 'Skipping comments user foreign key for now';
        END IF;
        
        -- Likes user constraint  
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'likes_user_id_fkey') THEN
            RAISE NOTICE 'Skipping likes user foreign key for now';
        END IF;
        
        -- Tags user constraint
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tags_user_id_fkey') THEN
            RAISE NOTICE 'Skipping tags user foreign key for now';
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
-- CREATE POLICIES (SIMPLIFIED FOR NOW)
-- =====================================================

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid()::TEXT = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::TEXT = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid()::TEXT = id);
CREATE POLICY "Public profiles are viewable" ON users FOR SELECT USING (is_public = true);

-- Articles policies (simplified - no foreign key dependency)
CREATE POLICY "Users can manage their own articles" ON articles FOR ALL USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Public articles are viewable" ON articles FOR SELECT USING (is_public = true);

-- Comments policies
CREATE POLICY "Users can manage their own comments" ON comments FOR ALL USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Public comments are viewable" ON comments FOR SELECT USING (is_public = true);

-- Likes policies
CREATE POLICY "Users can manage their own likes" ON likes FOR ALL USING (auth.uid()::TEXT = user_id);

-- Tags policies
CREATE POLICY "Users can manage their own tags" ON tags FOR ALL USING (auth.uid()::TEXT = user_id);
CREATE POLICY "Public tags are viewable" ON tags FOR SELECT USING (is_public = true);

-- Article tags policies  
CREATE POLICY "Users can manage article tags" ON article_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM articles WHERE id = article_tags.article_id AND user_id = auth.uid()::TEXT)
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY! ===';
    RAISE NOTICE 'Created/updated tables: users, articles, comments, likes, tags, article_tags';
    RAISE NOTICE 'Applied Row Level Security policies';
    RAISE NOTICE 'Created performance indexes';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        RAISE NOTICE 'Articles table now has % rows (migrated from posts)', (SELECT COUNT(*) FROM articles);
        RAISE NOTICE 'Original posts table still exists with % rows', (SELECT COUNT(*) FROM posts);
        RAISE NOTICE 'You can verify the migration and drop "posts" table later if everything looks good';
    END IF;
    
    RAISE NOTICE 'Your application should now work with the "articles" endpoint!';
END $$;