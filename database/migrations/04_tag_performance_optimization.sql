-- AZReader Database Schema
-- Tag Performance Optimization Migration
-- Implements comprehensive performance improvements for tag management

-- =====================================
-- 1. ENHANCED TAG INDICES
-- =====================================

-- Composite indices for multi-tag filtering performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_tags_composite_user 
    ON article_tags(tag_id, article_id);

-- Advanced composite index for complex tag queries with user filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_user_tags_status 
    ON articles(user_id, reading_status, is_favorite, created_at DESC);

-- Index for tag statistics and usage counting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_usage_created 
    ON tags(usage_count DESC, created_at DESC);

-- Index for tag search and autocomplete
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_name_trgm 
    ON tags USING GIN(name gin_trgm_ops);

-- Index for article tag counting per user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_tags_user_count 
    ON article_tags(tag_id) INCLUDE (article_id);

-- =====================================
-- 2. TAG STATISTICS MATERIALIZED VIEW
-- =====================================

-- Create materialized view for fast tag statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS tag_statistics AS
SELECT 
    t.id,
    t.name,
    t.color,
    t.created_at,
    t.created_by,
    COUNT(at.article_id) as usage_count,
    COUNT(DISTINCT a.user_id) as user_count,
    MAX(a.created_at) as last_used,
    COUNT(at.article_id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '7 days') as weekly_usage,
    COUNT(at.article_id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '30 days') as monthly_usage,
    COUNT(at.article_id) FILTER (WHERE a.is_favorite = true) as favorite_usage
FROM tags t
LEFT JOIN article_tags at ON t.id = at.tag_id
LEFT JOIN articles a ON at.article_id = a.id
GROUP BY t.id, t.name, t.color, t.created_at, t.created_by;

-- Index on materialized view for fast querying
CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_statistics_id ON tag_statistics(id);
CREATE INDEX IF NOT EXISTS idx_tag_statistics_usage ON tag_statistics(usage_count DESC, name);
CREATE INDEX IF NOT EXISTS idx_tag_statistics_recent ON tag_statistics(last_used DESC, usage_count DESC);

-- =====================================
-- 3. TAG USAGE COUNTING FUNCTIONS
-- =====================================

-- Function to efficiently update tag usage counts
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment usage count
        UPDATE tags 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.tag_id;
        
        -- Refresh materialized view (async)
        PERFORM pg_notify('refresh_tag_stats', NEW.tag_id::text);
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement usage count
        UPDATE tags 
        SET usage_count = GREATEST(0, usage_count - 1) 
        WHERE id = OLD.tag_id;
        
        -- Refresh materialized view (async)
        PERFORM pg_notify('refresh_tag_stats', OLD.tag_id::text);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic tag usage counting
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON article_tags;
CREATE TRIGGER trigger_update_tag_usage
    AFTER INSERT OR DELETE ON article_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- =====================================
-- 4. BATCH OPERATIONS PROCEDURES
-- =====================================

-- Function for batch tag operations
CREATE OR REPLACE FUNCTION batch_tag_operation(
    operation_type TEXT,
    tag_ids UUID[],
    user_id_param UUID DEFAULT NULL,
    new_color TEXT DEFAULT NULL,
    merge_target_id UUID DEFAULT NULL
)
RETURNS TABLE(
    affected_count INTEGER,
    operation_result TEXT
) AS $$
DECLARE
    affected INTEGER := 0;
    result_msg TEXT;
BEGIN
    CASE operation_type
        WHEN 'delete' THEN
            -- Batch delete tags and their associations
            DELETE FROM article_tags WHERE tag_id = ANY(tag_ids);
            DELETE FROM tags WHERE id = ANY(tag_ids);
            GET DIAGNOSTICS affected = ROW_COUNT;
            result_msg := format('Deleted %s tags and their associations', affected);
            
        WHEN 'update_color' THEN
            -- Batch update tag colors
            UPDATE tags 
            SET color = new_color 
            WHERE id = ANY(tag_ids);
            GET DIAGNOSTICS affected = ROW_COUNT;
            result_msg := format('Updated color for %s tags', affected);
            
        WHEN 'merge' THEN
            -- Merge tags into target tag
            -- Update all article_tags references
            UPDATE article_tags 
            SET tag_id = merge_target_id
            WHERE tag_id = ANY(tag_ids) 
            AND tag_id != merge_target_id;
            
            -- Remove duplicate associations
            DELETE FROM article_tags a1 
            WHERE EXISTS (
                SELECT 1 FROM article_tags a2 
                WHERE a2.article_id = a1.article_id 
                AND a2.tag_id = a1.tag_id 
                AND a2.id > a1.id
            );
            
            -- Delete merged tags
            DELETE FROM tags 
            WHERE id = ANY(tag_ids) 
            AND id != merge_target_id;
            
            GET DIAGNOSTICS affected = ROW_COUNT;
            result_msg := format('Merged %s tags into target tag', affected);
            
        ELSE
            result_msg := 'Unknown operation type';
    END CASE;
    
    -- Refresh materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY tag_statistics;
    
    RETURN QUERY SELECT affected, result_msg;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 5. EFFICIENT TAG SEARCH FUNCTIONS
-- =====================================

-- Function for fast tag search with autocomplete
CREATE OR REPLACE FUNCTION search_tags(
    search_query TEXT,
    user_id_param UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    include_usage BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    color TEXT,
    usage_count BIGINT,
    user_count BIGINT,
    last_used TIMESTAMPTZ
) AS $$
BEGIN
    IF include_usage THEN
        RETURN QUERY
        SELECT 
            ts.id,
            ts.name,
            ts.color,
            ts.usage_count,
            ts.user_count,
            ts.last_used
        FROM tag_statistics ts
        WHERE 
            (search_query IS NULL OR ts.name ILIKE '%' || search_query || '%')
            AND (user_id_param IS NULL OR EXISTS (
                SELECT 1 FROM article_tags at 
                INNER JOIN articles a ON at.article_id = a.id 
                WHERE at.tag_id = ts.id AND a.user_id = user_id_param
            ))
        ORDER BY 
            ts.usage_count DESC, 
            similarity(ts.name, COALESCE(search_query, '')) DESC,
            ts.name
        LIMIT limit_count;
    ELSE
        RETURN QUERY
        SELECT 
            t.id,
            t.name,
            t.color,
            0::BIGINT as usage_count,
            0::BIGINT as user_count,
            NULL::TIMESTAMPTZ as last_used
        FROM tags t
        WHERE 
            (search_query IS NULL OR t.name ILIKE '%' || search_query || '%')
        ORDER BY 
            similarity(t.name, COALESCE(search_query, '')) DESC,
            t.name
        LIMIT limit_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 6. TAG FILTERING OPTIMIZATION FUNCTIONS
-- =====================================

-- Optimized function for multi-tag article filtering
CREATE OR REPLACE FUNCTION filter_articles_by_tags(
    user_id_param UUID,
    tag_ids UUID[],
    tag_operator TEXT DEFAULT 'OR', -- 'AND' or 'OR'
    reading_status_param TEXT DEFAULT NULL,
    is_favorite_param BOOLEAN DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    sort_by TEXT DEFAULT 'created_at',
    sort_order TEXT DEFAULT 'DESC',
    page_limit INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    excerpt TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    reading_status TEXT,
    is_favorite BOOLEAN,
    estimated_read_time INTEGER,
    tag_names TEXT[]
) AS $$
DECLARE
    base_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    order_clause TEXT;
BEGIN
    -- Build base query
    base_query := '
        SELECT DISTINCT 
            a.id,
            a.title,
            a.excerpt,
            a.created_at,
            a.updated_at,
            a.reading_status,
            a.is_favorite,
            a.estimated_read_time,
            ARRAY_AGG(DISTINCT t.name) as tag_names
        FROM articles a
        LEFT JOIN article_tags at ON a.id = at.article_id
        LEFT JOIN tags t ON at.tag_id = t.id
    ';
    
    -- Add user filter
    where_conditions := where_conditions || 'a.user_id = $1';
    
    -- Add tag filtering
    IF tag_ids IS NOT NULL AND array_length(tag_ids, 1) > 0 THEN
        IF tag_operator = 'AND' THEN
            -- All tags must be present
            where_conditions := where_conditions || format(
                'a.id IN (
                    SELECT article_id 
                    FROM article_tags 
                    WHERE tag_id = ANY($2) 
                    GROUP BY article_id 
                    HAVING COUNT(DISTINCT tag_id) = %s
                )', array_length(tag_ids, 1)
            );
        ELSE
            -- Any tag must be present (OR)
            where_conditions := where_conditions || 'at.tag_id = ANY($2)';
        END IF;
    END IF;
    
    -- Add additional filters
    IF reading_status_param IS NOT NULL THEN
        where_conditions := where_conditions || format('a.reading_status = %L', reading_status_param);
    END IF;
    
    IF is_favorite_param IS NOT NULL THEN
        where_conditions := where_conditions || format('a.is_favorite = %L', is_favorite_param);
    END IF;
    
    IF date_from IS NOT NULL THEN
        where_conditions := where_conditions || format('a.created_at >= %L', date_from);
    END IF;
    
    IF date_to IS NOT NULL THEN
        where_conditions := where_conditions || format('a.created_at <= %L', date_to);
    END IF;
    
    -- Combine WHERE conditions
    IF array_length(where_conditions, 1) > 0 THEN
        base_query := base_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    -- Add GROUP BY
    base_query := base_query || ' GROUP BY a.id, a.title, a.excerpt, a.created_at, a.updated_at, a.reading_status, a.is_favorite, a.estimated_read_time';
    
    -- Add ORDER BY
    order_clause := format(' ORDER BY a.%I %s', sort_by, sort_order);
    base_query := base_query || order_clause;
    
    -- Add LIMIT and OFFSET
    base_query := base_query || format(' LIMIT %s OFFSET %s', page_limit, page_offset);
    
    -- Execute dynamic query
    RETURN QUERY EXECUTE base_query USING user_id_param, tag_ids;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 7. PERFORMANCE MONITORING
-- =====================================

-- Table for tracking slow queries
CREATE TABLE IF NOT EXISTS query_performance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_type TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    parameters JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance log queries
CREATE INDEX IF NOT EXISTS idx_query_performance_type_time 
    ON query_performance_log(query_type, execution_time_ms DESC, created_at DESC);

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_query(
    query_type_param TEXT,
    execution_time_param INTEGER,
    parameters_param JSONB DEFAULT NULL,
    user_id_param UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Only log queries slower than 100ms
    IF execution_time_param > 100 THEN
        INSERT INTO query_performance_log (
            query_type,
            execution_time_ms,
            parameters,
            user_id
        ) VALUES (
            query_type_param,
            execution_time_param,
            parameters_param,
            user_id_param
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 8. MAINTENANCE FUNCTIONS
-- =====================================

-- Function to refresh tag statistics (to be called periodically)
CREATE OR REPLACE FUNCTION refresh_tag_statistics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY tag_statistics;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old performance logs
CREATE OR REPLACE FUNCTION cleanup_performance_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_performance_log 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- MIGRATION COMPLETION
-- =====================================

-- Ensure trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Initial population of tag statistics
REFRESH MATERIALIZED VIEW tag_statistics;

-- Update existing tag usage counts
UPDATE tags SET usage_count = (
    SELECT COUNT(*) 
    FROM article_tags 
    WHERE tag_id = tags.id
);

COMMENT ON TABLE tag_statistics IS 'Materialized view containing pre-computed tag usage statistics for performance';
COMMENT ON FUNCTION batch_tag_operation IS 'Performs batch operations on tags (delete, update_color, merge)';
COMMENT ON FUNCTION search_tags IS 'Fast tag search with autocomplete and usage statistics';
COMMENT ON FUNCTION filter_articles_by_tags IS 'Optimized multi-tag article filtering with pagination';
COMMENT ON FUNCTION log_slow_query IS 'Logs slow query performance for monitoring';