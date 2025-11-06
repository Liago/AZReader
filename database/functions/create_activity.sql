-- Function to create activity feed entries with intelligent grouping and aggregation
-- This function creates individual activity entries and manages aggregates for spam prevention

CREATE OR REPLACE FUNCTION create_activity(
    p_actor_id UUID,
    p_action_type TEXT,
    p_target_type TEXT,
    p_target_id UUID,
    p_metadata JSONB DEFAULT '{}',
    p_content_preview TEXT DEFAULT NULL,
    p_visibility TEXT DEFAULT 'public'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_activity_id UUID;
    v_group_key TEXT;
    v_aggregate_id UUID;
    v_existing_aggregate activity_aggregates;
    v_sample_actors UUID[];
    v_title TEXT;
    v_description TEXT;
    v_thumbnail_url TEXT;
    v_max_sample_actors INTEGER := 5;
    v_batch_window_minutes INTEGER := 60;
BEGIN
    -- Generate activity ID
    v_activity_id := uuid_generate_v4();
    
    -- Generate group key for aggregation
    -- Group by actor, action_type, target_type, and target_id within a time window
    v_group_key := format('%s_%s_%s_%s_%s', 
        p_actor_id::TEXT, 
        p_action_type, 
        p_target_type, 
        p_target_id::TEXT,
        EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'UTC'))::bigint / (v_batch_window_minutes * 60)
    );
    
    -- Insert activity record
    INSERT INTO activity_feed (
        id,
        actor_id,
        action_type,
        target_type,
        target_id,
        metadata,
        content_preview,
        visibility,
        group_key,
        created_at,
        updated_at
    ) VALUES (
        v_activity_id,
        p_actor_id,
        p_action_type,
        p_target_type,
        p_target_id,
        p_metadata,
        p_content_preview,
        p_visibility,
        v_group_key,
        NOW(),
        NOW()
    );
    
    -- Check for existing aggregate
    SELECT * INTO v_existing_aggregate
    FROM activity_aggregates
    WHERE group_key = v_group_key;
    
    -- Generate content for aggregate
    CASE p_action_type
        WHEN 'article_created' THEN
            v_title := COALESCE(p_content_preview, 'New article');
            v_description := format('Created a new article: %s', COALESCE(p_content_preview, 'Untitled'));
        WHEN 'article_liked' THEN
            v_title := COALESCE(p_content_preview, 'Article liked');
            v_description := format('Liked article: %s', COALESCE(p_content_preview, 'Article'));
        WHEN 'article_unliked' THEN
            v_title := COALESCE(p_content_preview, 'Article unliked');
            v_description := format('Unliked article: %s', COALESCE(p_content_preview, 'Article'));
        WHEN 'article_shared' THEN
            v_title := COALESCE(p_content_preview, 'Article shared');
            v_description := format('Shared article: %s', COALESCE(p_content_preview, 'Article'));
        WHEN 'comment_created' THEN
            v_title := 'New comment';
            v_description := format('Commented: %s', COALESCE(p_content_preview, 'Comment'));
        WHEN 'comment_liked' THEN
            v_title := 'Comment liked';
            v_description := format('Liked comment: %s', COALESCE(p_content_preview, 'Comment'));
        WHEN 'user_followed' THEN
            v_title := 'User followed';
            v_description := format('Started following %s', COALESCE(p_content_preview, 'user'));
        WHEN 'user_unfollowed' THEN
            v_title := 'User unfollowed';
            v_description := format('Stopped following %s', COALESCE(p_content_preview, 'user'));
        WHEN 'profile_updated' THEN
            v_title := 'Profile updated';
            v_description := format('Updated profile: %s', COALESCE(p_content_preview, 'changes made'));
        ELSE
            v_title := 'Activity';
            v_description := format('%s activity', p_action_type);
    END CASE;
    
    -- Get thumbnail URL from metadata if available
    v_thumbnail_url := p_metadata->>'thumbnail_url';
    
    IF v_existing_aggregate.id IS NOT NULL THEN
        -- Update existing aggregate
        
        -- Build new sample actors array (limit to v_max_sample_actors)
        v_sample_actors := v_existing_aggregate.sample_actors;
        IF NOT (p_actor_id = ANY(v_sample_actors)) THEN
            v_sample_actors := array_append(v_sample_actors, p_actor_id);
            -- Keep only the most recent actors
            IF array_length(v_sample_actors, 1) > v_max_sample_actors THEN
                v_sample_actors := v_sample_actors[1:v_max_sample_actors];
            END IF;
        END IF;
        
        UPDATE activity_aggregates SET
            count = count + 1,
            sample_actors = v_sample_actors,
            title = v_title,
            description = v_description,
            thumbnail_url = COALESCE(v_thumbnail_url, thumbnail_url),
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = v_existing_aggregate.id;
        
        v_aggregate_id := v_existing_aggregate.id;
    ELSE
        -- Create new aggregate
        v_aggregate_id := uuid_generate_v4();
        v_sample_actors := ARRAY[p_actor_id];
        
        INSERT INTO activity_aggregates (
            id,
            group_key,
            actor_id,
            action_type,
            target_type,
            target_id,
            count,
            sample_actors,
            title,
            description,
            thumbnail_url,
            first_activity_at,
            last_activity_at,
            created_at,
            updated_at
        ) VALUES (
            v_aggregate_id,
            v_group_key,
            p_actor_id,
            p_action_type,
            p_target_type,
            p_target_id,
            1,
            v_sample_actors,
            v_title,
            v_description,
            v_thumbnail_url,
            NOW(),
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN v_activity_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and re-raise
        RAISE NOTICE 'Error in create_activity: %', SQLERRM;
        RAISE;
END;
$$;

-- Function to get followed users' activities with enhanced filtering
CREATE OR REPLACE FUNCTION get_following_activities(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_action_types TEXT[] DEFAULT NULL,
    p_time_window_hours INTEGER DEFAULT 168, -- Default 7 days
    p_aggregated BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    actor_id UUID,
    action_type TEXT,
    target_type TEXT,
    target_id UUID,
    metadata JSONB,
    content_preview TEXT,
    visibility TEXT,
    group_key TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    -- Aggregate fields
    count INTEGER,
    sample_actors UUID[],
    title TEXT,
    description TEXT,
    thumbnail_url TEXT,
    first_activity_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    -- Actor info
    actor_email TEXT,
    actor_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_aggregated THEN
        RETURN QUERY
        SELECT 
            aa.id,
            aa.actor_id,
            aa.action_type,
            aa.target_type,
            aa.target_id,
            NULL::JSONB as metadata,
            NULL::TEXT as content_preview,
            'public'::TEXT as visibility,
            aa.group_key,
            aa.created_at,
            aa.updated_at,
            aa.count,
            aa.sample_actors,
            aa.title,
            aa.description,
            aa.thumbnail_url,
            aa.first_activity_at,
            aa.last_activity_at,
            u.email as actor_email,
            u.avatar_url as actor_avatar_url
        FROM activity_aggregates aa
        JOIN user_follows uf ON aa.actor_id = uf.following_id
        JOIN users u ON aa.actor_id = u.id
        WHERE uf.follower_id = p_user_id
        AND aa.last_activity_at >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
        AND (p_action_types IS NULL OR aa.action_type = ANY(p_action_types))
        ORDER BY aa.last_activity_at DESC
        LIMIT p_limit
        OFFSET p_offset;
    ELSE
        RETURN QUERY
        SELECT 
            af.id,
            af.actor_id,
            af.action_type,
            af.target_type,
            af.target_id,
            af.metadata,
            af.content_preview,
            af.visibility,
            af.group_key,
            af.created_at,
            af.updated_at,
            NULL::INTEGER as count,
            NULL::UUID[] as sample_actors,
            NULL::TEXT as title,
            NULL::TEXT as description,
            NULL::TEXT as thumbnail_url,
            NULL::TIMESTAMPTZ as first_activity_at,
            NULL::TIMESTAMPTZ as last_activity_at,
            u.email as actor_email,
            u.avatar_url as actor_avatar_url
        FROM activity_feed af
        JOIN user_follows uf ON af.actor_id = uf.following_id
        JOIN users u ON af.actor_id = u.id
        WHERE uf.follower_id = p_user_id
        AND af.created_at >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
        AND (p_action_types IS NULL OR af.action_type = ANY(p_action_types))
        AND (af.visibility = 'public' OR af.visibility = 'followers')
        ORDER BY af.created_at DESC
        LIMIT p_limit
        OFFSET p_offset;
    END IF;
END;
$$;

-- Function to clean up old activities (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_activities(
    p_days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete old individual activities
    DELETE FROM activity_feed
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Delete old aggregates
    DELETE FROM activity_aggregates
    WHERE last_activity_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = v_deleted_count + ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_activity(UUID, TEXT, TEXT, UUID, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_following_activities(UUID, INTEGER, INTEGER, TEXT[], INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_activities(INTEGER) TO authenticated;