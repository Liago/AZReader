import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store-rtk';
import { Tag, TagInsert, TagUpdate } from '@common/database-types';
import { supabase } from '@store/rest';

// Extended tag interface with statistics
export interface TagWithStats extends Tag {
  article_count: number;
}

export interface TagsState {
  // Tags data
  items: TagWithStats[];
  selectedTags: string[]; // For multi-selection UI
  
  // UI state
  searchQuery: string;
  sortBy: 'name' | 'usage_count' | 'created_at';
  sortOrder: 'asc' | 'desc';
  
  // Loading states
  loading: {
    fetchTags: boolean;
    createTag: boolean;
    updateTag: boolean;
    deleteTag: boolean;
  };
  
  // Error handling
  errors: {
    fetch: string | null;
    create: string | null;
    update: string | null;
    delete: string | null;
  };

  // Cache and optimization
  lastFetch: string | null;
  cacheExpiry: number; // milliseconds
}

const initialState: TagsState = {
  items: [],
  selectedTags: [],
  searchQuery: '',
  sortBy: 'usage_count',
  sortOrder: 'desc',
  loading: {
    fetchTags: false,
    createTag: false,
    updateTag: false,
    deleteTag: false,
  },
  errors: {
    fetch: null,
    create: null,
    update: null,
    delete: null,
  },
  lastFetch: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

// Async thunks for API operations
export const fetchTags = createAsyncThunk(
  'tags/fetchTags',
  async (params: { userId: string; forceRefresh?: boolean } = { userId: '', forceRefresh: false }) => {
    const { userId, forceRefresh } = params;

    // Query tags with article count using a proper join
    const { data: tagsData, error } = await supabase
      .from('tags')
      .select(`
        *,
        article_count:article_tags(count)
      `)
      .eq('created_by', userId)
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Process data to include article count
    const tagsWithStats: TagWithStats[] = (tagsData || []).map(tag => ({
      ...tag,
      article_count: tag.article_count?.[0]?.count || 0,
    }));

    return tagsWithStats;
  }
);

export const createTag = createAsyncThunk(
  'tags/createTag',
  async (tagData: TagInsert) => {
    const { data, error } = await supabase
      .from('tags')
      .insert([{
        ...tagData,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Return with initial article count of 0
    return { ...data, article_count: 0 } as TagWithStats;
  }
);

export const updateTag = createAsyncThunk(
  'tags/updateTag',
  async ({ id, updates }: { id: string; updates: TagUpdate }) => {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Tag;
  }
);

export const deleteTag = createAsyncThunk(
  'tags/deleteTag',
  async (tagId: string, { rejectWithValue }) => {
    try {
      // Check if tag is used
      const { data: articleTags, error: checkError } = await supabase
        .from('article_tags')
        .select('id')
        .eq('tag_id', tagId)
        .limit(1);

      if (checkError) throw checkError;

      if (articleTags && articleTags.length > 0) {
        return rejectWithValue('Cannot delete tag that is used by articles');
      }

      // Delete the tag
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      return tagId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete tag');
    }
  }
);

export const bulkDeleteTags = createAsyncThunk(
  'tags/bulkDeleteTags',
  async (tagIds: string[], { rejectWithValue }) => {
    try {
      // Check which tags are in use
      const { data: usedTags, error: checkError } = await supabase
        .from('article_tags')
        .select('tag_id')
        .in('tag_id', tagIds);

      if (checkError) throw checkError;

      const usedTagIds = (usedTags || []).map(item => item.tag_id);
      const unusedTagIds = tagIds.filter(id => !usedTagIds.includes(id));

      if (unusedTagIds.length === 0) {
        return rejectWithValue('Cannot delete tags that are in use');
      }

      // Delete unused tags
      const { error } = await supabase
        .from('tags')
        .delete()
        .in('id', unusedTagIds);

      if (error) throw error;

      return {
        deletedIds: unusedTagIds,
        skippedIds: usedTagIds,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete tags');
    }
  }
);

// Create the slice
const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    // Search and filtering
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSortOptions: (state, action: PayloadAction<{ sortBy: TagsState['sortBy']; sortOrder: TagsState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },

    // Tag selection
    selectTag: (state, action: PayloadAction<string>) => {
      const tagId = action.payload;
      if (!state.selectedTags.includes(tagId)) {
        state.selectedTags.push(tagId);
      }
    },

    deselectTag: (state, action: PayloadAction<string>) => {
      state.selectedTags = state.selectedTags.filter(id => id !== action.payload);
    },

    toggleTagSelection: (state, action: PayloadAction<string>) => {
      const tagId = action.payload;
      if (state.selectedTags.includes(tagId)) {
        state.selectedTags = state.selectedTags.filter(id => id !== tagId);
      } else {
        state.selectedTags.push(tagId);
      }
    },

    selectAllTags: (state) => {
      state.selectedTags = state.items.map(tag => tag.id);
    },

    clearSelection: (state) => {
      state.selectedTags = [];
    },

    // Local updates
    updateLocalTag: (state, action: PayloadAction<{ id: string; updates: Partial<TagWithStats> }>) => {
      const { id, updates } = action.payload;
      const tagIndex = state.items.findIndex(tag => tag.id === id);
      if (tagIndex !== -1) {
        const currentTag = state.items[tagIndex];
        if (currentTag) {
          state.items[tagIndex] = { 
            ...currentTag, 
            ...updates,
            article_count: updates.article_count ?? currentTag.article_count
          };
        }
      }
    },

    // Error management
    clearErrors: (state) => {
      state.errors = initialState.errors;
    },

    clearError: (state, action: PayloadAction<keyof TagsState['errors']>) => {
      state.errors[action.payload] = null;
    },

    // Cache management
    invalidateCache: (state) => {
      state.lastFetch = null;
    },
  },

  extraReducers: (builder) => {
    // Fetch tags
    builder
      .addCase(fetchTags.pending, (state) => {
        state.loading.fetchTags = true;
        state.errors.fetch = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading.fetchTags = false;
        state.items = action.payload;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading.fetchTags = false;
        state.errors.fetch = action.error.message || 'Failed to fetch tags';
      })

    // Create tag
    builder
      .addCase(createTag.pending, (state) => {
        state.loading.createTag = true;
        state.errors.create = null;
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.loading.createTag = false;
        state.items.unshift(action.payload);
      })
      .addCase(createTag.rejected, (state, action) => {
        state.loading.createTag = false;
        state.errors.create = action.error.message || 'Failed to create tag';
      })

    // Update tag
    builder
      .addCase(updateTag.pending, (state) => {
        state.loading.updateTag = true;
        state.errors.update = null;
      })
      .addCase(updateTag.fulfilled, (state, action) => {
        state.loading.updateTag = false;
        const updatedTag = action.payload;
        const index = state.items.findIndex(tag => tag.id === updatedTag.id);
        if (index !== -1) {
          // Preserve article_count when updating
          const currentTag = state.items[index];
          if (currentTag) {
            state.items[index] = { 
              ...currentTag, 
              ...updatedTag,
              article_count: currentTag.article_count 
            };
          }
        }
      })
      .addCase(updateTag.rejected, (state, action) => {
        state.loading.updateTag = false;
        state.errors.update = action.error.message || 'Failed to update tag';
      })

    // Delete tag
    builder
      .addCase(deleteTag.pending, (state) => {
        state.loading.deleteTag = true;
        state.errors.delete = null;
      })
      .addCase(deleteTag.fulfilled, (state, action) => {
        state.loading.deleteTag = false;
        const deletedTagId = action.payload;
        state.items = state.items.filter(tag => tag.id !== deletedTagId);
        state.selectedTags = state.selectedTags.filter(id => id !== deletedTagId);
      })
      .addCase(deleteTag.rejected, (state, action) => {
        state.loading.deleteTag = false;
        state.errors.delete = action.payload as string || 'Failed to delete tag';
      })

    // Bulk delete tags
    builder
      .addCase(bulkDeleteTags.pending, (state) => {
        state.loading.deleteTag = true;
        state.errors.delete = null;
      })
      .addCase(bulkDeleteTags.fulfilled, (state, action) => {
        state.loading.deleteTag = false;
        const { deletedIds, skippedIds } = action.payload;
        state.items = state.items.filter(tag => !deletedIds.includes(tag.id));
        state.selectedTags = state.selectedTags.filter(id => !deletedIds.includes(id));
        
        // Set warning if some tags were skipped
        if (skippedIds.length > 0) {
          state.errors.delete = `${skippedIds.length} tags were skipped because they are in use`;
        }
      })
      .addCase(bulkDeleteTags.rejected, (state, action) => {
        state.loading.deleteTag = false;
        state.errors.delete = action.payload as string || 'Failed to delete tags';
      });
  },
});

// Export actions
export const {
  setSearchQuery,
  setSortOptions,
  selectTag,
  deselectTag,
  toggleTagSelection,
  selectAllTags,
  clearSelection,
  updateLocalTag,
  clearErrors,
  clearError,
  invalidateCache,
} = tagsSlice.actions;

// Selectors
export const selectTagsState = (state: RootState) => state.tags;
export const selectTags = (state: RootState) => state.tags.items;
export const selectSelectedTags = (state: RootState) => state.tags.selectedTags;
export const selectTagsLoading = (state: RootState) => state.tags.loading;
export const selectTagsErrors = (state: RootState) => state.tags.errors;

// Computed selectors
export const selectFilteredTags = (state: RootState) => {
  const { items, searchQuery, sortBy, sortOrder } = state.tags;
  
  let filtered = items;
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(tag =>
      tag.name.toLowerCase().includes(query)
    );
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortBy) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'usage_count':
        aVal = a.usage_count || 0;
        bVal = b.usage_count || 0;
        break;
      case 'created_at':
        aVal = a.created_at || '';
        bVal = b.created_at || '';
        break;
      default:
        return 0;
    }
    
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    if (aVal < bVal) return -1 * multiplier;
    if (aVal > bVal) return 1 * multiplier;
    return 0;
  });
  
  return filtered;
};

export const selectTagById = (state: RootState, tagId: string) =>
  state.tags.items.find(tag => tag.id === tagId) || null;

export const selectTagsByIds = (state: RootState, tagIds: string[]) =>
  state.tags.items.filter(tag => tagIds.includes(tag.id));

export const selectTagsNeedRefresh = (state: RootState) => {
  if (!state.tags.lastFetch) return true;
  
  const lastFetchTime = new Date(state.tags.lastFetch).getTime();
  const now = Date.now();
  
  return (now - lastFetchTime) > state.tags.cacheExpiry;
};

export default tagsSlice;