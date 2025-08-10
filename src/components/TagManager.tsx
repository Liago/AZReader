import React, { useState, useEffect, useCallback } from 'react';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonSearchbar,
  IonAlert,
  IonToast,
  IonSpinner,
} from '@ionic/react';
import {
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  checkmarkOutline,
  reorderThreeOutline
} from 'ionicons/icons';
import { Tag, TagInsert, TagUpdate } from '@common/database-types';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { 
  fetchTags, 
  createTag, 
  updateTag, 
  deleteTag,
  setSearchQuery,
  selectFilteredTags,
  selectTagsLoading,
  selectTagsErrors,
  clearError,
  TagWithStats,
  selectTagsState
} from '@store/slices/tagsSlice';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags?: string[]; // For integration with article editing
  onTagsSelected?: (tags: Tag[]) => void;
  mode?: 'select' | 'manage';
  userId?: string;
}


const predefinedColors = [
  '#3B82F6', // blue
  '#EF4444', // red  
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#EC4899', // pink
  '#6B7280', // gray
] as const;

const defaultColor = predefinedColors[0];

const TagManager: React.FC<TagManagerProps> = ({
  isOpen,
  onClose,
  selectedTags = [],
  onTagsSelected,
  mode = 'manage',
  userId
}) => {
  // Redux state
  const dispatch = useAppDispatch();
  const filteredTags = useAppSelector(selectFilteredTags);
  const loading = useAppSelector(selectTagsLoading);
  const errors = useAppSelector(selectTagsErrors);
  const { searchQuery } = useAppSelector(selectTagsState);

  // Local component state
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Form states
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<string>(defaultColor);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState<string>(defaultColor);

  // Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  // Get current user ID from auth state
  const currentUserId = userId || useAppSelector(state => state.auth?.user?.id);

  // Load tags on mount
  useEffect(() => {
    if (isOpen && currentUserId) {
      dispatch(fetchTags({ userId: currentUserId }));
      initializeSelectedTags();
    }
  }, [isOpen, currentUserId, dispatch]);

  // Initialize selected tags for selection mode
  const initializeSelectedTags = () => {
    if (mode === 'select' && selectedTags.length > 0) {
      // Convert tag names to tag IDs
      const selectedIds = filteredTags
        .filter(tag => selectedTags.includes(tag.name))
        .map(tag => tag.id);
      setSelectedTagIds(selectedIds);
    }
  };

  // Handle search input
  const handleSearch = (searchText: string) => {
    dispatch(setSearchQuery(searchText));
  };

  const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      showToastMessage('Tag name is required', 'warning');
      return;
    }

    // Check for duplicate names
    if (filteredTags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      showToastMessage('A tag with this name already exists', 'warning');
      return;
    }

    try {
      const tagData: TagInsert = {
        name: newTagName.trim(),
        color: newTagColor,
        usage_count: 0,
        created_by: currentUserId,
      };

      await dispatch(createTag(tagData)).unwrap();
      
      setNewTagName('');
      setNewTagColor(predefinedColors[0]);
      setShowCreateModal(false);
      showToastMessage('Tag created successfully!');
    } catch (error: any) {
      showToastMessage(error.message || 'Error creating tag', 'danger');
    }
  };

  const handleEditTag = async () => {
    if (!currentTag || !editTagName.trim()) return;

    // Check for duplicate names (excluding current tag)
    if (filteredTags.some(tag => 
      tag.id !== currentTag.id && 
      tag.name.toLowerCase() === editTagName.toLowerCase()
    )) {
      showToastMessage('A tag with this name already exists', 'warning');
      return;
    }

    try {
      const updateData: TagUpdate = {
        name: editTagName.trim(),
        color: editTagColor,
      };

      await dispatch(updateTag({ id: currentTag.id, updates: updateData })).unwrap();

      setShowEditModal(false);
      setCurrentTag(null);
      showToastMessage('Tag updated successfully!');
    } catch (error: any) {
      showToastMessage(error.message || 'Error updating tag', 'danger');
    }
  };

  const handleDeleteTag = async (tagToDelete: Tag) => {
    try {
      await dispatch(deleteTag(tagToDelete.id)).unwrap();
      
      setSelectedTagIds(prev => prev.filter(id => id !== tagToDelete.id));
      showToastMessage('Tag deleted successfully!');
    } catch (error: any) {
      showToastMessage(error.message || 'Error deleting tag', 'danger');
    }
  };

  const handleTagToggle = (tagId: string) => {
    if (mode !== 'select') return;

    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const handleSaveSelection = () => {
    if (mode === 'select' && onTagsSelected) {
      const selectedTagObjects = filteredTags.filter(tag => selectedTagIds.includes(tag.id));
      onTagsSelected(selectedTagObjects);
    }
    onClose();
  };

  const openEditModal = (tag: Tag) => {
    setCurrentTag(tag);
    setEditTagName(tag.name);
    setEditTagColor((tag.color || predefinedColors[0]) as string);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (tag: Tag) => {
    setCurrentTag(tag);
    setShowDeleteAlert(true);
  };

  // Drag and drop functionality
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredTags);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (reorderedItem) {
      items.splice(result.destination.index, 0, reorderedItem);
    }

    // Note: We can't directly modify filteredTags since it's a Redux selector
    // This would need to be implemented as a proper Redux action
    // For now, this is just a placeholder for the drag-and-drop interface
  };

  const renderColorPicker = (selectedColor: string, onColorChange: (color: string) => void) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {predefinedColors.map(color => (
        <div
          key={color}
          className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
            selectedColor === color ? 'border-gray-800' : 'border-gray-300'
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onColorChange(color)}
        />
      ))}
    </div>
  );

  const renderTagItem = (tag: TagWithStats, index: number) => (
    <Draggable key={tag.id} draggableId={tag.id} index={index} isDragDisabled={mode === 'select'}>
      {(provided, snapshot) => (
        <IonItem
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`${snapshot.isDragging ? 'bg-gray-50' : ''} ${
            mode === 'select' && selectedTagIds.includes(tag.id) ? 'bg-blue-50' : ''
          }`}
          button={mode === 'select'}
          onClick={() => mode === 'select' && handleTagToggle(tag.id)}
        >
          {mode === 'manage' && (
            <div {...provided.dragHandleProps} className="mr-3">
              <IonIcon icon={reorderThreeOutline} className="text-gray-400" />
            </div>
          )}
          
          <IonChip
            style={{ 
              '--background': tag.color ? tag.color : predefinedColors[0],
              '--color': '#ffffff'
            }}
          >
            {tag.name}
          </IonChip>
          
          <IonLabel className="ml-2">
            <h3>{tag.name}</h3>
            <p>{tag.article_count || 0} articles</p>
          </IonLabel>

          {mode === 'select' && selectedTagIds.includes(tag.id) && (
            <IonIcon icon={checkmarkOutline} color="primary" />
          )}

          {mode === 'manage' && (
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={() => openEditModal(tag)}>
                <IonIcon icon={createOutline} />
              </IonButton>
              <IonButton fill="clear" color="danger" onClick={() => openDeleteConfirm(tag)}>
                <IonIcon icon={trashOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonItem>
      )}
    </Draggable>
  );

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{mode === 'select' ? 'Select Tags' : 'Manage Tags'}</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={onClose}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {/* Search and Actions */}
          <div className="mb-4">
            <IonSearchbar
              value={searchQuery}
              placeholder="Search tags..."
              onIonInput={(e) => handleSearch(e.detail.value!)}
              className="mb-2"
            />
            
            {mode === 'manage' && (
              <div className="flex gap-2">
                <IonButton 
                  fill="outline" 
                  size="small" 
                  onClick={() => setShowCreateModal(true)}
                >
                  <IonIcon icon={addOutline} slot="start" />
                  New Tag
                </IonButton>
              </div>
            )}
          </div>

          {/* Tags List */}
          {loading.fetchTags ? (
            <div className="flex justify-center py-8">
              <IonSpinner />
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tags">
                {(provided) => (
                  <IonList ref={provided.innerRef} {...provided.droppableProps}>
                    {filteredTags.map((tag, index) => renderTagItem(tag, index))}
                    {provided.placeholder}
                  </IonList>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {filteredTags.length === 0 && !loading.fetchTags && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No tags found' : 'No tags yet. Create your first tag!'}
            </div>
          )}

          {/* Selection Actions */}
          {mode === 'select' && (
            <div className="fixed bottom-4 left-4 right-4">
              <IonButton 
                expand="block" 
                onClick={handleSaveSelection}
                disabled={selectedTagIds.length === 0}
              >
                Select {selectedTagIds.length} Tag{selectedTagIds.length !== 1 ? 's' : ''}
              </IonButton>
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Create Tag Modal */}
      <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Create New Tag</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={() => setShowCreateModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonInput
              value={newTagName}
              placeholder="Tag name"
              onIonInput={(e) => setNewTagName(e.detail.value!)}
            />
          </IonItem>
          
          <div className="mt-4">
            <IonLabel>Color</IonLabel>
            {renderColorPicker(newTagColor, setNewTagColor)}
          </div>

          <div className="mt-6">
            <IonButton 
              expand="block" 
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
            >
              Create Tag
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Edit Tag Modal */}
      <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Edit Tag</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={() => setShowEditModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonInput
              value={editTagName}
              placeholder="Tag name"
              onIonInput={(e) => setEditTagName(e.detail.value!)}
            />
          </IonItem>
          
          <div className="mt-4">
            <IonLabel>Color</IonLabel>
            {renderColorPicker(editTagColor, setEditTagColor)}
          </div>

          <div className="mt-6">
            <IonButton 
              expand="block" 
              onClick={handleEditTag}
              disabled={!editTagName.trim()}
            >
              Save Changes
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Delete Confirmation */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Tag"
        message={`Are you sure you want to delete "${currentTag?.name}"?`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: () => {
              if (currentTag) {
                handleDeleteTag(currentTag);
              }
            }
          }
        ]}
      />

      {/* Toast */}
      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={3000}
        color={toastColor}
        onDidDismiss={() => setShowToast(false)}
      />
    </>
  );
};

export default TagManager;