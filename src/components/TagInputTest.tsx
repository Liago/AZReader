import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
} from '@ionic/react';
import TagInput from './TagInput';
import { Tag } from '@common/database-types';

const TagInputTest: React.FC = () => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [allowCreate, setAllowCreate] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [mode, setMode] = useState<'input' | 'display'>('input');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [maxTags, setMaxTags] = useState<number | undefined>(undefined);

  const handleTagsChange = (tags: Tag[]) => {
    setSelectedTags(tags);
    console.log('Tags changed:', tags);
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  const addSampleTags = () => {
    const sampleTags: Tag[] = [
      {
        id: 'sample-1',
        name: 'React',
        color: '#61DAFB',
        usage_count: 10,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'sample-2',
        name: 'TypeScript',
        color: '#3178C6',
        usage_count: 8,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'sample-3',
        name: 'Ionic',
        color: '#3880FF',
        usage_count: 5,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      },
    ];
    setSelectedTags(sampleTags);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>TagInput Test</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>TagInput Component</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <TagInput
              selectedTags={selectedTags}
              onTagsChange={handleTagsChange}
              placeholder="Type to search or create tags..."
              maxTags={maxTags}
              allowCreate={allowCreate}
              disabled={disabled}
              mode={mode}
              size={size}
              className="mb-4"
            />
            
            <div className="mt-4">
              <IonText>
                <h6>Selected Tags ({selectedTags.length}):</h6>
              </IonText>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(selectedTags, null, 2)}
              </pre>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Configuration</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel>Allow Create New Tags</IonLabel>
              <IonToggle
                checked={allowCreate}
                onIonChange={(e) => setAllowCreate(e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>Disabled</IonLabel>
              <IonToggle
                checked={disabled}
                onIonChange={(e) => setDisabled(e.detail.checked)}
              />
            </IonItem>

            <IonItem>
              <IonLabel>Mode</IonLabel>
              <IonSelect
                value={mode}
                onIonChange={(e) => setMode(e.detail.value)}
              >
                <IonSelectOption value="input">Input</IonSelectOption>
                <IonSelectOption value="display">Display Only</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Size</IonLabel>
              <IonSelect
                value={size}
                onIonChange={(e) => setSize(e.detail.value)}
              >
                <IonSelectOption value="small">Small</IonSelectOption>
                <IonSelectOption value="medium">Medium</IonSelectOption>
                <IonSelectOption value="large">Large</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Max Tags</IonLabel>
              <IonSelect
                value={maxTags}
                onIonChange={(e) => setMaxTags(e.detail.value)}
              >
                <IonSelectOption value={undefined}>No Limit</IonSelectOption>
                <IonSelectOption value={3}>3 Tags</IonSelectOption>
                <IonSelectOption value={5}>5 Tags</IonSelectOption>
                <IonSelectOption value={10}>10 Tags</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Actions</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="flex gap-2 flex-wrap">
              <IonButton size="small" onClick={clearTags}>
                Clear All Tags
              </IonButton>
              <IonButton size="small" color="secondary" onClick={addSampleTags}>
                Add Sample Tags
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Test Instructions</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="text-sm space-y-2">
              <p><strong>Autocomplete Testing:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Type partial tag names to see autocomplete suggestions</li>
                <li>Use arrow keys to navigate suggestions</li>
                <li>Press Enter or Tab to select a suggestion</li>
                <li>Press Escape to close suggestions</li>
              </ul>
              
              <p className="mt-4"><strong>Tag Creation Testing:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Type a new tag name and press Enter to create</li>
                <li>Toggle "Allow Create" off to disable new tag creation</li>
                <li>Test validation with special characters</li>
              </ul>
              
              <p className="mt-4"><strong>Tag Management Testing:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click X on selected tags to remove them</li>
                <li>Test max tags limit functionality</li>
                <li>Switch to display mode to test read-only behavior</li>
              </ul>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default TagInputTest;