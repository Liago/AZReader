import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonToggle,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonRange,
  IonText,
  IonInput,
  IonLoading,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonBadge,
  IonModal,
  IonTextarea,
  IonCheckbox,
  IonSegment,
  IonSegmentButton,
  IonAccordion,
  IonAccordionGroup,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import {
  shield,
  shieldCheckmark,
  eye,
  eyeOff,
  people,
  person,
  globe,
  lockClosed,
  notifications,
  settings,
  download,
  cloudUpload,
  refresh,
  checkmark,
  close,
  informationCircle,
  warning,
  document,
  time,
  search,
  heart,
  chatbubble,
  bookmark,
  personAdd,
  mail,
  call,
  home,
  business,
  calendarOutline,
  imageOutline,
  chatbubbleOutline,
} from 'ionicons/icons';
import { useAdvancedPrivacy, AdvancedPrivacySettings, FollowRequest } from '@hooks/useAdvancedPrivacy';
import { formatDistanceToNow } from 'date-fns';

export interface AdvancedPrivacySettingsProps {
  onClose?: () => void;
  className?: string;
}

interface FollowRequestItemProps {
  request: FollowRequest;
  type: 'incoming' | 'outgoing';
  onApprove?: (requestId: string) => void;
  onDeny?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

// Follow Request Item Component
const FollowRequestItem: React.FC<FollowRequestItemProps> = ({
  request,
  type,
  onApprove,
  onDeny,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
    } finally {
      setIsProcessing(false);
    }
  };

  const getAvatarUrl = () => {
    const user = type === 'incoming' ? request.requester : (request as any).target_user;
    if (user?.avatar_url) return user.avatar_url;
    
    const email = user?.email || 'user';
    const initials = (user?.name || email).substring(0, 2).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=random&format=svg`;
  };

  const getUserName = () => {
    const user = type === 'incoming' ? request.requester : (request as any).target_user;
    return user?.name || user?.email?.split('@')[0] || 'Unknown User';
  };

  const getUserEmail = () => {
    const user = type === 'incoming' ? request.requester : (request as any).target_user;
    return user?.email || '';
  };

  return (
    <IonCard>
      <IonCardContent>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <img
              src={getAvatarUrl()}
              alt={getUserName()}
              className="w-12 h-12 rounded-full border-2 border-gray-200"
            />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {getUserName()}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {getUserEmail()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
              </p>
              
              {request.message && (
                <p className="text-sm text-gray-600 mt-2 italic">
                  "{request.message}"
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {type === 'incoming' ? (
              <>
                <IonButton
                  size="small"
                  fill="clear"
                  color="success"
                  onClick={() => handleAction(() => onApprove?.(request.id))}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <IonSpinner name="dots" />
                  ) : (
                    <IonIcon icon={checkmark} />
                  )}
                </IonButton>
                <IonButton
                  size="small"
                  fill="clear"
                  color="danger"
                  onClick={() => handleAction(() => onDeny?.(request.id))}
                  disabled={isProcessing}
                >
                  <IonIcon icon={close} />
                </IonButton>
              </>
            ) : (
              <IonButton
                size="small"
                fill="clear"
                color="medium"
                onClick={() => handleAction(() => onCancel?.(request.id))}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <IonSpinner name="dots" />
                ) : (
                  <IonIcon icon={close} />
                )}
              </IonButton>
            )}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// Main Advanced Privacy Settings Component
const AdvancedPrivacySettings: React.FC<AdvancedPrivacySettingsProps> = ({
  onClose,
  className = '',
}) => {
  const {
    settings,
    isLoading,
    error,
    updateSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    followRequests,
    sentRequests,
    respondToFollowRequest,
    cancelFollowRequest,
    auditLog,
    loadAuditLog,
  } = useAdvancedPrivacy();

  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'requests' | 'audit'>('profile');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetAlert, setShowResetAlert] = useState(false);
  const [importData, setImportData] = useState('');
  const [exportedData, setExportedData] = useState('');

  // Handle setting updates
  const handleSettingChange = async <K extends keyof AdvancedPrivacySettings>(
    key: K,
    value: AdvancedPrivacySettings[K]
  ) => {
    await updateSettings({ [key]: value });
  };

  // Handle export
  const handleExport = () => {
    const data = exportSettings();
    setExportedData(data);
    setShowExportModal(true);
  };

  // Handle import
  const handleImport = async () => {
    if (!importData.trim()) return;
    
    const success = await importSettings(importData);
    if (success) {
      setImportData('');
      setShowImportModal(false);
    }
  };

  // Handle follow request actions
  const handleApproveRequest = async (requestId: string) => {
    await respondToFollowRequest(requestId, 'approved');
  };

  const handleDenyRequest = async (requestId: string) => {
    await respondToFollowRequest(requestId, 'denied');
  };

  const handleCancelRequest = async (requestId: string) => {
    await cancelFollowRequest(requestId);
  };

  // Handle reset to defaults
  const handleReset = async () => {
    await resetToDefaults();
    setShowResetAlert(false);
  };

  if (isLoading && !settings) {
    return (
      <IonLoading 
        isOpen={isLoading} 
        message="Loading privacy settings..." 
        className={className}
      />
    );
  }

  if (error && !settings) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <IonIcon icon={warning} className="text-4xl text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Error Loading Settings
        </h3>
        <p className="text-red-600">{error}</p>
        <IonButton onClick={() => window.location.reload()} className="mt-4">
          Retry
        </IonButton>
      </div>
    );
  }

  return (
    <IonContent className={`advanced-privacy-settings ${className}`}>
      {/* Header */}
      <IonHeader>
        <IonToolbar>
          <IonTitle>Advanced Privacy Settings</IonTitle>
          {onClose && (
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      {/* Navigation Tabs */}
      <div className="sticky top-0 bg-white z-10 border-b">
        <IonSegment value={activeTab} onIonChange={e => setActiveTab(e.detail.value as any)}>
          <IonSegmentButton value="profile">
            <IonLabel>Profile</IonLabel>
            <IonIcon icon={person} />
          </IonSegmentButton>
          <IonSegmentButton value="activity">
            <IonLabel>Activity</IonLabel>
            <IonIcon icon={notifications} />
          </IonSegmentButton>
          <IonSegmentButton value="requests">
            <IonLabel>Requests</IonLabel>
            <IonIcon icon={personAdd} />
            {followRequests.length > 0 && (
              <IonBadge color="primary">{followRequests.length}</IonBadge>
            )}
          </IonSegmentButton>
          <IonSegmentButton value="audit">
            <IonLabel>Audit</IonLabel>
            <IonIcon icon={document} />
          </IonSegmentButton>
        </IonSegment>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Profile Privacy Settings */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Visibility */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center">
                  <IonIcon icon={eye} className="mr-2" />
                  Profile Visibility
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel>Profile Visibility</IonLabel>
                  <IonSelect
                    value={settings?.profile_visibility}
                    onIonChange={e => handleSettingChange('profile_visibility', e.detail.value)}
                  >
                    <IonSelectOption value="public">Public</IonSelectOption>
                    <IonSelectOption value="followers_only">Followers Only</IonSelectOption>
                    <IonSelectOption value="private">Private</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonAccordionGroup>
                  <IonAccordion value="profile-fields">
                    <IonItem slot="header">
                      <IonLabel>Profile Information</IonLabel>
                    </IonItem>
                    
                    <div slot="content" className="p-4">
                      <IonList>
                        <IonItem>
                          <IonIcon icon={imageOutline} slot="start" />
                          <IonLabel>Show Avatar</IonLabel>
                          <IonToggle
                            checked={settings?.show_avatar}
                            onIonChange={e => handleSettingChange('show_avatar', e.detail.checked)}
                          />
                        </IonItem>

                        <IonItem>
                          <IonIcon icon={mail} slot="start" />
                          <IonLabel>Show Email</IonLabel>
                          <IonToggle
                            checked={settings?.show_email}
                            onIonChange={e => handleSettingChange('show_email', e.detail.checked)}
                          />
                        </IonItem>

                        <IonItem>
                          <IonIcon icon={chatbubbleOutline} slot="start" />
                          <IonLabel>Show Bio</IonLabel>
                          <IonToggle
                            checked={settings?.show_bio}
                            onIonChange={e => handleSettingChange('show_bio', e.detail.checked)}
                          />
                        </IonItem>

                        <IonItem>
                          <IonIcon icon={business} slot="start" />
                          <IonLabel>Show Website</IonLabel>
                          <IonToggle
                            checked={settings?.show_website}
                            onIonChange={e => handleSettingChange('show_website', e.detail.checked)}
                          />
                        </IonItem>

                        <IonItem>
                          <IonIcon icon={calendarOutline} slot="start" />
                          <IonLabel>Show Join Date</IonLabel>
                          <IonToggle
                            checked={settings?.show_join_date}
                            onIonChange={e => handleSettingChange('show_join_date', e.detail.checked)}
                          />
                        </IonItem>
                      </IonList>
                    </div>
                  </IonAccordion>
                </IonAccordionGroup>
              </IonCardContent>
            </IonCard>

            {/* Following/Followers Settings */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center">
                  <IonIcon icon={people} className="mr-2" />
                  Following & Followers
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonLabel>Show Following List</IonLabel>
                    <IonToggle
                      checked={settings?.show_following_list}
                      onIonChange={e => handleSettingChange('show_following_list', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Show Followers List</IonLabel>
                    <IonToggle
                      checked={settings?.show_followers_list}
                      onIonChange={e => handleSettingChange('show_followers_list', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Show Following Count</IonLabel>
                    <IonToggle
                      checked={settings?.show_following_count}
                      onIonChange={e => handleSettingChange('show_following_count', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Show Followers Count</IonLabel>
                    <IonToggle
                      checked={settings?.show_followers_count}
                      onIonChange={e => handleSettingChange('show_followers_count', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>
                      <h3>Allow Follows From</h3>
                      <p>Who can follow you</p>
                    </IonLabel>
                    <IonSelect
                      value={settings?.allow_follows_from}
                      onIonChange={e => handleSettingChange('allow_follows_from', e.detail.value)}
                    >
                      <IonSelectOption value="everyone">Everyone</IonSelectOption>
                      <IonSelectOption value="nobody">Nobody</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel>
                      <h3>Require Follow Approval</h3>
                      <p>Manually approve new followers</p>
                    </IonLabel>
                    <IonToggle
                      checked={settings?.require_follow_approval}
                      onIonChange={e => handleSettingChange('require_follow_approval', e.detail.checked)}
                    />
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Discovery Settings */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center">
                  <IonIcon icon={search} className="mr-2" />
                  Discovery & Search
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonLabel>
                      <h3>Include in Discovery</h3>
                      <p>Appear in user recommendations</p>
                    </IonLabel>
                    <IonToggle
                      checked={settings?.include_in_discovery}
                      onIonChange={e => handleSettingChange('include_in_discovery', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>
                      <h3>Discoverable in Search</h3>
                      <p>Allow others to find you via search</p>
                    </IonLabel>
                    <IonToggle
                      checked={settings?.discoverable_in_search}
                      onIonChange={e => handleSettingChange('discoverable_in_search', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Default Article Privacy</IonLabel>
                    <IonSelect
                      value={settings?.articles_default_privacy}
                      onIonChange={e => handleSettingChange('articles_default_privacy', e.detail.value)}
                    >
                      <IonSelectOption value="public">Public</IonSelectOption>
                      <IonSelectOption value="followers_only">Followers Only</IonSelectOption>
                      <IonSelectOption value="private">Private</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Interaction Permissions */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center">
                  <IonIcon icon={chatbubble} className="mr-2" />
                  Interaction Permissions
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonLabel>
                      <h3>Allow Comments From</h3>
                      <p>Who can comment on your content</p>
                    </IonLabel>
                    <IonSelect
                      value={settings?.allow_comments_from}
                      onIonChange={e => handleSettingChange('allow_comments_from', e.detail.value)}
                    >
                      <IonSelectOption value="everyone">Everyone</IonSelectOption>
                      <IonSelectOption value="followers_only">Followers Only</IonSelectOption>
                      <IonSelectOption value="nobody">Nobody</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel>
                      <h3>Allow Likes From</h3>
                      <p>Who can like your content</p>
                    </IonLabel>
                    <IonSelect
                      value={settings?.allow_likes_from}
                      onIonChange={e => handleSettingChange('allow_likes_from', e.detail.value)}
                    >
                      <IonSelectOption value="everyone">Everyone</IonSelectOption>
                      <IonSelectOption value="followers_only">Followers Only</IonSelectOption>
                      <IonSelectOption value="nobody">Nobody</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Activity Privacy Settings */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center">
                  <IonIcon icon={notifications} className="mr-2" />
                  Activity Feed Settings
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonLabel>
                      <h3>Public Activity Feed</h3>
                      <p>Allow others to see your activity</p>
                    </IonLabel>
                    <IonToggle
                      checked={settings?.activity_feed_public}
                      onIonChange={e => handleSettingChange('activity_feed_public', e.detail.checked)}
                    />
                  </IonItem>

                  <IonListHeader>
                    <IonLabel>Visible Activities</IonLabel>
                  </IonListHeader>

                  <IonItem>
                    <IonIcon icon={bookmark} slot="start" />
                    <IonLabel>Reading Activity</IonLabel>
                    <IonToggle
                      checked={settings?.show_reading_activity}
                      onIonChange={e => handleSettingChange('show_reading_activity', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonIcon icon={heart} slot="start" />
                    <IonLabel>Like Activity</IonLabel>
                    <IonToggle
                      checked={settings?.show_like_activity}
                      onIonChange={e => handleSettingChange('show_like_activity', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonIcon icon={chatbubble} slot="start" />
                    <IonLabel>Comment Activity</IonLabel>
                    <IonToggle
                      checked={settings?.show_comment_activity}
                      onIonChange={e => handleSettingChange('show_comment_activity', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonIcon icon={bookmark} slot="start" />
                    <IonLabel>Save Activity</IonLabel>
                    <IonToggle
                      checked={settings?.show_save_activity}
                      onIonChange={e => handleSettingChange('show_save_activity', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonIcon icon={personAdd} slot="start" />
                    <IonLabel>Follow Activity</IonLabel>
                    <IonToggle
                      checked={settings?.show_follow_activity}
                      onIonChange={e => handleSettingChange('show_follow_activity', e.detail.checked)}
                    />
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Notification Preferences */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center">
                  <IonIcon icon={notifications} className="mr-2" />
                  Notification Preferences
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonLabel>Notify on Follow</IonLabel>
                    <IonToggle
                      checked={settings?.notify_on_follow}
                      onIonChange={e => handleSettingChange('notify_on_follow', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Notify on Like</IonLabel>
                    <IonToggle
                      checked={settings?.notify_on_like}
                      onIonChange={e => handleSettingChange('notify_on_like', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Notify on Comment</IonLabel>
                    <IonToggle
                      checked={settings?.notify_on_comment}
                      onIonChange={e => handleSettingChange('notify_on_comment', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Notify on Mention</IonLabel>
                    <IonToggle
                      checked={settings?.notify_on_mention}
                      onIonChange={e => handleSettingChange('notify_on_mention', e.detail.checked)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Notify on Share</IonLabel>
                    <IonToggle
                      checked={settings?.notify_on_share}
                      onIonChange={e => handleSettingChange('notify_on_share', e.detail.checked)}
                    />
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Follow Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IonIcon icon={personAdd} className="mr-2" />
                    Follow Requests
                  </div>
                  {followRequests.length > 0 && (
                    <IonBadge color="primary">{followRequests.length}</IonBadge>
                  )}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {followRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <IonIcon icon={personAdd} className="text-4xl text-gray-400 mb-4" />
                    <p className="text-gray-500">No pending follow requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followRequests.map(request => (
                      <FollowRequestItem
                        key={request.id}
                        request={request}
                        type="incoming"
                        onApprove={handleApproveRequest}
                        onDeny={handleDenyRequest}
                      />
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>

            {/* Sent Requests */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IonIcon icon={mail} className="mr-2" />
                    Sent Requests
                  </div>
                  {sentRequests.length > 0 && (
                    <IonBadge color="medium">{sentRequests.length}</IonBadge>
                  )}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {sentRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <IonIcon icon={mail} className="text-4xl text-gray-400 mb-4" />
                    <p className="text-gray-500">No pending sent requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map(request => (
                      <FollowRequestItem
                        key={request.id}
                        request={request}
                        type="outgoing"
                        onCancel={handleCancelRequest}
                      />
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Audit Log */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IonIcon icon={document} className="mr-2" />
                    Privacy Audit Log
                  </div>
                  <IonButton
                    size="small"
                    fill="outline"
                    onClick={() => loadAuditLog()}
                  >
                    <IonIcon icon={refresh} />
                  </IonButton>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {auditLog.length === 0 ? (
                  <div className="text-center py-8">
                    <IonIcon icon={document} className="text-4xl text-gray-400 mb-4" />
                    <p className="text-gray-500">No privacy changes recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLog.map(entry => (
                      <IonCard key={entry.id}>
                        <IonCardContent>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {entry.action_type.replace('_', ' ')}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {entry.resource_type}
                                {entry.resource_id && ` (${entry.resource_id.slice(0, 8)}...)`}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            
                            {entry.new_values && (
                              <IonButton
                                size="small"
                                fill="clear"
                                onClick={() => {
                                  // Show details modal
                                  console.log('Audit entry details:', entry);
                                }}
                              >
                                <IonIcon icon={informationCircle} />
                              </IonButton>
                            )}
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}
      </div>

      {/* Management Actions */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        <IonGrid>
          <IonRow>
            <IonCol size="4">
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleExport}
                disabled={isLoading}
              >
                <IonIcon icon={download} slot="start" />
                Export
              </IonButton>
            </IonCol>
            <IonCol size="4">
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => setShowImportModal(true)}
                disabled={isLoading}
              >
                <IonIcon icon={cloudUpload} slot="start" />
                Import
              </IonButton>
            </IonCol>
            <IonCol size="4">
              <IonButton
                expand="block"
                fill="clear"
                color="danger"
                onClick={() => setShowResetAlert(true)}
                disabled={isLoading}
              >
                <IonIcon icon={refresh} slot="start" />
                Reset
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </div>

      {/* Export Modal */}
      <IonModal isOpen={showExportModal} onDidDismiss={() => setShowExportModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Export Privacy Settings</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowExportModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="p-4">
            <IonTextarea
              value={exportedData}
              readonly
              rows={20}
              className="font-mono text-xs"
            />
            <IonButton
              expand="block"
              className="mt-4"
              onClick={() => {
                navigator.clipboard.writeText(exportedData);
                // Show copy success toast
              }}
            >
              Copy to Clipboard
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Import Modal */}
      <IonModal isOpen={showImportModal} onDidDismiss={() => setShowImportModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Import Privacy Settings</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowImportModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="p-4">
            <IonTextarea
              value={importData}
              onIonInput={e => setImportData(e.detail.value!)}
              placeholder="Paste your exported privacy settings here..."
              rows={20}
              className="font-mono text-xs"
            />
            <div className="flex gap-2 mt-4">
              <IonButton
                expand="block"
                onClick={handleImport}
                disabled={!importData.trim() || isLoading}
              >
                {isLoading ? <IonSpinner name="dots" /> : 'Import Settings'}
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Reset Alert */}
      <IonAlert
        isOpen={showResetAlert}
        onDidDismiss={() => setShowResetAlert(false)}
        header="Reset Privacy Settings"
        message="Are you sure you want to reset all privacy settings to defaults? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Reset',
            role: 'destructive',
            handler: handleReset,
          },
        ]}
      />

      <style>{`
        .advanced-privacy-settings {
          --background: var(--ion-color-light);
        }

        .advanced-privacy-settings ion-card {
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
        }

        .advanced-privacy-settings ion-card-header {
          padding-bottom: 8px;
        }

        .advanced-privacy-settings ion-card-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--ion-color-dark);
        }

        .advanced-privacy-settings ion-item {
          --padding-start: 16px;
          --padding-end: 16px;
          --inner-padding-end: 8px;
        }

        .advanced-privacy-settings ion-list-header {
          font-weight: 600;
          color: var(--ion-color-primary);
          padding-top: 16px;
        }

        .advanced-privacy-settings .space-y-6 > * + * {
          margin-top: 24px;
        }

        .advanced-privacy-settings .space-y-4 > * + * {
          margin-top: 16px;
        }

        .advanced-privacy-settings .space-x-3 > * + * {
          margin-left: 12px;
        }

        .advanced-privacy-settings .space-x-2 > * + * {
          margin-left: 8px;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .advanced-privacy-settings {
            --background: var(--ion-color-dark);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .advanced-privacy-settings {
            padding: 8px;
          }

          .advanced-privacy-settings ion-card {
            margin-bottom: 12px;
          }
        }
      `}</style>
    </IonContent>
  );
};

export default AdvancedPrivacySettings;