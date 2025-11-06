import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useCustomToast } from '@hooks/useIonToast';

export type PrivacyLevel = 'public' | 'private' | 'followers_only';
export type ContentType = 'article' | 'user_profile';

export interface PrivacySettings {
  articles_default: PrivacyLevel;
  profile_visibility: PrivacyLevel;
  allow_comments_from: 'everyone' | 'followers_only' | 'nobody';
  allow_likes_from: 'everyone' | 'followers_only' | 'nobody';
  show_reading_activity: boolean;
  show_like_activity: boolean;
  show_comment_activity: boolean;
  discoverable_in_search: boolean;
}

export interface UsePrivacyOptions {
  contentId?: string;
  contentType?: ContentType;
  userId?: string;
}

export interface UsePrivacyReturn {
  // Content privacy
  isPublic: boolean;
  privacyLevel: PrivacyLevel;
  setPrivacyLevel: (level: PrivacyLevel) => Promise<void>;
  togglePrivacy: () => Promise<void>;
  
  // Privacy settings
  settings: PrivacySettings | null;
  updateSettings: (newSettings: Partial<PrivacySettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  
  // Permission checks
  canView: (viewerId?: string) => Promise<boolean>;
  canComment: (userId?: string) => Promise<boolean>;
  canLike: (userId?: string) => Promise<boolean>;
  canShare: () => Promise<boolean>;
  
  // Sharing
  generateShareUrl: (includeAuth?: boolean) => string;
  generateDeepLink: () => string;
  
  // State
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  articles_default: 'public',
  profile_visibility: 'public',
  allow_comments_from: 'everyone',
  allow_likes_from: 'everyone',
  show_reading_activity: true,
  show_like_activity: true,
  show_comment_activity: true,
  discoverable_in_search: true,
};

export const usePrivacy = (options: UsePrivacyOptions = {}): UsePrivacyReturn => {
  const { contentId, contentType = 'article', userId: optionsUserId } = options;
  
  const [isPublic, setIsPublic] = useState(true);
  const [privacyLevel, setPrivacyLevelState] = useState<PrivacyLevel>('public');
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = optionsUserId || userState.credentials?.user?.id;
  const showToast = useCustomToast();

  // Load content privacy status
  const loadContentPrivacy = useCallback(async () => {
    if (!contentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = contentType === 'article' ? 'articles' : 'users';
      
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('is_public')
        .eq('id', contentId)
        .single();

      if (fetchError) throw fetchError;

      const isContentPublic = data?.is_public ?? true;
      setIsPublic(isContentPublic);
      setPrivacyLevelState(isContentPublic ? 'public' : 'private');
      
    } catch (err) {
      console.error('Error loading content privacy:', err);
      setError('Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  }, [contentId, contentType]);

  // Load user privacy settings
  const loadPrivacySettings = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      // For now, we'll use a simple approach with user metadata
      // In a full implementation, you'd have a separate user_privacy_settings table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_public, email')
        .eq('id', currentUserId)
        .single();

      if (userError) throw userError;

      // Create settings based on current user data
      // In production, load from dedicated settings table
      const userSettings: PrivacySettings = {
        ...DEFAULT_PRIVACY_SETTINGS,
        profile_visibility: userData?.is_public ? 'public' : 'private',
        articles_default: userData?.is_public ? 'public' : 'private',
      };

      setSettings(userSettings);
      
    } catch (err) {
      console.error('Error loading privacy settings:', err);
      setSettings(DEFAULT_PRIVACY_SETTINGS);
    }
  }, [currentUserId]);

  // Update content privacy level
  const setPrivacyLevel = useCallback(async (level: PrivacyLevel) => {
    if (!contentId || !currentUserId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = contentType === 'article' ? 'articles' : 'users';
      const isContentPublic = level === 'public';
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ 
          is_public: isContentPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId)
        .eq('user_id', currentUserId); // Ensure user owns the content

      if (updateError) throw updateError;

      setIsPublic(isContentPublic);
      setPrivacyLevelState(level);
      
      showToast({
        message: `${contentType === 'article' ? 'Article' : 'Profile'} is now ${level}`,
        color: 'success',
        duration: 3000,
      });
      
    } catch (err) {
      console.error('Error updating privacy level:', err);
      setError('Failed to update privacy settings');
      showToast({
        message: 'Failed to update privacy settings',
        color: 'danger',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [contentId, currentUserId, contentType, showToast]);

  // Toggle privacy (quick switch between public/private)
  const togglePrivacy = useCallback(async () => {
    const newLevel: PrivacyLevel = isPublic ? 'private' : 'public';
    await setPrivacyLevel(newLevel);
  }, [isPublic, setPrivacyLevel]);

  // Update user privacy settings
  const updateSettings = useCallback(async (newSettings: Partial<PrivacySettings>) => {
    if (!currentUserId || !settings) return;
    
    setIsLoading(true);
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Update user profile visibility if changed
      if (newSettings.profile_visibility !== undefined) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            is_public: newSettings.profile_visibility === 'public',
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUserId);

        if (userUpdateError) throw userUpdateError;
      }

      // In a full implementation, save to user_privacy_settings table
      // For now, we'll just update the local state
      setSettings(updatedSettings);
      
      showToast({
        message: 'Privacy settings updated successfully',
        color: 'success',
        duration: 3000,
      });
      
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      setError('Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, settings, showToast]);

  // Reset to default settings
  const resetToDefaults = useCallback(async () => {
    await updateSettings(DEFAULT_PRIVACY_SETTINGS);
  }, [updateSettings]);

  // Check if content can be viewed by a user
  const canView = useCallback(async (viewerId?: string): Promise<boolean> => {
    if (!contentId) return false;

    // Public content can always be viewed
    if (isPublic) return true;

    // Private content can only be viewed by the owner
    if (!viewerId) return false;
    
    try {
      const tableName = contentType === 'article' ? 'articles' : 'users';
      const { data, error } = await supabase
        .from(tableName)
        .select('user_id')
        .eq('id', contentId)
        .single();

      if (error) throw error;

      return (data as any)?.user_id === viewerId;
      
    } catch (err) {
      console.error('Error checking view permissions:', err);
      return false;
    }
  }, [contentId, contentType, isPublic]);

  // Check if user can comment
  const canComment = useCallback(async (userId?: string): Promise<boolean> => {
    if (!settings) return false;

    // Check content visibility first
    const canViewContent = await canView(userId);
    if (!canViewContent) return false;

    // Check comment permissions
    switch (settings.allow_comments_from) {
      case 'everyone':
        return true;
      case 'followers_only':
        // In a full implementation, check follower relationship
        return userId === currentUserId; // For now, only owner
      case 'nobody':
        return userId === currentUserId; // Only owner can comment
      default:
        return false;
    }
  }, [settings, canView, currentUserId]);

  // Check if user can like
  const canLike = useCallback(async (userId?: string): Promise<boolean> => {
    if (!settings) return false;

    const canViewContent = await canView(userId);
    if (!canViewContent) return false;

    switch (settings.allow_likes_from) {
      case 'everyone':
        return true;
      case 'followers_only':
        return userId === currentUserId;
      case 'nobody':
        return userId === currentUserId;
      default:
        return false;
    }
  }, [settings, canView, currentUserId]);

  // Check if content can be shared
  const canShare = useCallback(async (): Promise<boolean> => {
    // Only public content can be shared
    return isPublic;
  }, [isPublic]);

  // Generate web share URL
  const generateShareUrl = useCallback((includeAuth: boolean = false): string => {
    if (!contentId) return '';
    
    const baseUrl = window.location.origin;
    const path = contentType === 'article' ? `/article/${contentId}` : `/user/${contentId}`;
    
    let url = `${baseUrl}${path}`;
    
    if (includeAuth && currentUserId) {
      // Add authentication parameter for private content
      url += `?auth=${currentUserId}`;
    }
    
    return url;
  }, [contentId, contentType, currentUserId]);

  // Generate deep link
  const generateDeepLink = useCallback((): string => {
    if (!contentId) return '';
    
    return `azreader://${contentType}/${contentId}`;
  }, [contentId, contentType]);

  // Load initial data
  useEffect(() => {
    if (contentId) {
      loadContentPrivacy();
    }
    if (currentUserId) {
      loadPrivacySettings();
    }
  }, [contentId, currentUserId, loadContentPrivacy, loadPrivacySettings]);

  return {
    // Content privacy
    isPublic,
    privacyLevel,
    setPrivacyLevel,
    togglePrivacy,
    
    // Privacy settings
    settings,
    updateSettings,
    resetToDefaults,
    
    // Permission checks
    canView,
    canComment,
    canLike,
    canShare,
    
    // Sharing
    generateShareUrl,
    generateDeepLink,
    
    // State
    isLoading,
    error,
  };
};