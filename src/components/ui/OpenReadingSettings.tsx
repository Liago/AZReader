import React, { useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { settingsOutline } from 'ionicons/icons';
import ReadingSettingsModal from './ReadingSettingsModal';

interface OpenReadingSettingsProps {
	buttonStyle?: 'text' | 'icon' | 'full';
	className?: string;
}

const OpenReadingSettings: React.FC<OpenReadingSettingsProps> = ({
	buttonStyle = 'icon',
	className = ''
}) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			{buttonStyle === 'text' && (
				<IonButton
					fill="clear"
					className={`text-primary ${className}`}
					onClick={() => setIsOpen(true)}
				>
					<IonIcon slot="start" icon={settingsOutline} />
					Impostazioni Lettura
				</IonButton>
			)}

			{buttonStyle === 'icon' && (
				<IonButton
					fill="clear"
					className={className}
					onClick={() => setIsOpen(true)}
				>
					<IonIcon icon={settingsOutline} />
				</IonButton>
			)}

			{buttonStyle === 'full' && (
				<IonButton
					expand="block"
					className={`rounded-lg ${className}`}
					style={{
						'--background': 'linear-gradient(135deg, #4F7AFF 0%, #6DB2FF 100%)',
						'--border-radius': '10px',
					}}
					onClick={() => setIsOpen(true)}
				>
					<IonIcon slot="start" icon={settingsOutline} />
					Personalizza Impostazioni Lettura
				</IonButton>
			)}

			<ReadingSettingsModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
			/>
		</>
	);
};

export default OpenReadingSettings; 