import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IonToggle, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { sunnyOutline, moonOutline } from 'ionicons/icons';
import { RootState } from '@store/store-rtk';
import { setThemeMode, toggleDarkMode } from '@store/slices/appSlice';

interface ReadingThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'small' | 'default' | 'large';
}

const ReadingThemeToggle: React.FC<ReadingThemeToggleProps> = ({ 
  className = '', 
  showLabel = true,
  size = 'default'
}) => {
  const dispatch = useDispatch();
  const { themeMode, darkMode } = useSelector((state: RootState) => ({
    themeMode: state.app.themeMode,
    darkMode: state.app.darkMode
  }));

  // Determina se il tema corrente è scuro
  const isDarkTheme = themeMode === 'dark' || (themeMode === 'auto' && darkMode);

  const handleToggleTheme = () => {
    // Toggle semplice tra light e dark per lettura ottimizzata
    if (isDarkTheme) {
      dispatch(setThemeMode('light'));
    } else {
      dispatch(setThemeMode('dark'));
    }
  };

  if (showLabel) {
    return (
      <IonItem lines="none" className={`reading-theme-toggle ${className}`}>
        <IonIcon 
          icon={sunnyOutline} 
          slot="start" 
          className={`transition-opacity duration-300 ${isDarkTheme ? 'opacity-40' : 'opacity-100 text-yellow-500'}`}
        />
        <IonLabel>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {isDarkTheme ? 'Tema scuro' : 'Tema chiaro'}
            </span>
            <IonToggle
              checked={isDarkTheme}
              onIonChange={handleToggleTheme}
              className="reading-theme-toggle-switch"
            />
          </div>
        </IonLabel>
        <IonIcon 
          icon={moonOutline} 
          slot="end" 
          className={`transition-opacity duration-300 ${isDarkTheme ? 'opacity-100 text-blue-400' : 'opacity-40'}`}
        />
      </IonItem>
    );
  }

  // Versione compatta senza label
  return (
    <div className={`reading-theme-toggle-compact flex items-center gap-2 ${className}`}>
      <IonIcon 
        icon={sunnyOutline} 
        className={`transition-all duration-300 ${
          size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
        } ${isDarkTheme ? 'opacity-40' : 'opacity-100 text-yellow-500'}`}
      />
      <IonToggle
        checked={isDarkTheme}
        onIonChange={handleToggleTheme}
        className={`reading-theme-toggle-switch ${
          size === 'small' ? 'scale-75' : size === 'large' ? 'scale-125' : ''
        }`}
      />
      <IonIcon 
        icon={moonOutline} 
        className={`transition-all duration-300 ${
          size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
        } ${isDarkTheme ? 'opacity-100 text-blue-400' : 'opacity-40'}`}
      />
    </div>
  );
};

export default ReadingThemeToggle;