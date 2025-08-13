import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useCustomToast } from '@hooks/useIonToast';

export type PrivacyLevel = 'public' | 'private' | 'followers_only';
export type InteractionPermission = 'everyone' | 'followers_only' | 'nobody';

export interface AdvancedPrivacySettings {
  // Profile visibility settings
  profile_visibility: PrivacyLevel;
  show_email: boolean;
  show_bio: boolean;
  show_website: boolean;
  show_join_date: boolean;
  show_avatar: boolean;
  
  // Following/Followers visibility
  show_following_list: boolean;
  show_followers_list: boolean;
  show_following_count: boolean;
  show_followers_count: boolean;
  
  // Activity feed visibility
  activity_feed_public: boolean;
  show_reading_activity: boolean;
  show_like_activity: boolean;
  show_comment_activity: boolean;
  show_save_activity: boolean;
  show_follow_activity: boolean;
  
  // Content defaults
  articles_default_privacy: PrivacyLevel;
  include_in_discovery: boolean;
  discoverable_in_search: boolean;
  
  // Interaction permissions
  allow_comments_from: InteractionPermission;
  allow_likes_from: InteractionPermission;
  allow_follows_from: InteractionPermission;
  require_follow_approval: boolean;
  
  // Notification preferences
  notify_on_follow: boolean;
  notify_on_like: boolean;
  notify_on_comment: boolean;
  notify_on_mention: boolean;
  notify_on_share: boolean;
  
  // Advanced settings
  block_anonymous_access: boolean;
  require_verified_followers: boolean;
  auto_decline_suspicious_follows: boolean;
}

export interface FollowRequest {
  id: string;
  requester_id: string;
  target_user_id: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  message?: string;
  requested_at: string;
  responded_at?: string;
  responded_by?: string;
  requester?: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  };
}

export interface PrivacyAuditEntry {
  id: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  timestamp: string;
}

export interface UseAdvancedPrivacyReturn {
  // Settings
  settings: AdvancedPrivacySettings | null;
  isLoading: boolean;
  error: string | null;
  
  // Settings management
  updateSettings: (newSettings: Partial<AdvancedPrivacySettings>) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  exportSettings: () => string;
  importSettings: (data: string) => Promise<boolean>;
  
  // Follow requests
  followRequests: FollowRequest[];
  sentRequests: FollowRequest[];
  loadFollowRequests: () => Promise<void>;
  sendFollowRequest: (targetUserId: string, message?: string) => Promise<boolean>;
  respondToFollowRequest: (requestId: string, response: 'approved' | 'denied') => Promise<boolean>;
  cancelFollowRequest: (requestId: string) => Promise<boolean>;
  
  // Privacy validation
  canViewProfile: (viewerId?: string, targetUserId?: string) => Promise<boolean>;
  canInteract: (userId: string, interactionType: 'comment' | 'like' | 'follow') => Promise<boolean>;
  isContentVisible: (contentId: string, contentType: 'article' | 'activity', viewerId?: string) => Promise<boolean>;
  
  // Audit log
  auditLog: PrivacyAuditEntry[];
  loadAuditLog: (limit?: number) => Promise<void>;
  
  // Profile visibility helpers
  getVisibleProfileFields: (targetUserId: string, viewerId?: string) => Promise<string[]>;
  shouldShowActivity: (activityType: string, targetUserId: string, viewerId?: string) => Promise<boolean>;
}

const DEFAULT_PRIVACY_SETTINGS: AdvancedPrivacySettings = {
  profile_visibility: 'public',
  show_email: false,
  show_bio: true,
  show_website: true,
  show_join_date: true,
  show_avatar: true,
  show_following_list: true,
  show_followers_list: true,
  show_following_count: true,
  show_followers_count: true,
  activity_feed_public: true,
  show_reading_activity: true,
  show_like_activity: true,
  show_comment_activity: true,
  show_save_activity: true,
  show_follow_activity: true,
  articles_default_privacy: 'public',
  include_in_discovery: true,
  discoverable_in_search: true,
  allow_comments_from: 'everyone',
  allow_likes_from: 'everyone',
  allow_follows_from: 'everyone',
  require_follow_approval: false,
  notify_on_follow: true,
  notify_on_like: true,
  notify_on_comment: true,
  notify_on_mention: true,
  notify_on_share: true,
  block_anonymous_access: false,
  require_verified_followers: false,
  auto_decline_suspicious_follows: false,
};

export const useAdvancedPrivacy = (): UseAdvancedPrivacyReturn => {
  const [settings, setSettings] = useState<AdvancedPrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FollowRequest[]>([]);
  const [auditLog, setAuditLog] = useState<PrivacyAuditEntry[]>([]);

  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;
  const showToast = useCustomToast();

  // Load privacy settings
  const loadSettings = useCallback(async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc(
        'get_user_privacy_settings' as any,
        { p_user_id: currentUserId }
      );

      if (fetchError) throw fetchError;

      if (Array.isArray(data) && data.length > 0) {
        const settingsData = data[0];
        setSettings({
          profile_visibility: settingsData.profile_visibility,
          show_email: settingsData.show_email,
          show_bio: settingsData.show_bio,
          show_website: settingsData.show_website,
          show_join_date: settingsData.show_join_date,
          show_avatar: settingsData.show_avatar,
          show_following_list: settingsData.show_following_list,
          show_followers_list: settingsData.show_followers_list,
          show_following_count: settingsData.show_following_count,
          show_followers_count: settingsData.show_followers_count,
          activity_feed_public: settingsData.activity_feed_public,
          show_reading_activity: settingsData.show_reading_activity,
          show_like_activity: settingsData.show_like_activity,
          show_comment_activity: settingsData.show_comment_activity,
          show_save_activity: settingsData.show_save_activity,
          show_follow_activity: settingsData.show_follow_activity,
          articles_default_privacy: settingsData.articles_default_privacy,
          include_in_discovery: settingsData.include_in_discovery,
          discoverable_in_search: settingsData.discoverable_in_search,
          allow_comments_from: settingsData.allow_comments_from,
          allow_likes_from: settingsData.allow_likes_from,
          allow_follows_from: settingsData.allow_follows_from,
          require_follow_approval: settingsData.require_follow_approval,
          notify_on_follow: settingsData.notify_on_follow,
          notify_on_like: settingsData.notify_on_like,
          notify_on_comment: settingsData.notify_on_comment,
          notify_on_mention: settingsData.notify_on_mention,
          notify_on_share: settingsData.notify_on_share,
          block_anonymous_access: settingsData.block_anonymous_access,
          require_verified_followers: settingsData.require_verified_followers,
          auto_decline_suspicious_follows: settingsData.auto_decline_suspicious_follows,
        });
      } else {
        setSettings(DEFAULT_PRIVACY_SETTINGS);
      }
    } catch (err) {
      console.error('Error loading privacy settings:', err);
      setError('Failed to load privacy settings');
      setSettings(DEFAULT_PRIVACY_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Update privacy settings
  const updateSettings = useCallback(async (newSettings: Partial<AdvancedPrivacySettings>): Promise<boolean> => {
    if (!currentUserId || !settings) return false;

    setIsLoading(true);
    setError(null);

    try {
      const updatedSettings = { ...settings, ...newSettings };

      const { error: updateError } = await supabase
        .from('user_privacy_settings' as any)
        .upsert({
          user_id: currentUserId,
          ...updatedSettings,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      setSettings(updatedSettings);
      
      showToast({
        message: 'Privacy settings updated successfully',
        color: 'success',
        duration: 3000,
      });

      return true;
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      setError('Failed to update privacy settings');
      showToast({
        message: 'Failed to update privacy settings',
        color: 'danger',
        duration: 3000,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, settings, showToast]);

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return await updateSettings(DEFAULT_PRIVACY_SETTINGS);
  }, [updateSettings]);

  // Export settings
  const exportSettings = useCallback((): string => {
    if (!settings) return '';
    
    return JSON.stringify({
      version: '1.0',
      exported_at: new Date().toISOString(),
      settings,
    }, null, 2);
  }, [settings]);

  // Import settings
  const importSettings = useCallback(async (data: string): Promise<boolean> => {
    try {
      const imported = JSON.parse(data);
      
      if (!imported.settings) {
        throw new Error('Invalid settings format');
      }

      return await updateSettings(imported.settings);
    } catch (err) {
      console.error('Error importing settings:', err);
      setError('Failed to import settings');
      showToast({
        message: 'Failed to import settings - invalid format',
        color: 'danger',
        duration: 3000,
      });
      return false;
    }
  }, [updateSettings, showToast]);

  // Load follow requests
  const loadFollowRequests = useCallback(async () => {
    if (!currentUserId) return;

    try {
      // Load incoming requests
      const { data: incoming, error: incomingError } = await supabase
        .from('follow_requests' as any)
        .select(`
          *,
          requester:users!follow_requests_requester_id_fkey(id, email, name, avatar_url)
        `)
        .eq('target_user_id', currentUserId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (incomingError) throw incomingError;

      // Load sent requests
      const { data: sent, error: sentError } = await supabase
        .from('follow_requests' as any)
        .select(`
          *,
          target_user:users!follow_requests_target_user_id_fkey(id, email, name, avatar_url)
        `)
        .eq('requester_id', currentUserId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (sentError) throw sentError;

      setFollowRequests((incoming || []) as any);
      setSentRequests((sent || []) as any);
    } catch (err) {
      console.error('Error loading follow requests:', err);
      setError('Failed to load follow requests');
    }
  }, [currentUserId]);

  // Send follow request
  const sendFollowRequest = useCallback(async (targetUserId: string, message?: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const { data, error } = await supabase.rpc('handle_follow_request' as any, {
        p_requester_id: currentUserId,
        p_target_user_id: targetUserId,
        p_message: message || null,
      });

      if (error) throw error;

      const result = (Array.isArray(data) && data[0] ? data[0] : { success: false, message: 'No response' }) as { success: boolean; message: string; type?: string };

      showToast({
        message: result.message,
        color: result.success ? 'success' : 'warning',
        duration: 3000,
      });

      if (result.success && result.type === 'follow_request') {
        await loadFollowRequests();
      }

      return result.success;
    } catch (err) {
      console.error('Error sending follow request:', err);
      showToast({
        message: 'Failed to send follow request',
        color: 'danger',
        duration: 3000,
      });
      return false;
    }
  }, [currentUserId, showToast, loadFollowRequests]);

  // Respond to follow request
  const respondToFollowRequest = useCallback(async (requestId: string, response: 'approved' | 'denied'): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const { data, error } = await supabase.rpc('respond_to_follow_request' as any, {
        p_request_id: requestId,
        p_response: response,
        p_responder_id: currentUserId,
      });

      if (error) throw error;

      if (data) {
        showToast({
          message: `Follow request ${response}`,
          color: 'success',
          duration: 3000,
        });

        await loadFollowRequests();
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error responding to follow request:', err);
      showToast({
        message: 'Failed to respond to follow request',
        color: 'danger',
        duration: 3000,
      });
      return false;
    }
  }, [currentUserId, showToast, loadFollowRequests]);

  // Cancel follow request
  const cancelFollowRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const { error } = await supabase
        .from('follow_requests' as any)
        .update({
          status: 'cancelled',
          responded_at: new Date().toISOString(),
        } as any)
        .eq('id', requestId)
        .eq('requester_id', currentUserId);

      if (error) throw error;

      showToast({
        message: 'Follow request cancelled',
        color: 'success',
        duration: 3000,
      });

      await loadFollowRequests();
      return true;
    } catch (err) {
      console.error('Error cancelling follow request:', err);
      showToast({
        message: 'Failed to cancel follow request',
        color: 'danger',
        duration: 3000,
      });
      return false;
    }
  }, [currentUserId, showToast, loadFollowRequests]);

  // Check if user can view profile
  const canViewProfile = useCallback(async (viewerId?: string, targetUserId?: string): Promise<boolean> => {
    const target = targetUserId || currentUserId;
    if (!target) return false;

    try {
      const { data, error } = await supabase.rpc('can_view_user_profile' as any, {
        p_viewer_id: viewerId || null,
        p_target_user_id: target,
      });

      if (error) throw error;
      return Boolean(data);
    } catch (err) {
      console.error('Error checking profile visibility:', err);
      return false;
    }
  }, [currentUserId]);

  // Check if user can interact
  const canInteract = useCallback(async (userId: string, interactionType: 'comment' | 'like' | 'follow'): Promise<boolean> => {
    if (!settings) return false;

    try {
      const canView = await canViewProfile(userId, currentUserId);
      if (!canView) return false;

      const permission = interactionType === 'comment' 
        ? settings.allow_comments_from
        : interactionType === 'like'
        ? settings.allow_likes_from
        : settings.allow_follows_from;

      switch (permission) {
        case 'everyone':
          return true;
        case 'followers_only':
          // Check if user is following current user
          if (!userId || !currentUserId) return false;
          
          const { data: isFollowing } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', userId)
            .eq('following_id', currentUserId)
            .single();

          return Boolean(isFollowing);
        case 'nobody':
          return userId === currentUserId;
        default:
          return false;
      }
    } catch (err) {
      console.error('Error checking interaction permission:', err);
      return false;
    }
  }, [settings, canViewProfile, currentUserId]);

  // Check if content is visible
  const isContentVisible = useCallback(async (
    contentId: string, 
    contentType: 'article' | 'activity', 
    viewerId?: string
  ): Promise<boolean> => {
    try {
      if (contentType === 'article') {
        const { data: article, error } = await supabase
          .from('articles')
          .select('user_id, is_public')
          .eq('id', contentId)
          .single();

        if (error) throw error;

        if (article.is_public) return true;
        return article.user_id === viewerId;
      } else {
        // Activity content visibility
        if (!settings) return false;
        
        if (!settings.activity_feed_public) {
          return viewerId === currentUserId;
        }

        return await canViewProfile(viewerId, currentUserId);
      }
    } catch (err) {
      console.error('Error checking content visibility:', err);
      return false;
    }
  }, [settings, canViewProfile, currentUserId]);

  // Load audit log
  const loadAuditLog = useCallback(async (limit = 50) => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('privacy_audit_log' as any)
        .select('*')
        .eq('user_id', currentUserId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAuditLog((data || []) as any);
    } catch (err) {
      console.error('Error loading audit log:', err);
      setError('Failed to load audit log');
    }
  }, [currentUserId]);

  // Get visible profile fields
  const getVisibleProfileFields = useCallback(async (targetUserId: string, viewerId?: string): Promise<string[]> => {
    try {
      const { data } = await supabase.rpc('get_user_privacy_settings' as any, {
        p_user_id: targetUserId,
      });

      if (!Array.isArray(data) || data.length === 0) return [];

      const userSettings = data[0];
      const visibleFields: string[] = ['id']; // Always visible

      if (userSettings.show_avatar) visibleFields.push('avatar_url');
      if (userSettings.show_bio) visibleFields.push('bio');
      if (userSettings.show_website) visibleFields.push('website');
      if (userSettings.show_join_date) visibleFields.push('created_at');
      
      // Email only visible to owner or if explicitly allowed
      if (userSettings.show_email && (viewerId === targetUserId || userSettings.profile_visibility === 'public')) {
        visibleFields.push('email');
      }

      return visibleFields;
    } catch (err) {
      console.error('Error getting visible profile fields:', err);
      return ['id'];
    }
  }, []);

  // Check if activity should be shown
  const shouldShowActivity = useCallback(async (
    activityType: string, 
    targetUserId: string, 
    viewerId?: string
  ): Promise<boolean> => {
    try {
      const { data } = await supabase.rpc('get_user_privacy_settings' as any, {
        p_user_id: targetUserId,
      });

      if (!Array.isArray(data) || data.length === 0) return false;

      const userSettings = data[0];

      if (!userSettings.activity_feed_public && viewerId !== targetUserId) {
        return false;
      }

      switch (activityType) {
        case 'reading':
        case 'article_saved':
          return userSettings.show_reading_activity;
        case 'like':
        case 'article_liked':
          return userSettings.show_like_activity;
        case 'comment':
        case 'comment_created':
          return userSettings.show_comment_activity;
        case 'follow':
        case 'user_followed':
          return userSettings.show_follow_activity;
        default:
          return true;
      }
    } catch (err) {
      console.error('Error checking activity visibility:', err);
      return false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (currentUserId) {
      loadSettings();
      loadFollowRequests();
      loadAuditLog();
    }
  }, [currentUserId, loadSettings, loadFollowRequests, loadAuditLog]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    followRequests,
    sentRequests,
    loadFollowRequests,
    sendFollowRequest,
    respondToFollowRequest,
    cancelFollowRequest,
    canViewProfile,
    canInteract,
    isContentVisible,
    auditLog,
    loadAuditLog,
    getVisibleProfileFields,
    shouldShowActivity,
  };
};