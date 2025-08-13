import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { supabase } from '@common/supabase';
import { ActivityActionType } from './useActivityFeed';

export interface ActivityNotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  activity_types: {
    article_liked: boolean;
    article_shared: boolean;
    comment_created: boolean;
    comment_liked: boolean;
    user_followed: boolean;
    profile_updated: boolean;
  };
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  quiet_hours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
}

export interface ActivityDisplayPreferences {
  feed_types: {
    following: boolean;
    global: boolean;
    personal: boolean;
  };
  grouping: {
    enabled: boolean;
    time_window: number; // hours
  };
  auto_refresh: boolean;
  items_per_page: number;
  show_read_activities: boolean;
}

export interface UseActivityPreferencesReturn {
  notificationPrefs: ActivityNotificationPreferences;
  displayPrefs: ActivityDisplayPreferences;
  isLoading: boolean;
  error: string | null;
  updateNotificationPreferences: (prefs: Partial<ActivityNotificationPreferences>) => Promise<boolean>;
  updateDisplayPreferences: (prefs: Partial<ActivityDisplayPreferences>) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  exportPreferences: () => string;
  importPreferences: (data: string) => Promise<boolean>;
}

const DEFAULT_NOTIFICATION_PREFS: ActivityNotificationPreferences = {
  email_notifications: false,
  push_notifications: true,
  activity_types: {
    article_liked: true,
    article_shared: false,
    comment_created: true,
    comment_liked: false,
    user_followed: true,
    profile_updated: false,
  },
  frequency: 'real_time',
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

const DEFAULT_DISPLAY_PREFS: ActivityDisplayPreferences = {
  feed_types: {
    following: true,
    global: true,
    personal: true,
  },
  grouping: {
    enabled: true,
    time_window: 6, // 6 hours
  },
  auto_refresh: true,
  items_per_page: 20,
  show_read_activities: true,
};

const STORAGE_KEY = 'activity_preferences';

export const useActivityPreferences = (): UseActivityPreferencesReturn => {
  const [notificationPrefs, setNotificationPrefs] = useState<ActivityNotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [displayPrefs, setDisplayPrefs] = useState<ActivityDisplayPreferences>(DEFAULT_DISPLAY_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userState = useSelector((state: RootState) => state.user);
  const userId = userState.credentials?.user?.id;

  // Load preferences from database or localStorage
  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (userId) {
        // Try to load from database first
        const { data, error: supabaseError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (supabaseError && supabaseError.code !== 'PGRST116') {
          throw supabaseError;
        }

        if (data && data.activity_preferences) {
          const prefs = data.activity_preferences;
          if (prefs.notifications) {
            setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...prefs.notifications });
          }
          if (prefs.display) {
            setDisplayPrefs({ ...DEFAULT_DISPLAY_PREFS, ...prefs.display });
          }
          return;
        }
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId || 'anonymous'}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.notifications) {
          setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...parsed.notifications });
        }
        if (parsed.display) {
          setDisplayPrefs({ ...DEFAULT_DISPLAY_PREFS, ...parsed.display });
        }
      }
    } catch (err) {
      console.error('Error loading activity preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save preferences to database and localStorage
  const savePreferences = useCallback(async (
    notificationUpdates?: Partial<ActivityNotificationPreferences>,
    displayUpdates?: Partial<ActivityDisplayPreferences>
  ) => {
    const updatedNotificationPrefs = notificationUpdates 
      ? { ...notificationPrefs, ...notificationUpdates }
      : notificationPrefs;
    
    const updatedDisplayPrefs = displayUpdates 
      ? { ...displayPrefs, ...displayUpdates }
      : displayPrefs;

    const prefsData = {
      notifications: updatedNotificationPrefs,
      display: updatedDisplayPrefs,
    };

    try {
      if (userId) {
        // Save to database
        const { error: supabaseError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            activity_preferences: prefsData,
            updated_at: new Date().toISOString(),
          });

        if (supabaseError) {
          throw supabaseError;
        }
      }

      // Save to localStorage as backup
      localStorage.setItem(
        `${STORAGE_KEY}_${userId || 'anonymous'}`,
        JSON.stringify(prefsData)
      );

      // Update state
      if (notificationUpdates) {
        setNotificationPrefs(updatedNotificationPrefs);
      }
      if (displayUpdates) {
        setDisplayPrefs(updatedDisplayPrefs);
      }

      return true;
    } catch (err) {
      console.error('Error saving activity preferences:', err);
      setError('Failed to save preferences');
      return false;
    }
  }, [userId, notificationPrefs, displayPrefs]);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (
    updates: Partial<ActivityNotificationPreferences>
  ): Promise<boolean> => {
    return await savePreferences(updates, undefined);
  }, [savePreferences]);

  // Update display preferences
  const updateDisplayPreferences = useCallback(async (
    updates: Partial<ActivityDisplayPreferences>
  ): Promise<boolean> => {
    return await savePreferences(undefined, updates);
  }, [savePreferences]);

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return await savePreferences(DEFAULT_NOTIFICATION_PREFS, DEFAULT_DISPLAY_PREFS);
  }, [savePreferences]);

  // Export preferences as JSON string
  const exportPreferences = useCallback((): string => {
    return JSON.stringify({
      notifications: notificationPrefs,
      display: displayPrefs,
      exported_at: new Date().toISOString(),
    }, null, 2);
  }, [notificationPrefs, displayPrefs]);

  // Import preferences from JSON string
  const importPreferences = useCallback(async (data: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(data);
      
      if (!parsed.notifications && !parsed.display) {
        throw new Error('Invalid preferences format');
      }

      const notifications = parsed.notifications 
        ? { ...DEFAULT_NOTIFICATION_PREFS, ...parsed.notifications }
        : notificationPrefs;
      
      const display = parsed.display 
        ? { ...DEFAULT_DISPLAY_PREFS, ...parsed.display }
        : displayPrefs;

      return await savePreferences(notifications, display);
    } catch (err) {
      console.error('Error importing preferences:', err);
      setError('Failed to import preferences');
      return false;
    }
  }, [notificationPrefs, displayPrefs, savePreferences]);

  // Check if notification should be shown based on preferences
  const shouldShowNotification = useCallback((
    activityType: ActivityActionType,
    timestamp: Date = new Date()
  ): boolean => {
    // Check if activity type is enabled
    if (!notificationPrefs.activity_types[activityType as keyof typeof notificationPrefs.activity_types]) {
      return false;
    }

    // Check quiet hours
    if (notificationPrefs.quiet_hours.enabled) {
      const currentTime = timestamp.toTimeString().substring(0, 5); // "HH:MM"
      const start = notificationPrefs.quiet_hours.start;
      const end = notificationPrefs.quiet_hours.end;
      
      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (start > end) {
        if (currentTime >= start || currentTime <= end) {
          return false;
        }
      } else {
        // Same day quiet hours (e.g., 14:00 to 16:00)
        if (currentTime >= start && currentTime <= end) {
          return false;
        }
      }
    }

    return true;
  }, [notificationPrefs]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    notificationPrefs,
    displayPrefs,
    isLoading,
    error,
    updateNotificationPreferences,
    updateDisplayPreferences,
    resetToDefaults,
    exportPreferences,
    importPreferences,
  };
};

export default useActivityPreferences;