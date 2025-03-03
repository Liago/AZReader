import React, { useState, useRef, useEffect } from "react";
import {
	IonIcon,
	IonSpinner,
	IonContent,
	IonHeader,
	IonToolbar,
	IonButtons,
	IonButton,
	IonFooter,
	IonSkeletonText,
	IonModal,
	IonTitle,
	IonBackdrop,
} from "@ionic/react";
import {
	chevronBack,
	ellipsisHorizontal,
	chatbubbleOutline,
	closeOutline,
	send,
	flagOutline,
	shareOutline,
	trashOutline,
} from "ionicons/icons";
import { Session } from "@supabase/supabase-js";
import { usePostComments, Comment } from "@hooks/usePostComments";
import { useCustomToast } from "@hooks/useIonToast";
import { useSelector } from "react-redux";
import { RootState } from "@store/reducers";
import moment from "moment";

interface CommentsProps {
	postId: string;
	session: Session | null;
	isOpen: boolean;
	onClose: () => void;
	articleTitle?: string;
}

// Interfaccia per commento con risposte
interface CommentWithReplies extends Comment {
	replies: CommentWithReplies[];
}

// Colori personalizzati per gli avatar
const AVATAR_COLORS = [
	"bg-gradient-to-br from-pink-500 to-rose-500",
	"bg-gradient-to-br from-blue-500 to-indigo-600",
	"bg-gradient-to-br from-amber-400 to-orange-500",
	"bg-gradient-to-br from-emerald-400 to-teal-500",
	"bg-gradient-to-br from-violet-500 to-purple-600",
	"bg-gradient-to-br from-red-500 to-pink-600",
];

// Funzione per generare un colore casuale ma deterministico in base all'email
const getAvatarColorForEmail = (email: string | null | undefined): string => {
	if (!email) return AVATAR_COLORS[0] || '';

	let sum = 0;
	for (let i = 0; i < email.length; i++) {
		sum += email.charCodeAt(i);
	}
	const index = sum % AVATAR_COLORS.length;
	return AVATAR_COLORS[index] || '';
};

const Avatar: React.FC<{
	email: string | null | undefined;
	size?: "xs" | "sm" | "md" | "lg";
	className?: string;
}> = ({ email, size = "md", className = "" }) => {
	const { initials } = getAuthorInfo(email);
	const bgColor = getAvatarColorForEmail(email);

	const sizeClasses = {
		xs: "w-6 h-6 text-xs",
		sm: "w-8 h-8 text-sm",
		md: "w-10 h-10 text-base",
		lg: "w-12 h-12 text-lg",
	};

	return (
		<div
			className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold shadow-md ${className}`}
		>
			{initials}
		</div>
	);
};

interface CommentItemProps {
	comment: CommentWithReplies;
	startReply: (id: string, author: string) => void;
	handleDelete: (id: string) => void;
	level?: number;
	session: Session | null;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, startReply, handleDelete, level = 0, session }) => {
	const { authorName } = getAuthorInfo(comment.profiles?.email);
	const timeAgo = getTimeAgo(comment.created_at);
	const [showOptions, setShowOptions] = useState(false);

	// Verifica se il commento è dell'utente corrente
	const isOwnComment = session?.user?.id === comment.user_id;

	return (
		<div className={`${level > 0 ? "pl-4 ml-1 relative" : ""} mb-4`}>
			{level > 0 && <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200 rounded-full"></div>}

			<div className="rounded-xl bg-gray-100 p-4 overflow-hidden">
				{/* Header del commento */}
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center">
						<Avatar email={comment.profiles?.email} size="sm" className="mr-2" />
						<span className="font-medium text-gray-800">{authorName}</span>
						{isOwnComment && (
							<span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Tu</span>
						)}
					</div>
					<span className="text-xs text-gray-500">{timeAgo}</span>
				</div>

				{/* Contenuto del commento */}
				<div className="text-gray-800 text-sm mb-3">{comment.comment}</div>

				{/* Reazioni e interazioni */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{/* Reply Button */}
						<button
							className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center"
							onClick={() => startReply(comment.id, authorName)}
						>
							<IonIcon icon={chatbubbleOutline} className="mr-1 w-4 h-4" />
							<span>Rispondi</span>
						</button>
					</div>

					<div className="flex items-center">
						{/* Options Menu */}
						<button 
							className="p-1 rounded-full hover:bg-gray-200 transition-colors"
							onClick={() => setShowOptions(!showOptions)}
						>
							<IonIcon icon={ellipsisHorizontal} className="w-5 h-5 text-gray-600" />
						</button>
					</div>
				</div>
			</div>

			{/* Risposta ai commenti */}
			{comment.replies?.length > 0 && (
				<div className="mt-3">
					{comment.replies.map((reply) => (
						<CommentItem
							key={reply.id}
							comment={reply}
							startReply={startReply}
							handleDelete={handleDelete}
							level={level + 1}
							session={session}
						/>
					))}
				</div>
			)}

			{/* Menu opzioni */}
			{showOptions && (
				<>
					<IonBackdrop visible={true} tappable={true} stopPropagation={true} onClick={() => setShowOptions(false)} />
					<div className="absolute right-4 mt-2 w-48 bg-white rounded-xl shadow-xl z-10 py-1 overflow-hidden">
						{isOwnComment && (
							<button
								className="w-full px-4 py-3 text-left text-red-500 hover:bg-gray-50 flex items-center font-medium"
								onClick={() => {
									handleDelete(comment.id);
									setShowOptions(false);
								}}
							>
								<IonIcon icon={trashOutline} className="mr-3 text-lg" />
								<span>Elimina</span>
							</button>
						)}
						<button
							className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center font-medium"
							onClick={() => setShowOptions(false)}
						>
							<IonIcon icon={flagOutline} className="mr-3 text-lg" />
							<span>Segnala</span>
						</button>
						<button
							className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center font-medium"
							onClick={() => setShowOptions(false)}
						>
							<IonIcon icon={shareOutline} className="mr-3 text-lg" />
							<span>Condividi</span>
						</button>
					</div>
				</>
			)}
		</div>
	);
};

// Componente per loading skeleton
const CommentSkeleton: React.FC = () => (
	<div className="p-4 flex items-start gap-3 animate-pulse">
		<div className="w-10 h-10 rounded-full bg-gray-200"></div>
		<div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
			<div className="flex justify-between items-center mb-3">
				<IonSkeletonText animated style={{ width: "30%", height: "14px", borderRadius: "4px" }}></IonSkeletonText>
				<IonSkeletonText animated style={{ width: "10%", height: "14px", borderRadius: "4px" }}></IonSkeletonText>
			</div>
			<IonSkeletonText animated style={{ width: "100%", height: "16px", borderRadius: "4px" }}></IonSkeletonText>
			<IonSkeletonText animated style={{ width: "90%", height: "16px", borderRadius: "4px", marginTop: "4px" }}></IonSkeletonText>
			<div className="mt-3">
				<IonSkeletonText animated style={{ width: "20%", height: "12px", borderRadius: "4px" }}></IonSkeletonText>
			</div>
		</div>
	</div>
);

// Componente per quando non ci sono commenti
const NoComments: React.FC<{ session: Session | null }> = ({ session }) => (
	<div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-xl my-4">
		<div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
			<IonIcon icon={chatbubbleOutline} className="text-gray-400 text-3xl" />
		</div>
		<h3 className="text-lg font-bold text-gray-800 mb-2">Nessun commento</h3>
		<p className="text-gray-600 mb-6 max-w-xs">
			{session
				? "Sii il primo a commentare questo articolo e inizia la conversazione!"
				: "Accedi per essere il primo a commentare questo articolo."}
		</p>
		{!session && (
			<button className="bg-gray-800 text-white px-5 py-2 rounded-full font-medium shadow-md hover:bg-gray-700 transition-colors">
				Accedi per commentare
			</button>
		)}
	</div>
);

// Componente per il contenuto dei commenti
const CommentsContent: React.FC<{
	postId: string;
	session: Session | null;
	onDismiss: () => void;
	articleTitle?: string;
}> = ({ postId, session, onDismiss, articleTitle }) => {
	const [newComment, setNewComment] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [replyingTo, setReplyingTo] = useState<string | null>(null);
	const [replyingToAuthor, setReplyingToAuthor] = useState<string>("");
	const [isCommenting, setIsCommenting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const contentRef = useRef<HTMLIonContentElement>(null);
	const showToast = useCustomToast();
	// Prendiamo le credenziali utente dallo store Redux
	const userState = useSelector((state: RootState) => state.user);
	const userEmail = userState.credentials?.email || "";

	const { comments, organizedComments, commentsCount, isLoading, addNewComment, deleteExistingComment } = usePostComments(postId, session);

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
			// Utilizziamo l'email dell'utente dallo stato Redux
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

	// Aggiungiamo un console.log per debug
	useEffect(() => {
		console.log("Comments component articleTitle:", articleTitle);
	}, [articleTitle]);

	return (
		<>
			<IonHeader className="border-b border-gray-200">
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={onDismiss}>
							<IonIcon icon={chevronBack} slot="icon-only" />
						</IonButton>
					</IonButtons>
					<IonTitle className="text-center font-medium text-lg">
						Commenti {commentsCount > 0 && `(${commentsCount})`}
					</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onDismiss}>
							<IonIcon icon={closeOutline} slot="icon-only" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent ref={contentRef} className="ion-padding">
				{isLoading ? (
					// Loading skeletons
					<div>
						<CommentSkeleton />
						<CommentSkeleton />
						<CommentSkeleton />
					</div>
				) : commentsCount === 0 ? (
					// No comments
					<NoComments session={session} />
				) : (
					// Comments list
					<div className="py-2">
						{/* Informazioni sull'articolo */}
						{articleTitle && articleTitle.length > 0 ? (
							<div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg mb-4">
								<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
									<IonIcon icon={chatbubbleOutline} className="w-5 h-5 text-gray-400" />
								</div>
								<div>
									<h3 className="font-medium text-gray-800 line-clamp-1">{articleTitle}</h3>
									<p className="text-xs text-gray-500">Pubblicato il {moment().format("DD MMM YYYY")}</p>
								</div>
							</div>
						) : null}
            
						{/* Comments list */}
						{organizedComments.map((comment) => (
							<CommentItem
								key={comment.id}
								comment={comment}
								startReply={startReply}
								handleDelete={handleDelete}
								session={session}
							/>
						))}
					</div>
				)}
			</IonContent>

			{/* Footer con input per commenti */}
			<IonFooter className="border-t border-gray-200">
				<div className="p-2 bg-white">
					{isCommenting ? (
						<div className="bg-gray-50 rounded-xl p-3">
							{replyingTo && (
								<div className="flex justify-between items-center mb-2 bg-blue-50 p-2 rounded-lg">
									<p className="text-sm text-blue-600">
										Rispondendo a <span className="font-semibold">{replyingToAuthor}</span>
									</p>
									<button onClick={cancelReply} className="text-gray-400 hover:text-gray-600">
										<IonIcon icon={closeOutline} className="w-5 h-5" />
									</button>
								</div>
							)}
							<div className="flex items-end gap-2">
								<Avatar email={userEmail} size="sm" />
								<div className="flex-1 bg-white border border-gray-300 rounded-2xl overflow-hidden flex items-end">
									<input
										ref={inputRef}
										type="text"
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
										placeholder={replyingTo ? `Rispondi a ${replyingToAuthor}...` : "Aggiungi un commento..."}
										className="flex-1 px-3 py-2 outline-none text-sm"
									/>
									<button
										onClick={sendComment}
										disabled={isSending || !newComment.trim()}
										className={`px-3 py-2 flex items-center justify-center ${
											isSending || !newComment.trim() ? "text-gray-400" : "text-blue-500 hover:text-blue-600"
										}`}
									>
										{isSending ? <IonSpinner name="dots" /> : <IonIcon icon={send} className="w-5 h-5" />}
									</button>
								</div>
							</div>
						</div>
					) : (
						<button
							onClick={() => setIsCommenting(true)}
							className="w-full flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-full p-3 transition-colors"
						>
							<Avatar email={userEmail} size="xs" />
							<span className="text-gray-500 text-sm">Aggiungi un commento...</span>
						</button>
					)}
				</div>
			</IonFooter>
		</>
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

const Comments: React.FC<CommentsProps> = ({ 
	postId, 
	session, 
	isOpen, 
	onClose, 
	articleTitle = "Articolo" // Valore di default
}) => {
	return (
		<IonModal isOpen={isOpen} onDidDismiss={onClose} className="comments-modal">
			<CommentsContent postId={postId} session={session} onDismiss={onClose} articleTitle={articleTitle} />
		</IonModal>
	);
};

export default Comments;
