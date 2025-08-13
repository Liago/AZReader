-- Function to get personalized feed with intelligent ranking for followed users
-- This function optimizes the query for retrieving articles from users that the current user follows
-- and applies intelligent ranking based on multiple factors

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
    -- Author info
    author_name TEXT,
    author_email TEXT,
    author_avatar_url TEXT,
    -- Follow info
    follow_date TIMESTAMPTZ,
    -- Ranking info
    recommendation_score DECIMAL,
    freshness_score DECIMAL,
    interaction_score DECIMAL,
    content_score DECIMAL,
    engagement_score DECIMAL,
    -- Read status
    is_read BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    max_days_for_freshness INTEGER := 30; -- Articles older than 30 days get minimal freshness score
    max_interactions INTEGER := 20; -- Cap interactions for normalization
    max_engagement INTEGER := 100; -- Cap total engagement for normalization
BEGIN
    RETURN QUERY
    WITH followed_users AS (
        -- Get users that the current user follows
        SELECT 
            uf.following_id,
            uf.created_at as follow_date
        FROM user_follows uf
        WHERE uf.follower_id = p_user_id
    ),
    user_preferences AS (
        -- Get user's tag preferences based on their article history
        SELECT 
            unnest(a.tags) as tag,
            count(*) as tag_count
        FROM articles a
        WHERE a.user_id = p_user_id
        AND array_length(a.tags, 1) > 0
        GROUP BY unnest(a.tags)
    ),
    author_interactions AS (
        -- Count user's interactions with each author
        SELECT 
            a.user_id as author_id,
            count(*) as interaction_count
        FROM articles a
        WHERE a.user_id = p_user_id
        GROUP BY a.user_id
        
        UNION ALL
        
        SELECT 
            pl.user_id as author_id,
            count(*) as interaction_count
        FROM likes l
        JOIN articles a ON l.article_id = a.id
        JOIN articles pl ON pl.id = a.id
        WHERE l.user_id = p_user_id
        GROUP BY pl.user_id
        
        UNION ALL
        
        SELECT 
            a.user_id as author_id,
            count(*) as interaction_count
        FROM comments c
        JOIN articles a ON c.article_id = a.id
        WHERE c.user_id = p_user_id
        GROUP BY a.user_id
    ),
    interaction_counts AS (
        SELECT 
            author_id,
            sum(interaction_count) as total_interactions
        FROM author_interactions
        GROUP BY author_id
    ),
    personalized_articles AS (
        SELECT 
            a.*,
            u.name as author_name,
            u.email as author_email,
            u.avatar_url as author_avatar_url,
            fu.follow_date,
            -- Calculate freshness score (exponential decay)
            GREATEST(0, exp(-EXTRACT(days FROM (now() - a.created_at)) / 7.0)) as fresh_score,
            -- Calculate interaction score (normalized)
            COALESCE(ic.total_interactions::DECIMAL / max_interactions, 0) as interact_score,
            -- Calculate content preference score based on tag matches
            CASE 
                WHEN array_length(a.tags, 1) > 0 THEN
                    (
                        SELECT COALESCE(sum(up.tag_count), 0)::DECIMAL / 
                               (SELECT COALESCE(max(tag_count), 1) FROM user_preferences)
                        FROM user_preferences up
                        WHERE up.tag = ANY(a.tags)
                    ) / GREATEST(array_length(a.tags, 1), 1)
                ELSE 0
            END as content_pref_score,
            -- Calculate engagement score (likes + comments normalized)
            LEAST(1, (COALESCE(a.like_count, 0) + COALESCE(a.comment_count, 0))::DECIMAL / max_engagement) as engage_score,
            -- Check if article has been read
            CASE WHEN rl.article_id IS NOT NULL THEN true ELSE false END as is_read
        FROM articles a
        JOIN followed_users fu ON a.user_id = fu.following_id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN interaction_counts ic ON ic.author_id = a.user_id
        LEFT JOIN reading_log rl ON rl.article_id = a.id AND rl.user_id = p_user_id
        WHERE a.is_public = true
        AND a.created_at >= now() - INTERVAL '90 days' -- Only consider articles from last 90 days
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
        -- Calculate final weighted recommendation score
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
        -- Primary sort: recommendation score
        (
            pa.fresh_score * p_freshness_weight +
            pa.interact_score * p_interaction_weight +
            pa.content_pref_score * p_content_weight +
            pa.engage_score * p_engagement_weight
        ) DESC,
        -- Secondary sort: creation date for ties
        pa.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get personalized feed statistics
CREATE OR REPLACE FUNCTION get_personalized_feed_stats(p_user_id UUID)
RETURNS TABLE (
    total_followed_users INTEGER,
    total_available_articles INTEGER,
    articles_last_week INTEGER,
    articles_last_month INTEGER,
    average_articles_per_author DECIMAL,
    most_active_author_id UUID,
    most_active_author_name TEXT,
    most_active_author_count INTEGER,
    unread_count INTEGER,
    read_percentage DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH followed_users AS (
        SELECT following_id
        FROM user_follows
        WHERE follower_id = p_user_id
    ),
    followed_articles AS (
        SELECT 
            a.*,
            u.name as author_name,
            CASE WHEN rl.article_id IS NOT NULL THEN true ELSE false END as is_read
        FROM articles a
        JOIN followed_users fu ON a.user_id = fu.following_id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN reading_log rl ON rl.article_id = a.id AND rl.user_id = p_user_id
        WHERE a.is_public = true
    ),
    author_stats AS (
        SELECT 
            user_id,
            author_name,
            count(*) as article_count
        FROM followed_articles
        GROUP BY user_id, author_name
        ORDER BY count(*) DESC
        LIMIT 1
    )
    SELECT 
        (SELECT count(*)::INTEGER FROM followed_users),
        (SELECT count(*)::INTEGER FROM followed_articles),
        (SELECT count(*)::INTEGER FROM followed_articles WHERE created_at >= now() - INTERVAL '1 week'),
        (SELECT count(*)::INTEGER FROM followed_articles WHERE created_at >= now() - INTERVAL '1 month'),
        (SELECT CASE WHEN count(DISTINCT user_id) = 0 THEN 0 ELSE count(*)::DECIMAL / count(DISTINCT user_id) END FROM followed_articles),
        (SELECT user_id FROM author_stats LIMIT 1),
        (SELECT author_name FROM author_stats LIMIT 1),
        (SELECT article_count::INTEGER FROM author_stats LIMIT 1),
        (SELECT count(*)::INTEGER FROM followed_articles WHERE is_read = false),
        (SELECT 
            CASE WHEN count(*) = 0 THEN 0 
            ELSE (count(*) FILTER (WHERE is_read = true))::DECIMAL / count(*) * 100 
            END 
         FROM followed_articles);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_personalized_feed(UUID, INTEGER, INTEGER, DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_personalized_feed_stats(UUID) TO authenticated;