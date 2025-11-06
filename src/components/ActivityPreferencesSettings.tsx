import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonToggle,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonButton,
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
  IonCheckbox,
  IonRadioGroup,
  IonRadio,
  IonActionSheet,
} from '@ionic/react';
import {
  notifications,
  notificationsOutline,
  mail,
  mailOutline,
  time,
  settings,
  download,
  cloudUpload,
  refresh,
  checkmark,
  close,
  informationCircle,
} from 'ionicons/icons';
import { useActivityPreferences } from '@hooks/useActivityPreferences';

export interface ActivityPreferencesSettingsProps {
  onClose?: () => void;
  className?: string;
}

const ActivityPreferencesSettings: React.FC<ActivityPreferencesSettingsProps> = ({ 
  onClose, 
  className = '' 
}) => {
  const {
    notificationPrefs,
    displayPrefs,
    isLoading,
    error,
    updateNotificationPreferences,
    updateDisplayPreferences,
    resetToDefaults,
    exportPreferences,
    importPreferences,
  } = useActivityPreferences();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Handle notification preference changes
  const handleNotificationToggle = async (key: keyof typeof notificationPrefs.activity_types, enabled: boolean) => {
    const success = await updateNotificationPreferences({
      activity_types: {
        ...notificationPrefs.activity_types,
        [key]: enabled,
      },
    });
    
    if (success) {
      setToastMessage(`${key.replace('_', ' ')} notifications ${enabled ? 'enabled' : 'disabled'}`);
      setShowToast(true);
    }
  };

  // Handle general notification settings
  const handleGeneralSettingChange = async (key: keyof typeof notificationPrefs, value: any) => {
    const success = await updateNotificationPreferences({
      [key]: value,
    });
    
    if (success) {
      setToastMessage('Settings updated successfully');
      setShowToast(true);
    }
  };

  // Handle display preference changes
  const handleDisplayPreferenceChange = async (key: keyof typeof displayPrefs, value: any) => {
    const success = await updateDisplayPreferences({
      [key]: value,
    });
    
    if (success) {
      setToastMessage('Display settings updated');
      setShowToast(true);
    }
  };

  // Handle quiet hours changes
  const handleQuietHoursChange = async (field: 'enabled' | 'start' | 'end', value: any) => {
    const success = await updateNotificationPreferences({
      quiet_hours: {
        ...notificationPrefs.quiet_hours,
        [field]: value,
      },
    });
    
    if (success) {
      setToastMessage('Quiet hours updated');
      setShowToast(true);
    }
  };

  // Handle feed type preferences
  const handleFeedTypeChange = async (key: keyof typeof displayPrefs.feed_types, enabled: boolean) => {
    const success = await updateDisplayPreferences({
      feed_types: {
        ...displayPrefs.feed_types,
        [key]: enabled,
      },
    });
    
    if (success) {
      setToastMessage('Feed preferences updated');
      setShowToast(true);
    }
  };

  // Handle grouping settings
  const handleGroupingChange = async (field: 'enabled' | 'time_window', value: any) => {
    const success = await updateDisplayPreferences({
      grouping: {
        ...displayPrefs.grouping,
        [field]: value,
      },
    });
    
    if (success) {
      setToastMessage('Grouping settings updated');
      setShowToast(true);
    }
  };

  // Export preferences
  const handleExport = () => {
    const data = exportPreferences();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity-preferences.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setToastMessage('Preferences exported successfully');
    setShowToast(true);
  };

  // Import preferences
  const handleImport = async () => {
    if (!importData.trim()) return;
    
    const success = await importPreferences(importData);
    if (success) {
      setToastMessage('Preferences imported successfully');
      setShowToast(true);
      setImportData('');
      setShowImportDialog(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    const success = await resetToDefaults();
    if (success) {
      setToastMessage('Preferences reset to defaults');
      setShowToast(true);
    }
  };

  if (isLoading) {
    return <IonLoading isOpen={isLoading} message="Loading preferences..." />;
  }

  return (
    <IonContent className={`activity-preferences-settings ${className}`}>
      {/* Header */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Activity Preferences</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText color="medium">
            <p>Customize how you receive and view activity notifications from users you follow.</p>
          </IonText>
        </IonCardContent>
      </IonCard>

      {/* Notification Preferences */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={notifications} className="mr-2" />
            Notification Settings
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {/* General notification toggles */}
            <IonItem>
              <IonIcon icon={notificationsOutline} slot="start" />
              <IonLabel>Push Notifications</IonLabel>
              <IonToggle
                checked={notificationPrefs.push_notifications}
                onIonChange={(e) => handleGeneralSettingChange('push_notifications', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={mail} slot="start" />
              <IonLabel>Email Notifications</IonLabel>
              <IonToggle
                checked={notificationPrefs.email_notifications}
                onIonChange={(e) => handleGeneralSettingChange('email_notifications', e.detail.checked)}
              />
            </IonItem>

            {/* Notification frequency */}
            <IonItem>
              <IonIcon icon={time} slot="start" />
              <IonLabel>Notification Frequency</IonLabel>
              <IonSelect
                value={notificationPrefs.frequency}
                onIonChange={(e) => handleGeneralSettingChange('frequency', e.detail.value)}
              >
                <IonSelectOption value="real_time">Real-time</IonSelectOption>
                <IonSelectOption value="hourly">Hourly</IonSelectOption>
                <IonSelectOption value="daily">Daily</IonSelectOption>
                <IonSelectOption value="weekly">Weekly</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* Activity Types */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Activity Types</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText color="medium">
            <p>Choose which types of activities you want to be notified about:</p>
          </IonText>
          
          <IonList>
            <IonItem>
              <IonLabel>
                <h3>Article Liked</h3>
                <p>When someone likes an article</p>
              </IonLabel>
              <IonToggle
                checked={notificationPrefs.activity_types.article_liked}
                onIonChange={(e) => handleNotificationToggle('article_liked', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Article Shared</h3>
                <p>When someone shares an article</p>
              </IonLabel>
              <IonToggle
                checked={notificationPrefs.activity_types.article_shared}
                onIonChange={(e) => handleNotificationToggle('article_shared', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Comment Created</h3>
                <p>When someone posts a comment</p>
              </IonLabel>
              <IonToggle
                checked={notificationPrefs.activity_types.comment_created}
                onIonChange={(e) => handleNotificationToggle('comment_created', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Comment Liked</h3>
                <p>When someone likes a comment</p>
              </IonLabel>
              <IonToggle
                checked={notificationPrefs.activity_types.comment_liked}
                onIonChange={(e) => handleNotificationToggle('comment_liked', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>User Followed</h3>
                <p>When someone follows another user</p>
              </IonLabel>
              <IonToggle
                checked={notificationPrefs.activity_types.user_followed}
                onIonChange={(e) => handleNotificationToggle('user_followed', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Profile Updated</h3>
                <p>When someone updates their profile</p>
              </IonLabel>
              <IonToggle
                checked={notificationPrefs.activity_types.profile_updated}
                onIonChange={(e) => handleNotificationToggle('profile_updated', e.detail.checked)}
              />
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* Quiet Hours */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Quiet Hours</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonItem>
            <IonLabel>Enable Quiet Hours</IonLabel>
            <IonToggle
              checked={notificationPrefs.quiet_hours.enabled}
              onIonChange={(e) => handleQuietHoursChange('enabled', e.detail.checked)}
            />
          </IonItem>

          {notificationPrefs.quiet_hours.enabled && (
            <>
              <IonItem>
                <IonLabel>Start Time</IonLabel>
                <IonInput
                  type="time"
                  value={notificationPrefs.quiet_hours.start}
                  onIonChange={(e) => handleQuietHoursChange('start', e.detail.value!)}
                />
              </IonItem>

              <IonItem>
                <IonLabel>End Time</IonLabel>
                <IonInput
                  type="time"
                  value={notificationPrefs.quiet_hours.end}
                  onIonChange={(e) => handleQuietHoursChange('end', e.detail.value!)}
                />
              </IonItem>
            </>
          )}
        </IonCardContent>
      </IonCard>

      {/* Display Preferences */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Display Settings</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            <IonListHeader>
              <IonLabel>Feed Types</IonLabel>
            </IonListHeader>

            <IonItem>
              <IonLabel>Following Feed</IonLabel>
              <IonToggle
                checked={displayPrefs.feed_types.following}
                onIonChange={(e) => handleFeedTypeChange('following', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>Global Feed</IonLabel>
              <IonToggle
                checked={displayPrefs.feed_types.global}
                onIonChange={(e) => handleFeedTypeChange('global', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>Personal Feed</IonLabel>
              <IonToggle
                checked={displayPrefs.feed_types.personal}
                onIonChange={(e) => handleFeedTypeChange('personal', e.detail.checked)}
              />
            </IonItem>

            <IonListHeader>
              <IonLabel>Activity Grouping</IonLabel>
            </IonListHeader>

            <IonItem>
              <IonLabel>Enable Grouping</IonLabel>
              <IonToggle
                checked={displayPrefs.grouping.enabled}
                onIonChange={(e) => handleGroupingChange('enabled', e.detail.checked)}
              />
            </IonItem>

            {displayPrefs.grouping.enabled && (
              <IonItem>
                <IonLabel>
                  <h3>Grouping Time Window</h3>
                  <p>{displayPrefs.grouping.time_window} hours</p>
                </IonLabel>
                <IonRange
                  min={1}
                  max={24}
                  step={1}
                  value={displayPrefs.grouping.time_window}
                  onIonChange={(e) => handleGroupingChange('time_window', e.detail.value)}
                />
              </IonItem>
            )}

            <IonListHeader>
              <IonLabel>Other Settings</IonLabel>
            </IonListHeader>

            <IonItem>
              <IonLabel>Auto Refresh</IonLabel>
              <IonToggle
                checked={displayPrefs.auto_refresh}
                onIonChange={(e) => handleDisplayPreferenceChange('auto_refresh', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>Show Read Activities</IonLabel>
              <IonToggle
                checked={displayPrefs.show_read_activities}
                onIonChange={(e) => handleDisplayPreferenceChange('show_read_activities', e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>
                <h3>Items Per Page</h3>
                <p>{displayPrefs.items_per_page} items</p>
              </IonLabel>
              <IonRange
                min={10}
                max={50}
                step={5}
                value={displayPrefs.items_per_page}
                onIonChange={(e) => handleDisplayPreferenceChange('items_per_page', e.detail.value)}
              />
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* Actions */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Management</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleExport}
                >
                  <IonIcon icon={download} slot="start" />
                  Export
                </IonButton>
              </IonCol>
              <IonCol size="6">
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setShowImportDialog(true)}
                >
                  <IonIcon icon={cloudUpload} slot="start" />
                  Import
                </IonButton>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12">
                <IonButton
                  expand="block"
                  fill="clear"
                  color="danger"
                  onClick={handleReset}
                >
                  <IonIcon icon={refresh} slot="start" />
                  Reset to Defaults
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      {/* Toast */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        color="success"
      />

      {/* Import Dialog */}
      <IonActionSheet
        isOpen={showImportDialog}
        onDidDismiss={() => setShowImportDialog(false)}
        header="Import Preferences"
        buttons={[
          {
            text: 'Import from Text',
            handler: () => {
              // Show text input for import data
              setShowImportDialog(false);
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />

      <style>{`
        .activity-preferences-settings {
          --background: var(--ion-color-light);
          padding: 16px;
        }

        .activity-preferences-settings ion-card {
          margin-bottom: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .activity-preferences-settings ion-card-header {
          padding-bottom: 8px;
        }

        .activity-preferences-settings ion-card-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--ion-color-dark);
          display: flex;
          align-items: center;
        }

        .activity-preferences-settings ion-card-title ion-icon {
          margin-right: 8px;
        }

        .activity-preferences-settings ion-item {
          --padding-start: 16px;
          --padding-end: 16px;
          --inner-padding-end: 8px;
        }

        .activity-preferences-settings ion-list-header {
          font-weight: 600;
          color: var(--ion-color-primary);
          padding-top: 16px;
        }

        .activity-preferences-settings ion-range {
          padding: 8px 0;
        }

        .activity-preferences-settings .mr-2 {
          margin-right: 8px;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .activity-preferences-settings {
            --background: var(--ion-color-dark);
          }
        }

        .ios.dark .activity-preferences-settings,
        .md.dark .activity-preferences-settings {
          --background: var(--ion-color-dark);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .activity-preferences-settings {
            padding: 8px;
          }

          .activity-preferences-settings ion-card {
            margin-bottom: 12px;
          }
        }
      `}</style>
    </IonContent>
  );
};

export default ActivityPreferencesSettings;