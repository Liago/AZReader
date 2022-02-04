import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonImg, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { close } from "ionicons/icons";

const Article = ({ articleParsed, onDismiss }) => {
	const { title, content, lead_image_url } = articleParsed;

	return (
		<>
		<IonContent>
				<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="end">
						<IonButton onClick={() => onDismiss()}>
							<IonIcon slot="icon-only" icon={close} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonCard  className="overflow-y-auto">
				<IonImg src={lead_image_url} />
				<IonCardHeader>
					<IonCardSubtitle>{title}</IonCardSubtitle>
					<IonCardTitle></IonCardTitle>
				</IonCardHeader>
				<IonCardContent className="text-sm text-justify">
					<div dangerouslySetInnerHTML={{ __html: content }}></div>
				</IonCardContent>
			</IonCard>

				</IonPage>
				</IonContent>
		</>
	)
}
export default Article;