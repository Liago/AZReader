import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/auth-js/dist/module/lib/types";
import { supabase } from "@common/supabase";
import { useCustomToast } from "@hooks/useIonToast";

export interface CommentProfile {
  username: string | null;
  avatar_url: string | null;
  email?: string | null;
  user_id?: string;
}

export interface Comment {
  id: string;
  comment: string;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  parent_id: string | null;
  profiles: CommentProfile;
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

export type SortOrder = 'newest' | 'oldest';
export type CommentFilter = 'all' | 'root-only' | 'replies-only';

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortOrder: SortOrder;
  filter: CommentFilter;
}

interface UsePostCommentsWithPaginationReturn {
  comments: Comment[];
  organizedComments: CommentWithReplies[];
  paginatedComments: CommentWithReplies[];
  commentsCount: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  sortOrder: SortOrder;
  filter: CommentFilter;
  pageSize: number;
  
  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setSortOrder: (order: SortOrder) => void;
  setFilter: (filter: CommentFilter) => void;
  setPageSize: (size: number) => void;
  goToPage: (page: number) => Promise<void>;
  addNewComment: (comment: string, parentId?: string) => Promise<void>;
  deleteExistingComment: (commentId: string) => Promise<void>;
}

export const usePostCommentsWithPagination = (
  postId: string,
  session: Session | null,
  initialOptions: Partial<PaginationOptions> = {}
): UsePostCommentsWithPaginationReturn => {
  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [organizedComments, setOrganizedComments] = useState<CommentWithReplies[]>([]);
  const [paginatedComments, setPaginatedComments] = useState<CommentWithReplies[]>([]);
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Pagination options
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialOptions.pageSize || 20);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialOptions.sortOrder || 'newest');
  const [filter, setFilter] = useState<CommentFilter>(initialOptions.filter || 'all');
  
  const showToast = useCustomToast();

  // Computed values
  const totalPages = Math.ceil(commentsCount / pageSize);
  const hasMore = currentPage < totalPages;

  // Organize comments into hierarchy
  const organizeCommentsHierarchy = useCallback((flatComments: Comment[]): CommentWithReplies[] => {
    const commentMap: Record<string, CommentWithReplies> = {};
    const rootComments: CommentWithReplies[] = [];

    // First pass: populate comment map
    flatComments.forEach((comment) => {
      commentMap[comment.id] = {
        ...comment,
        replies: [],
      };
    });

    // Second pass: organize hierarchy
    flatComments.forEach((comment) => {
      const commentWithReplies = commentMap[comment.id] as CommentWithReplies;

      if (comment.parent_id && comment.parent_id in commentMap) {
        const parentComment = commentMap[comment.parent_id] as CommentWithReplies;
        parentComment.replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  }, []);

  // Apply filters to organized comments
  const applyFilters = useCallback((organizedComments: CommentWithReplies[]): CommentWithReplies[] => {
    switch (filter) {
      case 'root-only':
        return organizedComments.map(comment => ({
          ...comment,
          replies: [] // Remove replies for root-only view
        }));
      case 'replies-only':
        // Extract all replies from all root comments
        const allReplies: CommentWithReplies[] = [];
        const extractReplies = (comments: CommentWithReplies[]) => {
          comments.forEach(comment => {
            allReplies.push(...comment.replies);
            extractReplies(comment.replies);
          });
        };
        extractReplies(organizedComments);
        return allReplies;
      case 'all':
      default:
        return organizedComments;
    }
  }, [filter]);

  // Fetch comments with pagination
  const fetchComments = useCallback(async (
    page: number = 1, 
    append: boolean = false
  ) => {
    if (!postId) {
      console.error("fetchComments: postId missing");
      return;
    }

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Calculate offset
      const offset = (page - 1) * pageSize;
      
      // Build query based on current settings
      let query = supabase
        .from("posts_comments")
        .select(`
          id,
          comment,
          created_at,
          updated_at,
          user_id,
          parent_id,
          post_id
        `)
        .eq("post_id", postId)
        .is("deleted_at", null);

      // Apply sorting
      query = query.order("created_at", { 
        ascending: sortOrder === 'oldest' 
      });

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Get user profiles for the comments
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(comment => comment.user_id))];
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, email')
          .in('id', userIds);

        if (profileError) {
          console.warn('Could not fetch user profiles:', profileError);
        }

        // Create profiles map
        const profilesMap: Record<string, CommentProfile> = {};
        profiles?.forEach(profile => {
          profilesMap[profile.id] = {
            username: profile.username,
            avatar_url: profile.avatar_url,
            email: profile.email,
            user_id: profile.id
          };
        });

        // Attach profiles to comments
        const commentsWithProfiles: Comment[] = data.map(comment => ({
          ...comment,
          profiles: profilesMap[comment.user_id] || {
            username: null,
            avatar_url: null,
            email: null,
            user_id: comment.user_id
          }
        }));

        if (append && page > 1) {
          // Append to existing comments
          setComments(prev => [...prev, ...commentsWithProfiles]);
        } else {
          // Replace comments (fresh load)
          setComments(commentsWithProfiles);
          setCurrentPage(page);
        }

        // Organize into hierarchy
        const allComments = append && page > 1 
          ? [...comments, ...commentsWithProfiles]
          : commentsWithProfiles;
        
        const organized = organizeCommentsHierarchy(allComments);
        setOrganizedComments(organized);

        // Apply filters and set paginated view
        const filtered = applyFilters(organized);
        setPaginatedComments(filtered);
      }

    } catch (err) {
      console.error("Error fetching comments:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch comments"));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [postId, pageSize, sortOrder, organizeCommentsHierarchy, applyFilters, comments]);

  // Fetch comments count
  const fetchCommentsCount = useCallback(async () => {
    if (!postId) return;

    try {
      let countQuery = supabase
        .from("posts_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId)
        .is("deleted_at", null);

      // Apply filter to count
      if (filter === 'root-only') {
        countQuery = countQuery.is('parent_id', null);
      } else if (filter === 'replies-only') {
        countQuery = countQuery.not('parent_id', 'is', null);
      }

      const { count, error } = await countQuery;
      
      if (error) throw error;
      setCommentsCount(count || 0);
    } catch (err) {
      console.error("Error fetching comments count:", err);
    }
  }, [postId, filter]);

  // Load more comments (next page)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await fetchComments(currentPage + 1, true);
  }, [hasMore, isLoadingMore, currentPage, fetchComments]);

  // Refresh comments (reload from first page)
  const refresh = useCallback(async () => {
    setCurrentPage(1);
    await Promise.all([
      fetchComments(1, false),
      fetchCommentsCount()
    ]);
  }, [fetchComments, fetchCommentsCount]);

  // Go to specific page
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages) return;
    await fetchComments(page, false);
  }, [totalPages, fetchComments]);

  // Add new comment
  const addNewComment = useCallback(async (comment: string, parentId?: string) => {
    if (!session?.user) {
      showToast({
        message: "You must be logged in to comment",
        color: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('posts_comments')
        .insert({
          post_id: postId,
          user_id: session.user.id,
          comment: comment.trim(),
          parent_id: parentId || null
        });

      if (error) throw error;

      showToast({
        message: "Comment added successfully",
        color: "success",
        duration: 2000,
      });

      // Refresh to show new comment
      await refresh();
      
    } catch (err) {
      console.error("Error adding comment:", err);
      showToast({
        message: "Failed to add comment",
        color: "danger",
        duration: 3000,
      });
      throw err;
    }
  }, [session, postId, refresh, showToast]);

  // Delete comment
  const deleteExistingComment = useCallback(async (commentId: string) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from('posts_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      showToast({
        message: "Comment deleted successfully",
        color: "success",
        duration: 2000,
      });

      await refresh();
      
    } catch (err) {
      console.error("Error deleting comment:", err);
      showToast({
        message: "Failed to delete comment",
        color: "danger",
        duration: 3000,
      });
      throw err;
    }
  }, [session, refresh, showToast]);

  // Update sort order
  const handleSetSortOrder = useCallback((order: SortOrder) => {
    setSortOrder(order);
    setCurrentPage(1);
  }, []);

  // Update filter
  const handleSetFilter = useCallback((newFilter: CommentFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  }, []);

  // Update page size
  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Load initial data
  useEffect(() => {
    if (postId) {
      refresh();
    }
  }, [postId, refresh]);

  // Refresh when sort order or filter changes
  useEffect(() => {
    if (postId && (comments.length > 0 || currentPage === 1)) {
      refresh();
    }
  }, [sortOrder, filter, pageSize]);

  return {
    comments,
    organizedComments,
    paginatedComments,
    commentsCount,
    totalPages,
    currentPage,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    sortOrder,
    filter,
    pageSize,
    
    // Actions
    loadMore,
    refresh,
    setSortOrder: handleSetSortOrder,
    setFilter: handleSetFilter,
    setPageSize: handleSetPageSize,
    goToPage,
    addNewComment,
    deleteExistingComment,
  };
};