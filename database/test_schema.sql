-- AZReader Database Schema Testing and Validation

-- =====================================================
-- SCHEMA VALIDATION QUERIES
-- =====================================================

-- Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'articles', 'comments', 'likes', 'reading_log', 'user_follows', 'tags', 'article_tags', 'user_preferences') 
        THEN '✓ Required' 
        ELSE '? Additional' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled on all tables
SELECT 
    tablename, 
    CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'articles', 'comments', 'likes', 'reading_log', 'user_follows', 'tags', 'article_tags', 'user_preferences')
ORDER BY tablename;

-- Check indexes exist
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check triggers exist
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('update_updated_at_column', 'update_article_like_count', 'update_article_comment_count', 'update_tag_usage_count', 'create_user_preferences', 'sync_article_tags', 'extract_domain', 'set_article_domain', 'calculate_reading_time', 'set_reading_time', 'get_user_feed')
ORDER BY routine_name;

-- =====================================================
-- TEST DATA INSERTION (for testing purposes)
-- =====================================================

-- NOTE: These are example test queries. 
-- Run only in a test environment, not production!

/*
-- Test user creation (replace with actual auth user ID)
INSERT INTO users (id, email, name, is_public) 
VALUES (
    auth.uid(), -- This will use the current authenticated user
    'test@example.com', 
    'Test User',
    true
);

-- Test article insertion
INSERT INTO articles (user_id, url, title, content, excerpt, tags, is_public) 
VALUES (
    auth.uid(),
    'https://example.com/test-article',
    'Test Article Title',
    'This is a long test content for the article. It contains multiple sentences to test the reading time calculation. The content should be meaningful enough to test various features of the application.',
    'This is a test excerpt that provides a brief summary of the article content.',
    ARRAY['tech', 'testing', 'database'],
    true
);

-- Test comment insertion
INSERT INTO comments (article_id, user_id, content)
SELECT id, auth.uid(), 'This is a test comment on the article'
FROM articles 
WHERE user_id = auth.uid() 
LIMIT 1;

-- Test like insertion
INSERT INTO likes (article_id, user_id)
SELECT id, auth.uid()
FROM articles 
WHERE user_id = auth.uid() 
LIMIT 1;

-- Test reading log insertion
INSERT INTO reading_log (user_id, article_id, duration_seconds, progress_percentage)
SELECT auth.uid(), id, 300, 75
FROM articles 
WHERE user_id = auth.uid() 
LIMIT 1;
*/

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

-- Check automatic triggers work (counts should match)
SELECT 
    a.title,
    a.like_count as article_like_count,
    (SELECT COUNT(*) FROM likes WHERE article_id = a.id) as actual_likes,
    a.comment_count as article_comment_count,
    (SELECT COUNT(*) FROM comments WHERE article_id = a.id) as actual_comments
FROM articles a
ORDER BY a.created_at DESC
LIMIT 5;

-- Check tag synchronization works
SELECT 
    a.title,
    a.tags as article_tags_array,
    array_agg(t.name) as normalized_tags
FROM articles a
LEFT JOIN article_tags at ON a.id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.id
GROUP BY a.id, a.title, a.tags
ORDER BY a.created_at DESC
LIMIT 5;

-- Check domain extraction works
SELECT 
    url,
    domain,
    extract_domain(url) as calculated_domain
FROM articles
ORDER BY created_at DESC
LIMIT 5;

-- Check reading time calculation
SELECT 
    title,
    estimated_read_time,
    calculate_reading_time(content) as calculated_time,
    length(content) as content_length
FROM articles
WHERE content IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Check user preferences auto-creation
SELECT 
    u.name,
    u.created_at as user_created,
    up.theme_mode,
    up.reading_font_size,
    up.created_at as preferences_created
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
ORDER BY u.created_at DESC
LIMIT 5;

-- =====================================================
-- PERFORMANCE TEST QUERIES
-- =====================================================

-- Test full-text search performance
EXPLAIN ANALYZE
SELECT title, excerpt, created_at
FROM articles
WHERE to_tsvector('english', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(excerpt, '')) 
      @@ plainto_tsquery('english', 'test search terms')
ORDER BY created_at DESC
LIMIT 20;

-- Test tag search performance
EXPLAIN ANALYZE
SELECT title, tags, created_at
FROM articles
WHERE tags && ARRAY['tech', 'programming']
ORDER BY created_at DESC
LIMIT 20;

-- Test user feed query performance
EXPLAIN ANALYZE
SELECT * FROM get_user_feed(auth.uid(), 20, 0);

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- =====================================================
-- SECURITY VALIDATION
-- =====================================================

-- These queries should be run with different authenticated users
-- to verify RLS policies work correctly

/*
-- As user A: Should see only own articles + public articles
SELECT COUNT(*) as visible_articles FROM articles;

-- As user A: Should only be able to insert own articles
INSERT INTO articles (user_id, url, title) 
VALUES (auth.uid(), 'https://test.com', 'My Article'); -- Should work

-- As user A: Should NOT be able to insert articles for other users
INSERT INTO articles (user_id, url, title) 
VALUES ('other-user-id', 'https://test.com', 'Other Article'); -- Should fail

-- As user A: Should be able to comment on public articles
INSERT INTO comments (article_id, user_id, content)
SELECT id, auth.uid(), 'Public comment'
FROM articles 
WHERE is_public = true 
AND user_id != auth.uid()
LIMIT 1; -- Should work

-- As user A: Should NOT be able to comment on private articles from others
INSERT INTO comments (article_id, user_id, content)
SELECT id, auth.uid(), 'Private comment'
FROM articles 
WHERE is_public = false 
AND user_id != auth.uid()
LIMIT 1; -- Should fail
*/