import React, { useState } from "react";
import {
	IonIcon,
	getPlatforms,
	IonModal,
	IonToolbar,
	IonButtons,
	IonButton,
	IonTitle,
	IonBackButton,
	IonFooter,
	IonPage,
	IonHeader,
	IonContent,
} from "@ionic/react";
import {
	bookmark,
	chevronBack,
	ellipsisHorizontal,
	playCircle,
	chatbubbleOutline,
	heart,
	heartOutline,
	refreshOutline,
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
	const { title, content, lead_image_url, html: htmlContent, date, date_published, domain, excerpt, savedBy, savedOn } = articleParsed;

	const platforms = getPlatforms();
	const [showModal, setShowModal] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>("");
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
			<IonHeader className="ion-no-border compact-header">
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={onDismiss} className="compact-button">
							<IonIcon icon={chevronBack} className="w-5 h-5" />
						</IonButton>
					</IonButtons>
					<IonButtons slot="end">
						<FontSizeControls />
						<IonButton className="compact-button">
							<IonIcon icon={bookmark} className="w-5 h-5 text-gray-700" />
						</IonButton>
						<IonButton className="compact-button">
							<IonIcon icon={ellipsisHorizontal} className="w-5 h-5 text-gray-700" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen className="ion-padding-horizontal">
				<article className="max-w-2xl mx-auto pt-0 font-montserrat">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
					{excerpt && <h2 className="text-base text-gray-600 mb-3" dangerouslySetInnerHTML={{ __html: excerpt }} />}

					<div className="flex flex-col mb-4 border border-gray-200 p-3 rounded-lg shadow-sm">
						<div className="flex justify-between items-center">
							<div>
								<p className="text-xs text-gray-500 m-0">{renderArticleDatePublished(date || date_published)}</p>
								<p className="text-xs m-0">
									Salvato da: {savedBy?.userEmail} il {moment(savedOn).format("DD MMMM YYYY")}
								</p>
							</div>
							<div className="font-bold text-xs text-gray-900 m-0">{domain}</div>
						</div>
					</div>

					{lead_image_url && (
						<div className="mb-4 rounded-lg overflow-hidden shadow-sm">
							<img src={lead_image_url} alt={title} className="w-full object-cover h-48 md:h-64" />
						</div>
					)}

					<FontSizeWrapper>
						<div
							className="prose max-w-none text-gray-800 mb-16" // padding bottom ridotto
							dangerouslySetInnerHTML={{ __html: content || htmlContent || "" }}
						/>
					</FontSizeWrapper>
				</article>
			</IonContent>

			<IonFooter className="ion-no-border compact-footer">
				<div className="flex justify-around items-center px-2 py-1 bg-white border-t border-gray-200">
					<button className="flex flex-col items-center p-1" onClick={handleLikeClick}>
						<IonIcon icon={hasLiked ? heart : heartOutline} className={`w-5 h-5 ${hasLiked ? "text-red-500" : "text-gray-600"}`} />
						<span className="text-xs font-medium text-gray-600">{likesCount}</span>
					</button>
					<button className="flex flex-col items-center p-1" onClick={() => setShowComments(true)}>
						<IonIcon icon={chatbubbleOutline} className="w-5 h-5 text-gray-600" />
						<span className="text-xs font-medium text-gray-600">{commentsCount}</span>
					</button>
					<button className="flex flex-col items-center p-1" onClick={insertTagHandler}>
						<IonIcon icon={shareOutline} className="w-5 h-5 text-gray-600" />
						<span className="text-xs font-medium text-gray-600">Condividi</span>
					</button>
					<button className="flex flex-col items-center p-1">
						<IonIcon icon={bookmarkOutline} className="w-5 h-5 text-gray-600" />
						<span className="text-xs font-medium text-gray-600">Salva</span>
					</button>
				</div>
			</IonFooter>

			{renderModalTags()}
			<Comments postId={postId} session={session} isOpen={showComments} onClose={() => setShowComments(false)} />
		</IonPage>
	);
};

export default Article;
