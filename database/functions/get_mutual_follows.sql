-- Create function to get mutual follows between two users
-- This helps with recommendation algorithm to find users with common connections

CREATE OR REPLACE FUNCTION get_mutual_follows(user1_id UUID, user2_id UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        u.id as user_id,
        u.email,
        u.name
    FROM users u
    WHERE u.id IN (
        -- Users that user1 follows
        SELECT uf1.following_id 
        FROM user_follows uf1 
        WHERE uf1.follower_id = user1_id
        
        INTERSECT
        
        -- Users that user2 follows  
        SELECT uf2.following_id 
        FROM user_follows uf2 
        WHERE uf2.follower_id = user2_id
    )
    AND u.is_public = true
    ORDER BY u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_mutual_follows(UUID, UUID) TO authenticated;