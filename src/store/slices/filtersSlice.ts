import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store-rtk';

export type FilterOperator = 'AND' | 'OR';
export type ReadingStatus = 'all' | 'unread' | 'reading' | 'completed';
export type SortOption = 'created_at' | 'updated_at' | 'title' | 'estimated_read_time';
export type SortOrder = 'asc' | 'desc';

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface TagFilters {
  // Tag filtering
  selectedTagIds: string[];
  tagOperator: FilterOperator;
  
  // Date filtering
  dateRange: DateRange;
  datePreset: 'all' | 'today' | 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';
  
  // Status filtering
  readingStatus: ReadingStatus;
  favouritesOnly: boolean;
  
  // Content filtering
  searchQuery: string;
  minReadTime: number;
  maxReadTime: number;
  
  // Sorting
  sortBy: SortOption;
  sortOrder: SortOrder;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: TagFilters;
  createdAt: string;
  isDefault?: boolean;
  userId?: string;
}

export interface FiltersState {
  // Current active filters
  active: TagFilters;
  
  // Filter presets
  presets: FilterPreset[];
  
  // UI state
  isFilterModalOpen: boolean;
  activeFilterCount: number;
  
  // Performance optimization
  lastAppliedFilters: TagFilters | null;
  filtersHash: string | null; // Hash of current filters for quick comparison
  
  // History for undo functionality
  filterHistory: TagFilters[];
  historyIndex: number;
  maxHistorySize: number;
}

const defaultFilters: TagFilters = {
  selectedTagIds: [],
  tagOperator: 'OR',
  dateRange: { start: null, end: null },
  datePreset: 'all',
  readingStatus: 'all',
  favouritesOnly: false,
  searchQuery: '',
  minReadTime: 0,
  maxReadTime: 60,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

const initialState: FiltersState = {
  active: defaultFilters,
  presets: [],
  isFilterModalOpen: false,
  activeFilterCount: 0,
  lastAppliedFilters: null,
  filtersHash: null,
  filterHistory: [defaultFilters],
  historyIndex: 0,
  maxHistorySize: 10,
};

// Utility function to calculate filter hash for performance optimization
const calculateFiltersHash = (filters: TagFilters): string => {
  return btoa(JSON.stringify({
    tags: filters.selectedTagIds.sort(),
    op: filters.tagOperator,
    date: filters.dateRange,
    preset: filters.datePreset,
    status: filters.readingStatus,
    fav: filters.favouritesOnly,
    search: filters.searchQuery.trim(),
    readTime: [filters.minReadTime, filters.maxReadTime],
    sort: [filters.sortBy, filters.sortOrder],
  }));
};

// Utility function to count active filters
const countActiveFilters = (filters: TagFilters): number => {
  let count = 0;
  if (filters.selectedTagIds.length > 0) count++;
  if (filters.datePreset !== 'all') count++;
  if (filters.readingStatus !== 'all') count++;
  if (filters.favouritesOnly) count++;
  if (filters.searchQuery.trim()) count++;
  if (filters.minReadTime > 0 || filters.maxReadTime < 60) count++;
  return count;
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Apply complete filter set
    applyFilters: (state, action: PayloadAction<TagFilters>) => {
      const newFilters = action.payload;
      state.active = newFilters;
      state.activeFilterCount = countActiveFilters(newFilters);
      state.filtersHash = calculateFiltersHash(newFilters);
      
      // Add to history if different from current
      const currentFilter = state.filterHistory[state.historyIndex];
      const currentFiltersHash = currentFilter 
        ? calculateFiltersHash(currentFilter) 
        : null;
      
      if (currentFiltersHash !== state.filtersHash) {
        // Remove any history after current index
        state.filterHistory = state.filterHistory.slice(0, state.historyIndex + 1);
        
        // Add new filter state
        state.filterHistory.push(newFilters);
        state.historyIndex = state.filterHistory.length - 1;
        
        // Trim history if exceeds max size
        if (state.filterHistory.length > state.maxHistorySize) {
          state.filterHistory = state.filterHistory.slice(-state.maxHistorySize);
          state.historyIndex = state.filterHistory.length - 1;
        }
      }
    },

    // Update specific filter properties
    updateTagSelection: (state, action: PayloadAction<string[]>) => {
      state.active.selectedTagIds = action.payload;
      state.activeFilterCount = countActiveFilters(state.active);
      state.filtersHash = calculateFiltersHash(state.active);
    },

    updateTagOperator: (state, action: PayloadAction<FilterOperator>) => {
      state.active.tagOperator = action.payload;
      state.filtersHash = calculateFiltersHash(state.active);
    },

    updateDateRange: (state, action: PayloadAction<{ range: DateRange; preset?: string }>) => {
      state.active.dateRange = action.payload.range;
      if (action.payload.preset) {
        state.active.datePreset = action.payload.preset as any;
      }
      state.activeFilterCount = countActiveFilters(state.active);
      state.filtersHash = calculateFiltersHash(state.active);
    },

    updateReadingStatus: (state, action: PayloadAction<ReadingStatus>) => {
      state.active.readingStatus = action.payload;
      state.activeFilterCount = countActiveFilters(state.active);
      state.filtersHash = calculateFiltersHash(state.active);
    },

    updateFavoritesOnly: (state, action: PayloadAction<boolean>) => {
      state.active.favouritesOnly = action.payload;
      state.activeFilterCount = countActiveFilters(state.active);
      state.filtersHash = calculateFiltersHash(state.active);
    },

    updateSearchQuery: (state, action: PayloadAction<string>) => {
      state.active.searchQuery = action.payload;
      state.activeFilterCount = countActiveFilters(state.active);
      state.filtersHash = calculateFiltersHash(state.active);
    },

    updateReadTimeRange: (state, action: PayloadAction<{ min: number; max: number }>) => {
      state.active.minReadTime = action.payload.min;
      state.active.maxReadTime = action.payload.max;
      state.activeFilterCount = countActiveFilters(state.active);
      state.filtersHash = calculateFiltersHash(state.active);
    },

    updateSorting: (state, action: PayloadAction<{ sortBy: SortOption; sortOrder: SortOrder }>) => {
      state.active.sortBy = action.payload.sortBy;
      state.active.sortOrder = action.payload.sortOrder;
      state.filtersHash = calculateFiltersHash(state.active);
    },

    // Clear all filters
    clearFilters: (state) => {
      state.active = { ...defaultFilters };
      state.activeFilterCount = 0;
      state.filtersHash = calculateFiltersHash(defaultFilters);
    },

    // History management
    undoFilter: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        const previousFilter = state.filterHistory[state.historyIndex];
        if (previousFilter) {
          state.active = previousFilter;
          state.activeFilterCount = countActiveFilters(state.active);
          state.filtersHash = calculateFiltersHash(state.active);
        }
      }
    },

    redoFilter: (state) => {
      if (state.historyIndex < state.filterHistory.length - 1) {
        state.historyIndex++;
        const nextFilter = state.filterHistory[state.historyIndex];
        if (nextFilter) {
          state.active = nextFilter;
          state.activeFilterCount = countActiveFilters(state.active);
          state.filtersHash = calculateFiltersHash(state.active);
        }
      }
    },

    // Preset management
    savePreset: (state, action: PayloadAction<{ name: string; filters: TagFilters; userId?: string }>) => {
      const preset: FilterPreset = {
        id: `preset-${Date.now()}`,
        name: action.payload.name,
        filters: action.payload.filters,
        createdAt: new Date().toISOString(),
        userId: action.payload.userId,
      };
      state.presets.push(preset);
    },

    deletePreset: (state, action: PayloadAction<string>) => {
      state.presets = state.presets.filter(preset => preset.id !== action.payload);
    },

    loadPreset: (state, action: PayloadAction<FilterPreset>) => {
      state.active = action.payload.filters;
      state.activeFilterCount = countActiveFilters(state.active);
      state.filtersHash = calculateFiltersHash(state.active);
      
      // Add to history
      state.filterHistory.push(state.active);
      state.historyIndex = state.filterHistory.length - 1;
    },

    updatePresetDefault: (state, action: PayloadAction<{ presetId: string; isDefault: boolean }>) => {
      // Clear all defaults first if setting a new default
      if (action.payload.isDefault) {
        state.presets.forEach(preset => preset.isDefault = false);
      }
      
      const preset = state.presets.find(p => p.id === action.payload.presetId);
      if (preset) {
        preset.isDefault = action.payload.isDefault;
      }
    },

    // UI state management
    setFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isFilterModalOpen = action.payload;
    },

    // Mark filters as applied (for performance tracking)
    markFiltersApplied: (state) => {
      state.lastAppliedFilters = { ...state.active };
    },

    // Initialize with user presets (from server/storage)
    initializePresets: (state, action: PayloadAction<FilterPreset[]>) => {
      state.presets = action.payload;
    },
  },
});

// Export actions
export const {
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
  initializePresets,
} = filtersSlice.actions;

// Selectors
export const selectFilters = (state: RootState) => state.filters;
export const selectActiveFilters = (state: RootState) => state.filters.active;
export const selectFilterPresets = (state: RootState) => state.filters.presets;
export const selectActiveFilterCount = (state: RootState) => state.filters.activeFilterCount;
export const selectIsFilterModalOpen = (state: RootState) => state.filters.isFilterModalOpen;
export const selectFiltersHash = (state: RootState) => state.filters.filtersHash;

// Computed selectors
export const selectHasActiveFilters = (state: RootState) => 
  state.filters.activeFilterCount > 0;

export const selectCanUndo = (state: RootState) => 
  state.filters.historyIndex > 0;

export const selectCanRedo = (state: RootState) => 
  state.filters.historyIndex < state.filters.filterHistory.length - 1;

export const selectFiltersChanged = (state: RootState) => 
  state.filters.filtersHash !== 
  (state.filters.lastAppliedFilters ? calculateFiltersHash(state.filters.lastAppliedFilters) : null);

export const selectDefaultPreset = (state: RootState) => 
  state.filters.presets.find(preset => preset.isDefault);

export const selectUserPresets = (state: RootState, userId?: string) => 
  state.filters.presets.filter(preset => 
    !userId || preset.userId === userId || !preset.userId
  );

export default filtersSlice;