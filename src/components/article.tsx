import React, { useState } from "react";
import {
	IonIcon,
	IonToolbar,
	IonButtons,
	IonButton,
	IonFooter,
	IonContent,
	IonToast,
} from "@ionic/react";
import {
	chevronBack,
	ellipsisHorizontal,
	chatbubbleOutline,
	heart,
	heartOutline,
	shareOutline,
	bookmarkOutline,
} from "ionicons/icons";
import { Session } from "@supabase/supabase-js";
import { usePostLikes } from "@hooks/usePostLikes";
import { useCustomToast } from "@hooks/useIonToast";
import { renderArticleDatePublished } from "../utility/utils";
import FontSizeWrapper from "./FontSizeWrapper";
import FontSizeControls from "./ui/FontSizeControls";
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
	const { title, content, lead_image_url, html: htmlContent, date, date_published, domain, excerpt, url } = articleParsed;

	const [showShareToast, setShowShareToast] = useState<boolean>(false);
	const [shareToastMessage, setShareToastMessage] = useState<string>("");
	const showToast = useCustomToast();

	// Likes handling
	const { likesCount, hasLiked, toggleLike, isLoading: isLikeLoading, error: likeError } = usePostLikes(postId, session);
	const [showComments, setShowComments] = useState<boolean>(false);
	const { commentsCount } = usePostComments(postId, session);

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

	return (
		<>
			{displayFrom !== 'modalPreview' && renderHeader()}
			<div className="article-content px-4">
				{lead_image_url && (
					<div className="mb-4">
						<img src={lead_image_url} alt={title} className="w-full h-auto rounded-lg" />
					</div>
				)}
				<h1 className="text-2xl font-bold mb-2">{title}</h1>
				{domain && (
					<div className="text-sm text-gray-500 mb-2">
						{domain} • {renderArticleDatePublished(date_published || date)}
					</div>
				)}
				{excerpt && <div className="text-lg text-gray-700 mb-4">{excerpt}</div>}
				<FontSizeWrapper>
					<div className="prose max-w-none pb-20" dangerouslySetInnerHTML={{ __html: content || htmlContent || "" }} />
				</FontSizeWrapper>
			</div>
			{displayFrom !== 'modalPreview' && renderFooter()}
			<Comments
				isOpen={showComments}
				onClose={() => setShowComments(false)}
				articleTitle={title}
				postId={postId}
				session={session}
			/>
			<IonToast
				isOpen={showShareToast}
				onDidDismiss={() => setShowShareToast(false)}
				message={shareToastMessage}
				duration={2000}
				position="bottom"
				color="danger"
			/>
		</>
	);
};

export default Article;
