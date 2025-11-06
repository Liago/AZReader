# Activity Feed System - Complete Implementation Guide

This document provides a comprehensive guide to AZReader's social activity feed system, which tracks and displays user interactions in real-time.

## Overview

The Activity Feed System provides:
- ✅ Real-time activity tracking for social interactions
- ✅ Smart activity aggregation for better UX 
- ✅ Timeline view with infinite scrolling
- ✅ User following system integration
- ✅ Privacy-aware activity visibility
- ✅ Automated activity creation via database triggers
- ✅ Performance optimizations with caching and batching

## Architecture

### Core Components

1. **Database Layer**
   - `activity_feed` - Individual activity records
   - `activity_aggregates` - Pre-computed activity summaries
   - `user_follows` - Following relationships
   - Database functions and triggers for automation

2. **Hook Layer**
   - `useActivityFeed` - Core activity feed functionality
   - `useActivityTracking` - Automated activity tracking
   - Real-time subscriptions and batching logic

3. **Component Layer**
   - `ActivityFeed` - Main timeline component
   - `ActivityAggregator` - Smart activity grouping
   - Modal views for detailed activity breakdown

4. **Integration Layer**
   - Automatic tracking via existing components (likes, comments)
   - Privacy controls integration
   - Notification system integration

## Database Schema

### Activity Feed Table

```sql
activity_feed (
  id UUID PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  action_type VARCHAR(50), -- 'article_liked', 'comment_created', etc.
  target_type VARCHAR(50), -- 'article', 'comment', 'user'
  target_id UUID,
  metadata JSONB,
  content_preview TEXT,
  visibility VARCHAR(20) DEFAULT 'public',
  group_key VARCHAR(100), -- For aggregation
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Activity Aggregates Table

```sql
activity_aggregates (
  id UUID PRIMARY KEY,
  group_key VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES users(id),
  action_type VARCHAR(50),
  target_type VARCHAR(50),
  target_id UUID,
  count INTEGER DEFAULT 1,
  sample_actors UUID[],
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  first_activity_at TIMESTAMP,
  last_activity_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### User Follows Table

```sql
user_follows (
  id UUID PRIMARY KEY,
  follower_id UUID REFERENCES users(id),
  following_id UUID REFERENCES users(id),
  created_at TIMESTAMP,
  UNIQUE(follower_id, following_id)
)
```

## Activity Types

### Supported Actions

| Action Type | Target Type | Description | Visibility |
|-------------|-------------|-------------|------------|
| `article_created` | article | User published new article | public |
| `article_liked` | article | User liked an article | public |
| `article_unliked` | article | User unliked an article | public |
| `article_shared` | article | User shared an article | public |
| `comment_created` | article | User commented on article | public |
| `comment_liked` | comment | User liked a comment | public |
| `user_followed` | user | User followed another user | public |
| `user_unfollowed` | user | User unfollowed another user | private |
| `profile_updated` | user | User updated their profile | followers |

### Activity Metadata

Each activity can contain rich metadata:

```typescript
{
  // Common fields
  timestamp: "2024-01-15T10:30:00Z",
  
  // Like activities
  liked: true,
  
  // Comment activities
  comment_id: "uuid",
  comment_length: 150,
  
  // Article activities
  title: "Article Title",
  content_length: 1500,
  
  // Share activities
  share_method: "native",
  
  // Follow activities
  followed: true,
  
  // Batch activities
  batch_count: 5,
  batch_key: "article_liked_uuid"
}
```

## Implementation Guide

### Step 1: Database Setup

Run the SQL schema in your Supabase dashboard:

```bash
# Execute the activity feed database schema
cat src/docs/ActivityFeedDatabaseSchema.sql
```

The schema includes:
- All necessary tables with optimized indexes
- Row Level Security (RLS) policies
- Automated functions and triggers
- Cleanup procedures for old data

### Step 2: Hook Integration

#### Basic Activity Feed

```typescript
import { useActivityFeed } from '@hooks/useActivityFeed';

const MyTimeline: React.FC = () => {
  const { 
    aggregates, 
    hasMore, 
    loadMore, 
    refresh, 
    isLoading 
  } = useActivityFeed({
    feedType: 'global', // 'global', 'following', 'user'
    aggregated: true,
    realTime: true,
    limit: 20
  });
  
  return (
    <ActivityFeed 
      options={{ feedType: 'global' }}
      showHeader={true}
      onActivityClick={(activity) => {
        // Handle activity click
      }}
      onUserClick={(userId) => {
        // Handle user profile click
      }}
    />
  );
};
```

#### Activity Tracking

```typescript
import { useActivityTracking } from '@hooks/useActivityTracking';

const ArticleActions: React.FC = ({ articleId }) => {
  const { 
    trackArticleLike, 
    trackComment,
    trackArticleShared 
  } = useActivityTracking({
    enableAutoTracking: true,
    trackingDelay: 500,
    batchActivities: true
  });

  const handleLike = async (liked: boolean) => {
    // Your like logic here
    await updateLikeInDatabase(articleId, liked);
    
    // Track activity
    await trackArticleLike(articleId, liked);
  };
  
  const handleComment = async (content: string) => {
    // Your comment logic here
    const commentId = await createComment(articleId, content);
    
    // Track activity
    await trackComment(articleId, commentId, content);
  };
};
```

### Step 3: Component Integration

#### Timeline Page

```typescript
import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import ActivityFeed from '@components/ActivityFeed';

const TimelinePage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Activity Feed</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <ActivityFeed 
          options={{
            feedType: 'global',
            aggregated: true,
            realTime: true
          }}
          showHeader={false}
          onActivityClick={(activity) => {
            if ('target_type' in activity && activity.target_type === 'article') {
              // Navigate to article
              history.push(`/article/${activity.target_id}`);
            }
          }}
          onUserClick={(userId) => {
            // Navigate to user profile
            history.push(`/profile/${userId}`);
          }}
        />
      </IonContent>
    </IonPage>
  );
};
```

#### Following Feed

```typescript
const FollowingFeed: React.FC = () => {
  const { followUser, unfollowUser, isFollowing } = useActivityFeed();
  
  return (
    <ActivityFeed
      options={{
        feedType: 'following',
        aggregated: true,
        realTime: true
      }}
      onUserClick={async (userId) => {
        const following = await isFollowing(userId);
        if (!following) {
          await followUser(userId);
        }
      }}
    />
  );
};
```

#### User Profile Activity

```typescript
const UserProfileActivity: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <ActivityFeed
      options={{
        feedType: 'user',
        userId: userId,
        aggregated: false, // Show individual activities
        realTime: false
      }}
      showHeader={true}
    />
  );
};
```

### Step 4: Advanced Features

#### Custom Activity Creation

```typescript
const { createActivity } = useActivityFeed();

// Custom business logic activity
await createActivity({
  action_type: 'article_created',
  target_type: 'article',
  target_id: articleId,
  metadata: {
    custom_field: 'custom_value',
    category: 'technology'
  },
  content_preview: 'Published article about React hooks',
  visibility: 'public'
});
```

#### Activity Filtering

```typescript
// Article-specific activity
const articleActivity = useActivityFeed({
  targetType: 'article',
  targetId: 'specific-article-id',
  aggregated: true
});

// User-specific activity
const userActivity = useActivityFeed({
  feedType: 'user',
  userId: 'specific-user-id',
  aggregated: false
});
```

#### Real-time Subscriptions

```typescript
const ActivityFeedWithRealtime: React.FC = () => {
  const { activities, refresh } = useActivityFeed({
    realTime: true,
    feedType: 'following'
  });

  // Activities automatically update when new ones are created
  useEffect(() => {
    console.log('New activities received:', activities.length);
  }, [activities]);
  
  return <ActivityFeed options={{ realTime: true }} />;
};
```

## Performance Optimizations

### 1. Database Optimizations

- **Indexes**: Optimized for timeline queries and user-specific lookups
- **Aggregation**: Pre-computed activity summaries reduce query complexity
- **Cleanup**: Automatic removal of old activities (6+ months)
- **RLS**: Row-level security ensures users only see relevant activities

### 2. Client-side Optimizations

- **Batching**: Multiple similar activities grouped together
- **Debouncing**: Activity creation delayed to avoid spam
- **Infinite Scroll**: Load activities in chunks
- **Caching**: Real-time subscription manages local state

### 3. Query Performance

```sql
-- Optimized timeline query
SELECT * FROM activity_aggregates 
WHERE last_activity_at < :cursor
ORDER BY last_activity_at DESC 
LIMIT 20;

-- User following timeline
SELECT aa.* FROM activity_aggregates aa
JOIN user_follows uf ON aa.actor_id = uf.following_id
WHERE uf.follower_id = :user_id
AND aa.last_activity_at < :cursor
ORDER BY aa.last_activity_at DESC 
LIMIT 20;
```

## Privacy & Security

### Visibility Controls

Activities respect privacy settings:

- **Public**: Visible to everyone
- **Followers**: Only visible to followers  
- **Private**: Only visible to the user

### Row Level Security

```sql
-- Users can only see activities they have permission to view
CREATE POLICY activity_feed_select_policy ON activity_feed
FOR SELECT USING (
  visibility = 'public' OR
  actor_id = auth.uid() OR
  (visibility = 'followers' AND EXISTS (
    SELECT 1 FROM user_follows 
    WHERE following_id = activity_feed.actor_id 
    AND follower_id = auth.uid()
  ))
);
```

### Data Protection

- User emails are anonymized in activity previews
- Sensitive metadata is filtered client-side
- Activity cleanup removes old personal data
- Admin functions use SECURITY DEFINER

## Integration Examples

### Like Button Integration

```typescript
// Existing LikeButton component enhanced with activity tracking
const EnhancedLikeButton: React.FC<{ articleId: string }> = ({ articleId }) => {
  const { trackArticleLike } = useActivityTracking();
  const { likeCount, isLiked, toggleLike } = useLikes({ 
    contentId: articleId,
    contentType: 'article'
  });

  const handleToggle = async () => {
    const newLikedState = await toggleLike();
    
    // Automatically track the activity
    await trackArticleLike(articleId, newLikedState);
  };

  return (
    <IonButton onClick={handleToggle}>
      <IonIcon icon={isLiked ? heart : heartOutline} />
      {likeCount}
    </IonButton>
  );
};
```

### Comment System Integration

```typescript
// Enhanced comment creation with activity tracking
const EnhancedCommentInput: React.FC<{ articleId: string }> = ({ articleId }) => {
  const [content, setContent] = useState('');
  const { trackComment } = useActivityTracking();
  const { addComment } = usePostComments();

  const handleSubmit = async () => {
    const commentId = await addComment(content);
    
    // Track comment activity
    await trackComment(articleId, commentId, content);
    
    setContent('');
  };

  return (
    <div>
      <IonTextarea
        value={content}
        onIonInput={(e) => setContent(e.detail.value!)}
        placeholder="Write a comment..."
      />
      <IonButton onClick={handleSubmit}>
        Post Comment
      </IonButton>
    </div>
  );
};
```

## Troubleshooting

### Common Issues

#### Activities Not Appearing

1. **Check RLS Policies**: Ensure user has permission to view activities
2. **Verify Triggers**: Check if database triggers are firing correctly
3. **Real-time Issues**: Verify Supabase subscription is active
4. **Privacy Settings**: Check if activities match visibility requirements

```sql
-- Debug: Check if activities are being created
SELECT * FROM activity_feed 
WHERE actor_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 10;

-- Debug: Check aggregation
SELECT * FROM activity_aggregates 
ORDER BY last_activity_at DESC 
LIMIT 10;
```

#### Performance Issues

1. **Index Usage**: Verify queries are using indexes efficiently
2. **Aggregation Cleanup**: Run cleanup functions regularly
3. **Subscription Management**: Ensure real-time subscriptions are cleaned up
4. **Batch Size**: Adjust activity batching parameters

```typescript
// Performance monitoring
const { aggregates, isLoading } = useActivityFeed({
  limit: 10, // Reduce initial load
  aggregated: true, // Use pre-computed aggregates
  realTime: false // Disable if not needed
});
```

#### Memory Leaks

1. **Cleanup Subscriptions**: Always clean up real-time subscriptions
2. **Timeout Management**: Clear timeouts in useActivityTracking
3. **Component Unmounting**: Handle component cleanup properly

```typescript
useEffect(() => {
  return () => {
    // Cleanup real-time subscriptions
    subscription?.unsubscribe();
  };
}, []);
```

## Advanced Usage

### Custom Activity Types

Add new activity types by:

1. **Update Database**: Add to CHECK constraint in activity_feed table
2. **Update TypeScript**: Add to ActivityActionType union type
3. **Update Components**: Handle new activity types in UI
4. **Create Tracking**: Add tracking methods for new activities

```sql
-- Add new activity type
ALTER TABLE activity_feed 
DROP CONSTRAINT activity_feed_action_type_check;

ALTER TABLE activity_feed 
ADD CONSTRAINT activity_feed_action_type_check 
CHECK (action_type IN (
  'article_created', 'article_liked', 'article_unliked', 'article_shared',
  'comment_created', 'comment_liked', 'comment_unliked',
  'user_followed', 'user_unfollowed', 'profile_updated',
  'custom_activity_type' -- Your new type
));
```

### Analytics Integration

Track activity metrics:

```typescript
const ActivityAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState({});
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const { data } = await supabase.rpc('get_activity_metrics', {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      });
      setMetrics(data);
    };
    
    fetchMetrics();
  }, []);
  
  return (
    <div>
      <h3>Activity Metrics</h3>
      <p>Total Activities: {metrics.total}</p>
      <p>Most Active Users: {metrics.top_users?.join(', ')}</p>
      <p>Popular Content: {metrics.trending_articles?.length}</p>
    </div>
  );
};
```

This comprehensive activity feed system provides a solid foundation for social interactions in AZReader, with room for customization and expansion based on specific requirements.