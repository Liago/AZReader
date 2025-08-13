// Centralized exports for custom hooks
export { default as useAuth } from './useAuth';
export { default as useArticles } from './useArticles';
export { useCustomToast } from './useIonToast';
export { usePostLikes } from './usePostLikes';
export { usePostComments } from './usePostComments';
export { useScreenBrightness } from './useScreenBrightness';
export { useReadingProgress } from './useReadingProgress';
export { useKeyboardShortcuts, useReadingKeyboardShortcuts } from './useKeyboardShortcuts';
export { useScrollPositionCleanup } from './useScrollPositionCleanup';

// Social features hooks
export { default as useNotifications } from './useNotifications';
export { default as useLikes } from './useLikes';
export { usePostCommentsWithPagination } from './usePostCommentsWithPagination';
export { useModeration } from './useModeration';
export { usePrivacy } from './usePrivacy';
export { useActivityFeed } from './useActivityFeed';
export { useActivityTracking } from './useActivityTracking';

// Discovery and social platform hooks
export { default as useFollow } from './useFollow';
export { default as usePublicFeedRanking } from './usePublicFeedRanking';
export { default as useDiscoverTab } from './useDiscoverTab';
export { default as useUserProfile } from './useUserProfile';

// Tag management hooks
export { default as useTagManager } from './useTagManager';
export { default as useArticleFilters } from './useArticleFilters';
export { useTagLazyLoading, useTagVirtualScrolling } from './useTagLazyLoading';

// Search functionality hooks
export { default as useSearchBar } from './useSearchBar';
export { default as useFullTextSearch } from './useFullTextSearch';
export { useSearchFilterPresets } from './useSearchFilterPresets';