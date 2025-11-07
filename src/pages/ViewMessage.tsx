import React, { useState, useEffect } from "react";
import {
	IonPage,
	IonContent,
	IonHeader,
	IonToolbar,
	IonButtons,
	IonBackButton,
	IonTitle,
	IonButton,
	IonIcon,
	IonFooter,
	useIonViewWillEnter,
	IonModal,
	IonToast,
} from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import { ellipsisHorizontal, heart, heartOutline, chatbubbleOutline, shareOutline, bookmarkOutline, bookmark } from "ionicons/icons";
import { useSelector } from "react-redux";

import { usePostLikes } from "@hooks/usePostLikes";
import { usePostComments } from "@hooks/usePostComments";
import { useCustomToast } from "@hooks/useIonToast";
import { renderArticleDatePublished } from "@utility/utils";
import { isEmpty } from "lodash";
import moment from "moment";
import "moment/locale/it";
import { RootState } from "@store/reducers";
import { supabase } from "@store/rest";

import { useTagsSaver } from "@store/rest";

import ModalTags from "@components/modalTags";
import FontSizeControls from "@components/ui/FontSizeControls";
import FontSizeWrapper from "@components/FontSizeWrapper";
import Comments from "@components/Comments";
import ReadingThemeWrapper from "@components/ui/ReadingThemeWrapper";

import { Session } from "@supabase/supabase-js";
import { ShareService } from "@utility/shareService";

interface ParamTypes {
	id: string;
}

const ViewMessage: React.FC = () => {
	const { id } = useParams<ParamTypes>();
	const history = useHistory();
	const [article, setArticle] = useState<any>(null);
	const [showComments, setShowComments] = useState<boolean>(false);
	const [showModal, setShowModal] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
	const [showShareToast, setShowShareToast] = useState<boolean>(false);
	const [shareToastMessage, setShareToastMessage] = useState<string>("");

	// Otteniamo le credenziali utente dallo stato Redux
	const userCredentials = useSelector((state: RootState) => state.user.credentials);
	const showToast = useCustomToast();

	// Ottieni la sessione Supabase
	useEffect(() => {
		const fetchSession = async () => {
			const { data } = await supabase.auth.getSession();
			setSupabaseSession(data.session);
		};

		fetchSession();

		// Ascolta i cambiamenti dello stato di autenticazione
		const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
			setSupabaseSession(session);
		});

		return () => {
			authListener.subscription.unsubscribe();
		};
	}, []);

	// Usiamo la sessione Supabase per i componenti che richiedono la tipizzazione Session
	const { likesCount, hasLiked, toggleLike, isLoading: isLikeLoading } = usePostLikes(id, supabaseSession);
	const { commentsCount } = usePostComments(id, supabaseSession);

	const [saveTagsFunc, { error: tagError, loading: tagLoading }] = useTagsSaver();

	useIonViewWillEnter(() => {
		fetchArticle();
	});

	const fetchArticle = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();

			if (error) throw error;

			if (data) {
				setArticle(data);
			} else {
				showToast({
					message: "Articolo non trovato",
					color: "danger",
				});
				history.goBack();
			}
		} catch (error: any) {
			console.error("Errore nel recupero dell'articolo:", error);
			showToast({
				message: error.message || "Errore nel recupero dell'articolo",
				color: "danger",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleLikeClick = async () => {
		try {
			if (!supabaseSession) {
				showToast({
					message: "Devi effettuare l'accesso per mettere mi piace",
					color: "warning",
				});
				return;
			}

			await toggleLike();
		} catch (err) {
			showToast({
				message: "Errore durante l'operazione",
				color: "danger",
			});
		}
	};

	// Funzione per condividere l'articolo
	const handleShareArticle = async () => {
		if (!article) return;

		try {
			// Verifica se la condivisione è disponibile
			const canShare = await ShareService.canShare();

			if (!canShare) {
				setShareToastMessage("La condivisione non è supportata su questo dispositivo");
				setShowShareToast(true);
				return;
			}

			// Usa l'URL originale se disponibile, altrimenti crea un deep link all'articolo nell'app
			const shareUrl = article.url || `azreader://article/${id}`;

			const result = await ShareService.shareArticle(article.title, shareUrl, article.excerpt);

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

	const insertTagHandler = () => {
		console.log('[ViewMessage] insertTagHandler called');
		console.log('[ViewMessage] Current showModal state:', showModal);
		try {
			setShowModal(true);
			console.log('[ViewMessage] setShowModal(true) executed');
		} catch (err) {
			console.error('[ViewMessage] Error in insertTagHandler:', err);
		}
	};

	const dismissTagModalHandler = async (tagsSelected: string[]) => {
		setShowModal(false);
		if (isEmpty(tagsSelected)) return;

		try {
			await saveTagsFunc({
				id,
				tags: tagsSelected,
			});

			if (tagError) {
				showToast({
					message: "Errore durante il salvataggio dei tag",
					color: "danger",
				});
			} else {
				// Update the article in Redux state with the new tags
				if (article) {
					setArticle({ ...article, tags: tagsSelected });
				}

				showToast({
					message: "Tag salvati con successo",
					color: "success",
				});
			}
		} catch (err) {
			showToast({
				message: "Errore durante il salvataggio dei tag",
				color: "danger",
			});
		}
	};

	const renderSearchBar = () => (
		<div className="bg-gray-100 rounded-lg mx-4 my-3">
			<div className="flex items-center px-4 py-2">
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

	const renderModalTags = () => {
		console.log('[ViewMessage] Rendering modal, showModal:', showModal);
		return (
			<IonModal
				isOpen={showModal}
				onDidDismiss={() => {
					console.log('[ViewMessage] Modal dismissed');
					setShowModal(false);
				}}
				breakpoints={[0, 0.5, 0.75]}
				initialBreakpoint={0.75}
				className="bg-white rounded-t-xl"
			>
				<div className="px-4 py-6">
					{renderSearchBar()}
					<div className="mt-4">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
						<ModalTags showModal={showModal} dismissTagModalHandler={dismissTagModalHandler} postId={id} />
					</div>
				</div>
			</IonModal>
		);
	};

	if (isLoading || !article) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonBackButton defaultHref="/home" />
						</IonButtons>
						<IonTitle>Caricamento...</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<div className="flex justify-center items-center h-full">
						<div className="animate-pulse">Caricamento articolo...</div>
					</div>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref="/home" />
					</IonButtons>
					<div className="flex justify-center">
						<IonTitle size="small" className="text-center">
							{article.domain}
						</IonTitle>
					</div>
					<IonButtons slot="end">
						<FontSizeControls />
						<IonButton>
							<IonIcon icon={bookmark} />
						</IonButton>
						<IonButton>
							<IonIcon icon={ellipsisHorizontal} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				<ReadingThemeWrapper>
					<div className="pb-16">
						<article className="mx-auto px-4">
							<h1 className="text-3xl font-bold text-gray-900 mb-3">{article.title}</h1>
							{article.excerpt && <h2 className="text-lg text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: article.excerpt }} />}

							<div className="flex flex-col mb-6 border-t border-b border-gray-200 py-3">
								<div>
									<p className="text-sm text-gray-500 m-0">{renderArticleDatePublished(article.date || article.date_published)}</p>
									{article.savedBy && article.savedOn && (
										<p className="text-xs m-0">
											Salvato da: {article.savedBy.userEmail} il {moment(article.savedOn).format("DD MMMM YYYY")}
										</p>
									)}
									{article.domain && <p className="text-xs text-gray-500 m-0 mt-1">{article.domain}</p>}
								</div>
							</div>

							{article.lead_image_url && (
								<div className="mb-6">
									<img
										src={article.lead_image_url}
										alt={article.title}
										className="w-full rounded-lg shadow-sm object-cover"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.style.display = "none";
										}}
									/>
								</div>
							)}

							<div className="prose max-w-none text-gray-800 mb-12">
								<FontSizeWrapper>
									<div dangerouslySetInnerHTML={{ __html: article.content || article.html || "" }} />
								</FontSizeWrapper>
							</div>
						</article>
					</div>
				</ReadingThemeWrapper>
			</IonContent>

			<IonFooter className="ion-no-border bg-white border-t">
				<div className="grid grid-cols-4 py-2 px-1">
					<div className="flex flex-col items-center justify-center">
						<IonButton fill="clear" size="small" onClick={handleLikeClick} disabled={isLikeLoading}>
							<IonIcon icon={hasLiked ? heart : heartOutline} color={hasLiked ? "danger" : "medium"} size="small" />
						</IonButton>
						<div className="text-xs text-center text-gray-500">{likesCount}</div>
					</div>

					<div className="flex flex-col items-center justify-center">
						<IonButton fill="clear" size="small" onClick={() => setShowComments(true)}>
							<IonIcon icon={chatbubbleOutline} color="medium" size="small" />
						</IonButton>
						<div className="text-xs text-center text-gray-500">{commentsCount}</div>
					</div>

					<div className="flex flex-col items-center justify-center">
						<IonButton fill="clear" size="small" onClick={handleShareArticle}>
							<IonIcon icon={shareOutline} color="medium" size="small" />
						</IonButton>
						<div className="text-xs text-center text-gray-500">Condividi</div>
					</div>

					<div className="flex flex-col items-center justify-center">
						<IonButton
							fill="clear"
							size="small"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								console.log('[ViewMessage] Tags button clicked');
								insertTagHandler();
							}}
						>
							<IonIcon icon={bookmarkOutline} color="medium" size="small" />
						</IonButton>
						<div className="text-xs text-center text-gray-500">Tags</div>
					</div>
				</div>
			</IonFooter>

			{renderModalTags()}
			{/* <Comments postId={id} session={supabaseSession} isOpen={showComments} onClose={() => setShowComments(false)} /> */}
			<Comments
				postId={id}
				session={supabaseSession}
				isOpen={showComments}
				onClose={() => setShowComments(false)}
				articleTitle={article.title || "Articolo"}
			/>

			{/* Toast per i messaggi di condivisione */}
			<IonToast
				isOpen={showShareToast}
				onDidDismiss={() => setShowShareToast(false)}
				message={shareToastMessage}
				duration={2000}
				position="bottom"
				color="medium"
			/>
		</IonPage>
	);
};

export default ViewMessage;
