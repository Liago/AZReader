# Privacy Controls & Deep Link Sharing - Integration Guide

This guide shows how to integrate the new privacy controls and sharing features into existing AZReader components.

## Overview

Task 11.6 implements:
- ✅ Toggle for public/private articles (`PrivacyToggle`)
- ✅ Deep link system (`azreader://article/{id}`)
- ✅ Sharing component with Capacitor Share API (`ShareButton`)
- ✅ Privacy permission management (`usePrivacy`)
- ✅ Mobile deep link validation (existing in `App.tsx`)

## Quick Integration

### 1. Article Component with Privacy & Sharing

```tsx
import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonButtons } from '@ionic/react';
import { PrivacyToggle, ShareButton } from '@components';
import { usePrivacy } from '@hooks/usePrivacy';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    content: string;
    user_id: string;
    is_public: boolean;
  };
  currentUserId?: string;
  isOwner?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  currentUserId, 
  isOwner = false 
}) => {
  const { canView, canShare } = usePrivacy({
    contentId: article.id,
    contentType: 'article',
    userId: article.user_id,
  });

  return (
    <IonCard>
      <IonCardHeader>
        <div className="flex justify-between items-start">
          <IonCardTitle>{article.title}</IonCardTitle>
          
          {/* Owner Controls */}
          {isOwner && (
            <div className="flex items-center space-x-2">
              <PrivacyToggle
                contentId={article.id}
                contentType="article"
                userId={article.user_id}
                showLabel={false}
                size="small"
                onPrivacyChange={(isPublic, level) => {
                  console.log(`Article privacy changed to: ${level}`);
                }}
              />
              
              <ShareButton
                contentId={article.id}
                contentType="article"
                title={article.title}
                description={`${article.content.substring(0, 100)}...`}
                userId={article.user_id}
                size="small"
                showLabel={false}
                onShareComplete={(method, success) => {
                  console.log(`Shared via ${method}:`, success);
                }}
              />
            </div>
          )}
        </div>
      </IonCardHeader>
      
      <IonCardContent>
        <p>{article.content}</p>
        
        {/* Public sharing for non-owners */}
        {!isOwner && article.is_public && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <ShareButton
              contentId={article.id}
              contentType="article"
              title={article.title}
              description={`${article.content.substring(0, 100)}...`}
              userId={article.user_id}
              showLabel={true}
              size="small"
            />
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default ArticleCard;
```

### 2. Settings Page with Privacy Controls

```tsx
import React from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { PrivacyToggle } from '@components';
import { usePrivacy } from '@hooks/usePrivacy';

const PrivacySettings: React.FC = () => {
  const { settings, updateSettings } = usePrivacy({
    contentType: 'user_profile',
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Privacy Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="p-4">
          {/* Profile Privacy */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Profile Visibility</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <PrivacyToggle
                contentId={currentUserId}
                contentType="user_profile"
                showDetails={true}
                showLabel={true}
                onPrivacyChange={(isPublic, level) => {
                  updateSettings({ profile_visibility: level });
                }}
              />
            </IonCardContent>
          </IonCard>

          {/* Default Article Privacy */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Default Article Privacy</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p className="text-sm text-gray-600 mb-4">
                Choose the default privacy level for new articles.
              </p>
              
              <IonList>
                <IonItem>
                  <IonLabel>
                    <h3>Articles Default Privacy</h3>
                    <p>New articles will use this privacy level</p>
                  </IonLabel>
                  <div slot="end">
                    <PrivacyToggle
                      contentId="default"
                      contentType="article"
                      showDetails={false}
                      size="small"
                      onPrivacyChange={(isPublic, level) => {
                        updateSettings({ articles_default: level });
                      }}
                    />
                  </div>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Interaction Settings */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Interaction Privacy</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel>
                    <h3>Comments</h3>
                    <p>Who can comment on your content</p>
                  </IonLabel>
                  <select 
                    slot="end" 
                    value={settings?.allow_comments_from || 'everyone'}
                    onChange={(e) => updateSettings({ 
                      allow_comments_from: e.target.value as any 
                    })}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="followers_only">Followers Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </IonItem>
                
                <IonItem>
                  <IonLabel>
                    <h3>Likes</h3>
                    <p>Who can like your content</p>
                  </IonLabel>
                  <select 
                    slot="end" 
                    value={settings?.allow_likes_from || 'everyone'}
                    onChange={(e) => updateSettings({ 
                      allow_likes_from: e.target.value as any 
                    })}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="followers_only">Followers Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacySettings;
```

### 3. Comment Component with Privacy Checks

```tsx
import React, { useState } from 'react';
import { IonItem, IonLabel, IonButton, IonIcon, IonText } from '@ionic/react';
import { heart, heartOutline, chatbubble, share, lock } from 'ionicons/icons';
import { ShareButton } from '@components';
import { usePrivacy } from '@hooks/usePrivacy';
import { useLikes } from '@hooks/useLikes';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    user_id: string;
    article_id: string;
    created_at: string;
    likes_count: number;
  };
  currentUserId?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId }) => {
  const { canLike, canShare } = usePrivacy({
    contentId: comment.article_id,
    contentType: 'article',
  });
  
  const { likeCount, isLiked, toggleLike } = useLikes({
    contentId: comment.id,
    contentType: 'comment',
    initialCount: comment.likes_count,
  });

  const [canLikeComment, setCanLikeComment] = useState(false);
  const [canShareComment, setCanShareComment] = useState(false);

  React.useEffect(() => {
    const checkPermissions = async () => {
      if (currentUserId) {
        setCanLikeComment(await canLike(currentUserId));
        setCanShareComment(await canShare());
      }
    };
    checkPermissions();
  }, [currentUserId, canLike, canShare]);

  const handleLike = async () => {
    if (canLikeComment) {
      await toggleLike();
    }
  };

  return (
    <IonItem>
      <IonLabel>
        <p className="text-sm">{comment.content}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <IonButton
              fill="clear"
              size="small"
              onClick={handleLike}
              disabled={!canLikeComment}
              className="flex items-center"
            >
              <IonIcon 
                icon={isLiked ? heart : heartOutline} 
                className={isLiked ? 'text-red-500' : 'text-gray-500'}
              />
              <span className="ml-1 text-xs">{likeCount}</span>
              {!canLikeComment && <IonIcon icon={lock} className="ml-1 text-xs" />}
            </IonButton>

            {/* Reply Button */}
            <IonButton fill="clear" size="small">
              <IonIcon icon={chatbubble} className="text-gray-500" />
              <span className="ml-1 text-xs">Reply</span>
            </IonButton>
          </div>

          {/* Share Button */}
          {canShareComment ? (
            <ShareButton
              contentId={comment.article_id}
              contentType="article"
              title={`Comment on article`}
              description={comment.content}
              userId={comment.user_id}
              size="small"
              showLabel={false}
              showModal={false}
            />
          ) : (
            <IonIcon icon={lock} className="text-gray-400 text-sm" />
          )}
        </div>
      </IonLabel>
    </IonItem>
  );
};

export default CommentItem;
```

## Deep Link Integration

### Existing Deep Link Handler (App.tsx)

The deep link handling is already implemented in `App.tsx` around line 200:

```tsx
// Deep link handling for azreader://article/{id}
useEffect(() => {
  const handleAppUrlOpen = (event: any) => {
    const url = event.url;
    if (url.startsWith('azreader://article/')) {
      const articleId = url.split('/').pop();
      if (articleId) {
        history.push(`/article/${articleId}`);
      }
    }
  };

  App.addListener('appUrlOpen', handleAppUrlOpen);

  return () => {
    App.removeAllListeners();
  };
}, [history]);
```

### Testing Deep Links

1. **iOS Simulator**: 
```bash
xcrun simctl openurl booted "azreader://article/123"
```

2. **Android Emulator**:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "azreader://article/123" com.azreader.app
```

3. **Web Testing** (will fallback to web URL):
```javascript
// Test in browser console
window.open('azreader://article/123');
```

## Privacy Permission Examples

### Content Visibility Check

```tsx
import { usePrivacy } from '@hooks/usePrivacy';

const ArticleView: React.FC<{ articleId: string }> = ({ articleId }) => {
  const { canView, isPublic, isLoading } = usePrivacy({
    contentId: articleId,
    contentType: 'article',
  });

  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const access = await canView(currentUserId);
      setHasAccess(access);
    };
    checkAccess();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  
  if (!hasAccess) {
    return (
      <div className="text-center p-8">
        <IonIcon icon={lock} className="text-4xl text-gray-400 mb-4" />
        <h3>Private Content</h3>
        <p>This article is private and cannot be viewed.</p>
      </div>
    );
  }

  return <ArticleContent articleId={articleId} />;
};
```

### Conditional Sharing

```tsx
const ArticleActions: React.FC = ({ article }) => {
  const { canShare, generateDeepLink } = usePrivacy({
    contentId: article.id,
    contentType: 'article',
  });

  const [canShareContent, setCanShareContent] = useState(false);

  useEffect(() => {
    const checkSharing = async () => {
      setCanShareContent(await canShare());
    };
    checkSharing();
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div>
        <LikeButton articleId={article.id} />
        <CommentButton articleId={article.id} />
      </div>
      
      {canShareContent ? (
        <ShareButton
          contentId={article.id}
          contentType="article"
          title={article.title}
          onShareComplete={(method, success) => {
            if (success) {
              // Track sharing analytics
              console.log(`Article shared via ${method}`);
            }
          }}
        />
      ) : (
        <IonButton disabled fill="clear" size="small">
          <IonIcon icon={lock} />
          Private
        </IonButton>
      )}
    </div>
  );
};
```

## Error Handling & Edge Cases

### Network Errors

```tsx
const SocialActions: React.FC = ({ contentId }) => {
  const { error, isLoading } = usePrivacy({ contentId });
  
  if (error) {
    return (
      <div className="text-red-600 text-sm">
        <IonIcon icon={warning} className="mr-1" />
        Privacy settings unavailable
      </div>
    );
  }
  
  return (
    <div className={isLoading ? 'opacity-50' : ''}>
      <PrivacyToggle contentId={contentId} />
      <ShareButton contentId={contentId} />
    </div>
  );
};
```

### Offline Handling

```tsx
const OfflineShareButton: React.FC = ({ contentId }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { generateDeepLink, generateShareUrl } = usePrivacy({ contentId });
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!isOnline) {
    return (
      <IonButton 
        onClick={() => {
          // Copy link to clipboard for later sharing
          const link = generateDeepLink();
          navigator.clipboard.writeText(link);
        }}
        size="small"
        fill="outline"
      >
        <IonIcon icon={copy} />
        Copy Link
      </IonButton>
    );
  }
  
  return <ShareButton contentId={contentId} />;
};
```

## Testing Integration

### Unit Tests Example

```tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { usePrivacy } from '@hooks/usePrivacy';

describe('usePrivacy Integration', () => {
  test('generates correct deep links', () => {
    const { result } = renderHook(() => usePrivacy({
      contentId: '123',
      contentType: 'article',
    }));
    
    expect(result.current.generateDeepLink()).toBe('azreader://article/123');
  });
  
  test('privacy changes affect sharing', async () => {
    const { result } = renderHook(() => usePrivacy({
      contentId: '123',
      contentType: 'article',
    }));
    
    // Initially private
    expect(await result.current.canShare()).toBe(false);
    
    // Make public
    await act(async () => {
      await result.current.setPrivacyLevel('public');
    });
    
    expect(await result.current.canShare()).toBe(true);
  });
});
```

This integration guide demonstrates how to use the privacy controls and sharing features together in real AZReader components, with proper error handling and edge cases covered.