import { useState } from "react";
import { IonButton, IonButtons, IonContent, IonFooter, IonIcon, IonToolbar, getPlatforms, IonHeader, IonPopover } from "@ionic/react";
import { closeOutline, informationCircleSharp, pricetags } from "ionicons/icons";


import ModalTags from "./modalTags";

import { saveTagsHandler } from "../store/rest";

import { isEmpty } from 'lodash';
import moment from 'moment';
import { renderArticleDatePublished } from "../utility/utils";

const Article = ({ articleParsed, onDismiss, postId, displayFrom }) => {
	const { title, content, lead_image_url, html: htmlContent, date, date_published, topImage, domain, savedBy, savedOn } = articleParsed;
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
		// return (
		// 	<IonFooter>
		// 		<IonToolbar color="light">
		// 			<IonButtons slot="primary">
		// 				<IonButton
		// 					onClick={() => insertTagHandler()} >
		// 					<IonIcon slot="icon-only" icon={pricetags} />
		// 				</IonButton>
		// 			</IonButtons>
		// 		</IonToolbar>
		// 	</IonFooter>
		// )
	}

	const renderContent = () => {
		return (
			<div className="px-2 text-xs border-l-4 border-sky-500">
				<p>Aggiunto il {moment(savedOn).format('D MMMM YYYY')} alle {moment(savedOn).format('HH:mm')}</p>
				<p>da {savedBy?.userEmail} </p>
			</div>
		)
	}


	const renderButton = () => {
		if (displayFrom === 'modalPreview') return;

		return (
			<IonHeader translucent={true}>
				<IonToolbar color="light">
					<IonButtons slot="start">
						<IonButton id="info-popover">
							<IonIcon slot="icon-only" color="primary" icon={informationCircleSharp}></IonIcon>
						</IonButton>
						<IonPopover trigger="info-popover" side="right" alignment="start">
							<IonContent className="ion-padding">
								{renderContent()}
							</IonContent>
						</IonPopover>
					</IonButtons>
					<IonButtons slot="end">
						<IonButton onClick={onDismiss}>
							<IonIcon slot="icon-only" color="primary" icon={closeOutline}></IonIcon>
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
		)
	}
	const renderImage = () => {
		if (domain !== 'unaparolaalgiorno.it') return;

		return <img className="w-full rounded-md" alt="" src={lead_image_url} />
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
					<div className="rounded-md shadow-md">{renderImage()}</div>
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