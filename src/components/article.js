import { useEffect, useState } from "react";
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonFooter, IonHeader, IonIcon, IonImg, IonModal, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { close, pricetags } from "ionicons/icons";

import ModalTags from "./modalTags";

import { saveTagsHandler } from "../store/rest";

import { isEmpty } from 'lodash';

const Article = ({ articleParsed, onDismiss, postId }) => {
	const { title, content, lead_image_url } = articleParsed;

	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [saveTags, { data: isTagsSaved }] = saveTagsHandler();


	const dismissTagModalHandler = (tagsSelected) => {
		setShowModal(false);
		if (isEmpty(tagsSelected)) return;

		saveTags({
			id: postId,
			tags: tagsSelected
		})
	}

	const insertTagHandler = () => {
		setShowModal(true);
	}
	const clickme = () => {
		console.log('boobs!')
	}
	const renderModalTag = () => {
		const modalProps = { showModal, dismissTagModalHandler, postId, clickme }

		return <ModalTags {...modalProps} />
	}

	return (
		<>
			<IonContent>
				<IonHeader className="flex justify-end">
					<IonButton fill="clear" onClick={() => onDismiss()}>chiudi</IonButton>
				</IonHeader>
				<div className="p-4">
					<div className="rounded-md">
						{/* <img className="w-full" alt="" src={lead_image_url} /> */}
					</div>
					<div className="px-3">
						<h1 className="py-1 text-2xl font-bold text-justify leading-6">{title}</h1>
						<div
							className="py-10 text-justify"
							dangerouslySetInnerHTML={{ __html: content }} />
					</div>
				</div>







				{/* <IonFooter>
						<IonToolbar color="dark">
							<IonButtons slot="primary">
								<IonButton
									onClick={() => insertTagHandler()} >
									<IonIcon slot="icon-only" icon={pricetags} />
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonFooter> */}
				{/* {renderModalTag()} */}
				<IonModal
					isOpen={showModal}
					breakpoints={[0.1, 0.5, 1]}
					initialBreakpoint={0.5}
					onDidDismiss={() => dismissTagModalHandler()}
				>
					<ModalTags postId={postId} />

				</IonModal>
			</IonContent>
		</>
	)
}
export default Article;