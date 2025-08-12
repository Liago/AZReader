import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  IonBadge,
  IonText,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonCheckbox,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import {
  close,
  shield,
  flag,
  person,
  time,
  checkmark,
  trash,
  warning,
  ban,
  eye,
  eyeOff,
  document,
  statsChart,
} from 'ionicons/icons';
import {
  useModeration,
  ContentReport,
  UserFlag,
  ModerationLog,
  ReportStatus,
  ModerationAction,
  ReportReason,
} from '@hooks/useModeration';
import moment from 'moment';

interface ModerationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportItemProps {
  report: ContentReport;
  onResolve: (reportId: string, action: ModerationAction, resolution?: string) => void;
  onViewContent: (contentType: string, contentId: string) => void;
}

interface UserFlagItemProps {
  flag: UserFlag;
  onUpdateFlag: (flagId: string, status: string) => void;
}

interface ModerationActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: ModerationAction, resolution: string) => void;
  reportId: string;
}

// Individual report item component
const ReportItem: React.FC<ReportItemProps> = ({ report, onResolve, onViewContent }) => {
  const [showActions, setShowActions] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  const getReasonColor = (reason: ReportReason): string => {
    switch (reason) {
      case 'spam': return 'warning';
      case 'harassment': case 'hate_speech': return 'danger';
      case 'violence': return 'danger';
      case 'inappropriate_content': return 'warning';
      case 'misinformation': return 'medium';
      case 'copyright': return 'secondary';
      default: return 'light';
    }
  };

  const getStatusColor = (status: ReportStatus): string => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'primary';
      case 'resolved': return 'success';
      case 'dismissed': return 'medium';
      default: return 'light';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    return moment(dateString).fromNow();
  };

  return (
    <>
      <IonCard className={`${report.status === 'pending' ? 'border-l-4 border-orange-400' : ''}`}>
        <IonCardContent>
          <div className="space-y-3">
            {/* Report header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <IonBadge color={getReasonColor(report.reason)}>
                    {report.reason.replace('_', ' ')}
                  </IonBadge>
                  <IonBadge color={getStatusColor(report.status)}>
                    {report.status}
                  </IonBadge>
                  <span className="text-sm text-gray-600">
                    {report.content_type}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  Reported by: {report.reporter_email || 'Unknown'}
                </div>
                
                {report.description && (
                  <div className="text-sm bg-gray-50 p-3 rounded-lg mb-2">
                    "{report.description}"
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                {formatTimeAgo(report.created_at)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <IonButton
                  size="small"
                  fill="outline"
                  onClick={() => onViewContent(report.content_type, report.content_id)}
                >
                  <IonIcon icon={eye} slot="start" />
                  View Content
                </IonButton>
              </div>
              
              {report.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <IonButton
                    size="small"
                    fill="outline"
                    color="success"
                    onClick={() => onResolve(report.id, 'dismiss', 'Not a violation')}
                  >
                    <IonIcon icon={checkmark} slot="start" />
                    Dismiss
                  </IonButton>
                  <IonButton
                    size="small"
                    color="primary"
                    onClick={() => setShowActionModal(true)}
                  >
                    <IonIcon icon={shield} slot="start" />
                    Take Action
                  </IonButton>
                </div>
              )}
            </div>

            {/* Resolution info for completed reports */}
            {(report.status === 'resolved' || report.status === 'dismissed') && (
              <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
                <div>Reviewed by: {report.moderator_email || 'Unknown'}</div>
                <div>Reviewed: {report.reviewed_at ? formatTimeAgo(report.reviewed_at) : 'N/A'}</div>
                {report.resolution && (
                  <div className="mt-1 bg-blue-50 p-2 rounded">
                    Resolution: {report.resolution}
                  </div>
                )}
              </div>
            )}
          </div>
        </IonCardContent>
      </IonCard>

      {/* Action Modal */}
      <ModerationActionModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        onSubmit={(action, resolution) => {
          onResolve(report.id, action, resolution);
          setShowActionModal(false);
        }}
        reportId={report.id}
      />
    </>
  );
};

// Moderation action modal
const ModerationActionModal: React.FC<ModerationActionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  reportId,
}) => {
  const [selectedAction, setSelectedAction] = useState<ModerationAction>('warn');
  const [resolution, setResolution] = useState('');

  const actions: { value: ModerationAction; label: string; color: string }[] = [
    { value: 'warn', label: 'Warn User', color: 'warning' },
    { value: 'hide_comment', label: 'Hide Content', color: 'danger' },
    { value: 'flag_user', label: 'Flag User', color: 'danger' },
    { value: 'suspend_user', label: 'Suspend User', color: 'danger' },
    { value: 'ban_user', label: 'Ban User', color: 'danger' },
  ];

  const handleSubmit = () => {
    if (!resolution.trim()) {
      return;
    }
    onSubmit(selectedAction, resolution.trim());
    setResolution('');
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Moderation Action</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="p-4 space-y-4">
          <IonCard>
            <IonCardContent>
              <div className="space-y-4">
                <div>
                  <IonLabel className="font-medium">Select Action</IonLabel>
                  <IonSelect
                    value={selectedAction}
                    onIonChange={(e) => setSelectedAction(e.detail.value)}
                    className="mt-2"
                  >
                    {actions.map((action) => (
                      <IonSelectOption key={action.value} value={action.value}>
                        {action.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </div>

                <div>
                  <IonLabel className="font-medium">Resolution Notes</IonLabel>
                  <IonTextarea
                    value={resolution}
                    onIonInput={(e) => setResolution(e.detail.value!)}
                    placeholder="Explain your decision and any actions taken..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <IonButton
                    expand="block"
                    onClick={handleSubmit}
                    disabled={!resolution.trim()}
                  >
                    Apply Action
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </IonButton>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonModal>
  );
};

// User flag item component
const UserFlagItem: React.FC<UserFlagItemProps> = ({ flag, onUpdateFlag }) => {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'critical': return 'danger';
      default: return 'medium';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'success';
      case 'flagged': return 'warning';
      case 'suspended': return 'danger';
      case 'banned': return 'danger';
      default: return 'medium';
    }
  };

  return (
    <IonCard>
      <IonCardContent>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IonBadge color={getStatusColor(flag.status)}>
                  {flag.status}
                </IonBadge>
                <IonBadge color={getSeverityColor(flag.severity)}>
                  {flag.severity}
                </IonBadge>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                User: {flag.user_email || 'Unknown'}
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                Flagged by: {flag.flagged_by_email || 'System'}
              </div>
              
              {flag.reason && (
                <div className="text-sm bg-gray-50 p-2 rounded">
                  {flag.reason}
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              {moment(flag.created_at).fromNow()}
            </div>
          </div>

          {flag.expires_at && (
            <div className="text-sm text-orange-600">
              Expires: {moment(flag.expires_at).format('MMM DD, YYYY HH:mm')}
            </div>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// Main moderation panel component
const ModerationPanel: React.FC<ModerationPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'flags' | 'logs'>('reports');
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [userFlags, setUserFlags] = useState<UserFlag[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [reportFilter, setReportFilter] = useState<ReportStatus | 'all'>('pending');

  const {
    getReports,
    getUserFlags,
    getModerationLogs,
    reviewReport,
    hideContent,
    isLoading,
    error,
  } = useModeration();

  // Load data based on active tab
  const loadData = async () => {
    try {
      switch (activeTab) {
        case 'reports':
          const reportsData = await getReports(reportFilter === 'all' ? undefined : reportFilter);
          setReports(reportsData);
          break;
        case 'flags':
          const flagsData = await getUserFlags();
          setUserFlags(flagsData);
          break;
        case 'logs':
          const logsData = await getModerationLogs();
          setLogs(logsData);
          break;
      }
    } catch (err) {
      console.error('Error loading moderation data:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab, reportFilter]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadData();
    event.detail.complete();
  };

  const handleResolveReport = async (reportId: string, action: ModerationAction, resolution?: string) => {
    await reviewReport(reportId, action, resolution);
    await loadData(); // Reload data
  };

  const handleViewContent = (contentType: string, contentId: string) => {
    // Navigate to content view - implementation depends on your routing
    console.log('View content:', contentType, contentId);
  };

  // Calculate stats
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const activeFlags = userFlags.filter(f => f.status !== 'active').length;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Moderation Panel</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          {/* Stats Cards */}
          <div className="p-4 grid grid-cols-2 gap-4">
            <IonCard>
              <IonCardContent className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingReports}</div>
                <div className="text-sm text-gray-600">Pending Reports</div>
              </IonCardContent>
            </IonCard>
            
            <IonCard>
              <IonCardContent className="text-center">
                <div className="text-2xl font-bold text-red-600">{activeFlags}</div>
                <div className="text-sm text-gray-600">Flagged Users</div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Tab Segement */}
          <div className="px-4">
            <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value as any)}>
              <IonSegmentButton value="reports">
                <IonLabel>Reports</IonLabel>
                {pendingReports > 0 && (
                  <IonBadge color="warning" className="ml-2">{pendingReports}</IonBadge>
                )}
              </IonSegmentButton>
              <IonSegmentButton value="flags">
                <IonLabel>User Flags</IonLabel>
                {activeFlags > 0 && (
                  <IonBadge color="danger" className="ml-2">{activeFlags}</IonBadge>
                )}
              </IonSegmentButton>
              <IonSegmentButton value="logs">
                <IonLabel>Audit Log</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Filter for Reports */}
          {activeTab === 'reports' && (
            <div className="p-4">
              <IonSelect
                value={reportFilter}
                onIonChange={(e) => setReportFilter(e.detail.value)}
                placeholder="Filter by status"
              >
                <IonSelectOption value="all">All Reports</IonSelectOption>
                <IonSelectOption value="pending">Pending</IonSelectOption>
                <IonSelectOption value="reviewed">Reviewed</IonSelectOption>
                <IonSelectOption value="resolved">Resolved</IonSelectOption>
                <IonSelectOption value="dismissed">Dismissed</IonSelectOption>
              </IonSelect>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <IonSpinner />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4">
              <IonText color="danger">{error}</IonText>
            </div>
          )}

          {/* Content based on active tab */}
          <div className="p-4 space-y-4">
            {activeTab === 'reports' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <IonCard>
                    <IonCardContent className="text-center py-8">
                      <IonIcon icon={checkmark} className="text-4xl text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Reports</h3>
                      <p className="text-gray-600">
                        {reportFilter === 'pending' 
                          ? 'No pending reports to review' 
                          : 'No reports found for this filter'}
                      </p>
                    </IonCardContent>
                  </IonCard>
                ) : (
                  reports.map((report) => (
                    <ReportItem
                      key={report.id}
                      report={report}
                      onResolve={handleResolveReport}
                      onViewContent={handleViewContent}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'flags' && (
              <div className="space-y-4">
                {userFlags.length === 0 ? (
                  <IonCard>
                    <IonCardContent className="text-center py-8">
                      <IonIcon icon={shield} className="text-4xl text-blue-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No User Flags</h3>
                      <p className="text-gray-600">All users are in good standing</p>
                    </IonCardContent>
                  </IonCard>
                ) : (
                  userFlags.map((flag) => (
                    <UserFlagItem
                      key={flag.id}
                      flag={flag}
                      onUpdateFlag={(flagId, status) => {
                        // Implementation for updating flag status
                        console.log('Update flag:', flagId, status);
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <IonCard>
                    <IonCardContent className="text-center py-8">
                      <IonIcon icon={document} className="text-4xl text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
                      <p className="text-gray-600">No moderation actions recorded</p>
                    </IonCardContent>
                  </IonCard>
                ) : (
                  logs.map((log) => (
                    <IonCard key={log.id}>
                      <IonCardContent>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <IonBadge color="medium">{log.action}</IonBadge>
                              <span className="text-sm text-gray-600">
                                {log.target_type}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-1">
                              Moderator: {log.moderator_email || 'System'}
                            </div>
                            
                            {log.reason && (
                              <div className="text-sm text-gray-800">
                                {log.reason}
                              </div>
                            )}
                            
                            {log.details && (
                              <pre className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500 ml-4">
                            {moment(log.created_at).format('MMM DD, HH:mm')}
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))
                )}
              </div>
            )}
          </div>
        </IonContent>
      </IonPage>
    </IonModal>
  );
};

export default ModerationPanel;