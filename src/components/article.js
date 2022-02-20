import { useEffect, useState } from "react";
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonFooter, IonHeader, IonIcon, IonImg, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { close, pricetags } from "ionicons/icons";

import ModalTags from "./modalTags";

import { saveTagsHandler } from "../store/rest";

import { isEmpty } from 'lodash';

const Article = ({ articleParsed, onDismiss, postId }) => {
	const { title, content, lead_image_url } = articleParsed;

	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [saveTags, {data: isTagsSaved}] = saveTagsHandler();


	const dismissTagModalHandler = (tagsSelected) => {
		setShowModal(false);
		if (isEmpty(tagsSelected)) return;

		saveTags({
			id: postId,
			tags: tagsSelected
		})
	}

	useEffect(() => {})

	const insertTagHandler = () => {
		setShowModal(true);
	}

	const renderModalTag = () => {
		const modalProps = { showModal, dismissTagModalHandler, postId }

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
						</IonCardHeader>
						<IonCardContent className="text-justify">
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
					{renderModalTag()}
				</IonPage>
			</IonContent>
		</>
	)
}
export default Article;