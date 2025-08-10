import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  selectActiveFilters,
  selectFilterPresets,
  selectActiveFilterCount,
  selectHasActiveFilters,
  selectCanUndo,
  selectCanRedo,
  selectFiltersChanged,
  selectDefaultPreset,
  selectUserPresets,
  applyFilters,
  updateTagSelection,
  updateTagOperator,
  updateDateRange,
  updateReadingStatus,
  updateFavoritesOnly,
  updateSearchQuery,
  updateReadTimeRange,
  updateSorting,
  clearFilters,
  undoFilter,
  redoFilter,
  savePreset,
  deletePreset,
  loadPreset,
  updatePresetDefault,
  setFilterModalOpen,
  markFiltersApplied,
  TagFilters,
  FilterPreset,
  FilterOperator,
  ReadingStatus,
  SortOption,
  SortOrder,
  DateRange,
} from '@store/slices/filtersSlice';
import { Post } from '@store/slices/postsSlice';

export interface UseArticleFiltersReturn {
  // Current state
  filters: TagFilters;
  presets: FilterPreset[];
  activeFilterCount: number;
  hasActiveFilters: boolean;
  canUndo: boolean;
  canRedo: boolean;
  filtersChanged: boolean;
  
  // Filter actions
  updateFilters: (filters: Partial<TagFilters>) => void;
  updateTags: (tagIds: string[]) => void;
  updateTagOperator: (operator: FilterOperator) => void;
  updateDateRange: (range: DateRange, preset?: string) => void;
  updateReadingStatus: (status: ReadingStatus) => void;
  updateFavorites: (favoritesOnly: boolean) => void;
  updateSearch: (query: string) => void;
  updateReadTime: (min: number, max: number) => void;
  updateSorting: (sortBy: SortOption, sortOrder: SortOrder) => void;
  clearAllFilters: () => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  
  // Preset actions
  saveCurrentAsPreset: (name: string) => void;
  deletePresetById: (presetId: string) => void;
  loadPresetById: (presetId: string) => void;
  setPresetAsDefault: (presetId: string) => void;
  
  // Utility functions
  applyFiltersToArticles: (articles: Post[]) => Post[];
  getFilterSummary: () => string;
  exportFilters: () => string;
  importFilters: (filtersJson: string) => boolean;
  
  // UI helpers
  openFilterModal: () => void;
  closeFilterModal: () => void;
  markAsApplied: () => void;
}

export const useArticleFilters = (userId?: string): UseArticleFiltersReturn => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const filters = useAppSelector(selectActiveFilters);
  const allPresets = useAppSelector(selectFilterPresets);
  const activeFilterCount = useAppSelector(selectActiveFilterCount);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const filtersChanged = useAppSelector(selectFiltersChanged);
  const defaultPreset = useAppSelector(selectDefaultPreset);
  
  // Filter presets by user
  const presets = useAppSelector(state => selectUserPresets(state, userId));

  // Filter update actions
  const updateFilters = useCallback((newFilters: Partial<TagFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    dispatch(applyFilters(updatedFilters));
  }, [dispatch, filters]);

  const updateTags = useCallback((tagIds: string[]) => {
    dispatch(updateTagSelection(tagIds));
  }, [dispatch]);

  const updateTagOperatorAction = useCallback((operator: FilterOperator) => {
    dispatch(updateTagOperator(operator));
  }, [dispatch]);

  const updateDateRangeAction = useCallback((range: DateRange, preset?: string) => {
    dispatch(updateDateRange({ range, preset }));
  }, [dispatch]);

  const updateReadingStatusAction = useCallback((status: ReadingStatus) => {
    dispatch(updateReadingStatus(status));
  }, [dispatch]);

  const updateFavorites = useCallback((favoritesOnly: boolean) => {
    dispatch(updateFavoritesOnly(favoritesOnly));
  }, [dispatch]);

  const updateSearch = useCallback((query: string) => {
    dispatch(updateSearchQuery(query));
  }, [dispatch]);

  const updateReadTime = useCallback((min: number, max: number) => {
    dispatch(updateReadTimeRange({ min, max }));
  }, [dispatch]);

  const updateSortingAction = useCallback((sortBy: SortOption, sortOrder: SortOrder) => {
    dispatch(updateSorting({ sortBy, sortOrder }));
  }, [dispatch]);

  const clearAllFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // History actions
  const undo = useCallback(() => {
    dispatch(undoFilter());
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch(redoFilter());
  }, [dispatch]);

  // Preset actions
  const saveCurrentAsPreset = useCallback((name: string) => {
    dispatch(savePreset({ name, filters, userId }));
  }, [dispatch, filters, userId]);

  const deletePresetById = useCallback((presetId: string) => {
    dispatch(deletePreset(presetId));
  }, [dispatch]);

  const loadPresetById = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      dispatch(loadPreset(preset));
    }
  }, [dispatch, presets]);

  const setPresetAsDefault = useCallback((presetId: string) => {
    dispatch(updatePresetDefault({ presetId, isDefault: true }));
  }, [dispatch]);

  // UI helpers
  const openFilterModal = useCallback(() => {
    dispatch(setFilterModalOpen(true));
  }, [dispatch]);

  const closeFilterModal = useCallback(() => {
    dispatch(setFilterModalOpen(false));
  }, [dispatch]);

  const markAsApplied = useCallback(() => {
    dispatch(markFiltersApplied());
  }, [dispatch]);

  // Apply filters to articles array
  const applyFiltersToArticles = useCallback((articles: Post[]): Post[] => {
    if (!hasActiveFilters) {
      return articles.sort((a, b) => {
        const aVal = a[filters.sortBy] || '';
        const bVal = b[filters.sortBy] || '';
        const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
        return aVal < bVal ? -1 * multiplier : aVal > bVal ? 1 * multiplier : 0;
      });
    }

    let filtered = articles.filter(article => {
      // Tag filtering
      if (filters.selectedTagIds.length > 0) {
        const articleTags = Array.isArray(article.tags) ? article.tags : [];
        const hasMatchingTags = filters.tagOperator === 'AND'
          ? filters.selectedTagIds.every(tagId => articleTags.includes(tagId))
          : filters.selectedTagIds.some(tagId => articleTags.includes(tagId));
        
        if (!hasMatchingTags) return false;
      }

      // Date filtering
      if (filters.dateRange.start || filters.dateRange.end) {
        const articleDate = new Date(article.created_at || '');
        if (filters.dateRange.start && articleDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && articleDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      // Reading status filtering
      if (filters.readingStatus !== 'all') {
        const articleStatus = article.reading_status || 'unread';
        if (articleStatus !== filters.readingStatus) return false;
      }

      // Favorites filtering
      if (filters.favouritesOnly && !article.is_favorite) {
        return false;
      }

      // Search query filtering
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          article.title,
          article.excerpt || '',
          article.content || '',
          article.author || '',
          ...(Array.isArray(article.tags) ? article.tags : [])
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }

      // Read time filtering
      if (filters.minReadTime > 0 || filters.maxReadTime < 60) {
        const readTime = article.estimated_read_time || 0;
        if (readTime < filters.minReadTime || readTime > filters.maxReadTime) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy] || '';
      const bVal = b[filters.sortBy] || '';
      const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * multiplier;
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier;
      }
      
      return aVal < bVal ? -1 * multiplier : aVal > bVal ? 1 * multiplier : 0;
    });

    return filtered;
  }, [filters, hasActiveFilters]);

  // Get human-readable filter summary
  const getFilterSummary = useCallback((): string => {
    if (!hasActiveFilters) return 'No filters applied';

    const parts: string[] = [];

    if (filters.selectedTagIds.length > 0) {
      parts.push(`${filters.selectedTagIds.length} tags (${filters.tagOperator})`);
    }

    if (filters.datePreset !== 'all') {
      parts.push(`Date: ${filters.datePreset}`);
    }

    if (filters.readingStatus !== 'all') {
      parts.push(`Status: ${filters.readingStatus}`);
    }

    if (filters.favouritesOnly) {
      parts.push('Favorites only');
    }

    if (filters.searchQuery.trim()) {
      parts.push(`Search: "${filters.searchQuery.substring(0, 20)}..."`);
    }

    if (filters.minReadTime > 0 || filters.maxReadTime < 60) {
      parts.push(`Read time: ${filters.minReadTime}-${filters.maxReadTime}min`);
    }

    return parts.join(', ');
  }, [filters, hasActiveFilters]);

  // Export current filters as JSON
  const exportFilters = useCallback((): string => {
    return JSON.stringify(filters, null, 2);
  }, [filters]);

  // Import filters from JSON string
  const importFilters = useCallback((filtersJson: string): boolean => {
    try {
      const importedFilters = JSON.parse(filtersJson) as TagFilters;
      
      // Basic validation
      if (
        typeof importedFilters === 'object' &&
        Array.isArray(importedFilters.selectedTagIds) &&
        typeof importedFilters.searchQuery === 'string'
      ) {
        dispatch(applyFilters(importedFilters));
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }, [dispatch]);

  return {
    // State
    filters,
    presets,
    activeFilterCount,
    hasActiveFilters,
    canUndo,
    canRedo,
    filtersChanged,
    
    // Filter actions
    updateFilters,
    updateTags,
    updateTagOperator: updateTagOperatorAction,
    updateDateRange: updateDateRangeAction,
    updateReadingStatus: updateReadingStatusAction,
    updateFavorites,
    updateSearch,
    updateReadTime,
    updateSorting: updateSortingAction,
    clearAllFilters,
    
    // History actions
    undo,
    redo,
    
    // Preset actions
    saveCurrentAsPreset,
    deletePresetById,
    loadPresetById,
    setPresetAsDefault,
    
    // Utility functions
    applyFiltersToArticles,
    getFilterSummary,
    exportFilters,
    importFilters,
    
    // UI helpers
    openFilterModal,
    closeFilterModal,
    markAsApplied,
  };
};

export default useArticleFilters;