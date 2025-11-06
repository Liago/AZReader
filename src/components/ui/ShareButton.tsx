import React, { useState } from "react";
import { IonButton, IonIcon, IonToast } from "@ionic/react";
import { shareOutline } from "ionicons/icons";
import { ShareService } from "@utility/shareService";

interface ShareButtonProps {
	title: string;
	url: string;
	excerpt?: string;
	className?: string;
	buttonText?: string;
	iconOnly?: boolean;
	size?: "small" | "default" | "large";
	color?: string;
	fill?: "clear" | "outline" | "solid";
}

/**
 * Componente per condividere contenuti tramite API native o web
 */
const ShareButton: React.FC<ShareButtonProps> = ({
	title,
	url,
	excerpt,
	className = "",
	buttonText = "Condividi",
	iconOnly = false,
	size = "default",
	color = "medium",
	fill = "clear",
}) => {
	const [showToast, setShowToast] = useState<boolean>(false);
	const [toastMessage, setToastMessage] = useState<string>("");

	const handleShare = async () => {
		try {
			// Verifica se la condivisione è disponibile
			const canShare = await ShareService.canShare();

			if (!canShare) {
				setToastMessage("La condivisione non è supportata su questo dispositivo");
				setShowToast(true);
				return;
			}

			const result = await ShareService.shareArticle(title, url, excerpt);

			if (!result) {
				setToastMessage("Non è stato possibile condividere il contenuto");
				setShowToast(true);
			}
		} catch (error) {
			console.error("Errore durante la condivisione:", error);
			setToastMessage("Si è verificato un errore durante la condivisione");
			setShowToast(true);
		}
	};

	return (
		<>
			<IonButton className={className} fill={fill} size={size} onClick={handleShare}>
				<IonIcon icon={shareOutline} slot={iconOnly ? "icon-only" : undefined} color={color} />
				{!iconOnly && <span>{buttonText}</span>}
			</IonButton>

			<IonToast
				isOpen={showToast}
				onDidDismiss={() => setShowToast(false)}
				message={toastMessage}
				duration={2000}
				position="bottom"
				color="medium"
			/>
		</>
	);
};

export default ShareButton;
