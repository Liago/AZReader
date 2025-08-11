import React, { useState, useCallback, useMemo } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonAlert,
  IonToast,
  IonProgressBar,
  IonSpinner,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonPopover,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonActionSheet,
} from '@ionic/react';
import {
  trashOutline,
  colorPaletteOutline,
  gitMergeOutline,
  downloadOutline,
  cloudUploadOutline,
  checkboxOutline,
  squareOutline,
  funnel,
  ellipsisVerticalOutline,
  warningOutline,
  checkmarkCircleOutline,
  layersOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import { tagPerformanceService } from '@services/tagPerformanceService';
import { TagStatistics } from '@utils/tagCache';

export interface TagBatchOperationsProps {
  userId: string;
  tags: TagStatistics[];
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
  onOperationComplete?: (operation: string, result: any) => void;
  className?: string;
}

type BatchOperation = 
  | 'delete'
  | 'update_color'
  | 'merge'
  | 'export'
  | 'cleanup';

interface BatchOperationProgress {
  operation: BatchOperation;
  progress: number;
  message: string;
  completed: boolean;
  error?: string;
}

const TagBatchOperations: React.FC<TagBatchOperationsProps> = ({
  userId,
  tags,
  selectedTagIds,
  onSelectionChange,
  onOperationComplete,
  className = '',
}) => {
  // State
  const [selectedOperation, setSelectedOperation] = useState<BatchOperation | null>(null);
  const [operationProgress, setOperationProgress] = useState<BatchOperationProgress | null>(null);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  
  // Operation-specific state
  const [newColor, setNewColor] = useState('#3B82F6');
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [cleanupCriteria, setCleanupCriteria] = useState({
    unusedDays: 90,
    minUsageCount: 0,
    removeEmpty: true,
  });

  // Selection helpers
  const selectedTags = useMemo(() => 
    tags.filter(tag => selectedTagIds.includes(tag.id)),
    [tags, selectedTagIds]
  );

  const unselectedTags = useMemo(() =>
    tags.filter(tag => !selectedTagIds.includes(tag.id)),
    [tags, selectedTagIds]
  );

  const hasSelection = selectedTagIds.length > 0;

  // Selection actions
  const selectAll = useCallback(() => {
    onSelectionChange(tags.map(tag => tag.id));
  }, [tags, onSelectionChange]);

  const selectNone = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const selectByUsage = useCallback((minUsage: number, maxUsage?: number) => {
    const filtered = tags.filter(tag => {
      const usage = tag.usage_count;
      return usage >= minUsage && (!maxUsage || usage <= maxUsage);
    });
    onSelectionChange(filtered.map(tag => tag.id));
  }, [tags, onSelectionChange]);

  const selectUnused = useCallback((days: number = 90) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const unused = tags.filter(tag => {
      if (!tag.last_used) return true;
      return new Date(tag.last_used) < cutoffDate;
    });
    
    onSelectionChange(unused.map(tag => tag.id));
  }, [tags, onSelectionChange]);

  // Show toast notification
  const showNotification = useCallback((message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  }, []);

  // Execute batch operation
  const executeBatchOperation = useCallback(async () => {
    if (!selectedOperation || !hasSelection) return;

    setOperationProgress({
      operation: selectedOperation,
      progress: 0,
      message: 'Initializing operation...',
      completed: false,
    });

    try {
      let result: { affectedCount: number; operationResult: string };
      
      switch (selectedOperation) {
        case 'delete':
          setOperationProgress(prev => prev && { ...prev, progress: 25, message: 'Deleting tags...' });
          result = await tagPerformanceService.batchTagOperation('delete', selectedTagIds, { userId });
          break;

        case 'update_color':
          if (!newColor) throw new Error('Please select a color');
          setOperationProgress(prev => prev && { ...prev, progress: 25, message: 'Updating colors...' });
          result = await tagPerformanceService.batchTagOperation('update_color', selectedTagIds, {
            userId,
            newColor,
          });
          break;

        case 'merge':
          if (!mergeTargetId) throw new Error('Please select a target tag for merging');
          setOperationProgress(prev => prev && { ...prev, progress: 25, message: 'Merging tags...' });
          result = await tagPerformanceService.batchTagOperation('merge', selectedTagIds, {
            userId,
            mergeTargetId,
          });
          break;

        case 'export':
          setOperationProgress(prev => prev && { ...prev, progress: 25, message: 'Exporting tags...' });
          const exportData = selectedTags.map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            usage_count: tag.usage_count,
            user_count: tag.user_count,
            last_used: tag.last_used,
            created_at: new Date().toISOString(),
          }));
          
          // Create and download JSON file
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `tags-export-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          result = { 
            affectedCount: selectedTags.length,
            operationResult: 'Tags exported successfully'
          };
          break;

        case 'cleanup':
          setOperationProgress(prev => prev && { ...prev, progress: 25, message: 'Analyzing tags...' });
          
          // Find tags that match cleanup criteria
          const cleanupTags = tags.filter(tag => {
            if (cleanupCriteria.removeEmpty && tag.usage_count === 0) return true;
            if (tag.usage_count < cleanupCriteria.minUsageCount) return true;
            
            if (tag.last_used && cleanupCriteria.unusedDays > 0) {
              const cutoffDate = new Date();
              cutoffDate.setDate(cutoffDate.getDate() - cleanupCriteria.unusedDays);
              return new Date(tag.last_used) < cutoffDate;
            }
            
            return false;
          });
          
          if (cleanupTags.length === 0) {
            throw new Error('No tags match the cleanup criteria');
          }
          
          setOperationProgress(prev => prev && { 
            ...prev, 
            progress: 50, 
            message: `Cleaning up ${cleanupTags.length} tags...` 
          });
          
          result = await tagPerformanceService.batchTagOperation(
            'delete', 
            cleanupTags.map(t => t.id), 
            { userId }
          );
          break;

        default:
          throw new Error('Unknown operation');
      }

      // Complete the operation
      setOperationProgress(prev => prev && {
        ...prev,
        progress: 100,
        message: `Operation completed: ${result.operationResult}`,
        completed: true,
      });

      // Show success notification
      showNotification(
        `${result.operationResult} (${result.affectedCount} tags affected)`,
        'success'
      );

      // Clear selection and notify parent
      onSelectionChange([]);
      onOperationComplete?.(selectedOperation, result);

    } catch (error) {
      console.error('Batch operation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      
      setOperationProgress(prev => prev && {
        ...prev,
        progress: 0,
        message: errorMessage,
        completed: true,
        error: errorMessage,
      });

      showNotification(errorMessage, 'danger');
    }

    // Clear operation state after delay
    setTimeout(() => {
      setOperationProgress(null);
      setSelectedOperation(null);
      setShowConfirmAlert(false);
    }, 3000);
  }, [
    selectedOperation,
    hasSelection,
    selectedTagIds,
    userId,
    newColor,
    mergeTargetId,
    cleanupCriteria,
    selectedTags,
    tags,
    showNotification,
    onSelectionChange,
    onOperationComplete,
  ]);

  // Handle operation selection
  const handleOperationSelect = useCallback((operation: BatchOperation) => {
    setSelectedOperation(operation);
    setShowActionSheet(false);
    
    // For simple operations, show confirmation immediately
    if (operation === 'delete' || operation === 'export') {
      setShowConfirmAlert(true);
    }
  }, []);

  // Get operation confirmation message
  const getConfirmationMessage = useCallback(() => {
    if (!selectedOperation) return '';
    
    const count = selectedTagIds.length;
    
    switch (selectedOperation) {
      case 'delete':
        return `Are you sure you want to delete ${count} tag${count !== 1 ? 's' : ''}? This action cannot be undone and will remove the tag${count !== 1 ? 's' : ''} from all articles.`;
      
      case 'update_color':
        return `Update the color of ${count} tag${count !== 1 ? 's' : ''} to the selected color?`;
      
      case 'merge':
        const targetTag = tags.find(t => t.id === mergeTargetId);
        return `Merge ${count} tag${count !== 1 ? 's' : ''} into "${targetTag?.name}"? The selected tags will be deleted and their articles will be tagged with the target tag instead.`;
      
      case 'export':
        return `Export ${count} tag${count !== 1 ? 's' : ''} to a JSON file?`;
      
      case 'cleanup':
        return `Perform cleanup operation based on the specified criteria? This may delete multiple tags.`;
      
      default:
        return 'Proceed with the operation?';
    }
  }, [selectedOperation, selectedTagIds.length, tags, mergeTargetId]);

  // Render operation-specific UI
  const renderOperationUI = () => {
    switch (selectedOperation) {
      case 'update_color':
        return (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Update Tag Color</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>New Color:</IonLabel>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="ml-2"
                />
              </IonItem>
              <div className="flex gap-2 mt-4">
                <IonButton onClick={() => setShowConfirmAlert(true)} expand="block">
                  Update Color
                </IonButton>
                <IonButton 
                  fill="outline" 
                  onClick={() => setSelectedOperation(null)}
                  expand="block"
                >
                  Cancel
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        );

      case 'merge':
        return (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Merge Tags</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>Merge into:</IonLabel>
                <IonSelect 
                  value={mergeTargetId} 
                  onIonChange={(e) => setMergeTargetId(e.detail.value)}
                >
                  {unselectedTags.map(tag => (
                    <IonSelectOption key={tag.id} value={tag.id}>
                      {tag.name} ({tag.usage_count} uses)
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <div className="flex gap-2 mt-4">
                <IonButton 
                  onClick={() => setShowConfirmAlert(true)} 
                  expand="block"
                  disabled={!mergeTargetId}
                >
                  Merge Tags
                </IonButton>
                <IonButton 
                  fill="outline" 
                  onClick={() => setSelectedOperation(null)}
                  expand="block"
                >
                  Cancel
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        );

      case 'cleanup':
        return (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Cleanup Tags</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>Remove unused for (days):</IonLabel>
                <IonInput
                  type="number"
                  value={cleanupCriteria.unusedDays}
                  onIonInput={(e) => setCleanupCriteria(prev => ({
                    ...prev,
                    unusedDays: parseInt(e.detail.value!) || 0
                  }))}
                />
              </IonItem>
              
              <IonItem>
                <IonLabel>Minimum usage count:</IonLabel>
                <IonInput
                  type="number"
                  value={cleanupCriteria.minUsageCount}
                  onIonInput={(e) => setCleanupCriteria(prev => ({
                    ...prev,
                    minUsageCount: parseInt(e.detail.value!) || 0
                  }))}
                />
              </IonItem>
              
              <IonItem>
                <IonCheckbox
                  checked={cleanupCriteria.removeEmpty}
                  onIonChange={(e) => setCleanupCriteria(prev => ({
                    ...prev,
                    removeEmpty: e.detail.checked
                  }))}
                />
                <IonLabel className="ml-2">Remove empty tags (0 uses)</IonLabel>
              </IonItem>

              <div className="flex gap-2 mt-4">
                <IonButton onClick={() => setShowConfirmAlert(true)} expand="block">
                  Start Cleanup
                </IonButton>
                <IonButton 
                  fill="outline" 
                  onClick={() => setSelectedOperation(null)}
                  expand="block"
                >
                  Cancel
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`tag-batch-operations ${className}`}>
      {/* Selection Controls */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <IonIcon icon={layersOutline} className="mr-2" />
              Batch Operations
              {hasSelection && (
                <IonBadge color="primary" className="ml-2">
                  {selectedTagIds.length}
                </IonBadge>
              )}
            </div>
            
            <IonButton
              fill="clear"
              id="batch-operations-trigger"
              disabled={!hasSelection}
              onClick={() => setShowActionSheet(true)}
            >
              <IonIcon icon={ellipsisVerticalOutline} />
            </IonButton>
          </IonCardTitle>
        </IonCardHeader>
        
        <IonCardContent>
          {/* Quick Selection */}
          <div className="space-y-2 mb-4">
            <IonText className="text-sm font-medium">Quick Select:</IonText>
            <div className="flex flex-wrap gap-2">
              <IonButton size="small" fill="outline" onClick={selectAll}>
                All ({tags.length})
              </IonButton>
              <IonButton size="small" fill="outline" onClick={selectNone}>
                None
              </IonButton>
              <IonButton size="small" fill="outline" onClick={() => selectByUsage(1, 5)}>
                Low Usage (1-5)
              </IonButton>
              <IonButton size="small" fill="outline" onClick={() => selectUnused(90)}>
                Unused (90d)
              </IonButton>
              <IonButton size="small" fill="outline" onClick={() => selectByUsage(0, 0)}>
                Empty (0)
              </IonButton>
            </div>
          </div>

          {/* Selected Tags Preview */}
          {hasSelection && (
            <div>
              <IonText className="text-sm font-medium mb-2">
                Selected Tags ({selectedTagIds.length}):
              </IonText>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {selectedTags.slice(0, 20).map(tag => (
                  <IonChip key={tag.id} color="primary" outline>
                    {tag.name}
                    <IonBadge color="light" className="ml-1">
                      {tag.usage_count}
                    </IonBadge>
                  </IonChip>
                ))}
                {selectedTags.length > 20 && (
                  <IonText className="text-sm text-gray-500">
                    +{selectedTags.length - 20} more...
                  </IonText>
                )}
              </div>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Operation-Specific UI */}
      {selectedOperation && !operationProgress && renderOperationUI()}

      {/* Progress Indicator */}
      {operationProgress && (
        <IonCard>
          <IonCardContent>
            <div className="text-center">
              <IonText className="block mb-3">
                <h3>Processing Operation...</h3>
                <p className="text-sm">{operationProgress.message}</p>
              </IonText>
              
              {!operationProgress.completed && (
                <IonProgressBar value={operationProgress.progress / 100} />
              )}
              
              {operationProgress.completed && !operationProgress.error && (
                <IonIcon icon={checkmarkCircleOutline} className="text-4xl text-green-500" />
              )}
              
              {operationProgress.error && (
                <IonIcon icon={warningOutline} className="text-4xl text-red-500" />
              )}
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Action Sheet for Operation Selection */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          {
            text: 'Delete Selected',
            icon: trashOutline,
            role: 'destructive',
            handler: () => handleOperationSelect('delete'),
          },
          {
            text: 'Change Color',
            icon: colorPaletteOutline,
            handler: () => handleOperationSelect('update_color'),
          },
          {
            text: 'Merge Tags',
            icon: gitMergeOutline,
            handler: () => handleOperationSelect('merge'),
          },
          {
            text: 'Export Selected',
            icon: downloadOutline,
            handler: () => handleOperationSelect('export'),
          },
          {
            text: 'Cleanup Tags',
            icon: funnel,
            handler: () => handleOperationSelect('cleanup'),
          },
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ]}
      />

      {/* Confirmation Alert */}
      <IonAlert
        isOpen={showConfirmAlert}
        onDidDismiss={() => setShowConfirmAlert(false)}
        header="Confirm Operation"
        message={getConfirmationMessage()}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Confirm',
            handler: executeBatchOperation,
          },
        ]}
      />

      {/* Toast Notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        color={toastColor}
        buttons={[
          {
            text: 'OK',
            role: 'cancel',
          },
        ]}
      />
    </div>
  );
};

export default TagBatchOperations;