import { useState } from "react";
import { IonButton, IonButtons, IonContent, IonFooter, IonIcon, IonToolbar, getPlatforms } from "@ionic/react";
import { pricetags } from "ionicons/icons";


import ModalTags from "./modalTags";

import { saveTagsHandler } from "../store/rest";

import { isEmpty } from 'lodash';
import FlatHeader from "./ui/flatHeader";

const Article = ({ articleParsed, onDismiss, postId }) => {
	const { title, content, lead_image_url } = articleParsed;
	const platforms = getPlatforms()
	const [showModal, setShowModal] = useState(false);
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

	// const renderModalTag = () => {
	// 	return (
	// 		<IonModal
	// 			isOpen={showModal}
	// 			breakpoints={[0.1, 0.5, 1]}
	// 			initialBreakpoint={0.5}
	// 			onDidDismiss={() => dismissTagModalHandler()}
	// 		>
	// 			<ModalTags postId={postId} />

	// 		</IonModal>
	// 	)
	// }

	const renderFooter = () => {
		return;

		return (
			<IonFooter>
				<IonToolbar color="light">
					<IonButtons slot="primary">
						<IonButton
							onClick={() => insertTagHandler()} >
							<IonIcon slot="icon-only" icon={pricetags} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonFooter>
		)
	}



	return (
		<>
			<FlatHeader
				dismiss={onDismiss}
				title=""
				platforms={platforms}
			/>
			<IonContent fullscreen>
				<div className="px-4 mt-32">
					<div className="rounded-md">
						{/* <img className="w-full" alt="" src={lead_image_url} /> */}
					</div>
					<div className="px-3">
						<h1 className="py-1 text-2xl font-bold text-justify leading-6 font-['roboto']">{title}</h1>
						<div
							className="py-10 text-md text-justify font-normal font-[montserrat]"
							dangerouslySetInnerHTML={{ __html: content }} />
					</div>
				</div>
				{renderFooter()}
				{/* {renderModalTag()} */}
			</IonContent>
		</>
	)
}
export default Article;