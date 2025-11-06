import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
  IonBadge,
  IonAlert,
} from '@ionic/react';
import {
  warning,
  checkmarkCircle,
  closeCircle,
  shield,
  eye,
  eyeOff,
} from 'ionicons/icons';
import { useModeration } from '@hooks/useModeration';

interface ContentFilterProps {
  content: string;
  onContentApproved?: (content: string) => void;
  onContentRejected?: (content: string, reasons: string[]) => void;
  showSuggestions?: boolean;
  strictMode?: boolean;
  className?: string;
}

interface FilterResult {
  isAppropriate: boolean;
  flags: string[];
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

const ContentFilter: React.FC<ContentFilterProps> = ({
  content,
  onContentApproved,
  onContentRejected,
  showSuggestions = true,
  strictMode = false,
  className = '',
}) => {
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [userOverride, setUserOverride] = useState(false);

  const { checkContent } = useModeration({ strictMode });

  // Check content when it changes
  useEffect(() => {
    if (!content || content.trim().length === 0) {
      setFilterResult(null);
      return;
    }

    const checkContentDebounced = setTimeout(async () => {
      setIsChecking(true);
      try {
        const result = await checkContent(content);
        setFilterResult(result);
        
        // Auto-trigger callbacks based on result
        if (result.isAppropriate) {
          onContentApproved?.(content);
        } else if (result.severity === 'high') {
          onContentRejected?.(content, result.flags);
        }
      } catch (error) {
        console.error('Error checking content:', error);
      } finally {
        setIsChecking(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(checkContentDebounced);
  }, [content, checkContent, onContentApproved, onContentRejected]);

  const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'low': return 'warning';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'medium';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'low': return warning;
      case 'medium': return warning;
      case 'high': return closeCircle;
      default: return warning;
    }
  };

  const handleUserOverride = () => {
    if (filterResult && !filterResult.isAppropriate) {
      setUserOverride(true);
      onContentApproved?.(content);
      setShowAlert(false);
    }
  };

  const handleRejectContent = () => {
    if (filterResult && !filterResult.isAppropriate) {
      onContentRejected?.(content, filterResult.flags);
      setShowAlert(false);
    }
  };

  // Don't render anything if no content or still checking
  if (!content || isChecking) {
    return null;
  }

  // Don't render if content is appropriate and no flags
  if (filterResult?.isAppropriate && filterResult.flags.length === 0) {
    return null;
  }

  // Don't render if no filter result yet
  if (!filterResult) {
    return null;
  }

  return (
    <div className={className}>
      {/* Content filter warning */}
      {!filterResult.isAppropriate && !userOverride && (
        <IonCard className="border-l-4 border-red-400 mb-4">
          <IonCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IonIcon 
                  icon={getSeverityIcon(filterResult.severity)} 
                  className={`text-xl mr-2 ${
                    filterResult.severity === 'high' ? 'text-red-500' : 'text-orange-500'
                  }`} 
                />
                <IonCardTitle className="text-base">
                  Content Review Required
                </IonCardTitle>
              </div>
              <IonBadge color={getSeverityColor(filterResult.severity)}>
                {filterResult.severity} risk
              </IonBadge>
            </div>
          </IonCardHeader>
          
          <IonCardContent>
            <div className="space-y-3">
              {/* Issues detected */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Issues Detected:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {filterResult.flags.map((flag, index) => (
                    <li key={index} className="text-sm text-gray-700">{flag}</li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              {showSuggestions && filterResult.suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Suggestions:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {filterResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-blue-700">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <IonText color="medium">
                  <p className="text-xs">
                    This content may violate our community guidelines
                  </p>
                </IonText>
                
                <div className="flex space-x-2">
                  {filterResult.severity !== 'high' && (
                    <IonButton
                      size="small"
                      fill="outline"
                      color="primary"
                      onClick={() => setShowAlert(true)}
                    >
                      <IonIcon icon={eye} slot="start" />
                      Review
                    </IonButton>
                  )}
                  
                  <IonButton
                    size="small"
                    fill="solid"
                    color="primary"
                    onClick={() => window.location.reload()} // Simple way to clear content
                  >
                    <IonIcon icon={eyeOff} slot="start" />
                    Edit Content
                  </IonButton>
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Low-severity flags for information */}
      {filterResult.isAppropriate && filterResult.flags.length > 0 && (
        <IonCard className="border-l-4 border-yellow-400 mb-4">
          <IonCardContent>
            <div className="flex items-start">
              <IonIcon icon={shield} className="text-yellow-500 text-lg mr-3 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">Content Notice</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  {filterResult.flags.map((flag, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                      {flag}
                    </div>
                  ))}
                </div>
                {showSuggestions && filterResult.suggestions.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Tip:</strong> {filterResult.suggestions[0]}
                  </div>
                )}
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* User override confirmation */}
      {userOverride && (
        <IonCard className="border-l-4 border-green-400 mb-4">
          <IonCardContent>
            <div className="flex items-center">
              <IonIcon icon={checkmarkCircle} className="text-green-500 text-lg mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Content Approved</h4>
                <p className="text-sm text-gray-600">
                  You have approved this content for posting.
                </p>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Review confirmation alert */}
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Content Review"
        message={`This content has been flagged for: ${filterResult?.flags.join(', ')}. Are you sure you want to proceed?`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Edit Content',
            handler: () => {
              handleRejectContent();
            },
          },
          ...(filterResult?.severity !== 'high' ? [{
            text: 'Post Anyway',
            handler: () => {
              handleUserOverride();
            },
          }] : []),
        ]}
      />
    </div>
  );
};

export default ContentFilter;