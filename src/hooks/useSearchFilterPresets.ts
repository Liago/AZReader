import { useState, useEffect, useCallback } from 'react';
import { SearchFilters } from '@services/searchService';
import { FilterPreset } from '@components/SearchFiltersModal';

const PRESETS_STORAGE_KEY = 'azreader_search_filter_presets';
const MAX_PRESETS = 10;

export interface UseSearchFilterPresetsOptions {
  userId?: string;
  maxPresets?: number;
  enableSync?: boolean; // Future: sync with server
}

export interface UseSearchFilterPresetsReturn {
  presets: FilterPreset[];
  loading: boolean;
  error: string | null;
  
  // Actions
  savePreset: (preset: Omit<FilterPreset, 'id' | 'created_at'>) => Promise<string>;
  deletePreset: (presetId: string) => Promise<boolean>;
  updatePreset: (presetId: string, updates: Partial<Omit<FilterPreset, 'id' | 'created_at'>>) => Promise<boolean>;
  loadPreset: (presetId: string) => FilterPreset | null;
  setDefaultPreset: (presetId: string | null) => Promise<boolean>;
  
  // Preset management
  duplicatePreset: (presetId: string, newName: string) => Promise<string | null>;
  exportPresets: () => string;
  importPresets: (jsonData: string) => Promise<number>;
  clearAllPresets: () => Promise<boolean>;
  
  // Quick presets
  getQuickPresets: () => FilterPreset[];
  createQuickPreset: (name: string, filters: Partial<SearchFilters>) => Promise<string>;
}

export const useSearchFilterPresets = (options: UseSearchFilterPresetsOptions = {}): UseSearchFilterPresetsReturn => {
  const {
    userId,
    maxPresets = MAX_PRESETS,
    enableSync = false
  } = options;

  // State
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Load presets from storage
  const loadPresets = useCallback(() => {
    try {
      const storageKey = userId ? `${PRESETS_STORAGE_KEY}_${userId}` : PRESETS_STORAGE_KEY;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        const presetsWithDates = parsed.map((preset: any) => ({
          ...preset,
          created_at: new Date(preset.created_at)
        }));
        setPresets(presetsWithDates);
      } else {
        // Initialize with default presets
        const defaultPresets = getDefaultPresets();
        setPresets(defaultPresets);
        savePresetsToStorage(defaultPresets);
      }
    } catch (err) {
      console.error('Error loading filter presets:', err);
      setError('Failed to load saved filter presets');
    }
  }, [userId]);

  // Save presets to storage
  const savePresetsToStorage = useCallback((presetsToSave: FilterPreset[]) => {
    try {
      const storageKey = userId ? `${PRESETS_STORAGE_KEY}_${userId}` : PRESETS_STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(presetsToSave));
    } catch (err) {
      console.error('Error saving filter presets:', err);
      setError('Failed to save filter presets');
    }
  }, [userId]);

  // Get default presets
  const getDefaultPresets = useCallback((): FilterPreset[] => [
    {
      id: 'default_unread',
      name: 'Unread Articles',
      filters: { includeRead: false, sortBy: 'date' },
      created_at: new Date(),
      is_default: true
    },
    {
      id: 'default_recent',
      name: 'Recent Articles',
      filters: { 
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        sortBy: 'date' 
      },
      created_at: new Date(),
      is_default: true
    },
    {
      id: 'default_favorites',
      name: 'My Favorites',
      filters: { sortBy: 'relevance' }, // Would need to add favorite filter
      created_at: new Date(),
      is_default: true
    }
  ], []);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Save preset
  const savePreset = useCallback(async (preset: Omit<FilterPreset, 'id' | 'created_at'>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      // Check for duplicate names
      if (presets.some(p => p.name.toLowerCase() === preset.name.toLowerCase())) {
        throw new Error('A preset with this name already exists');
      }

      // Check preset limit
      if (presets.length >= maxPresets) {
        throw new Error(`Maximum ${maxPresets} presets allowed`);
      }

      const newPreset: FilterPreset = {
        ...preset,
        id: generateId(),
        created_at: new Date()
      };

      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);

      return newPreset.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save preset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [presets, maxPresets, generateId, savePresetsToStorage]);

  // Delete preset
  const deletePreset = useCallback(async (presetId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const preset = presets.find(p => p.id === presetId);
      if (!preset) {
        throw new Error('Preset not found');
      }

      // Prevent deletion of default presets
      if (preset.is_default) {
        throw new Error('Cannot delete default presets');
      }

      const updatedPresets = presets.filter(p => p.id !== presetId);
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete preset';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [presets, savePresetsToStorage]);

  // Update preset
  const updatePreset = useCallback(async (presetId: string, updates: Partial<Omit<FilterPreset, 'id' | 'created_at'>>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const presetIndex = presets.findIndex(p => p.id === presetId);
      if (presetIndex === -1) {
        throw new Error('Preset not found');
      }

      // Check for duplicate names when renaming
      const currentPreset = presets[presetIndex];
      if (updates.name && updates.name !== currentPreset?.name) {
        if (presets.some(p => p.id !== presetId && p.name.toLowerCase() === updates.name!.toLowerCase())) {
          throw new Error('A preset with this name already exists');
        }
      }

      const updatedPresets = [...presets];
      const currentPresetData = updatedPresets[presetIndex];
      
      if (!currentPresetData) {
        throw new Error('Preset data is corrupted');
      }
      
      updatedPresets[presetIndex] = { 
        id: currentPresetData.id,
        name: updates.name ?? currentPresetData.name,
        filters: updates.filters ?? currentPresetData.filters,
        created_at: currentPresetData.created_at,
        is_default: updates.is_default ?? currentPresetData.is_default
      };
      
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update preset';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [presets, savePresetsToStorage]);

  // Load preset
  const loadPreset = useCallback((presetId: string): FilterPreset | null => {
    return presets.find(p => p.id === presetId) || null;
  }, [presets]);

  // Set default preset
  const setDefaultPreset = useCallback(async (presetId: string | null): Promise<boolean> => {
    try {
      const updatedPresets = presets.map(preset => ({
        ...preset,
        is_default: preset.id === presetId
      }));

      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      return true;
    } catch (err) {
      setError('Failed to set default preset');
      return false;
    }
  }, [presets, savePresetsToStorage]);

  // Duplicate preset
  const duplicatePreset = useCallback(async (presetId: string, newName: string): Promise<string | null> => {
    try {
      const originalPreset = presets.find(p => p.id === presetId);
      if (!originalPreset) {
        throw new Error('Original preset not found');
      }

      const duplicatedPreset = {
        name: newName,
        filters: { ...originalPreset.filters },
        is_default: false
      };

      return await savePreset(duplicatedPreset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate preset');
      return null;
    }
  }, [presets, savePreset]);

  // Export presets
  const exportPresets = useCallback((): string => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userId: userId || 'anonymous',
      presets: presets.filter(p => !p.is_default) // Don't export default presets
    };

    return JSON.stringify(exportData, null, 2);
  }, [presets, userId]);

  // Import presets
  const importPresets = useCallback(async (jsonData: string): Promise<number> => {
    try {
      setLoading(true);
      setError(null);

      const importData = JSON.parse(jsonData);
      
      if (!importData.presets || !Array.isArray(importData.presets)) {
        throw new Error('Invalid preset data format');
      }

      let importedCount = 0;
      const newPresets: FilterPreset[] = [];

      for (const presetData of importData.presets) {
        // Skip if name already exists
        if (presets.some(p => p.name.toLowerCase() === presetData.name.toLowerCase())) {
          continue;
        }

        // Check preset limit
        if (presets.length + newPresets.length >= maxPresets) {
          break;
        }

        const importedPreset: FilterPreset = {
          id: generateId(),
          name: presetData.name,
          filters: presetData.filters,
          created_at: new Date(),
          is_default: false
        };

        newPresets.push(importedPreset);
        importedCount++;
      }

      if (newPresets.length > 0) {
        const updatedPresets = [...presets, ...newPresets];
        setPresets(updatedPresets);
        savePresetsToStorage(updatedPresets);
      }

      return importedCount;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import presets';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [presets, maxPresets, generateId, savePresetsToStorage]);

  // Clear all presets
  const clearAllPresets = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Keep only default presets
      const defaultPresets = getDefaultPresets();
      setPresets(defaultPresets);
      savePresetsToStorage(defaultPresets);

      return true;
    } catch (err) {
      setError('Failed to clear presets');
      return false;
    } finally {
      setLoading(false);
    }
  }, [getDefaultPresets, savePresetsToStorage]);

  // Get quick presets (most used/recent)
  const getQuickPresets = useCallback((): FilterPreset[] => {
    return presets
      .filter(p => !p.is_default)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 3);
  }, [presets]);

  // Create quick preset
  const createQuickPreset = useCallback(async (name: string, filters: Partial<SearchFilters>): Promise<string> => {
    return await savePreset({
      name,
      filters,
      is_default: false
    });
  }, [savePreset]);

  return {
    presets,
    loading,
    error,
    
    // Actions
    savePreset,
    deletePreset,
    updatePreset,
    loadPreset,
    setDefaultPreset,
    
    // Preset management
    duplicatePreset,
    exportPresets,
    importPresets,
    clearAllPresets,
    
    // Quick presets
    getQuickPresets,
    createQuickPreset
  };
};

export default useSearchFilterPresets;