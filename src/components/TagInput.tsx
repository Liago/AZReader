import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonItem,
  IonInput,
  IonChip,
  IonIcon,
  IonList,
  IonButton,
  IonText,
  IonSpinner,
} from '@ionic/react';
import {
  closeOutline,
  addOutline,
  checkmarkOutline,
  searchOutline,
} from 'ionicons/icons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  fetchTags,
  createTag,
  selectFilteredTags,
  selectTagsLoading,
  setSearchQuery,
  TagWithStats,
} from '@store/slices/tagsSlice';
import { Tag, TagInsert } from '@common/database-types';
import { useDebouncedCallback } from '@hooks/useDebounce';

export interface TagInputProps {
  selectedTags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  disabled?: boolean;
  userId?: string;
  className?: string;
  mode?: 'input' | 'display'; // input mode shows autocomplete, display mode is read-only
  size?: 'small' | 'medium' | 'large';
}

interface AutocompleteOption {
  tag: TagWithStats;
  isNew: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  selectedTags = [],
  onTagsChange,
  placeholder = 'Add tags...',
  maxTags,
  allowCreate = true,
  disabled = false,
  userId,
  className = '',
  mode = 'input',
  size = 'medium',
}) => {
  const dispatch = useAppDispatch();
  const availableTags = useAppSelector(selectFilteredTags);
  const loading = useAppSelector(selectTagsLoading);
  
  // Local component state
  const [inputValue, setInputValue] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isCreating, setIsCreating] = useState(false);
  
  const inputRef = useRef<HTMLIonInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Get current user ID from auth state if not provided
  const currentUserId = userId || useAppSelector(state => state.auth?.user?.id);

  // Load tags on mount
  useEffect(() => {
    if (currentUserId && mode === 'input') {
      dispatch(fetchTags({ userId: currentUserId }));
    }
  }, [currentUserId, dispatch, mode]);

  // Debounced search function
  const debouncedSearch = useDebouncedCallback(
    (searchTerm: string) => {
      if (searchTerm.trim()) {
        dispatch(setSearchQuery(searchTerm));
      }
      updateAutocompleteOptions(searchTerm);
    },
    300,
    [dispatch, availableTags, selectedTags]
  );

  // Update autocomplete options based on input
  const updateAutocompleteOptions = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setAutocompleteOptions([]);
      setShowAutocomplete(false);
      return;
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    const selectedTagIds = selectedTags.map(tag => tag.id);
    
    // Filter existing tags that match and aren't already selected
    const matchingTags = availableTags.filter(tag =>
      tag.name.toLowerCase().includes(normalizedSearch) &&
      !selectedTagIds.includes(tag.id)
    );

    const options: AutocompleteOption[] = matchingTags.map(tag => ({
      tag,
      isNew: false,
    }));

    // Add "create new tag" option if allowed and no exact match exists
    if (allowCreate && normalizedSearch.length >= 2) {
      const exactMatch = availableTags.find(tag => 
        tag.name.toLowerCase() === normalizedSearch
      );
      
      if (!exactMatch && !selectedTagIds.includes(normalizedSearch)) {
        // Create a temporary tag object for the new option
        const newTagOption: TagWithStats = {
          id: `new-${Date.now()}`,
          name: searchTerm.trim(),
          color: null,
          usage_count: 0,
          created_by: currentUserId || null,
          created_at: null,
          article_count: 0,
        };
        
        options.push({
          tag: newTagOption,
          isNew: true,
        });
      }
    }

    setAutocompleteOptions(options);
    setShowAutocomplete(options.length > 0);
    setSelectedIndex(-1);
  }, [availableTags, selectedTags, allowCreate, currentUserId]);

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    debouncedSearch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showAutocomplete) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < autocompleteOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < autocompleteOptions.length) {
          const selectedOption = autocompleteOptions[selectedIndex];
          if (selectedOption) {
            handleOptionSelect(selectedOption);
          }
        } else if (inputValue.trim() && allowCreate) {
          // Create new tag if no option is selected
          handleCreateNewTag(inputValue.trim());
        }
        break;
      case 'Escape':
        event.preventDefault();
        setShowAutocomplete(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < autocompleteOptions.length) {
          const selectedOption = autocompleteOptions[selectedIndex];
          if (selectedOption) {
            event.preventDefault();
            handleOptionSelect(selectedOption);
          }
        }
        break;
    }
  };

  // Handle option selection
  const handleOptionSelect = async (option: AutocompleteOption) => {
    if (option.isNew) {
      await handleCreateNewTag(option.tag.name);
    } else {
      handleTagAdd(option.tag);
    }
  };

  // Handle creating a new tag
  const handleCreateNewTag = async (tagName: string) => {
    if (isCreating || !currentUserId || !allowCreate) return;

    setIsCreating(true);
    
    try {
      const tagData: TagInsert = {
        name: tagName.trim(),
        color: '#3B82F6', // Default blue color
        usage_count: 0,
        created_by: currentUserId,
      };

      const newTag = await dispatch(createTag(tagData)).unwrap();
      handleTagAdd(newTag);
    } catch (error) {
      console.error('Error creating new tag:', error);
      // Could show a toast notification here
    } finally {
      setIsCreating(false);
    }
  };

  // Handle adding a tag to selection
  const handleTagAdd = (tag: Tag) => {
    if (maxTags && selectedTags.length >= maxTags) {
      return; // Could show a warning here
    }

    const newTags = [...selectedTags, tag];
    onTagsChange?.(newTags);
    
    // Reset input
    setInputValue('');
    setShowAutocomplete(false);
    setSelectedIndex(-1);
    dispatch(setSearchQuery(''));
    
    // Focus back to input
    setTimeout(() => inputRef.current?.setFocus(), 10);
  };

  // Handle removing a tag
  const handleTagRemove = (tagToRemove: Tag) => {
    if (disabled) return;
    
    const newTags = selectedTags.filter(tag => tag.id !== tagToRemove.id);
    onTagsChange?.(newTags);
  };

  // Handle clicking outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.trim() && autocompleteOptions.length > 0) {
      setShowAutocomplete(true);
    }
  };

  // Sanitize input value
  const sanitizeInput = (value: string) => {
    return value
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Render selected tags
  const renderSelectedTags = () => {
    if (!selectedTags.length) return null;

    return (
      <div className="flex flex-wrap gap-1 mb-2">
        {selectedTags.map((tag) => (
          <IonChip
            key={tag.id}
            style={{
              '--background': tag.color || '#3B82F6',
              '--color': '#ffffff',
            }}
            className={`${size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'}`}
          >
            {tag.name}
            {mode === 'input' && !disabled && (
              <IonIcon
                icon={closeOutline}
                onClick={() => handleTagRemove(tag)}
                className="ml-1 cursor-pointer hover:opacity-70"
                style={{ fontSize: '12px' }}
              />
            )}
          </IonChip>
        ))}
      </div>
    );
  };

  // Render autocomplete dropdown
  const renderAutocomplete = () => {
    if (!showAutocomplete || !autocompleteOptions.length || mode === 'display') {
      return null;
    }

    return (
      <div
        ref={autocompleteRef}
        className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
      >
        <IonList>
          {autocompleteOptions.map((option, index) => (
            <IonItem
              key={option.tag.id}
              button
              onClick={() => handleOptionSelect(option)}
              className={`
                cursor-pointer hover:bg-gray-50
                ${selectedIndex === index ? 'bg-blue-50 border-l-4 border-blue-400' : ''}
                ${size === 'small' ? 'py-1' : size === 'large' ? 'py-3' : 'py-2'}
              `}
            >
              <div className="flex items-center w-full">
                <IonIcon
                  icon={option.isNew ? addOutline : checkmarkOutline}
                  className={`mr-2 ${option.isNew ? 'text-green-500' : 'text-blue-500'}`}
                />
                <div className="flex-1">
                  <div className={`font-medium ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'}`}>
                    {option.tag.name}
                  </div>
                  {option.isNew ? (
                    <IonText color="success" className="text-xs">
                      Create new tag
                    </IonText>
                  ) : (
                    <IonText color="medium" className="text-xs">
                      Used {option.tag.article_count} times
                    </IonText>
                  )}
                </div>
              </div>
            </IonItem>
          ))}
        </IonList>
      </div>
    );
  };

  if (mode === 'display') {
    return (
      <div className={`tag-input-display ${className}`}>
        {renderSelectedTags()}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`tag-input-container relative ${className}`}>
      {renderSelectedTags()}
      
      <div className="relative">
        <IonItem className={`${disabled ? 'opacity-50' : ''}`}>
          <IonIcon icon={searchOutline} slot="start" className="text-gray-400" />
          <IonInput
            ref={inputRef}
            value={inputValue}
            placeholder={disabled ? 'Tags disabled' : placeholder}
            disabled={disabled}
            onIonInput={(e) => handleInputChange(sanitizeInput(e.detail.value!))}
            onKeyDown={handleKeyDown}
            onIonFocus={handleInputFocus}
            className={`${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'}`}
          />
          {(loading.createTag || isCreating) && (
            <IonSpinner slot="end" name="crescent" className="w-4 h-4" />
          )}
        </IonItem>

        {renderAutocomplete()}
      </div>

      {maxTags && (
        <div className="text-xs text-gray-500 mt-1">
          {selectedTags.length} / {maxTags} tags
        </div>
      )}
    </div>
  );
};

export default TagInput;