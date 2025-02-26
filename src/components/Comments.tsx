import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	IonIcon,
	IonSpinner,
	IonContent,
	IonHeader,
	IonToolbar,
	IonButtons,
	IonButton,
	IonFooter,
	useIonModal,
	IonPage,
	IonSegment,
	IonSegmentButton,
	IonLabel,
	IonRefresher,
	IonRefresherContent,
	RefresherEventDetail,
	IonSkeletonText,
	IonRippleEffect,
} from "@ionic/react";
import {
	chevronBack,
	ellipsisHorizontal,
	heartOutline,
	heart,
	chatbubbleOutline,
	closeOutline,
	send,
	thumbsUp,
	thumbsUpOutline,
	timeOutline,
	lockClosedOutline,
	flagOutline,
	shareOutline,
	trashOutline,
	imageOutline,
	happyOutline,
} from "ionicons/icons";
import { Session } from "@supabase/supabase-js";
import { usePostComments, Comment } from "@hooks/usePostComments";
import { useCustomToast } from "@hooks/useIonToast";
import { useSelector } from "react-redux";
import { RootState } from "@store/reducers";

interface CommentsProps {
	postId: string;
	session: Session | null;
	isOpen: boolean;
	onClose: () => void;
}

// Interfaccia per commento con risposte
interface CommentWithReplies extends Comment {
	replies: CommentWithReplies[];
}

// Colori personalizzati e gradients per gli avatar
const AVATAR_GRADIENTS = [
	"from-violet-500 to-purple-500",
	"from-blue-500 to-cyan-400",
	"from-emerald-500 to-teal-400",
	"from-orange-500 to-amber-400",
	"from-pink-500 to-rose-400",
	"from-indigo-500 to-blue-400",
];

// Funzione per generare un gradiente casuale ma deterministico in base all'email
const getGradientForEmail = (email: string | null | undefined): string => {
	if (!email) return AVATAR_GRADIENTS[0] || ''; // Default gradient per email mancante

	let sum = 0;
	for (let i = 0; i < email.length; i++) {
		sum += email.charCodeAt(i);
	}
	const index = sum % AVATAR_GRADIENTS.length;
	return AVATAR_GRADIENTS[index] || '';
};

const Avatar: React.FC<{
	email: string | null | undefined;
	size?: "xs" | "sm" | "md" | "lg";
	showStatus?: boolean;
}> = ({ email, size = "md", showStatus = false }) => {
	const { initials } = getAuthorInfo(email);
	const gradient = getGradientForEmail(email);

	const sizeClasses = {
		xs: "w-6 h-6 text-xs",
		sm: "w-8 h-8 text-sm",
		md: "w-10 h-10 text-base",
		lg: "w-12 h-12 text-lg",
	};

	return (
		<div className="relative">
			<div
				className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-medium shadow-sm`}
			>
				{initials}
			</div>
			{showStatus && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
		</div>
	);
};

interface CommentItemProps {
	comment: CommentWithReplies;
	toggleLike: (id: string) => void;
	likedComments: Set<string>;
	startReply: (id: string, author: string) => void;
	handleDelete: (id: string) => void;
	level?: number;
	isCurrentUser?: boolean;
	session: Session | null;
}

const CommentItem: React.FC<CommentItemProps> = ({
	comment,
	toggleLike,
	likedComments,
	startReply,
	handleDelete,
	level = 0,
	isCurrentUser = false,
	session,
}) => {
	const { authorName, initials } = getAuthorInfo(comment.profiles?.email);
	const isLiked = likedComments.has(comment.id);
	const timeAgo = getTimeAgo(comment.created_at);
	const likeCount = Math.floor(Math.random() * 15) + (isLiked ? 1 : 0);
	const [showOptions, setShowOptions] = useState(false);

	// Verifica se il commento è dell'utente corrente
	const isOwnComment = session?.user?.id === comment.user_id;

	return (
		<div className={`relative ${level > 0 ? "ml-8 pl-4 border-l-2 border-gray-100" : ""}`}>
			<div className={`py-3 px-4 ${level === 0 ? "border-b border-gray-100" : "mt-2"}`}>
				<div className="flex items-start gap-3">
					<Avatar email={comment.profiles?.email} showStatus={Math.random() > 0.7} />

					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between mb-1">
							<div className="flex items-center">
								<h4 className="font-semibold text-gray-900 mr-2">{authorName}</h4>
								{isOwnComment && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Tu</span>}
							</div>

							<button className="p-1 text-gray-400 hover:text-gray-600" onClick={() => setShowOptions(!showOptions)}>
								<IonIcon icon={ellipsisHorizontal} />
							</button>
						</div>

						<p className="text-gray-800 text-sm mb-2">{comment.comment}</p>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<button
									className={`flex items-center text-xs ${
										isLiked ? "text-blue-500" : "text-gray-500"
									} transition-colors duration-200`}
									onClick={() => toggleLike(comment.id)}
								>
									<IonIcon icon={isLiked ? thumbsUp : thumbsUpOutline} className="mr-1" />
									<span>{likeCount > 0 ? likeCount : ""}</span>
								</button>

								<button
									className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
									onClick={() => startReply(comment.id, authorName)}
								>
									<IonIcon icon={chatbubbleOutline} className="mr-1" />
									<span>Rispondi</span>
								</button>
							</div>

							<div className="text-xs text-gray-400 flex items-center">
								<IonIcon icon={timeOutline} className="mr-1 text-xs" />
								{timeAgo}
							</div>
						</div>
					</div>
				</div>

				{/* Menu opzioni */}
				{showOptions && (
					<div className="absolute right-4 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-1 text-sm">
						{isOwnComment && (
							<button
								className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-50 flex items-center"
								onClick={() => {
									handleDelete(comment.id);
									setShowOptions(false);
								}}
							>
								<IonIcon icon={trashOutline} className="mr-2" />
								Elimina
							</button>
						)}
						<button
							className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
							onClick={() => setShowOptions(false)}
						>
							<IonIcon icon={flagOutline} className="mr-2" />
							Segnala
						</button>
						<button
							className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
							onClick={() => setShowOptions(false)}
						>
							<IonIcon icon={shareOutline} className="mr-2" />
							Condividi
						</button>
					</div>
				)}
			</div>

			{/* Commenti annidati */}
			{comment.replies?.length > 0 && (
				<div className="space-y-1">
					{comment.replies.map((reply) => (
						<CommentItem
							key={reply.id}
							comment={reply}
							toggleLike={toggleLike}
							likedComments={likedComments}
							startReply={startReply}
							handleDelete={handleDelete}
							level={level + 1}
							session={session}
							isCurrentUser={session?.user?.id === reply.user_id}
						/>
					))}
				</div>
			)}
		</div>
	);
};

// Componente per loading skeleton
const CommentSkeleton: React.FC = () => (
	<div className="p-4 border-b border-gray-100">
		<div className="flex items-start gap-3">
			<div className="w-10 h-10 rounded-full bg-gray-200"></div>
			<div className="flex-1">
				<div className="flex justify-between items-center mb-2">
					<IonSkeletonText animated style={{ width: "30%", height: "14px" }}></IonSkeletonText>
					<IonSkeletonText animated style={{ width: "10%", height: "14px" }}></IonSkeletonText>
				</div>
				<IonSkeletonText animated style={{ width: "90%", height: "16px" }}></IonSkeletonText>
				<IonSkeletonText animated style={{ width: "95%", height: "16px" }}></IonSkeletonText>
				<div className="flex justify-between mt-2">
					<IonSkeletonText animated style={{ width: "20%", height: "12px" }}></IonSkeletonText>
					<IonSkeletonText animated style={{ width: "15%", height: "12px" }}></IonSkeletonText>
				</div>
			</div>
		</div>
	</div>
);

// Componente per quando non ci sono commenti
const NoComments: React.FC<{ session: Session | null }> = ({ session }) => (
	<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
		<div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
			<IonIcon icon={chatbubbleOutline} className="text-gray-400 text-4xl" />
		</div>
		<h3 className="text-lg font-medium text-gray-800 mb-2">Nessun commento</h3>
		<p className="text-gray-500 mb-6 max-w-xs">
			{session
				? "Sii il primo a commentare questo articolo e inizia la conversazione!"
				: "Accedi per essere il primo a commentare questo articolo."}
		</p>
		{!session && (
			<button className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium shadow-sm hover:bg-blue-600 transition-colors">
				Accedi per commentare
			</button>
		)}
	</div>
);

// Componente per il modale dei commenti
const CommentsModalContent: React.FC<{
	postId: string;
	session: Session | null;
	onDismiss: () => void;
}> = ({ postId, session, onDismiss }) => {
	const [newComment, setNewComment] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
	const [replyingTo, setReplyingTo] = useState<string | null>(null);
	const [replyingToAuthor, setReplyingToAuthor] = useState<string>("");
	const [activeSegment, setActiveSegment] = useState<"tutti" | "popolari">("tutti");
	const [isCommenting, setIsCommenting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const contentRef = useRef<HTMLIonContentElement>(null);
	const showToast = useCustomToast();

	// Prendiamo l'email dallo store Redux
	const userState = useSelector((state: RootState) => state.user);
	const userEmail = userState.credentials?.email || "";

	const { comments, organizedComments, commentsCount, isLoading, error, addNewComment, deleteExistingComment, refreshComments } = usePostComments(
		postId,
		session
	);

	const commentsSorted = useCallback(() => {
		if (activeSegment === "popolari") {
			// Ordina per numero di like (simulato qui)
			return [...organizedComments].sort((a, b) => Math.floor(Math.random() * 20) - Math.floor(Math.random() * 20));
		}
		return organizedComments;
	}, [organizedComments, activeSegment]);

	// Gestione like
	const toggleLike = (commentId: string) => {
		setLikedComments((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(commentId)) {
				newSet.delete(commentId);
			} else {
				newSet.add(commentId);
			}
			return newSet;
		});
	};

	// Gestione risposta
	const startReply = (commentId: string, author: string) => {
		setReplyingTo(commentId);
		setReplyingToAuthor(author || "utente");
		setIsCommenting(true);
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	const cancelReply = () => {
		setReplyingTo(null);
		setReplyingToAuthor("");
	};

	// Aggiornamento tramite pull-to-refresh
	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		await refreshComments();
		event.detail.complete();
	};

	// Invio commento
	const sendComment = async () => {
		if (!newComment.trim() || isSending) return;

		if (!session) {
			showToast({
				message: "Devi effettuare l'accesso per commentare",
				color: "warning",
			});
			return;
		}

		setIsSending(true);
		try {
			await addNewComment(newComment, replyingTo || undefined);
			setNewComment("");
			setReplyingTo(null);
			setReplyingToAuthor("");
			setIsCommenting(false);

			// Scroll to bottom after adding comment
			setTimeout(() => {
				contentRef.current?.scrollToBottom(300);
			}, 300);

			showToast({
				message: "Commento aggiunto con successo",
				color: "success",
				duration: 2000,
			});
		} catch (err) {
			showToast({
				message: "Errore nell'aggiunta del commento",
				color: "danger",
			});
		} finally {
			setIsSending(false);
		}
	};

	// Funzione per eliminare un commento
	const handleDelete = async (commentId: string) => {
		if (!session) return;

		try {
			await deleteExistingComment(commentId);
			showToast({
				message: "Commento eliminato con successo",
				color: "success",
				duration: 2000,
			});
		} catch (err) {
			showToast({
				message: "Errore nell'eliminazione del commento",
				color: "danger",
			});
		}
	};

	const toggleCommentingMode = () => {
		setIsCommenting(!isCommenting);
		if (!isCommenting) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		} else {
			setNewComment("");
			setReplyingTo(null);
			setReplyingToAuthor("");
		}
	};

	return (
		<IonPage>
			<IonHeader className="ion-no-border">
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={onDismiss}>
							<IonIcon icon={chevronBack} />
						</IonButton>
					</IonButtons>
					<div className="text-center font-semibold text-gray-900">Commenti ({commentsCount})</div>
					{!isCommenting && (
						<IonButtons slot="end">
							<IonButton onClick={toggleCommentingMode}>
								<IonIcon icon={chatbubbleOutline} className="text-gray-600" />
							</IonButton>
						</IonButtons>
					)}
				</IonToolbar>

				{/* Segmenti per filtrare i commenti */}
				<IonToolbar className="px-2">
					<IonSegment
						value={activeSegment}
						onIonChange={(e) => setActiveSegment(e.detail.value as "tutti" | "popolari")}
						className="rounded-lg h-10 custom-segment"
					>
						<IonSegmentButton value="tutti" className="text-sm h-10">
							<IonLabel>Tutti i commenti</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="popolari" className="text-sm h-10">
							<IonLabel>Più popolari</IonLabel>
						</IonSegmentButton>
					</IonSegment>
				</IonToolbar>
			</IonHeader>

			<IonContent ref={contentRef} className="bg-white ion-padding-bottom">
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>

				{isLoading ? (
					<div className="space-y-1">
						{[...Array(5)].map((_, i) => (
							<CommentSkeleton key={i} />
						))}
					</div>
				) : comments.length === 0 ? (
					<NoComments session={session} />
				) : (
					<div className="pb-24">
						{commentsSorted().map((comment) => (
							<CommentItem
								key={comment.id}
								comment={comment}
								toggleLike={toggleLike}
								likedComments={likedComments}
								startReply={startReply}
								handleDelete={handleDelete}
								session={session}
								isCurrentUser={session?.user?.id === comment.user_id}
							/>
						))}
					</div>
				)}
			</IonContent>

			{/* Footer per la modalità commento e risposta */}
			{(isCommenting || replyingTo) && (
				<IonFooter className="ion-no-border shadow-lg">
					{replyingTo && (
						<div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
							<div className="text-sm text-gray-600 flex items-center">
								<span>Rispondi a </span>
								<span className="font-medium ml-1 text-blue-600">{replyingToAuthor}</span>
							</div>
							<button className="p-1 rounded-full bg-gray-200 h-6 w-6 flex items-center justify-center" onClick={cancelReply}>
								<IonIcon icon={closeOutline} className="text-gray-600 text-xs" />
							</button>
						</div>
					)}

					<div className="bg-white px-4 py-3">
						<div className="flex items-center gap-2">
							<Avatar email={userEmail} size="sm" />

							<div className="flex-1 bg-gray-100 rounded-full flex items-center overflow-hidden pr-2">
								<input
									ref={inputRef}
									type="text"
									value={newComment}
									onChange={(e) => setNewComment(e.target.value)}
									placeholder={replyingTo ? "Scrivi una risposta..." : "Aggiungi un commento..."}
									className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-gray-700"
								/>

								{newComment.trim() && (
									<button
										className={`w-8 h-8 rounded-full flex items-center justify-center ${
											isSending ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700 ion-activatable overflow-hidden"
										}`}
										onClick={sendComment}
										disabled={isSending}
									>
										{isSending ? (
											<IonSpinner name="dots" className="h-4 w-4" />
										) : (
											<>
												<IonIcon icon={send} className="text-white text-sm" />
												<IonRippleEffect />
											</>
										)}
									</button>
								)}
							</div>

							{!newComment.trim() && (
								<div className="flex gap-1">
									<button className="text-gray-500 p-2">
										<IonIcon icon={imageOutline} />
									</button>
									<button className="text-gray-500 p-2">
										<IonIcon icon={happyOutline} />
									</button>
								</div>
							)}
						</div>

						{isCommenting && !replyingTo && (
							<div className="flex justify-between items-center mt-2 px-2">
								<div className="text-xs text-gray-500 flex items-center">
									<IonIcon icon={lockClosedOutline} className="mr-1" />I commenti sono moderati
								</div>

								<button className="text-xs text-blue-600" onClick={toggleCommentingMode}>
									Annulla
								</button>
							</div>
						)}
					</div>
				</IonFooter>
			)}

			{/* FAB per aggiungere commento quando non è attiva la modalità commento */}
			{!isCommenting && !replyingTo && session && (
				<div className="fixed bottom-6 right-6 z-10">
					<button
						onClick={toggleCommentingMode}
						className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center ion-activatable overflow-hidden"
					>
						<IonIcon icon={chatbubbleOutline} className="text-xl" />
						<IonRippleEffect />
					</button>
				</div>
			)}
		</IonPage>
	);
};

// Utility functions
const getTimeAgo = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "ora";
	if (diffMins < 60) return `${diffMins} min fa`;
	if (diffHours < 24) return `${diffHours} ore fa`;
	if (diffDays < 7) return `${diffDays} g fa`;

	// Formatta data per date più vecchie
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
};

const getAuthorInfo = (email: string | null | undefined) => {
	const safeEmail = email || "";
	let userName = "User";

	if (safeEmail.includes("@")) {
		const parts = safeEmail.split("@");
		if (parts.length > 0 && parts[0]) {
			userName = parts[0];
		}
	}

	let initials = "??";
	if (userName.length >= 2) {
		const firstChar = userName.charAt(0);
		const secondChar = userName.charAt(1);
		initials = (firstChar + secondChar).toUpperCase();
	} else if (userName.length === 1) {
		initials = userName.charAt(0).toUpperCase();
	}

	return { authorName: userName, initials };
};

const Comments: React.FC<CommentsProps> = ({ postId, session, isOpen, onClose }) => {
	const [presentModal, dismissModal] = useIonModal(CommentsModalContent, {
		postId,
		session,
		onDismiss: () => {
			dismissModal();
			onClose();
		},
	});

	useEffect(() => {
		if (isOpen) {
			presentModal({
				presentingElement: document.querySelector("ion-app") as HTMLElement,
				canDismiss: true,
				backdropDismiss: true,
				initialBreakpoint: 1,
				breakpoints: [0, 1],
			});
		} else {
			dismissModal();
		}
	}, [isOpen, presentModal, dismissModal, onClose]);

	return null;
};

// Aggiungi CSS personalizzato per i componenti
document.head.insertAdjacentHTML(
	"beforeend",
	`<style>
    /* Custom segment styling */
    .custom-segment {
      --background: #f3f4f6;
      --background-checked: #ffffff;
      --color: #6b7280;
      --color-checked: #000000;
      --indicator-color: #ffffff;
      --indicator-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      --border-radius: 8px;
      padding: 2px;
    }
    
    /* Smooth transitions */
    ion-segment-button {
      transition: all 0.3s ease;
    }
    
    /* Custom scrollbar */
    ion-content::part(scroll) {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }
    
    ion-content::part(scroll)::-webkit-scrollbar {
      width: 6px;
    }
    
    ion-content::part(scroll)::-webkit-scrollbar-track {
      background: transparent;
    }
    
    ion-content::part(scroll)::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 3px;
    }
  </style>`
);

export default Comments;
