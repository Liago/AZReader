import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  IonRange,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon
} from '@ionic/react';
import { textOutline, readerOutline, resizeOutline } from 'ionicons/icons';
import { RootState } from '@store/store-rtk';
import { setSpacing, setWidth, updateReadingSettings } from '@store/slices/appSlice';
import {
  fontSizeToPixels,
  pixelsToFontSize,
  getWidthCategory,
  getWidthValue,
  clampSpacing,
  clampFontSizePixels,
  WidthCategory
} from '@utility/reading-customization-helpers';

interface ReadingCustomizationControlsProps {
  className?: string;
}

const ReadingCustomizationControls: React.FC<ReadingCustomizationControlsProps> = ({ className = '' }) => {
  const dispatch = useDispatch();
  const { spacing, width } = useSelector((state: RootState) => ({
    spacing: state.app.spacing,
    width: state.app.width,
  }));

  // Ottieni il font size attuale in px
  const currentFontSize = useSelector((state: RootState) => {
    const size = state.app.fontSize || 'base';
    return fontSizeToPixels(size as any) || 16;
  });

  const currentWidthCategory = getWidthCategory(width);

  const handleFontSizeChange = (value: number) => {
    const clampedValue = clampFontSizePixels(value);
    const fontSizeToken = pixelsToFontSize(clampedValue);
    dispatch(updateReadingSettings({ fontSize: fontSizeToken }));
  };

  const handleSpacingChange = (value: number) => {
    const clampedValue = clampSpacing(value);
    dispatch(setSpacing(clampedValue));
  };

  const handleWidthChange = (category: WidthCategory) => {
    const widthValue = getWidthValue(category);
    dispatch(setWidth(widthValue));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Font Size Control */}
      <IonCard className="m-0">
        <IonCardHeader className="pb-2">
          <IonCardTitle className="text-base flex items-center gap-2">
            <IonIcon icon={textOutline} className="text-blue-500" />
            Dimensione Font
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent className="pt-0">
          <IonItem lines="none" className="--padding-start: 0">
            <IonLabel className="ion-text-wrap">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">12px - 24px</span>
                <span className="text-sm font-medium">{currentFontSize}px</span>
              </div>
              <IonRange
                min={12}
                max={24}
                step={2}
                value={currentFontSize}
                onIonChange={(e) => handleFontSizeChange(e.detail.value as number)}
                color="primary"
              >
                <div slot="start" className="text-xs">A</div>
                <div slot="end" className="text-lg">A</div>
              </IonRange>
            </IonLabel>
          </IonItem>
        </IonCardContent>
      </IonCard>

      {/* Line Spacing Control */}
      <IonCard className="m-0">
        <IonCardHeader className="pb-2">
          <IonCardTitle className="text-base flex items-center gap-2">
            <IonIcon icon={readerOutline} className="text-green-500" />
            Spaziatura Righe
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent className="pt-0">
          <IonItem lines="none" className="--padding-start: 0">
            <IonLabel className="ion-text-wrap">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">1.2x - 2.0x</span>
                <span className="text-sm font-medium">{spacing.toFixed(1)}x</span>
              </div>
              <IonRange
                min={1.2}
                max={2.0}
                step={0.1}
                value={spacing}
                onIonChange={(e) => handleSpacingChange(e.detail.value as number)}
                color="primary"
              >
                <div slot="start" className="text-xs">1.2x</div>
                <div slot="end" className="text-xs">2.0x</div>
              </IonRange>
            </IonLabel>
          </IonItem>
        </IonCardContent>
      </IonCard>

      {/* Column Width Control */}
      <IonCard className="m-0">
        <IonCardHeader className="pb-2">
          <IonCardTitle className="text-base flex items-center gap-2">
            <IonIcon icon={resizeOutline} className="text-purple-500" />
            Larghezza Colonna
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent className="pt-0">
          <IonSegment
            value={currentWidthCategory}
            onIonChange={(e) => handleWidthChange(e.detail.value as WidthCategory)}
            color="primary"
          >
            <IonSegmentButton value="narrow">
              <IonLabel>Stretta</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="medium">
              <IonLabel>Media</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="wide">
              <IonLabel>Larga</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default ReadingCustomizationControls;