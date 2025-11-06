-- AZReader Database Schema
-- Multi-Tag Query Optimization Extension
-- Advanced functions for high-performance tag filtering and statistics

-- =====================================
-- 1. USER TAG STATISTICS FUNCTION
-- =====================================

CREATE OR REPLACE FUNCTION get_user_tag_statistics(
    user_id_param UUID,
    sort_by_param TEXT DEFAULT 'usage_count',
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    color TEXT,
    usage_count BIGINT,
    user_count BIGINT,
    last_used TIMESTAMPTZ,
    weekly_usage BIGINT,
    monthly_usage BIGINT,
    favorite_usage BIGINT
) AS $$
BEGIN
    CASE sort_by_param
        WHEN 'name' THEN
            RETURN QUERY
            SELECT 
                ts.id,
                ts.name,
                ts.color,
                COALESCE(user_stats.user_usage_count, 0) as usage_count,
                ts.user_count,
                user_stats.user_last_used as last_used,
                COALESCE(user_stats.user_weekly_usage, 0) as weekly_usage,
                COALESCE(user_stats.user_monthly_usage, 0) as monthly_usage,
                COALESCE(user_stats.user_favorite_usage, 0) as favorite_usage
            FROM tag_statistics ts
            LEFT JOIN (
                SELECT 
                    t.id,
                    COUNT(at.article_id) as user_usage_count,
                    MAX(a.created_at) as user_last_used,
                    COUNT(at.article_id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '7 days') as user_weekly_usage,
                    COUNT(at.article_id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '30 days') as user_monthly_usage,
                    COUNT(at.article_id) FILTER (WHERE a.is_favorite = true) as user_favorite_usage
                FROM tags t
                LEFT JOIN article_tags at ON t.id = at.tag_id
                LEFT JOIN articles a ON at.article_id = a.id AND a.user_id = user_id_param
                GROUP BY t.id
            ) user_stats ON ts.id = user_stats.id
            WHERE COALESCE(user_stats.user_usage_count, 0) > 0
            ORDER BY ts.name
            LIMIT limit_count;
            
        WHEN 'last_used' THEN
            RETURN QUERY
            SELECT 
                ts.id,
                ts.name,
                ts.color,
                COALESCE(user_stats.user_usage_count, 0) as usage_count,
                ts.user_count,
                user_stats.user_last_used as last_used,
                COALESCE(user_stats.user_weekly_usage, 0) as weekly_usage,
                COALESCE(user_stats.user_monthly_usage, 0) as monthly_usage,
                COALESCE(user_stats.user_favorite_usage, 0) as favorite_usage
            FROM tag_statistics ts
            LEFT JOIN (
                SELECT 
                    t.id,
                    COUNT(at.article_id) as user_usage_count,
                    MAX(a.created_at) as user_last_used,
                    COUNT(at.article_id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '7 days') as user_weekly_usage,
                    COUNT(at.article_id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '30 days') as user_monthly_usage,
                    COUNT(at.article_id) FILTER (WHERE a.is_favorite = true) as user_favorite_usage
                FROM tags t
                LEFT JOIN article_tags at ON t.id = at.tag_id
                LEFT JOIN articles a ON at.article_id = a.id AND a.user_id = user_id_param
                GROUP BY t.id
            ) user_stats ON ts.id = user_stats.id
            WHERE COALESCE(user_stats.user_usage_count, 0) > 0
            ORDER BY user_stats.user_last_used DESC NULLS LAST, COALESCE(user_stats.user_usage_count, 0) DESC
            LIMIT limit_count;
            
        ELSE -- 'usage_count'
            RETURN QUERY
            SELECT 
                ts.id,
                ts.name,
                ts.color,
                COALESCE(user_stats.user_usage_count, 0) as usage_count,
                ts.user_count,
                user_stats.user_last_used as last_used,
                COALESCE(user_stats.user_weekly_usage, 0) as weekly_usage,
                COALESCE(user_stats.user_monthly_usage, 0) as monthly_usage,
                COALESCE(user_stats.user_favorite_usage, 0) as user_favorite_usage
            FROM tag_statistics ts
            LEFT JOIN (
                SELECT 
                    t.id,
                    COUNT(at.article_id) as user_usage_count,
                    MAX(a.created_at) as user_last_used,
                    COUNT(at.article_id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '7 days') as user_weekly_usage,
                    COUNT(at.article_id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '30 days') as user_monthly_usage,
                    COUNT(at.article_id) FILTER (WHERE a.is_favorite = true) as user_favorite_usage
                FROM tags t
                LEFT JOIN article_tags at ON t.id = at.tag_id
                LEFT JOIN articles a ON at.article_id = a.id AND a.user_id = user_id_param
                GROUP BY t.id
            ) user_stats ON ts.id = user_stats.id
            WHERE COALESCE(user_stats.user_usage_count, 0) > 0
            ORDER BY COALESCE(user_stats.user_usage_count, 0) DESC, ts.name
            LIMIT limit_count;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 2. ENHANCED ARTICLE FILTERING WITH OPTIMIZATIONS
-- =====================================

-- Drop and recreate the function with better performance optimizations
DROP FUNCTION IF EXISTS filter_articles_by_tags(UUID, UUID[], TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION filter_articles_by_tags(
    user_id_param UUID,
    tag_ids UUID[] DEFAULT NULL,
    tag_operator TEXT DEFAULT 'OR',
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
    url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    reading_status TEXT,
    is_favorite BOOLEAN,
    estimated_read_time INTEGER,
    tag_names TEXT[],
    tag_ids UUID[],
    like_count INTEGER,
    comment_count INTEGER
) AS $$
DECLARE
    tag_filter_clause TEXT := '';
    base_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    final_query TEXT;
BEGIN
    -- Build optimized base query
    base_query := '
        SELECT 
            a.id,
            a.title,
            a.excerpt,
            a.url,
            a.created_at,
            a.updated_at,
            a.reading_status,
            a.is_favorite,
            a.estimated_read_time,
            COALESCE(tag_agg.tag_names, ARRAY[]::TEXT[]) as tag_names,
            COALESCE(tag_agg.tag_ids, ARRAY[]::UUID[]) as tag_ids,
            a.like_count,
            a.comment_count
        FROM articles a
        LEFT JOIN (
            SELECT 
                at.article_id,
                ARRAY_AGG(t.name ORDER BY t.name) as tag_names,
                ARRAY_AGG(t.id ORDER BY t.name) as tag_ids
            FROM article_tags at
            INNER JOIN tags t ON at.tag_id = t.id
            GROUP BY at.article_id
        ) tag_agg ON a.id = tag_agg.article_id
    ';
    
    -- Add user filter (always required)
    where_conditions := where_conditions || 'a.user_id = $1';
    
    -- Handle tag filtering with optimizations
    IF tag_ids IS NOT NULL AND array_length(tag_ids, 1) > 0 THEN
        IF tag_operator = 'AND' THEN
            -- For AND operation: article must have ALL specified tags
            base_query := base_query || '
                INNER JOIN (
                    SELECT article_id 
                    FROM article_tags 
                    WHERE tag_id = ANY($2)
                    GROUP BY article_id 
                    HAVING COUNT(DISTINCT tag_id) = ' || array_length(tag_ids, 1) || '
                ) tag_filter ON a.id = tag_filter.article_id
            ';
        ELSE
            -- For OR operation: article must have ANY of the specified tags
            base_query := base_query || '
                INNER JOIN (
                    SELECT DISTINCT article_id 
                    FROM article_tags 
                    WHERE tag_id = ANY($2)
                ) tag_filter ON a.id = tag_filter.article_id
            ';
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
    
    -- Add ORDER BY with proper indexing considerations
    CASE sort_by
        WHEN 'title' THEN
            base_query := base_query || ' ORDER BY a.title ' || sort_order;
        WHEN 'updated_at' THEN
            base_query := base_query || ' ORDER BY a.updated_at ' || sort_order;
        WHEN 'estimated_read_time' THEN
            base_query := base_query || ' ORDER BY a.estimated_read_time ' || sort_order || ' NULLS LAST';
        WHEN 'like_count' THEN
            base_query := base_query || ' ORDER BY a.like_count ' || sort_order;
        ELSE -- 'created_at'
            base_query := base_query || ' ORDER BY a.created_at ' || sort_order;
    END CASE;
    
    -- Add LIMIT and OFFSET
    base_query := base_query || format(' LIMIT %s OFFSET %s', page_limit, page_offset);
    
    -- Execute the dynamic query
    IF tag_ids IS NOT NULL AND array_length(tag_ids, 1) > 0 THEN
        RETURN QUERY EXECUTE base_query USING user_id_param, tag_ids;
    ELSE
        RETURN QUERY EXECUTE base_query USING user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 3. ARTICLE COUNT FUNCTION FOR PAGINATION
-- =====================================

CREATE OR REPLACE FUNCTION count_filtered_articles(
    user_id_param UUID,
    tag_ids UUID[] DEFAULT NULL,
    tag_operator TEXT DEFAULT 'OR',
    reading_status_param TEXT DEFAULT NULL,
    is_favorite_param BOOLEAN DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    base_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    result_count INTEGER;
BEGIN
    base_query := 'SELECT COUNT(DISTINCT a.id) FROM articles a';
    
    -- Add user filter
    where_conditions := where_conditions || 'a.user_id = $1';
    
    -- Handle tag filtering
    IF tag_ids IS NOT NULL AND array_length(tag_ids, 1) > 0 THEN
        IF tag_operator = 'AND' THEN
            base_query := base_query || '
                INNER JOIN (
                    SELECT article_id 
                    FROM article_tags 
                    WHERE tag_id = ANY($2)
                    GROUP BY article_id 
                    HAVING COUNT(DISTINCT tag_id) = ' || array_length(tag_ids, 1) || '
                ) tag_filter ON a.id = tag_filter.article_id
            ';
        ELSE
            base_query := base_query || '
                INNER JOIN (
                    SELECT DISTINCT article_id 
                    FROM article_tags 
                    WHERE tag_id = ANY($2)
                ) tag_filter ON a.id = tag_filter.article_id
            ';
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
    
    -- Add WHERE clause
    IF array_length(where_conditions, 1) > 0 THEN
        base_query := base_query || ' WHERE ' || array_to_string(where_conditions, ' AND ');
    END IF;
    
    -- Execute count query
    IF tag_ids IS NOT NULL AND array_length(tag_ids, 1) > 0 THEN
        EXECUTE base_query INTO result_count USING user_id_param, tag_ids;
    ELSE
        EXECUTE base_query INTO result_count USING user_id_param;
    END IF;
    
    RETURN COALESCE(result_count, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 4. TAG AUTOCOMPLETE OPTIMIZATION
-- =====================================

-- Enhanced search_tags function with better performance
CREATE OR REPLACE FUNCTION search_tags(
    search_query TEXT DEFAULT NULL,
    user_id_param UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    include_usage BOOLEAN DEFAULT true,
    min_usage INTEGER DEFAULT 0
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
            CASE 
                WHEN user_id_param IS NOT NULL THEN COALESCE(user_stats.user_usage_count, 0)
                ELSE ts.usage_count
            END as usage_count,
            ts.user_count,
            CASE 
                WHEN user_id_param IS NOT NULL THEN user_stats.user_last_used
                ELSE ts.last_used
            END as last_used
        FROM tag_statistics ts
        LEFT JOIN (
            SELECT 
                t.id,
                COUNT(at.article_id) as user_usage_count,
                MAX(a.created_at) as user_last_used
            FROM tags t
            LEFT JOIN article_tags at ON t.id = at.tag_id
            LEFT JOIN articles a ON at.article_id = a.id AND a.user_id = user_id_param
            WHERE user_id_param IS NOT NULL
            GROUP BY t.id
        ) user_stats ON ts.id = user_stats.id AND user_id_param IS NOT NULL
        WHERE 
            (search_query IS NULL OR ts.name ILIKE '%' || search_query || '%')
            AND (
                CASE 
                    WHEN user_id_param IS NOT NULL THEN COALESCE(user_stats.user_usage_count, 0)
                    ELSE ts.usage_count
                END >= min_usage
            )
            AND (
                user_id_param IS NULL OR 
                user_stats.user_usage_count > 0 OR 
                ts.created_by = user_id_param
            )
        ORDER BY 
            CASE 
                WHEN user_id_param IS NOT NULL THEN COALESCE(user_stats.user_usage_count, 0)
                ELSE ts.usage_count
            END DESC,
            CASE 
                WHEN search_query IS NOT NULL THEN similarity(ts.name, search_query)
                ELSE 0
            END DESC,
            ts.name
        LIMIT limit_count;
    ELSE
        -- Fast lookup without usage statistics
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
            AND (user_id_param IS NULL OR t.created_by = user_id_param)
        ORDER BY 
            CASE 
                WHEN search_query IS NOT NULL THEN similarity(t.name, search_query)
                ELSE 0
            END DESC,
            t.name
        LIMIT limit_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 5. PERFORMANCE MONITORING ENHANCEMENTS
-- =====================================

-- Enhanced slow query logging with more context
CREATE OR REPLACE FUNCTION log_slow_query(
    query_type_param TEXT,
    execution_time_param INTEGER,
    parameters_param JSONB DEFAULT NULL,
    user_id_param UUID DEFAULT NULL,
    query_hash TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Log queries slower than 100ms or specific query types
    IF execution_time_param > 100 OR query_type_param IN ('filter_articles_by_tags', 'search_tags') THEN
        INSERT INTO query_performance_log (
            query_type,
            execution_time_ms,
            parameters,
            user_id,
            created_at,
            query_hash
        ) VALUES (
            query_type_param,
            execution_time_param,
            COALESCE(parameters_param, '{}'::jsonb),
            user_id_param,
            NOW(),
            query_hash
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add query_hash column to performance log if not exists
ALTER TABLE query_performance_log 
ADD COLUMN IF NOT EXISTS query_hash TEXT;

-- Index for query hash lookups
CREATE INDEX IF NOT EXISTS idx_query_performance_hash 
    ON query_performance_log(query_hash, created_at DESC);

-- =====================================
-- 6. TAG RELATIONSHIP ANALYSIS
-- =====================================

-- Function to find related tags (tags that appear together frequently)
CREATE OR REPLACE FUNCTION get_related_tags(
    tag_id_param UUID,
    user_id_param UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 10,
    min_co_occurrence INTEGER DEFAULT 2
)
RETURNS TABLE(
    related_tag_id UUID,
    related_tag_name TEXT,
    related_tag_color TEXT,
    co_occurrence_count BIGINT,
    jaccard_similarity DECIMAL(5,4)
) AS $$
BEGIN
    RETURN QUERY
    WITH tag_pairs AS (
        SELECT 
            at1.tag_id as tag1_id,
            at2.tag_id as tag2_id,
            COUNT(*) as co_occurrence
        FROM article_tags at1
        INNER JOIN article_tags at2 ON at1.article_id = at2.article_id
        INNER JOIN articles a ON at1.article_id = a.id
        WHERE 
            at1.tag_id != at2.tag_id
            AND at1.tag_id = tag_id_param
            AND (user_id_param IS NULL OR a.user_id = user_id_param)
        GROUP BY at1.tag_id, at2.tag_id
        HAVING COUNT(*) >= min_co_occurrence
    ),
    tag_totals AS (
        SELECT 
            t.id,
            COUNT(DISTINCT at.article_id) as total_usage
        FROM tags t
        LEFT JOIN article_tags at ON t.id = at.tag_id
        LEFT JOIN articles a ON at.article_id = a.id
        WHERE user_id_param IS NULL OR a.user_id = user_id_param
        GROUP BY t.id
    )
    SELECT 
        tp.tag2_id,
        t.name,
        t.color,
        tp.co_occurrence,
        ROUND(
            tp.co_occurrence::DECIMAL / 
            (tt1.total_usage + tt2.total_usage - tp.co_occurrence)::DECIMAL,
            4
        ) as jaccard_similarity
    FROM tag_pairs tp
    INNER JOIN tags t ON tp.tag2_id = t.id
    INNER JOIN tag_totals tt1 ON tp.tag1_id = tt1.id
    INNER JOIN tag_totals tt2 ON tp.tag2_id = tt2.id
    ORDER BY jaccard_similarity DESC, tp.co_occurrence DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- COMMENTS AND DOCUMENTATION
-- =====================================

COMMENT ON FUNCTION get_user_tag_statistics IS 'Returns personalized tag statistics for a specific user with multiple sorting options';
COMMENT ON FUNCTION filter_articles_by_tags IS 'High-performance article filtering with optimized tag operations and pagination';
COMMENT ON FUNCTION count_filtered_articles IS 'Efficient count function for filtered articles to support proper pagination';
COMMENT ON FUNCTION search_tags IS 'Enhanced tag search with fuzzy matching and user-specific usage statistics';
COMMENT ON FUNCTION get_related_tags IS 'Analyzes tag relationships and co-occurrence patterns for recommendation features';
COMMENT ON FUNCTION log_slow_query IS 'Enhanced performance monitoring with query hashing for pattern analysis';