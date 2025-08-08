-- AZReader Database Functions and Triggers
-- Additional functions for data consistency and automation

-- Function to update article like count when likes are added/removed
CREATE OR REPLACE FUNCTION update_article_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles 
        SET like_count = like_count + 1 
        WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles 
        SET like_count = like_count - 1 
        WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for article like count
CREATE TRIGGER trigger_update_like_count_on_insert
    AFTER INSERT ON likes
    FOR EACH ROW EXECUTE FUNCTION update_article_like_count();

CREATE TRIGGER trigger_update_like_count_on_delete
    AFTER DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_article_like_count();

-- Function to update article comment count when comments are added/removed
CREATE OR REPLACE FUNCTION update_article_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE articles 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE articles 
        SET comment_count = comment_count - 1 
        WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for article comment count
CREATE TRIGGER trigger_update_comment_count_on_insert
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION update_article_comment_count();

CREATE TRIGGER trigger_update_comment_count_on_delete
    AFTER DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_article_comment_count();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags 
        SET usage_count = usage_count - 1 
        WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tag usage count
CREATE TRIGGER trigger_update_tag_usage_on_insert
    AFTER INSERT ON article_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER trigger_update_tag_usage_on_delete
    AFTER DELETE ON article_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to automatically create user preferences when a user is created
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user preferences
CREATE TRIGGER trigger_create_user_preferences
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_preferences();

-- Function to sync tags array with article_tags junction table
CREATE OR REPLACE FUNCTION sync_article_tags()
RETURNS TRIGGER AS $$
DECLARE
    tag_name TEXT;
    tag_record RECORD;
BEGIN
    -- Remove existing tag relationships
    DELETE FROM article_tags WHERE article_id = NEW.id;
    
    -- Add new tag relationships
    FOREACH tag_name IN ARRAY NEW.tags
    LOOP
        -- Find or create tag
        SELECT * INTO tag_record FROM tags WHERE name = tag_name;
        
        IF NOT FOUND THEN
            INSERT INTO tags (name, created_by) 
            VALUES (tag_name, NEW.user_id) 
            RETURNING * INTO tag_record;
        END IF;
        
        -- Create article-tag relationship
        INSERT INTO article_tags (article_id, tag_id) 
        VALUES (NEW.id, tag_record.id)
        ON CONFLICT (article_id, tag_id) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync article tags
CREATE TRIGGER trigger_sync_article_tags
    AFTER INSERT OR UPDATE OF tags ON articles
    FOR EACH ROW EXECUTE FUNCTION sync_article_tags();

-- Function to extract domain from URL
CREATE OR REPLACE FUNCTION extract_domain(url TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (regexp_matches(url, 'https?://(?:www\.)?([^/]+)', 'i'))[1];
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-set domain when article is inserted/updated
CREATE OR REPLACE FUNCTION set_article_domain()
RETURNS TRIGGER AS $$
BEGIN
    NEW.domain = extract_domain(NEW.url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set article domain
CREATE TRIGGER trigger_set_article_domain
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION set_article_domain();

-- Function to estimate reading time (assumes 200 words per minute)
CREATE OR REPLACE FUNCTION calculate_reading_time(content TEXT)
RETURNS INTEGER AS $$
DECLARE
    word_count INTEGER;
BEGIN
    IF content IS NULL OR content = '' THEN
        RETURN NULL;
    END IF;
    
    -- Simple word count (split by whitespace)
    word_count := array_length(string_to_array(trim(content), ' '), 1);
    
    -- Calculate reading time in minutes (200 words per minute)
    RETURN GREATEST(1, ROUND(word_count / 200.0));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-calculate reading time
CREATE OR REPLACE FUNCTION set_reading_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.estimated_read_time = calculate_reading_time(NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate reading time
CREATE TRIGGER trigger_set_reading_time
    BEFORE INSERT OR UPDATE OF content ON articles
    FOR EACH ROW EXECUTE FUNCTION set_reading_time();

-- Function to get user article feed (for discovery)
CREATE OR REPLACE FUNCTION get_user_feed(user_id UUID, page_size INTEGER DEFAULT 20, page_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    article_id UUID,
    title TEXT,
    excerpt TEXT,
    image_url TEXT,
    author TEXT,
    domain TEXT,
    published_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    like_count INTEGER,
    comment_count INTEGER,
    user_name TEXT,
    user_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as article_id,
        a.title,
        a.excerpt,
        a.image_url,
        a.author,
        a.domain,
        a.published_date,
        a.created_at,
        a.like_count,
        a.comment_count,
        u.name as user_name,
        u.avatar_url as user_avatar_url
    FROM articles a
    JOIN users u ON a.user_id = u.id
    WHERE a.is_public = true
    AND (
        -- Articles from followed users
        a.user_id IN (
            SELECT following_id 
            FROM user_follows 
            WHERE follower_id = get_user_feed.user_id
        )
        -- Or popular public articles
        OR (a.like_count > 5 OR a.comment_count > 2)
    )
    ORDER BY a.created_at DESC
    LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;