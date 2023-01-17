import { useState } from "react";
import { IonButton, IonButtons, IonContent, IonFooter, IonIcon, IonToolbar, getPlatforms, IonHeader } from "@ionic/react";
import { pricetags } from "ionicons/icons";


import ModalTags from "./modalTags";

import { saveTagsHandler } from "../store/rest";

import { isEmpty } from 'lodash';
import moment from 'moment';
import { renderArticleDatePublished } from "../utility/utils";

const Article = ({ articleParsed, onDismiss, postId, displayFrom }) => {
	const { title, content, lead_image_url, html: htmlContent, date, date_published, topImage, domain } = articleParsed;
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

	const renderButton = () => {
		if (displayFrom === 'modalPreview') return;

		return (
			<IonHeader>
				<IonToolbar color="light">
					<IonButtons slot="end">
						<IonButton onClick={onDismiss}>
							chiudi
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
		)
	}
	const renderImage = () => {
		if (domain !== 'unaparolaalgiorno.it') return;
		
		return <img className="w-full" alt="" src={lead_image_url} />
	}
	const renderTitle = () => {
		if (domain === 'unaparolaalgiorno.it') return;

		return <h1 className="py-1 text-2xl font-bold text-justify leading-6 font-[montserrat]">{title}</h1>
	}

	return (
		<>
			{renderButton()}
			<IonContent fullscreen>
				<div className="p-4">
					<div className="rounded-md">{renderImage()}</div>
					<div className="px-3">
						{renderTitle()}
						<div className="mt-2 border-l-4 border-red-600">
							<div className="pl-3">
								<h4 className="pt-1 text-xs font-light font-[montserrat]">{renderArticleDatePublished(date || date_published)}</h4>
								<h4 className="text-xs font-light font-[montserrat]">{domain}</h4>
							</div>
						</div>
						<div
							id="main-content"
							className="py-10 text-md text-justify font-normal font-[montserrat]"
							dangerouslySetInnerHTML={{ __html: content || htmlContent }} />
					</div>
				</div>
				{renderFooter()}
				{/* {renderModalTag()} */}
			</IonContent>
		</>
	)
}
export default Article;