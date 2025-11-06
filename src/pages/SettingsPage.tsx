import React, { useState } from 'react';
import {
	IonContent,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
	IonButtons,
	IonBackButton,
	IonList,
	IonItem,
	IonLabel,
	IonToggle,
	IonSelect,
	IonSelectOption,
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent,
	IonIcon,
	IonNote,
	IonButton,
	useIonToast,
} from '@ionic/react';
import {
	notificationsOutline,
	cloudOutline,
	speedometerOutline,
	colorPaletteOutline,
	saveOutline,
} from 'ionicons/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store-rtk';
import { updatePreferences } from '@store/slices/authSlice';

const SettingsPage: React.FC = () => {
	const dispatch = useDispatch();
	const [presentToast] = useIonToast();
	const preferences = useSelector((state: RootState) => state.auth.preferences || {
		emailNotifications: true,
		pushNotifications: true,
		newsletter: false,
		preferredParser: 'mercury' as const,
	});
	const session = useSelector((state: RootState) => state.auth.session);
	
	// Local state for form management (must be before early returns)
	const [localPreferences, setLocalPreferences] = useState(preferences);
	
	// Security check: redirect if not authenticated
	if (!session?.user) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Accesso Richiesto</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<div className="flex flex-col items-center justify-center h-full text-center">
						<h2>Accesso Richiesto</h2>
						<p>Devi essere autenticato per accedere alle impostazioni.</p>
						<IonButton routerLink="/home" fill="solid">
							Torna alla Home
						</IonButton>
					</div>
				</IonContent>
			</IonPage>
		);
	}

	const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
		setLocalPreferences(prev => ({
			...prev,
			[key]: value
		}));
	};

	const handleSaveSettings = async () => {
		try {
			dispatch(updatePreferences(localPreferences));
			
			presentToast({
				message: 'Impostazioni salvate con successo',
				duration: 2000,
				color: 'success',
				position: 'top',
			});
		} catch (error) {
			console.error('Error saving settings:', error);
			presentToast({
				message: 'Errore nel salvare le impostazioni',
				duration: 3000,
				color: 'danger',
				position: 'top',
			});
		}
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref="/profile" />
					</IonButtons>
					<IonTitle>Impostazioni</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleSaveSettings} fill="clear">
							<IonIcon icon={saveOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				{/* Parser Settings */}
				<IonCard>
					<IonCardHeader>
						<IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<IonIcon icon={cloudOutline} />
							Parser per Articoli
						</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonList>
							<IonItem>
								<IonLabel>
									<h3>Parser Preferito</h3>
									<p>Seleziona quale parser utilizzare per estrarre gli articoli dai link</p>
								</IonLabel>
								<IonSelect
									value={localPreferences.preferredParser}
									placeholder="Seleziona parser"
									onIonChange={(e) => handlePreferenceChange('preferredParser', e.detail.value)}
								>
									<IonSelectOption value="mercury">
										Mercury Parser (Consigliato)
									</IonSelectOption>
									<IonSelectOption value="rapidapi">
										RapidAPI Parser
									</IonSelectOption>
								</IonSelect>
							</IonItem>
						</IonList>
						<IonNote color="medium" style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
							<strong>Mercury Parser:</strong> Più veloce e accurato per la maggior parte dei siti web.
							<br />
							<strong>RapidAPI Parser:</strong> Alternativa più robusta per siti web complessi.
							<br />
							In caso di fallimento del parser principale, verrà automaticamente utilizzato l'altro come fallback.
						</IonNote>
					</IonCardContent>
				</IonCard>

				{/* Notification Settings */}
				<IonCard>
					<IonCardHeader>
						<IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<IonIcon icon={notificationsOutline} />
							Notifiche
						</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonList>
							<IonItem>
								<IonLabel>
									<h3>Notifiche Email</h3>
									<p>Ricevi aggiornamenti via email</p>
								</IonLabel>
								<IonToggle
									checked={localPreferences.emailNotifications}
									onIonChange={(e) => handlePreferenceChange('emailNotifications', e.detail.checked)}
								/>
							</IonItem>

							<IonItem>
								<IonLabel>
									<h3>Notifiche Push</h3>
									<p>Ricevi notifiche push sul dispositivo</p>
								</IonLabel>
								<IonToggle
									checked={localPreferences.pushNotifications}
									onIonChange={(e) => handlePreferenceChange('pushNotifications', e.detail.checked)}
								/>
							</IonItem>

							<IonItem>
								<IonLabel>
									<h3>Newsletter</h3>
									<p>Ricevi la newsletter settimanale</p>
								</IonLabel>
								<IonToggle
									checked={localPreferences.newsletter}
									onIonChange={(e) => handlePreferenceChange('newsletter', e.detail.checked)}
								/>
							</IonItem>
						</IonList>
					</IonCardContent>
				</IonCard>

				{/* Performance Settings */}
				<IonCard>
					<IonCardHeader>
						<IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<IonIcon icon={speedometerOutline} />
							Performance
						</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonNote color="medium">
							Le impostazioni di performance avanzate verranno implementate in una futura versione.
						</IonNote>
					</IonCardContent>
				</IonCard>

				{/* Appearance Settings */}
				<IonCard>
					<IonCardHeader>
						<IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<IonIcon icon={colorPaletteOutline} />
							Aspetto
						</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonNote color="medium">
							Le impostazioni di tema e aspetto sono disponibili nei controlli di lettura durante la visualizzazione degli articoli.
						</IonNote>
					</IonCardContent>
				</IonCard>

				<div style={{ height: '80px' }} />
			</IonContent>
		</IonPage>
	);
};

export default SettingsPage;