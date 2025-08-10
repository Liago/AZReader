import { useState, useCallback } from 'react';
import { Tag, TagInsert, TagUpdate, Article } from '@common/database-types';
import { supabase } from '@store/rest';

export interface TagWithStats extends Tag {
  article_count?: number;
}

export interface UseTagManagerReturn {
  // State
  tags: TagWithStats[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  loadTags: (userId: string) => Promise<void>;
  createTag: (tagData: TagInsert) => Promise<Tag>;
  updateTag: (tagId: string, updates: TagUpdate) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;

  // Utility functions
  getTagsByIds: (tagIds: string[]) => Tag[];
  getTagUsageCount: (tagId: string) => Promise<number>;
  searchTags: (query: string) => TagWithStats[];
  validateTagName: (name: string, excludeId?: string) => { isValid: boolean; error?: string };

  // Article-tag relationship operations
  addTagsToArticle: (articleId: string, tagIds: string[]) => Promise<void>;
  removeTagsFromArticle: (articleId: string, tagIds: string[]) => Promise<void>;
  getArticleTagIds: (articleId: string) => Promise<string[]>;
  
  // Advanced operations
  mergeTags: (sourceTagId: string, targetTagId: string) => Promise<void>;
  bulkDeleteTags: (tagIds: string[]) => Promise<void>;
}

export const useTagManager = (): UseTagManagerReturn => {
  const [tags, setTags] = useState<TagWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Query tags with article count
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select(`
          *,
          article_tags!inner(count)
        `)
        .eq('created_by', userId)
        .order('usage_count', { ascending: false });

      if (tagsError && tagsError.code !== 'PGRST116') { // Ignore empty result error
        throw tagsError;
      }

      // Process data to include article count
      const tagsWithStats: TagWithStats[] = (tagsData || []).map(tag => ({
        ...tag,
        article_count: tag.article_tags ? tag.article_tags.length : 0,
      }));

      setTags(tagsWithStats);
    } catch (err: any) {
      console.error('Error loading tags:', err);
      setError(err.message || 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = useCallback(async (tagData: TagInsert): Promise<Tag> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([tagData])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newTag: TagWithStats = { ...data, article_count: 0 };
      setTags(prev => [newTag, ...prev]);

      return data;
    } catch (err: any) {
      console.error('Error creating tag:', err);
      throw new Error(err.message || 'Failed to create tag');
    }
  }, []);

  const updateTag = useCallback(async (tagId: string, updates: TagUpdate) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', tagId);

      if (error) throw error;

      // Update local state
      setTags(prev => prev.map(tag =>
        tag.id === tagId ? { ...tag, ...updates } : tag
      ));
    } catch (err: any) {
      console.error('Error updating tag:', err);
      throw new Error(err.message || 'Failed to update tag');
    }
  }, []);

  const deleteTag = useCallback(async (tagId: string) => {
    try {
      // First check if tag is used
      const { data: articleTags, error: checkError } = await supabase
        .from('article_tags')
        .select('id')
        .eq('tag_id', tagId)
        .limit(1);

      if (checkError) throw checkError;

      if (articleTags && articleTags.length > 0) {
        throw new Error('Cannot delete tag that is used by articles');
      }

      // Delete the tag
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      // Remove from local state
      setTags(prev => prev.filter(tag => tag.id !== tagId));
    } catch (err: any) {
      console.error('Error deleting tag:', err);
      throw new Error(err.message || 'Failed to delete tag');
    }
  }, []);

  const getTagsByIds = useCallback((tagIds: string[]): Tag[] => {
    return tags.filter(tag => tagIds.includes(tag.id));
  }, [tags]);

  const getTagUsageCount = useCallback(async (tagId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('article_tags')
        .select('id', { count: 'exact', head: true })
        .eq('tag_id', tagId);

      if (error) throw error;
      return count || 0;
    } catch (err: any) {
      console.error('Error getting tag usage count:', err);
      return 0;
    }
  }, []);

  const searchTags = useCallback((query: string): TagWithStats[] => {
    if (!query.trim()) return tags;
    
    const lowerQuery = query.toLowerCase();
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(lowerQuery)
    );
  }, [tags]);

  const validateTagName = useCallback((name: string, excludeId?: string) => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return { isValid: false, error: 'Tag name is required' };
    }

    if (trimmedName.length < 2) {
      return { isValid: false, error: 'Tag name must be at least 2 characters' };
    }

    if (trimmedName.length > 50) {
      return { isValid: false, error: 'Tag name must be less than 50 characters' };
    }

    // Check for duplicates
    const isDuplicate = tags.some(tag => 
      tag.id !== excludeId && 
      tag.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      return { isValid: false, error: 'A tag with this name already exists' };
    }

    return { isValid: true };
  }, [tags]);

  const addTagsToArticle = useCallback(async (articleId: string, tagIds: string[]) => {
    try {
      // First remove existing tags
      await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', articleId);

      // Add new tags
      const tagInserts = tagIds.map(tagId => ({
        article_id: articleId,
        tag_id: tagId,
      }));

      const { error } = await supabase
        .from('article_tags')
        .insert(tagInserts);

      if (error) throw error;

      // Update usage count for all affected tags
      for (const tagId of tagIds) {
        const newCount = await getTagUsageCount(tagId);
        await supabase
          .from('tags')
          .update({ usage_count: newCount })
          .eq('id', tagId);
      }

      // Refresh local tags data
      // This could be optimized by updating only the affected tags
    } catch (err: any) {
      console.error('Error adding tags to article:', err);
      throw new Error(err.message || 'Failed to add tags to article');
    }
  }, [getTagUsageCount]);

  const removeTagsFromArticle = useCallback(async (articleId: string, tagIds: string[]) => {
    try {
      const { error } = await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', articleId)
        .in('tag_id', tagIds);

      if (error) throw error;

      // Update usage count for all affected tags
      for (const tagId of tagIds) {
        const newCount = await getTagUsageCount(tagId);
        await supabase
          .from('tags')
          .update({ usage_count: newCount })
          .eq('id', tagId);
      }
    } catch (err: any) {
      console.error('Error removing tags from article:', err);
      throw new Error(err.message || 'Failed to remove tags from article');
    }
  }, [getTagUsageCount]);

  const getArticleTagIds = useCallback(async (articleId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('article_tags')
        .select('tag_id')
        .eq('article_id', articleId);

      if (error) throw error;
      return (data || []).map(item => item.tag_id);
    } catch (err: any) {
      console.error('Error getting article tags:', err);
      return [];
    }
  }, []);

  const mergeTags = useCallback(async (sourceTagId: string, targetTagId: string) => {
    try {
      // Get all articles that use the source tag
      const { data: sourceArticleTags, error: sourceError } = await supabase
        .from('article_tags')
        .select('article_id')
        .eq('tag_id', sourceTagId);

      if (sourceError) throw sourceError;

      if (sourceArticleTags && sourceArticleTags.length > 0) {
        // Update all references to use the target tag
        const updates = sourceArticleTags.map(item => ({
          article_id: item.article_id,
          tag_id: targetTagId,
        }));

        // Delete old references
        await supabase
          .from('article_tags')
          .delete()
          .eq('tag_id', sourceTagId);

        // Add new references (handle duplicates)
        for (const update of updates) {
          const { error: insertError } = await supabase
            .from('article_tags')
            .upsert([update], { onConflict: 'article_id,tag_id' });

          if (insertError) console.warn('Merge conflict resolved:', insertError);
        }
      }

      // Delete the source tag
      await deleteTag(sourceTagId);

      // Update usage count for target tag
      const newCount = await getTagUsageCount(targetTagId);
      await supabase
        .from('tags')
        .update({ usage_count: newCount })
        .eq('id', targetTagId);

    } catch (err: any) {
      console.error('Error merging tags:', err);
      throw new Error(err.message || 'Failed to merge tags');
    }
  }, [deleteTag, getTagUsageCount]);

  const bulkDeleteTags = useCallback(async (tagIds: string[]) => {
    try {
      // Check if any tags are in use
      const { data: usedTags, error: checkError } = await supabase
        .from('article_tags')
        .select('tag_id')
        .in('tag_id', tagIds);

      if (checkError) throw checkError;

      const usedTagIds = (usedTags || []).map(item => item.tag_id);
      const unusedTagIds = tagIds.filter(id => !usedTagIds.includes(id));

      if (unusedTagIds.length === 0) {
        throw new Error('Cannot delete tags that are in use');
      }

      // Delete unused tags
      const { error } = await supabase
        .from('tags')
        .delete()
        .in('id', unusedTagIds);

      if (error) throw error;

      // Update local state
      setTags(prev => prev.filter(tag => !unusedTagIds.includes(tag.id)));

      if (usedTagIds.length > 0) {
        throw new Error(`${usedTagIds.length} tags were skipped because they are in use`);
      }
    } catch (err: any) {
      console.error('Error bulk deleting tags:', err);
      throw new Error(err.message || 'Failed to delete tags');
    }
  }, []);

  return {
    tags,
    loading,
    error,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
    getTagsByIds,
    getTagUsageCount,
    searchTags,
    validateTagName,
    addTagsToArticle,
    removeTagsFromArticle,
    getArticleTagIds,
    mergeTags,
    bulkDeleteTags,
  };
};

export default useTagManager;