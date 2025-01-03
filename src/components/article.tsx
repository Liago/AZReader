import React, { useState } from "react";
import { IonIcon, getPlatforms, IonModal, IonToolbar, IonButtons, IonButton, IonTitle, IonBackButton, IonFooter, IonPage } from "@ionic/react";
import {
	bookmark,
	chevronBack,
	ellipsisHorizontal,
	playCircle,
	chatbubbleOutline,
	heartOutline,
	refreshOutline,
	shareOutline,
	searchOutline,
} from "ionicons/icons";
import ModalTags from "./modalTags";
import { useTagsSaver } from "@store/rest";
import { isEmpty } from "lodash";
import { renderArticleDatePublished } from "../utility/utils";
import { ArticleProps } from "@common/interfaces";
import FontSizeWrapper from "./FontSizeWrapper";
import FontSizeControls from "./ui/FontSizeControls";

const Article: React.FC<ArticleProps> = ({ articleParsed, onDismiss, postId, displayFrom }) => {
	const { title, content, lead_image_url, html: htmlContent, date, date_published, domain, excerpt } = articleParsed;

	const platforms = getPlatforms();
	const [showModal, setShowModal] = useState<boolean>(false);
	const [saveTagsFunc, { error, loading, data }] = useTagsSaver();
	const [searchQuery, setSearchQuery] = useState<string>("");

	const clickme = () => {
		console.log("clicked!");
	};

	const dismissTagModalHandler = async (tagsSelected: string[]) => {
		setShowModal(false);
		if (isEmpty(tagsSelected)) return;

		await saveTagsFunc({
			id: postId,
			tags: tagsSelected,
		});
	};

	const insertTagHandler = () => {
		setShowModal(true);
	};

	const renderHeader = () => (
		<IonToolbar>
			<IonButtons slot="start">
				<IonButton onClick={onDismiss}>
					<IonIcon icon={chevronBack} className="w-6 h-6" />
				</IonButton>
			</IonButtons>
			{/* <IonTitle>{postId}</IonTitle> */}
			<IonButtons slot="end">
				<FontSizeControls />
				<IonButton>
					<IonIcon icon={bookmark} className="w-6 h-6 text-gray-700" />
				</IonButton>
				<IonButton>
					<IonIcon icon={ellipsisHorizontal} className="w-6 h-6 text-gray-700" />
				</IonButton>
			</IonButtons>
		</IonToolbar>
	);
	const _renderHeader = () => (
		<header
			className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10"
			style={{
				paddingTop: "env(safe-area-inset-top, 0px)",
				paddingLeft: "env(safe-area-inset-left, 0px)",
				paddingRight: "env(safe-area-inset-right, 0px)",
			}}
		>
			<div className="flex justify-between items-center h-14 px-4">
				<button
					onClick={onDismiss}
					className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
					style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
				>
					<IonIcon icon={chevronBack} className="w-6 h-6" />
				</button>
				<div className="flex space-x-2" style={{ marginTop: "env(safe-area-inset-top, 0px)" }}>
					<button className="p-2 hover:bg-gray-100 rounded-full">
						<IonIcon icon={playCircle} className="w-6 h-6 text-gray-700" />
					</button>
					<button className="p-2 hover:bg-gray-100 rounded-full">
						<IonIcon icon={bookmark} className="w-6 h-6 text-gray-700" />
					</button>
					<button className="p-2 hover:bg-gray-100 rounded-full">
						<IonIcon icon={ellipsisHorizontal} className="w-6 h-6 text-gray-700" />
					</button>
				</div>
			</div>
		</header>
	);

	const renderFooter = () => (
		<IonFooter className="bg-white border-t border-gray-200 z-10">
			<IonToolbar className="bg-white border-t border-gray-200 z-10">
				<IonButton>
					<IonIcon icon={heartOutline} className="w-6 h-6" />
					<span className="text-sm font-medium">1.7K</span>
				</IonButton>
				<IonButton>
					<IonIcon icon={chatbubbleOutline} className="w-6 h-6" />
					<span className="text-sm font-medium">222</span>
				</IonButton>
				<IonButton>
					<IonIcon icon={refreshOutline} className="w-6 h-6" />
					<span className="text-sm font-medium">136</span>
				</IonButton>
				<IonButton onClick={insertTagHandler}>
					<IonIcon icon={shareOutline} className="w-6 h-6" />
				</IonButton>
			</IonToolbar>
		</IonFooter>
	);

	const _renderFooter = () => (
		<footer
			className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10"
			style={{
				paddingBottom: "env(safe-area-inset-bottom, 0px)",
				paddingLeft: "env(safe-area-inset-left, 0px)",
				paddingRight: "env(safe-area-inset-right, 0px)",
			}}
		>
			<div className="flex justify-between items-center h-14 px-6">
				<button className="flex items-center space-x-2 text-gray-700">
					<IonIcon icon={heartOutline} className="w-6 h-6" />
					<span className="text-sm font-medium">1.7K</span>
				</button>
				<button className="flex items-center space-x-2 text-gray-700">
					<IonIcon icon={chatbubbleOutline} className="w-6 h-6" />
					<span className="text-sm font-medium">222</span>
				</button>
				<button className="flex items-center space-x-2 text-gray-700">
					<IonIcon icon={refreshOutline} className="w-6 h-6" />
					<span className="text-sm font-medium">136</span>
				</button>
				<button onClick={insertTagHandler} className="flex items-center text-gray-700">
					<IonIcon icon={shareOutline} className="w-6 h-6" />
				</button>
			</div>
		</footer>
	);

	const renderSearchBar = () => (
		<div className="bg-gray-100 rounded-lg mx-4 my-3">
			<div className="flex items-center px-4 py-2">
				<IonIcon icon={searchOutline} className="w-5 h-5 text-gray-500 mr-2" />
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Cerca un tag o inseriscine uno nuovo"
					className="bg-transparent w-full text-gray-700 placeholder-gray-500 outline-none text-sm"
				/>
			</div>
		</div>
	);

	const renderModalTags = () => (
		<IonModal
			isOpen={showModal}
			onDidDismiss={() => setShowModal(false)}
			breakpoints={[0, 0.5, 0.75]}
			initialBreakpoint={0.75}
			className="bg-white rounded-t-xl"
		>
			<div className="px-4 py-6">
				{renderSearchBar()}
				<div className="mt-4">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
					<ModalTags showModal={showModal} dismissTagModalHandler={dismissTagModalHandler} postId={postId} clickme={clickme} />
				</div>
			</div>
		</IonModal>
	);

	return (
		<IonPage>
			<div className="flex flex-col min-h-screen bg-white">
				{renderHeader()}
				<main className="flex-1 overflow-y-auto pt-16 pb-20">
					<article className="max-w-2xl mx-auto px-4 font-montserrat">
						<h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
						{excerpt && <h2 className="text-lg text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: excerpt }} />}

						<div className="flex justify-between items-center mb-6">
							<div>
								<p className="font-medium text-gray-900">{domain}</p>
								<p className="text-sm text-gray-500">{renderArticleDatePublished(date || date_published)}</p>
							</div>
							<img src="/api/placeholder/40/40" alt={domain} className="w-10 h-10 rounded-full shadow-sm object-cover" />
						</div>

						{lead_image_url && <img src={lead_image_url} alt={title} className="w-full rounded-lg mb-6 shadow-sm object-cover" />}

						<FontSizeWrapper>
							<div
								className="prose max-w-none text-gray-800 mb-12"
								dangerouslySetInnerHTML={{ __html: content || htmlContent || "" }}
							/>
						</FontSizeWrapper>
					</article>
				</main>

				{renderFooter()}
				{renderModalTags()}
			</div>
		</IonPage>
	);
};

export default Article;
