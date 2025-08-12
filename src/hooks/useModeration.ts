import { useState, useCallback } from 'react';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useCustomToast } from '@hooks/useIonToast';

// Types for moderation system
export type ReportReason = 
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'inappropriate_content'
  | 'misinformation'
  | 'copyright'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type UserStatus = 'active' | 'flagged' | 'suspended' | 'banned';
export type ModerationAction = 'warn' | 'hide_comment' | 'flag_user' | 'suspend_user' | 'ban_user' | 'dismiss';

export interface ContentReport {
  id: string;
  content_type: 'comment' | 'article' | 'user';
  content_id: string;
  reporter_id: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  reporter_email?: string;
  content_preview?: string;
  moderator_email?: string;
}

export interface UserFlag {
  id: string;
  user_id: string;
  flagged_by: string;
  reason: string;
  status: UserStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  expires_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  user_email?: string;
  flagged_by_email?: string;
}

export interface ModerationLog {
  id: string;
  moderator_id: string;
  action: ModerationAction;
  target_type: 'comment' | 'article' | 'user';
  target_id: string;
  reason?: string;
  details?: Record<string, any>;
  created_at: string;
  
  // Joined data
  moderator_email?: string;
  target_preview?: string;
}

export interface ContentFilter {
  pattern: string;
  type: 'exact' | 'contains' | 'regex';
  severity: 'low' | 'medium' | 'high';
  action: 'flag' | 'hide' | 'require_review';
  description?: string;
}

export interface UseModerationOptions {
  enableAutoModeration?: boolean;
  strictMode?: boolean;
}

export interface UseModerationReturn {
  // Report management
  reportContent: (
    contentType: 'comment' | 'article' | 'user',
    contentId: string,
    reason: ReportReason,
    description?: string
  ) => Promise<void>;
  
  // Content filtering
  checkContent: (content: string) => Promise<{
    isAppropriate: boolean;
    flags: string[];
    severity: 'low' | 'medium' | 'high';
    suggestions: string[];
  }>;
  
  // Moderation actions
  hideContent: (contentType: 'comment' | 'article', contentId: string, reason?: string) => Promise<void>;
  flagUser: (userId: string, reason: string, severity: 'low' | 'medium' | 'high') => Promise<void>;
  suspendUser: (userId: string, duration: number, reason: string) => Promise<void>;
  banUser: (userId: string, reason: string) => Promise<void>;
  
  // Admin functions
  getReports: (status?: ReportStatus) => Promise<ContentReport[]>;
  getUserFlags: (userId?: string) => Promise<UserFlag[]>;
  getModerationLogs: (targetId?: string) => Promise<ModerationLog[]>;
  reviewReport: (reportId: string, action: ModerationAction, resolution?: string) => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

// Content filters for automatic moderation
const DEFAULT_CONTENT_FILTERS: ContentFilter[] = [
  // Spam patterns
  { pattern: 'buy now|click here|limited time|act fast', type: 'regex', severity: 'medium', action: 'flag', description: 'Potential spam' },
  { pattern: 'http[s]?://(?!azreader\\.)', type: 'regex', severity: 'low', action: 'flag', description: 'External link' },
  
  // Hate speech patterns (basic - would need more comprehensive in production)
  { pattern: 'stupid|idiot|moron', type: 'contains', severity: 'low', action: 'flag', description: 'Mild offensive language' },
  { pattern: 'hate|kill|die', type: 'contains', severity: 'high', action: 'require_review', description: 'Potential hate speech' },
  
  // All caps (shouting)
  { pattern: '^[A-Z\\s]{20,}$', type: 'regex', severity: 'low', action: 'flag', description: 'All caps text' },
  
  // Repeated characters
  { pattern: '(.)\\1{10,}', type: 'regex', severity: 'medium', action: 'flag', description: 'Repeated characters' },
  
  // Email/phone patterns
  { pattern: '[\\w.-]+@[\\w.-]+\\.[a-z]{2,}', type: 'regex', severity: 'medium', action: 'flag', description: 'Contains email address' },
  { pattern: '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b', type: 'regex', severity: 'medium', action: 'flag', description: 'Contains phone number' },
];

export const useModeration = (options: UseModerationOptions = {}): UseModerationReturn => {
  const { enableAutoModeration = true, strictMode = false } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;
  const showToast = useCustomToast();

  // Helper to check if user is admin/moderator
  const isAdmin = useCallback(async (userId?: string): Promise<boolean> => {
    const targetUserId = userId || currentUserId;
    if (!targetUserId) return false;

    try {
      // Check if user has admin role (you might store this in user profile or separate roles table)
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', targetUserId)
        .single();

      // For now, check if email contains 'admin' - in production, use proper role management
      return user?.email?.includes('admin') || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, [currentUserId]);

  // Report content
  const reportContent = useCallback(async (
    contentType: 'comment' | 'article' | 'user',
    contentId: string,
    reason: ReportReason,
    description?: string
  ) => {
    if (!currentUserId) {
      showToast({
        message: 'You must be logged in to report content',
        color: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if user already reported this content
      const { data: existingReport } = await supabase
        .from('content_reports')
        .select('id')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('reporter_id', currentUserId)
        .single();

      if (existingReport) {
        showToast({
          message: 'You have already reported this content',
          color: 'warning',
          duration: 3000,
        });
        return;
      }

      // Create new report
      const { error: insertError } = await supabase
        .from('content_reports')
        .insert({
          content_type: contentType,
          content_id: contentId,
          reporter_id: currentUserId,
          reason,
          description,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Log the report action
      await supabase
        .from('moderation_logs')
        .insert({
          moderator_id: currentUserId,
          action: 'report_submitted' as ModerationAction,
          target_type: contentType,
          target_id: contentId,
          reason: `User reported content: ${reason}`,
          details: { reason, description },
          created_at: new Date().toISOString(),
        });

      showToast({
        message: 'Content reported successfully. Thank you for keeping our community safe.',
        color: 'success',
        duration: 4000,
      });

    } catch (err) {
      console.error('Error reporting content:', err);
      setError('Failed to report content');
      showToast({
        message: 'Failed to report content. Please try again.',
        color: 'danger',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, showToast]);

  // Check content against filters
  const checkContent = useCallback(async (content: string): Promise<{
    isAppropriate: boolean;
    flags: string[];
    severity: 'low' | 'medium' | 'high';
    suggestions: string[];
  }> => {
    if (!enableAutoModeration) {
      return { isAppropriate: true, flags: [], severity: 'low', suggestions: [] };
    }

    const flags: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' = 'low';
    const suggestions: string[] = [];

    // Check against filters
    for (const filter of DEFAULT_CONTENT_FILTERS) {
      let matches = false;
      
      switch (filter.type) {
        case 'exact':
          matches = content.toLowerCase() === filter.pattern.toLowerCase();
          break;
        case 'contains':
          matches = content.toLowerCase().includes(filter.pattern.toLowerCase());
          break;
        case 'regex':
          try {
            matches = new RegExp(filter.pattern, 'gi').test(content);
          } catch (e) {
            console.warn('Invalid regex pattern:', filter.pattern);
          }
          break;
      }

      if (matches) {
        flags.push(filter.description || filter.pattern);
        
        if (filter.severity === 'high' || (filter.severity === 'medium' && maxSeverity === 'low')) {
          maxSeverity = filter.severity;
        }

        // Add suggestions based on filter type
        if (filter.pattern.includes('http')) {
          suggestions.push('Consider removing external links or using shortened text');
        } else if (filter.pattern.includes('caps')) {
          suggestions.push('Consider using normal case instead of ALL CAPS');
        } else if (filter.severity === 'high') {
          suggestions.push('Please review your comment for potentially offensive content');
        }
      }
    }

    // Additional checks
    if (content.length < 3) {
      flags.push('Very short content');
      suggestions.push('Consider adding more meaningful content');
    }

    if (content.length > 2000) {
      flags.push('Very long content');
      suggestions.push('Consider breaking this into shorter comments');
    }

    const isAppropriate = flags.length === 0 || (!strictMode && maxSeverity === 'low');

    return {
      isAppropriate,
      flags,
      severity: maxSeverity,
      suggestions,
    };
  }, [enableAutoModeration, strictMode]);

  // Hide content (admin action)
  const hideContent = useCallback(async (
    contentType: 'comment' | 'article',
    contentId: string,
    reason?: string
  ) => {
    if (!await isAdmin()) {
      showToast({
        message: 'Insufficient permissions',
        color: 'danger',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const tableName = contentType === 'comment' ? 'comments' : 'articles';
      
      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from(tableName)
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) throw error;

      // Log moderation action
      await supabase
        .from('moderation_logs')
        .insert({
          moderator_id: currentUserId!,
          action: 'hide_comment' as ModerationAction,
          target_type: contentType,
          target_id: contentId,
          reason: reason || 'Hidden by moderator',
          created_at: new Date().toISOString(),
        });

      showToast({
        message: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} hidden successfully`,
        color: 'success',
        duration: 3000,
      });

    } catch (err) {
      console.error('Error hiding content:', err);
      setError('Failed to hide content');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isAdmin, showToast]);

  // Flag user
  const flagUser = useCallback(async (
    userId: string, 
    reason: string, 
    severity: 'low' | 'medium' | 'high'
  ) => {
    if (!await isAdmin()) {
      showToast({
        message: 'Insufficient permissions',
        color: 'danger',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_flags')
        .insert({
          user_id: userId,
          flagged_by: currentUserId!,
          reason,
          status: 'flagged' as UserStatus,
          severity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Log action
      await supabase
        .from('moderation_logs')
        .insert({
          moderator_id: currentUserId!,
          action: 'flag_user' as ModerationAction,
          target_type: 'user',
          target_id: userId,
          reason,
          details: { severity },
          created_at: new Date().toISOString(),
        });

      showToast({
        message: 'User flagged successfully',
        color: 'success',
        duration: 3000,
      });

    } catch (err) {
      console.error('Error flagging user:', err);
      setError('Failed to flag user');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isAdmin, showToast]);

  // Suspend user
  const suspendUser = useCallback(async (
    userId: string,
    durationDays: number,
    reason: string
  ) => {
    if (!await isAdmin()) {
      showToast({
        message: 'Insufficient permissions',
        color: 'danger',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { error } = await supabase
        .from('user_flags')
        .insert({
          user_id: userId,
          flagged_by: currentUserId!,
          reason,
          status: 'suspended' as UserStatus,
          severity: 'high',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Log action
      await supabase
        .from('moderation_logs')
        .insert({
          moderator_id: currentUserId!,
          action: 'suspend_user' as ModerationAction,
          target_type: 'user',
          target_id: userId,
          reason,
          details: { duration_days: durationDays, expires_at: expiresAt.toISOString() },
          created_at: new Date().toISOString(),
        });

      showToast({
        message: `User suspended for ${durationDays} days`,
        color: 'warning',
        duration: 3000,
      });

    } catch (err) {
      console.error('Error suspending user:', err);
      setError('Failed to suspend user');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isAdmin, showToast]);

  // Ban user permanently
  const banUser = useCallback(async (userId: string, reason: string) => {
    if (!await isAdmin()) {
      showToast({
        message: 'Insufficient permissions',
        color: 'danger',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_flags')
        .insert({
          user_id: userId,
          flagged_by: currentUserId!,
          reason,
          status: 'banned' as UserStatus,
          severity: 'critical',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Log action
      await supabase
        .from('moderation_logs')
        .insert({
          moderator_id: currentUserId!,
          action: 'ban_user' as ModerationAction,
          target_type: 'user',
          target_id: userId,
          reason,
          details: { permanent: true },
          created_at: new Date().toISOString(),
        });

      showToast({
        message: 'User banned permanently',
        color: 'danger',
        duration: 3000,
      });

    } catch (err) {
      console.error('Error banning user:', err);
      setError('Failed to ban user');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isAdmin, showToast]);

  // Get reports (admin only)
  const getReports = useCallback(async (status?: ReportStatus): Promise<ContentReport[]> => {
    if (!await isAdmin()) return [];

    try {
      let query = supabase
        .from('content_reports')
        .select(`
          *,
          reporter:reporter_id(email),
          moderator:reviewed_by(email)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(report => ({
        ...report,
        reporter_email: report.reporter?.email,
        moderator_email: report.moderator?.email,
      }));

    } catch (err) {
      console.error('Error fetching reports:', err);
      return [];
    }
  }, [isAdmin]);

  // Get user flags
  const getUserFlags = useCallback(async (userId?: string): Promise<UserFlag[]> => {
    if (!await isAdmin()) return [];

    try {
      let query = supabase
        .from('user_flags')
        .select(`
          *,
          user:user_id(email),
          flagger:flagged_by(email)
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(flag => ({
        ...flag,
        user_email: flag.user?.email,
        flagged_by_email: flag.flagger?.email,
      }));

    } catch (err) {
      console.error('Error fetching user flags:', err);
      return [];
    }
  }, [isAdmin]);

  // Get moderation logs
  const getModerationLogs = useCallback(async (targetId?: string): Promise<ModerationLog[]> => {
    if (!await isAdmin()) return [];

    try {
      let query = supabase
        .from('moderation_logs')
        .select(`
          *,
          moderator:moderator_id(email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (targetId) {
        query = query.eq('target_id', targetId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(log => ({
        ...log,
        moderator_email: log.moderator?.email,
      }));

    } catch (err) {
      console.error('Error fetching moderation logs:', err);
      return [];
    }
  }, [isAdmin]);

  // Review report (admin action)
  const reviewReport = useCallback(async (
    reportId: string,
    action: ModerationAction,
    resolution?: string
  ) => {
    if (!await isAdmin()) {
      showToast({
        message: 'Insufficient permissions',
        color: 'danger',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update report status
      const { error } = await supabase
        .from('content_reports')
        .update({
          status: action === 'dismiss' ? 'dismissed' : 'resolved',
          reviewed_by: currentUserId!,
          reviewed_at: new Date().toISOString(),
          resolution,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      // Log the review action
      await supabase
        .from('moderation_logs')
        .insert({
          moderator_id: currentUserId!,
          action,
          target_type: 'comment', // This should be dynamic based on report
          target_id: reportId,
          reason: `Report reviewed: ${action}`,
          details: { resolution },
          created_at: new Date().toISOString(),
        });

      showToast({
        message: `Report ${action === 'dismiss' ? 'dismissed' : 'resolved'} successfully`,
        color: 'success',
        duration: 3000,
      });

    } catch (err) {
      console.error('Error reviewing report:', err);
      setError('Failed to review report');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isAdmin, showToast]);

  return {
    reportContent,
    checkContent,
    hideContent,
    flagUser,
    suspendUser,
    banUser,
    getReports,
    getUserFlags,
    getModerationLogs,
    reviewReport,
    isLoading,
    error,
  };
};