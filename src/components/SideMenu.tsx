import React, { useState, useEffect } from 'react';
import {
	IonMenu,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonList,
	IonItem,
	IonLabel,
	IonIcon,
	IonMenuToggle,
	IonAvatar,
	IonChip,
	IonButton,
	IonButtons,
	IonListHeader,
} from '@ionic/react';
import { menuController } from '@ionic/core';
import {
	personCircle,
	informationCircle,
	timeOutline,
	calendarOutline,
	mailOutline,
	colorPaletteOutline,
	chevronForwardOutline,
	arrowBack
} from 'ionicons/icons';
import moment from "moment";
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { useHistory } from 'react-router-dom';
import ThemeSettingsPage from './ui/ThemeSettingsPage';

interface UserCredentials {
	user?: {
		email?: string;
		last_sign_in_at?: string;
	};
	expires_at?: number;
}

/**
 * Formatta un'email in modo che sia sempre visibile completamente
 * Tronca la parte centrale se troppo lunga
 */
const formatEmail = (email: string): string => {
	if (!email) return '';
	if (email.length <= 20) return email;

	const atIndex = email.indexOf('@');
	if (atIndex <= 0) return email;

	const username = email.substring(0, atIndex);
	const domain = email.substring(atIndex);

	if (username.length <= 10) return email;

	return `${username.substring(0, 8)}...${domain}`;
};

const SideMenu: React.FC = () => {
	const [activeView, setActiveView] = useState<'main' | 'theme-settings'>('main');
	const history = useHistory();
	const { user = {} } = useSelector((state: RootState) => state.user.credentials as UserCredentials);
	const { credentials = {} } = useSelector((state: RootState) => state.user);

	// Formatta l'ultimo accesso in modo compatto
	const lastLogin = user?.last_sign_in_at
		? moment(user.last_sign_in_at).format('DD/MM/YY HH:mm')
		: 'n/a';

	// Calcola se la sessione è attiva o scaduta
	const now = Date.now() / 1000;
	const expiresAt = credentials.expires_at || 0;
	const isSessionActive = expiresAt > now;

	// Calcola il tempo rimanente della sessione
	let formattedTimeLeft = '';
	if (isSessionActive) {
		const timeLeftSeconds = expiresAt - now;
		const hours = Math.floor(timeLeftSeconds / 3600);
		const minutes = Math.floor((timeLeftSeconds % 3600) / 60);

		if (hours > 0) {
			formattedTimeLeft = `${hours}h ${minutes}m`;
		} else {
			formattedTimeLeft = `${minutes}m`;
		}
	}

	// Componente che renderizza le informazioni dell'utente
	const renderUserInfo = () => {
		const expires_at = credentials.expires_at
			? moment(credentials.expires_at * 1000).format('DD/MM/YY HH:mm')
			: 'n/a';

		const email = user?.email || '';
		const formattedEmail = formatEmail(email);
		const initials = email ? email.split('@')?.[0]?.substring(0, 2)?.toUpperCase() || 'AN' : '?';

		// Genera un colore basato sull'email per l'avatar
		const getColorFromString = (str: string) => {
			let hash = 0;
			for (let i = 0; i < str.length; i++) {
				hash = str.charCodeAt(i) + ((hash << 5) - hash);
			}
			const hue = hash % 360;
			return `hsl(${hue}, 70%, 60%)`;
		};

		const avatarBgColor = getColorFromString(email);

		return (
			<div className="user-profile p-2">
				{/* Header con Avatar e Email */}
				<div className="flex items-center mb-4">
					<div className="mr-3 flex-shrink-0">
						{email ? (
							<IonAvatar className="w-12 h-12 flex items-center justify-center border-2 border-white shadow-md">
								<div
									className="w-full h-full rounded-full flex items-center justify-center text-white font-bold"
									style={{ backgroundColor: avatarBgColor }}
								>
									{initials}
								</div>
							</IonAvatar>
						) : (
							<IonAvatar className="w-12 h-12">
								<IonIcon icon={personCircle} className="w-full h-full text-gray-400" />
							</IonAvatar>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<h2 className="text-lg font-semibold flex items-center truncate">
							<IonIcon icon={mailOutline} className="mr-1 text-gray-500 flex-shrink-0" />
							<span className="truncate">{formattedEmail || 'Non autenticato'}</span>
						</h2>

						{/* Badge stato sessione */}
						<div className="mt-1">
							{isSessionActive ? (
								<IonChip color="success" outline={true} className="text-xs py-0 px-1 h-6">
									<IonIcon icon={timeOutline} className="mr-1" />
									<IonLabel>Sessione attiva{formattedTimeLeft ? `: ${formattedTimeLeft}` : ''}</IonLabel>
								</IonChip>
							) : (
								<IonChip color="danger" outline={true} className="text-xs py-0 px-1 h-6">
									<IonIcon icon={timeOutline} className="mr-1" />
									<IonLabel>Sessione scaduta</IonLabel>
								</IonChip>
							)}
						</div>
					</div>
				</div>

				{/* Info dettagliate */}
				<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 shadow-sm">
					<div className="flex items-center mb-2">
						<IonIcon icon={calendarOutline} className="mr-2 text-blue-500 flex-shrink-0" />
						<div className="min-w-0">
							<div className="text-xs text-gray-500">Ultimo accesso</div>
							<div className="font-medium truncate">{lastLogin}</div>
						</div>
					</div>

					<div className="flex items-center">
						<IonIcon icon={timeOutline} className="mr-2 text-purple-500 flex-shrink-0" />
						<div className="min-w-0">
							<div className="text-xs text-gray-500">Scadenza sessione</div>
							<div className="font-medium truncate">{expires_at}</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const handleMenuItemClick = async (path: string) => {
		await menuController.close('main-menu');
		history.push(path);
	};

	const handleThemeSettingsClick = async () => {
		setActiveView('theme-settings');
	};

	const handleBackClick = async () => {
		setActiveView('main');
	};

	return (
		<IonMenu contentId="main" menuId="main-menu">
			<IonHeader>
				<IonToolbar>
					{activeView === 'main' ? (
						<IonTitle>AZ Reader</IonTitle>
					) : (
						<>
							<IonButtons slot="start">
								<IonButton onClick={handleBackClick}>
									<IonIcon icon={arrowBack} />
								</IonButton>
							</IonButtons>
							<IonTitle>Impostazioni tema</IonTitle>
						</>
					)}
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				{activeView === 'main' ? (
					<>
						{/* Informazioni Utente */}
						<div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden mb-6">
							{renderUserInfo()}
						</div>

						{/* Menu di navigazione */}
						<IonList lines="none" className="mt-4 rounded-xl overflow-hidden shadow-sm">
							<IonListHeader>
								<IonLabel>Menu</IonLabel>
							</IonListHeader>

							<IonMenuToggle>
								<IonItem
									button
									onClick={() => handleMenuItemClick('/profile')}
									className="item-menu"
								>
									<IonIcon slot="start" icon={personCircle} className="text-blue-500" />
									<IonLabel>Profilo</IonLabel>
								</IonItem>
							</IonMenuToggle>

							<IonMenuToggle>
								<IonItem
									button
									onClick={() => handleMenuItemClick('/info')}
									className="item-menu"
								>
									<IonIcon slot="start" icon={informationCircle} className="text-green-500" />
									<IonLabel>Informazioni</IonLabel>
								</IonItem>
							</IonMenuToggle>

							<div className="px-4 py-2 text-xs text-gray-500 uppercase font-semibold">
								Personalizzazione
							</div>

							<IonItem
								button
								className="theme-settings-item"
								onClick={handleThemeSettingsClick}
								lines="none"
							>
								<IonIcon slot="start" icon={colorPaletteOutline} className="text-purple-500" />
								<IonLabel>Impostazioni tema</IonLabel>
								<IonIcon slot="end" icon={chevronForwardOutline} />
							</IonItem>
						</IonList>
					</>
				) : (
					<div className="theme-settings-container">
						<ThemeSettingsPage />
					</div>
				)}
			</IonContent>

			<style>
				{`
					.theme-settings-item {
						--background: var(--ion-color-light);
						--background-hover: rgba(var(--ion-color-primary-rgb), 0.1);
						--background-activated: rgba(var(--ion-color-primary-rgb), 0.2);
						margin: 8px 16px;
						border-radius: 8px;
					}
					
					.theme-settings-container {
						animation: slideIn 0.3s forwards;
						overflow-x: hidden;
					}
					
					@keyframes slideIn {
						from {
							transform: translateX(100%);
							opacity: 0;
						}
						to {
							transform: translateX(0);
							opacity: 1;
						}
					}
				`}
			</style>
		</IonMenu>
	);
};

export default SideMenu; 