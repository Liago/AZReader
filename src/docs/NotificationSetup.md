# Real-time Notifications Setup Guide

This guide explains how to integrate the real-time notification system into your AZReader application.

## Overview

The notification system provides:
- ✅ Real-time notifications for likes and comments
- ✅ Toast notifications with customizable styling
- ✅ Badge counters with animation
- ✅ Notification center with filtering and management
- ✅ Global notification context for app-wide state
- ✅ Article-specific notification subscriptions
- ✅ Automatic cleanup and performance optimization

## Core Components

### 1. Hooks

- **`useNotifications`** - Core hook for managing real-time subscriptions
- **`useLikes`** - Enhanced like functionality with notifications
- **`usePostCommentsWithPagination`** - Comments with pagination support

### 2. Components

- **`NotificationBadge`** - Visual notification indicators
- **`NotificationCenter`** - Full notification management interface
- **`NotificationIntegration`** - Ready-to-use header integration

### 3. Context

- **`NotificationProvider`** - Global notification state management
- **`useGlobalNotifications`** - Easy access to notification context

## Quick Setup

### Step 1: Wrap your app with NotificationProvider

```tsx
// App.tsx
import { NotificationProvider } from '@context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      {/* Your existing app content */}
      <IonApp>
        <IonRouter>
          {/* Routes */}
        </IonRouter>
      </IonApp>
    </NotificationProvider>
  );
}
```

### Step 2: Add notifications to your header

```tsx
// Header component
import NotificationIntegration from '@components/NotificationIntegration';

const Header: React.FC = () => (
  <IonHeader>
    <IonToolbar>
      <IonTitle>AZReader</IonTitle>
      <IonButtons slot="end">
        <NotificationIntegration />
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);
```

### Step 3: Enable Supabase Real-time

Make sure your Supabase project has real-time enabled for the tables:

```sql
-- Enable real-time for likes table
ALTER PUBLICATION supabase_realtime ADD TABLE likes;

-- Enable real-time for comments table  
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```

## Advanced Usage

### Article-Specific Notifications

For article pages where you want notifications only for that article:

```tsx
import { useNotifications } from '@hooks/useNotifications';

const ArticlePage: React.FC<{ articleId: string }> = ({ articleId }) => {
  const {
    stats,
    notifications,
    isConnected,
    markAsRead,
  } = useNotifications({
    articleId, // Only notifications for this article
    enableToasts: true,
    enableBadges: true,
    toastDuration: 3000,
  });

  return (
    <div>
      {/* Article content */}
      <NotificationBadge stats={stats} onClick={() => {/* show notifications */}} />
    </div>
  );
};
```

### Custom Notification Badge

```tsx
import NotificationBadge from '@components/NotificationBadge';
import { useGlobalNotifications } from '@context/NotificationContext';

const CustomNotificationButton: React.FC = () => {
  const { stats, toggleNotificationCenter } = useGlobalNotifications();
  
  return (
    <button onClick={toggleNotificationCenter}>
      <NotificationBadge
        stats={stats}
        type="all" // 'all', 'like', 'comment', 'reply'
        size="large" // 'small', 'medium', 'large'
        color="danger" // Ionic colors
        showIcon={true}
        showCount={true}
        animated={true}
      />
    </button>
  );
};
```

### Custom Notification Center

```tsx
import NotificationCenter from '@components/NotificationCenter';

const MyNotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <NotificationCenter
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      options={{
        articleId: 'specific-article-id', // Optional
        enableToasts: true,
        enableBadges: true,
        toastDuration: 4000,
      }}
      showAsModal={true} // or false for popover
    />
  );
};
```

### Settings Panel

```tsx
import { useGlobalNotifications } from '@context/NotificationContext';

const NotificationSettings: React.FC = () => {
  const {
    enableToasts,
    setEnableToasts,
    enableBadges,
    setEnableBadges,
    toastDuration,
    setToastDuration,
  } = useGlobalNotifications();
  
  return (
    <div>
      <IonToggle
        checked={enableToasts}
        onIonToggle={(e) => setEnableToasts(e.detail.checked)}
      />
      <IonRange
        min={1000}
        max={10000}
        value={toastDuration}
        onIonInput={(e) => setToastDuration(e.detail.value as number)}
      />
    </div>
  );
};
```

## Integration with Existing Components

### Update LikeButton

The LikeButton component already works with notifications through the `useLikes` hook:

```tsx
// LikeButton automatically triggers notifications when likes change
<LikeButton
  articleId={articleId}
  initialLikeCount={likeCount}
  onLikeChange={(isLiked, newCount) => {
    // Notification will be sent automatically via Supabase real-time
  }}
/>
```

### Update Comments Components

Comments automatically trigger notifications when posted:

```tsx
// Comments component already integrates with notifications
<CommentList
  postId={articleId}
  session={session}
  // New comments automatically trigger notifications
/>
```

## Database Schema Requirements

Your Supabase database needs these tables:

```sql
-- Likes table (should already exist)
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Comments table (should already exist)
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Profiles table for user info
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Performance Considerations

### 1. Subscription Cleanup
The notification system automatically cleans up subscriptions when components unmount.

### 2. Memory Management
- Notifications are limited to 100 per session by default
- Old notifications (7+ days) are automatically cleaned up
- Subscriptions are efficiently managed per article/user

### 3. Network Optimization
- Only subscribes when user is authenticated
- Filters subscriptions by article when possible
- Batches profile lookups for efficiency

### 4. UI Performance
- Uses optimistic updates for immediate feedback
- Throttles toast notifications to avoid spam
- Efficient re-renders with proper React optimization

## Troubleshooting

### Real-time not working?

1. Check Supabase real-time is enabled:
```sql
-- Check real-time status
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

2. Verify network connection:
```tsx
const { isConnected, error } = useNotifications();
console.log('Connected:', isConnected, 'Error:', error);
```

3. Check console for subscription errors

### Notifications not showing?

1. Verify user is authenticated
2. Check notification settings (enableToasts, enableBadges)
3. Ensure you're not filtering out your own actions

### Performance issues?

1. Limit subscription scope with articleId
2. Reduce maxNotifications limit
3. Disable animations on slower devices
4. Check for memory leaks in subscriptions

## API Reference

### useNotifications Options

```tsx
interface UseNotificationsOptions {
  articleId?: string; // Limit to specific article
  userId?: string; // Override current user
  enableToasts?: boolean; // Show toast notifications
  enableBadges?: boolean; // Show badge counters
  autoMarkAsRead?: boolean; // Auto-mark as read
  toastDuration?: number; // Toast display time (ms)
  maxNotifications?: number; // Max notifications to keep
}
```

### NotificationEvent Type

```tsx
interface NotificationEvent {
  id: string;
  type: 'like' | 'comment' | 'reply';
  articleId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: {
    commentId?: string;
    parentCommentId?: string;
    likeId?: string;
    content?: string;
  };
}
```

### NotificationStats Type

```tsx
interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    likes: number;
    comments: number;
    replies: number;
  };
}
```

This notification system provides a complete, production-ready solution for real-time social interactions in your AZReader application.