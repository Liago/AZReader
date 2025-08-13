import React, { useState, useEffect } from 'react';
import {
	IonMenu,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonItem,
	IonIcon,
	IonMenuToggle,
	IonAvatar,
	IonButton,
	IonButtons,
} from '@ionic/react';
import { menuController } from '@ionic/core';
import {
	chevronForwardOutline,
	arrowBack
} from 'ionicons/icons';
import moment from "moment";
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { useHistory } from 'react-router-dom';
import ThemeSettingsPage from './ui/ThemeSettingsPage';
import { Calendar, Clock, Mail, Info, User, Palette, LogOut, BookOpen, Settings, ChevronRight, Compass, Activity, Heart } from 'lucide-react';

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
			<div className="user-profile p-5">
				{/* Header con Avatar e Email */}
				<div className="flex items-center mb-5">
					<div className="mr-4 flex-shrink-0">
						{email ? (
							<div className="relative">
								<IonAvatar className="w-14 h-14 flex items-center justify-center border-2 border-white shadow-md">
									<div
										className="w-full h-full rounded-full flex items-center justify-center text-white font-bold"
										style={{ backgroundColor: avatarBgColor }}
									>
										{initials}
									</div>
								</IonAvatar>
								{isSessionActive && (
									<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
								)}
							</div>
						) : (
							<div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
								<User size={24} className="text-black" />
							</div>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<h2 className="text-base font-semibold flex items-center text-black">
							{formattedEmail || 'Non autenticato'}
						</h2>

						{/* Badge stato sessione */}
						<div className="mt-1">
							{isSessionActive ? (
								<div className="inline-flex items-center bg-emerald-50 rounded-full px-2 py-1 text-xs text-black">
									<Clock size={12} className="mr-1" />
									<span>Sessione: {formattedTimeLeft}</span>
								</div>
							) : (
								<div className="inline-flex items-center bg-red-50 rounded-full px-2 py-1 text-xs text-black">
									<Clock size={12} className="mr-1" />
									<span>Sessione scaduta</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Info dettagliate */}
				<div className="bg-white rounded-xl p-4 shadow-card">
					<div className="flex items-center mb-3">
						<div className="mr-3 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
							<Calendar size={16} className="text-black" />
						</div>
						<div className="min-w-0">
							<div className="text-xs text-black/60">Ultimo accesso</div>
							<div className="font-medium text-sm text-black truncate">{lastLogin}</div>
						</div>
					</div>

					<div className="flex items-center">
						<div className="mr-3 w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
							<Clock size={16} className="text-black" />
						</div>
						<div className="min-w-0">
							<div className="text-xs text-black/60">Scadenza sessione</div>
							<div className="font-medium text-sm text-black truncate">{expires_at}</div>
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
				<IonToolbar className="bg-gradient-primary text-white">
					{activeView === 'main' ? (
						<IonTitle className="text-white">AZ Reader</IonTitle>
					) : (
						<>
							<IonButtons slot="start">
								<IonButton onClick={handleBackClick}>
									<IonIcon icon={arrowBack} />
								</IonButton>
							</IonButtons>
							<IonTitle className="text-white">Impostazioni tema</IonTitle>
						</>
					)}
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding-0 bg-gray-50">
				{activeView === 'main' ? (
					<>
						{/* Informazioni Utente */}
						<div className="bg-gradient-to-b from-primary to-primary-light pt-5 pb-6 px-5 shadow-sm">
							{renderUserInfo()}
						</div>

						{/* Menu di navigazione */}
						<div className="p-5">
							<div className="text-sm font-medium uppercase text-black/60 mb-3 px-2">Menu</div>

							<div className="bg-white rounded-xl overflow-hidden shadow-card divide-y divide-gray-100">
								<IonMenuToggle>
									<div
										className="flex items-center p-4 cursor-pointer transition-colors hover:bg-gray-50"
										onClick={() => handleMenuItemClick('/discover')}
									>
										<div className="mr-3 w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
											<Compass size={18} className="text-black" />
										</div>
										<div className="flex-grow text-black font-medium">Discover</div>
										<ChevronRight size={18} className="text-black/40" />
									</div>
								</IonMenuToggle>

								<IonMenuToggle>
									<div
										className="flex items-center p-4 cursor-pointer transition-colors hover:bg-gray-50"
										onClick={() => handleMenuItemClick('/following')}
									>
										<div className="mr-3 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
											<Heart size={18} className="text-black" />
										</div>
										<div className="flex-grow text-black font-medium">Following Feed</div>
										<ChevronRight size={18} className="text-black/40" />
									</div>
								</IonMenuToggle>

								<IonMenuToggle>
									<div
										className="flex items-center p-4 cursor-pointer transition-colors hover:bg-gray-50"
										onClick={() => handleMenuItemClick('/activity')}
									>
										<div className="mr-3 w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
											<Activity size={18} className="text-black" />
										</div>
										<div className="flex-grow text-black font-medium">Activity Feed</div>
										<ChevronRight size={18} className="text-black/40" />
									</div>
								</IonMenuToggle>

								<IonMenuToggle>
									<div
										className="flex items-center p-4 cursor-pointer transition-colors hover:bg-gray-50"
										onClick={() => handleMenuItemClick('/profile')}
									>
										<div className="mr-3 w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
											<User size={18} className="text-black" />
										</div>
										<div className="flex-grow text-black font-medium">Profilo</div>
										<ChevronRight size={18} className="text-black/40" />
									</div>
								</IonMenuToggle>

								<IonMenuToggle>
									<div
										className="flex items-center p-4 cursor-pointer transition-colors hover:bg-gray-50"
										onClick={() => handleMenuItemClick('/info')}
									>
										<div className="mr-3 w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
											<Info size={18} className="text-black" />
										</div>
										<div className="flex-grow text-black font-medium">Informazioni</div>
										<ChevronRight size={18} className="text-black/40" />
									</div>
								</IonMenuToggle>
							</div>

							<div className="text-sm font-medium uppercase text-black/60 mt-6 mb-3 px-2">Personalizzazione</div>

							<div className="bg-white rounded-xl overflow-hidden shadow-card divide-y divide-gray-100">
								<div
									className="flex items-center p-4 cursor-pointer transition-colors hover:bg-gray-50"
									onClick={handleThemeSettingsClick}
								>
									<div className="mr-3 w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
										<Palette size={18} className="text-black" />
									</div>
									<div className="flex-grow text-black font-medium">Impostazioni tema</div>
									<ChevronRight size={18} className="text-black/40" />
								</div>
							</div>

							<div className="text-sm font-medium uppercase text-black/60 mt-6 mb-3 px-2">Account</div>

							<div className="bg-white rounded-xl overflow-hidden shadow-card">
								<IonMenuToggle>
									<div
										className="flex items-center p-4 cursor-pointer transition-colors hover:bg-gray-50"
										onClick={() => handleMenuItemClick('/logout')}
									>
										<div className="mr-3 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
											<LogOut size={18} className="text-black" />
										</div>
										<div className="flex-grow text-black font-medium">Esci</div>
										<ChevronRight size={18} className="text-black/40" />
									</div>
								</IonMenuToggle>
							</div>
						</div>
					</>
				) : (
					<div className="p-5">
						<ThemeSettingsPage />
					</div>
				)}
			</IonContent>
		</IonMenu>
	);
};

export default SideMenu; 