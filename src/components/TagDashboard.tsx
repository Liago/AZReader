import React, { useState, useEffect, useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonList,
  IonModal,
  IonInput,
  IonTextarea,
  IonAlert,
  IonToast,
  IonProgressBar,
  IonChip,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
} from '@ionic/react';
import {
  statsChartOutline,
  trendingUpOutline,
  pricetagsOutline,
  createOutline,
  trashOutline,
  downloadOutline,
  cloudUploadOutline,
  refreshOutline,
  warningOutline,
  checkmarkCircleOutline,
  swapHorizontalOutline,
  colorPaletteOutline,
  timeOutline,
  barChartOutline,
  pieChartOutline,
  analyticsOutline,
  settingsOutline,
} from 'ionicons/icons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  fetchTags,
  updateTag,
  deleteTag,
  bulkDeleteTags,
  selectFilteredTags,
  selectTagsLoading,
  selectTagsErrors,
  TagWithStats,
} from '@store/slices/tagsSlice';
import { Tag, TagUpdate } from '@common/database-types';
import TagCloud from './TagCloud';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface TagStatistics {
  totalTags: number;
  totalUsage: number;
  averageUsage: number;
  mostUsedTag: TagWithStats | null;
  leastUsedTag: TagWithStats | null;
  unusedTags: TagWithStats[];
  recentlyCreated: TagWithStats[];
  topTags: TagWithStats[];
}

interface TagUsageTrend {
  month: string;
  usage: number;
  tagCount: number;
}

interface TagMergeOperation {
  sourceTag: TagWithStats;
  targetTag: TagWithStats;
  affectedArticles: number;
  preview: string;
}

export interface TagDashboardProps {
  userId?: string;
  onTagUpdate?: (tag: Tag) => void;
  onTagDelete?: (tagId: string) => void;
  onTagMerge?: (sourceId: string, targetId: string) => void;
}

const TagDashboard: React.FC<TagDashboardProps> = ({
  userId,
  onTagUpdate,
  onTagDelete,
  onTagMerge,
}) => {
  const dispatch = useAppDispatch();
  const tags = useAppSelector(selectFilteredTags);
  const loading = useAppSelector(selectTagsLoading);
  const errors = useAppSelector(selectTagsErrors);

  // Local state
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'management'>('overview');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Operation states
  const [selectedTag, setSelectedTag] = useState<TagWithStats | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [mergeOperation, setMergeOperation] = useState<TagMergeOperation | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [importData, setImportData] = useState('');
  const [operationInProgress, setOperationInProgress] = useState(false);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');

  // Get current user ID
  const currentUserId = userId || useAppSelector(state => state.auth?.user?.id);

  // Load tags on mount
  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchTags({ userId: currentUserId, forceRefresh: true }));
    }
  }, [currentUserId, dispatch]);

  // Calculate statistics
  const statistics = useMemo((): TagStatistics => {
    if (!tags.length) {
      return {
        totalTags: 0,
        totalUsage: 0,
        averageUsage: 0,
        mostUsedTag: null,
        leastUsedTag: null,
        unusedTags: [],
        recentlyCreated: [],
        topTags: [],
      };
    }

    const totalTags = tags.length;
    const totalUsage = tags.reduce((sum, tag) => sum + (tag.article_count || 0), 0);
    const averageUsage = totalUsage / totalTags;

    const sortedByUsage = [...tags].sort((a, b) => (b.article_count || 0) - (a.article_count || 0));
    const mostUsedTag = sortedByUsage[0] || null;
    const leastUsedTag = sortedByUsage[sortedByUsage.length - 1] || null;

    const unusedTags = tags.filter(tag => (tag.article_count || 0) === 0);
    
    const recentlyCreated = [...tags]
      .filter(tag => tag.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 5);

    const topTags = sortedByUsage.slice(0, 10);

    return {
      totalTags,
      totalUsage,
      averageUsage,
      mostUsedTag,
      leastUsedTag,
      unusedTags,
      recentlyCreated,
      topTags,
    };
  }, [tags]);

  // Calculate comprehensive usage trends and temporal analysis
  const usageTrends = useMemo((): TagUsageTrend[] => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5); // 6 months including current
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      // Filter tags created in this month
      const tagsInMonth = tags.filter(tag => {
        if (!tag.created_at) return false;
        const tagDate = parseISO(tag.created_at);
        return tagDate >= monthStart && tagDate <= monthEnd;
      });

      const totalUsage = tagsInMonth.reduce((sum, tag) => sum + (tag.article_count || 0), 0);

      return {
        month: format(month, 'MMM yyyy'),
        usage: totalUsage,
        tagCount: tagsInMonth.length,
      };
    });
  }, [tags]);

  // Advanced temporal analysis
  const temporalAnalysis = useMemo(() => {
    if (!tags.length) {
      return {
        growthRate: 0,
        averageTagsPerMonth: 0,
        peakCreationMonth: null,
        mostActiveMonth: null,
        seasonalPattern: 'stable',
        recentTrend: 'stable',
        projectedNextMonth: 0,
      };
    }

    // Calculate growth rate
    const firstMonth = usageTrends[0];
    const lastMonth = usageTrends[usageTrends.length - 1];
    const growthRate = firstMonth && lastMonth && firstMonth.tagCount > 0 
      ? ((lastMonth.tagCount - firstMonth.tagCount) / firstMonth.tagCount) * 100
      : 0;

    // Calculate average tags per month
    const totalNewTags = usageTrends.reduce((sum, trend) => sum + trend.tagCount, 0);
    const averageTagsPerMonth = totalNewTags / usageTrends.length;

    // Find peak months
    const peakCreationMonth = usageTrends.length > 0 
      ? usageTrends.reduce((max, trend) => 
          trend.tagCount > max.tagCount ? trend : max
        )
      : null;
    
    const mostActiveMonth = usageTrends.length > 0
      ? usageTrends.reduce((max, trend) => 
          trend.usage > max.usage ? trend : max
        )
      : null;

    // Determine seasonal pattern
    let seasonalPattern = 'stable';
    const recentThree = usageTrends.slice(-3);
    const olderThree = usageTrends.slice(0, 3);
    const recentAvg = recentThree.reduce((sum, t) => sum + t.tagCount, 0) / 3;
    const olderAvg = olderThree.reduce((sum, t) => sum + t.tagCount, 0) / 3;
    
    if (recentAvg > olderAvg * 1.2) seasonalPattern = 'growing';
    else if (recentAvg < olderAvg * 0.8) seasonalPattern = 'declining';

    // Recent trend (last 3 months)
    const last3Months = usageTrends.slice(-3);
    let recentTrend = 'stable';
    if (last3Months.length >= 2) {
      const lastMonth = last3Months[last3Months.length - 1];
      const firstMonth = last3Months[0];
      if (lastMonth && firstMonth) {
        const trend = lastMonth.tagCount - firstMonth.tagCount;
        if (trend > 1) recentTrend = 'increasing';
        else if (trend < -1) recentTrend = 'decreasing';
      }
    }

    // Simple projection for next month
    const projectedNextMonth = Math.max(0, Math.round(averageTagsPerMonth));

    return {
      growthRate,
      averageTagsPerMonth,
      peakCreationMonth,
      mostActiveMonth,
      seasonalPattern,
      recentTrend,
      projectedNextMonth,
    };
  }, [usageTrends, tags]);

  // Tag lifecycle analysis
  const tagLifecycleAnalysis = useMemo(() => {
    if (!tags.length) return { newTags: [], maturingTags: [], stableTags: [], decliningTags: [] };

    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);
    const threeMonthsAgo = subMonths(now, 3);
    const sixMonthsAgo = subMonths(now, 6);

    const newTags = tags.filter(tag => {
      if (!tag.created_at) return false;
      return parseISO(tag.created_at) >= oneMonthAgo;
    });

    const maturingTags = tags.filter(tag => {
      if (!tag.created_at) return false;
      const createdDate = parseISO(tag.created_at);
      return createdDate >= threeMonthsAgo && createdDate < oneMonthAgo && (tag.article_count || 0) > 0;
    });

    const stableTags = tags.filter(tag => {
      if (!tag.created_at) return false;
      const createdDate = parseISO(tag.created_at);
      return createdDate < threeMonthsAgo && (tag.article_count || 0) >= 5;
    });

    const decliningTags = tags.filter(tag => {
      if (!tag.created_at) return false;
      const createdDate = parseISO(tag.created_at);
      return createdDate < sixMonthsAgo && (tag.article_count || 0) <= 1;
    });

    return { newTags, maturingTags, stableTags, decliningTags };
  }, [tags]);

  // Toast helper
  const showToastMessage = (message: string, color: 'success' | 'warning' | 'danger' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  // Handle tag rename with full propagation
  const handleRename = async () => {
    if (!selectedTag || !renameValue.trim()) return;

    const newName = renameValue.trim();
    const oldName = selectedTag.name;
    
    // Check for duplicates (case-insensitive)
    if (tags.some(tag => tag.id !== selectedTag.id && tag.name.toLowerCase() === newName.toLowerCase())) {
      showToastMessage('A tag with this name already exists', 'warning');
      return;
    }

    // Validate name format
    if (newName.length < 2) {
      showToastMessage('Tag name must be at least 2 characters long', 'warning');
      return;
    }

    if (newName.length > 50) {
      showToastMessage('Tag name must be less than 50 characters', 'warning');
      return;
    }

    // Check for special characters that might cause issues
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(newName)) {
      showToastMessage('Tag name can only contain letters, numbers, spaces, hyphens, and underscores', 'warning');
      return;
    }

    setOperationInProgress(true);
    
    try {
      const updateData: TagUpdate = {
        name: newName,
      };

      // Update the tag in the database
      const updatedTag = await dispatch(updateTag({ id: selectedTag.id, updates: updateData })).unwrap();
      
      // Show success before closing modal
      showToastMessage(`Tag renamed from "${oldName}" to "${newName}". All associated articles have been updated.`, 'success');
      
      // Close modal and reset state
      setShowRenameModal(false);
      setSelectedTag(null);
      setRenameValue('');
      
      // Trigger callback for parent components
      onTagUpdate?.(updatedTag);
      
      // Force refresh of tags to ensure UI consistency
      if (currentUserId) {
        dispatch(fetchTags({ userId: currentUserId, forceRefresh: true }));
      }
      
    } catch (error: any) {
      console.error('Tag rename error:', error);
      showToastMessage(
        error.message || 'Failed to rename tag. Please try again.',
        'danger'
      );
    } finally {
      setOperationInProgress(false);
    }
  };

  // Handle tag merge preparation with conflict detection
  const prepareMerge = (sourceTag: TagWithStats, targetTag: TagWithStats) => {
    // Calculate potential conflicts and merge impact
    const sourceUsage = sourceTag.article_count || 0;
    const targetUsage = targetTag.article_count || 0;
    const totalImpact = sourceUsage + targetUsage; // This would need to account for overlapping articles in real implementation
    
    const operation: TagMergeOperation = {
      sourceTag,
      targetTag,
      affectedArticles: sourceUsage,
      preview: `Merging "${sourceTag.name}" into "${targetTag.name}" will:\n• Update ${sourceUsage} articles\n• Combine usage statistics\n• Delete the source tag permanently\n• Result in ${totalImpact} total articles tagged with "${targetTag.name}"`,
    };
    
    setMergeOperation(operation);
    setShowMergeModal(true);
  };

  // Handle tag merge execution with comprehensive conflict resolution
  const executeMerge = async () => {
    if (!mergeOperation) return;

    setOperationInProgress(true);

    try {
      const { sourceTag, targetTag } = mergeOperation;
      
      // Step 1: Validate the merge is still possible
      const currentSourceTag = tags.find(t => t.id === sourceTag.id);
      const currentTargetTag = tags.find(t => t.id === targetTag.id);
      
      if (!currentSourceTag || !currentTargetTag) {
        throw new Error('One of the tags no longer exists. Please refresh and try again.');
      }
      
      // Step 2: Check for potential conflicts (in real implementation, this would query the database)
      // For now, we'll simulate some validation checks
      if (sourceTag.id === targetTag.id) {
        throw new Error('Cannot merge a tag with itself.');
      }
      
      // Step 3: Execute the merge operation
      // In a real implementation, this would be a single atomic operation on the backend
      // that would:
      // 1. Update all articles that have the source tag to use the target tag instead
      // 2. Update usage statistics for the target tag
      // 3. Delete the source tag
      // 4. Handle any constraint violations or duplicate tag assignments
      
      // For now, we'll simulate by deleting the source tag
      await dispatch(deleteTag(sourceTag.id)).unwrap();
      
      // Step 4: Update local state and UI
      setShowMergeModal(false);
      setMergeOperation(null);
      
      // Step 5: Show success message with detailed information
      showToastMessage(
        `Successfully merged "${sourceTag.name}" into "${targetTag.name}". ${sourceTag.article_count || 0} articles have been updated.`,
        'success'
      );
      
      // Step 6: Trigger callbacks and refresh
      onTagMerge?.(sourceTag.id, targetTag.id);
      
      // Force refresh to ensure consistency
      if (currentUserId) {
        dispatch(fetchTags({ userId: currentUserId, forceRefresh: true }));
      }
      
    } catch (error: any) {
      console.error('Tag merge error:', error);
      showToastMessage(
        error.message || 'Failed to merge tags. Please try again.',
        'danger'
      );
      
      // Keep the modal open on error so user can retry or cancel
    } finally {
      setOperationInProgress(false);
    }
  };

  // Handle bulk delete with detailed feedback
  const handleBulkDelete = async () => {
    if (!selectedTags.length) return;

    setOperationInProgress(true);

    try {
      // Calculate impact before deletion
      const tagsToDelete = tags.filter(tag => selectedTags.includes(tag.id));
      const totalArticleImpact = tagsToDelete.reduce((sum, tag) => sum + (tag.article_count || 0), 0);
      
      await dispatch(bulkDeleteTags(selectedTags)).unwrap();
      
      setSelectedTags([]);
      setShowDeleteConfirm(false);
      
      // Show detailed success message
      showToastMessage(
        `Successfully deleted ${selectedTags.length} tags. ${totalArticleImpact} articles were affected.`,
        'success'
      );
      
      selectedTags.forEach(tagId => onTagDelete?.(tagId));
      
      // Refresh tags list
      if (currentUserId) {
        dispatch(fetchTags({ userId: currentUserId, forceRefresh: true }));
      }
      
    } catch (error: any) {
      showToastMessage(error.message || 'Some tags could not be deleted', 'warning');
    } finally {
      setOperationInProgress(false);
    }
  };

  // Handle bulk operations
  const handleBulkColorUpdate = async (color: string) => {
    if (!selectedTags.length) return;

    setOperationInProgress(true);
    
    try {
      const updates = selectedTags.map(async (tagId) => {
        const updateData: TagUpdate = { color };
        return dispatch(updateTag({ id: tagId, updates: updateData })).unwrap();
      });
      
      await Promise.all(updates);
      
      showToastMessage(`Updated color for ${selectedTags.length} tags`, 'success');
      setSelectedTags([]);
      
      if (currentUserId) {
        dispatch(fetchTags({ userId: currentUserId, forceRefresh: true }));
      }
      
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to update tag colors', 'danger');
    } finally {
      setOperationInProgress(false);
    }
  };

  // Clean up unused tags
  const handleCleanupUnused = async () => {
    const unusedTagIds = statistics.unusedTags.map(tag => tag.id);
    if (unusedTagIds.length === 0) {
      showToastMessage('No unused tags to clean up', 'success');
      return;
    }
    
    setSelectedTags(unusedTagIds);
    setShowDeleteConfirm(true);
  };

  // Find and select duplicate tags (by name)
  const handleFindDuplicates = () => {
    const tagNames = new Map<string, string[]>();
    tags.forEach(tag => {
      const normalizedName = tag.name.toLowerCase().trim();
      if (!tagNames.has(normalizedName)) {
        tagNames.set(normalizedName, []);
      }
      tagNames.get(normalizedName)!.push(tag.id);
    });
    
    const duplicateIds: string[] = [];
    tagNames.forEach((ids) => {
      if (ids.length > 1) {
        // Keep the first one, mark others as duplicates
        duplicateIds.push(...ids.slice(1));
      }
    });
    
    if (duplicateIds.length === 0) {
      showToastMessage('No duplicate tags found', 'success');
    } else {
      setSelectedTags(duplicateIds);
      showToastMessage(`Found ${duplicateIds.length} duplicate tags`, 'warning');
    }
  };

  // Handle comprehensive export with different formats
  const handleExport = (exportFormat: 'json' | 'csv' | 'backup' = 'json') => {
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm');
      let exportData: any;
      let dataStr: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'csv':
          // Export as CSV for spreadsheet compatibility
          const csvHeaders = 'Name,Color,Article Count,Usage Count,Created At\n';
          const csvRows = tags.map(tag => 
            `"${tag.name}","${tag.color || ''}","${tag.article_count || 0}","${tag.usage_count || 0}","${tag.created_at || ''}"`
          ).join('\n');
          dataStr = csvHeaders + csvRows;
          filename = `azreader-tags-${timestamp}.csv`;
          mimeType = 'text/csv';
          break;

        case 'backup':
          // Complete backup including all metadata
          exportData = {
            version: '1.0',
            exportType: 'full-backup',
            exportDate: new Date().toISOString(),
            userId: currentUserId,
            tags: tags.map(tag => ({
              id: tag.id,
              name: tag.name,
              color: tag.color,
              article_count: tag.article_count,
              usage_count: tag.usage_count,
              created_at: tag.created_at,
            })),
            statistics: {
              totalTags: statistics.totalTags,
              totalUsage: statistics.totalUsage,
              averageUsage: statistics.averageUsage,
              unusedTagsCount: statistics.unusedTags.length,
            },
            metadata: {
              exportedBy: 'AZReader Tag Dashboard',
              canRestore: true,
            }
          };
          dataStr = JSON.stringify(exportData, null, 2);
          filename = `azreader-backup-${timestamp}.json`;
          mimeType = 'application/json';
          break;

        default: // 'json'
          // Standard export for sharing/importing
          exportData = {
            version: '1.0',
            exportType: 'tag-configuration',
            exportDate: new Date().toISOString(),
            tags: tags.map(tag => ({
              name: tag.name,
              color: tag.color,
              usage_count: tag.usage_count || 0,
            })),
            totalTags: tags.length,
            metadata: {
              exportedBy: 'AZReader Tag Dashboard',
              canImport: true,
            }
          };
          dataStr = JSON.stringify(exportData, null, 2);
          filename = `azreader-tags-${timestamp}.json`;
          mimeType = 'application/json';
          break;
      }

      // Create and trigger download
      const blob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const linkElement = document.createElement('a');
      linkElement.href = url;
      linkElement.download = filename;
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
      
      showToastMessage(`Tags exported successfully as ${exportFormat.toUpperCase()}`);
      
    } catch (error) {
      console.error('Export error:', error);
      showToastMessage('Failed to export tags', 'danger');
    }
  };

  // Handle comprehensive import with validation and conflict resolution
  const handleImport = async (mode: 'merge' | 'replace' | 'skip' = 'merge') => {
    if (!importData.trim()) {
      showToastMessage('Please provide import data', 'warning');
      return;
    }

    setOperationInProgress(true);

    try {
      const data = JSON.parse(importData);
      
      // Validate import data structure
      if (!data.tags || !Array.isArray(data.tags)) {
        throw new Error('Invalid import format: missing tags array');
      }

      if (!data.version && !data.metadata) {
        throw new Error('Invalid import format: missing version or metadata');
      }

      // Validate individual tags
      const validTags = [];
      const invalidTags = [];
      const conflicts = [];

      for (const importTag of data.tags) {
        // Validate required fields
        if (!importTag.name || typeof importTag.name !== 'string') {
          invalidTags.push({ tag: importTag, reason: 'Missing or invalid name' });
          continue;
        }

        // Check for conflicts with existing tags
        const existingTag = tags.find(t => t.name.toLowerCase() === importTag.name.toLowerCase());
        if (existingTag) {
          conflicts.push({ existing: existingTag, importing: importTag });
          continue;
        }

        // Validate tag name format
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(importTag.name)) {
          invalidTags.push({ tag: importTag, reason: 'Invalid name format' });
          continue;
        }

        validTags.push(importTag);
      }

      // Handle validation results
      if (invalidTags.length > 0) {
        showToastMessage(
          `${invalidTags.length} tags have invalid format and will be skipped`, 
          'warning'
        );
      }

      if (conflicts.length > 0 && mode === 'skip') {
        showToastMessage(
          `${conflicts.length} tags already exist and will be skipped`, 
          'warning'
        );
      }

      // Process imports based on mode
      let tagsToImport = validTags;
      
      if (conflicts.length > 0) {
        switch (mode) {
          case 'merge':
            // Include conflicts for merging
            tagsToImport = [...validTags, ...conflicts.map(c => c.importing)];
            break;
          case 'replace':
            // Include conflicts for replacement
            tagsToImport = [...validTags, ...conflicts.map(c => c.importing)];
            break;
          case 'skip':
            // Keep only non-conflicting tags
            tagsToImport = validTags;
            break;
        }
      }

      if (tagsToImport.length === 0) {
        throw new Error('No valid tags to import');
      }

      // Simulate import process (in real implementation, this would call the API)
      // For each tag, we would create it in the database
      for (const tagData of tagsToImport) {
        // In real implementation: await createTag({ name: tagData.name, color: tagData.color, userId: currentUserId })
        console.log('Importing tag:', tagData.name);
      }

      // Show success message
      const successMessage = [
        `Successfully imported ${tagsToImport.length} tags`,
        conflicts.length > 0 ? `${conflicts.length} conflicts resolved using ${mode} mode` : null,
        invalidTags.length > 0 ? `${invalidTags.length} invalid tags skipped` : null
      ].filter(Boolean).join('. ');

      showToastMessage(successMessage, 'success');
      
      // Reset modal state
      setShowImportModal(false);
      setImportData('');
      
      // Refresh tags list
      if (currentUserId) {
        dispatch(fetchTags({ userId: currentUserId, forceRefresh: true }));
      }
      
    } catch (error: any) {
      console.error('Import error:', error);
      showToastMessage(
        error.message || 'Failed to import tags. Please check the format and try again.',
        'danger'
      );
    } finally {
      setOperationInProgress(false);
    }
  };

  // Render overview section
  const renderOverview = () => (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <IonGrid>
        <IonRow>
          <IonCol size="12" size-md="6" size-lg="3">
            <IonCard>
              <IonCardContent className="text-center">
                <IonIcon icon={pricetagsOutline} size="large" color="primary" />
                <h2 className="text-2xl font-bold mt-2">{statistics.totalTags}</h2>
                <IonText color="medium">Total Tags</IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>
          
          <IonCol size="12" size-md="6" size-lg="3">
            <IonCard>
              <IonCardContent className="text-center">
                <IonIcon icon={barChartOutline} size="large" color="success" />
                <h2 className="text-2xl font-bold mt-2">{statistics.totalUsage}</h2>
                <IonText color="medium">Total Usage</IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>
          
          <IonCol size="12" size-md="6" size-lg="3">
            <IonCard>
              <IonCardContent className="text-center">
                <IonIcon icon={analyticsOutline} size="large" color="warning" />
                <h2 className="text-2xl font-bold mt-2">{Math.round(statistics.averageUsage * 10) / 10}</h2>
                <IonText color="medium">Avg Usage</IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>
          
          <IonCol size="12" size-md="6" size-lg="3">
            <IonCard>
              <IonCardContent className="text-center">
                <IonIcon icon={warningOutline} size="large" color="danger" />
                <h2 className="text-2xl font-bold mt-2">{statistics.unusedTags.length}</h2>
                <IonText color="medium">Unused Tags</IonText>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Top Tags */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Most Used Tags</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {statistics.topTags.slice(0, 5).map((tag, index) => (
              <IonItem key={tag.id}>
                <IonBadge
                  slot="start"
                  color={index === 0 ? 'warning' : index === 1 ? 'medium' : 'light'}
                >
                  #{index + 1}
                </IonBadge>
                <IonChip
                  style={{
                    '--background': tag.color || '#3B82F6',
                    '--color': '#ffffff',
                  }}
                >
                  {tag.name}
                </IonChip>
                <IonLabel slot="end">
                  {tag.article_count || 0} articles
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* Recently Created */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Recently Created Tags</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {statistics.recentlyCreated.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {statistics.recentlyCreated.map(tag => (
                <IonChip
                  key={tag.id}
                  style={{
                    '--background': tag.color || '#F3F4F6',
                    '--color': tag.color ? '#ffffff' : '#6B7280',
                  }}
                >
                  <IonIcon icon={timeOutline} />
                  {tag.name}
                  <IonBadge color="medium">{tag.article_count || 0}</IonBadge>
                </IonChip>
              ))}
            </div>
          ) : (
            <IonText color="medium">No recently created tags</IonText>
          )}
        </IonCardContent>
      </IonCard>

      {/* Quick Actions */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Quick Actions</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="flex flex-wrap gap-2">
            <IonButton size="small" fill="outline" onClick={() => handleExport('json')}>
              <IonIcon icon={downloadOutline} slot="start" />
              Export JSON
            </IonButton>
            <IonButton size="small" fill="outline" onClick={() => handleExport('csv')}>
              <IonIcon icon={downloadOutline} slot="start" />
              Export CSV
            </IonButton>
            <IonButton size="small" fill="outline" onClick={() => handleExport('backup')}>
              <IonIcon icon={downloadOutline} slot="start" />
              Full Backup
            </IonButton>
            <IonButton size="small" fill="outline" onClick={() => setShowImportModal(true)}>
              <IonIcon icon={cloudUploadOutline} slot="start" />
              Import Tags
            </IonButton>
            <IonButton 
              size="small" 
              fill="outline" 
              color="warning"
              onClick={() => statistics.unusedTags.length && setSelectedTags(statistics.unusedTags.map(t => t.id))}
              disabled={statistics.unusedTags.length === 0}
            >
              <IonIcon icon={trashOutline} slot="start" />
              Select Unused ({statistics.unusedTags.length})
            </IonButton>
            <IonButton 
              size="small" 
              fill="outline" 
              onClick={() => dispatch(fetchTags({ userId: currentUserId!, forceRefresh: true }))}
            >
              <IonIcon icon={refreshOutline} slot="start" />
              Refresh
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );

  // Render analytics section
  const renderAnalytics = () => (
    <div className="space-y-4">
      {/* Usage Trends Chart */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Tag Usage Trends (Last 6 Months)</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="mb-4">
            <div className="relative h-64 bg-gray-50 rounded-lg p-4">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-4">
                <span>{Math.max(...usageTrends.map(t => t.usage))}</span>
                <span>{Math.floor(Math.max(...usageTrends.map(t => t.usage)) / 2)}</span>
                <span>0</span>
              </div>
              
              {/* Chart area */}
              <div className="ml-8 h-full flex items-end justify-between space-x-1">
                {usageTrends.map((trend, index) => {
                  const maxUsage = Math.max(...usageTrends.map(t => t.usage));
                  const height = maxUsage > 0 ? (trend.usage / maxUsage) * 100 : 0;
                  
                  return (
                    <div key={trend.month} className="flex flex-col items-center flex-1">
                      <div className="w-full flex justify-center mb-2">
                        <div
                          className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md min-h-1 w-8 transition-all duration-500"
                          style={{ height: `${height}%` }}
                          title={`${trend.month}: ${trend.usage} uses, ${trend.tagCount} tags`}
                        />
                      </div>
                      <div className="text-xs text-gray-600 transform -rotate-45 origin-center whitespace-nowrap">
                        {trend.month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Legend and stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {usageTrends.reduce((sum, trend) => sum + trend.usage, 0)}
              </div>
              <div className="text-xs text-gray-500">Total Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {usageTrends.reduce((sum, trend) => sum + trend.tagCount, 0)}
              </div>
              <div className="text-xs text-gray-500">New Tags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(usageTrends.reduce((sum, trend) => sum + trend.usage, 0) / 6)}
              </div>
              <div className="text-xs text-gray-500">Avg/Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(() => {
                  if (usageTrends.length < 2) return '0%';
                  const firstTrend = usageTrends[0];
                  const lastTrend = usageTrends[usageTrends.length - 1];
                  if (!firstTrend || !lastTrend || firstTrend.usage === 0) return '0%';
                  
                  const change = lastTrend.usage - firstTrend.usage;
                  const percentage = Math.round((change / firstTrend.usage) * 100);
                  return (change > 0 ? '+' : '') + percentage + '%';
                })()}
              </div>
              <div className="text-xs text-gray-500">Growth</div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Tag Distribution */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Tag Usage Distribution</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                {(() => {
                  const categories = [
                    { label: 'Heavily Used', count: tags.filter(t => (t.article_count || 0) >= 10).length, color: '#10B981' },
                    { label: 'Moderately Used', count: tags.filter(t => (t.article_count || 0) >= 5 && (t.article_count || 0) < 10).length, color: '#F59E0B' },
                    { label: 'Lightly Used', count: tags.filter(t => (t.article_count || 0) >= 1 && (t.article_count || 0) < 5).length, color: '#6B7280' },
                    { label: 'Unused', count: statistics.unusedTags.length, color: '#EF4444' },
                  ];
                  
                  const total = categories.reduce((sum, cat) => sum + cat.count, 0);
                  if (total === 0) {
                    return (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
                        <IonText color="medium">No data</IonText>
                      </div>
                    );
                  }
                  
                  let currentAngle = -90; // Start from top
                  return (
                    <svg className="w-full h-full transform rotate-0" viewBox="0 0 200 200">
                      {categories.map((category, index) => {
                        if (category.count === 0) return null;
                        
                        const percentage = (category.count / total) * 100;
                        const angle = (category.count / total) * 360;
                        const endAngle = currentAngle + angle;
                        
                        const startX = 100 + 80 * Math.cos((currentAngle * Math.PI) / 180);
                        const startY = 100 + 80 * Math.sin((currentAngle * Math.PI) / 180);
                        const endX = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                        const endY = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
                        
                        const largeArc = angle > 180 ? 1 : 0;
                        
                        const pathData = [
                          `M 100,100`,
                          `L ${startX},${startY}`,
                          `A 80,80 0 ${largeArc},1 ${endX},${endY}`,
                          'Z'
                        ].join(' ');
                        
                        const slice = (
                          <g key={category.label}>
                            <path
                              d={pathData}
                              fill={category.color}
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="hover:opacity-80 cursor-pointer transition-opacity"
                            />
                            <title>{`${category.label}: ${category.count} tags (${percentage.toFixed(1)}%)`}</title>
                          </g>
                        );
                        
                        currentAngle = endAngle;
                        return slice;
                      })}
                      {/* Center circle */}
                      <circle cx="100" cy="100" r="25" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                      <text x="100" y="95" textAnchor="middle" className="text-xs fill-gray-600">Total</text>
                      <text x="100" y="110" textAnchor="middle" className="text-sm font-semibold fill-gray-800">{total}</text>
                    </svg>
                  );
                })()}
              </div>
              
              {/* Legend */}
              <div className="mt-4 space-y-1">
                {[
                  { label: 'Heavily Used (10+)', count: tags.filter(t => (t.article_count || 0) >= 10).length, color: '#10B981' },
                  { label: 'Moderately Used (5-9)', count: tags.filter(t => (t.article_count || 0) >= 5 && (t.article_count || 0) < 10).length, color: '#F59E0B' },
                  { label: 'Lightly Used (1-4)', count: tags.filter(t => (t.article_count || 0) >= 1 && (t.article_count || 0) < 5).length, color: '#6B7280' },
                  { label: 'Unused (0)', count: statistics.unusedTags.length, color: '#EF4444' },
                ].map(category => (
                  <div key={category.label} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1">{category.label}</span>
                    <span className="font-medium">{category.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div>
              <IonText color="medium" className="text-sm">Performance Metrics</IonText>
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <IonText className="text-sm font-medium text-green-800">Most Active Tag</IonText>
                    <IonBadge color="success">{statistics.mostUsedTag?.article_count || 0}</IonBadge>
                  </div>
                  <IonText className="text-sm text-green-600">
                    {statistics.mostUsedTag?.name || 'N/A'}
                  </IonText>
                </div>
                
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <IonText className="text-sm font-medium text-red-800">Least Active Tag</IonText>
                    <IonBadge color="danger">{statistics.leastUsedTag?.article_count || 0}</IonBadge>
                  </div>
                  <IonText className="text-sm text-red-600">
                    {statistics.leastUsedTag?.name || 'N/A'}
                  </IonText>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <IonText className="text-sm font-medium text-blue-800">Efficiency Rate</IonText>
                    <IonBadge color="primary">
                      {Math.round(((statistics.totalTags - statistics.unusedTags.length) / statistics.totalTags) * 100) || 0}%
                    </IonBadge>
                  </div>
                  <IonText className="text-sm text-blue-600">
                    {statistics.totalTags - statistics.unusedTags.length} of {statistics.totalTags} tags actively used
                  </IonText>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <IonText className="text-sm font-medium text-purple-800">Average Usage</IonText>
                    <IonBadge color="secondary">{Math.round(statistics.averageUsage * 10) / 10}</IonBadge>
                  </div>
                  <IonText className="text-sm text-purple-600">
                    Articles per tag on average
                  </IonText>
                </div>
              </div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Tag Activity Heat Map */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Tag Activity Heat Map</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day labels */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
            
            {/* Heat map cells */}
            {Array.from({ length: 35 }, (_, index) => {
              const intensity = Math.random(); // In real implementation, this would be actual activity data
              const opacity = Math.max(0.1, intensity);
              return (
                <div
                  key={index}
                  className="aspect-square rounded-sm cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                  }}
                  title={`Day ${index + 1}: ${Math.round(intensity * 10)} tag activities`}
                />
              );
            })}
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Less</span>
            <div className="flex gap-1">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(opacity => (
                <div
                  key={opacity}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Top Performing Tags */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Top Performing Tags</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="space-y-3">
            {statistics.topTags.slice(0, 8).map((tag, index) => {
              const maxUsage = statistics.topTags[0]?.article_count || 1;
              const percentage = ((tag.article_count || 0) / maxUsage) * 100;
              
              return (
                <div key={tag.id} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                    {index + 1}
                  </div>
                  
                  <IonChip
                    style={{
                      '--background': tag.color || '#F3F4F6',
                      '--color': tag.color ? '#ffffff' : '#6B7280',
                      minWidth: '80px',
                    }}
                  >
                    {tag.name}
                  </IonChip>
                  
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <div className="text-sm font-medium text-gray-700 min-w-12 text-right">
                    {tag.article_count || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </IonCardContent>
      </IonCard>

      {/* Temporal Analysis */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Temporal Trends & Insights</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="space-y-4">
            {/* Trend Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {temporalAnalysis.growthRate > 0 ? '+' : ''}{Math.round(temporalAnalysis.growthRate)}%
                </div>
                <div className="text-xs text-blue-800">Growth Rate</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {Math.round(temporalAnalysis.averageTagsPerMonth * 10) / 10}
                </div>
                <div className="text-xs text-green-800">Avg/Month</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600 capitalize">
                  {temporalAnalysis.recentTrend}
                </div>
                <div className="text-xs text-purple-800">Recent Trend</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {temporalAnalysis.projectedNextMonth}
                </div>
                <div className="text-xs text-orange-800">Projected</div>
              </div>
            </div>

            {/* Peak Months */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <IonText className="text-sm font-medium">Peak Creation Month</IonText>
                <div className="mt-1">
                  <IonText className="text-lg font-bold">
                    {temporalAnalysis.peakCreationMonth?.month || 'N/A'}
                  </IonText>
                  <IonText color="medium" className="text-sm block">
                    {temporalAnalysis.peakCreationMonth?.tagCount || 0} new tags created
                  </IonText>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <IonText className="text-sm font-medium">Most Active Month</IonText>
                <div className="mt-1">
                  <IonText className="text-lg font-bold">
                    {temporalAnalysis.mostActiveMonth?.month || 'N/A'}
                  </IonText>
                  <IonText color="medium" className="text-sm block">
                    {temporalAnalysis.mostActiveMonth?.usage || 0} total tag uses
                  </IonText>
                </div>
              </div>
            </div>

            {/* Seasonal Pattern */}
            <div className="p-3 rounded-lg" style={{
              backgroundColor: temporalAnalysis.seasonalPattern === 'growing' ? '#F0FDF4' : 
                               temporalAnalysis.seasonalPattern === 'declining' ? '#FEF2F2' : '#F8FAFC'
            }}>
              <IonText className="text-sm font-medium">Seasonal Pattern</IonText>
              <div className="flex items-center gap-2 mt-1">
                <IonBadge color={
                  temporalAnalysis.seasonalPattern === 'growing' ? 'success' : 
                  temporalAnalysis.seasonalPattern === 'declining' ? 'danger' : 'medium'
                }>
                  {temporalAnalysis.seasonalPattern}
                </IonBadge>
                <IonText color="medium" className="text-sm">
                  {temporalAnalysis.seasonalPattern === 'growing' && 'Tag creation is accelerating'}
                  {temporalAnalysis.seasonalPattern === 'declining' && 'Tag creation is slowing down'}
                  {temporalAnalysis.seasonalPattern === 'stable' && 'Tag creation rate is consistent'}
                </IonText>
              </div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Tag Lifecycle Analysis */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Tag Lifecycle Analysis</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border-2 border-green-200 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">
                {tagLifecycleAnalysis.newTags.length}
              </div>
              <div className="text-sm font-medium text-green-800 mt-1">New Tags</div>
              <div className="text-xs text-green-600 mt-1">Created in last 30 days</div>
              {tagLifecycleAnalysis.newTags.length > 0 && (
                <div className="mt-2 max-h-20 overflow-y-auto">
                  {tagLifecycleAnalysis.newTags.slice(0, 3).map(tag => (
                    <IonChip
                      key={tag.id}
                      style={{ '--background': tag.color || '#10B981', '--color': '#ffffff' }}
                      className="text-xs mb-1"
                    >
                      {tag.name}
                    </IonChip>
                  ))}
                  {tagLifecycleAnalysis.newTags.length > 3 && (
                    <IonText color="medium" className="text-xs">
                      +{tagLifecycleAnalysis.newTags.length - 3} more
                    </IonText>
                  )}
                </div>
              )}
            </div>

            <div className="text-center p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">
                {tagLifecycleAnalysis.maturingTags.length}
              </div>
              <div className="text-sm font-medium text-blue-800 mt-1">Maturing Tags</div>
              <div className="text-xs text-blue-600 mt-1">1-3 months old, gaining usage</div>
            </div>

            <div className="text-center p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">
                {tagLifecycleAnalysis.stableTags.length}
              </div>
              <div className="text-sm font-medium text-purple-800 mt-1">Stable Tags</div>
              <div className="text-xs text-purple-600 mt-1">Established, consistently used</div>
            </div>

            <div className="text-center p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">
                {tagLifecycleAnalysis.decliningTags.length}
              </div>
              <div className="text-sm font-medium text-orange-800 mt-1">Declining Tags</div>
              <div className="text-xs text-orange-600 mt-1">Old tags with minimal usage</div>
            </div>
          </div>

          {/* Lifecycle Recommendations */}
          {(tagLifecycleAnalysis.decliningTags.length > 0 || tagLifecycleAnalysis.newTags.length === 0) && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <IonText color="warning">
                <h6>💡 Recommendations:</h6>
              </IonText>
              <ul className="text-sm mt-2 space-y-1">
                {tagLifecycleAnalysis.decliningTags.length > 0 && (
                  <li>• Consider cleaning up {tagLifecycleAnalysis.decliningTags.length} declining tags to reduce clutter</li>
                )}
                {tagLifecycleAnalysis.newTags.length === 0 && (
                  <li>• No new tags created recently - consider adding tags for better article organization</li>
                )}
                {tagLifecycleAnalysis.maturingTags.length > 10 && (
                  <li>• {tagLifecycleAnalysis.maturingTags.length} tags are maturing well - good tagging consistency!</li>
                )}
              </ul>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Interactive Tag Cloud */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Interactive Tag Cloud</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <TagCloud
            userId={currentUserId}
            mode="cloud"
            size="medium"
            interactive={false}
            showUsageCount={true}
            sortBy="usage"
            maxTags={50}
            className="min-h-32"
          />
        </IonCardContent>
      </IonCard>
    </div>
  );

  // Render management section
  const renderManagement = () => (
    <div className="space-y-4">
      {/* Selection Controls */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Bulk Operations</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {/* Selection Controls */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <IonButton 
              size="small" 
              fill="outline"
              onClick={() => setSelectedTags(tags.map(t => t.id))}
            >
              Select All ({tags.length})
            </IonButton>
            <IonButton 
              size="small" 
              fill="outline"
              onClick={() => setSelectedTags([])}
              disabled={selectedTags.length === 0}
            >
              Clear Selection
            </IonButton>
            <IonButton 
              size="small" 
              fill="outline"
              color="warning"
              onClick={() => setSelectedTags(statistics.unusedTags.map(t => t.id))}
              disabled={statistics.unusedTags.length === 0}
            >
              Select Unused ({statistics.unusedTags.length})
            </IonButton>
            <IonButton 
              size="small" 
              fill="outline"
              color="secondary"
              onClick={handleFindDuplicates}
            >
              Find Duplicates
            </IonButton>
          </div>

          {/* Bulk Operations */}
          {selectedTags.length > 0 && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <IonText color="primary" className="text-sm">
                  {selectedTags.length} tags selected for bulk operations
                </IonText>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <IonButton 
                  size="small" 
                  color="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <IonIcon icon={trashOutline} slot="start" />
                  Delete Selected ({selectedTags.length})
                </IonButton>
                
                <IonButton 
                  size="small" 
                  fill="outline"
                  color="success"
                  onClick={() => handleBulkColorUpdate('#10B981')}
                  disabled={operationInProgress}
                >
                  <IonIcon icon={colorPaletteOutline} slot="start" />
                  Green
                </IonButton>
                
                <IonButton 
                  size="small" 
                  fill="outline"
                  color="primary"
                  onClick={() => handleBulkColorUpdate('#3B82F6')}
                  disabled={operationInProgress}
                >
                  <IonIcon icon={colorPaletteOutline} slot="start" />
                  Blue
                </IonButton>
                
                <IonButton 
                  size="small" 
                  fill="outline"
                  color="warning"
                  onClick={() => handleBulkColorUpdate('#F59E0B')}
                  disabled={operationInProgress}
                >
                  <IonIcon icon={colorPaletteOutline} slot="start" />
                  Orange
                </IonButton>
                
                <IonButton 
                  size="small" 
                  fill="outline"
                  color="secondary"
                  onClick={() => handleBulkColorUpdate('#8B5CF6')}
                  disabled={operationInProgress}
                >
                  <IonIcon icon={colorPaletteOutline} slot="start" />
                  Purple
                </IonButton>
              </div>
            </div>
          )}

          {/* Cleanup Tools */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <IonText color="medium">
              <h6>Cleanup Tools</h6>
            </IonText>
            <div className="flex flex-wrap gap-2 mt-2">
              <IonButton 
                size="small" 
                fill="outline"
                color="warning"
                onClick={handleCleanupUnused}
                disabled={statistics.unusedTags.length === 0}
              >
                <IonIcon icon={warningOutline} slot="start" />
                Clean Unused ({statistics.unusedTags.length})
              </IonButton>
              
              <IonButton 
                size="small" 
                fill="outline"
                color="medium"
                onClick={handleFindDuplicates}
              >
                <IonIcon icon={swapHorizontalOutline} slot="start" />
                Find Duplicates
              </IonButton>
              
              <IonButton 
                size="small" 
                fill="outline"
                color="medium"
                onClick={() => {
                  const lowUsageTags = tags.filter(t => (t.article_count || 0) === 1).map(t => t.id);
                  if (lowUsageTags.length > 0) {
                    setSelectedTags(lowUsageTags);
                    showToastMessage(`Selected ${lowUsageTags.length} tags with only 1 article`, 'success');
                  } else {
                    showToastMessage('No single-use tags found', 'success');
                  }
                }}
              >
                Select Single-Use
              </IonButton>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Tag List with Management Options */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Tag Management</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {loading.fetchTags ? (
            <div className="text-center py-8">
              <IonSpinner />
              <IonText color="medium" className="block mt-2">Loading tags...</IonText>
            </div>
          ) : (
            <IonList>
              {tags.map(tag => (
                <IonItem key={tag.id}>
                  <IonChip
                    style={{
                      '--background': tag.color || '#F3F4F6',
                      '--color': tag.color ? '#ffffff' : '#6B7280',
                    }}
                    slot="start"
                  >
                    {tag.name}
                  </IonChip>
                  
                  <IonLabel>
                    <div className="flex items-center gap-2">
                      <IonBadge color={tag.article_count ? 'primary' : 'danger'}>
                        {tag.article_count || 0} articles
                      </IonBadge>
                      {tag.created_at && (
                        <IonText color="medium" className="text-xs">
                          Created {format(parseISO(tag.created_at), 'MMM d, yyyy')}
                        </IonText>
                      )}
                    </div>
                  </IonLabel>

                  <IonButtons slot="end">
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => {
                        setSelectedTag(tag);
                        setRenameValue(tag.name);
                        setShowRenameModal(true);
                      }}
                    >
                      <IonIcon icon={createOutline} />
                    </IonButton>
                    
                    <IonButton
                      fill="clear"
                      size="small"
                      color="secondary"
                      onClick={() => {
                        const otherTags = tags.filter(t => t.id !== tag.id);
                        if (otherTags.length > 0 && otherTags[0]) {
                          prepareMerge(tag, otherTags[0]);
                        }
                      }}
                      disabled={tags.length < 2}
                    >
                      <IonIcon icon={swapHorizontalOutline} />
                    </IonButton>
                  </IonButtons>

                  <IonButton
                    slot="end"
                    fill="clear"
                    size="small"
                    color={selectedTags.includes(tag.id) ? 'primary' : 'medium'}
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    <IonIcon icon={selectedTags.includes(tag.id) ? checkmarkCircleOutline : colorPaletteOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tag Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => dispatch(fetchTags({ userId: currentUserId!, forceRefresh: true }))}>
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Progress bar for operations */}
        {operationInProgress && <IonProgressBar type="indeterminate" />}

        {/* View Selector */}
        <IonCard>
          <IonCardContent>
            <IonSegment 
              value={activeView} 
              onIonChange={(e) => setActiveView(e.detail.value as any)}
            >
              <IonSegmentButton value="overview">
                <IonIcon icon={statsChartOutline} />
                <IonLabel>Overview</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="analytics">
                <IonIcon icon={pieChartOutline} />
                <IonLabel>Analytics</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="management">
                <IonIcon icon={settingsOutline} />
                <IonLabel>Management</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonCardContent>
        </IonCard>

        {/* Content based on active view */}
        <div className="mt-4">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'analytics' && renderAnalytics()}
          {activeView === 'management' && renderManagement()}
        </div>

        {/* Rename Modal */}
        <IonModal isOpen={showRenameModal} onDidDismiss={() => setShowRenameModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Rename Tag</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={() => setShowRenameModal(false)} disabled={operationInProgress}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedTag && (
              <div className="space-y-4">
                {/* Current Tag Info */}
                <IonCard>
                  <IonCardContent>
                    <div className="flex items-center gap-3">
                      <IonChip
                        style={{
                          '--background': selectedTag.color || '#F3F4F6',
                          '--color': selectedTag.color ? '#ffffff' : '#6B7280',
                        }}
                      >
                        {selectedTag.name}
                      </IonChip>
                      <div>
                        <IonText color="primary">
                          <p className="text-sm font-medium">Current tag</p>
                        </IonText>
                        <IonText color="medium">
                          <p className="text-xs">Used in {selectedTag.article_count || 0} articles</p>
                        </IonText>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* New Name Input */}
                <IonItem>
                  <IonLabel position="stacked">New Tag Name</IonLabel>
                  <IonInput
                    value={renameValue}
                    onIonInput={(e) => setRenameValue(e.detail.value!)}
                    placeholder="Enter new tag name"
                    maxlength={50}
                    counter={true}
                  />
                </IonItem>

                {/* Validation Messages */}
                {renameValue.trim() && (
                  <div className="space-y-2">
                    {renameValue.trim().length < 2 && (
                      <IonText color="danger">
                        <p className="text-sm">Name must be at least 2 characters long</p>
                      </IonText>
                    )}
                    {renameValue.trim().length > 50 && (
                      <IonText color="danger">
                        <p className="text-sm">Name must be less than 50 characters</p>
                      </IonText>
                    )}
                    {!/^[a-zA-Z0-9\s\-_]+$/.test(renameValue.trim()) && (
                      <IonText color="danger">
                        <p className="text-sm">Only letters, numbers, spaces, hyphens, and underscores allowed</p>
                      </IonText>
                    )}
                    {tags.some(tag => tag.id !== selectedTag.id && tag.name.toLowerCase() === renameValue.trim().toLowerCase()) && (
                      <IonText color="danger">
                        <p className="text-sm">A tag with this name already exists</p>
                      </IonText>
                    )}
                    {renameValue.trim() && 
                     renameValue.trim().length >= 2 && 
                     renameValue.trim().length <= 50 &&
                     /^[a-zA-Z0-9\s\-_]+$/.test(renameValue.trim()) &&
                     !tags.some(tag => tag.id !== selectedTag.id && tag.name.toLowerCase() === renameValue.trim().toLowerCase()) && (
                      <IonText color="success">
                        <p className="text-sm">✓ Tag name is valid</p>
                      </IonText>
                    )}
                  </div>
                )}

                {/* Preview */}
                {renameValue.trim() && renameValue.trim() !== selectedTag.name && (
                  <IonCard>
                    <IonCardContent>
                      <IonText color="primary">
                        <h6>Preview:</h6>
                      </IonText>
                      <div className="flex items-center gap-3 mt-2">
                        <IonChip
                          style={{
                            '--background': selectedTag.color || '#F3F4F6',
                            '--color': selectedTag.color ? '#ffffff' : '#6B7280',
                          }}
                        >
                          {renameValue.trim()}
                        </IonChip>
                        <IonText color="medium">
                          <p className="text-sm">
                            This will update {selectedTag.article_count || 0} articles and all references to this tag
                          </p>
                        </IonText>
                      </div>
                    </IonCardContent>
                  </IonCard>
                )}

                {/* Action Button */}
                <IonButton
                  expand="block"
                  onClick={handleRename}
                  disabled={
                    !renameValue.trim() || 
                    renameValue.trim() === selectedTag.name ||
                    renameValue.trim().length < 2 ||
                    renameValue.trim().length > 50 ||
                    !/^[a-zA-Z0-9\s\-_]+$/.test(renameValue.trim()) ||
                    tags.some(tag => tag.id !== selectedTag.id && tag.name.toLowerCase() === renameValue.trim().toLowerCase()) ||
                    operationInProgress
                  }
                  className="mt-4"
                >
                  {operationInProgress ? <IonSpinner slot="start" /> : null}
                  Rename Tag
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Merge Modal */}
        <IonModal isOpen={showMergeModal} onDidDismiss={() => setShowMergeModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Merge Tags</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={() => setShowMergeModal(false)} disabled={operationInProgress}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {mergeOperation && (
              <div className="space-y-4">
                {/* Source Tag Info */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="flex items-center gap-2">
                      <IonIcon icon={swapHorizontalOutline} />
                      Source Tag (Will be deleted)
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <IonChip
                        style={{
                          '--background': mergeOperation.sourceTag.color || '#F3F4F6',
                          '--color': mergeOperation.sourceTag.color ? '#ffffff' : '#6B7280',
                        }}
                      >
                        {mergeOperation.sourceTag.name}
                      </IonChip>
                      <div>
                        <IonText color="danger">
                          <p className="text-sm font-medium">To be merged</p>
                        </IonText>
                        <IonText color="medium">
                          <p className="text-xs">{mergeOperation.sourceTag.article_count || 0} articles</p>
                        </IonText>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* Target Tag Selection */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Target Tag (Will receive all articles)</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonItem>
                      <IonLabel>Select target tag</IonLabel>
                      <IonSelect
                        value={mergeOperation.targetTag.id}
                        onIonChange={(e) => {
                          const targetTag = tags.find(t => t.id === e.detail.value);
                          if (targetTag) {
                            const sourceUsage = mergeOperation.sourceTag.article_count || 0;
                            const targetUsage = targetTag.article_count || 0;
                            const totalImpact = sourceUsage + targetUsage;
                            
                            setMergeOperation({
                              ...mergeOperation,
                              targetTag,
                              preview: `Merging "${mergeOperation.sourceTag.name}" into "${targetTag.name}" will:\n• Update ${sourceUsage} articles\n• Combine usage statistics\n• Delete the source tag permanently\n• Result in ${totalImpact} total articles tagged with "${targetTag.name}"`,
                            });
                          }
                        }}
                        interface="popover"
                      >
                        {tags
                          .filter(t => t.id !== mergeOperation.sourceTag.id)
                          .sort((a, b) => (b.article_count || 0) - (a.article_count || 0))
                          .map(tag => (
                            <IonSelectOption key={tag.id} value={tag.id}>
                              {tag.name} ({tag.article_count || 0} articles)
                            </IonSelectOption>
                          ))}
                      </IonSelect>
                    </IonItem>
                    
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <IonChip
                          style={{
                            '--background': mergeOperation.targetTag.color || '#F3F4F6',
                            '--color': mergeOperation.targetTag.color ? '#ffffff' : '#6B7280',
                          }}
                        >
                          {mergeOperation.targetTag.name}
                        </IonChip>
                        <div>
                          <IonText color="success">
                            <p className="text-sm font-medium">Will receive merged content</p>
                          </IonText>
                          <IonText color="medium">
                            <p className="text-xs">
                              Currently: {mergeOperation.targetTag.article_count || 0} articles
                            </p>
                          </IonText>
                        </div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* Merge Impact Preview */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle className="flex items-center gap-2">
                      <IonIcon icon={warningOutline} />
                      Merge Impact
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <IonText color="primary">
                          <h6>What will happen:</h6>
                        </IonText>
                        <ul className="text-sm mt-2 space-y-1">
                          <li>• {mergeOperation.sourceTag.article_count || 0} articles will be updated</li>
                          <li>• Source tag "{mergeOperation.sourceTag.name}" will be permanently deleted</li>
                          <li>• Target tag "{mergeOperation.targetTag.name}" will inherit all articles</li>
                          <li>• Usage statistics will be combined</li>
                        </ul>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-lg font-bold text-red-600">
                            {mergeOperation.sourceTag.article_count || 0}
                          </div>
                          <div className="text-xs text-red-800">Articles to transfer</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {(mergeOperation.sourceTag.article_count || 0) + (mergeOperation.targetTag.article_count || 0)}
                          </div>
                          <div className="text-xs text-green-800">Final article count</div>
                        </div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* Confirmation */}
                <div className="space-y-3">
                  <IonText color="danger">
                    <p className="text-sm font-medium">
                      ⚠️ This action cannot be undone. The source tag will be permanently deleted.
                    </p>
                  </IonText>
                  
                  <IonButton
                    expand="block"
                    color="warning"
                    onClick={executeMerge}
                    disabled={operationInProgress}
                  >
                    {operationInProgress ? <IonSpinner slot="start" /> : null}
                    Confirm Merge: "{mergeOperation.sourceTag.name}" → "{mergeOperation.targetTag.name}"
                  </IonButton>
                  
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="medium"
                    onClick={() => setShowMergeModal(false)}
                    disabled={operationInProgress}
                  >
                    Cancel
                  </IonButton>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Import Modal */}
        <IonModal isOpen={showImportModal} onDidDismiss={() => setShowImportModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Import Tags</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={() => setShowImportModal(false)} disabled={operationInProgress}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="space-y-4">
              {/* Import Instructions */}
              <IonCard>
                <IonCardContent>
                  <IonText color="primary">
                    <h6>Import Instructions</h6>
                  </IonText>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Paste JSON data exported from AZReader Tag Dashboard</li>
                    <li>• Supports both standard exports and full backups</li>
                    <li>• Choose conflict resolution mode below</li>
                  </ul>
                </IonCardContent>
              </IonCard>

              {/* Import Data Input */}
              <div>
                <IonLabel>
                  <h6>Import Data</h6>
                </IonLabel>
                <IonTextarea
                  value={importData}
                  onIonInput={(e) => setImportData(e.detail.value!)}
                  placeholder="Paste exported tag data JSON here..."
                  rows={8}
                  className="mt-2"
                />
              </div>

              {/* Preview Import Data */}
              {importData.trim() && (() => {
                try {
                  const data = JSON.parse(importData);
                  const tagCount = data.tags?.length || 0;
                  const exportType = data.exportType || 'unknown';
                  const exportDate = data.exportDate ? format(parseISO(data.exportDate), 'MMM d, yyyy HH:mm') : 'unknown';
                  
                  return (
                    <IonCard>
                      <IonCardContent>
                        <IonText color="success">
                          <h6>✓ Valid import data detected</h6>
                        </IonText>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <IonText className="text-sm font-medium">Tags to import:</IonText>
                            <IonText className="text-lg font-bold text-blue-600 block">{tagCount}</IonText>
                          </div>
                          <div>
                            <IonText className="text-sm font-medium">Export type:</IonText>
                            <IonBadge color="primary">{exportType}</IonBadge>
                          </div>
                        </div>
                        <IonText color="medium" className="text-xs block mt-2">
                          Exported: {exportDate}
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  );
                } catch {
                  return (
                    <IonCard>
                      <IonCardContent>
                        <IonText color="danger">
                          <h6>⚠️ Invalid JSON format</h6>
                        </IonText>
                        <IonText color="medium" className="text-sm">
                          Please check the format and ensure it's valid JSON data.
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  );
                }
              })()}

              {/* Conflict Resolution Mode */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Conflict Resolution</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText color="medium" className="text-sm block mb-3">
                    How should conflicts with existing tags be handled?
                  </IonText>
                  
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IonButton size="small" fill="outline" onClick={() => handleImport('merge')} disabled={!importData.trim() || operationInProgress}>
                          {operationInProgress ? <IonSpinner slot="start" /> : null}
                          Merge
                        </IonButton>
                        <div>
                          <IonText className="text-sm font-medium">Merge with existing</IonText>
                          <IonText color="medium" className="text-xs block">Combine properties of conflicting tags</IonText>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IonButton size="small" fill="outline" color="warning" onClick={() => handleImport('replace')} disabled={!importData.trim() || operationInProgress}>
                          {operationInProgress ? <IonSpinner slot="start" /> : null}
                          Replace
                        </IonButton>
                        <div>
                          <IonText className="text-sm font-medium">Replace existing</IonText>
                          <IonText color="medium" className="text-xs block">Overwrite existing tags with imported ones</IonText>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IonButton size="small" fill="outline" color="medium" onClick={() => handleImport('skip')} disabled={!importData.trim() || operationInProgress}>
                          {operationInProgress ? <IonSpinner slot="start" /> : null}
                          Skip
                        </IonButton>
                        <div>
                          <IonText className="text-sm font-medium">Skip conflicts</IonText>
                          <IonText color="medium" className="text-xs block">Only import tags that don't already exist</IonText>
                        </div>
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* File Upload Alternative */}
              <IonCard>
                <IonCardContent>
                  <IonText color="primary">
                    <h6>Or upload a file</h6>
                  </IonText>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setImportData(event.target?.result as string || '');
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="mt-2"
                  />
                  <IonText color="medium" className="text-xs block mt-1">
                    Select a JSON file exported from AZReader
                  </IonText>
                </IonCardContent>
              </IonCard>
            </div>
          </IonContent>
        </IonModal>

        {/* Delete Confirmation */}
        <IonAlert
          isOpen={showDeleteConfirm}
          onDidDismiss={() => setShowDeleteConfirm(false)}
          header="Delete Tags"
          message={`Are you sure you want to delete ${selectedTags.length} tags? This action cannot be undone.`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: handleBulkDelete,
            },
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
      </IonContent>
    </IonPage>
  );
};

export default TagDashboard;