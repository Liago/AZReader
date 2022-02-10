import { useState } from "react";
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonFooter, IonHeader, IonIcon, IonImg, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { close, pricetags } from "ionicons/icons";

import ModalTags from "./modalTags";

const Article = ({ articleParsed, onDismiss, postId }) => {
	const { title, content, lead_image_url } = articleParsed;
	
	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');

	const insertTagHandler = () => {
		setShowModal(true);
	}

	const renderModalTag = () => {
		const modalProps = { showModal, setShowModal, searchText, setSearchText }

		return <ModalTags {...modalProps} />
	}

	return (
		<>
			<IonContent>
				<IonPage>
					<IonHeader>
						<IonToolbar color="dark">
							<IonButtons slot="end">
								<IonButton onClick={() => onDismiss()}>
									<IonIcon slot="icon-only" icon={close} />
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonCard className="overflow-y-auto">
						<IonImg src={lead_image_url} />
						<IonCardHeader>
							<IonCardSubtitle>{title}</IonCardSubtitle>
							<IonCardTitle></IonCardTitle>
						</IonCardHeader>
						<IonCardContent className="text-sm text-justify">
							<div dangerouslySetInnerHTML={{ __html: content }}></div>
						</IonCardContent>
					</IonCard>
					<IonFooter>
						<IonToolbar color="dark">
							<IonButtons slot="primary">
								<IonButton
									onClick={() => insertTagHandler()} >
									<IonIcon slot="icon-only" icon={pricetags} />
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonFooter>
				</IonPage>
				{renderModalTag()}
			</IonContent>
		</>
	)
}
export default Article;