-- ====================================================================
-- Full-Text Search Optimization Migration
-- ====================================================================
-- This migration creates optimized full-text search capabilities for articles
-- including weighted search across titles, content, authors, and tags

-- Enable full-text search extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ====================================================================
-- 1. Create search configuration for better text matching
-- ====================================================================

-- Create custom text search configuration for articles
CREATE TEXT SEARCH CONFIGURATION article_search (COPY = english);

-- Add unaccent support for international characters
ALTER TEXT SEARCH CONFIGURATION article_search
    ALTER MAPPING FOR hword, hword_part, word 
    WITH unaccent, english_stem;

-- ====================================================================
-- 2. Create full-text search indices
-- ====================================================================

-- Create GIN indices for fast full-text search
CREATE INDEX IF NOT EXISTS idx_posts_fulltext_search 
ON posts USING GIN (
    (
        setweight(to_tsvector('article_search', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('article_search', COALESCE(content, '')), 'B') ||
        setweight(to_tsvector('article_search', COALESCE(author, '')), 'C') ||
        setweight(to_tsvector('article_search', COALESCE(description, '')), 'D')
    )
);

-- Create trigram indices for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_posts_title_trigram ON posts USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trigram ON posts USING GIN (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_author_trigram ON posts USING GIN (author gin_trgm_ops);

-- Create indices for filtered searches
CREATE INDEX IF NOT EXISTS idx_posts_search_filter ON posts (user_id, created_at, is_read);
CREATE INDEX IF NOT EXISTS idx_posts_domain_search ON posts (domain, user_id) WHERE domain IS NOT NULL;

-- ====================================================================
-- 3. Create search functions
-- ====================================================================

-- Function to perform weighted full-text search
CREATE OR REPLACE FUNCTION search_articles(
    user_id_param UUID,
    search_query TEXT,
    tag_ids UUID[] DEFAULT NULL,
    include_read BOOLEAN DEFAULT TRUE,
    date_from TIMESTAMP DEFAULT NULL,
    date_to TIMESTAMP DEFAULT NULL,
    domain_filter TEXT DEFAULT NULL,
    sort_by TEXT DEFAULT 'relevance',
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    author TEXT,
    description TEXT,
    url TEXT,
    domain TEXT,
    created_at TIMESTAMP,
    is_read BOOLEAN,
    reading_progress NUMERIC,
    tags JSONB,
    relevance_score REAL
) AS $$
DECLARE
    query_tsquery TSQUERY;
    base_query TEXT;
BEGIN
    -- Sanitize and prepare search query
    IF search_query IS NULL OR LENGTH(TRIM(search_query)) = 0 THEN
        RAISE EXCEPTION 'Search query cannot be empty';
    END IF;
    
    -- Convert search query to tsquery with error handling
    BEGIN
        query_tsquery := plainto_tsquery('article_search', search_query);
    EXCEPTION WHEN OTHERS THEN
        -- Fallback to simple word search if complex query fails
        query_tsquery := plainto_tsquery('article_search', regexp_replace(search_query, '[^a-zA-Z0-9\s]', '', 'g'));
    END;
    
    -- Build base query
    base_query := '
        SELECT 
            p.id,
            p.title,
            p.content,
            p.author,
            p.description,
            p.url,
            p.domain,
            p.created_at,
            p.is_read,
            p.reading_progress,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        ''id'', t.id,
                        ''name'', t.name,
                        ''color'', t.color
                    )
                ) FILTER (WHERE t.id IS NOT NULL),
                ''[]''::json
            )::jsonb as tags,
            (
                -- Weighted relevance scoring
                ts_rank_cd(
                    setweight(to_tsvector(''article_search'', COALESCE(p.title, '''')), ''A'') ||
                    setweight(to_tsvector(''article_search'', COALESCE(p.content, '''')), ''B'') ||
                    setweight(to_tsvector(''article_search'', COALESCE(p.author, '''')), ''C'') ||
                    setweight(to_tsvector(''article_search'', COALESCE(p.description, '''')), ''D''),
                    $1,
                    1|2|4|8
                ) * (
                    -- Boost recent articles slightly
                    CASE 
                        WHEN p.created_at > NOW() - INTERVAL ''7 days'' THEN 1.1
                        WHEN p.created_at > NOW() - INTERVAL ''30 days'' THEN 1.05
                        ELSE 1.0
                    END
                ) * (
                    -- Boost unread articles slightly
                    CASE 
                        WHEN NOT p.is_read THEN 1.1
                        ELSE 1.0
                    END
                )
            )::real as relevance_score
        FROM posts p
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE 
            p.user_id = $2
            AND (
                -- Full-text search match
                (
                    setweight(to_tsvector(''article_search'', COALESCE(p.title, '''')), ''A'') ||
                    setweight(to_tsvector(''article_search'', COALESCE(p.content, '''')), ''B'') ||
                    setweight(to_tsvector(''article_search'', COALESCE(p.author, '''')), ''C'') ||
                    setweight(to_tsvector(''article_search'', COALESCE(p.description, '''')), ''D'')
                ) @@ $1
                OR 
                -- Fuzzy matching as fallback
                (
                    p.title ILIKE $3 OR
                    p.content ILIKE $3 OR
                    p.author ILIKE $3 OR
                    p.description ILIKE $3
                )
            )';
    
    -- Add optional filters
    IF NOT include_read THEN
        base_query := base_query || ' AND NOT p.is_read';
    END IF;
    
    IF date_from IS NOT NULL THEN
        base_query := base_query || ' AND p.created_at >= $4';
    END IF;
    
    IF date_to IS NOT NULL THEN
        base_query := base_query || ' AND p.created_at <= $5';
    END IF;
    
    IF domain_filter IS NOT NULL THEN
        base_query := base_query || ' AND p.domain ILIKE $6';
    END IF;
    
    IF tag_ids IS NOT NULL AND array_length(tag_ids, 1) > 0 THEN
        base_query := base_query || ' AND pt.tag_id = ANY($7)';
    END IF;
    
    -- Add grouping and ordering
    base_query := base_query || ' GROUP BY p.id, p.title, p.content, p.author, p.description, p.url, p.domain, p.created_at, p.is_read, p.reading_progress';
    
    -- Add sorting
    CASE sort_by
        WHEN 'relevance' THEN
            base_query := base_query || ' ORDER BY relevance_score DESC, p.created_at DESC';
        WHEN 'date' THEN
            base_query := base_query || ' ORDER BY p.created_at DESC';
        WHEN 'title' THEN
            base_query := base_query || ' ORDER BY p.title ASC';
        WHEN 'author' THEN
            base_query := base_query || ' ORDER BY p.author ASC, p.created_at DESC';
        ELSE
            base_query := base_query || ' ORDER BY relevance_score DESC, p.created_at DESC';
    END CASE;
    
    -- Add pagination
    base_query := base_query || ' LIMIT $8 OFFSET $9';
    
    -- Execute query with parameters
    RETURN QUERY EXECUTE base_query 
    USING 
        query_tsquery, 
        user_id_param, 
        '%' || search_query || '%',
        date_from,
        date_to,
        '%' || domain_filter || '%',
        tag_ids,
        limit_count, 
        offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get search suggestions based on existing content
CREATE OR REPLACE FUNCTION get_search_suggestions(
    user_id_param UUID,
    query_prefix TEXT,
    suggestion_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    suggestion_type TEXT,
    frequency INTEGER,
    last_used TIMESTAMP
) AS $$
BEGIN
    -- Return suggestions from various sources
    RETURN QUERY (
        -- Recent search terms (would be stored in a search_history table if we had one)
        -- Tags that match the prefix
        SELECT 
            t.name as suggestion,
            'tag'::text as suggestion_type,
            COUNT(pt.post_id)::integer as frequency,
            MAX(p.created_at) as last_used
        FROM tags t
        JOIN post_tags pt ON t.id = pt.tag_id
        JOIN posts p ON pt.post_id = p.id
        WHERE 
            p.user_id = user_id_param
            AND t.name ILIKE query_prefix || '%'
        GROUP BY t.id, t.name
        ORDER BY frequency DESC, last_used DESC
        LIMIT suggestion_limit / 2
    ) UNION (
        -- Authors that match the prefix
        SELECT 
            p.author as suggestion,
            'author'::text as suggestion_type,
            COUNT(*)::integer as frequency,
            MAX(p.created_at) as last_used
        FROM posts p
        WHERE 
            p.user_id = user_id_param
            AND p.author IS NOT NULL
            AND p.author ILIKE query_prefix || '%'
        GROUP BY p.author
        ORDER BY frequency DESC, last_used DESC
        LIMIT suggestion_limit / 2
    ) UNION (
        -- Popular domains
        SELECT 
            p.domain as suggestion,
            'domain'::text as suggestion_type,
            COUNT(*)::integer as frequency,
            MAX(p.created_at) as last_used
        FROM posts p
        WHERE 
            p.user_id = user_id_param
            AND p.domain IS NOT NULL
            AND p.domain ILIKE query_prefix || '%'
        GROUP BY p.domain
        ORDER BY frequency DESC, last_used DESC
        LIMIT suggestion_limit / 4
    )
    ORDER BY frequency DESC, last_used DESC
    LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get search statistics
CREATE OR REPLACE FUNCTION get_search_statistics(
    user_id_param UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_articles INTEGER,
    total_tags INTEGER,
    total_authors INTEGER,
    total_domains INTEGER,
    articles_last_week INTEGER,
    most_common_tags JSONB,
    most_common_authors JSONB,
    most_common_domains JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::integer FROM posts WHERE user_id = user_id_param) as total_articles,
        (SELECT COUNT(DISTINCT t.id)::integer 
         FROM tags t 
         JOIN post_tags pt ON t.id = pt.tag_id 
         JOIN posts p ON pt.post_id = p.id 
         WHERE p.user_id = user_id_param) as total_tags,
        (SELECT COUNT(DISTINCT author)::integer 
         FROM posts 
         WHERE user_id = user_id_param AND author IS NOT NULL) as total_authors,
        (SELECT COUNT(DISTINCT domain)::integer 
         FROM posts 
         WHERE user_id = user_id_param AND domain IS NOT NULL) as total_domains,
        (SELECT COUNT(*)::integer 
         FROM posts 
         WHERE user_id = user_id_param 
         AND created_at > NOW() - INTERVAL '7 days') as articles_last_week,
        (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('name', name, 'count', cnt)), '[]'::json)::jsonb
         FROM (
             SELECT t.name, COUNT(pt.post_id)::integer as cnt
             FROM tags t
             JOIN post_tags pt ON t.id = pt.tag_id
             JOIN posts p ON pt.post_id = p.id
             WHERE p.user_id = user_id_param
             GROUP BY t.id, t.name
             ORDER BY cnt DESC
             LIMIT 10
         ) as tag_stats) as most_common_tags,
        (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('author', author, 'count', cnt)), '[]'::json)::jsonb
         FROM (
             SELECT author, COUNT(*)::integer as cnt
             FROM posts
             WHERE user_id = user_id_param AND author IS NOT NULL
             GROUP BY author
             ORDER BY cnt DESC
             LIMIT 10
         ) as author_stats) as most_common_authors,
        (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('domain', domain, 'count', cnt)), '[]'::json)::jsonb
         FROM (
             SELECT domain, COUNT(*)::integer as cnt
             FROM posts
             WHERE user_id = user_id_param AND domain IS NOT NULL
             GROUP BY domain
             ORDER BY cnt DESC
             LIMIT 10
         ) as domain_stats) as most_common_domains;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 4. Create search performance monitoring
-- ====================================================================

-- Table to store search queries for analytics
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    filters_used JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for search analytics
CREATE INDEX IF NOT EXISTS idx_search_queries_user_date ON search_queries (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_performance ON search_queries (execution_time_ms, result_count);

-- Function to log search queries
CREATE OR REPLACE FUNCTION log_search_query(
    user_id_param UUID,
    query_text_param TEXT,
    result_count_param INTEGER,
    execution_time_param INTEGER,
    filters_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    search_id UUID;
BEGIN
    INSERT INTO search_queries (user_id, query_text, result_count, execution_time_ms, filters_used)
    VALUES (user_id_param, query_text_param, result_count_param, execution_time_param, filters_param)
    RETURNING id INTO search_id;
    
    RETURN search_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 5. Create search result highlighting support
-- ====================================================================

-- Function to generate search result snippets with highlighting
CREATE OR REPLACE FUNCTION generate_search_snippet(
    content_text TEXT,
    search_query TEXT,
    snippet_length INTEGER DEFAULT 200,
    highlight_tag TEXT DEFAULT '<mark>'
)
RETURNS TEXT AS $$
DECLARE
    query_words TEXT[];
    snippet TEXT;
    highlighted_snippet TEXT;
    word TEXT;
    start_pos INTEGER;
    end_pos INTEGER;
BEGIN
    -- Handle null or empty inputs
    IF content_text IS NULL OR LENGTH(TRIM(content_text)) = 0 THEN
        RETURN '';
    END IF;
    
    IF search_query IS NULL OR LENGTH(TRIM(search_query)) = 0 THEN
        RETURN LEFT(content_text, snippet_length);
    END IF;
    
    -- Split search query into words
    query_words := string_to_array(lower(trim(search_query)), ' ');
    
    -- Find first occurrence of any search word
    start_pos := LENGTH(content_text) + 1;
    FOREACH word IN ARRAY query_words LOOP
        IF LENGTH(trim(word)) > 0 THEN
            DECLARE
                word_pos INTEGER := POSITION(lower(word) IN lower(content_text));
            BEGIN
                IF word_pos > 0 AND word_pos < start_pos THEN
                    start_pos := word_pos;
                END IF;
            END;
        END IF;
    END LOOP;
    
    -- If no words found, return beginning of content
    IF start_pos > LENGTH(content_text) THEN
        start_pos := 1;
    END IF;
    
    -- Adjust start position to avoid cutting words
    start_pos := GREATEST(1, start_pos - 50);
    WHILE start_pos > 1 AND SUBSTRING(content_text, start_pos, 1) != ' ' LOOP
        start_pos := start_pos - 1;
    END LOOP;
    
    -- Calculate end position
    end_pos := start_pos + snippet_length;
    IF end_pos < LENGTH(content_text) THEN
        -- Avoid cutting words at the end
        WHILE end_pos > start_pos AND SUBSTRING(content_text, end_pos, 1) != ' ' LOOP
            end_pos := end_pos - 1;
        END LOOP;
    ELSE
        end_pos := LENGTH(content_text);
    END IF;
    
    -- Extract snippet
    snippet := SUBSTRING(content_text, start_pos, end_pos - start_pos + 1);
    
    -- Add ellipsis if needed
    IF start_pos > 1 THEN
        snippet := '...' || snippet;
    END IF;
    IF end_pos < LENGTH(content_text) THEN
        snippet := snippet || '...';
    END IF;
    
    -- Highlight search terms
    highlighted_snippet := snippet;
    FOREACH word IN ARRAY query_words LOOP
        IF LENGTH(trim(word)) > 2 THEN -- Only highlight words longer than 2 characters
            highlighted_snippet := regexp_replace(
                highlighted_snippet,
                '(?i)\y' || regexp_replace(word, '([.*+?^${}()|[\]\\])', '\\\1', 'g') || '\y',
                highlight_tag || '\&</' || SUBSTRING(highlight_tag, 2),
                'g'
            );
        END IF;
    END LOOP;
    
    RETURN highlighted_snippet;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 6. Performance optimization
-- ====================================================================

-- Update table statistics for better query planning
ANALYZE posts;
ANALYZE tags;
ANALYZE post_tags;

-- Create partial indices for common search patterns
CREATE INDEX IF NOT EXISTS idx_posts_unread_recent 
ON posts (user_id, created_at DESC) 
WHERE NOT is_read;

CREATE INDEX IF NOT EXISTS idx_posts_by_domain_date 
ON posts (domain, user_id, created_at DESC) 
WHERE domain IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_articles TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION log_search_query TO authenticated;
GRANT EXECUTE ON FUNCTION generate_search_snippet TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT ON search_queries TO authenticated;

-- Add RLS policies for search_queries table
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search queries" 
ON search_queries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search queries" 
ON search_queries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- Migration Complete
-- ====================================================================

-- Add migration record
INSERT INTO migration_log (version, description, applied_at) 
VALUES ('06', 'Full-text search optimization with weighted queries and performance monitoring', NOW())
ON CONFLICT (version) DO UPDATE SET 
    applied_at = NOW(),
    description = EXCLUDED.description;