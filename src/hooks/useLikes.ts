import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useCustomToast } from '@hooks/useIonToast';

export interface LikeState {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
}

export interface UseLikesOptions {
  articleId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  enableOptimisticUpdates?: boolean;
  enableToasts?: boolean;
}

export interface UseLikesReturn {
  likeState: LikeState;
  toggleLike: () => Promise<void>;
  refreshLikeState: () => Promise<void>;
}

export const useLikes = ({
  articleId,
  initialLikeCount = 0,
  initialIsLiked = false,
  onLikeChange,
  enableOptimisticUpdates = true,
  enableToasts = true,
}: UseLikesOptions): UseLikesReturn => {
  const [likeState, setLikeState] = useState<LikeState>({
    isLiked: initialIsLiked,
    likeCount: initialLikeCount,
    isLoading: false,
  });

  const userState = useSelector((state: RootState) => state.user);
  const userId = userState.credentials?.user?.id;
  const showToast = useCustomToast();

  // Refresh like state from database
  const refreshLikeState = useCallback(async () => {
    if (!userId || !articleId) return;

    try {
      // Get current article like count and user's like status
      const [articleResponse, likeResponse] = await Promise.all([
        supabase
          .from('articles')
          .select('like_count')
          .eq('id', articleId)
          .single(),
        supabase
          .from('likes')
          .select('id')
          .eq('article_id', articleId)
          .eq('user_id', userId)
          .single()
      ]);

      if (articleResponse.error && articleResponse.error.code !== 'PGRST116') {
        console.error('Error fetching article like count:', articleResponse.error);
        return;
      }

      const currentLikeCount = articleResponse.data?.like_count || 0;
      const isCurrentlyLiked = !likeResponse.error && !!likeResponse.data;

      setLikeState(prev => ({
        ...prev,
        isLiked: isCurrentlyLiked,
        likeCount: currentLikeCount,
      }));

    } catch (error) {
      console.error('Error refreshing like state:', error);
    }
  }, [articleId, userId]);

  // Load initial like state
  useEffect(() => {
    refreshLikeState();
  }, [refreshLikeState]);

  // Toggle like functionality
  const toggleLike = useCallback(async () => {
    if (!userId) {
      if (enableToasts) {
        showToast({
          message: 'Please sign in to like articles',
          color: 'warning',
          duration: 3000,
        });
      }
      return;
    }

    if (likeState.isLoading) return;

    setLikeState(prev => ({ ...prev, isLoading: true }));

    const newIsLiked = !likeState.isLiked;
    const newCount = newIsLiked ? likeState.likeCount + 1 : Math.max(0, likeState.likeCount - 1);

    // Optimistic update
    if (enableOptimisticUpdates) {
      setLikeState(prev => ({
        ...prev,
        isLiked: newIsLiked,
        likeCount: newCount,
      }));
    }

    try {
      if (newIsLiked) {
        // Add like
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            article_id: articleId,
            user_id: userId,
          });

        if (insertError) {
          // Handle unique constraint violation (user already liked)
          if (insertError.code === '23505') {
            console.warn('User has already liked this article');
            await refreshLikeState();
            return;
          }
          throw insertError;
        }

      } else {
        // Remove like
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      }

      // Update article like count in database
      const { error: updateError } = await supabase
        .from('articles')
        .update({ 
          like_count: newCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (updateError) throw updateError;

      // Update state if not using optimistic updates
      if (!enableOptimisticUpdates) {
        setLikeState(prev => ({
          ...prev,
          isLiked: newIsLiked,
          likeCount: newCount,
        }));
      }

      // Call callback
      if (onLikeChange) {
        onLikeChange(newIsLiked, newCount);
      }

      // Show success toast
      if (enableToasts) {
        showToast({
          message: newIsLiked ? 'Article liked!' : 'Like removed',
          color: 'success',
          duration: 1500,
        });
      }

    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert optimistic update on error
      if (enableOptimisticUpdates) {
        setLikeState(prev => ({
          ...prev,
          isLiked: !newIsLiked,
          likeCount: newIsLiked ? likeState.likeCount : likeState.likeCount,
        }));
      }
      
      if (enableToasts) {
        showToast({
          message: 'Failed to update like. Please try again.',
          color: 'danger',
          duration: 3000,
        });
      }
    } finally {
      setLikeState(prev => ({ ...prev, isLoading: false }));
    }
  }, [
    userId, 
    articleId, 
    likeState.isLiked, 
    likeState.likeCount, 
    likeState.isLoading,
    enableOptimisticUpdates,
    enableToasts,
    onLikeChange,
    showToast,
    refreshLikeState
  ]);

  return {
    likeState,
    toggleLike,
    refreshLikeState,
  };
};

export default useLikes;