import { useIonToast } from '@ionic/react';

interface ToastOptions {
	message: string;
	color?: string;
	duration?: number;
}

export const useCustomToast = () => {
	const [showToast, dismissToast] = useIonToast();

	const presentToast = ({ message, color = 'primary', duration = 3000 }: ToastOptions) => {
		showToast({
			message,
			color,
			duration,
			onDidDismiss: () => dismissToast(),
		});
	};

	return presentToast;
};