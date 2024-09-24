import { useState } from "react";
import { IonButton, IonButtons, IonContent, IonFooter, IonIcon, IonToolbar, getPlatforms, IonHeader } from "@ionic/react";
import { bookmark, chevronBack, ellipsisHorizontal, playCircle, pricetags } from "ionicons/icons";


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

	const CustomHeader = ({ onDismiss }) => (
		<header className="fixed top-0 left-0 right-0 bg-white z-10">
			<div className="flex justify-between items-center px-4 py-2">
				<button onClick={onDismiss} className="p-2">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<div className="flex space-x-4">
					<button className="p-2">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</button>
					<button className="p-2">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
						</svg>
					</button>
					<button className="p-2">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
						</svg>
					</button>
				</div>
			</div>
		</header>
	);

	const CustomFooter = () => (
		<footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
			<div className="flex justify-between items-center px-4 py-2">
				<button className="flex items-center">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
					</svg>
					<span>1.7K</span>
				</button>
				<button className="flex items-center">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
					<span>222</span>
				</button>
				<button className="flex items-center">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					<span>136</span>
				</button>
				<button className="flex items-center">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
					</svg>
				</button>
			</div>
		</footer>
	);


	const renderHeader = () => {
		if (displayFrom === 'modalPreview') return;

		return (
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={onDismiss}>
							<IonIcon icon={chevronBack} />
						</IonButton>
					</IonButtons>
					<IonButtons slot="end">
						<IonButton>
							<IonIcon icon={playCircle} />
						</IonButton>
						<IonButton>
							<IonIcon icon={bookmark} />
						</IonButton>
						<IonButton>
							<IonIcon icon={ellipsisHorizontal} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
		)

		return (
			<IonHeader translucent={true}>
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

		return <img className="w-full rounded-md" alt="" src={lead_image_url} />
	}
	const renderTitle = () => {
		if (domain === 'unaparolaalgiorno.it') return;

		return <h1 className="py-1 text-2xl font-bold text-justify leading-6 font-[montserrat]">{title}</h1>
	}

	return (
		<>
			<CustomHeader onDismiss={onDismiss} />
			<IonContent fullscreen className="ion-padding">
				<div className="max-w-2xl mx-auto font-montserrat">
					<h1 className="text-3xl font-bold mb-3">{title}</h1>
					<h2 className="text-xl text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: articleParsed.excerpt}}></h2>
					<div className="flex justify-between items-center mb-6">
						<div>
							<p className="font-semibold">{domain}</p>
							<p className="text-sm text-gray-500">
								{renderArticleDatePublished(date || date_published)}
							</p>
						</div>
						<img src="/api/placeholder/40/40" alt={domain} className="w-10 h-10 rounded-full mr-3 shadow-md " />
					</div>
					{lead_image_url && (
						<img src={lead_image_url} alt={title} className="w-full rounded-lg mb-6" />
					)}
					<div
						className="prose max-w-none text-md text-justify font-normal"
						dangerouslySetInnerHTML={{ __html: content || htmlContent }}
					/>
				</div>
			</IonContent>
			<CustomFooter />
			{/* <IonFooter>
				<IonToolbar>
					<div className="flex justify-between items-center px-4">
						<div className="flex items-center">
							<IonIcon icon={bookmark} className="mr-2" />
							<span>1.7K</span>
						</div>
						<div className="flex items-center">
							<IonIcon icon={ellipsisHorizontal} className="mr-2" />
							<span>222</span>
						</div>
						<div className="flex items-center">
							<IonIcon icon={playCircle} className="mr-2" />
							<span>136</span>
						</div>
					</div>
				</IonToolbar>
			</IonFooter> */}
		</>
	)
}
export default Article;