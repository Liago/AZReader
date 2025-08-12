-- AZReader Moderation System Database Schema
-- Run these commands in your Supabase SQL editor to add moderation tables

-- ===============================================
-- 1. CONTENT REPORTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What is being reported
  content_type TEXT NOT NULL CHECK (content_type IN ('comment', 'article', 'user')),
  content_id UUID NOT NULL,
  
  -- Who reported it
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report details
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 'harassment', 'hate_speech', 'violence', 
    'inappropriate_content', 'misinformation', 'copyright', 'other'
  )),
  description TEXT,
  
  -- Report status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  
  -- Moderation details
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reports from same user
  UNIQUE(content_type, content_id, reporter_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);

-- ===============================================
-- 2. USER FLAGS TABLE  
-- ===============================================
CREATE TABLE IF NOT EXISTS user_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User being flagged
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Who flagged them
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Flag details
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'flagged', 'suspended', 'banned')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Expiration (for temporary suspensions)
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent self-flagging
  CHECK (user_id != flagged_by)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_flags_user_id ON user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_status ON user_flags(status);
CREATE INDEX IF NOT EXISTS idx_user_flags_severity ON user_flags(severity);
CREATE INDEX IF NOT EXISTS idx_user_flags_expires_at ON user_flags(expires_at) WHERE expires_at IS NOT NULL;

-- ===============================================
-- 3. MODERATION LOGS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What action was taken
  action TEXT NOT NULL CHECK (action IN (
    'warn', 'hide_comment', 'flag_user', 'suspend_user', 'ban_user', 
    'dismiss', 'report_submitted'
  )),
  
  -- What was acted upon
  target_type TEXT NOT NULL CHECK (target_type IN ('comment', 'article', 'user')),
  target_id UUID NOT NULL,
  
  -- Action details
  reason TEXT,
  details JSONB, -- Store additional metadata like duration, severity, etc.
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator ON moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON moderation_logs(action);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON moderation_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);

-- ===============================================
-- 4. SOFT DELETE SUPPORT FOR EXISTING TABLES
-- ===============================================

-- Add deleted_at column to comments table if it doesn't exist
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_at column to articles table if it doesn't exist
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ===============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on moderation tables
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Content Reports Policies
CREATE POLICY "Users can report content" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON content_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (email LIKE '%admin%' OR email LIKE '%moderator%')
    )
  );

CREATE POLICY "Admins can update reports" ON content_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (email LIKE '%admin%' OR email LIKE '%moderator%')
    )
  );

-- User Flags Policies
CREATE POLICY "Admins can manage user flags" ON user_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (email LIKE '%admin%' OR email LIKE '%moderator%')
    )
  );

-- Moderation Logs Policies
CREATE POLICY "Admins can view moderation logs" ON moderation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (email LIKE '%admin%' OR email LIKE '%moderator%')
    )
  );

CREATE POLICY "System can insert moderation logs" ON moderation_logs
  FOR INSERT WITH CHECK (true);

-- ===============================================
-- 6. FUNCTIONS FOR MODERATION AUTOMATION
-- ===============================================

-- Function to check if user is suspended or banned
CREATE OR REPLACE FUNCTION is_user_restricted(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_flags
    WHERE user_id = user_uuid 
    AND status IN ('suspended', 'banned')
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Function to clean up expired flags
CREATE OR REPLACE FUNCTION cleanup_expired_flags()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE user_flags
  SET status = 'active',
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND status = 'suspended';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$;

-- ===============================================
-- 7. TRIGGERS FOR AUTOMATIC MAINTENANCE
-- ===============================================

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_content_reports_updated_at ON content_reports;
CREATE TRIGGER update_content_reports_updated_at
  BEFORE UPDATE ON content_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_flags_updated_at ON user_flags;
CREATE TRIGGER update_user_flags_updated_at
  BEFORE UPDATE ON user_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 8. PERIODIC CLEANUP JOB
-- ===============================================

-- Note: You may want to set up a periodic job (cron or similar) to run:
-- SELECT cleanup_expired_flags();

-- ===============================================
-- 9. SAMPLE DATA FOR TESTING (Optional)
-- ===============================================

-- Uncomment the following to add some test admin users
-- (Replace with actual admin emails)

/*
-- Make specific users admins by updating their email
UPDATE users SET email = 'admin@azreader.com' 
WHERE email = 'your-admin-email@example.com';

UPDATE users SET email = 'moderator@azreader.com' 
WHERE email = 'your-moderator-email@example.com';
*/

-- ===============================================
-- 10. REAL-TIME SUBSCRIPTIONS
-- ===============================================

-- Enable real-time for moderation tables (if needed)
-- ALTER PUBLICATION supabase_realtime ADD TABLE content_reports;
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_flags;
-- ALTER PUBLICATION supabase_realtime ADD TABLE moderation_logs;

-- Note: Be careful with real-time on moderation tables as they may contain sensitive data

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Check if all tables were created successfully
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename IN ('content_reports', 'user_flags', 'moderation_logs')
  AND schemaname = 'public';

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('content_reports', 'user_flags', 'moderation_logs')
  AND schemaname = 'public';

-- Display table sizes (should be 0 for new installation)
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN ('content_reports', 'user_flags', 'moderation_logs')
  AND schemaname = 'public';