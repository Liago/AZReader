import React, { useState } from "react";
import {
	IonIcon,
	getPlatforms,
	IonModal,
	IonToolbar,
	IonButtons,
	IonButton,
	IonFooter,
	IonPage,
	IonToast,
} from "@ionic/react";
import {
	bookmark,
	chevronBack,
	ellipsisHorizontal,
	chatbubbleOutline,
	heart,
	heartOutline,
	shareOutline,
	searchOutline,
	bookmarkOutline,
} from "ionicons/icons";
import { Session } from "@supabase/supabase-js";
import ModalTags from "./modalTags";
import { useTagsSaver } from "@store/rest";
import { usePostLikes } from "@hooks/usePostLikes";
import { useCustomToast } from "@hooks/useIonToast";
import { isEmpty } from "lodash";
import { renderArticleDatePublished } from "../utility/utils";
import FontSizeWrapper from "./FontSizeWrapper";
import FontSizeControls from "./ui/FontSizeControls";
import moment from "moment";
import { usePostComments } from "@hooks/usePostComments";
import Comments from "./Comments";
import { ShareService } from "@utility/shareService";

interface ArticleProps {
	articleParsed: {
		title: string;
		content?: string;
		html?: string;
		lead_image_url?: string;
		date?: string;
		date_published?: string;
		domain?: string;
		excerpt?: string;
		url?: string;
		savedBy?: {
			userEmail: string;
			userId: string;
		};
		savedOn?: string;
	};
	onDismiss: () => void;
	postId: string;
	displayFrom?: string;
	session: Session | null;
}

const Article: React.FC<ArticleProps> = ({ articleParsed, onDismiss, postId, displayFrom, session }) => {
	const { title, content, lead_image_url, html: htmlContent, date, date_published, domain, excerpt, url, savedBy, savedOn } = articleParsed;

	const platforms = getPlatforms();
	const [showModal, setShowModal] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [showShareToast, setShowShareToast] = useState<boolean>(false);
	const [shareToastMessage, setShareToastMessage] = useState<string>("");
	const showToast = useCustomToast();

	// Likes handling
	const { likesCount, hasLiked, toggleLike, isLoading: isLikeLoading, error: likeError } = usePostLikes(postId, session);
	const [showComments, setShowComments] = useState<boolean>(false);
	const { commentsCount } = usePostComments(postId, session);

	const [saveTagsFunc, { error: tagError, loading: tagLoading, data: tagData }] = useTagsSaver();

	const handleLikeClick = async () => {
		try {
			if (!session) {
				showToast({
					message: "Devi effettuare l'accesso per mettere mi piace",
					color: "warning",
				});
				return;
			}

			await toggleLike();

			if (likeError) {
				showToast({
					message: likeError.message,
					color: "danger",
				});
			}
		} catch (err) {
			showToast({
				message: "Errore durante l'operazione",
				color: "danger",
			});
		}
	};

	const dismissTagModalHandler = async (tagsSelected: string[]) => {
		setShowModal(false);
		if (isEmpty(tagsSelected)) return;

		try {
			await saveTagsFunc({
				id: postId,
				tags: tagsSelected,
			});

			if (tagError) {
				showToast({
					message: "Errore durante il salvataggio dei tag",
					color: "danger",
				});
			}
		} catch (err) {
			showToast({
				message: "Errore durante il salvataggio dei tag",
				color: "danger",
			});
		}
	};

	const insertTagHandler = () => {
		setShowModal(true);
	};

	// Funzione per condividere l'articolo
	const handleShareArticle = async () => {
		try {
			// Verifica se la condivisione è disponibile
			const canShare = await ShareService.canShare();

			if (!canShare) {
				setShareToastMessage("La condivisione non è supportata su questo dispositivo");
				setShowShareToast(true);
				return;
			}

			// Usa l'URL originale se disponibile, altrimenti crea un deep link all'articolo nell'app
			const shareUrl = url || `azreader://article/${postId}`;

			const result = await ShareService.shareArticle(title, shareUrl, excerpt);

			if (!result) {
				setShareToastMessage("Non è stato possibile condividere l'articolo");
				setShowShareToast(true);
			}
		} catch (error) {
			console.error("Errore durante la condivisione:", error);
			setShareToastMessage("Si è verificato un errore durante la condivisione");
			setShowShareToast(true);
		}
	};

	const renderHeader = () => (
		<IonToolbar className="ion-padding-top safe-area-top">
			<IonButtons slot="start">
				<IonButton onClick={onDismiss}>
					<IonIcon icon={chevronBack} className="w-6 h-6" />
				</IonButton>
			</IonButtons>
			<IonButtons slot="end" className="pr-safe-area">
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

	const renderFooter = () => (
		<IonFooter className="bg-white border-t border-gray-100 shadow-sm">
			<IonToolbar className="px-2 py-1">
				<div className="flex justify-around items-center">
					{/* Like Button */}
					<IonButton onClick={handleLikeClick} disabled={isLikeLoading} className="flex flex-col items-center" fill="clear" size="large">
						<div
							className={`
            flex flex-col items-center transition-all duration-200 transform
            ${hasLiked ? "scale-110" : "scale-100"}
            ${isLikeLoading ? "opacity-50" : "opacity-100"}
          `}
						>
							<IonIcon
								icon={hasLiked ? heart : heartOutline}
								className={`w-6 h-6 mb-1 ${hasLiked ? "text-red-500" : "text-gray-600"}`}
							/>
							<span className={`text-xs font-medium ${hasLiked ? "text-red-500" : "text-gray-600"}`}>{likesCount}</span>
						</div>
					</IonButton>

					{/* Comment Button */}
					<IonButton onClick={() => setShowComments(true)} className="flex flex-col items-center" fill="clear" size="large">
						<div className="flex flex-col items-center hover:text-blue-500 transition-colors duration-200">
							<IonIcon icon={chatbubbleOutline} className="w-6 h-6 mb-1 text-gray-600" />
							<span className="text-xs font-medium text-gray-600">{commentsCount}</span>
						</div>
					</IonButton>

					{/* Share Button */}
					<IonButton onClick={handleShareArticle} className="flex flex-col items-center" fill="clear" size="large">
						<div className="flex flex-col items-center hover:text-green-500 transition-colors duration-200">
							<IonIcon icon={shareOutline} className="w-6 h-6 mb-1 text-gray-600" />
							<span className="text-xs font-medium text-gray-600">Condividi</span>
						</div>
					</IonButton>

					{/* Save Button */}
					<IonButton className="flex flex-col items-center" fill="clear" size="large">
						<div className="flex flex-col items-center hover:text-purple-500 transition-colors duration-200">
							<IonIcon icon={bookmarkOutline} className="w-6 h-6 mb-1 text-gray-600" />
							<span className="text-xs font-medium text-gray-600">Salva</span>
						</div>
					</IonButton>
				</div>
			</IonToolbar>
		</IonFooter>
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
					<ModalTags showModal={showModal} dismissTagModalHandler={dismissTagModalHandler} postId={postId} />
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

						<div className="flex justify-between items-center mb-6 border border-gray-200 p-4">
							<div>
								<p className="text-sm text-gray-500 m-0">{renderArticleDatePublished(date || date_published)}</p>
								<p className="text-xs m-0">
									Salvato da: {savedBy?.userEmail} il {moment(savedOn).format("DD MMMM YYYY")}
								</p>
								<p className="font-bold text-xs text-gray-900 m-0 text-right">{domain}</p>
							</div>
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
				<Comments postId={postId} session={session} isOpen={showComments} onClose={() => setShowComments(false)} />

				{/* Toast per i messaggi di condivisione */}
				<IonToast
					isOpen={showShareToast}
					onDidDismiss={() => setShowShareToast(false)}
					message={shareToastMessage}
					duration={2000}
					position="bottom"
					color="medium"
				/>
			</div>
		</IonPage>
	);
};

export default Article;
